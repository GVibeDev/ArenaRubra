from pathlib import Path
import os
import shutil


def chromium_executable():
    candidates = [
        os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
        shutil.which("google-chrome"),
        shutil.which("chrome"),
        shutil.which("msedge"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "/usr/bin/chromium",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    return None


def chromium_launch_options(allow_file_access=True):
    options = {"headless": True, "args": ["--no-sandbox"]}
    if allow_file_access:
        options["args"].append("--allow-file-access-from-files")
    executable = chromium_executable()
    if executable:
        options["executable_path"] = executable
    return options
