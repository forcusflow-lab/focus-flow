from decimal import Decimal, ROUND_HALF_UP

FEE_RATE = Decimal("0.15")
MONTHLY_PRICE = Decimal("4.99")
ANNUAL_PRICE = Decimal("29.99")
ANNUAL_PLAN_SHARE = Decimal("0.75")
MONTHLY_PLAN_SHARE = Decimal("0.25")
LEAN_FIXED_MONTHLY_COST = Decimal("100.00")
OWNER_DRAW_TARGET = Decimal("1000.00")

SCENARIOS = [
    ("検証", 1000, Decimal("0.01")),
    ("初期成立", 5000, Decimal("0.03")),
    ("有望", 20000, Decimal("0.06")),
]

def money(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

annual_net = ANNUAL_PRICE * (Decimal("1") - FEE_RATE)
monthly_net = MONTHLY_PRICE * (Decimal("1") - FEE_RATE)
weighted_monthly_net_per_payer = (
    ANNUAL_PLAN_SHARE * (annual_net / Decimal("12"))
    + MONTHLY_PLAN_SHARE * monthly_net
)
break_even_payers = LEAN_FIXED_MONTHLY_COST / weighted_monthly_net_per_payer
owner_draw_payers = (LEAN_FIXED_MONTHLY_COST + OWNER_DRAW_TARGET) / weighted_monthly_net_per_payer

print("scenario,monthly_active_users,paid_conversion,paying_subscribers,net_revenue_before_fixed_usd,lean_fixed_cost_usd,operating_contribution_usd")
for name, active_users, conversion in SCENARIOS:
    paying_subscribers = Decimal(active_users) * conversion
    gross_contribution = paying_subscribers * weighted_monthly_net_per_payer
    operating_contribution = gross_contribution - LEAN_FIXED_MONTHLY_COST
    print(
        f"{name},{active_users},{conversion},{money(paying_subscribers)},"
        f"{money(gross_contribution)},{money(LEAN_FIXED_MONTHLY_COST)},{money(operating_contribution)}"
    )

print("\nmetric,value_usd")
print(f"annual_plan_net_per_payer,{money(annual_net)}")
print(f"monthly_plan_net_per_payer,{money(monthly_net)}")
print(f"weighted_monthly_net_per_payer,{money(weighted_monthly_net_per_payer)}")
print(f"lean_cost_break_even_paying_subscribers,{money(break_even_payers)}")
print(f"paying_subscribers_for_1000_usd_owner_draw,{money(owner_draw_payers)}")
