"""
Enhanced FastAPI Application with Encryption and Logging
Main application entry point with comprehensive security features
"""

import sys
import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.routes.ehr import router as ehr_router
from backend.logging_system import initialize_crypto_logger, get_crypto_logger
from backend.database import encrypted_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection string
MONGO_URL = "mongodb+srv://mafex:mafex@cluster0.oxnl42g.mongodb.net/"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("Starting EHR Privacy Application with Encryption...")
    
    try:
        # Initialize crypto logging system
        await initialize_crypto_logger(MONGO_URL)
        logger.info("Crypto logging system initialized")
        
        # Log application startup
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_system_event(
            event_type="APPLICATION_STARTUP",
            description="EHR Privacy Application started with encryption support",
            severity="INFO",
            additional_data={
                'encryption_algorithm': 'AES-256-CBC-DP',
                'database_url': MONGO_URL,
                'startup_time': datetime.utcnow().isoformat()
            }
        )
        
        logger.info("Application startup completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize application: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down EHR Privacy Application...")
    
    try:
        # Log application shutdown
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_system_event(
            event_type="APPLICATION_SHUTDOWN",
            description="EHR Privacy Application shutting down",
            severity="INFO",
            additional_data={
                'shutdown_time': datetime.utcnow().isoformat()
            }
        )
        
        # Close database connections
        await encrypted_db.close()
        await crypto_logger.close()
        
        logger.info("Application shutdown completed")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Create FastAPI app with lifespan
app = FastAPI(
    title="EHR Privacy API with Encryption",
    description="Cloud-based EHR system with differential privacy and encryption",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all HTTP requests for audit purposes
    """
    start_time = datetime.utcnow()
    
    try:
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Log request
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_audit_event(
            user_id="anonymous_user",  # This would be replaced with actual user ID
            action=f"{request.method} {request.url.path}",
            resource=request.url.path,
            outcome="SUCCESS" if response.status_code < 400 else "FAILURE",
            ip_address=request.client.host,
            additional_data={
                'status_code': response.status_code,
                'processing_time': processing_time,
                'user_agent': request.headers.get('user-agent', ''),
                'query_params': dict(request.query_params)
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Request processing failed: {str(e)}")
        
        # Log error
        try:
            crypto_logger = await get_crypto_logger()
            await crypto_logger.log_system_event(
                event_type="REQUEST_ERROR",
                description=f"Request processing failed: {str(e)}",
                severity="ERROR",
                additional_data={
                    'path': request.url.path,
                    'method': request.method,
                    'client_ip': request.client.host,
                    'error': str(e)
                }
            )
        except:
            pass  # Don't fail if logging fails
        
        # Return error response
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal server error",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

# Exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handle HTTP exceptions with logging
    """
    try:
        crypto_logger = await get_crypto_logger()
        await crypto_logger.log_system_event(
            event_type="HTTP_EXCEPTION",
            description=f"HTTP {exc.status_code}: {exc.detail}",
            severity="WARNING" if exc.status_code < 500 else "ERROR",
            additional_data={
                'status_code': exc.status_code,
                'path': request.url.path,
                'method': request.method,
                'client_ip': request.client.host,
                'detail': exc.detail
            }
        )
    except:
        pass  # Don't fail if logging fails
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Mount the EHR router
app.include_router(ehr_router, prefix="/api/ehr", tags=["EHR"])

@app.get("/")
async def read_root():
    """
    Root endpoint with system information
    """
    return {
        "message": "EHR Privacy API with Encryption is running",
        "version": "2.0.0",
        "encryption": "AES-256-CBC with Differential Privacy",
        "features": [
            "Encrypted data storage",
            "Differential privacy",
            "Comprehensive logging",
            "Privacy budget tracking",
            "Audit trails"
        ],
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Check database connectivity
        patient_count = await encrypted_db.get_patient_count()
        
        # Check logging system
        crypto_logger = await get_crypto_logger()
        
        return {
            "status": "healthy",
            "database": "connected",
            "logging": "operational",
            "patient_count": patient_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.get("/api/system/info")
async def get_system_info():
    """
    Get system information and statistics
    """
    try:
        # Get patient count
        patient_count = await encrypted_db.get_patient_count()
        
        # Get logging statistics
        crypto_logger = await get_crypto_logger()
        recent_logs = await crypto_logger.get_system_logs(limit=10)
        
        return {
            "success": True,
            "system_info": {
                "version": "2.0.0",
                "encryption_algorithm": "AES-256-CBC-DP",
                "database_type": "MongoDB",
                "patient_count": patient_count,
                "recent_log_count": len(recent_logs),
                "uptime": datetime.utcnow().isoformat()
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get system info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get system info: {str(e)}")

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True,
        log_level="info"
    )
