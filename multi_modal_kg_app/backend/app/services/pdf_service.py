import logging
import pdfplumber
import traceback

logger = logging.getLogger(__name__)

class PDFExtractor:
    @staticmethod
    def process(file_path: str) -> dict:
        """
        Extracts text and tables from a PDF using pdfplumber.
        Returns:
            {
                "text": str,
                "tables": list[list[list[str]]],
                "pages": int,
                "error": str | None
            }
        """
        result = {
            "text": "",
            "tables": [],
            "pages": 0,
            "error": None
        }
        
        full_text = []
        all_tables = []
        
        try:
            logger.info(f"Extracting PDF: {file_path}")
            with pdfplumber.open(file_path) as pdf:
                result["pages"] = len(pdf.pages)
                
                for i, page in enumerate(pdf.pages):
                    # Extract Text
                    page_text = page.extract_text()
                    if page_text:
                        full_text.append(page_text)
                        
                    # Extract Tables
                    page_tables = page.extract_tables()
                    if page_tables:
                        # Append the tables found on this page
                        all_tables.extend(page_tables)
                        
            result["text"] = "\n\n".join(full_text).strip()
            result["tables"] = all_tables
            
            if not result["text"] and not result["tables"]:
                logger.warning(f"PDF {file_path} appears to be empty or scanned (no text/tables found).")
                
            logger.info(f"PDF extracted successfully: {result['pages']} pages, {len(result['tables'])} tables.")
            
        except Exception as e:
            logger.error(f"Failed to process PDF {file_path}: {e}\n{traceback.format_exc()}")
            result["error"] = str(e)
            
        return result
