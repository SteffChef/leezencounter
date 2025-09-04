uv sync --all-groups
source .venv/bin/activate
pre-commit autoupdate
pre-commit install
echo "All set!"