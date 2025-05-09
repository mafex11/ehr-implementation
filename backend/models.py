from pydantic import BaseModel

class PatientSchema(BaseModel):
    name: str
    age: int
    diagnosis: str
    lab_result: float
