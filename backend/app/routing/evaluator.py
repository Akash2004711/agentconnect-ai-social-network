from typing import Dict, Any, List
import re

INDUSTRY_SYNERGY_MATRIX = {
    ("Food & Hyperlocal", "Payments & Fintech"): 0.88,
    ("Food & Hyperlocal", "Banking & Financial Services"): 0.85,
    ("Food & Hyperlocal", "E-Commerce & Retail"): 0.70,
    ("Food & Hyperlocal", "Automotive & Mobility"): 0.15,
    ("E-Commerce & Retail", "Payments & Fintech"): 0.92,
    ("E-Commerce & Retail", "Banking & Financial Services"): 0.88,
    ("E-Commerce & Retail", "Logistics & Supply Chain"): 0.85,
    ("Automotive & Mobility", "Banking & Financial Services"): 0.75,  # Vehicle loans / asset finance
    ("Automotive & Mobility", "Payments & Fintech"): 0.35,
    ("Automotive & Mobility", "Food & Hyperlocal"): 0.15,
}

def get_industry_synergy(ind1: str, ind2: str) -> float:
    if not ind1 or not ind2:
        return 0.35
    if ind1.lower() == ind2.lower():
        return 0.90
    pair = (ind1, ind2)
    rev_pair = (ind2, ind1)
    if pair in INDUSTRY_SYNERGY_MATRIX:
        return INDUSTRY_SYNERGY_MATRIX[pair]
    if rev_pair in INDUSTRY_SYNERGY_MATRIX:
        return INDUSTRY_SYNERGY_MATRIX[rev_pair]
    return 0.35


def _stem_token(token: str) -> str:
    """Basic rule-based stemming for common business plurals & suffixes."""
    t = token.lower().strip()
    if t.endswith("ies"):
        return t[:-3] + "y"
    if t.endswith("es") and len(t) > 4:
        return t[:-2]
    if t.endswith("s") and not t.endswith("ss") and len(t) > 3:
        return t[:-1]
    if t.endswith("ing") and len(t) > 5:
        return t[:-3]
    return t


def calculate_keyword_overlap(text: str, keywords: List[str]) -> tuple[float, List[str]]:
    """
    Computes stemmed keyword overlap score and matched keyword list.
    """
    if not keywords or not text:
        return 0.0, []

    text_words = set(re.findall(r"\w+", text.lower()))
    stemmed_text_words = {_stem_token(w) for w in text_words}
    raw_text = text.lower()

    matched = []
    for kw in keywords:
        kw_clean = kw.strip().lower()
        if not kw_clean:
            continue
        # Direct substring check
        if kw_clean in raw_text:
            matched.append(kw_clean)
            continue
        # Stemmed word match
        kw_tokens = re.findall(r"\w+", kw_clean)
        stemmed_kw_tokens = [_stem_token(w) for w in kw_tokens]
        if all(st in stemmed_text_words for st in stemmed_kw_tokens):
            matched.append(kw_clean)

    if not matched:
        return 0.0, []

    # Score: having 2+ key strategic matches is very strong signal
    score = min(1.0, 0.40 + (len(matched) * 0.25))
    return score, matched


def evaluate_negative_penalties(text: str, negative_keywords: List[str]) -> tuple[float, List[str]]:
    if not negative_keywords or not text:
        return 0.0, []

    text_lower = text.lower()
    matched_neg = []
    for neg_kw in negative_keywords:
        neg_clean = neg_kw.strip().lower()
        if not neg_clean:
            continue
        if re.search(r"\b" + re.escape(neg_clean) + r"\b", text_lower):
            matched_neg.append(neg_clean)

    penalty = min(0.6, len(matched_neg) * 0.30)
    return penalty, matched_neg


def build_explainable_reason(
    agent_name: str,
    company_name: str,
    decision: str,
    vector_score: float,
    final_score: float,
    threshold: float,
    matched_keywords: List[str],
    matched_negatives: List[str],
    industry_synergy: float,
    post_title: str
) -> str:
    if decision == "NOTIFY":
        kw_desc = f" The agent has declared interests matching {', '.join(matched_keywords)}." if matched_keywords else ""
        return (
            f"The post discusses '{post_title}'.{kw_desc} "
            f"High semantic alignment ({vector_score:.2f}) and industry synergy ({industry_synergy:.2f}) with {company_name}. "
            f"Final relevance score of {final_score:.2f} meets notification threshold ({threshold:.2f}). Decision: NOTIFY."
        )
    else:
        reasons = []
        if vector_score < 0.45:
            reasons.append("no meaningful semantic or commercial business relevance found")
        if industry_synergy < 0.35:
            reasons.append("cross-industry affinity is negligible")
        if matched_negatives:
            reasons.append(f"negative preference matched on {', '.join(matched_negatives)}")
        if final_score < threshold:
            reasons.append(f"relevance score ({final_score:.2f}) is below the required threshold ({threshold:.2f})")

        return (
            f"Did not route to {company_name} ({agent_name}). Reason: {'; '.join(reasons)}. "
            f"Vector score: {vector_score:.2f}, final score: {final_score:.2f} vs threshold {threshold:.2f}. Decision: DO NOT NOTIFY."
        )
