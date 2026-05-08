import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { validateSignup } from "../validation/authValidation";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

const initialForm = {
  firstname: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  tempEmail: "",
  password: "",
  role: "ROLE_USER"
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validation = validateSignup(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await authService.register(form);
      if (!data?.success) {
        pushToast(data?.message || "Signup failed", "error");
        return;
      }
      pushToast("Account created. Verify OTP.", "success");
      navigate("/verify");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Signup failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create Account</h1>
        <p>Get started with Lishare.</p>

        <label htmlFor="signup-firstname">First name</label>
        <input id="signup-firstname" name="firstname" value={form.firstname} onChange={onChange} />
        {errors.firstname ? <span className="field-error">{errors.firstname}</span> : null}

        <label htmlFor="signup-lastname">Last name</label>
        <input id="signup-lastname" name="lastName" value={form.lastName} onChange={onChange} />
        {errors.lastName ? <span className="field-error">{errors.lastName}</span> : null}

        <label htmlFor="signup-email">Primary email</label>
        <input id="signup-email" name="email" type="email" value={form.email} onChange={onChange} />
        {errors.email ? <span className="field-error">{errors.email}</span> : null}

        <label htmlFor="signup-temp-email">Backup email (optional)</label>
        <input id="signup-temp-email" name="tempEmail" type="email" value={form.tempEmail} onChange={onChange} />

        <label htmlFor="signup-phone">Phone number</label>
        <input id="signup-phone" name="phoneNumber" value={form.phoneNumber} onChange={onChange} />
        {errors.phoneNumber ? <span className="field-error">{errors.phoneNumber}</span> : null}

        <label htmlFor="signup-role">Account type</label>
        <select id="signup-role" name="role" value={form.role} onChange={onChange}>
          <option value="ROLE_USER">User</option>
          <option value="ROLE_BUSINESS">Business</option>
        </select>

        <label htmlFor="signup-password">Password</label>
        <input id="signup-password" name="password" type="password" value={form.password} onChange={onChange} />
        {errors.password ? <span className="field-error">{errors.password}</span> : null}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Account"}
        </button>
        <div className="auth-links">
          <Link to="/login">Already have an account?</Link>
        </div>
      </form>
    </div>
  );
}
