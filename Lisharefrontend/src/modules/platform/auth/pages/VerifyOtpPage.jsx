import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { authService } from "../services/authService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

function VerifyIcon({ name }) {
  const icons = {
    checkShield: (
      <>
        <path d="M12 3l7 3v5.5c0 4.4-2.8 7.5-7 9.5-4.2-2-7-5.1-7-9.5V6z" />
        <path d="m9 12.2 2 2 4-4" />
      </>
    ),
    lock: (
      <>
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        <path d="M7 11h10v8H7z" />
        <path d="M12 14v2" />
      </>
    ),
    sparkle: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />,
    refresh: <><path d="M17 2v5h-5" /><path d="M7 22v-5h5" /><path d="M19 11a7 7 0 0 0-12.1-4.8L12 7" /><path d="M5 13a7 7 0 0 0 12.1 4.8L12 17" /></>,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />
  };

  return (
    <svg className="verify-svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] || icons.checkShield}
    </svg>
  );
}

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pushToast } = useToast();
  const inputRefs = useRef([]);
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(165);
  const code = digits.join("");
  const email = location.state?.email || "your email";
  const expiryLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const setDigit = (index, value) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = nextValue;
      return next;
    });
    if (nextValue && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] || ""));
    inputRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const verify = async (event) => {
    event.preventDefault();
    if (code.length !== 6) {
      pushToast("Enter the 6-digit verification code", "error");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.verifyOtp({ verifyCode: code });
      if (!data?.success) {
        pushToast(data?.message || "Verification failed", "error");
        return;
      }
      pushToast("Account verified. You can login now.", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.message || "Verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const { data } = await authService.resendOtp();
      pushToast(data?.message || "OTP resent", data?.success ? "success" : "error");
      if (data?.success) setSecondsLeft(165);
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to resend OTP", "error");
    }
  };

  return (
    <main className="auth-ref-page auth-verify-ref">
      <Link className="auth-brand-ref" to="/" aria-label="AgroLink Hub home">
        <img src={agroLinkHubLogo} alt="" />
        <span><strong>AgroLink <em>Hub</em></strong><small>Connect. Share. Sell. Grow Together.</small></span>
      </Link>

      <form className="auth-verify-card" onSubmit={verify}>
        <div className="verify-security-orbit" aria-hidden="true">
          <span className="verify-channel-badge verify-channel-sparkle"><VerifyIcon name="sparkle" /></span>
          <span className="verify-shield-badge"><VerifyIcon name="checkShield" /></span>
          <span className="verify-channel-badge verify-channel-lock"><VerifyIcon name="lock" /></span>
        </div>
        <h1>Verify your account</h1>
        <p className="verify-step-copy">We sent a 6-digit verification code to <strong>{email}</strong></p>
        <div className="otp-grid" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={`otp-${index}`}
              ref={(node) => { inputRefs.current[index] = node; }}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
              }}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Verification digit ${index + 1}`}
            />
          ))}
        </div>
        <p className="auth-expiry">Code expires in <strong>{expiryLabel}</strong></p>
        <div className="verify-resend-row">
          <VerifyIcon name="refresh" />
          <span>Did not receive the code?</span>
          <button className="auth-text-button" type="button" onClick={resend}>Resend code</button>
        </div>
        <button className="auth-gradient-btn verify-submit-btn" type="submit" disabled={loading}>
          <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
          {!loading ? <VerifyIcon name="arrowRight" /> : null}
        </button>
        <p className="verify-change-email">Wrong email address? <Link to="/signup">Change email</Link></p>
      </form>
    </main>
  );
}
