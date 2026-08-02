import logging
import traceback
from pathlib import Path
from huggingface_hub import InferenceClient
from app.config import settings

logger = logging.getLogger(__name__)

class AudioTranscriber:
    @staticmethod
    def process(file_path: str) -> dict:
        """
        Transcribes audio using Hugging Face Inference API.
        """
        result_dict = {
            "text": "",
            "language": "en",
            "segments": [],
            "duration_seconds": None,
            "error": None
        }

        try:
            abs_path = str(Path(file_path).absolute())
            logger.info(f"Transcribing audio file via Hugging Face: {abs_path}")
            
            client = InferenceClient(api_key=settings.hf_api_key)
            
            # Hugging Face ASR API usage
            # openai/whisper-base.en is a fast and robust model for transcription
            result = client.automatic_speech_recognition(
                audio=abs_path,
                model="openai/whisper-base.en"
            )
            
            result_dict["text"] = result.text.strip()
            logger.info("Transcription complete.")
            
        except Exception as e:
            logger.error(f"Failed to transcribe {file_path}: {e}\n{traceback.format_exc()}")
            result_dict["error"] = str(e)

        return result_dict
