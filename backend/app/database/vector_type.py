import json
from typing import List, Optional
import numpy as np
from sqlalchemy import TypeDecorator, Text
from sqlalchemy.dialects.postgresql import ARRAY, FLOAT

try:
    from pgvector.sqlalchemy import Vector as PgVector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False


class VectorType(TypeDecorator):
    """
    Seamless Dual-Engine Vector Type:
    - On PostgreSQL with pgvector, operates natively via pgvector.sqlalchemy.Vector.
    - On SQLite or fallback dialects, serializes transparently to JSON Text.
    Ensures 100% interoperability without database lock-in.
    """
    impl = Text
    cache_ok = True

    def __init__(self, dim: int = 256, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dim = dim

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and PGVECTOR_AVAILABLE:
            return dialect.type_descriptor(PgVector(self.dim))
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, np.ndarray):
            value = value.tolist()
        if dialect.name == "postgresql" and PGVECTOR_AVAILABLE:
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return []
        if isinstance(value, (list, np.ndarray)):
            return list(value)
        return value


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two float vectors, returning a float in [-1.0, 1.0]."""
    if not vec1 or not vec2:
        return 0.0
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    sim = float(np.dot(a, b) / (norm_a * norm_b))
    return max(0.0, min(1.0, sim))

