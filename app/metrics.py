"""
Prometheus metrics registry and helpers.
"""
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    "memori_requests_total",
    "API requests",
    ["path", "method", "status"],
)

REQUEST_LATENCY = Histogram(
    "memori_request_latency_seconds",
    "API request latency",
    ["path", "method"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5),
)

RECALL_LATENCY = Histogram(
    "memori_recall_latency_seconds",
    "Recall handler latency",
    ["source"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1, 2),
)

EXTRACTION_COUNT = Counter(
    "memori_extractions_total",
    "Background extractions",
    ["status"],
)
