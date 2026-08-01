# Multi-Modal Knowledge Graph Synthesis - Phase 1

This is the foundation phase of the Multi-Modal Knowledge Graph Synthesis system for enterprise compliance. It sets up the ingestion pipeline, logging, configuration, and file routing.

## Setup Instructions

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```
   - **Linux/macOS:**
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Pipeline

1. **Provide data:**
   Place your documents (PDFs, audio, schematics, tables) into the `data/` directory.

2. **Run the orchestration script:**
   ```bash
   python src/main.py
   ```
   *Note: Run this from the root of the project so `src` is properly imported.*

3. **Check the results:**
   - The metadata for processed files will be appended to `output/manifest.json`.
   - Logs can be found in the `logs/` directory.

## Phase 2: Audio Transcription with Whisper

### Prerequisites
- Install **ffmpeg** on your system:
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: Download from https://ffmpeg.org/download.html and add to PATH.

- Install the new Python dependencies:  
  `pip install -r requirements.txt`

### Running Phase 2
1. Place your audio files (`.mp3`, `.wav`, `.m4a`) in the `data/` folder (subdirectories are fine).
2. Run the pipeline: `python src/main.py`
3. Check `output/manifest.json` – audio entries now contain full transcripts, language, segment timestamps, and duration.

The Whisper model will be downloaded automatically on first run (~140 MB for the `base` model, configurable in `config/config.yaml`).
