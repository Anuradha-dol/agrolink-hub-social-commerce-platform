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
  persona: "user",
  role: "ROLE_USER",
  location: "",
  preferredLanguage: "",
  bio: "",
  website: "",
  interests: ["Funny", "Education", "Business", "Farming"],
  hobbies: ["Gardening", "Photography", "Cooking", "Reading"],
  hobbyInput: "",
  acceptedTerms: false
};

const STEPS = [
  { id: 1, label: "Account Details" },
  { id: 2, label: "Profile Setup" },
  { id: 3, label: "Step 3 of 3 - Optional" }
];

const PROFILE_SETUP_STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Profile Details" },
  { id: 3, label: "Verify" }
];

const PERSONA_OPTIONS = [
  {
    id: "user",
    role: "ROLE_USER",
    title: "User",
    text: "Explore, connect, and engage.",
    accent: "blue",
    icon: "user"
  },
  {
    id: "business",
    role: "ROLE_BUSINESS",
    title: "Business Seller",
    text: "Sell products or services.",
    accent: "green",
    icon: "store"
  },
  {
    id: "farmer",
    role: "ROLE_BUSINESS",
    title: "Farmer Seller",
    text: "Sell farm produce or livestock.",
    accent: "leaf",
    icon: "leaf"
  },
  {
    id: "creator",
    role: "ROLE_USER",
    title: "Creator",
    text: "Create content and grow audience.",
    accent: "gold",
    icon: "star"
  }
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
  "Farming",
  "Sports",
  "Hobbies"
];

const INTEREST_ICONS = {
  Funny: "\uD83D\uDE0A",
  News: "\uD83D\uDCF0",
  Education: "\uD83C\uDF93",
  Lifestyle: "\u2615",
  Entertainment: "\uD83C\uDF7F",
  Business: "\uD83D\uDCBC",
  Technology: "\uD83D\uDDA5\uFE0F",
  Community: "\uD83D\uDC65",
  Marketplace: "\uD83D\uDECD\uFE0F",
  Farming: "\uD83C\uDF31",
  Sports: "\u26BD",
  Hobbies: "\uD83C\uDFA8"
};

