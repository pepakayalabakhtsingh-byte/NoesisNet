import logging
from pathlib import Path
from .base_ingestor import BaseIngestor
import whisper
import traceback

logger = logging.getLogger(__name__)

# Module-level cache for the Whisper model to avoid reloading for each file.
_WHISPER_MODEL_CACHE = None

class AudioIngestor(BaseIngestor):
    def process(self) -> dict:
        """
        Override base process to transcribe audio using Whisper.
        Returns metadata dict including transcription, segments, language, and duration.
        """
        # Start with basic metadata from base
        entry = self.extract_metadata()

        try:
            # --- Load model (cached globally) ---
            global _WHISPER_MODEL_CACHE
            if _WHISPER_MODEL_CACHE is None:
                model_size = self.config.whisper_model_size
                logger.info(f"Loading Whisper model '{model_size}' for the first time (this may download weights)...")
                _WHISPER_MODEL_CACHE = whisper.load_model(model_size)
                logger.info(f"Whisper model '{model_size}' loaded successfully.")
            model = _WHISPER_MODEL_CACHE

            # --- Prepare transcription options ---
            transcribe_opts = {
                "task": self.config.whisper_task,
                "word_timestamps": self.config.whisper_word_timestamps,
            }
            if self.config.whisper_language:
                transcribe_opts["language"] = self.config.whisper_language

            # --- Transcribe ---
            file_abs_path = str(self.file_path.absolute())
            logger.info(f"Transcribing audio file: {self.file_path}")
            result = model.transcribe(file_abs_path, **transcribe_opts)

            # --- Extract results ---
            entry["text"] = result.get("text", "").strip()
            entry["language"] = result.get("language", "")
            entry["segments"] = result.get("segments", [])  # list of dicts
            # Compute duration from segments or use file metadata
            if result.get("segments"):
                duration = result["segments"][-1]["end"]
            else:
                # Fallback: try to get duration from whisper's audio loader
                try:
                    import whisper.audio as w_audio
                    audio_info = w_audio.get_audio_duration(file_abs_path)
                    duration = audio_info
                except Exception:
                    duration = None
            entry["duration_seconds"] = duration

            logger.info(f"Transcription complete for {self.file_path.name} (language: {entry['language']}, duration: {duration:.1f}s)")
        except Exception as e:
            logger.error(f"Failed to transcribe {self.file_path}: {e}\n{traceback.format_exc()}")
            # Ensure text is empty on failure, and add an error note
            entry["text"] = ""
            entry["language"] = ""
            entry["segments"] = []
            entry["duration_seconds"] = None
            entry["error"] = str(e)

        return entry
