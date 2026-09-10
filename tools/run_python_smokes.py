from __future__ import annotations

import subprocess
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS = ROOT / "tests"
files = sorted(TESTS.glob("*_smoke.py"))
failures: list[str] = []
child_env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}


def annotation_escape(value: str) -> str:
    return value.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


for file in files:
    print(f"[RUN] {file.name}", flush=True)
    result = subprocess.run([sys.executable, str(file)], cwd=ROOT, text=True, capture_output=True, encoding="utf-8", env=child_env)
    if result.returncode:
        failures.append(file.name)
        details = f"{result.stdout}{result.stderr}"
        sys.stderr.write(f"\n[FAIL] {file.name}\n{details}")
        if os.environ.get("GITHUB_ACTIONS") == "true":
            message = annotation_escape(details or f"exit {result.returncode}")
            sys.stderr.write(f"\n::error file=tests/{file.name},title=Python browser smoke failed::{message}\n")
    else:
        print(f"[PASS] {file.name}", flush=True)
print(f"AR-AC1 Python/browser smoke gate: {len(files) - len(failures)}/{len(files)} PASS")
if failures:
    print("Failures: " + ", ".join(failures), file=sys.stderr)
    raise SystemExit(1)
