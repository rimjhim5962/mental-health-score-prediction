"""Run the assessment, prediction, insight, and recommendation agents in order."""

from agents.assessment_agent import StudentData, assess_input
from agents.insight_agent import analyze_insights
from agents.prediction_agent import predict_score
from agents.recommendation_agent import generate_recommendations


def orchestrate_prediction(data: StudentData) -> dict:
    assessment = assess_input(data)
    score = predict_score(assessment["input_row"])
    insight_result = analyze_insights(assessment["input_data"], score)
    recommendations = generate_recommendations(insight_result["patterns"])

    return {
        "score": score,
        "insights": insight_result["insights"],
        "recommendations": recommendations,
        "predicted_mental_health_score": score,
    }