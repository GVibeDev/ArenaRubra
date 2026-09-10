from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
files = sorted([*ROOT.joinpath("tests").glob("*.py"), *ROOT.joinpath("tools").glob("*.py")])
failures: list[str] = []
for file in files:
    try:
        compile(file.read_text(encoding="utf-8"), str(file), "exec")
    except (SyntaxError, UnicodeError) as error:
        failures.append(f"{file.relative_to(ROOT)}: {error}")
print(f"AR-AC1 Python syntax gate: {len(files) - len(failures)}/{len(files)} PASS")
for failure in failures:
    print(failure)
if failures:
    raise SystemExit(1)
