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
5. Install System Dependencies:
   - **ffmpeg**: Required for OpenAI Whisper audio transcription.
   - **Tesseract OCR**: Required for Image/Schematic text extraction.
     - **Windows**: Download the installer from the official repository and add it to your system PATH. Alternatively, set the `TESSERACT_CMD` environment variable to the exact path of `tesseract.exe`.
     - **macOS**: `brew install tesseract`
     - **Ubuntu/Debian**: `sudo apt install tesseract-ocr`
6. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

### 1.1 Weaviate (Vector Database) Setup
For semantic search, you need a Weaviate instance running. The easiest way is via Docker.
Run the following command:
```bash
docker run -d -p 8080:8080 --name weaviate \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  semitechnologies/weaviate:latest
```
Ensure your `WEAVIATE_URL` in `.env` is set to `http://localhost:8080`. Note: the first time you run the backend, it will automatically download the `sentence-transformers` embedding model locally.

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

## Next Steps
- Phase 9 (Completed): Cloud Deployment Readiness (Vercel & Render).

## Phase 9: Cloud Deployment Readiness
The application is fully stateless and ready for deployment. Uploads are handled by MongoDB GridFS instead of local disk.

### Backend Deployment (Render)
1. Create a **Web Service** on Render.
2. Link the repository, and set the root directory to `backend`.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Ensure `runtime.txt` specifies `python-3.10.12`.
6. Configure environment variables (from `.env.example`). Set `FRONTEND_URL` to your Vercel deployment URL.

### Frontend Deployment (Vercel)
1. Import the project in Vercel.
2. Set the Root Directory to `frontend`.
3. Set the Build Command to `npm run build` and Output Directory to `dist`.
4. Add the `VITE_API_BASE_URL` environment variable pointing to your deployed Render service.
5. Vercel will automatically parse the `vercel.json` file to manage SPA routing.

## Phase 8: Authentication & Multi-Tenancy

The application is now fully protected and multi-tenant!
- **JWT Auth**: Powered by `python-jose` and `passlib[bcrypt]`.
- **Data Isolation**: All MongoDB collections (`documents`, `qa_pairs`, `entity_annotations`, `evaluation_runs`) are tagged and filtered by `user_id`.
- **Knowledge Graph Isolation**: Neo4j isolates retrieval strictly to the authenticated user's documents using `CONTAINS` relationships.
- **Vector Search Isolation**: Weaviate strictly scopes semantic search using the `user_id` property.
- **Frontend App Shell**: Protected routes, context-based state management, and a new `Login`/`Register` flow.d.

## Phase 7: Evaluation Framework & Analytics

An evaluation pipeline is built-in to benchmark the system on the following key metrics:
1. **Retrieval Precision**: How accurately chunks are retrieved via Semantic Search.
2. **Entity F1 Score**: The quality of the entities extracted into the Neo4j Knowledge Graph.
3. **Hallucination Containment**: Validating that all answers remain faithful to the provided context.
4. **Citation Traceability**: Ensuring every inline citation points to a valid source chunk.

### Ground Truth Upload formats

**Q&A Ground Truth (CSV)**
```csv
question,expected_answer,relevant_document_ids
"What is the required thickness?","The thickness should be 5mm.","64f3..."
```

# NoesisNet
**Multi‑Modal Knowledge Graph Synthesis for Enterprise Compliance**

