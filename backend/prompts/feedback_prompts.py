"""prompts/feedback_prompts.py — Prompt builders for quiz performance feedback."""


def generate_feedback_prompt(quiz_results: dict) -> list:
    """
    quiz_results = {
        "topic": str,
        "score": int,
        "total": int,
        "accuracy": float,
        "strong_areas": list[str],  # concept tags student got right
        "weak_areas": list[str],    # concept tags student got wrong
        "level": str,
    }
    """
    topic = quiz_results.get("topic", "the topic")
    score = quiz_results.get("score", 0)
    total = quiz_results.get("total", 0)
    accuracy = quiz_results.get("accuracy", 0)
    strong = ", ".join(quiz_results.get("strong_areas", [])) or "none identified"
    weak = ", ".join(quiz_results.get("weak_areas", [])) or "none identified"
    level = quiz_results.get("level", "beginner")

    system_prompt = """You are a caring, encouraging AI tutor giving quiz feedback.

Rules:
- Be encouraging but honest
- Identify SPECIFIC concepts to improve (not generic advice)
- Keep feedback to 3-4 sentences max
- End with 2-3 concrete actionable recommendations as bullet points
- Format: feedback paragraph, then "**Recommendations:**" header, then bullet list"""

    user_msg = f"""Student Quiz Results:
Topic: {topic}
Score: {score}/{total} ({accuracy}%)
Level: {level}
Strong areas: {strong}
Weak areas: {weak}

Give personalised feedback and specific recommendations."""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg}
    ]
