"""ai/notes_generator.py — Auto-generate structured notes from a lesson explanation."""

from ai.groq_client import chat_completion
from prompts.notes_prompts import generate_notes_prompt


def generate_notes(topic: str, explanation: str) -> str:
    """Returns structured Markdown notes for a topic."""
    messages = generate_notes_prompt(topic, explanation)
    return chat_completion(messages, temperature=0.4, max_tokens=800)
