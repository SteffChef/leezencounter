from pathlib import Path
from typing import Literal, Optional

import click
from yolo_converter import YoloConverter

from model_conversion.onnx_converter import OnnxQuantizer


def validate_path_exists(ctx, param, value):
    """Validate that the input path exists"""
    if value is None:
        return value
    path = Path(value)
    if not path.exists():
        raise click.BadParameter(f"Path does not exist: {value}")
    return path


def validate_output_dir(ctx, param, value):
    """Validate that the output directory exists or create it"""
    if value is None:
        return value
    path = Path(value)
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)
        click.echo(f"Created output directory: {path}")
    elif not path.is_dir():
        raise click.BadParameter(f"Output path is not a directory: {value}")
    return path


def parse_imgsz(ctx, param, value):
    """Parse image size parameter - can be int or tuple"""
    if value is None:
        return 640  # default

    if "," in value or "x" in value:
        # Handle tuple format like "640,480" or "640x480"
        separator = "," if "," in value else "x"
        try:
            parts = [int(x.strip()) for x in value.split(separator)]
            if len(parts) == 2:
                return tuple(parts)
            else:
                raise click.BadParameter("Image size tuple must have exactly 2 values")
        except ValueError:
            raise click.BadParameter("Invalid image size format. Use single number or 'width,height' or 'widthxheight'")
    else:
        try:
            return int(value)
        except ValueError:
            raise click.BadParameter("Invalid image size. Must be an integer or 'width,height' format")


@click.group()
def cli():
    pass


@cli.command()
@click.argument("model", type=click.Path(exists=True, path_type=Path), callback=validate_path_exists)
@click.argument("output", type=click.Path(path_type=Path), callback=validate_output_dir)
@click.option(
    "--config",
    "-c",
    type=click.Path(exists=True, path_type=Path),
    callback=validate_path_exists,
    help="YAML configuration file to load converter settings from",
)
@click.option(
    "--imgsz",
    default="640",
    callback=parse_imgsz,
    help="Image size for export. Can be single number (640) or tuple (640,480 or 640x480)",
)
@click.option("--half/--no-half", default=False, help="Use FP16 half-precision export")
@click.option("--dynamic/--no-dynamic", default=False, help="Enable dynamic axes for ONNX export")
@click.option("--simplify/--no-simplify", default=True, help="Simplify ONNX model")
@click.option("--opset", type=int, default=13, help="ONNX opset version")
@click.option("--nms/--no-nms", default=False, help="Add NMS module to ONNX model")
@click.option("--batch", type=int, default=1, help="Batch size for export")
@click.option("--device", default="cpu", help="Device to use for export (cpu, cuda, etc.)")
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
def convert_yolo(
    model: Path,
    output: Path,
    config: Optional[Path],
    imgsz,
    half: bool,
    dynamic: bool,
    simplify: bool,
    opset: Optional[int],
    nms: bool,
    batch: int,
    device: str,
    verbose: bool,
):
    """
    Convert Ultralytics YOLO model to ONNX format.

    MODEL: Path to the input .pt model file
    OUTPUT: Directory where the ONNX model will be saved

    Examples:

    \b
    # Basic conversion
    yolo-convert model.pt ./output/

    \b
    # With custom settings
    yolo-convert model.pt ./output/ --imgsz 1024 --half --dynamic

    \b
    # Using config file
    yolo-convert model.pt ./output/ --config config.yaml

    \b
    # Custom image size tuple
    yolo-convert model.pt ./output/ --imgsz 640,480
    """
    try:
        if verbose:
            click.echo(f"Input model: {model}")
            click.echo(f"Output directory: {output}")

        # Initialize converter
        if config:
            if verbose:
                click.echo(f"Loading configuration from: {config}")
            converter = YoloConverter.from_config(config)
        else:
            converter = YoloConverter(
                imgsz=imgsz,
                half=half,
                dynamic=dynamic,
                simplify=simplify,
                opset=opset,
                nms=nms,
                batch=batch,
                device=device,
            )

        # Perform conversion
        converter.to_onnx(model, output)
        click.echo(f"Successfully converted {model.name} to ONNX format")
        click.echo(f"Output saved to: {output}")

    except FileNotFoundError as e:
        click.echo(f"❌ Error: {e}", err=True)
        raise click.Abort()
    except ValueError as e:
        click.echo(f"❌ Error: {e}", err=True)
        raise click.Abort()
    except Exception as e:
        click.echo(f"❌ Unexpected error: {e}", err=True)
        if verbose:
            import traceback

            click.echo(traceback.format_exc(), err=True)
        raise click.Abort()


@cli.command()
@click.argument("onnx_path", type=click.Path(exists=True, path_type=Path), callback=validate_path_exists)
@click.argument("espdl_path", type=click.Path(exists=True, path_type=Path), callback=validate_path_exists)
@click.argument("calib_dataset_path", type=click.Path(exists=True, path_type=Path), callback=validate_path_exists)
@click.argument("mixed_precision", type=click.BOOL, default=False)
@click.option("--calib_steps", type=click.IntRange(min=8), default=8, help="Number of calibration steps")
@click.option("--quant_bits", type=click.Choice([8, 16]), default=8, help="Number of bits used for quantization")
@click.option("--image_size", type=click.Int, default=640, help="Expected image size of the ONNX model")
@click.option("--device", type=click.Choice(["cpu", "cuda"], case_sensitive=True), default="cpu")
def quantize_onnx(
    onnx_path: Path,
    espdl_path: Path,
    calib_dataset_path: Path,
    mixed_precision: bool,
    calib_steps: int,
    quant_bits: Literal[8, 16],
    image_size: int | tuple[int, int],
    device: Literal["cpu", "cuda"],
):
    quantizer = OnnxQuantizer(calib_dataset_path, image_size, device)

    if mixed_precision:
        quantizer.quantize_mixed_precision(onnx_path, espdl_path, calib_steps, device)
    else:
        quantizer.quantize_default(onnx_path, espdl_path, calib_steps, quant_bits, device)
