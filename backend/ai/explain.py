"""
ai/explain.py — AI-powered topic explanation and visual diagram generation.
"""

import re
from ai.groq_client import chat_completion
from prompts.tutor_prompts import generate_tutor_prompt, generate_diagram_prompt


def sanitize_tutor_text(text: str) -> str:
    """
    Ensure explanations are human-readable, clean of asterisks/star marks,
    free of double/unnecessary quotes, and that equations use clean mathematical symbols.
    """
    if not text:
        return ""

    # 1. Clean up LaTeX artifacts in equations
    text = text.replace(r"\times", "×")
    text = text.replace(r"\cdot", "·")
    text = text.replace(r"\pm", "±")
    text = text.replace(r"\approx", "≈")
    text = text.replace(r"\le", "≤")
    text = text.replace(r"\ge", "≥")
    text = text.replace(r"\neq", "≠")
    text = text.replace(r"\sqrt", "√")
    text = re.sub(r"\$\$(.*?)\$\$", r"\1", text)
    text = re.sub(r"\$(.*?)\$", r"\1", text)

    # 2. Clean up double single quotes ''word'' -> word and stray ''
    text = re.sub(r"''([^'\n]+)''", r"\1", text)
    text = text.replace("''", "")

    # 3. Clean up single quotes wrapping concepts like 'Photosynthesis' -> Photosynthesis
    text = re.sub(r"(?<=\s)'([A-Za-z0-9_ -]{2,35})'(?=[\s.,;:!?])", r"\1", text)

    # 4. Clean up asterisks / star marks:
    # Remove **word** -> word
    text = re.sub(r"\*\*([^*\n]+)\*\*", r"\1", text)
    # Remove *word* -> word
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"\1", text)
    # Convert any leading bullet asterisks (* item) to clean hyphen (- item)
    text = re.sub(r"^\s*\*\s+", "- ", text, flags=re.MULTILINE)

    return text.strip()


def generate_explanation(topic: str, level: str, weak_topics: list,
                         follow_up: str = None, lang: str = "en") -> str:
    """Generate a high-yield, subject-specialized explanation for a topic."""
    messages = generate_tutor_prompt(topic, level, weak_topics, follow_up, lang=lang)
    raw = chat_completion(messages, temperature=0.6, max_tokens=2000)
    return sanitize_tutor_text(raw)


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
