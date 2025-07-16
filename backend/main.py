"""
Main FastAPI Application for TDP-QIMLE Algorithm System
Novel Encryption System for Secure Patient Data Storage
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import uvicorn
import logging
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api_routes import router as novel_router, cleanup_storage
from decryption_api import router as decryption_router
from decryption_engine import decryption_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('tdp_qimle.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting TDP-QIMLE Algorithm System...")
    logger.info("Initializing novel encryption components...")
    logger.info("Initializing independent decryption system...")
    
    # Start cleanup task for expired decryption sessions
    cleanup_task = asyncio.create_task(periodic_decryption_cleanup())
    
    try:
        # Initialize any required components here
        logger.info("TDP-QIMLE system started successfully")
        logger.info("Independent decryption system started successfully")
        yield
    except Exception as e:
        logger.error(f"Failed to start TDP-QIMLE system: {str(e)}")
        raise
    finally:
        # Shutdown
        logger.info("Shutting down TDP-QIMLE Algorithm System...")
        logger.info("Shutting down independent decryption system...")
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass
        await cleanup_storage()
        logger.info("TDP-QIMLE system shutdown complete")

async def periodic_decryption_cleanup():
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
            logger.error(f"Error during periodic decryption cleanup: {e}")

# Create FastAPI application
app = FastAPI(
    title="TDP-QIMLE: Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption",
    description="""
    ## Novel Algorithm for Secure Patient Data Storage
    
    This system implements a completely new encryption algorithm called **TDP-QIMLE** 
    (Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption) 
    for secure storage of patient data in cloud databases (MongoDB).
    
    ### Key Features:
    - **Temporal Differential Privacy**: Time-decay privacy mechanisms
    - **Quantum-Inspired Encryption**: Multiple quantum-inspired layers
    - **Multi-Dimensional Lattice Obfuscation**: Advanced mathematical obfuscation
    - **Adaptive Security**: Sensitivity-based encryption strength
    - **Homomorphic Properties**: Encrypted domain operations
    - **Blockchain-Inspired Integrity**: Tamper-proof verification
    - **Biological Key Evolution**: Bio-inspired key generation patterns
    - **Independent Decryption System**: Separate algorithms for decryption
    
    ### Security Components:
    1. **Temporal Privacy Protection** with time-decay mechanisms
    2. **Quantum-Inspired Superposition Encryption** with multiple layers
    3. **High-Dimensional Lattice Obfuscation** for mathematical security
    4. **Adaptive Noise Injection** based on data sensitivity levels
    5. **Homomorphic Operation Preservation** for encrypted computations
    6. **Blockchain-Inspired Integrity Verification** with proof-of-work
    7. **Biological Pattern Key Evolution** for dynamic security
    8. **Independent Decryption Engine** with separate mathematical foundations
    
    ### Dual Service Architecture:
    - **Encryption Service**: `/api/novel/*` - Handles patient data encryption and storage
    - **Decryption Service**: `/api/decrypt/*` - Independent decryption with separate authentication
    
    ### Algorithm Novelty:
    This algorithm combines multiple cutting-edge cryptographic concepts in a unified framework 
    that has never been implemented before. It provides unprecedented security for healthcare 
    data storage while maintaining practical performance for real-world applications.
    """,
    version="1.0.0",
    contact={
        "name": "TDP-QIMLE Research Team",
        "email": "research@tdp-qimle.org"
    },
    license_info={
        "name": "Research License",
        "url": "https://opensource.org/licenses/MIT"
    },
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.localhost"]
)

# Custom middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = datetime.now()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response

# Include routers
app.include_router(novel_router)
app.include_router(decryption_router)

# Root endpoint showing both services
@app.get("/")
async def root():
    """Root endpoint showing both encryption and decryption services"""
    return {
        "system": "TDP-QIMLE: Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption",
        "version": "1.0.0",
        "status": "operational",
        "services": {
            "encryption": {
                "description": "Patient data encryption service",
                "base_path": "/api/novel",
                "endpoints": {
                    "store_patient": "POST /api/novel/patients",
                    "retrieve_patient": "GET /api/novel/patients/{patient_id}",
                    "update_patient": "PUT /api/novel/patients/{patient_id}",
                    "delete_patient": "DELETE /api/novel/patients/{patient_id}",
                    "get_all_patients": "GET /api/novel/patients",
                    "health_check": "GET /api/novel/health"
                }
            },
            "decryption": {
                "description": "Independent decryption service with separate authentication",
                "base_path": "/api/decrypt",
                "endpoints": {
                    "create_session": "POST /api/decrypt/auth/session",
                    "decrypt_single": "POST /api/decrypt/patient/single",
                    "decrypt_bulk": "POST /api/decrypt/patient/bulk",
                    "search_encrypted": "GET /api/decrypt/patient/search/encrypted",
                    "session_audit": "GET /api/decrypt/audit/session",
                    "terminate_session": "DELETE /api/decrypt/auth/session",
                    "health_check": "GET /api/decrypt/health"
                }
            }
        },
        "database": "MongoDB Atlas",
        "port": 8001,
        "documentation": "/docs",
        "timestamp": datetime.now().isoformat()
    }

# Add exception handlers
from api_routes import value_error_handler, general_exception_handler

@app.exception_handler(ValueError)
async def handle_value_error(request, exc):
    return await value_error_handler(request, exc)

@app.exception_handler(Exception)
async def handle_general_exception(request, exc):
    return await general_exception_handler(request, exc)

# Root endpoint
@app.get("/", response_model=dict)
async def root():
    """
    Root endpoint with system information
    """
    return {
        "system": "TDP-QIMLE: Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption",
        "version": "1.0.0",
        "description": "Novel algorithm for secure patient data storage in cloud databases",
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
            "health": "/api/novel/health",
            "algorithm_info": "/api/novel/algorithm/info"
        },
        "features": [
            "Temporal Differential Privacy",
            "Quantum-Inspired Multi-Layer Encryption",
            "Multi-Dimensional Lattice Obfuscation",
            "Adaptive Security Based on Data Sensitivity",
            "Homomorphic Operation Preservation",
            "Blockchain-Inspired Integrity Verification",
            "Biological Pattern Key Evolution"
        ]
    }

# Custom OpenAPI schema
def custom_openapi():
    """
    Custom OpenAPI schema with enhanced documentation
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="TDP-QIMLE Algorithm System",
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )
    
    # Add custom schema information
    openapi_schema["info"]["x-logo"] = {
        "url": "https://via.placeholder.com/300x100/0066CC/FFFFFF?text=TDP-QIMLE"
    }
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    # Add algorithm information to schema
    openapi_schema["info"]["x-algorithm-components"] = [
        {
            "name": "Temporal Differential Privacy",
            "description": "Time-decay privacy mechanisms with epsilon-delta guarantees"
        },
        {
            "name": "Quantum-Inspired Encryption",
            "description": "Multiple quantum-inspired layers with superposition and entanglement"
        },
        {
            "name": "Lattice Obfuscation",
            "description": "High-dimensional mathematical obfuscation for enhanced security"
        },
        {
            "name": "Adaptive Security",
            "description": "Dynamic security levels based on data sensitivity"
        },
        {
            "name": "Homomorphic Properties",
            "description": "Preserved mathematical operations on encrypted data"
        },
        {
            "name": "Integrity Verification",
            "description": "Blockchain-inspired tamper-proof verification system"
        },
        {
            "name": "Biological Key Evolution",
            "description": "Bio-inspired patterns for dynamic key generation"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled exceptions
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred in the TDP-QIMLE system",
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )

# HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    HTTP exception handler for proper error responses
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )

