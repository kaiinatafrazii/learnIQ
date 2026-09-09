"""ai/quiz_generator.py — AI MCQ generation."""

import json
from ai.groq_client import chat_completion
from prompts.quiz_prompts import generate_quiz_prompt


def generate_mcqs(topic: str, level: str, previous_mistakes: list,
                  num_questions: int = 5) -> list:
    """
    Returns a list of MCQ dicts:
    [{question, option_a, option_b, option_c, option_d,
      correct_answer, explanation, concept_tag}, ...]
    """
    messages = generate_quiz_prompt(topic, level, previous_mistakes, num_questions)
    raw = chat_completion(messages, temperature=0.6, max_tokens=2000)

    # The model should return raw JSON — parse it
    # Strip any accidental markdown fences
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Remove first and last fence lines
        raw = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    try:
        questions = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: try to extract JSON array from response
        import re
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            questions = json.loads(match.group())
        else:
            raise ValueError("AI returned invalid quiz format. Please retry.")

    # Validate structure
    required_keys = {"question", "option_a", "option_b", "option_c", "option_d",
                     "correct_answer", "explanation"}
    validated = []
    for q in questions:
        if required_keys.issubset(q.keys()):
            validated.append(q)

    if not validated:
        raise ValueError("AI could not generate valid quiz questions. Please retry.")

    return validated
