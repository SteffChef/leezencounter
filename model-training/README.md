# Model Training Sub-Repo

This repository contains all the Python code that is necessary for model training and fine-tuning

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

### Setup

> [!IMPORTANT]  
> Run all commands from the `model-training` directory!

> [!NOTE]  
> Make sure to [install uv](https://docs.astral.sh/uv/getting-started/installation/) as a package and dependency manager.
> Run ``curl -LsSf https://astral.sh/uv/install.sh | sh`` from your terminal to install uv globally. Restart your terminal session after installation.

#### Dependencies

Run the ``setup.sh`` script for setting up the environment.
```bash
bash setup.sh
```

Enable tracking experiments with [Ultralytics](https://www.ultralytics.com/) and [Weights & Biases](https://wandb.ai/) by running in the terminal:
```bash
yolo settings wandb=True
```

Activate the virtual environment by running:
```bash
source .venv/bin/activate
```

The following setup instructions are optional:

Download and start Label Studio for image labelling:
```bash
uv sync --group labeling
label-studio start
```

Install the Jupyter Notebook dependency group:
```bash
uv sync --group notebooks
```

Intall dependencies for Quantization-aware Training:
```bash
uv sync --group qat
```

If you want to install all dependencies, just run:
```bash
uv sync --all-groups
```


#### DVC

> [!NOTE]  
> The following instructions are relevant for development purposes only. You need the secrets to access the Digital Ocean cloud storage. If you are a maintainer or contributing developer, reach out to the authors to get the secrets. Otherwise, if you want to have a snapshot of the images used for training, you can find it [here](https://uni-muenster.sciebo.de/s/7F6Wqp4oMBHok7K).

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

The aforementioned directories should show up in the file structure of your IDE. Usually, you do not have to make any adjustments to these files.

#### Weights & Biases
All model runs and experiments are tracked in Weights & Biases. You should be invited to the corresponding Weighs & Biases repository.
Login to Weights & Biases and get your API key. You can find information [here](https://docs.wandb.ai/support/find_api_key/) to see your API key.

Create a ``.env`` file in the `model-training` directory from the `env.skel` blueprint file to store your API key.
```bash
cat env.skel > .env
```

Paste in your API key after the corresponding key like ``WANDB_API_KEY=your-api-key-goes-here``.

In order to test your setup, you can run a test training job by running
```bash
poe train configs/yolo11n_sample_config.yaml
```


### Start a new Training Job
All training jobs are started from a run configuration in YAML format. Every job gets started via the CLI with a dedicated shell command.

To start a new training job, you have to set up a new run configuration in the ``configs`` folder. 
Consider the ``configs/yolo11n_sample_config.yaml`` as a reference for your own training job configuration.
We make use of Ultralytics for running trainings of YOLO models. Thus, to see the Ultralytics website for a [full list of the training and augmentation arguments](https://docs.ultralytics.com/modes/train/#train-settings).

A new training job can then be started by running
```bash
poe train configs/PATH_TO_YOUR_YAML_CONFIG
```

> [!NOTE]  
> The ``poe`` command is part of the virtual environment of this sub-repository. Thus, make sure to activate the virtual environment and run this command from the ``model-training`` directory.


### CI Jobs
[poethepoet](https://poethepoet.natn.io/) is a CLI wrapper and allows to customize terminal pipelines. We make use of this package in order to configure CI tasks (e.g., linter, typing). GitHub Actions are configured for the same tasks.
Each job is configured in the [pyproject.toml](pyproject.toml) file.

To see a full list of CI tasks, run
```bash
poe
```

from the terminal.

Run all checks:
```bash
poe ci
```
