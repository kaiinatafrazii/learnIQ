"""
ai/chat.py — Subject-adaptive, intelligent AI Chatbot for LearnIQ.
Responds naturally across any academic discipline and seamlessly adapts to Hinglish/multilingual queries.
"""

from ai.groq_client import chat_completion


def generate_chat_response(message: str, current_topic: str = None,
                            mode: str = "short", history: list = None) -> str:
    """
    Generate a subject-specialized chatbot response.
    mode: 'short' (default, 3-6 clear sentences) | 'deep' | 'example'
    history: list of {"role": "user"|"assistant", "content": str} for conversational memory
    """
    mode_instructions = {
        "short": (
            "Provide a crisp, direct, and insightful response (3-6 sentences). "
            "Get straight to the point without introductory fluff or pleasantries."
        ),
        "deep": (
            "Provide a thorough, comprehensive pedagogical explanation. "
            "Include step-by-step logic, code/formulas if relevant, and practical use-cases."
        ),
        "example": (
            "Explain through an intuitive, concrete real-world example and analogy (3-5 sentences)."
        ),
    }
    mode_instruction = mode_instructions.get(mode, mode_instructions["short"])

    topic_context = f"\nCurrent Topic of Study: '{current_topic}'." if current_topic else ""

    system_prompt = f"""You are LearnIQ's elite AI Tutor & Learning Companion.{topic_context}
Your goal is to answer the student's question with pedagogical excellence, tailoring your response directly to the specific subject domain:

DOMAIN SPECIALIZATION:
- Computer Science / Coding: Provide clean code snippets or algorithmic logic with edge-case awareness.
- Mathematics / Quantitative: Break down steps clearly with formulas and intuitive numerical intuition.
- Physics / Chemistry: Explain the governing physical laws and molecular/physical mechanisms.
- Biology / Medicine: Detail the biological processes and pathways clearly.
- History / Commerce / Social Sciences: Connect cause and effect, market dynamics, or historical context.
- Language / Hinglish queries: If the student writes in Hindi or conversational Hinglish (e.g. "bhai ye samjha do", "kya hota hai"), reply in that same natural, friendly Hinglish/English mix so they understand instantly.

STYLE RULES:
- {mode_instruction}
- Never say 'As an AI language model' or 'Sure! I would be glad to help'.
- Always deliver high-value, clear explanations that build long-term retention."""

    messages = [{"role": "system", "content": system_prompt}]

    # Conversation history (last 8 messages for context)
    if history:
        for msg in history[-8:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ["user", "assistant", "system"] and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    # Adequate token limits so responses are never truncated mid-sentence
    token_limits = {
        "short": 450,
        "deep": 1200,
        "example": 500,
    }
    max_tokens = token_limits.get(mode, 450)

    return chat_completion(messages, temperature=0.7, max_tokens=max_tokens)
