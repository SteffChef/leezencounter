# Model Deployment to ESP32S3
This deployment is tested for ESP32S3.

## Setup
1. You can go through the `model_deployment.ipynb` to generate an `.onnx` and `.espdl` file. They are automatically placed at the right folders. To use it, make sure that the model, in this case `yolo11n.pt`, is in the folder `./coco_detect/models/`.
   1. For now, the pipeline is optimized for deployment of a `yolo11n.pt` model
   2. If you want to use a different model, you need to change the conversion to the `.onnx`as in `torch.onnx.export(...)`
2. Currently, the image predicted on the device is already in the right folder. To change the image, copy an image of size 640x640 named bikes.jpg into `./yolo11_detect/main/`. You can use `model_deployment.ipynb` to compress the image.
3. Ensure ESP-DL Environment is correctly setup and you are in your virtual environment to deploy the program to your ESP.
4. Move into `./yolo11_detect/` to build the program. Use the following command to build the program:
 

    idf.py fullclean build flash monitor


## Tips
If you just quickly want to test a `.espdl` model, put it in the following path. Just overwrite the existing model but keep the same name. Make sure to store the old model, if you need it later.

    ./coco_detect/models/yolo11n.espdl

Unless you just want to override an existing model with your new model and use the same name as the old model, you can also add models for "long term use". To add a new model inside the coco_detect you need to change the following files. Take a look at `CUSTOM_YOLO11N` for reference.
- `./coco_detect/CMakeLists.txt`
- `./coco_detect/Kconfig`
- `./coco_detect/coco_detect.cpp`
- `./coco_detect/coco_detect.hpp`
- `./coco_detect/models/<YOUR-MODEL>.espdl`

The threshold of the model inside coco_detect can be changed in this file `models/coco_detect/coco_detect.cpp`. There the first parameter after `m_model` represents the threshold value, in this case 10%:

    new dl::detect::yolo11PostProcessor(m_model, 0.10, 0.7, 10, {{8, 8, 4, 4}, {16, 16, 8, 8}, {32, 32, 16, 16}});


If you want to change the names of models or test-images, you have to modify a lot of code in the corresponding files. Therefore, for testing you should just name it as an existing model / image.

## Bugs before build
- if the build is crashing, it might be due to a too big image. Reduce the size with the help of the `model_deployment.ipynb` or some other software. The yolo11n is trained on images of size 640x640. Smaller resolutions also work.
- make sure you are in your esp-idf virtual environment with Python 3.10
- sometimes you have to set the IDF_TARGET again:


    unset IDF_TARGET
    idf.py set-target esp32s3
