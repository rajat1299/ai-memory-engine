"""SDK Constants"""

# Defaults
DEFAULT_BASE_URL = "http://localhost:8000"
DEFAULT_TIMEOUT = 2.0

# Versioning
VERSION = "0.1.0"
USER_AGENT = f"memoire-py/{VERSION}"

# API Paths
RECALL_PATH = "/v1/recall"
INGEST_PATH = "/v1/ingest"
SESSIONS_PATH = "/v1/sessions"
TIMELINE_PATH = "/v1/timeline"  # Note: Backend endpoint coming soon
