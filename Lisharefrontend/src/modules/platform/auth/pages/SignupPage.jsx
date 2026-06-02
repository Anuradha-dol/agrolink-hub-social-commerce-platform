import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { authService } from "../services/authService";
import { validateSignup } from "../validation/authValidation";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

const initialForm = {
  firstname: "",
  lastName: "",
  username: "",
  email: "",
  phoneNumber: "",
  tempEmail: "",
  password: "",
  confirmPassword: "",
  role: "ROLE_USER",
  location: "",
  preferredLanguage: "",
  bio: "",
  website: "",
  interests: [],
  hobbies: [],
  hobbyInput: "",
  acceptedTerms: false
};

const ROLE_OPTIONS = [
  { value: "ROLE_USER", title: "User", text: "Explore, connect, and engage with the community.", accent: "blue" },
  { value: "ROLE_BUSINESS", title: "Business Seller", text: "Sell products or services and manage customers.", accent: "green" },
  { value: "ROLE_ADMIN", title: "Admin", text: "Moderate users, reports, support, and platform safety.", accent: "gold" }
];

const INTERESTS = [
  "Funny",
  "News",
  "Education",
  "Lifestyle",
  "Entertainment",
  "Business",
  "Technology",
  "Community",
  "Marketplace",
  "Farming"
];

function AuthBrand() {
  return (
    <Link className="auth-brand-ref" to="/" aria-label="AgroLink Hub home">
      <img src={agroLinkHubLogo} alt="" />
      <span>
        <strong>AgroLink Hub</strong>
        <small>Connect. Share. Sell.</small>
      </span>
    </Link>
  );
}

