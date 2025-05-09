from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()  # loads variables from .env

# Use hardcoded connection string to bypass .env issues
MONGO_URL = "mongodb+srv://mafex:mafex@cluster0.oxnl42g.mongodb.net/"
client = AsyncIOMotorClient(MONGO_URL)
db = client["ehrdb"]  # database name
patients_collection = db["patients"]
