from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from agents.assessment_agent import StudentData
from agents.orchestrator import orchestrate_prediction

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"],
)


class PredictionResponse(BaseModel):
    score: float
    insights: List[str]
    recommendations: List[str]
    predicted_mental_health_score: float
    

@app.get('/')
def greek():
    return{"welcom to sanyukta"}


@app.post('/predict',response_model=PredictionResponse)
def predict(data: StudentData):
    try:
        return orchestrate_prediction(data)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error