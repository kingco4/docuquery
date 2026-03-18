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

## Healthcare Use Case

DocuQuery's architecture maps directly to real-world healthcare data problems — specifically the challenge of making complex, unstructured payer policy documents queryable and actionable.

**The Problem in Healthcare**

Health insurers publish coverage policies as dense, inconsistent PDFs — prior authorization rules, formulary documents, clinical criteria, and benefit summaries. These documents are notoriously difficult to parse, search, and operationalize at scale. Teams at payers, providers, and health tech companies spend enormous manual effort just answering the question: *"Does this policy cover this procedure for this patient?"*

**How This Architecture Applies**

The same RAG pipeline powering DocuQuery can be adapted to ingest and query payer policy documents:

| General Use | Healthcare Adaptation |
|---|---|
| Upload any PDF | Ingest payer policy PDFs from hundreds of insurers |
| Chunk & embed text | Normalize policy language across different payer formats |
| Vector similarity search | Retrieve relevant coverage criteria for a given clinical code |
| Claude generates answer | Surface actionable coverage decisions with citations |
| Multi-document support | Query across multiple payers simultaneously |

**Example Queries This Architecture Could Handle**

- *"What are the prior authorization requirements for lumbar MRI under Aetna's 2024 policy?"*
- *"Does this policy cover continuous glucose monitoring for Type 2 diabetes?"*
- *"What clinical criteria must be met for bariatric surgery coverage?"*

**Extensions for Production Healthcare Systems**

- **Structured extraction** — use LLMs to parse free-text policy criteria into structured JSON schemas (procedure codes, diagnosis requirements, step therapy rules)
- **Evaluation harnesses** — build QA workflows to benchmark answer accuracy against known ground truth policy interpretations
- **Audit trails** — log every query, retrieved chunk, and generated answer for compliance and explainability
- **Fine-tuning** — adapt embeddings on healthcare-specific terminology (ICD-10, CPT codes, payer jargon) for higher retrieval precision

This project demonstrates the foundational AI infrastructure — RAG pipelines, vector databases, LLM integration, and streaming APIs — required to build production-grade healthcare policy intelligence systems.

---

## License

MIT
