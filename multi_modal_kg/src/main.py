"""Main orchestration script for the ingestion pipeline."""
import sys
from pathlib import Path

# Add the project root to sys.path so we can import from src
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

import logging
import json

from src.config import config
from src.logger import setup_logging
from src.file_router import route_file

def main():
    """Main orchestration function."""
    # Setup logging
    setup_logging(config)
    logger = logging.getLogger(__name__)
    logger.info("Starting Multi-Modal Knowledge Graph Synthesis Phase 1")

    # Create required directories
    config.data_dir.mkdir(parents=True, exist_ok=True)
    config.output_dir.mkdir(parents=True, exist_ok=True)
    config.log_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = config.output_dir / "manifest.json"
    
    # Initialize empty manifest if it doesn't exist
    if not manifest_path.exists():
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump([], f)

    # Build a flat list of all supported extensions
    all_extensions = []
    for exts in config.supported_extensions.values():
        all_extensions.extend(exts)

    # Scan data directory for files
    total_found = 0
    successfully_processed = 0
    failed = 0

    if not config.data_dir.exists():
        logger.error(f"Data directory {config.data_dir} does not exist.")
        return

    for file_path in config.data_dir.rglob("*"):
        if file_path.is_file():
            if file_path.suffix.lower() in all_extensions:
                total_found += 1
                try:
                    ingestor = route_file(file_path, config)
                    if ingestor:
                        ingestor.save_manifest_entry(manifest_path)
                        successfully_processed += 1
                        logger.info(f"Successfully processed {file_path.name}")
                    else:
                        failed += 1
                        logger.warning(f"Could not route file {file_path.name}")
                except Exception as e:
                    failed += 1
                    logger.error(f"Failed to process {file_path.name}: {e}", exc_info=True)
            else:
                logger.debug(f"Skipping unsupported file {file_path.name}")

    # Summary
    logger.info("Processing complete.")
    logger.info(f"Total files found: {total_found}")
    logger.info(f"Successfully processed: {successfully_processed}")
    logger.info(f"Failed: {failed}")
    
    print("\n--- Pipeline Summary ---")
    print(f"Total files matching supported extensions: {total_found}")
    print(f"Successfully processed: {successfully_processed}")
    print(f"Failed: {failed}")

if __name__ == "__main__":
    main()
