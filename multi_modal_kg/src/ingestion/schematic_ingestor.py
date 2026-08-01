"""Schematic Ingestor module."""
import logging
from src.ingestion.base_ingestor import BaseIngestor

logger = logging.getLogger(__name__)

class SchematicIngestor(BaseIngestor):
    """Ingestor for schematic and diagram images."""

    def process(self) -> dict:
        """
        Process the schematic file. Currently a placeholder.
        
        Returns:
            dict: The file's data entry including metadata.
        """
        logger.info(f"Processing schematic file: {self.file_path.name}")
        metadata = super().process()
        metadata["dimensions"] = None  # Placeholder for future extraction
        return metadata