![NoesisNet Architecture](https://img.shields.io/badge/Architecture-Cloud--Native-blue)
![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-green)

NoesisNet transforms unstructured compliance documents into actionable, queryable knowledge. It reads PDFs, audio logs, diagrams (via OCR), and tables; extracts precise entity‑relationship webs; constructs a structured knowledge graph in Neo4j; embeds content into Weaviate; and answers complex regulatory questions using a Graph RAG pipeline powered by a configurable LLM (e.g., DeepSeek/Hugging Face). Every answer comes with citations traceable back to the source document.

---

## 🌟 Key Features

- **Multi‑Modal Ingestion:** Supports PDFs, audio (via Whisper), images (via Tesseract OCR), and spreadsheets.
- **Entity & Relationship Extraction:** Powered by spaCy with custom compliance patterns.
- **Knowledge Graph Construction:** Integrates with Neo4j (AuraDB) featuring interactive 2D graph visualisation on the frontend.
- **Semantic Vector Search:** Uses Weaviate embeddings for meaning‑based retrieval.
- **Graph RAG Q&A:** Combines structural graph context and dense vector search to generate precise answers with inline citations.
- **Zero‑Hallucination Assurance:** Strict context grounding and citation verification.
- **Evaluation Framework:** Built‑in metrics evaluating Retrieval Precision, Entity F1, Hallucination Containment, and Citation Traceability.
- **Multi‑Tenancy & Authentication:** JWT‑based user isolation with MongoDB Atlas for robust document metadata storage.
- **Modern Light/Dark UI:** Attractive, responsive React interface utilizing glassmorphism and smooth Framer Motion animations.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS, Lucide Icons, glassmorphism UI
- **Animations & Viz:** Framer Motion, Recharts, react-force-graph-2d

### Backend
- **Core:** Python 3.10+, FastAPI, Uvicorn
- **Database Driver:** Motor (Async MongoDB driver)

### Databases
- **Metadata & Users:** MongoDB Atlas (Free Tier)
- **Knowledge Graph:** Neo4j AuraDB
- **Vector Embeddings:** Weaviate Cloud (WCD)

### AI & ML
- **Audio:** OpenAI Whisper
- **OCR:** Tesseract (`pytesseract`)
- **NLP:** spaCy (NER + relation extraction)
- **Embeddings:** `sentence-transformers`
- **LLM:** HuggingFace / DeepSeek API (OpenAI‑compatible)

### Deployment
- **Frontend:** Vercel
- **Backend:** Render (Cloud‑only architecture, no Docker required)

---

## 🏗 Architecture Overview

A user uploads heterogeneous documents via the React UI. The backend saves files in MongoDB GridFS, then asynchronously processes them: 
- Audio → Whisper 
- PDF → pdfplumber 
- Images → Tesseract 
- Spreadsheets → pandas

Extracted text is chunked and embedded into Weaviate. Simultaneously, entities and relations are extracted via spaCy and ingested into Neo4j, creating a live, unified knowledge graph. 

When a user asks a question, the **Graph RAG** service retrieves relevant subgraph triples and vector chunks, crafts a strict context-grounded prompt, and sends it to the LLM. The answer is post‑processed for citations and displayed in the chat interface. Finally, an analytics dashboard allows uploading ground truth data to run continuous evaluations (using the LLM as a judge) to verify hallucination and traceability.

---

## 📋 Prerequisites

Before installing, ensure you have the following set up:

- **Python 3.10+** and **Node.js 18+** installed locally.
- **MongoDB Atlas account:** Create a free tier cluster.
- **Neo4j AuraDB account:** Create a free instance.
- **Weaviate Cloud account:** Create a free sandbox.
- **LLM API Key:** DeepSeek or HuggingFace API key (or any OpenAI‑compatible key).
- *(Optional)* Google AI Studio key if using Gemini.

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` and `frontend/` directories using the following references.

### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true` |
| `DATABASE_NAME` | MongoDB database name | `compliance_kg` |
| `NEO4J_URI` | Neo4j AuraDB bolt URI | `neo4j+s://<dbid>.databases.neo4j.io` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `yourpassword` |
| `WEAVIATE_URL` | Weaviate Cloud endpoint | `https://<sandbox>.weaviate.network` |
| `WEAVIATE_API_KEY` | Weaviate API key | `your-api-key` |
| `HF_API_KEY` | HuggingFace or DeepSeek API key | `hf_...` or `sk-...` |
| `HF_MODEL_NAME` | Model name to use for generation | `Qwen/Qwen2.5-72B-Instruct` |
| `JWT_SECRET` | Random string for JWT signing | `long-random-string` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `FRONTEND_URL` | Deployed frontend URL (for CORS) | `https://noesisnet.vercel.app` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Deployed Backend URL | `https://noesisnet-api.onrender.com` |

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/noesisnet.git
cd noesisnet
```

### 2. Backend Setup
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download the required spaCy model
python -m spacy download en_core_web_sm

# Create environment file and add your keys
cp .env.example .env

# Run the server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file and set API URL (if testing locally, leave empty or set to localhost:8000)
cp .env.example .env

# Start the development server
npm run dev
```

**Access the application at:** `http://localhost:5173`

---

## ☁️ Deployment

### Backend (Render)
1. Create a new **Web Service** on Render.
2. Select the `backend` folder as the Root Directory.
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all the backend environment variables in the Render dashboard.

### Frontend (Vercel)
1. Import the project into Vercel and set the root directory to `frontend`.
2. Vercel will automatically detect Vite.
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Add the `VITE_API_BASE_URL` environment variable pointing to your deployed Render URL.

*Note: No Docker is required; all services leverage native cloud buildpacks.*

---

## 📖 Usage Guide

1. **Register & Log In:** Create an account to isolate your workspace.
2. **Upload Documents:** Navigate to the Upload page. Drag and drop PDFs, MP3/WAV, PNG/JPG, or CSV/XLSX files.
3. **Monitor Processing:** The dashboard will poll automatically. Wait for the status to change to `completed`.
4. **View Extractions:** Open the Document Viewer to inspect parsed text, tables, structured rows, and raw JSON.
5. **Explore Knowledge Graph:** View extracted named entities and their relationship web visually.
6. **Semantic Search:** Query the vector database for highly relevant document snippets.
7. **Ask AI:** Ask complex compliance questions and receive answers fully grounded by inline citations.
8. **Evaluation:** Upload Q&A ground truth data to run automated LLM-as-a-judge evaluations.

---

## 📊 Evaluation Metrics

NoesisNet provides an integrated analytics suite to measure AI reliability:

- **Retrieval Precision@5:** Measures how many of the top 5 retrieved vector chunks are actually relevant to the query.
- **Entity F1 Score:** Evaluates the quality (precision and recall) of spaCy-extracted entities against ground truth annotations.
- **Hallucination Containment Rate:** The percentage of answers that contain zero unsupported claims, verified strictly against the retrieved context.
- **Citation Traceability:** The accuracy and validity of the inline citations linking back to the exact source chunks.

---

## 📁 Folder Structure

```text
noesisnet/
├── backend/
│   ├── app/
│   │   ├── main.py, config.py, database.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── context/
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## 🐛 Troubleshooting / FAQ

**Q: All metrics show 0.0% after running an evaluation.**  
**A:** Ensure your ground truth dataset uses document filenames (or exact ObjectIDs) that match the documents you uploaded. Verify that the documents are fully processed and embedded in Weaviate.

**Q: Weaviate connection is refused.**  
**A:** Weaviate Cloud free sandboxes expire after 14 days of inactivity. Ensure your cluster is awake or re-create it and update your `WEAVIATE_URL` and API key.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'Add amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

Please follow the existing code styles and ensure the UI retains its modern design language.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙌 Acknowledgements

- **OpenAI Whisper** for state-of-the-art audio transcription.
- **spaCy** for robust NLP and entity extraction.
- **Neo4j** and **Weaviate** for powerful graph and vector storage.
- **HuggingFace** for seamless open-source LLM capabilities.
- All other open-source libraries that made this possible!
