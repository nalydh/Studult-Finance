"""
Email sending via Resend (https://resend.com).
Set RESEND_API_KEY and APP_URL in backend/.env
"""
import os
import resend

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
APP_URL = os.getenv("APP_URL")
#TODO: UPDATE FROM_EMAIL TO ACTUAL DOMAIN
FROM_EMAIL = "StuFin <noreply@yourdomain.com>" 


def _send(to: str, subject: str, html: str) -> None:
    """Fire-and-forget email via Resend. Logs errors but does not raise."""
    if not RESEND_API_KEY or RESEND_API_KEY.startswith("re_YOUR"):
        print(f"[email_service] RESEND_API_KEY not set — skipping email to {to}")
        print(f"[email_service] Subject: {subject}")
        return
    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
    except Exception as e:
        print(f"[email_service] Failed to send email to {to}: {e}")


def send_verification_email(to: str, token: str) -> None:
    link = f"{APP_URL}/auth/verify-email?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#18181b;margin-bottom:8px">Verify your StuFin email</h2>
      <p style="color:#71717a;margin-bottom:24px">
        Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.
      </p>
      <a href="{link}"
         style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:15px">
        Verify Email
      </a>
      <p style="margin-top:24px;color:#a1a1aa;font-size:13px">
        Or copy this link: <a href="{link}" style="color:#10b981">{link}</a>
      </p>
      <hr style="border:none;border-top:1px solid #f4f4f5;margin:24px 0"/>
      <p style="color:#a1a1aa;font-size:12px">
        If you didn't create a StuFin account, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to, "Verify your StuFin email", html)


def send_password_reset_email(to: str, token: str) -> None:
    link = f"{APP_URL}/auth/reset-password?token={token}"
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#18181b;margin-bottom:8px">Reset your StuFin password</h2>
      <p style="color:#71717a;margin-bottom:24px">
        Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
      </p>
      <a href="{link}"
         style="display:inline-block;background:#18181b;color:#fff;padding:12px 28px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:15px">
        Reset Password
      </a>
      <p style="margin-top:24px;color:#a1a1aa;font-size:13px">
        Or copy this link: <a href="{link}" style="color:#10b981">{link}</a>
      </p>
      <hr style="border:none;border-top:1px solid #f4f4f5;margin:24px 0"/>
      <p style="color:#a1a1aa;font-size:12px">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to, "Reset your StuFin password", html)
