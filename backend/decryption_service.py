"""
Independent Decryption Service
Runs separately from the encryption system on a different port
"""

import asyncio
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime

from decryption_api import router as decryption_router
from decryption_engine import decryption_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🔓 Starting Independent Decryption Service")
    
    # Start cleanup task for expired sessions
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    try:
        yield
    finally:
        logger.info("🔓 Shutting down Independent Decryption Service")
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass

async def periodic_cleanup():
    """Periodic cleanup of expired decryption sessions"""
    while True:
        try:
            await asyncio.sleep(1800)  # Every 30 minutes
            cleaned_count = await decryption_engine.cleanup_expired_sessions()
            if cleaned_count > 0:
                logger.info(f"Cleaned up {cleaned_count} expired decryption sessions")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error during periodic cleanup: {e}")

# Create FastAPI app
app = FastAPI(
    title="Independent Decryption Service",
    description="Separate decryption service for TDP-QIMLE encrypted patient data",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include decryption router
app.include_router(decryption_router)

@app.get("/")
async def root():
    """Root endpoint for decryption service"""
    return {
        "service": "Independent Decryption Service",
        "version": "1.0.0",
        "status": "operational",
        "description": "Separate decryption system for TDP-QIMLE encrypted data",
        "active_sessions": len(decryption_engine.decryption_session_keys),
        "endpoints": {
            "authentication": "/api/decrypt/auth/session",
            "single_patient": "/api/decrypt/patient/single",
            "bulk_patients": "/api/decrypt/patient/bulk",
            "search": "/api/decrypt/patient/search/encrypted",
            "audit": "/api/decrypt/audit/session",
            "health": "/api/decrypt/health"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Independent Decryption Service",
        "port": 8002,
        "active_sessions": len(decryption_engine.decryption_session_keys),
        "uptime": "operational",
        "database": "connected",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    logger.info("🚀 Starting Independent Decryption Service on port 8002")
    uvicorn.run(
        "decryption_service:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    ) 