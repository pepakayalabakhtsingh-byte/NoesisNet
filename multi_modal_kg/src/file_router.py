"""Module for detecting file types and routing to appropriate ingestors."""
import logging
from pathlib import Path
from typing import Optional

from src.config import Config
from src.ingestion.base_ingestor import BaseIngestor
from src.ingestion.pdf_ingestor import PDFIngestor
from src.ingestion.audio_ingestor import AudioIngestor
from src.ingestion.schematic_ingestor import SchematicIngestor
from src.ingestion.table_ingestor import TableIngestor

logger = logging.getLogger(__name__)

try:
    import magic
    HAS_MAGIC = True
except ImportError as e:
    logger.warning(f"Failed to import python-magic: {e}. Falling back to extension matching only.")
    HAS_MAGIC = False

def detect_file_type(file_path: Path, config: Config) -> str:
    """
    Detects the file category using python-magic and extension fallback.
    
    Args:
        file_path (Path): Path to the file.
        config (Config): Configuration object.
        
    Returns:
        str: The category of the file ('pdf', 'audio', 'schematic', 'table', or 'unknown').
    """
    mime_type = ""
    if HAS_MAGIC:
        try:
            mime_type = magic.from_file(str(file_path), mime=True)
        except Exception as e:
            logger.warning(f"python-magic could not read MIME type for {file_path}: {e}")

    ext = file_path.suffix.lower()

    # Helper function to check if extension matches a category
    def get_category_by_ext(extension: str) -> str:
        for category, extensions in config.supported_extensions.items():
            if extension in extensions:
                return category
        return "unknown"

    # Match based on MIME type first, fallback to extension
    if mime_type:
        if "pdf" in mime_type:
            return "pdf"
        elif "audio" in mime_type:
            return "audio"
        elif "image" in mime_type:
            return "schematic"
        elif "csv" in mime_type or "excel" in mime_type or "spreadsheet" in mime_type:
            return "table"
            
    # Fallback to extension matching
    return get_category_by_ext(ext)

def route_file(file_path: Path, config: Config) -> Optional[BaseIngestor]:
    """
    Returns an instance of the appropriate ingestor based on file type.
    
    Args:
        file_path (Path): Path to the file.
        config (Config): Configuration object.
        
    Returns:
        Optional[BaseIngestor]: An ingestor instance or None if unknown.
    """
    category = detect_file_type(file_path, config)
    
    if category == "pdf":
        return PDFIngestor(file_path, config)
    elif category == "audio":
        return AudioIngestor(file_path, config)
    elif category == "schematic":
        return SchematicIngestor(file_path, config)
    elif category == "table":
        return TableIngestor(file_path, config)
    else:
        logger.warning(f"No ingestor available for category '{category}' of file {file_path}")
        return None
