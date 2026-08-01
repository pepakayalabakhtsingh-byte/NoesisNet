"""Configuration module."""
import yaml
from pathlib import Path

class Config:
    """Configuration class that loads settings from config.yaml."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance

    def _load_config(self):
        """Loads the YAML configuration file."""
        # Find project root relative to this file's location (src/config.py)
        project_root = Path(__file__).resolve().parent.parent
        config_path = project_root / "config" / "config.yaml"

        with open(config_path, "r", encoding="utf-8") as f:
            self._config_data = yaml.safe_load(f)

        # Resolve paths to absolute paths based on project root
        self.data_dir = project_root / self._config_data.get("data_dir", "data")
        self.output_dir = project_root / self._config_data.get("output_dir", "output")
        self.log_dir = project_root / self._config_data.get("log_dir", "logs")
        self.log_level = self._config_data.get("log_level", "INFO")
        self.supported_extensions = self._config_data.get("supported_extensions", {})

        # Whisper configuration
        whisper_conf = self._config_data.get('whisper', {})
        self.whisper_model_size = whisper_conf.get('model_size', 'base')
        self.whisper_language = whisper_conf.get('language', None)
        self.whisper_task = whisper_conf.get('task', 'transcribe')
        self.whisper_word_timestamps = whisper_conf.get('word_timestamps', True)

# Singleton instance
config = Config()
