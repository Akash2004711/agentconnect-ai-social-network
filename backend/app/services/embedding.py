import math
import hashlib
import re
from typing import List
import numpy as np
import httpx
from app.core.config import settings
from app.security.prompt_defense import sanitize_untrusted_input

SEMANTIC_TAXONOMY = {
    "food_delivery": ["food", "deliver", "dining", "meal", "restaurant", "swiggy", "zomato", "grocer", "kitchen", "dish", "order", "instamart"],
    "fintech_payments": ["upi", "cashback", "pay", "wallet", "phonepe", "paytm", "gpay", "transaction", "checkout", "transfer", "gateway"],
    "banking_finance": ["hdfc", "bank", "card", "credit", "debit", "loan", "interest", "finance", "account", "emi", "forex", "savings"],
    "ecommerce_retail": ["flipkart", "amazon", "shop", "ecommerce", "discount", "sale", "diwali", "festive", "offer", "product", "deal", "retail"],
    "automobile_mobility": ["bajaj", "auto", "vehicle", "automobile", "motorcycle", "bike", "car", "engine", "dealership", "showroom", "fleet"],
    "travel_hospitality": ["flight", "hotel", "travel", "booking", "tourism", "vacation", "ticket", "holiday"],
    "telecom_saas": ["cloud", "saas", "api", "telecom", "data", "broadband", "developer", "software", "infrastructure"]
}

# Cross-domain conceptual affinity weights (e.g. food delivery promos often bundle UPI payments & cards)
CONCEPTUAL_AFFINITY = {
    ("food_delivery", "fintech_payments"): 0.70,
    ("food_delivery", "banking_finance"): 0.65,
    ("food_delivery", "ecommerce_retail"): 0.60,
    ("ecommerce_retail", "fintech_payments"): 0.80,
    ("ecommerce_retail", "banking_finance"): 0.75,
    ("automobile_mobility", "banking_finance"): 0.60,
    ("automobile_mobility", "food_delivery"): 0.10,
    ("automobile_mobility", "fintech_payments"): 0.25,
}

def get_concept_affinity(c1: str, c2: str) -> float:
    if c1 == c2:
        return 1.0
    return CONCEPTUAL_AFFINITY.get((c1, c2), CONCEPTUAL_AFFINITY.get((c2, c1), 0.20))


class EmbeddingService:
    def __init__(self):
        self.dimension = settings.VECTOR_DIMENSION
        self.openai_api_key = settings.OPENAI_API_KEY

    def get_embedding(self, text: str) -> List[float]:
        clean_text = sanitize_untrusted_input(text, max_chars=3000)
        if not clean_text:
            return [0.0] * self.dimension

        if self.openai_api_key:
            try:
                return self._get_openai_embedding(clean_text)
            except Exception as e:
                print(f"[EmbeddingService] OpenAI API fallback: {e}")
                return self._get_local_semantic_embedding(clean_text)
        else:
            return self._get_local_semantic_embedding(clean_text)

    def _get_openai_embedding(self, text: str) -> List[float]:
        url = "https://api.openai.com/v1/embeddings"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "input": text,
            "model": settings.EMBEDDING_MODEL,
            "dimensions": self.dimension
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["data"][0]["embedding"]

    def _get_local_semantic_embedding(self, text: str) -> List[float]:
        """
        High-fidelity semantic projection with cross-domain concept affinity.
        """
        text_lower = text.lower()
        vec = np.zeros(self.dimension, dtype=np.float32)

        # 1. Detect dominant categories in the text
        category_weights = {}
        for cat_name, roots in SEMANTIC_TAXONOMY.items():
            score = 0.0
            for r in roots:
                # Substring root matching (e.g. 'deliver' matches 'delivery' and 'deliveries')
                matches = len(re.findall(re.escape(r), text_lower))
                if matches > 0:
                    score += matches * 2.0
            if score > 0:
                category_weights[cat_name] = score

        # 2. Project semantic categories with cross-affinity expansion (dims 0-143)
        cat_list = list(SEMANTIC_TAXONOMY.keys())
        for i, target_cat in enumerate(cat_list):
            direct_score = category_weights.get(target_cat, 0.0)
            
            # Add cross-domain affinity contributions
            cross_score = 0.0
            for present_cat, present_weight in category_weights.items():
                if present_cat != target_cat:
                    aff = get_concept_affinity(present_cat, target_cat)
                    cross_score += present_weight * aff * 0.75

            total_cat_score = direct_score + cross_score
            if total_cat_score > 0:
                start_idx = i * 20
                for d in range(20):
                    vec[start_idx + d] = total_cat_score * math.cos((i + 1) * (d + 1) * 0.5)

        # 3. Vocabulary hash projection for nuances (dims 144 to 255)
        tokens = re.findall(r"\w+", text_lower)
        for token in tokens:
            th = int(hashlib.md5(token.encode("utf-8")).hexdigest()[:8], 16)
            dim_idx = 144 + (th % 112)
            sign = 1.0 if (th % 2 == 0) else -1.0
            vec[dim_idx] += sign * (1.0 / math.sqrt(len(tokens) or 1))

        # 4. Unit normalization
        norm = np.linalg.norm(vec)
        if norm > 0.0:
            vec = vec / norm
        else:
            vec[0] = 1.0

        return vec.tolist()

embedding_service = EmbeddingService()
