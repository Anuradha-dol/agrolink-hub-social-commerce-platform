import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { authService } from "../services/authService";
import { getUserLandingPath } from "../utils/roleRedirect";
import { validateLogin } from "../validation/authValidation";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("oauth2") !== "failed") return;

    pushToast(params.get("message") || "Google sign in failed", "error");
    navigate("/login", { replace: true });
  }, [location.search, navigate, pushToast]);

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
      const currentUser = await refreshUser();
      pushToast("Login successful", "success");
      const redirectPath = location.state?.from?.pathname || getUserLandingPath(currentUser || data);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.message || "Login failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const signInWithGoogle = () => {
    setOauthLoading(true);
    window.location.assign(authService.googleOAuthUrl());
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
          <button className="auth-gradient-btn" type="submit" disabled={submitting || oauthLoading}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
          <div className="auth-oauth-divider"><span>or continue with</span></div>
          <button className="auth-google-btn" type="button" onClick={signInWithGoogle} disabled={submitting || oauthLoading}>
            <GoogleIcon />
            <span>{oauthLoading ? "Opening Google..." : "Continue with Google"}</span>
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
