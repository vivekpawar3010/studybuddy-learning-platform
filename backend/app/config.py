"""App-level config shim to expose top-level backend config to `app` package.

This file re-exports values from the existing `backend/config.py` so code
importing `app.config` keeps working when the app is run as a module.
"""
from typing import Any

try:
    # when running with working directory set to backend, `config` is importable
    import config as root_config  # type: ignore
except Exception:  # pragma: no cover - best-effort import
    root_config = None


def _get(name: str, default: Any = None):
    return getattr(root_config, name, default) if root_config is not None else default


ALLOWED_ORIGINS = _get("ALLOWED_ORIGINS", ["*"])
DEBUG = _get("DEBUG", False)
