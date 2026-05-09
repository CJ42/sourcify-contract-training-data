#!/usr/bin/env python3
"""Run the CLI from the repo root: `python3 main.py --chain 1 --address 0x...`"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent


def main() -> None:
    src = _ROOT / "src"
    sys.path.insert(0, str(src))
    path = src / "main.py"
    spec = importlib.util.spec_from_file_location(
        "sourcify_contract_training_cli",
        path,
    )
    if spec is None or spec.loader is None:
        print(f"Cannot load CLI module from {path}", file=sys.stderr)
        raise SystemExit(1)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.main()


if __name__ == "__main__":
    main()
