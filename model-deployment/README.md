# Model Conversion

## Conversion Requirements
- Install requirements with uv:
  
      uv sync

- Ensure you have pulled the dvc dataset
- Put a `yolo11n.pt` model in the `model-deployment/coco_detect/models/` folder
- Optional: Change parameters of paths and constants in `model-deployment/model_conversion/core/`

## Conversion
- Prepare the data for model conversion:

      python -m model_conversion.prepare_data

- Evaluate model and generate `.espdl` file

      python -m model_conversion.run_evaluation

- Optional: Visualize performance of model on images based on predictions (for specifc class):

      python -m model_conversion.visualize_evaluation --class_name bicycle  

- Optional: Alternatively, you can run the `model_deployment.ipynb` notebook to perform most of the steps from above. You might need to change some parameters in the notebook.

## Deployment Requirements
- Ensure you have generated the `.espdl` file, which when doing the steps above is automatically placed it in the `model-deployment/coco_detect/models/` folder
- You can make a prediction on one image with this ESP32S3 script. To change the image, copy an image of size 640x640 named bikes.jpg into `model-deployment/yolo11_detect/main/`.
- Optional: Change parameters for the detection thresholds in `model-deployment/coco_detect/coco_detect.cpp`. There, the first parameters after `m_model` represents the confidence and IoU threshold and the max detection value, in this case 25%, 70% and 100 respectively:


    new dl::detect::yolo11PostProcessor(m_model, 0.25, 0.7, 100, {{8, 8, 4, 4}, {16, 16, 8, 8}, {32, 32, 16, 16}});


## Deployment
This deployment is tested for ESP32S3.

- It will use the `.espdl` file from `model-deployment/coco_detect/models/` automatically. 
- Ensure the ESP-DL Environment is correctly setup and you are in your virtual environment to deploy the program to your ESP. (See [here](https://pinto-bobcat-b66.notion.site/Setup-Instructions-ESP-DL-1cc043907cbe803e8b89fe3b5594d13f) for instructions)
- Move into `./yolo11_detect/` to build the program. Use the following command to build the program:
 

    idf.py fullclean build flash monitor


### Bugs before build
- if the build is crashing, it might be due to a too big image. Reduce the size with the help of the `model_deployment.ipynb` or some other software. The yolo11n is trained on images of size 640x640. Smaller resolutions also work.
- make sure you are in your esp-idf virtual environment with Python 3.10
- sometimes you have to set the IDF_TARGET again:


    unset IDF_TARGET
    idf.py set-target esp32s3


