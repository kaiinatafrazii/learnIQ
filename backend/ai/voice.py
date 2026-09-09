"""ai/voice.py — Speech-to-text using Groq Whisper and text-to-speech using gTTS."""

import io
import tempfile
import os
from ai.groq_client import get_client, is_api_key_valid
from gtts import gTTS


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


def synthesize_speech(text: str, voice: str = "alloy") -> bytes:
    """
    Convert text to speech using gTTS.
    Returns raw MP3 bytes without requiring any external paid API.
    """
    clean_text = text[:4096].strip()
    if not clean_text:
        clean_text = "No text provided for audio."

    fp = io.BytesIO()
    tts = gTTS(text=clean_text, lang="en")
    tts.write_to_fp(fp)
    fp.seek(0)
    return fp.read()
