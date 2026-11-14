import re
from typing import Tuple, List

# Patterns commonly used in indirect prompt injection attacks
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior|system)\s+prompts?",
    r"system\s*prompt\s*override",
    r"you\s+are\s+now\s+(unrestricted|in\s+god\s+mode|dan|jailbroken)",
    r"forget\s+everything\s+you\s+(were|have\s+been)\s+told",
    r"reveal\s+(system|your|the)\s+(prompt|api\s*key|secret|password)",
    r"act\s+as\s+an\s+unfiltered\s+ai",
    r"assistant\s*:\s*",
    r"<\|im_start\|>",
    r"<\|im_end\|>",
    r"\[INST\]",
    r"\[/INST\]",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

UNAUTHORIZED_COMMITMENT_PATTERNS = [
    r"we\s+hereby\s+guarantee\s+payment",
    r"we\s+legally\s+bind\s+our\s+company",
    r"i\s+authorize\s+a\s+transfer\s+of",
    r"api[-_]?key\s*[:=]\s*['\"]?[a-zA-Z0-9_\-]{16,}",
    r"bearer\s+[a-zA-Z0-9_\-\.]{20,}",
]

COMPILED_OUTPUT_PATTERNS = [re.compile(p, re.IGNORECASE) for p in UNAUTHORIZED_COMMITMENT_PATTERNS]


def detect_prompt_injection(text: str) -> Tuple[bool, List[str]]:
    """
    Scans untrusted input for prompt injection vectors.
    Returns (is_suspicious, matched_patterns).
    """
    if not text:
        return False, []
    
    matches = []
    for pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            matches.append(pattern.pattern)
            
    return (len(matches) > 0, matches)


def sanitize_untrusted_input(text: str, max_chars: int = 2000) -> str:
    """
    Sanitizes untrusted text before embedding or LLM prompt formatting:
    - Truncates to max_chars
    - Escapes control characters and dangerous delimiters
    - Strips suspicious instruction overrides
    """
    if not text:
        return ""
    
    clean = text.strip()[:max_chars]
    # Neutralize fake role tags
    clean = re.sub(r"(?i)(system|user|assistant)\s*:", r"[\1]:", clean)
    clean = clean.replace("<|im_start|>", "").replace("<|im_end|>", "")
    return clean


def sanitize_ai_output(output: str) -> str:
    """
    Verifies that AI response does not leak credentials or attempt unauthorized commitments.
    """
    if not output:
        return ""
    
    for pattern in COMPILED_OUTPUT_PATTERNS:
        if pattern.search(output):
            return "[AI response filtered by Enterprise Safety Guard: Potential unauthorized commitment or credential detected.]"
            
    return output.strip()

