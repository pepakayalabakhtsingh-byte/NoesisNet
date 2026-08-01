"""PDF Ingestor module."""
import logging
from src.ingestion.base_ingestor import BaseIngestor

logger = logging.getLogger(__name__)

class PDFIngestor(BaseIngestor):
    """Ingestor for PDF documents."""

    def process(self) -> dict:
        """
        Process the PDF file. Currently a placeholder.
        
        Returns:
            dict: The file's data entry including metadata.
        """
        logger.info(f"Processing PDF file: {self.file_path.name}")
        metadata = super().process()
        metadata["pages"] = None  # Placeholder for future extraction
        return metadata
