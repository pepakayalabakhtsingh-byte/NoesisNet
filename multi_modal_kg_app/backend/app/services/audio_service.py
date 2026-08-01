import logging
import traceback
from pathlib import Path
import whisper
from app.config import settings

logger = logging.getLogger(__name__)

# Global cache for the whisper model
_WHISPER_MODEL_CACHE = None

class AudioTranscriber:
    @staticmethod
    def process(file_path: str) -> dict:
        """
        Transcribes audio using Whisper.
        Returns a dict with text, language, segments, duration_seconds.
        """
        result_dict = {
            "text": "",
            "language": "",
            "segments": [],
            "duration_seconds": None,
            "error": None
        }

        try:
            global _WHISPER_MODEL_CACHE
            if _WHISPER_MODEL_CACHE is None:
                logger.info(f"Loading Whisper model '{settings.whisper_model_size}'...")
                _WHISPER_MODEL_CACHE = whisper.load_model(settings.whisper_model_size)
                logger.info("Whisper model loaded successfully.")
            
            model = _WHISPER_MODEL_CACHE

            transcribe_opts = {
                "task": settings.whisper_task,
                "word_timestamps": settings.whisper_word_timestamps,
            }
            if settings.whisper_language:
                transcribe_opts["language"] = settings.whisper_language

            abs_path = str(Path(file_path).absolute())
            logger.info(f"Transcribing audio file: {abs_path}")
            
            result = model.transcribe(abs_path, **transcribe_opts)

            result_dict["text"] = result.get("text", "").strip()
            result_dict["language"] = result.get("language", "")
            result_dict["segments"] = result.get("segments", [])

            if result.get("segments"):
                result_dict["duration_seconds"] = result["segments"][-1]["end"]
            else:
                try:
                    from whisper import audio as w_audio
                    result_dict["duration_seconds"] = w_audio.get_audio_duration(abs_path)
                except Exception:
                    pass

            logger.info(f"Transcription complete. Language: {result_dict['language']}, Duration: {result_dict['duration_seconds']}s")
            
        except Exception as e:
            logger.error(f"Failed to transcribe {file_path}: {e}\n{traceback.format_exc()}")
            result_dict["error"] = str(e)

        return result_dict
