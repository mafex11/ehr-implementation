from fastapi import FastAPI
from backend.routes.ehr import router as ehr_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount the EHR router correctly
app.include_router(ehr_router, prefix="/api/ehr")

@app.get("/")
def read_root():
    return {"message": "EHR Privacy API is running"}

# Add this to allow running the application directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
