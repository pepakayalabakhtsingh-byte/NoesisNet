import os
import tempfile
from pathlib import Path
from bson import ObjectId
from app.database import get_gridfs_bucket
import aiofiles

async def download_to_temp(file_id: str) -> Path:
    """
    Downloads a file from GridFS to a temporary local file.
    Returns the Path to the temporary file.
    Preserves the original file extension so FileHandler can detect category.
    """
    fs = get_gridfs_bucket()
    
    # Open GridFS download stream to get filename/metadata
    grid_out = await fs.open_download_stream(ObjectId(file_id))
    
    # Extract extension from the stored filename so FileHandler can detect category
    original_filename = grid_out.filename or ""
    suffix = Path(original_filename).suffix  # e.g. ".pdf", ".ogg", ".csv"
    
    # Create a NamedTemporaryFile WITH the correct extension
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_path = Path(temp_file.name)
    temp_file.close()  # Close so we can write to it asynchronously

    # Write GridFS content to the temp file
    async with aiofiles.open(temp_path, "wb") as f:
        while True:
            chunk = await grid_out.readchunk()
            if not chunk:
                break
            await f.write(chunk)
            
    return temp_path

async def delete_temp(path: Path):
    """
    Removes the temporary file if it exists.
    """
    try:
        if path and path.exists():
            os.remove(path)
    except Exception:
        pass
