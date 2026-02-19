from __future__ import annotations


def future_value(current_savings: float, monthly_contribution: float, monthly_return: float, months: int) -> float:
    if months <= 0:
        return current_savings
    if monthly_return == 0:
        return current_savings + monthly_contribution * months

    growth = (1 + monthly_return) ** months
    contribution_fv = monthly_contribution * ((growth - 1) / monthly_return)
    return current_savings * growth + contribution_fv


def calculate(inputs: dict) -> dict:
    current_age = int(inputs["current_age"])
    retirement_age = int(inputs["retirement_age"])
    current_savings = float(inputs["current_savings"])
    monthly_contribution = float(inputs["monthly_contribution"])
    expected_return_percent = float(inputs["expected_return_percent"])
    inflation_percent = float(inputs["inflation_percent"])
    withdrawal_rate_percent = float(inputs["withdrawal_rate_percent"])
    target_monthly_income = float(inputs.get("target_monthly_income", 0.0))

    years = retirement_age - current_age
    months = years * 12

    monthly_return = expected_return_percent / 100 / 12
    projected_balance = future_value(current_savings, monthly_contribution, monthly_return, months)

    annual_income_nominal = projected_balance * (withdrawal_rate_percent / 100)
    monthly_income_nominal = annual_income_nominal / 12

    inflation_factor = (1 + inflation_percent / 100) ** years
    monthly_income_today = monthly_income_nominal / inflation_factor if inflation_factor > 0 else monthly_income_nominal

    if target_monthly_income > 0:
        if monthly_income_today >= target_monthly_income:
            track = "On track for your target income"
        else:
            gap = target_monthly_income - monthly_income_today
            track = f"Not on track yet (estimated shortfall: ${gap:,.0f}/month in today's dollars)"
    else:
        track = "Target income not provided"

    return {
        "projected_balance_at_retirement": round(projected_balance, 2),
        "estimated_monthly_income_nominal": round(monthly_income_nominal, 2),
        "estimated_monthly_income_todays_dollars": round(monthly_income_today, 2),
        "track_indicator": track,
    }
