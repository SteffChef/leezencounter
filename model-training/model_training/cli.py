import sys

import click

from model_training.trainer import Trainer


@click.command()
@click.argument("config", type=click.Path(exists=True), required=True)
def train(config):
    """
    Run training job via the CLI from a YAML CONFIG file.
    """
    trainer = Trainer(config)
    try:
        trainer.train()
    finally:
        trainer.finish_run()


if __name__ == "__main__":
    # This allows the module to be called directly
    train()
else:
    # This is the entry point when used as a module
    def main():
        train()
