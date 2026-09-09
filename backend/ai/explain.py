"""
ai/explain.py — AI-powered topic explanation and visual diagram generation.
"""

import re
from ai.groq_client import chat_completion
from prompts.tutor_prompts import generate_tutor_prompt, generate_diagram_prompt


def generate_explanation(topic: str, level: str, weak_topics: list,
                         follow_up: str = None) -> str:
    """Generate a high-yield, subject-specialized explanation for a topic."""
    messages = generate_tutor_prompt(topic, level, weak_topics, follow_up)
    return chat_completion(messages, temperature=0.6, max_tokens=2000)


def generate_diagram(topic: str, context: str) -> str:
    """Generate a clean, syntactically valid Mermaid diagram definition."""
    messages = generate_diagram_prompt(topic, context)
    raw = chat_completion(messages, temperature=0.2, max_tokens=500)

    # Clean markdown fences if model returned them
    cleaned = re.sub(r"^```(?:mermaid)?", "", raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"```$", "", cleaned.strip(), flags=re.IGNORECASE).strip()

    # Ensure it starts with graph or flowchart
    if not (cleaned.startswith("graph") or cleaned.startswith("flowchart")):
        cleaned = "graph TD\n" + cleaned

    return cleaned
