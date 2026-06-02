import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { authService } from "../services/authService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

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
    const provided = [sendForm.email, sendForm.tempEmail, sendForm.phoneNumber].filter((item) => item.trim()).length;
    if (provided < 2) {
      pushToast("Provide at least 2 identifiers", "error");
      return;
    }
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
    if (passwordForm.password !== passwordForm.repeatPassword) {
      pushToast("Passwords do not match", "error");
      return;
    }
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
    <main className="auth-ref-page auth-forgot-ref">
      <Link className="auth-brand-ref" to="/" aria-label="AgroLink Hub home">
        <img src={agroLinkHubLogo} alt="" />
        <span><strong>AgroLink Hub</strong><small>Connect. Share. Sell.</small></span>
      </Link>
      <Link className="auth-top-link" to="/login">Back to Login</Link>

      <section className="auth-forgot-card">
        <span className="auth-security-orb">Lock</span>
        <h1>{step === 1 ? "Forgot Password" : step === 2 ? "Verify OTP" : "Set New Password"}</h1>
        <p>{step === 1 ? "Provide at least 2 identifiers so we can recover your account securely." : step === 2 ? "Enter the OTP sent through your selected recovery channel." : "Choose a strong new password."}</p>

        {step === 1 ? (
          <form className="auth-login-form" onSubmit={sendOtp}>
            <label className="auth-field-ref">
              <span>Primary Email Address</span>
              <input value={sendForm.email} onChange={(e) => setSendForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Enter your primary email" />
            </label>
            <label className="auth-field-ref">
              <span>Backup Email Address (Optional)</span>
              <input value={sendForm.tempEmail} onChange={(e) => setSendForm((prev) => ({ ...prev, tempEmail: e.target.value }))} placeholder="Enter your backup email" />
            </label>
            <label className="auth-field-ref">
              <span>Phone Number</span>
              <input value={sendForm.phoneNumber} onChange={(e) => setSendForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} placeholder="Enter your mobile number" />
            </label>
            <button className="auth-gradient-btn" type="submit" disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
          </form>
        ) : null}

        {step === 2 ? (
          <form className="auth-login-form" onSubmit={verifyOtp}>
            <label className="auth-field-ref">
              <span>OTP Code</span>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6} />
            </label>
            <button className="auth-gradient-btn" type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
            <button className="auth-text-button" type="button" onClick={resendOtp}>Resend OTP</button>
          </form>
        ) : null}

        {step === 3 ? (
          <form className="auth-login-form" onSubmit={changePassword}>
            <label className="auth-field-ref">
              <span>New Password</span>
              <input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="New password" />
            </label>
            <label className="auth-field-ref">
              <span>Repeat Password</span>
              <input type="password" value={passwordForm.repeatPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, repeatPassword: e.target.value }))} placeholder="Repeat new password" />
            </label>
            <button className="auth-gradient-btn" type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