function StepRail({ step }) {
  return (
    <div className="signup-step-rail" aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map((item) => (
        <span key={item} className={item < step ? "done" : item === step ? "active" : ""}>
          <strong>{item < step ? "\u2713" : item}</strong>
          <small>{item === 1 ? "Account" : item === 2 ? "Profile" : "Optional"}</small>
        </span>
      ))}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="auth-field-ref">
      <span>{label}</span>
      {children}
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = useMemo(() => ROLE_OPTIONS.find((item) => item.value === form.role) || ROLE_OPTIONS[0], [form.role]);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleInterest = (interest) => {
    setForm((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists ? prev.interests.filter((item) => item !== interest) : [...prev.interests, interest]
      };
    });
  };

  const removeHobby = (hobby) => {
    setForm((prev) => ({ ...prev, hobbies: prev.hobbies.filter((item) => item !== hobby) }));
  };

  const addHobby = () => {
    const next = form.hobbyInput.trim();
    if (!next || form.hobbies.includes(next)) return;
    setForm((prev) => ({ ...prev, hobbies: [...prev.hobbies, next], hobbyInput: "" }));
  };

  const validateStepOne = () => {
    const validation = validateSignup(form);
    if (form.password !== form.confirmPassword) validation.confirmPassword = "Passwords do not match";
    if (!form.acceptedTerms) validation.acceptedTerms = "Please agree to the terms before continuing";
    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateStepOne()) return;
    setStep((current) => Math.min(3, current + 1));
  };

  const register = async (event) => {
    event?.preventDefault();
    if (!validateStepOne()) {
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const optionalValue = (value) => {
        const cleaned = String(value || "").trim();
        return cleaned || null;
      };
      const payload = {
        firstname: form.firstname.trim(),
        lastName: form.lastName.trim(),
        username: optionalValue(form.username),
        email: form.email.trim(),
        phoneNumber: optionalValue(form.phoneNumber),
        tempEmail: optionalValue(form.tempEmail),
        password: form.password,
        role: form.role,
        location: optionalValue(form.location),
        preferredLanguage: optionalValue(form.preferredLanguage),
        bio: optionalValue(form.bio),
        website: optionalValue(form.website),
        interests: form.interests.join(","),
        hobbies: form.hobbies.join(",")
      };
      const { data } = await authService.register(payload);
      if (!data?.success) {
        pushToast(data?.message || "Signup failed", "error");
        return;
      }
      pushToast("Account created. Verify OTP.", "success");
      navigate("/verify", { state: { email: payload.email } });
    } catch (error) {
      pushToast(error?.response?.data?.message || error?.response?.data || "Signup failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-ref-page auth-signup-ref">
      <AuthBrand />
      <div className="auth-trust-note">Secure. Trusted. Built for you.</div>

      <aside className="signup-story-panel">
        <span className="auth-float-card auth-float-like">Like</span>
        <h1>Join a community that grows together</h1>
        <p>Share ideas, sell products, build your brand, and grow your impact.</p>
        <div className="signup-benefit-list">
          <article><strong>Share & Discover</strong><span>Post updates, stories, and helpful tips.</span></article>
          <article><strong>Buy & Sell</strong><span>List products or services and reach more customers.</span></article>
          <article><strong>Learn & Connect</strong><span>Follow experts, join groups, and grow your network.</span></article>
        </div>
      </aside>

      <form className="auth-step-card" onSubmit={register}>
        <StepRail step={step} />

        {step === 1 ? (
          <section className="auth-step-panel">
            <div className="auth-step-title">
              <span>1</span>
              <div>
                <h2>Create your account</h2>
                <p>Start with the required login details. Profile extras stay optional.</p>
              </div>
            </div>

            <div className="auth-form-grid two">
              <Field label="First name" error={errors.firstname}>
                <input name="firstname" value={form.firstname} onChange={onChange} placeholder="Enter your first name" />
              </Field>
              <Field label="Last name" error={errors.lastName}>
                <input name="lastName" value={form.lastName} onChange={onChange} placeholder="Enter your last name" />
              </Field>
            </div>

            <Field label="Username (optional)">
              <input name="username" value={form.username} onChange={onChange} placeholder="Choose a public username" />
            </Field>

            <Field label="Primary email" error={errors.email}>
              <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Enter your email address" />
            </Field>

            <div className="auth-form-grid two">
              <Field label="Password" error={errors.password}>
                <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Create a strong password" />
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Confirm your password" />
              </Field>
            </div>

            <label className="auth-check-row">
              <input name="acceptedTerms" type="checkbox" checked={form.acceptedTerms} onChange={onChange} />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>
            {errors.acceptedTerms ? <small className="field-error">{errors.acceptedTerms}</small> : null}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="auth-step-panel">
            <div className="auth-step-title">
              <span>2</span>
              <div>
                <h2>Profile setup</h2>
                <p>These details help personalize your account, but they are not required.</p>
              </div>
            </div>

            <div className="signup-role-grid">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  className={`signup-role-card role-${role.accent} ${form.role === role.value ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, role: role.value }))}
                >
                  <span />
                  <strong>{role.title}</strong>
                  <small>{role.text}</small>
                </button>
              ))}
            </div>

            <div className="auth-form-grid two">
              <Field label="Phone number (optional)">
                <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} placeholder="Add your phone number" />
              </Field>
              <Field label="Backup email (optional)">
                <input name="tempEmail" type="email" value={form.tempEmail} onChange={onChange} placeholder="you@example.com" />
              </Field>
            </div>

            <div className="auth-form-grid two">
              <Field label="City / Location (optional)">
                <input name="location" value={form.location} onChange={onChange} placeholder="Colombo, Sri Lanka" />
              </Field>
              <Field label="Preferred language (optional)">
                <select name="preferredLanguage" value={form.preferredLanguage} onChange={onChange}>
                  <option value="">Select language</option>
                  <option value="English">English</option>
                  <option value="Sinhala">Sinhala</option>
                  <option value="Tamil">Tamil</option>
                </select>
              </Field>
            </div>

            <Field label="Bio (optional)">
              <textarea name="bio" value={form.bio} onChange={onChange} maxLength={280} placeholder="Write a short bio or describe your purpose on AgroLink Hub." />
            </Field>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="auth-step-panel">
            <div className="auth-step-title centered">
              <span>3</span>
              <div>
                <h2>Tell us more about you</h2>
                <p>Optional. You can skip now and add interests, hobbies, and bio later from Profile.</p>
              </div>
            </div>

            <div className="interest-choice-grid">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={form.interests.includes(interest) ? "active" : ""}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                  {form.interests.includes(interest) ? <span>{"\u2713"}</span> : null}
                </button>
              ))}
            </div>

            <label className="auth-field-ref">
              <span>Hobbies (optional)</span>
              <div className="hobby-chip-editor">
                {form.hobbies.map((hobby) => (
                  <button key={hobby} type="button" onClick={() => removeHobby(hobby)}>
                    {hobby} <span aria-hidden="true">x</span>
                  </button>
                ))}
                <input
                  value={form.hobbyInput}
                  onChange={(event) => setForm((prev) => ({ ...prev, hobbyInput: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addHobby();
                    }
                  }}
                  placeholder="Add a hobby..."
                />
              </div>
            </label>

            <div className="optional-note-card">
              <strong>Optional step</strong>
              <span>Skipping will not block signup. You can add this from Profile after login.</span>
            </div>
          </section>
        ) : null}

        <footer className="auth-step-actions">
          {step > 1 ? <button type="button" className="auth-ghost-btn" onClick={() => setStep((current) => current - 1)}>Back</button> : <span />}
          {step < 3 ? (
            <button type="button" className="auth-gradient-btn" onClick={goNext}>Next</button>
          ) : (
            <div className="auth-final-actions">
              <button type="button" className="auth-ghost-btn" onClick={register} disabled={submitting}>Skip for now</button>
              <button type="submit" className="auth-gradient-btn" disabled={submitting}>
                {submitting ? "Creating..." : `Finish as ${selectedRole.title}`}
              </button>
            </div>
          )}
        </footer>

        <p className="auth-bottom-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>

      <aside className="signup-visual-panel" aria-hidden="true">
        <div className="auth-photo-stack photo-one" />
        <div className="auth-photo-stack photo-two" />
        <span className="auth-float-card auth-float-shop">Shop</span>
        <strong>More than a platform. It is a movement.</strong>
      </aside>
    </main>
  );
}
