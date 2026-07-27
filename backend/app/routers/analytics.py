from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from collections import defaultdict
from app.database import get_session
from app.models.snapshot import NetWorthSnapshot
from app.models.incomeevent import IncomeEvent
from app.models.account import Account
from app.models.asset import Asset
from app.models.investmentcontribution import InvestmentContribution
from app.auth.dependencies import get_current_user_id

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/data")
def get_analytics_data(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    try:
        # 1. Snapshots — this user only
        snapshots = session.exec(
            select(NetWorthSnapshot)
            .where(NetWorthSnapshot.user_id == user_id)
            .order_by(NetWorthSnapshot.snapshot_date.asc())
        ).all()

        netWorthData = []
        assetAllocationData = []

        for snap in snapshots:
            dt = snap.snapshot_date
            if isinstance(dt, str):
                dt = datetime.fromisoformat(dt)
            month_str = dt.strftime("%b '%y")

            netWorthData.append({
                "month": month_str,
                "value": round(snap.net_worth, 2),
                "note": snap.note,
            })
            assetAllocationData.append({
                "month": month_str,
                "cash":        round(snap.total_cash, 2),
                "investments": round(snap.total_investments, 2),
                "physical":    round(snap.total_assets, 2),
            })

        # Always append a live "Now" point from current balances
        now = datetime.utcnow()

        live_cash = session.exec(
            select(func.coalesce(func.sum(Account.balance), 0))
            .where(Account.user_id == user_id, Account.category == "Cash")
        ).one()
        live_investments = session.exec(
            select(func.coalesce(func.sum(Account.balance), 0))
            .where(Account.user_id == user_id, Account.category == "Investment")
        ).one()
        live_liabilities = session.exec(
            select(func.coalesce(func.sum(Account.balance), 0))
            .where(Account.user_id == user_id, Account.category == "Liability")
        ).one()
        live_assets = session.exec(
            select(func.coalesce(func.sum(func.coalesce(Asset.market_value, Asset.purchase_price)), 0))
            .where(Asset.user_id == user_id, Asset.is_sold == False)
        ).one()
        live_net_worth = (live_cash + live_investments + live_assets) - live_liabilities

        netWorthData.append({"month": "Now", "value": round(live_net_worth, 2), "isLive": True})
        assetAllocationData.append({
            "month": "Now",
            "cash":        round(live_cash, 2),
            "investments": round(live_investments, 2),
            "physical":    round(live_assets, 2),
            "isLive": True,
        })

        # 2. Income events — this user only
        incomes = session.exec(
            select(IncomeEvent)
            .where(IncomeEvent.user_id == user_id)
            .order_by(IncomeEvent.date.asc())
        ).all()

        current_month_key     = now.strftime("%Y-%m")
        current_month_needs   = 0.0
        current_month_wants   = 0.0
        current_month_savings = 0.0

        monthly_savings = defaultdict(float)
        weekly_data     = defaultdict(lambda: {"saved": 0.0, "needs": 0.0, "wants": 0.0})

        for event in incomes:
            dt = event.date
            if isinstance(dt, str):
                dt = datetime.fromisoformat(dt)

            month_key   = dt.strftime("%Y-%m")
            month_label = dt.strftime("%b")

            if month_key == current_month_key:
                current_month_needs   += event.needs_allocated
                current_month_wants   += event.wants_allocated
                current_month_savings += event.savings_allocated

            monthly_savings[month_label] += event.savings_allocated

            start_of_week = dt - timedelta(days=dt.weekday())
            week_label = start_of_week.strftime("%d %b")
            weekly_data[week_label]["saved"] += event.savings_allocated
            weekly_data[week_label]["needs"] += event.needs_allocated
            weekly_data[week_label]["wants"] += event.wants_allocated

        total_current_month = current_month_needs + current_month_wants + current_month_savings
        if total_current_month > 0:
            splitData = [
                {"name": "Needs",   "value": round((current_month_needs   / total_current_month) * 100, 1)},
                {"name": "Wants",   "value": round((current_month_wants   / total_current_month) * 100, 1)},
                {"name": "Savings", "value": round((current_month_savings / total_current_month) * 100, 1)},
            ]
        else:
            splitData = [
                {"name": "Needs",   "value": 50},
                {"name": "Wants",   "value": 30},
                {"name": "Savings", "value": 20},
            ]

        savingsRateData = []
        if monthly_savings:
            labels = list(monthly_savings.keys())[-6:]
            overall_average = round(sum(monthly_savings.values()) / len(monthly_savings), 2)
            for m_label in labels:
                savingsRateData.append({
                    "month":   m_label,
                    "saved":   round(monthly_savings[m_label], 2),
                    "average": overall_average,
                })

        allocationTrendsData = [
            {
                "label": w_label,
                "saved": round(weekly_data[w_label]["saved"], 2),
                "needs": round(weekly_data[w_label]["needs"], 2),
                "wants": round(weekly_data[w_label]["wants"], 2),
            }
            for w_label in list(weekly_data.keys())[-12:]
        ]

        incomeLog = [
            {
                "id":       event.id,
                "date":     event.date.strftime("%d %b %Y") if isinstance(event.date, datetime) else str(event.date)[:10],
                "source":   event.source,
                "strategy": event.strategy_name,
                "amount":   round(event.amount, 2),
                "needs":    round(event.needs_allocated, 2),
                "wants":    round(event.wants_allocated, 2),
                "savings":  round(event.savings_allocated, 2),
            }
            for event in sorted(incomes, key=lambda e: e.date, reverse=True)[:50]
        ]

        # 3. Derived spending.
        #
        # StuFin deliberately records no transactions, so outflow is inferred
        # rather than entered: income that did not end up as net worth was spent.
        #
        #   ΔNW = income − spending + investment_growth + asset_revaluation
        #   =>  spending ≈ income − ΔNW + investment_growth
        #
        # investment_growth is known exactly (change in balances minus the
        # contributions logged at check-in), so the only unmodelled term is
        # asset revaluation, which moves rarely. Buying an asset correctly does
        # not count as spending — value moved between columns, it didn't leave.
        contribution_rows = session.exec(
            select(InvestmentContribution)
            .join(Account, Account.id == InvestmentContribution.account_id)
            .where(Account.user_id == user_id)
        ).all()

        def _as_datetime(value):
            if isinstance(value, datetime):
                return value
            try:
                return datetime.fromisoformat(str(value)[:19])
            except (TypeError, ValueError):
                return None

        spendingData = []
        for prev_snap, curr_snap in zip(snapshots, snapshots[1:]):
            start = _as_datetime(prev_snap.snapshot_date)
            end = _as_datetime(curr_snap.snapshot_date)
            if not start or not end:
                continue

            income_in_period = sum(
                e.amount for e in incomes
                if (dt := _as_datetime(e.date)) and start < dt <= end
            )
            contributed_in_period = sum(
                c.amount for c in contribution_rows
                if (dt := _as_datetime(c.date)) and start < dt <= end
            )

            nw_change = curr_snap.net_worth - prev_snap.net_worth
            investment_growth = (
                curr_snap.total_investments - prev_snap.total_investments
            ) - contributed_in_period
            estimated_spending = income_in_period - nw_change + investment_growth
            kept = nw_change - investment_growth

            spendingData.append({
                "month":             end.strftime("%b '%y"),
                "income":            round(income_in_period, 2),
                "estimatedSpending": round(estimated_spending, 2),
                "investmentGrowth":  round(investment_growth, 2),
                "netWorthChange":    round(nw_change, 2),
                "savingsRate": (
                    round((kept / income_in_period) * 100, 1)
                    if income_in_period > 0 else None
                ),
            })

        return {
            "netWorthData":         netWorthData[-12:],
            "splitData":            splitData,
            "assetAllocationData":  assetAllocationData[-6:],
            "savingsRateData":      savingsRateData,
            "allocationTrendsData": allocationTrendsData,
            "incomeLog":            incomeLog,
            "spendingData":         spendingData[-12:],
        }

    except Exception as error:
        print(f"Internal Server Error: {error}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again later.")
