from fastapi import APIRouter
from backend.database import patients_collection
from backend.dp_engine import apply_dp_to_average
from pydantic import BaseModel
from bson.objectid import ObjectId

router = APIRouter()

class Patient(BaseModel):
    name: str
    age: int
    diagnosis: str
    lab_result: float

@router.get("/all")
async def get_all_patients():
    patients = []
    async for doc in patients_collection.find():
        doc["_id"] = str(doc["_id"])
        patients.append(doc)
    return patients

@router.get("/dp/lab_average")
async def get_dp_lab_average(epsilon: float = 1.0):
    cursor = patients_collection.find({}, {"lab_result": 1})
    values = []
    async for doc in cursor:
        if "lab_result" in doc:
            values.append(doc["lab_result"])
    return {
        "dp_average": apply_dp_to_average(values, epsilon),
        "epsilon": epsilon
    }

@router.post("/add")
async def add_patient(patient: Patient):
    result = await patients_collection.insert_one(patient.dict())
    return {"id": str(result.inserted_id)}
