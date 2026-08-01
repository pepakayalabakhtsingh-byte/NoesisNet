"""Logging configuration module."""
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from src.config import Config

def setup_logging(config: Config) -> None:
    """
    Configures the root logger to output to both console and a rotating file.
    
    Args:
        config (Config): The configuration object containing log_dir and log_level.
    """
    # Ensure log directory exists
    config.log_dir.mkdir(parents=True, exist_ok=True)
    log_file_path = config.log_dir / "app.log"

    # Define log format
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    formatter = logging.Formatter(log_format)

    # Root logger setup
    root_logger = logging.getLogger()
    
    # Convert string log level from config to logging module constants
    level = getattr(logging, config.log_level.upper(), logging.INFO)
    root_logger.setLevel(level)

    # Clear existing handlers to avoid duplicates if called multiple times
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)
    root_logger.addHandler(console_handler)

    # Rotating file handler (e.g., 5MB per file, max 5 files)
    file_handler = RotatingFileHandler(
        log_file_path, maxBytes=5*1024*1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(level)
    root_logger.addHandler(file_handler)
