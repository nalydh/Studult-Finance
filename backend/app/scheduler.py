from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session, select
from app.database import engine
from app.models.user import User
from app.models.preference import Preference
from app.auth.email_service import send_weekly_reminder_email
from app.auth.utils import generate_unsubscribe_token
from datetime import datetime, timedelta
import asyncio

scheduler = AsyncIOScheduler()

def _weekday_from_name(name: str) -> int:
    mapping = {
        "monday": 0, "tuesday": 1, "wednesday": 2,
        "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
    }
    return mapping.get(name.lower(), 0)

def send_reminders():
    print("[Scheduler] Running weekly reminder check...")
    with Session(engine) as session:
        # Get all users who have opted into marketing emails
        users = session.exec(select(User).where(User.marketing_emails_enabled == True)).all()
        
        now = datetime.utcnow()
        tomorrow_weekday = (now.weekday() + 1) % 7
        
        for user in users:
            pref = session.exec(select(Preference).where(Preference.user_id == user.id)).first()
            if not pref:
                continue
                
            week_start_day = _weekday_from_name(pref.week_starts_on or "Monday")
            
            # Check if their week starts tomorrow
            if week_start_day == tomorrow_weekday:
                # Check if we already sent them a reminder in the last 5 days to avoid spam
                if pref.last_reminder_sent_date:
                    days_since_last = (now - pref.last_reminder_sent_date).days
                    if days_since_last < 5:
                        continue
                        
                print(f"[Scheduler] Sending weekly reminder to {user.email}")
                unsubscribe_token = generate_unsubscribe_token(user.id)
                send_weekly_reminder_email(
                    to=user.email,
                    name=user.name or "there",
                    unsubscribe_token=unsubscribe_token
                )
                
                # Update last reminder sent date
                pref.last_reminder_sent_date = now
                session.add(pref)
        
        session.commit()

def start_scheduler():
    # Run at the top of every hour
    scheduler.add_job(send_reminders, CronTrigger(minute=0))
    scheduler.start()
    print("[Scheduler] Started APScheduler for background tasks.")

def stop_scheduler():
    scheduler.shutdown()
    print("[Scheduler] Stopped APScheduler.")
