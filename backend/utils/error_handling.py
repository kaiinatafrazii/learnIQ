"""
utils/error_handling.py — Decorator to wrap route handlers with consistent error responses.
"""

import functools
from flask import jsonify


def handle_errors(f):
    """Wrap a Flask route so any unhandled exception returns JSON, never HTML."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except PermissionError as e:
            return jsonify({"error": str(e)}), 403
        except LookupError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            # Log internally but send a friendly message to the client
            print(f"[ERROR] {type(e).__name__}: {e}")
            return jsonify({
                "error": "Something went wrong on our side. Please try again."
            }), 500
    return wrapper


def groq_error_handler(f):
    """Decorator specifically for routes that call Groq/AI — returns 502/503 on failure."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            err_msg = str(e)
            print(f"[GROQ / AI ERROR] {type(e).__name__}: {err_msg}")
            if "api_key" in err_msg.lower() or "authentication" in err_msg.lower():
                return jsonify({
                    "error": "Groq AI service configuration error. Please check your GROQ_API_KEY."
                }), 503
            if "rate_limit" in err_msg.lower():
                return jsonify({
                    "error": "Groq AI service rate limit reached. Please wait a moment and retry."
                }), 429
            return jsonify({
                "error": "The AI tutor is having trouble responding. Please retry."
            }), 502
    return wrapper


# Aliases for backward compatibility
ai_error_handler = groq_error_handler
openai_error_handler = groq_error_handler

