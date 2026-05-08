import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "/src/modules/platform/user/services/userService";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    name: user?.firstName || "",
    lastName: user?.lastName || ""
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) {
      pushToast("First and last name are required", "error");
      return;
    }
    setLoading(true);
    try {
      await userService.updateName(form);
      await refreshUser();
      pushToast("Profile setup completed", "success");
      navigate("/home", { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to complete profile setup", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Set Up Profile</h1>
        <p>Complete your profile to continue.</p>

        <label htmlFor="onboarding-name">First name</label>
        <input
          id="onboarding-name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />

        <label htmlFor="onboarding-lastname">Last name</label>
        <input
          id="onboarding-lastname"
          value={form.lastName}
          onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
        />

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
