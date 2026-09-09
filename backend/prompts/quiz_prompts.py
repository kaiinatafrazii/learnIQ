"""prompts/quiz_prompts.py — Prompt builders for MCQ generation."""

import json


def generate_quiz_prompt(topic: str, level: str, previous_mistakes: list,
                          num_questions: int = 5) -> list:
    """
    Returns messages list for quiz MCQ generation.
    level: 'beginner' | 'intermediate' | 'advanced'
    previous_mistakes: list of concept tag strings the student got wrong before
    """
    difficulty_map = {
        "beginner": "easy — basic conceptual understanding, simple recall questions",
        "intermediate": "medium — application and some analysis",
        "advanced": "hard — reasoning, edge cases, and applied problem-solving",
    }
    difficulty_desc = difficulty_map.get(level, difficulty_map["beginner"])

    mistakes_instruction = ""
    if previous_mistakes:
        mistakes_str = ", ".join(previous_mistakes)
        mistakes_instruction = (
            f"\nFocus more questions on these previously weak concepts: {mistakes_str}"
        )

    system_prompt = f"""You are a quiz generator for LearnIQ, an AI tutoring platform.
Generate exactly {num_questions} multiple-choice questions (MCQs) about the topic.

Difficulty: {difficulty_desc}
{mistakes_instruction}

Return your response as a valid JSON array ONLY — no extra text, no markdown fences.
Each element must have these exact keys:
{{
  "question": "The question text",
  "option_a": "Option A text",
  "option_b": "Option B text",
  "option_c": "Option C text",
  "option_d": "Option D text",
  "correct_answer": "a" | "b" | "c" | "d",
  "explanation": "Why this answer is correct (1-2 sentences)",
  "concept_tag": "short_concept_label_no_spaces"
}}

The concept_tag should be a short snake_case label like "stride", "pooling", "backpropagation", etc."""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Generate {num_questions} MCQs about: {topic}"}
    ]
