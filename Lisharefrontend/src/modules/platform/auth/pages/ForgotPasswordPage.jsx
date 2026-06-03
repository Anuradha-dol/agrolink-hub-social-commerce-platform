import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { authService } from "../services/authService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

const FORGOT_STEP_COPY = {
  1: {
    title: "Forgot Password",
    subtitle: "Provide at least 2 identifiers",
    copy: "Enter any two or more of the details below. We'll send a secure OTP to help you recover your account."
  },
  2: {
    title: "Verify OTP",
    subtitle: "Confirm your recovery code",
    copy: "Enter the OTP sent through your selected recovery channel."
  },
  3: {
    title: "Set New Password",
    subtitle: "Create a strong new password",
    copy: "Choose a secure password to protect your AgroLink Hub account."
  }
};

function ForgotIcon({ name }) {
  const icons = {
    arrowLeft: <path d="M15 18l-6-6 6-6M10 12h10" />,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
    mail: <><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></>,
    phone: <><path d="M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3z" /><path d="M10.5 18h3" /></>,
    key: <><path d="M7.5 14a3.5 3.5 0 1 1 2.8-1.4L21 2" /><path d="M16 7l2 2M13.5 9.5l2 2" /></>,
    lock: <><path d="M7 11V8a5 5 0 0 1 10 0v3" /><path d="M6 11h12v9H6z" /><path d="M12 15v2" /></>,
    shieldLock: <><path d="M12 3l7 3v5.5c0 4.4-2.8 7.5-7 9.5-4.2-2-7-5.1-7-9.5V6z" /><path d="M9 12h6v5H9z" /><path d="M10.5 12v-1.4a1.5 1.5 0 0 1 3 0V12" /></>,
    shieldCheck: <><path d="M12 3l7 3v5.5c0 4.4-2.8 7.5-7 9.5-4.2-2-7-5.1-7-9.5V6z" /><path d="m9 12.4 2 2 4-4" /></>
  };

  return (
    <svg className="forgot-svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] || icons.lock}
    </svg>
  );
}

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

  const stepCopy = FORGOT_STEP_COPY[step];

  return (
    <main className="auth-ref-page auth-forgot-ref">
      <Link className="auth-brand-ref" to="/" aria-label="AgroLink Hub home">
        <img src={agroLinkHubLogo} alt="" />
        <span><strong>AgroLink <em>Hub</em></strong><small>Connect. Share. Sell. Grow Together.</small></span>
      </Link>
      <Link className="auth-top-link auth-forgot-back" to="/login"><ForgotIcon name="arrowLeft" /> Back to Login</Link>

      <section className="auth-forgot-card">
        <div className="forgot-security-orbit" aria-hidden="true">
          <span className="forgot-channel-badge forgot-channel-mail"><ForgotIcon name="mail" /></span>
          <span className="forgot-shield-badge"><ForgotIcon name="shieldLock" /></span>
          <span className="forgot-channel-badge forgot-channel-phone"><ForgotIcon name="phone" /></span>
        </div>
        <h1>{stepCopy.title}</h1>
        <p className="forgot-step-subtitle">{stepCopy.subtitle}</p>
        <p className="forgot-step-copy">{stepCopy.copy}</p>

        {step === 1 ? (
          <form className="auth-login-form" onSubmit={sendOtp}>
            <label className="auth-field-ref forgot-field">
              <span>Primary Email Address</span>
              <div className="forgot-input-wrap">
                <span className="forgot-field-icon"><ForgotIcon name="mail" /></span>
                <input type="email" value={sendForm.email} onChange={(e) => setSendForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Enter your primary email" />
              </div>
            </label>
            <label className="auth-field-ref forgot-field">
              <span>Backup Email Address (Optional)</span>
              <div className="forgot-input-wrap">
                <span className="forgot-field-icon"><ForgotIcon name="mail" /></span>
                <input type="email" value={sendForm.tempEmail} onChange={(e) => setSendForm((prev) => ({ ...prev, tempEmail: e.target.value }))} placeholder="Enter your backup email" />
              </div>
            </label>
            <label className="auth-field-ref forgot-field">
              <span>Phone Number</span>
              <div className="forgot-input-wrap forgot-phone-wrap">
                <span className="forgot-field-icon"><ForgotIcon name="phone" /></span>
                <span className="forgot-country-code">LK&nbsp;&nbsp;+94</span>
                <input type="tel" value={sendForm.phoneNumber} onChange={(e) => setSendForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} placeholder="Enter your mobile number" />
              </div>
            </label>
            <button className="auth-gradient-btn forgot-submit-btn" type="submit" disabled={loading}>
              <span>{loading ? "Sending..." : "Send OTP"}</span>
              {!loading ? <ForgotIcon name="arrowRight" /> : null}
            </button>
          </form>
        ) : null}

        {step === 2 ? (
          <form className="auth-login-form" onSubmit={verifyOtp}>
            <label className="auth-field-ref forgot-field">
              <span>OTP Code</span>
              <div className="forgot-input-wrap">
                <span className="forgot-field-icon"><ForgotIcon name="key" /></span>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6} />
              </div>
            </label>
            <button className="auth-gradient-btn forgot-submit-btn" type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
            <button className="auth-text-button" type="button" onClick={resendOtp}>Resend OTP</button>
          </form>
        ) : null}

        {step === 3 ? (
          <form className="auth-login-form" onSubmit={changePassword}>
            <label className="auth-field-ref forgot-field">
              <span>New Password</span>
              <div className="forgot-input-wrap">
                <span className="forgot-field-icon"><ForgotIcon name="lock" /></span>
                <input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="New password" />
              </div>
            </label>
            <label className="auth-field-ref forgot-field">
              <span>Repeat Password</span>
              <div className="forgot-input-wrap">
                <span className="forgot-field-icon"><ForgotIcon name="lock" /></span>
                <input type="password" value={passwordForm.repeatPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, repeatPassword: e.target.value }))} placeholder="Repeat new password" />
              </div>
            </label>
            <button className="auth-gradient-btn forgot-submit-btn" type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</button>
          </form>
        ) : null}

        <div className="forgot-secure-note">
          <ForgotIcon name="shieldCheck" />
          <span><strong>Your information is encrypted and secure.</strong><small>We never share your data with third parties.</small></span>
        </div>
      </section>
    </main>
  );
}
