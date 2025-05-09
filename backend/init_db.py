import asyncio
from database import patients_collection

sample_patients = [
    {"name": "Alice", "age": 32, "diagnosis": "Diabetes", "lab_result": 120.5},
    {"name": "Bob", "age": 45, "diagnosis": "Hypertension", "lab_result": 135.0},
    {"name": "Charlie", "age": 29, "diagnosis": "Asthma", "lab_result": 98.0},
]

async def init_db():
    await patients_collection.delete_many({})  # clear existing
    await patients_collection.insert_many(sample_patients)

if __name__ == "__main__":
    asyncio.run(init_db())
