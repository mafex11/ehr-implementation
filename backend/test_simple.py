"""
Simple FastAPI test application for Railway deployment
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI(
    title="TDP-QIMLE Test",
    description="Simple test application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "TDP-QIMLE Test Server is running!",
        "timestamp": datetime.now().isoformat(),
        "status": "success"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/test")
async def test():
    return {
        "test": "successful",
        "message": "Backend is working correctly",
        "timestamp": datetime.now().isoformat()
    } 