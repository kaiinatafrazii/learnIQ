"""ai/explain.py — AI-powered topic explanation."""

from ai.groq_client import chat_completion
from prompts.tutor_prompts import generate_tutor_prompt, generate_diagram_prompt


def generate_explanation(topic: str, level: str, weak_topics: list,
                         follow_up: str = None) -> str:
    """Generate an explanation for a topic at the given level."""
    messages = generate_tutor_prompt(topic, level, weak_topics, follow_up)
    return chat_completion(messages, max_tokens=1200)


def generate_diagram(topic: str, context: str) -> str:
    """Generate a Mermaid diagram definition for a topic."""
    messages = generate_diagram_prompt(topic, context)
    raw = chat_completion(messages, temperature=0.3, max_tokens=300)
    # Strip any accidental markdown fences
    raw = raw.replace("```mermaid", "").replace("```", "").strip()
    return raw
