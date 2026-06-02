import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { authService } from "../services/authService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pushToast } = useToast();
  const inputRefs = useRef([]);
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const code = digits.join("");
  const email = location.state?.email || "your email";

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
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to resend OTP", "error");
    }
  };

  return (
    <main className="auth-ref-page auth-verify-ref">
      <Link className="auth-brand-ref" to="/" aria-label="AgroLink Hub home">
        <img src={agroLinkHubLogo} alt="" />
        <span><strong>AgroLink Hub</strong><small>Connect. Share. Sell.</small></span>
      </Link>

      <form className="auth-verify-card" onSubmit={verify}>
        <span className="auth-security-orb">OK</span>
        <h1>Verify your account</h1>
        <p>We sent a 6-digit verification code to <strong>{email}</strong></p>
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
        <p className="auth-expiry">Code expires soon</p>
        <button className="auth-gradient-btn" type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify & Continue"}</button>
        <button className="auth-text-button" type="button" onClick={resend}>Did not receive the code? Resend code</button>
      </form>
    </main>
  );
}
