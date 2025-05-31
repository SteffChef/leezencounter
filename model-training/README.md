# Model Training Sub-Repo

This repository contains all the Python code that is necessary for model training and fine-tuning

### Setup
Note: make sure to [install uv](https://docs.astral.sh/uv/guides/install-python/) as a package and dependency manager. 

Run the ``setup.sh`` script for setting up the environment.
```bash
bash setup.sh
```

Enable tracking experiments with [Ultralytics](https://www.ultralytics.com/) and [Weights & Biases](https://wandb.ai/) by running in the terminal:
```bash
yolo settings wandb=True
```

Enable data tracking with [DVC](https://dvc.org/doc/start) by running. Set the cloud storage reference by running
```bash
dvc remote modify tinyaiot access_key_id DIGITAL_OCEAN_ACCESS_KEY_ID --local
dvc remote modify tinyaiot secret_access_key DIGITAL_OCEAN_SECRET_KEY --local
```

Replace the secret placeholders in uppercase with the actual secrets.


The following folders are tracked by DVC:
- `data`
- `datasets`
- `models`

Get data from remote by running

```bash
dvc pull
```

### Structure
```text
.
├── data                // image data and other data sources for model training
├── datasets            // downloaded or created datasets for model training (e.g., COCO)
├── configs             // run configurations in YAML format for training jobs
├── tinyaiot-runs       // training runs' configurations including weights and evaluation plots
├── model_training      // main directory containing the code for model training
├── models              // directory for storing fine-tuned/trained models
└── notebooks           // notebooks directory for testing and evaluating stuff
```