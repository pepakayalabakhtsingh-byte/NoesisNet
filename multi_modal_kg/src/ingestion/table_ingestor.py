"""Table Ingestor module."""
import logging
from src.ingestion.base_ingestor import BaseIngestor

logger = logging.getLogger(__name__)

class TableIngestor(BaseIngestor):
    """Ingestor for tabular data files (CSV, Excel)."""

    def process(self) -> dict:
        """
        Process the table file. Currently a placeholder.
        
        Returns:
            dict: The file's data entry including metadata.
        """
        logger.info(f"Processing table file: {self.file_path.name}")
        metadata = super().process()
        metadata["rows"] = None  # Placeholder for future extraction
        return metadata
