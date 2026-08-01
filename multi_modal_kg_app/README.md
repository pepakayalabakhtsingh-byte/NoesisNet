# Multi-Modal Knowledge Graph Synthesis - Web Application (Phase 1)

This project contains the full-stack scaffolding for the Multi-Modal Knowledge Graph Synthesis system, powered by FastAPI, MongoDB, React, Vite, and Tailwind CSS.

## Monorepo Structure
- `backend/`: FastAPI backend with Motor (async MongoDB) and Whisper integration.
- `frontend/`: React + Vite frontend with Tailwind CSS and Framer Motion.

## 1. Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the Database:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Get your connection string (e.g., `mongodb+srv://...`).
   - Copy `.env.example` to `.env` and replace `MONGODB_URI` with your connection string.
5. Make sure you have `ffmpeg` installed on your system (required for Whisper).
6. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

## 2. Frontend Setup

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

## Features
- **Drag & Drop Upload:** Upload PDFs, Images, Tables, and Audio.
- **Background Processing:** Audio files are transcribed using OpenAI Whisper asynchronously in the background.
- **Live Polling:** The dashboard polls the backend every 5 seconds to update the status from `pending` -> `processing` -> `completed`.
- **Sleek UI:** Dark theme, glass-morphism effects, and Framer Motion animations.
