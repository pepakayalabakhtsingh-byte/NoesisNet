"""Base ingestor module."""
from abc import ABC, abstractmethod
from pathlib import Path
from datetime import datetime
import mimetypes
import json
import logging
from src.config import Config

logger = logging.getLogger(__name__)

class BaseIngestor(ABC):
    """Abstract base class for all file ingestors."""

    def __init__(self, file_path: Path, config: Config):
        """
        Initialize the ingestor.
        
        Args:
            file_path (Path): Path to the file to be ingested.
            config (Config): Configuration object.
        """
        self.file_path = file_path
        self.config = config

    def extract_metadata(self) -> dict:
        """
        Extracts basic metadata about the file.
        
        Returns:
            dict: Dictionary containing filename, path, size_bytes, modified_time, mime_type, and category.
        """
        stat = self.file_path.stat()
        
        # Try to get mime type using mimetypes as a basic fallback
        # file_router already did magic, but here we just need a string to store
        mime_type, _ = mimetypes.guess_type(str(self.file_path))
        if not mime_type:
            mime_type = "application/octet-stream"
            
        # Determine category based on config
        category = "unknown"
        ext = self.file_path.suffix.lower()
        for cat, exts in self.config.supported_extensions.items():
            if ext in exts:
                category = cat
                break
                
        # Path relative to data_dir
        try:
            rel_path = str(self.file_path.relative_to(self.config.data_dir))
        except ValueError:
            rel_path = str(self.file_path)

        return {
            "filename": self.file_path.name,
            "path": rel_path,
            "size_bytes": stat.st_size,
            "modified_time": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "mime_type": mime_type,
            "category": category
        }

    @abstractmethod
    def process(self) -> dict:
        """
        Process the file and return its metadata and extracted content.
        
        Returns:
            dict: The file's data entry for the manifest.
        """
        metadata = self.extract_metadata()
        metadata["text"] = ""
        logger.warning(f"Actual processing not yet implemented for {self.__class__.__name__}")
        return metadata

    def save_manifest_entry(self, manifest_path: Path):
        """
        Appends the output of process() to a JSON array in manifest_path.
        
        Args:
            manifest_path (Path): Path to the manifest.json file.
        """
        entry = self.process()
        
        # Simple append for single-threaded environment
        # Read existing data if file exists, else start with empty list
        if manifest_path.exists() and manifest_path.stat().st_size > 0:
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError:
                data = []
        else:
            data = []
            
        data.append(entry)
        
        # Write back out
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
