try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False

import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Based on previous phase supported extensions
SUPPORTED_EXTENSIONS = {
    "pdf": [".pdf"],
    "audio": [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac"],
    "schematic": [".png", ".jpg", ".jpeg", ".tiff", ".bmp"],
    "table": [".csv", ".xlsx", ".xls"]
}

class FileHandler:
    @staticmethod
    def save_file(file: UploadFile) -> str:
        """Saves the uploaded file to local disk and returns the path."""
        ext = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return str(file_path)

    @staticmethod
    def get_metadata(file_path: str, original_filename: str) -> dict:
        """Extracts metadata from the saved file."""
        path = Path(file_path)
        stat = path.stat()
        
        # Detect MIME
        mime_type = "application/octet-stream"
        if HAS_MAGIC:
            try:
                mime_type = magic.from_file(str(path), mime=True)
            except Exception:
                pass
            
        ext = path.suffix.lower()
        
        # Match category
        category = "unknown"
        if "pdf" in mime_type:
            category = "pdf"
        elif "audio" in mime_type:
            category = "audio"
        elif "image" in mime_type:
            category = "schematic"
        elif "csv" in mime_type or "excel" in mime_type or "spreadsheet" in mime_type:
            category = "table"
        else:
            for cat, exts in SUPPORTED_EXTENSIONS.items():
                if ext in exts:
                    category = cat
                    break

        return {
            "filename": original_filename,
            "path": str(path),
            "size_bytes": stat.st_size,
            "mime_type": mime_type,
            "category": category
        }
