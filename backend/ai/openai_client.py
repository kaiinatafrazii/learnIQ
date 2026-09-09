"""
ai/openai_client.py — Backwards-compatibility alias module redirecting to Groq client.
"""

from ai.groq_client import (
    is_api_key_valid,
    get_client,
    chat_completion,
    _generate_fallback_response,
)

__all__ = [
    "is_api_key_valid",
    "get_client",
    "chat_completion",
    "_generate_fallback_response",
]
