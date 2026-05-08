import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const { data } = await authService.verifyOtp({ verifyCode: code.trim() });
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
    <div className="auth-page">
      <form className="auth-card" onSubmit={verify}>
        <h1>Verify Email</h1>
        <p>Enter the OTP sent to your email.</p>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit OTP" maxLength={6} />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={resend}>
          Resend OTP
        </button>
      </form>
    </div>
  );
}
