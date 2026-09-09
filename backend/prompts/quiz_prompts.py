"""
prompts/quiz_prompts.py — Prompt builders for MCQ generation with domain adaptation.
"""


def generate_quiz_prompt(topic: str, level: str, previous_mistakes: list,
                          num_questions: int = 5) -> list:
    """
    Returns messages list for quiz MCQ generation with domain awareness.
    level: 'school' | 'beginner' | 'diploma' | 'undergraduate' | 'graduate' | 'intermediate' | 'advanced'
    previous_mistakes: list of concept tag strings the student got wrong before
    """
    level_norm = (level or "intermediate").lower().strip()

    difficulty_map = {
        "school": "fundamental — core conceptual definitions, direct understanding, clear non-tricky options",
        "beginner": "introductory — basic principles, core terms, intuitive questions",
        "diploma": "practical & applied — scenario-based, troubleshooting, real-world application",
        "undergraduate": "medium to rigorous — analytical reasoning, problem solving, understanding trade-offs",
        "intermediate": "medium — concept application, multi-step reasoning",
        "graduate": "hard — deep architectural nuances, edge cases, formal analysis, high-level evaluation",
        "advanced": "hard — complex edge cases, theoretical trade-offs, advanced problem solving",
    }
    difficulty_desc = difficulty_map.get(level_norm, difficulty_map["undergraduate"])

    mistakes_instruction = ""
    if previous_mistakes:
        mistakes_str = ", ".join(previous_mistakes)
        mistakes_instruction = (
            f"\nPRIORITY: The student previously struggled with: {mistakes_str}. "
            "Generate at least 2 questions directly targeting these concepts with clear explanations."
        )

    system_prompt = f"""You are an expert educational assessment creator for LearnIQ.
Generate exactly {num_questions} high-quality, conceptual multiple-choice questions (MCQs) specifically for the given topic and subject domain.

DIFFICULTY LEVEL: {difficulty_desc}
{mistakes_instruction}

QUALITY RULES:
1. Subject-Appropriate: Questions must test actual understanding of the specific subject (coding logic for CS, reactions/mechanisms for Chemistry/Biology, formulas/derivations for Math/Physics, cause-and-effect for Humanities).
2. Plausible Distractors: Incorrect options must represent common student misconceptions or near-misses, not silly/obvious joke options.
3. Crystal-Clear Explanations: Explain why the correct answer is right AND why the most tempting distractor is incorrect.
4. Clean JSON: Return ONLY a valid JSON array of question objects without markdown wrapping (no ```json ... ```).

OUTPUT JSON SCHEMA:
[
  {{
    "question": "Question text...",
    "option_a": "Option A...",
    "option_b": "Option B...",
    "option_c": "Option C...",
    "option_d": "Option D...",
    "correct_answer": "a" | "b" | "c" | "d",
    "explanation": "Clear explanation of the answer and underlying concept (2-3 sentences).",
    "concept_tag": "short_snake_case_concept_label"
  }}
]"""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Generate {num_questions} high-yield MCQs for the topic: {topic}"}
    ]
