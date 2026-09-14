"""
ai/groq_client.py — High-performance Groq client with 20+ model cascade fallbacks
and subject-specialized pedagogical reasoning.
"""

import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None

# Top 20+ Groq models ranked for speed, reasoning quality, and availability
DEFAULT_GROQ_MODELS = [
    "openai/gpt-oss-120b",           # 120B parameter high-precision reasoning model
    "groq/compound",                 # Groq compound architecture
    "qwen/qwen3.8-27b",              # Qwen 3.8 27B on Groq LPU
    "openai/gpt-oss-20b",            # High speed 20B model
    "groq/compound-mini",            # Lightweight compound model
    "qwen/qwen3.6-27b",              # Qwen 3.6 27B
    "llama-3.3-70b-versatile",       # Meta Llama 3.3 70B flagship
    "llama-3.1-70b-versatile",       # Meta Llama 3.1 70B
    "llama-3.1-8b-instant",          # Meta Llama 3.1 8B instant
    "deepseek-r1-distill-llama-70b", # DeepSeek R1 70B reasoning
    "deepseek-r1-distill-qwen-32b",  # DeepSeek R1 32B
    "qwen-2.5-32b",                  # Qwen 2.5 32B
    "qwen-2.5-coder-32b",            # Qwen 2.5 Coder
    "llama-3.2-3b-preview",          # Llama 3.2 3B
    "llama-3.2-1b-preview",          # Llama 3.2 1B
    "llama-3.2-11b-vision-preview",  # Llama 3.2 11B
    "llama-3.2-90b-vision-preview",  # Llama 3.2 90B
    "llama3-70b-8192",               # Llama 3 70B legacy
    "llama3-8b-8192",                # Llama 3 8B legacy
    "mixtral-8x7b-32768",            # Mixtral 8x7B MoE
    "gemma2-9b-it",                  # Google Gemma 2 9B
    "allam-2-7b",                    # Allam 2 7B
]