const BENEFITS = [
  { title: "Share & Discover", text: "Post updates, stories, and helpful tips.", icon: "share" },
  { title: "Buy & Sell", text: "List products or services and reach more customers.", icon: "bag" },
  { title: "Learn & Connect", text: "Follow experts, join groups, and grow your network.", icon: "book" },
  { title: "Earn & Grow", text: "Monetize your content and build your brand.", icon: "chart" }
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

function StepRail({ step, profile = false }) {
  const steps = profile ? PROFILE_SETUP_STEPS : STEPS;
  return (
    <div className={`signup-step-rail pdf-step-rail ${profile ? "profile-step-rail" : ""}`} aria-label={`Step ${step} of 3`}>
      {steps.map((item) => (
        <span
          key={item.id}
          className={item.id < step ? "done" : item.id === step ? "active" : ""}
          aria-current={item.id === step ? "step" : undefined}
        >
          <strong>{profile && item.id < step ? "\u2713" : item.id}</strong>
          <small>{item.label}</small>
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

  const selectedPersona = useMemo(
    () => PERSONA_OPTIONS.find((item) => item.id === form.persona) || PERSONA_OPTIONS[0],
    [form.persona]
  );

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const selectPersona = (persona) => {
    setForm((prev) => ({
      ...prev,
      persona: persona.id,
      role: persona.role
    }));
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

    const pendingHobby = form.hobbyInput.trim();
    const hobbies = pendingHobby && !form.hobbies.includes(pendingHobby)
      ? [...form.hobbies, pendingHobby]
      : form.hobbies;

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
        hobbies: hobbies.join(",")
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
    <main className={`auth-ref-page auth-signup-ref auth-signup-step-${step}`}>
      <AuthBrand />
      <div className="auth-signup-top-actions">
        <span>Already have an account?</span>
        <Link to="/login">Log in</Link>
      </div>

      {step === 1 ? (
        <>
          <span className="signup-step1-photo-side photo-left" aria-hidden="true" />
          <span className="signup-step1-photo-side photo-right" aria-hidden="true" />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <span className="signup-step3-decor photo-left" aria-hidden="true" />
          <span className="signup-step3-decor photo-right" aria-hidden="true" />
        </>
      ) : null}

      {step === 2 ? (
        <aside className="signup-story-panel">
          <h1>Join a community that <span>grows</span> together</h1>
          <p>Share ideas, sell products, build your brand, and grow your impact.</p>
          <div className="signup-benefit-list">
            {BENEFITS.map((item) => (
              <article key={item.title}>
                <span className={`signup-benefit-icon icon-${item.icon}`} aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="signup-testimonial-card">
            <strong>"</strong>
            <p>AgroLink Hub helped me turn my ideas into income.</p>
            <div className="signup-testimonial-author">
              <span aria-hidden="true" />
              <small><b>- Blessing M.</b>Content Creator & Seller</small>
            </div>
          </div>
        </aside>
      ) : null}

      <form className="auth-step-card signup-pdf-card" onSubmit={register}>
        {false && step === 1 ? (
          <div className="signup-card-progress">
            <span>Step {step} of 3</span>
            <i style={{ "--progress": `${(step / 3) * 100}%` }} aria-hidden="true" />
          </div>
        ) : null}
        <StepRail step={step} />

        {step === 1 ? (
          <section className="auth-step-panel">
            <div className="auth-step-title centered">
              <div>
                <h2>Create your account</h2>
                <p>Let's get you started with your AgroLink Hub account.</p>
              </div>
            </div>

            <div className="auth-form-grid two">
              <Field label="First name" error={errors.firstname}>
                <input name="firstname" autoComplete="given-name" value={form.firstname} onChange={onChange} placeholder="Enter your first name" />
              </Field>
              <Field label="Last name" error={errors.lastName}>
                <input name="lastName" autoComplete="family-name" value={form.lastName} onChange={onChange} placeholder="Enter your last name" />
              </Field>
            </div>

            <Field label="Username (optional)">
              <input name="username" autoComplete="username" value={form.username} onChange={onChange} placeholder="Choose a username" />
            </Field>

            <Field label="Primary email" error={errors.email}>
              <input name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} placeholder="Enter your email address" />
            </Field>

            <div className="auth-form-grid two">
              <Field label="Password" error={errors.password}>
                <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} placeholder="Create a strong password" />
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <input name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={onChange} placeholder="Confirm your password" />
              </Field>
            </div>

            <label className="auth-check-row">
              <input name="acceptedTerms" type="checkbox" checked={form.acceptedTerms} onChange={onChange} />
              <span>I agree to the <b>Terms of Service</b> and <b>Privacy Policy</b>.</span>
            </label>
            {errors.acceptedTerms ? <small className="field-error">{errors.acceptedTerms}</small> : null}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="auth-step-panel">
            <div className="auth-step-title centered signup-step2-title">
              <div>
                <h2>Create your account</h2>
                <p><strong>Step 2 of 3:</strong> Tell us more about you.</p>
              </div>
            </div>

            {false ? <StepRail step={step} profile /> : null}

            <label className="auth-field-ref signup-phone-field">
              <span>Phone Number</span>
              <div className="signup-phone-control">
                <span className="signup-phone-flag" aria-hidden="true"><i /><i /></span>
                <select aria-label="Country code" defaultValue="+234">
                  <option value="+234">+234</option>
                  <option value="+94">+94</option>
                  <option value="+1">+1</option>
                </select>
                <input name="phoneNumber" autoComplete="tel" value={form.phoneNumber} onChange={onChange} placeholder="801 234 5678" />
              </div>
              <small className="signup-field-hint">We'll use this to secure your account and keep you updated.</small>
            </label>

            <div className="signup-section-label">I am joining as a...</div>
            <div className="signup-role-grid persona-role-grid">
              {PERSONA_OPTIONS.map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  className={`signup-role-card role-${persona.accent} ${form.persona === persona.id ? "active" : ""}`}
                  onClick={() => selectPersona(persona)}
                >
                  <span className="role-radio" aria-hidden="true" />
                  <span className={`role-card-icon icon-${persona.icon}`} aria-hidden="true" />
                  <strong>{persona.title}</strong>
                  <small>{persona.text}</small>
                </button>
              ))}
            </div>

            <div className="auth-form-grid two signup-profile-selects">
              <label className="auth-field-ref signup-select-field">
                <span>City / Location</span>
                <div className="signup-icon-control">
                  <span className="signup-control-icon icon-location" aria-hidden="true" />
                  <select name="location" value={form.location} onChange={onChange}>
                    <option value="">Select your city</option>
                    <option value="Colombo">Colombo</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Galle">Galle</option>
                    <option value="Jaffna">Jaffna</option>
                  </select>
                </div>
              </label>
              <label className="auth-field-ref signup-select-field">
                <span>Preferred Language</span>
                <div className="signup-icon-control">
                  <span className="signup-control-icon icon-globe" aria-hidden="true" />
                  <select name="preferredLanguage" value={form.preferredLanguage} onChange={onChange}>
                    <option value="">Select Language</option>
                    <option value="English">English</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>
              </label>
            </div>

            <label className="auth-field-ref signup-bio-field">
              <span>Tell us about you</span>
              <textarea name="bio" value={form.bio} onChange={onChange} maxLength={160} placeholder="Write a short bio or describe your purpose on AgroLink Hub..." />
              <small className="signup-text-count">{form.bio.length}/160</small>
            </label>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="auth-step-panel">
            <div className="auth-step-title centered">
              <div>
                <h2>Tell us more about you <em>(Optional)</em></h2>
                <p>Help us personalize your experience. You can always change these later.</p>
              </div>
            </div>

            <Field label="Backup email (optional)">
              <input name="tempEmail" type="email" autoComplete="email" value={form.tempEmail} onChange={onChange} placeholder="youremail@example.com" />
            </Field>

            <div className="signup-section-label">What are you interested in? <span>(Optional)</span></div>
            <div className="interest-choice-grid pdf-interest-grid">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={form.interests.includes(interest) ? "active" : ""}
                  onClick={() => toggleInterest(interest)}
                >
                  <span className="interest-choice-label">
                    <i aria-hidden="true">{INTEREST_ICONS[interest]}</i>
                    {interest}
                  </span>
                  {form.interests.includes(interest) ? <span className="interest-choice-check">{"\u2713"}</span> : null}
                </button>
              ))}
            </div>

            <label className="auth-field-ref">
              <span>What are your hobbies? (optional)</span>
              <div className="hobby-chip-editor pdf-hobby-editor">
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
              <strong>Great picks. We will personalize your feed and connect you with like-minded people.</strong>
              <span>You can update your preferences anytime from your profile settings.</span>
            </div>
          </section>
        ) : null}

        <footer className={`auth-step-actions ${step === 2 ? "signup-step2-actions" : ""}`}>
          {step > 1 ? <button type="button" className="auth-ghost-btn" onClick={() => setStep((current) => current - 1)}>Back</button> : <span />}
          {step < 3 ? (
            <button type="button" className="auth-gradient-btn" onClick={goNext}>Next</button>
          ) : (
            <div className="auth-final-actions">
              <button type="button" className="auth-ghost-btn" onClick={register} disabled={submitting}>Skip for now</button>
              <button type="submit" className="auth-gradient-btn" disabled={submitting}>
                {submitting ? "Creating..." : "Finish"}
              </button>
            </div>
          )}
        </footer>

        {step === 1 ? (
          <p className="auth-bottom-link">Already have an account? <Link to="/login">Sign in</Link></p>
        ) : (
          <p className={`signup-privacy-note ${step === 2 ? "signup-step2-privacy" : ""}`}>
            {step === 2 ? "Your information is safe with us. We respect your privacy." : "Your information is secure and will never be shared."}
          </p>
        )}
      </form>

      {step === 2 ? (
        <aside className="signup-visual-panel" aria-hidden="true">
          <div className="signup-market-illustration">
            <span className="signup-visual-dot dot-primary" />
            <span className="signup-visual-dot dot-success" />
            <span className="signup-visual-dot dot-soft" />
            <span className="signup-visual-trail trail-left" />
            <span className="signup-visual-trail trail-right" />
            <div className="signup-visual-photo-card">
              <span />
              <i />
              <strong />
            </div>
            <div className="signup-visual-bag-card"><i /></div>
            <div className="signup-visual-users-card"><i /><i /><i /></div>
            <div className="signup-visual-review-card"><i /><span /></div>
            <div className="signup-visual-store-card"><i /><span /></div>
          </div>
          <strong>More than a platform. <span>It's a movement.</span></strong>
          <p>Built for creators, sellers, farmers, and everyday people with big ideas.</p>
        </aside>
      ) : null}

      {step === 1 ? (
        <div className="signup-security-strip" aria-hidden="true">
          <span><strong>Secure & Reliable</strong><small>Your data is always protected</small></span>
          <span><strong>Community Driven</strong><small>Connect and grow together</small></span>
          <span><strong>Smart & Efficient</strong><small>Tools that work for you</small></span>
        </div>
      ) : null}
    </main>
  );
}
