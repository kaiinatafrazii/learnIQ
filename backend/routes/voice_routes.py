"""routes/voice_routes.py — Speech-to-text and Text-to-speech endpoints."""

import base64
from flask import Blueprint, request, jsonify, g
from ai.voice import transcribe_audio, synthesize_speech
from routes.middleware import require_auth
from utils.error_handling import handle_errors, openai_error_handler

voice_bp = Blueprint("voice", __name__)


@voice_bp.route("/api/voice/transcribe", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def transcribe():
    """
    Accepts multipart form data with an 'audio' file.
    Returns: { text: str }
    """
    if "audio" not in request.files:
        raise ValueError("No audio file provided.")

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()
    filename = audio_file.filename or "recording.webm"

    text = transcribe_audio(audio_bytes, filename)
    return jsonify({"text": text})


@voice_bp.route("/api/voice/speak", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def speak():
    """
    Body: { text: str, voice?: str }
    Returns: { audio_base64: str, format: 'mp3' }
    """
    data = request.get_json()
    text = (data.get("text") or "").strip()
    voice = data.get("voice", "alloy")

    if not text:
        raise ValueError("Text cannot be empty.")

    audio_bytes = synthesize_speech(text, voice)
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
    return jsonify({"audio_base64": audio_b64, "format": "mp3"})