def is_api_key_valid() -> bool:
    """Check if a real, configured Groq API key is present."""
    api_key = (os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY", "")).strip()
    if not api_key:
        return False
    if "your-key" in api_key.lower() or "gsk_your" in api_key.lower() or "sk-your" in api_key.lower() or len(api_key) < 15:
        return False
    return True


def get_client() -> Groq:
    """Return a singleton Groq client instance."""
    global _client
    if _client is None:
        api_key = (os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY", "")).strip()
        if not is_api_key_valid():
            raise EnvironmentError("GROQ_API_KEY is not configured with a valid key.")
        _client = Groq(api_key=api_key)
    return _client


def clean_model_output(text: str) -> str:
    """Strip internal reasoning tags, stray asterisks, double quotes, and format equations cleanly."""
    if not text:
        return ""
    # Strip <think>...</think>
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()

    # Clean double single quotes ''word'' -> word
    cleaned = re.sub(r"''([^'\n]+)''", r"\1", cleaned)
    cleaned = cleaned.replace("''", "")

    # Clean LaTeX artifacts in formulas
    cleaned = cleaned.replace(r"\times", "×")
    cleaned = cleaned.replace(r"\cdot", "·")
    cleaned = cleaned.replace(r"\pm", "±")
    cleaned = cleaned.replace(r"\approx", "≈")
    cleaned = cleaned.replace(r"\le", "≤")
    cleaned = cleaned.replace(r"\ge", "≥")
    cleaned = cleaned.replace(r"\neq", "≠")
    cleaned = cleaned.replace(r"\sqrt", "√")
    cleaned = re.sub(r"\$\$(.*?)\$\$", r"\1", cleaned)
    cleaned = re.sub(r"\$(.*?)\$", r"\1", cleaned)

    # Clean asterisks / star marks
    cleaned = re.sub(r"\*\*([^*\n]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"\1", cleaned)

    return cleaned.strip()


def detect_subject_category(text: str) -> str:
    """Classify the subject domain to adapt tone, format, and examples."""
    t = text.lower()
    if any(k in t for k in ["code", "python", "javascript", "algorithm", "data structure", "pointer",
                           "tree", "graph", "sql", "database", "api", "array", "react", "html", "css",
                           "backend", "frontend", "git", "linux", "compiler", "networking", "oop", "docker"]):
        return "computer_science"
    if any(k in t for k in ["cell", "dna", "photosynthesis", "organism", "mitosis", "meiosis", "heart",
                           "blood", "neuron", "evolution", "ecosystem", "protein", "enzyme", "bacteria", "biology"]):
        return "biology"
    if any(k in t for k in ["reaction", "molecule", "atom", "acid", "base", "periodic", "bond",
                           "electron", "oxidation", "equilibrium", "organic chemistry", "thermodynamics", "chemistry"]):
        return "chemistry"
    if any(k in t for k in ["velocity", "gravity", "force", "newton", "quantum", "relativity",
                           "kinetic", "friction", "current", "voltage", "wave", "optics", "magnetism", "physics"]):
        return "physics"
    if any(k in t for k in ["derivative", "integral", "matrix", "vector", "probability", "statistics",
                           "geometry", "algebra", "trigonometry", "theorem", "equation", "calculus", "fraction"]):
        return "mathematics"
    if any(k in t for k in ["war", "empire", "revolution", "treaty", "constitution", "dynasty",
                           "century", "independence", "monarchy", "civilization", "president", "history"]):
        return "history"
    if any(k in t for k in ["inflation", "gdp", "market", "demand", "supply", "currency",
                           "fiscal", "monetary", "shares", "investment", "economics", "finance"]):
        return "economics"
    return "general"


def _generate_fallback_response(messages: list) -> str:
    """Generate smart, subject-specialized context-aware responses when offline."""
    all_text = " ".join([m.get("content", "") for m in messages])
    all_lower = all_text.lower()

    # 1. Mermaid Diagram Request
    if "mermaid" in all_lower or "flowchart" in all_lower:
        topic_match = re.search(r'topic:\s*([^\n\r]+)', all_text, re.IGNORECASE)
        topic = topic_match.group(1).strip() if topic_match else "Core System"
        category = detect_subject_category(topic)

        if category == "computer_science":
            return f"""graph TD
    A["🚀 Start: {topic}"] --> B["📥 Input & Initialization"]
    B --> C{{"⚙️ Validation & Logic Check"}}
    C -->|Valid| D["⚡ Algorithmic Processing"]
    C -->|Invalid| E["⚠️ Error Handling / Exception"]
    D --> F["🎯 Optimized Return Result"]
    E --> F
    style A fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style C fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style F fill:#ccfbf1,stroke:#14b8a6,stroke-width:2px"""
        elif category in ["biology", "chemistry"]:
            return f"""graph TD
    A["🌱 Initial Reactants / State: {topic}"] --> B["⚡ Activation / Enzyme Binding"]
    B --> C["🔬 Intermediate Transition Stage"]
    C --> D["✨ Primary Product Synthesis"]
    D --> E["♻️ Cycle Regeneration / Byproducts"]
    style A fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style C fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style D fill:#e0e7ff,stroke:#6366f1,stroke-width:2px"""
        elif category in ["physics", "mathematics"]:
            return f"""graph TD
    A["📐 Fundamental Principle: {topic}"] --> B["🔢 Formulate Equations & Variables"]
    B --> C["⚖️ Apply Conservation & Boundary Conditions"]
    C --> D["🎯 Exact Solution / Proof"]
    style A fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style C fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style D fill:#dcfce7,stroke:#16a34a,stroke-width:2px"""
        else:
            return f"""graph TD
    A["🏛️ Origin / Background: {topic}"] --> B["⚔️ Catalyst & Key Events"]
    B --> C["🔄 Pivotal Turning Point"]
    C --> D["🌐 Long-term Impact & Modern Outcome"]
    style A fill:#f1f5f9,stroke:#64748b,stroke-width:2px
    style B fill:#fee2e2,stroke:#ef4444,stroke-width:2px
    style D fill:#dcfce7,stroke:#16a34a,stroke-width:2px"""

    # 2. MCQ Quiz Generation
    if "json" in all_lower and ("mcq" in all_lower or "quiz" in all_lower or "question" in all_lower):
        topic_match = re.search(r'topic:\s*([^\n\r]+)', all_text, re.IGNORECASE)
        topic = topic_match.group(1).strip() if topic_match else "General Topic"
        questions = [
            {
                "question": f"What is the central concept behind {topic}?",
                "option_a": f"The systematic mechanism governing how {topic} operates in its domain",
                "option_b": "A random phenomenon with no predictable properties",
                "option_c": "An obsolete method that has been completely discarded",
                "option_d": "A naming convention only with no functional significance",
                "correct_answer": "A",
                "explanation": f"{topic} relies on structured principles and demonstrable cause-and-effect rules.",
                "concept_tag": "core_fundamentals"
            },
            {
                "question": f"Which factor is crucial when analyzing {topic}?",
                "option_a": "Disregarding external environmental constraints",
                "option_b": "Understanding underlying rules, boundary conditions, and dependencies",
                "option_c": "Relying purely on intuition without measurement",
                "option_d": "Avoiding documentation and verification",
                "correct_answer": "B",
                "explanation": "Clear understanding of parameters and constraints is essential for accurate problem solving.",
                "concept_tag": "mechanisms_and_rules"
            },
            {
                "question": f"What is a common pitfall or misconception regarding {topic}?",
                "option_a": "Testing under varied conditions",
                "option_b": "Confusing superficial symptoms with root underlying causes",
                "option_c": "Checking formulas against real-world observations",
                "option_d": "Breaking complex problems into smaller subcomponents",
                "correct_answer": "B",
                "explanation": "A frequent mistake is failing to identify the root mechanism driving the outcome.",
                "concept_tag": "analysis_and_misconceptions"
            },
            {
                "question": f"How is success or correctness evaluated in the context of {topic}?",
                "option_a": "Through deterministic, verifiable results and standard metrics",
                "option_b": "By whichever option is easiest to write down",
                "option_c": "Without reference to empirical evidence or logic",
                "option_d": "By arbitrary voting only",
                "correct_answer": "A",
                "explanation": "Verifiable outcomes and standardized evaluation metrics guarantee rigor.",
                "concept_tag": "evaluation_and_application"
            }
        ]
        return json.dumps(questions, indent=2)

    # 3. Notes Generation
    if "notes" in all_lower or ("bullet" in all_lower and "summary" in all_lower):
        topic_match = re.search(r'topic:\s*([^\n\r]+)', all_text, re.IGNORECASE)
        topic = topic_match.group(1).strip() if topic_match else "Study Topic"
        category = detect_subject_category(topic)
        return f"""# 📚 Master Notes: {topic}

## 🔍 Core Definition
{topic} represents a fundamental concept in {category.replace('_', ' ').title()}. It provides the systematic principles required to understand and apply this phenomenon effectively.

## 💡 Key Pillars & Principles
- Core Foundation: The starting premises and governing rules for {topic}.
- Operational Mechanism: The step-by-step process and interactions that generate results.
- Practical Application: How this concept directly solves problems or manifests in practice.

## 🧠 Intuitive Picture
> 💡 Think of {topic} like a well-calibrated engine: every component has an exact role, and altering one variable predictably shifts the overall output.

## 🎯 Exam & Rapid Recall
- Always identify the primary inputs, governing laws, and final outputs.
- Watch out for edge cases and boundary conditions.
- Remember the standard formulas and rules associated with this domain."""

    # 4. Tutor Explanation
    topic_match = re.search(r'topic:\s*([^\n\r]+)', all_text, re.IGNORECASE)
    topic = topic_match.group(1).strip() if topic_match else "this topic"

    level_match = re.search(r'level:\s*([^\n\r]+)', all_text, re.IGNORECASE)
    level = level_match.group(1).strip() if level_match else "Intermediate"
    category = detect_subject_category(topic)

    return f"""# 🎓 {topic} ({level.title()} Level)

Welcome to your specialized lesson on {topic}. Let us examine this concept through first principles, intuitive analogies, and clear step-by-step breakdowns.

## 💡 The Big Picture
In {category.replace('_', ' ').title()}, {topic} is a cornerstone concept that explains how specific inputs, principles, and rules combine to produce consistent, predictable results. Understanding it allows you to solve advanced problems with confidence.

## ⚙️ How It Works & Core Mechanism
1. Core Setup: The starting state and foundational conditions needed.
2. Dynamic Transformation: The critical calculation or operational step that drives the system.
3. Final Resolution: The stable end state and verification of results.

## 🌍 Real-World Application
> 💡 Think of it this way: Just as a precision clockwork mechanism requires coordinated gears and balanced tension to keep perfect time, {topic} coordinates its underlying principles to achieve its final outcome.

## ⚠️ Common Traps & Exam Tips
Focus on the causal mechanism and fundamental relationships rather than rote memorization. Test your understanding on edge cases and standard problem variations.

Key Takeaways:
- Point 1: Understand the core definition and purpose of {topic}.
- Point 2: Focus on the causal mechanism and step-by-step flow.
- Point 3: Master the key formulas and variable relationships.
- Point 4: Apply the concept to real-world practical scenarios.
- Point 5: Avoid confusing superficial symptoms with the root governing principle."""


def chat_completion(messages: list, model: str = None,
                    temperature: float = 0.7, max_tokens: int = 1500) -> str:
    """
    Send messages to Groq API with an automatic 20+ model cascade fallback.
    If the selected model fails (404, rate limits, deprecation, downtime),
    it automatically transitions to the next available model in the chain.
    """
    if not is_api_key_valid():
        print("[LearnIQ] Generating response using built-in educational engine (Groq Key not set/demo mode).")
        return _generate_fallback_response(messages)

    # Build candidate models queue prioritizing user-selected/env model first
    preferred_env_model = os.getenv("GROQ_MODEL", "").strip()
    candidates = []
    if model:
        candidates.append(model)
    if preferred_env_model and preferred_env_model not in candidates:
        candidates.append(preferred_env_model)

    for m in DEFAULT_GROQ_MODELS:
        if m not in candidates:
            candidates.append(m)

    client = None
    try:
        client = get_client()
    except Exception as e:
        print(f"[LearnIQ] Could not initialize Groq client: {e}. Using educational engine.")
        return _generate_fallback_response(messages)

    # Cascade through candidates
    last_error = None
    for candidate_model in candidates:
        try:
            # Clean empty messages or unexpected roles if any
            clean_messages = [{"role": m.get("role", "user"), "content": m.get("content", "")}
                              for m in messages if m.get("content")]

            response = client.chat.completions.create(
                model=candidate_model,
                messages=clean_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            raw_content = response.choices[0].message.content or ""
            cleaned = clean_model_output(raw_content)
            if cleaned:
                # Log successful model only if fell back
                if candidate_model != candidates[0]:
                    print(f"[LearnIQ] Successfully served response via fallback model: {candidate_model}")
                return cleaned
        except Exception as e:
            last_error = e
            # Ignore and cascade to next model
            print(f"[LearnIQ] Model '{candidate_model}' unavailable ({str(e)[:70]}). Falling back to next...")
            continue

    print(f"[LearnIQ] All {len(candidates)} Groq models failed. Last error: {last_error}. Using educational engine.")
    return _generate_fallback_response(messages)
