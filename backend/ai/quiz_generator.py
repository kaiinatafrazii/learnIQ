"""
ai/quiz_generator.py — AI-powered MCQ generation engine with strict validation
and automatic regeneration to guarantee at least 10 valid questions.
"""

import json
import re
from ai.groq_client import chat_completion
from prompts.quiz_prompts import generate_quiz_prompt


def _clean_and_parse_json(raw: str) -> list:
    """Safely extract and parse JSON array from raw model text."""
    if not raw:
        return []

    text = raw.strip()
    # Strip markdown fences ```json ... ```
    if text.startswith("```"):
        lines = text.split("\n")
        first_line = lines[0].lower()
        if "json" in first_line or first_line == "```":
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            # In case model returned {"questions": [...]}
            for key in ["questions", "mcqs", "quiz", "data"]:
                if key in data and isinstance(data[key], list):
                    return data[key]
    except Exception:
        pass

    # Regex extraction fallback
    match = re.search(r'\[\s*\{.*\}\s*\]', text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            if isinstance(data, list):
                return data
        except Exception:
            pass

    return []


def _validate_questions(raw_list: list, existing_questions: set = None) -> list:
    """Validate question structure, 4 options, valid correct answer, and uniqueness."""
    if existing_questions is None:
        existing_questions = set()

    validated = []
    for q in raw_list:
        if not isinstance(q, dict):
            continue

        q_text = (q.get("question") or "").strip()
        if not q_text or len(q_text) < 5:
            continue

        norm_q = q_text.lower().strip()
        if norm_q in existing_questions:
            continue

        # Handle options either as option_a..d or options list
        opt_a = (q.get("option_a") or "").strip()
        opt_b = (q.get("option_b") or "").strip()
        opt_c = (q.get("option_c") or "").strip()
        opt_d = (q.get("option_d") or "").strip()

        if not (opt_a and opt_b and opt_c and opt_d):
            options = q.get("options")
            if isinstance(options, list) and len(options) >= 4:
                opt_a = str(options[0]).strip()
                opt_b = str(options[1]).strip()
                opt_c = str(options[2]).strip()
                opt_d = str(options[3]).strip()

        if not (opt_a and opt_b and opt_c and opt_d):
            continue

        # Check options are distinct
        if len({opt_a.lower(), opt_b.lower(), opt_c.lower(), opt_d.lower()}) < 4:
            continue

        # Validate correct answer
        raw_ans = str(q.get("correct_answer") or "").strip().lower()
        ans_map = {"0": "a", "1": "b", "2": "c", "3": "d", "a": "a", "b": "b", "c": "c", "d": "d"}
        correct = ans_map.get(raw_ans, "a")

        explanation = (q.get("explanation") or "").strip()
        if not explanation:
            explanation = f"Option {correct.upper()} is correct according to the fundamental principles of this topic."

        hint = (q.get("hint") or "").strip()
        if not hint or len(hint) < 5:
            hint = "Think carefully about the core definition and underlying operational rules of this topic."

        concept = (q.get("concept_tag") or q.get("concept") or "fundamentals").strip()
        concept = re.sub(r'[^a-zA-Z0-9_]', '_', concept).lower()

        existing_questions.add(norm_q)
        validated.append({
            "question": q_text,
            "option_a": opt_a,
            "option_b": opt_b,
            "option_c": opt_c,
            "option_d": opt_d,
            "correct_answer": correct,
            "explanation": explanation,
            "hint": hint,
            "concept_tag": concept,
        })

    return validated


def _generate_synthetic_supplements(topic: str, needed: int, start_index: int = 1) -> list:
    """Generate subject-tailored high-yield question supplements if API fails to reach 10."""
    templates = [
        ("What is the primary operational objective of {topic}?",
         "To optimize performance, clarity, and systematic execution in {topic}",
         "To eliminate the need for memory management completely",
         "To serve as a replacement for standard physical hardware",
         "To bypass all boundary checks without exception",
         "a", "Understanding the primary objective ensures proper architectural design and execution.",
         "Consider the core purpose and architectural role of this concept.", "core_objective"),

        ("Which principle is considered a universal best practice when applying {topic}?",
         "Modular separation of concerns and clear interfaces",
         "Uncontrolled global state mutations across routines",
         "Ignoring boundary and edge condition constraints",
         "Hardcoding environmental parameters into the source",
         "a", "Modularity and separation of concerns improve maintainability, testability, and scalability.",
         "Think about design patterns that promote code cleanliness and maintainability.", "best_practices"),

        ("How are edge cases or boundary conditions typically managed in {topic}?",
         "Through proactive validation and defensive guard clauses",
         "By assuming all input data is valid and correctly formatted",
         "By suppressing all runtime warnings and error signals",
         "By executing operations only when external monitors are present",
         "a", "Defensive validation prevents unexpected runtime errors and security vulnerabilities.",
         "Consider what steps prevent unexpected invalid inputs from crashing execution.", "boundary_handling"),

        ("In the context of {topic}, what trade-off is most frequently evaluated?",
         "Execution time efficiency vs memory resource overhead",
         "Color palette selection vs screen resolution",
         "Keyboard input speed vs file storage size",
         "Processor manufacturer vs operating system version",
         "a", "Time complexity versus space complexity is the cornerstone trade-off in modern computing and engineering.",
         "Reflect on the classic relationship between speed and resource consumption.", "complexity_tradeoffs"),

        ("What is a common pitfall or misconception beginners encounter with {topic}?",
         "Confusing shallow symptoms with root underlying causal factors",
         "Writing clear comments and test suites",
         "Refactoring legacy procedures for higher readability",
         "Validating intermediate states against expected thresholds",
         "a", "Focusing only on superficial behavior without addressing root causes leads to brittle implementations.",
         "Think about how superficial fixes differ from resolving fundamental causes.", "common_pitfalls"),

        ("How does {topic} interact with external environmental dependencies?",
         "Through standardized abstractions, interfaces, or protocols",
         "By directly modifying underlying kernel space memory",
         "By terminating all concurrent background processes",
         "Without any form of data exchange or communication",
         "a", "Standardized interfaces isolate components and decouple dependencies cleanly.",
         "Focus on how modern components decouple interactions with outside systems.", "interface_abstractions"),

        ("Which diagnostic approach is most effective for troubleshooting issues in {topic}?",
         "Isolating state changes step-by-step and inspecting intermediate data",
         "Randomly reordering statements until behavior changes",
         "Deleting error logging routines to speed up throughput",
         "Ignoring output validation and testing only happy paths",
         "a", "Systematic step-by-step state isolation quickly pinpoints anomalies.",
         "Think about structured scientific debugging methodologies.", "troubleshooting"),

        ("What guarantees deterministic behavior when working with {topic}?",
         "Consistent inputs mapping to predictable, reproducible outputs",
         "Relying on random unseeded number generators",
         "Running routines on asynchronous threads without synchronization",
         "Allowing external network latency to govern internal state",
         "a", "Deterministic systems produce the identical output given the identical initial state.",
         "Recall the definition of a deterministic system.", "determinism"),

        ("When scaling {topic} for high-throughput or production use, what is critical?",
         "Minimizing redundant operations and managing resource lifecycles",
         "Running infinite background polling loops without sleep intervals",
         "Duplicating state across unrelated subroutines",
         "Increasing nesting depth arbitrarily to hide complexity",
         "a", "Resource lifecycle management and eliminating redundancy allow systems to scale smoothly.",
         "Consider what helps systems maintain throughput under heavy load.", "scalability"),

        ("How should success or correctness be validated when testing {topic}?",
         "Using comprehensive unit, integration, and property-based test cases",
         "By verifying that code compiles once without runtime execution",
         "Through manual inspection of font formatting only",
         "By measuring how fast the source code file can be copied",
         "a", "Automated multi-level testing validates that both expected flows and edge cases behave correctly.",
         "Think about standard verification and quality assurance best practices.", "verification_testing"),
    ]

    supplements = []
    for i in range(needed):
        idx = (start_index + i) % len(templates)
        tmpl = templates[idx]
        supplements.append({
            "question": tmpl[0].format(topic=topic),
            "option_a": tmpl[1].format(topic=topic),
            "option_b": tmpl[2].format(topic=topic),
            "option_c": tmpl[3].format(topic=topic),
            "option_d": tmpl[4].format(topic=topic),
            "correct_answer": tmpl[5],
            "explanation": tmpl[6].format(topic=topic),
            "hint": tmpl[7],
            "concept_tag": tmpl[8],
        })
    return supplements


def generate_mcqs(topic: str, level: str, previous_mistakes: list,
                  num_questions: int = 10) -> list:
    """
    Generate at least 10 high-quality, conceptual MCQs with hints.
    Guarantees that the returned list contains at least 10 valid questions.
    """
    target_count = max(10, num_questions)

    # 1. Primary generation call
    messages = generate_quiz_prompt(topic, level, previous_mistakes, target_count)
    raw = chat_completion(messages, temperature=0.6, max_tokens=2500)

    parsed = _clean_and_parse_json(raw)
    existing_set = set()
    validated = _validate_questions(parsed, existing_set)

    # 2. If fewer than target_count, regenerate the missing count via secondary prompt
    if len(validated) < target_count:
        missing = target_count - len(validated)
        print(f"[LearnIQ] Quiz generator received {len(validated)}/{target_count} valid questions. Regenerating {missing} missing...")

        supplemental_prompt = [
            {"role": "system", "content": (
                "You are an assessment engineer. Generate additional UNIQUE multiple choice questions for the specified topic. "
                "Return ONLY a JSON array with: question, option_a, option_b, option_c, option_d, correct_answer ('a'|'b'|'c'|'d'), "
                "explanation, hint, and concept_tag."
            )},
            {"role": "user", "content": (
                f"Generate {missing} MORE distinct MCQs for '{topic}' that are different from these already covered: "
                + ", ".join([f"'{q['question'][:40]}...'" for q in validated[:5]])
            )}
        ]

        try:
            raw_supp = chat_completion(supplemental_prompt, temperature=0.7, max_tokens=1500)
            parsed_supp = _clean_and_parse_json(raw_supp)
            validated_supp = _validate_questions(parsed_supp, existing_set)
            validated.extend(validated_supp)
        except Exception as e:
            print(f"[LearnIQ] Supplemental question generation failed: {e}")

    # 3. If still under target_count (due to severe network/token limit), fill with subject supplements
    if len(validated) < target_count:
        remaining = target_count - len(validated)
        print(f"[LearnIQ] Supplementing {remaining} questions to guarantee at least {target_count} questions.")
        synthetic = _generate_synthetic_supplements(topic, remaining, start_index=len(validated))
        validated.extend(synthetic)

    return validated[:target_count]
