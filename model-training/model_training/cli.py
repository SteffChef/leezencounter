from pathlib import Path

import click

from model_training.core.schemas import QuantizationAwareTrainingConfig
from model_training.qat import QuantizationAwareTrainingPipeline
from model_training.trainer import Trainer


@click.group()
def cli():
    pass


@cli.command()
@click.argument("config", type=click.Path(exists=True), required=True)
def train(config):
    """
    Run training job via the CLI from a YAML CONFIG file.
    """
    trainer = Trainer(config)
    try:
        trainer.train()
        trainer.validate()
    finally:
        trainer.finish_run()


@cli.command()
@click.argument("config", type=click.Path(exists=True), required=True)
def qat(config: Path):
    try:
        train_config = QuantizationAwareTrainingConfig.from_yaml(config)
        pipeline = QuantizationAwareTrainingPipeline(train_config)
        pipeline.run()
    except Exception as e:
        raise e
