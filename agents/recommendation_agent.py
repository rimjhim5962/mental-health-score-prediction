"""Provide concise, general wellness suggestions for detected patterns."""


RECOMMENDATIONS = {
    "sleep": "Try maintaining a consistent sleep schedule.",
    "stress": "Consider a brief breathing or mindfulness break during your day.",
    "screen_usage": "Consider taking regular breaks from screen usage.",
    "physical_activity": "Include some physical activity in your routine.",
    "study_hours": "Balance focused study time with scheduled rest breaks.",
}


def generate_recommendations(patterns: list[str]) -> list[str]:
    return [RECOMMENDATIONS[pattern] for pattern in patterns]