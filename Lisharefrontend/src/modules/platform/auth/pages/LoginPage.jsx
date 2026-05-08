import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { validateLogin } from "../validation/authValidation";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validation = validateLogin(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await authService.login(form);
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
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <span className="auth-badge">Welcome Back</span>
        <h1>Welcome Back</h1>
        <p>Login to continue.</p>

        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" value={form.email} onChange={onChange} />
        {errors.email ? <span className="field-error">{errors.email}</span> : null}

        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" value={form.password} onChange={onChange} />
        {errors.password ? <span className="field-error">{errors.password}</span> : null}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </button>

        <div className="auth-links">
          <Link to="/signup">Create account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </form>
    </div>
  );
}
