"""SDK Constants"""

# Defaults
DEFAULT_BASE_URL = "http://localhost:8000"
DEFAULT_TIMEOUT = 2.0

# Versioning
VERSION = "0.1.0"
USER_AGENT = f"memoire-py/{VERSION}"

# API Paths - Memory Operations
RECALL_PATH = "/v1/recall"
INGEST_PATH = "/v1/ingest"
CONSCIOUS_PATH = "/v1/conscious"  # GET /v1/conscious/{user_id}

# API Paths - Facts Management
FACTS_PATH = "/v1/facts"  # GET /v1/facts/{user_id}, DELETE /v1/facts/{fact_id}
FACT_SOURCE_PATH = "/v1/facts/{fact_id}/source"

# API Paths - User/Session Management
USERS_PATH = "/v1/users"
SESSIONS_PATH = "/v1/sessions"
CONSOLIDATE_PATH = "/v1/users/{user_id}/consolidate"

# API Paths - Future
TIMELINE_PATH = "/v1/timeline"  # Note: Backend endpoint coming soon
