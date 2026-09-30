"""Validate request fields and prepare the existing model input format."""

import pandas as pd
from pydantic import BaseModel, Field
from typing import Literal


TOP_COUNTRIES = [
    "Other", "India", "USA", "Canada", "Australia", "UK", "Germany",
    "Turkey", "Mexico", "France",
]


class StudentData(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: Literal["male", "female"]
    country: str = Field(..., min_length=1)
    academic_level: Literal["Undergraduate", "Graduate", "High School"]
    most_used_platform: Literal[
        "Facebook", "LinkedIn", "Instagram", "Snapchat", "Twitter",
        "YouTube", "TikTok", "LINE", "KakaoTalk", "VKontakte",
        "WhatsApp", "WeChat",
    ]
    purpose_of_use: Literal["Networking", "Education", "Entertainment", "News"]
    avg_daily_usage_hours: float = Field(..., ge=0, le=24)
    daily_unlocks: int = Field(..., ge=0)
    study_hours: float = Field(..., ge=0, le=24)
    physical_activity_hours: float = Field(..., ge=0, le=24)
    sleep_hours_per_night: float = Field(..., ge=0, le=24)
    stress_level: Literal["Medium", "Low", "Very High", "High"]


def assess_input(data: StudentData) -> dict:
    """Return validation status, observations, and the model-ready row."""
    if not data.country.strip():
        raise ValueError("country must not be blank")

    country_group = data.country if data.country in TOP_COUNTRIES else "Other"
    input_row = pd.DataFrame([{
        "Age": data.age,
        "Gender": data.gender,
        "Country": data.country,
        "Academic_Level": data.academic_level,
        "Most_Used_Platform": data.most_used_platform,
        "Purpose_Of_Use": data.purpose_of_use,
        "Avg_Daily_Usage_Hours": data.avg_daily_usage_hours,
        "Daily_Unlocks": data.daily_unlocks,
        "Study_Hours": data.study_hours,
        "Physical_Activity_Hours": data.physical_activity_hours,
        "Sleep_Hours_Per_Night": data.sleep_hours_per_night,
        "Stress_Level": data.stress_level,
        "Grouped_country": country_group,
    }])

    return {
        "is_valid": True,
        "observations": ["Required fields and supported value ranges are valid."],
        "input_data": data.dict(),
        "input_row": input_row,
    }