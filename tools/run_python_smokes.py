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
for file in files:
    result = subprocess.run([sys.executable, str(file)], cwd=ROOT, text=True, capture_output=True, encoding="utf-8", env=child_env)
    if result.returncode:
        failures.append(file.name)
        sys.stderr.write(f"\n[FAIL] {file.name}\n{result.stdout}{result.stderr}")
print(f"AR-AC1 Python/browser smoke gate: {len(files) - len(failures)}/{len(files)} PASS")
if failures:
    print("Failures: " + ", ".join(failures), file=sys.stderr)
    raise SystemExit(1)
