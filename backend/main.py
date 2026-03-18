from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import chromadb
from chromadb.utils import embedding_functions
import PyPDF2
import io
import uuid
import os
import json

app = FastAPI(title="DocuQuery API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

chroma_client = chromadb.Client()
embedding_fn = embedding_functions.DefaultEmbeddingFunction()

# In-memory store for document metadata
documents_store = {}


class QueryRequest(BaseModel):
    document_id: str
    question: str


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "DocuQuery API is running"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a PDF document."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    doc_id = str(uuid.uuid4())
    chunks = chunk_text(text)

    # Create a ChromaDB collection for this document
    collection = chroma_client.create_collection(
        name=f"doc_{doc_id}",
        embedding_function=embedding_fn,
    )

    # Add chunks to ChromaDB
    collection.add(
        documents=chunks,
        ids=[f"{doc_id}_chunk_{i}" for i in range(len(chunks))],
    )

    documents_store[doc_id] = {
        "filename": file.filename,
        "chunk_count": len(chunks),
        "char_count": len(text),
    }

    return {
        "document_id": doc_id,
        "filename": file.filename,
        "chunks_indexed": len(chunks),
        "message": "Document indexed successfully",
    }


@app.post("/query")
async def query_document(request: QueryRequest):
    """Query a document using RAG + Claude streaming."""
    if request.document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        collection = chroma_client.get_collection(
            name=f"doc_{request.document_id}",
            embedding_function=embedding_fn,
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Document collection not found")

    # Retrieve relevant chunks
    results = collection.query(query_texts=[request.question], n_results=5)
    context_chunks = results["documents"][0]
    context = "\n\n---\n\n".join(context_chunks)

    system_prompt = """You are DocuQuery, an expert document analyst. 
Answer questions based ONLY on the provided document context.
Be concise, accurate, and cite relevant details from the document.
If the answer isn't in the context, say so clearly."""

    user_message = f"""Document context:
{context}

Question: {request.question}"""

    def generate():
        with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/documents")
async def list_documents():
    """List all uploaded documents."""
    return {"documents": documents_store}


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its index."""
    if document_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        chroma_client.delete_collection(f"doc_{document_id}")
    except Exception:
        pass

    del documents_store[document_id]
    return {"message": "Document deleted successfully"}
