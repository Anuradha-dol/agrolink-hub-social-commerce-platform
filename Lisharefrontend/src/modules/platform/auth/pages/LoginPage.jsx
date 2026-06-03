import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { authService } from "../services/authService";
import { validateLogin } from "../validation/authValidation";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validation = validateLogin(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await authService.login({ email: form.email, password: form.password });
      if (!data?.success) {
        pushToast(data?.message || "Login failed", "error");
        return;
      }
      await refreshUser();
      pushToast("Login successful", "success");
      const redirectPath = location.state?.from?.pathname || "/home";
      navigate(redirectPath, { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.message || "Login failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-ref-page auth-login-ref">
      <Link className="auth-brand-ref" to="/" aria-label="AgroLink Hub home">
        <img src={agroLinkHubLogo} alt="" />
        <span><strong>AgroLink <em>Hub</em></strong><small>Connect. Share. Sell. Grow Together.</small></span>
      </Link>
      <Link className="auth-top-link" to="/signup">Create account</Link>

      <section className="auth-login-card">
        <div className="auth-card-logo">
          <img src={agroLinkHubLogo} alt="" />
          <h1>AgroLink <span>Hub</span></h1>
          <p>Connect. Share. Sell. Grow Together.</p>
        </div>
        <form onSubmit={onSubmit} className="auth-login-form">
          <div className="auth-step-title centered">
            <div>
              <h2>Welcome back</h2>
              <p>Sign in to continue to your account.</p>
            </div>
          </div>
          <label className="auth-field-ref">
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="youremail@example.com" />
            {errors.email ? <small className="field-error">{errors.email}</small> : null}
          </label>
          <label className="auth-field-ref">
            <span>Password</span>
            <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Enter your password" />
            {errors.password ? <small className="field-error">{errors.password}</small> : null}
          </label>
          <div className="auth-login-row">
            <label className="auth-check-row"><input name="remember" type="checkbox" checked={form.remember} onChange={onChange} /><span>Remember me</span></label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <button className="auth-gradient-btn" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
          <p className="auth-bottom-link">Do not have an account? <Link to="/signup">Create account</Link></p>
        </form>
      </section>

      <div className="login-photo-grid" aria-hidden="true">
        <span className="login-photo photo-a" />
        <span className="login-photo photo-b" />
        <span className="login-photo photo-c" />
        <span className="login-photo photo-d" />
      </div>
    </main>
  );
}
