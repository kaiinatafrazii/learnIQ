"""prompts/tutor_prompts.py — Reusable prompt builders for the AI Tutor."""


def generate_tutor_prompt(topic: str, level: str, weak_topics: list,
                           follow_up: str = None) -> list:
    """
    Returns a messages list for the OpenAI chat completions API.
    level: 'beginner' | 'intermediate' | 'advanced'
    weak_topics: list of concept tag strings the student struggles with
    follow_up: optional follow-up question from the student
    """
    level_instructions = {
        "beginner": (
            "Use very simple language. Avoid jargon. "
            "Use real-world analogies. Keep sentences short. "
            "Do not overwhelm with technical detail."
        ),
        "intermediate": (
            "Use standard technical language. "
            "Include a clear example and moderate technical depth. "
            "Assume the student knows basic programming concepts."
        ),
        "advanced": (
            "Use precise technical language. "
            "Include deeper concepts, formal definitions where helpful, "
            "and an applied/reasoning example. "
            "Challenge the student to think critically."
        ),
    }

    weak_instruction = ""
    if weak_topics:
        weak_str = ", ".join(weak_topics)
        weak_instruction = (
            f"\nIMPORTANT: The student is weak in these sub-concepts: {weak_str}. "
            "Spend extra time explaining these clearly with a specific example for each."
        )

    system_prompt = f"""You are LearnIQ — a personal AI tutor for students.
Your job is to explain topics clearly, concisely, and in a way that matches the student's level.

Teaching level: {level.upper()}
Instructions: {level_instructions.get(level, level_instructions['beginner'])}
{weak_instruction}

Formatting rules:
- Break your response into small labeled sections (use ## headers)
- Use bullet points for lists
- Include ONE diagram suggestion as a Mermaid flowchart code block (```mermaid ... ```) if the topic benefits from a visual
- Include ONE short, concrete real-world example in a callout block (> Example: ...)
- Keep the total response under 600 words
- Do NOT write a wall of text — chunk it into sections

Always end with: "**Key Takeaways:**" followed by 3-5 bullet points."""

    messages = [{"role": "system", "content": system_prompt}]

    if follow_up:
        messages.append({
            "role": "user",
            "content": f"Topic: {topic}\nFollow-up question: {follow_up}"
        })
    else:
        messages.append({
            "role": "user",
            "content": f"Please teach me about: {topic}"
        })

    return messages


def generate_diagram_prompt(topic: str, context: str) -> list:
    """Generate a standalone Mermaid diagram for a topic."""
    system_prompt = """You are a diagram expert. 
Given a topic and context, output ONLY a valid Mermaid flowchart or graph definition.
Do NOT include any explanation text — just the raw Mermaid code starting with 'flowchart TD' or 'graph TD'.
Keep it simple: 5-10 nodes maximum."""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Topic: {topic}\nContext: {context}\n\nGenerate a Mermaid diagram."}
    ]
