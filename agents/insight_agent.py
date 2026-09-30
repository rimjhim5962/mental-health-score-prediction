"""Describe observable input patterns without making medical claims."""


def analyze_insights(input_data: dict, score: float) -> dict:
    patterns = []
    insights = []

    if input_data["sleep_hours_per_night"] < 7:
        patterns.append("sleep")
        insights.append("Sleep duration is relatively low.")
    if input_data["stress_level"] in {"High", "Very High"}:
        patterns.append("stress")
        insights.append("Reported stress level is high.")
    if input_data["avg_daily_usage_hours"] >= 6:
        patterns.append("screen_usage")
        insights.append("Daily screen usage is relatively high.")
    if input_data["physical_activity_hours"] < 1:
        patterns.append("physical_activity")
        insights.append("Reported physical activity is relatively low.")
    if input_data["study_hours"] < 2:
        patterns.append("study_hours")
        insights.append("Reported study hours are relatively low.")

    if patterns:
        insights.append(
            f"These reported patterns may be associated with the predicted score of {score:.2f}/10; "
            "they do not establish cause."
        )

    return {"patterns": patterns, "insights": insights}