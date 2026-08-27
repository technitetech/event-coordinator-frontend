#!/usr/bin/env bash
# Sets up (or reuses) a local Python venv with the deps from
# scripts/requirements.txt, then runs scripts/train_ml_scorer.py.
set -euo pipefail

cd "$(dirname "$0")/.."

VENV_DIR=".venv"

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating Python venv at $VENV_DIR..."
  python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/pip" install -q -r scripts/requirements.txt
"$VENV_DIR/bin/python" scripts/train_ml_scorer.py
