import { useState } from "react";
import { authService } from "../services/authService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [step, setStep] = useState(1);
  const [sendForm, setSendForm] = useState({ email: "", tempEmail: "", phoneNumber: "" });
  const [otp, setOtp] = useState("");
  const [passwordForm, setPasswordForm] = useState({ password: "", repeatPassword: "" });
  const [loading, setLoading] = useState(false);

  const sendOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.forgotSendOtp(sendForm);
      pushToast(typeof data === "string" ? data : "OTP sent", "success");
      setStep(2);
    } catch (error) {
      pushToast(error?.response?.data || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.forgotVerifyOtp({ otp });
      pushToast(typeof data === "string" ? data : "OTP verified", "success");
      setStep(3);
    } catch (error) {
      pushToast(error?.response?.data || "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.forgotChangePassword(passwordForm);
      pushToast(typeof data === "string" ? data : "Password updated", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      pushToast(error?.response?.data || "Password update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      const { data } = await authService.forgotResendOtp();
      pushToast(typeof data === "string" ? data : "OTP resent", "success");
    } catch (error) {
      pushToast(error?.response?.data || "Failed to resend OTP", "error");
    }
  };

  return (
    <div className="auth-page">
      {step === 1 ? (
        <form className="auth-card" onSubmit={sendOtp}>
          <span className="auth-badge">Recovery</span>
          <h1>Forgot Password</h1>
          <p>Provide at least 2 identifiers.</p>
          <input
            placeholder="Primary email"
            value={sendForm.email}
            onChange={(e) => setSendForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            placeholder="Backup email"
            value={sendForm.tempEmail}
            onChange={(e) => setSendForm((prev) => ({ ...prev, tempEmail: e.target.value }))}
          />
          <input
            placeholder="Phone number"
            value={sendForm.phoneNumber}
            onChange={(e) => setSendForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : null}

      {step === 2 ? (
        <form className="auth-card" onSubmit={verifyOtp}>
          <span className="auth-badge">OTP Check</span>
          <h1>Verify OTP</h1>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={resendOtp}>
            Resend OTP
          </button>
        </form>
      ) : null}

      {step === 3 ? (
        <form className="auth-card" onSubmit={changePassword}>
          <span className="auth-badge">Reset Password</span>
          <h1>Set New Password</h1>
          <input
            type="password"
            placeholder="New password"
            value={passwordForm.password}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <input
            type="password"
            placeholder="Repeat new password"
            value={passwordForm.repeatPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, repeatPassword: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
