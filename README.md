# ◈ DocuQuery — RAG-Powered Document Intelligence

> Upload any PDF. Ask anything. Get instant, accurate answers powered by Claude AI and a vector search pipeline.

![Tech Stack](https://img.shields.io/badge/Claude-Anthropic-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green) ![React](https://img.shields.io/badge/React-18-61dafb) ![ChromaDB](https://img.shields.io/badge/ChromaDB-vector--store-orange)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DocuQuery                            │
│                                                             │
│   ┌──────────┐    PDF     ┌──────────────────────────────┐  │
│   │          │ ─────────▶ │  FastAPI Backend             │  │
│   │  React   │            │                              │  │
│   │ Frontend │            │  1. Extract text (PyPDF2)    │  │
│   │          │            │  2. Chunk text (500w/50 ov)  │  │
│   │          │            │  3. Embed + store (ChromaDB) │  │
│   │          │            └──────────────────────────────┘  │
│   │          │                          │                   │
│   │          │   Question               ▼                   │
│   │          │ ─────────▶  ┌─────────────────────────────┐  │
│   │          │             │  RAG Pipeline               │  │
│   │          │             │                             │  │
│   │          │             │  1. Embed question          │  │
│   │          │             │  2. Vector similarity search│  │
│   │          │             │  3. Retrieve top-5 chunks   │  │
│   │          │             └─────────────────────────────┘  │
│   │          │                          │                   │
│   │          │                          ▼                   │
│   │          │             ┌─────────────────────────────┐  │
│   │          │             │  Claude claude-sonnet-4      │  │
│   │          │  Streamed   │  (Anthropic API)            │  │
│   │          │ ◀────────── │                             │  │
│   └──────────┘   Answer    │  Context + Question → Answer│  │
│                            └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **PDF Upload & Indexing** — drag-and-drop upload with automatic text extraction and chunking
- **Vector Search (RAG)** — ChromaDB retrieves the most relevant passages for each question
- **Streaming Responses** — answers stream token-by-token like ChatGPT using SSE
- **Multi-document Support** — upload and switch between multiple PDFs
- **Clean React UI** — dark editorial design with suggestion chips and real-time cursor
- **Docker + Railway Ready** — deploy to the cloud in minutes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, CSS |
| Backend | Python, FastAPI |
| AI Model | Claude claude-sonnet-4 (Anthropic) |
| Vector Store | ChromaDB |
| PDF Parsing | PyPDF2 |
| Deployment | Docker, Railway |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/docuquery.git
cd docuquery
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Run the backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Run the frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## Docker (Local)

```bash
docker-compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the repo — Railway auto-detects the `railway.json` config
4. Add environment variable: `ANTHROPIC_API_KEY=your_key`
5. Deploy ✅

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/upload` | Upload & index a PDF |
| `POST` | `/query` | Ask a question (streaming SSE) |
| `GET` | `/documents` | List all indexed documents |
| `DELETE` | `/documents/{id}` | Remove a document |

---

## How RAG Works

1. **Ingestion**: PDF text is extracted and split into 500-word overlapping chunks
2. **Embedding**: Each chunk is converted to a vector and stored in ChromaDB
3. **Retrieval**: Your question is embedded and compared against all chunks via cosine similarity
4. **Generation**: The top 5 most relevant chunks are injected into Claude's context window
5. **Streaming**: Claude's answer streams back to the UI in real time

---

## Project Structure

```
docuquery/
├── backend/
│   ├── main.py            # FastAPI app, RAG pipeline
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── components/
│   │       ├── ChatPanel.jsx
│   │       ├── DocumentList.jsx
│   │       └── UploadZone.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── railway.json
├── .env.example
└── README.md
```

---

## License

MIT
