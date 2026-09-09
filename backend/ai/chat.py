"""ai/chat.py — Short, context-aware AI chatbot responses."""

from ai.groq_client import chat_completion


def generate_chat_response(message: str, current_topic: str = None,
                            mode: str = "short", history: list = None) -> str:
    """
    Generate a chatbot response.
    mode: 'short' (default, 2-5 sentences) | 'deep' | 'example'
    history: list of {"role": "user"|"assistant", "content": str} for context
    """
    mode_instruction = {
        "short": "Respond in 2-5 sentences only. Be direct and clear. No long paragraphs.",
        "deep": "Give a thorough explanation with examples. Can be longer.",
        "example": "Give only a simple, concrete real-world example in 2-3 sentences.",
    }.get(mode, "Respond in 2-5 sentences only. Be direct and clear.")

    topic_context = f" The student is currently studying: {current_topic}." if current_topic else ""

    system_prompt = (
        f"You are LearnIQ's AI chatbot — a helpful, concise tutor assistant.{topic_context}\n"
        f"{mode_instruction}\n"
        "Never use generic ChatGPT-style long responses unless the user explicitly asks for a deep explanation."
    )

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 6 messages max to keep context window small)
    if history:
        messages.extend(history[-6:])

    messages.append({"role": "user", "content": message})

    max_tok = 150 if mode == "short" else (600 if mode == "deep" else 200)
    return chat_completion(messages, temperature=0.7, max_tokens=max_tok)
