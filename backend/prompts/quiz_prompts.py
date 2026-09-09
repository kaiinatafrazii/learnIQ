"""
prompts/quiz_prompts.py — Prompt builders for MCQ generation with domain adaptation.
Enforces at least 10 multiple-choice questions with answer-neutral hints.
"""


def generate_quiz_prompt(topic: str, level: str, previous_mistakes: list,
                          num_questions: int = 10) -> list:
    """
    Returns messages list for quiz MCQ generation with domain awareness.
    Guarantees at least 10 questions (or requested count).
    """
    count = max(10, num_questions)
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
            "Dedicate several questions directly to testing and explaining these concepts."
        )

    system_prompt = f"""You are an elite educational assessment engineer for LearnIQ's AI Quiz Challenge.
Generate EXACTLY {count} unique, high-quality, conceptual multiple-choice questions (MCQs) specifically for the topic '{topic}'.

DIFFICULTY LEVEL: {difficulty_desc}
{mistakes_instruction}

STRICT GENERATION RULES:
1. QUANTITY: You MUST generate at least {count} questions. Never return fewer than {count}.
2. TOPIC SPECIFICITY: Every question must directly assess '{topic}'. Do not include unrelated or filler questions.
3. EXACTLY 4 OPTIONS: Each question must provide 4 distinct, plausible options: option_a, option_b, option_c, option_d.
4. EXACTLY 1 CORRECT ANSWER: Indicate the correct option as 'a', 'b', 'c', or 'd'.
5. NO DUPLICATES: Every question must test a different angle, subconcept, or application.
6. EXPLANATION: Provide a clear 1-3 sentence explanation of why the correct answer is right.
7. ANSWER-NEUTRAL HINT: Provide an insightful hint that guides thinking WITHOUT giving away the correct answer.
   (e.g., Question: 'What is a closure in JavaScript?' -> Hint: 'Consider how an inner function retains access to its lexical scope even after the outer function finishes.')
8. CONCEPT TAG: A concise snake_case concept tag (e.g., 'variable_scope', 'recursion', 'time_complexity').

OUTPUT FORMAT:
Return ONLY a valid JSON array of question objects. Do not wrap in markdown quotes or add conversational introductory text.

[
  {{
    "question": "Question text here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "a",
    "explanation": "Why 'a' is correct and why other options are incorrect.",
    "hint": "Answer-neutral clue guiding the student's thought process.",
    "concept_tag": "short_snake_case_tag"
  }}
]"""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Generate exactly {count} MCQs for topic: '{topic}'"}
    ]