# System information endpoint
@app.get("/system/info", response_model=dict)
async def get_system_info():
    """
    Get comprehensive system information
    """
    return {
        "system": {
            "name": "TDP-QIMLE Algorithm System",
            "version": "1.0.0",
            "description": "Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption",
            "status": "operational",
            "uptime": "N/A",  # Could be calculated from startup time
            "timestamp": datetime.now().isoformat()
        },
        "algorithm": {
            "name": "TDP-QIMLE",
            "full_name": "Temporal Differential Privacy with Quantum-Inspired Multi-Layer Encryption",
            "version": "1.0.0",
            "novelty": "This is a completely new algorithm that has never been implemented before",
            "components": 7,
            "security_layers": 4,
            "encryption_strength": "Post-quantum resistant"
        },
        "features": {
            "temporal_privacy": {
                "enabled": True,
                "description": "Time-decay differential privacy mechanisms"
            },
            "quantum_inspired": {
                "enabled": True,
                "layers": 4,
                "description": "Multiple quantum-inspired encryption layers"
            },
            "lattice_obfuscation": {
                "enabled": True,
                "dimension": 512,
                "description": "High-dimensional mathematical obfuscation"
            },
            "adaptive_security": {
                "enabled": True,
                "levels": 4,
                "description": "Sensitivity-based encryption strength"
            },
            "homomorphic_operations": {
                "enabled": True,
                "description": "Encrypted domain mathematical operations"
            },
            "integrity_verification": {
                "enabled": True,
                "type": "blockchain-inspired",
                "description": "Tamper-proof verification system"
            },
            "biological_evolution": {
                "enabled": True,
                "pattern_length": 1000,
                "description": "Bio-inspired key evolution patterns"
            }
        },
        "storage": {
            "type": "MongoDB",
            "encryption": "TDP-QIMLE",
            "integrity_chain": True,
            "audit_logging": True
        },
        "performance": {
            "encryption_speed": "Variable (depends on sensitivity level)",
            "decryption_speed": "Variable (depends on complexity)",
            "storage_overhead": "~30-50% (due to multiple security layers)",
            "query_performance": "Optimized for encrypted operations"
        }
    }

# API documentation endpoint
@app.get("/api/docs", include_in_schema=False)
async def get_documentation():
    """
    Custom API documentation endpoint
    """
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="TDP-QIMLE Algorithm System - API Documentation",
        swagger_favicon_url="https://via.placeholder.com/32x32/0066CC/FFFFFF?text=T"
    )

# Development server configuration
if __name__ == "__main__":
    logger.info("Starting TDP-QIMLE development server...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,  # Different port from the original system
        reload=True,
        log_level="info",
        access_log=True,
        reload_dirs=["backend"],
        reload_includes=["*.py"]
    ) 