from pathlib import Path
import os
import re
import shutil


CURRENT_LOGIC_BASELINE = "C2-STABLE-1-F9T2c4-APK-M4c"
BUILD_VERSION_PATTERN = re.compile(r"^(?:C2-STABLE-1-F9[A-Za-z0-9]+-APK-M4c|1\.0\.0-rc\.\d+)$")


def is_valid_build_version(value):
    return bool(BUILD_VERSION_PATTERN.fullmatch(str(value or "")))


def assert_valid_build_version(value):
    assert is_valid_build_version(value), f"invalid Arena Rubra build version: {value!r}"
    return value


def assert_valid_logic_baseline(value):
    assert value == CURRENT_LOGIC_BASELINE, f"validated logic baseline changed: {value!r}"
    return value


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
