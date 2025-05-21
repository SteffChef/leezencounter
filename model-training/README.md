# Model Training Sub-Repo

This repository contains all the Python code that is necessary for model training and fine-tuning

### Setup
Run the ``setup.sh`` script for setting up the environment.
```bash
bash setup.sh
```

Enable tracking experiments with Ultralytics and Weights & Biases by running in the terminal:
```bash
yolo settings wandb=True
```

### Structure
```text
.
├── data                // image data and other data sources for model training
├── datasets            // downloaded or created datasets for model training (e.g., COCO)
├── runs                // training runs' configurations including weights and evaluation plots
├── model_training      // main directory containing the code for model training
├── models              // directory for storing fine-tuned/trained models
└── notebooks           // notebooks directory for testing and evaluating stuff
```