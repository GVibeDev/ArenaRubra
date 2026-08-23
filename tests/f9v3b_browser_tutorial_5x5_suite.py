from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
TESTS = [
    "f9o7a_browser_lesson1_smoke.py",
    "f9o7c_browser_lesson2_smoke.py",
    "f9o7e_browser_lesson3_smoke.py",
    "f9o7f_browser_lesson4_smoke.py",
    "f9o7g_browser_lesson5_smoke.py",
    "f9o7b_browser_ui_state_resume_smoke.py",
    "f9o7h_browser_tutorial_guidance_smoke.py",
    "f9v3a_browser_unified_result_modal_smoke.py",
]

results = []
for name in TESTS:
    path = ROOT / "tests" / name
    if not path.exists():
        raise SystemExit(f"Test browser richiesto assente: {name}")
    proc = subprocess.run(
        [sys.executable, str(path)],
        cwd=str(ROOT),
        text=True,
        capture_output=True,
    )
    results.append({
        "test": name,
        "returncode": proc.returncode,
        "stdout": proc.stdout[-4000:],
        "stderr": proc.stderr[-4000:],
    })
    if proc.returncode != 0:
        print(json.dumps({"ok": False, "failed": name, "results": results}, ensure_ascii=False, indent=2))
        raise SystemExit(proc.returncode)

print(json.dumps({
    "ok": True,
    "suite": "F9V3b Tutorial Runtime 5x5 E2E",
    "lessons": 5,
    "checkpointResume": True,
    "guidanceRegression": True,
    "resultModalRegression": True,
    "tests": [entry["test"] for entry in results],
}, ensure_ascii=False, indent=2))
