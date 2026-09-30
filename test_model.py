import joblib
import pandas as pd

# Model load
model = joblib.load("mental-health-score-model.pkl")

# Test input
data = pd.DataFrame([{
    "Age": 20,
    "Gender": "Female",
    "Grouped_country": "India",
    "Academic_Level": "Undergraduate",
    "Most_Used_Platform": "Instagram",
    "Purpose_Of_Use": "Entertainment",
   "Avg_Daily_Usage_Hours": 12,
"Daily_Unlocks": 150,
"Study_Hours": 1,
"Physical_Activity_Hours": 0,
"Sleep_Hours_Per_Night": 3,
"Stress_Level": "High"
}])

print("Input:")
print(data)

print("\nPrediction:")

prediction = model.predict(data)

print(prediction)