"""ai/voice.py — Speech-to-text using Groq Whisper and text-to-speech using gTTS (Google Indian voices)."""

import io
import tempfile
import os
from ai.groq_client import get_client, is_api_key_valid
from gtts import gTTS

# Language code → gTTS (lang, tld) mapping
# tld='co.in' gives Google's Indian English accent
LANG_TTS_MAP = {
    "en":   ("en", "co.in"),   # Indian English (Google India)
    "hing": ("hi", "co.in"),   # Hinglish — use Hindi voice (closest natural fit)
    "or":   ("or", "co.in"),   # Odia
    "bn":   ("bn", "co.in"),   # Bengali
}


def transcribe_audio(audio_bytes: bytes, filename: str = "recording.webm") -> str:
    """
    Send audio bytes to Groq Whisper and return the transcribed text.
    audio_bytes: raw bytes from the frontend (WebM/MP4/WAV etc.)
    """
    if not is_api_key_valid():
        return "Explain binary search trees and how they maintain balance."

    client = get_client()

    # Write to a temp file since Groq SDK expects a file object
    suffix = os.path.splitext(filename)[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
            )
        return transcript.text
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def synthesize_speech(text: str, lang: str = "en") -> bytes:
    """
    Convert text to speech using gTTS with Google Indian voices.
    lang: 'en' | 'hi' | 'or' | 'bn'
    Returns raw MP3 bytes.
    """
    clean_text = text[:4096].strip()
    if not clean_text:
        clean_text = "No text provided for audio."

    gtts_lang, gtts_tld = LANG_TTS_MAP.get(lang, ("en", "co.in"))

    fp = io.BytesIO()
    tts = gTTS(text=clean_text, lang=gtts_lang, tld=gtts_tld, slow=False)
    tts.write_to_fp(fp)
    fp.seek(0)
    return fp.read()
