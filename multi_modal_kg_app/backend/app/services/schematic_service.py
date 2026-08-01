import logging
import traceback
from PIL import Image, ImageFilter
import pytesseract
import os

logger = logging.getLogger(__name__)

# Try to use env var first, otherwise default to the standard Windows path
TESSERACT_CMD = os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
elif os.getenv("TESSERACT_CMD"):
    pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")

class SchematicExtractor:
    @staticmethod
    def process(file_path: str) -> dict:
        """
        Extracts text from images using pytesseract.
        Applies basic preprocessing for better OCR.
        Returns:
            {
                "text": str,
                "raw_ocr": bool,
                "error": str | None
            }
        """
        result = {
            "text": "",
            "raw_ocr": True,
            "error": None
        }
        
        try:
            logger.info(f"Extracting Schematic (OCR): {file_path}")
            
            # Load and Pre-process image
            with Image.open(file_path) as img:
                # 1. Convert to Greyscale
                img = img.convert('L')
                
                # 2. Extract Text using PSM 11 (Sparse text mode) which is much better for scattered schematic labels
                text = pytesseract.image_to_string(img, lang=os.getenv("OCR_LANG", "eng"), config="--psm 11")
                
                result["text"] = text.strip()
                logger.info("OCR completed successfully.")
                
        except Exception as e:
            logger.error(f"Failed to process image {file_path}: {e}\n{traceback.format_exc()}")
            result["error"] = str(e)
            
        return result
