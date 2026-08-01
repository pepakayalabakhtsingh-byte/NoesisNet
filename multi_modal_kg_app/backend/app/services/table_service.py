import logging
import traceback
import pandas as pd
import csv
from pathlib import Path

logger = logging.getLogger(__name__)

class TableExtractor:
    @staticmethod
    def process(file_path: str) -> dict:
        """
        Reads a CSV or Excel file and returns its rows and columns.
        Returns:
            {
                "rows": list[dict],
                "columns": list[str],
                "error": str | None
            }
        """
        result = {
            "rows": [],
            "columns": [],
            "error": None
        }
        
        try:
            logger.info(f"Extracting Table Spreadsheet: {file_path}")
            path = Path(file_path)
            ext = path.suffix.lower()
            
            if ext == ".csv":
                df = pd.read_csv(file_path)
            elif ext in [".xlsx", ".xls"]:
                df = pd.read_excel(file_path)
            else:
                # Fallback attempt using standard CSV if pandas fails extension check
                with open(file_path, mode='r', encoding='utf-8-sig') as f:
                    reader = csv.DictReader(f)
                    result["columns"] = reader.fieldnames if reader.fieldnames else []
                    result["rows"] = [row for row in reader]
                logger.info(f"Parsed {len(result['rows'])} rows via standard CSV.")
                return result

            # Replace NaN with None so it translates cleanly to JSON null
            df = df.where(pd.notnull(df), None)
            
            result["columns"] = df.columns.tolist()
            result["rows"] = df.to_dict(orient='records')
            
            logger.info(f"Parsed spreadsheet successfully: {len(result['rows'])} rows.")
            
        except Exception as e:
            logger.error(f"Failed to process table {file_path}: {e}\n{traceback.format_exc()}")
            result["error"] = str(e)
            
        return result
