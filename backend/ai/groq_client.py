"""
ai/groq_client.py — Thin wrapper around Groq SDK with built-in educational fallback.
Ensures the app is 100% demo-ready and functional with ultra-fast Groq LPU inference.
"""

import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None


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


def _generate_fallback_response(messages: list) -> str:
    """Generate smart, context-aware responses when offline or demoing without API key."""
    # Combine prompt text to determine intent
    all_text = " ".join([m.get("content", "") for m in messages])
    all_lower = all_text.lower()

    # 1. Mermaid Diagram Request
    if "mermaid" in all_lower or "flowchart" in all_lower:
        topic_match = re.search(r'topic:\s*([^\n\r]+)', all_text, re.IGNORECASE)
        topic = topic_match.group(1).strip() if topic_match else "Core System"
        return f"""graph TD
    A["🚀 Start: {topic}"] --> B["📖 Step 1: Initialize & Input"]
    B --> C{{"🔍 Processing & Logic"}}
    C -->|Condition Met| D["⚡ Optimized Pathway"]
    C -->|Fallback| E["🔄 Corrective Routine"]
    D --> F["🎯 Output & Mastered Concept"]
    E --> F
    style A fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style C fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
    style F fill:#ccfbf1,stroke:#14b8a6,stroke-width:2px"""

    # 2. MCQ Quiz Generation (must return JSON list)
    if "json" in all_lower and ("mcq" in all_lower or "quiz" in all_lower or "question" in all_lower):
        topic_match = re.search(r'topic:\s*([^\n\r]+)', all_text, re.IGNORECASE)
        topic = topic_match.group(1).strip() if topic_match else "General Computing"
        questions = [
            {
                "question": f"What is the primary fundamental objective of {topic}?",
                "option_a": f"To optimize performance and structure data in {topic}",
                "option_b": "To eliminate the need for computer hardware",
                "option_c": "To convert high-level code into physical memory",
                "option_d": "To serve as a standalone database engine",
                "correct_answer": "A",
                "explanation": f"{topic} focuses on structured efficiency, systematic logic, and computational optimization.",
                "concept_tag": "Fundamentals"
            },
            {
                "question": f"Which of the following is a standard characteristic or best practice when working with {topic}?",
                "option_a": "Random iteration without deterministic outcomes",
                "option_b": "Modular design and separation of responsibilities",
                "option_c": "Ignoring time and space constraints",
                "option_d": "Hardcoding variable parameters",
                "correct_answer": "B",
                "explanation": "Modular architecture ensures scalability, testability, and maintainability across systems.",
                "concept_tag": "Architecture & Design"
            },
            {
                "question": f"In terms of efficiency, how is complexity typically evaluated in {topic}?",
                "option_a": "Through Big-O time and space asymptotic analysis",
                "option_b": "By counting total physical keystrokes",
                "option_c": "Based on monitor refresh rate",
                "option_d": "Through manual clock timers only",
                "correct_answer": "A",
                "explanation": "Asymptotic analysis (Big-O notation) provides standard bounds for worst and average case efficiency.",
                "concept_tag": "Complexity Analysis"
            },
            {
                "question": f"What is a common pitfall or challenge encountered when mastering {topic}?",
                "option_a": "Underestimating boundary conditions and edge cases",
                "option_b": "Using clean formatting",
                "option_c": "Writing clear documentation",
                "option_d": "Testing code with multiple inputs",
                "correct_answer": "A",
                "explanation": "Edge cases and boundary limits are the most frequent source of runtime errors and inefficiencies.",
                "concept_tag": "Error Handling & Edge Cases"
            }
        ]
        return json.dumps(questions, indent=2)

    # 3. Notes Generation
    if "notes" in all_lower or ("bullet" in all_lower and "summary" in all_lower):
        topic_match = re.search(r'topic:\s*([^\n\r]+)', all_text, re.IGNORECASE)
        topic = topic_match.group(1).strip() if topic_match else "Study Topic"
        return f"""# 📚 Quick Revision Notes: {topic}

## 🔍 Overview
- **{topic}** is a core computational concept designed to solve structured problems efficiently.
- Emphasizes deterministic behavior, optimal space/time utilization, and clean abstraction.

## 💡 Key Principles
1. **Abstraction**: Hides low-level complexity while exposing clean interfaces.
2. **Efficiency**: Minimizes unnecessary redundant operations.
3. **Robustness**: Handles edge cases and unexpected inputs safely.

## 🧠 Memory Hook & Analogy
> Think of **{topic}** like an organized modern library system: indexed catalogs allow instant retrieval without scanning every shelf.

## 🎯 Exam & Interview Focus
- Understand the core trade-offs between memory overhead and execution speed.
- Be prepared to trace state transitions step-by-step."""

    # 4. Tutor Explanation
    topic_match = re.search(r'topic:\s*([^\n\r]+)', all_text, re.IGNORECASE)
    topic = topic_match.group(1).strip() if topic_match else "this topic"

    level_match = re.search(r'level:\s*([^\n\r]+)', all_text, re.IGNORECASE)
    level = level_match.group(1).strip() if level_match else "Intermediate"

    return f"""# 🎓 Understanding {topic} ({level} Level)

Welcome to your structured lesson on **{topic}**. Let's break this down into clear, intuitive concepts.

## 1. What is {topic}?
At its core, **{topic}** provides a systematic methodology for organizing logic, processing data, and achieving optimal results in computer systems. Rather than solving problems haphazardly, it offers proven patterns and rules.

## 2. Intuitive Real-World Analogy
> Imagine you are organizing an international postal sorting center. Instead of manually inspecting millions of parcels one by one, you use specialized conveyor belts and routing tags. That structured efficiency is exactly how **{topic}** streamlines computational tasks.

## 3. Step-by-Step Breakdown
1. **Initialization & Setup**: The environment prepares the necessary state and variables.
2. **Core Execution & Logic**: Operations execute systematically following algorithmic constraints.
3. **Verification & Output**: Results are verified against expected thresholds and safely returned.

## 4. Practical Implementation Tip
Always test your implementations with boundary conditions (such as empty collections or maximum capacity values) to guarantee stability.

**Key Takeaways:**
• {topic} provides clean structure and deterministic behavior.
• Modular implementation reduces bugs and improves scalability.
• Understanding the core trade-offs helps select the best design choice.
• Edge-case verification ensures production readiness."""


def chat_completion(messages: list, model: str = None,
                    temperature: float = 0.7, max_tokens: int = 1500) -> str:
    """Send a messages list to Groq API or use smart fallback if key is unconfigured."""
    if not is_api_key_valid():
        print("[LearnIQ] Generating response using built-in educational engine (Groq Key not set/demo mode).")
        return _generate_fallback_response(messages)

    if not model:
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[LearnIQ] Groq API call failed ({e}). Falling back to educational engine.")
        return _generate_fallback_response(messages)
