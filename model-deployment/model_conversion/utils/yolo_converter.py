import inspect
import shutil
from pathlib import Path
from typing import Final

import onnx
import torch
import yaml
from ultralytics import YOLO
from ultralytics.engine.exporter import Exporter, arange_patch, try_export
from ultralytics.nn.modules import Attention, Detect
from ultralytics.utils import LOGGER, colorstr
from ultralytics.utils.checks import check_requirements
from ultralytics.utils.torch_utils import get_latest_opset


class EspDetect(Detect):
    def forward(self, x):
        """Returns predicted bounding boxes and class probabilities respectively."""
        # self.nl = 3
        box0 = self.cv2[0](x[0])
        score0 = self.cv3[0](x[0])

        box1 = self.cv2[1](x[1])
        score1 = self.cv3[1](x[1])

        box2 = self.cv2[2](x[2])
        score2 = self.cv3[2](x[2])

        return box0, score0, box1, score1, box2, score2


class EspAttention(Attention):
    def forward(self, x):
        """
        Forward pass of the Attention module.

        Args:
            x (torch.Tensor): The input tensor.

        Returns:
            (torch.Tensor): The output tensor after self-attention.
        """
        B, C, H, W = x.shape
        N = H * W
        qkv = self.qkv(x)
        q, k, v = qkv.view(-1, self.num_heads, self.key_dim * 2 + self.head_dim, N).split(
            [self.key_dim, self.key_dim, self.head_dim], dim=2
        )
        attn = (q.transpose(-2, -1) @ k) * self.scale
        attn = attn.softmax(dim=-1)
        x = (v @ attn.transpose(-2, -1)).view(-1, C, H, W) + self.pe(v.reshape(-1, C, H, W))
        x = self.proj(x)
        return x


class EspDetectExporter(Exporter):
    """
    adapted from ultralytics for detection task
    """

    @try_export
    def export_onnx(self, prefix=colorstr("ONNX:")):
        """YOLO ONNX export."""
        requirements = ["onnx>=1.14.0"]  # from esp-ppq requirments.txt
        # since onnxslim will cause NCHW -> 1(N*C)HW in yolo11, we replace onnxslim with onnxsim
        if self.args.simplify:
            requirements += [
                "onnxsim",
                "onnxruntime" + ("-gpu" if torch.cuda.is_available() else ""),
            ]
        check_requirements(requirements)

        opset_version = self.args.opset or get_latest_opset()
        LOGGER.info(f"\n{prefix} starting export with onnx {onnx.__version__} opset {opset_version}...")
        f = str(self.file.with_suffix(".onnx"))
        output_names = ["box0", "score0", "box1", "score1", "box2", "score2"]
        dynamic = (
            self.args.dynamic
        )  # case 1: deploy model on ESP32, dynamic=False; case 2: QAT gt onnx for inference, dynamic=True
        if dynamic:
            dynamic = {"images": {0: "batch"}}
            for name in output_names:
                dynamic[name] = {0: "batch"}

        with arange_patch(self.args):
            torch.onnx.export(
                self.model,
                self.im,
                f,
                verbose=False,
                opset_version=opset_version,
                do_constant_folding=False,
                input_names=["images"],
                output_names=output_names,
                dynamic_axes=dynamic or None,
            )
        # Checks
        model_onnx = onnx.load(f)  # load onnx model

        # Simplify
        if self.args.simplify:
            try:
                import onnxsim

                LOGGER.info(f"{prefix} simplifying with onnxsim {onnxsim.__version__}...")
                model_onnx, _ = onnxsim.simplify(model_onnx)

            except Exception as e:
                LOGGER.warning(f"{prefix} simplifier failure: {e}")

        # Metadata
        for k, v in self.metadata.items():
            meta = model_onnx.metadata_props.add()
            meta.key, meta.value = k, str(v)

        onnx.save(model_onnx, f)
        return f, model_onnx


class EspYOLO(YOLO):
    def export(
        self,
        **kwargs,
    ):
        self._check_is_pytorch_model()
        custom = {
            "imgsz": self.model.args["imgsz"],
            "batch": 1,
            "data": None,
            "device": None,
            "verbose": False,
        }
        args = {**self.overrides, **custom, **kwargs, "mode": "export"}
        return EspDetectExporter(overrides=args, _callbacks=self.callbacks)(model=self.model)


class YoloConverter:
    """Convert to export Ultralytics YOLO models to ONNX"""

    def __init__(
        self,
        half: bool,
        dynamic: bool,
        simplify: bool,
        opset: int,
        nms: bool,
        batch: int,
        device: str,
        imgsz: int | tuple[int, int] = 640,
    ) -> None:
        self._format: Final[str] = "onnx"
        self.imgsz = imgsz
        self.device = device
        self.half = half
        self.dynamic = dynamic
        self.simplify = simplify
        self.opset = opset
        self.nms = nms
        self.batch = batch

        # create export config from user-set parameters
        init_params = inspect.signature(self.__init__).parameters  # type: ignore
        export_keys = [k for k in init_params if k != "self"]

        self.export_config = {k: getattr(self, k) for k in export_keys if getattr(self, k) is not None}

    def to_onnx(self, torch_model_path: Path, onnx_export_path: Path) -> None:
        """
        Exports an Ultralytics YOLO model to ONNX format

        :param torch_model_path: Import path to .pt model file
        :param onnx_export_path: Path to export directory
        """
        if not torch_model_path.exists():
            raise FileNotFoundError(f"No such file: {torch_model_path.as_posix()}")
        if not torch_model_path.is_file():
            raise ValueError(f"{torch_model_path.as_posix()} is not a file")
        if torch_model_path.suffix != ".pt":
            raise ValueError(f"Expected torch model (.pt), received {torch_model_path.suffix}")
        if not onnx_export_path.is_dir():
            raise NotADirectoryError(f"{onnx_export_path.as_posix()} is not a directory")

        # load .pt model from path
        model = EspYOLO(torch_model_path.as_posix())
        for module in model.modules():
            if isinstance(module, Attention):
                module.forward = EspAttention.forward.__get__(module)
            if isinstance(module, Detect):
                module.forward = EspDetect.forward.__get__(module)

        # export YOLO model from export config
        export_path = Path(model.export(**self.export_config, format=self._format))

        destination_file = onnx_export_path / export_path.name # overwriting behavior is intended

        # move .onnx model to provided export path
        shutil.move(str(export_path), str(destination_file))

    @classmethod
    def from_config(cls, yml_config: Path | str) -> "YoloConverter":
        """
        Initialize YoloConverter instance from YAML config.

        :param yml_config: Path to YAML config file
        """
        if isinstance(yml_config, str):
            yml_config = Path(yml_config)
        if not isinstance(yml_config, Path):
            raise ValueError("Invalid type for yml_config, expected Path or str")

        with yml_config.open("r") as f:
            config = yaml.safe_load(f)

        return cls(**config)
