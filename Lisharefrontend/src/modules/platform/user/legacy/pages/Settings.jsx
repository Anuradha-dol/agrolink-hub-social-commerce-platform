import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "/src/modules/platform/app/store";
import { userService } from "/src/modules/platform/user/services/userService";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import defaultProfileCover from "/src/assets/backgrounds/profile-cover-4k-background.png";
import {
  Avatar,
  Button,
  Card,
  Icon,
  Modal,
  PageGrid,
  SectionHeader,
  StatusBadge
} from "/src/modules/platform/common/ui/DashboardUI";

const INTEREST_OPTIONS = ["Funny", "News", "Education", "Business", "Lifestyle", "Marketplace", "Community", "Farming", "Technology", "Sports"];

function unwrapProfile(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function splitCsv(value = "") {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function displayName(profile = {}) {
  return `${profile.firstName || profile.firstname || profile.name || ""} ${profile.lastName || ""}`.trim() || "AgroLink member";
}

function compactRole(role = "") {
  return String(role || "ROLE_USER").replace("ROLE_", "").replace("_", " ");
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [nameForm, setNameForm] = useState({ name: "", lastName: "" });
  const [profileDetailsForm, setProfileDetailsForm] = useState({
    username: "",
    phoneNumber: "",
    backupEmail: "",
    bio: "",
    location: "",
    preferredLanguage: "",
    website: "",
    interests: [],
    hobbies: "",
    hobbyInput: ""
  });
  const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [deleteForm, setDeleteForm] = useState({ currentPassword: "", otp: "" });
  const [removeMediaTarget, setRemoveMediaTarget] = useState("");
  const [deleteConfirmMode, setDeleteConfirmMode] = useState("");

  const profileName = displayName(profile);
  const roleLabel = compactRole(profile?.role || user?.role);
  const avatarUrl = profile?.profileImageUrl || profile?.imageUrl;
  const coverUrl = profile?.coverImageUrl || "";
  const hasCustomCover = Boolean(coverUrl);
  const hasCustomAvatar = Boolean(avatarUrl);
  const interests = splitCsv(profileDetailsForm.interests);

  const completionItems = useMemo(() => [
    { label: "Profile image", done: Boolean(avatarUrl) },
    { label: "Bio", done: Boolean(profileDetailsForm.bio.trim()) },
    { label: "Location", done: Boolean(profileDetailsForm.location.trim()) },
    { label: "Backup email", done: Boolean(profileDetailsForm.backupEmail.trim()) }
  ], [avatarUrl, profileDetailsForm.backupEmail, profileDetailsForm.bio, profileDetailsForm.location]);

  const hydrateForms = (nextProfile = {}) => {
    setNameForm({
      name: nextProfile.firstName || nextProfile.firstname || nextProfile.name || "",
      lastName: nextProfile.lastName || ""
    });
    setProfileDetailsForm({
      username: nextProfile.username || "",
      phoneNumber: nextProfile.phoneNumber || "",
      backupEmail: nextProfile.backupEmail || nextProfile.tempEmail || "",
      bio: nextProfile.bio || "",
      location: nextProfile.location || "",
      preferredLanguage: nextProfile.preferredLanguage || "",
      website: nextProfile.website || "",
      interests: splitCsv(nextProfile.interests),
      hobbies: splitCsv(nextProfile.hobbies).join(", "),
      hobbyInput: ""
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await userService.getMe();
        const nextProfile = unwrapProfile(response);
        setProfile(nextProfile);
        hydrateForms(nextProfile);
      } catch {
        const fallback = user || {};
        setProfile(fallback);
        hydrateForms(fallback);
        pushToast("Failed to refresh settings profile", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pushToast, user]);

  const updateProfileDetailsField = (field, value) => {
    setProfileDetailsForm((previous) => ({ ...previous, [field]: value }));
  };

  const toggleInterest = (interest) => {
    setProfileDetailsForm((previous) => ({
      ...previous,
      interests: previous.interests.includes(interest)
        ? previous.interests.filter((item) => item !== interest)
        : [...previous.interests, interest]
    }));
  };

  const addHobby = () => {
    const hobby = profileDetailsForm.hobbyInput.trim();
    if (!hobby) return;
    const current = splitCsv(profileDetailsForm.hobbies);
    if (current.includes(hobby)) {
      updateProfileDetailsField("hobbyInput", "");
      return;
    }
    setProfileDetailsForm((previous) => ({
      ...previous,
      hobbies: [...current, hobby].join(", "),
      hobbyInput: ""
    }));
  };

  const removeHobby = (hobby) => {
    setProfileDetailsForm((previous) => ({
      ...previous,
      hobbies: splitCsv(previous.hobbies).filter((item) => item !== hobby).join(", ")
    }));
  };

  const updateName = async (event) => {
    event.preventDefault();
    if (!nameForm.name.trim() || !nameForm.lastName.trim()) {
      pushToast("First name and last name are required", "error");
      return;
    }
    setSaving("name");
    try {
      await userService.updateName(nameForm);
      await refreshUser();
      setProfile((previous) => ({ ...previous, name: nameForm.name, firstName: nameForm.name, lastName: nameForm.lastName }));
      pushToast("Name updated", "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to update name", "error");
    } finally {
      setSaving("");
    }
  };

  const updateDetails = async (event) => {
    event.preventDefault();
    const optionalValue = (value) => {
      const cleaned = String(value || "").trim();
      return cleaned || null;
    };
    setSaving("details");
    try {
      const payload = {
        username: optionalValue(profileDetailsForm.username),
        phoneNumber: optionalValue(profileDetailsForm.phoneNumber),
        backupEmail: optionalValue(profileDetailsForm.backupEmail),
        bio: optionalValue(profileDetailsForm.bio),
        location: optionalValue(profileDetailsForm.location),
        preferredLanguage: optionalValue(profileDetailsForm.preferredLanguage),
        website: optionalValue(profileDetailsForm.website),
        interests: profileDetailsForm.interests.join(","),
        hobbies: optionalValue(profileDetailsForm.hobbies)
      };
      const response = await userService.updateProfileDetails(payload);
      const nextProfile = unwrapProfile(response);
      setProfile((previous) => ({ ...previous, ...nextProfile, ...payload }));
      await refreshUser();
      pushToast("Profile details updated", "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to update profile details", "error");
    } finally {
      setSaving("");
    }
  };

  const uploadProfileMedia = async (type, file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      pushToast("Only image files are allowed", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      pushToast("Image must be 8 MB or smaller", "error");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setSaving(type);
    try {
      const response = type === "profile-image"
        ? await userService.uploadProfileImage(formData)
        : await userService.uploadCoverImage(formData);
      const imageUrl = response?.data || "";
      setProfile((previous) => ({
        ...previous,
        ...(type === "profile-image"
          ? { profileImageUrl: imageUrl, imageUrl }
          : { coverImageUrl: imageUrl })
      }));
      await refreshUser();
      pushToast(type === "profile-image" ? "Profile picture updated" : "Cover picture updated", "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Image upload failed", "error");
    } finally {
      setSaving("");
    }
  };

  const removeProfileMedia = async () => {
    if (!removeMediaTarget) return;
    const isProfileImage = removeMediaTarget === "profile-image";
    setSaving(`remove-${removeMediaTarget}`);
    try {
      if (isProfileImage) {
        await userService.removeProfileImage();
        setProfile((previous) => ({ ...previous, profileImageUrl: "", imageUrl: "" }));
      } else {
        await userService.removeCoverImage();
        setProfile((previous) => ({ ...previous, coverImageUrl: "" }));
      }
      await refreshUser();
      pushToast(isProfileImage ? "Profile photo removed" : "Cover photo removed", "success");
      setRemoveMediaTarget("");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to remove image", "error");
    } finally {
      setSaving("");
    }
  };

  const sendEmailOtp = async (event) => {
    event.preventDefault();
    if (!emailForm.newEmail.includes("@")) {
      pushToast("Enter a valid email", "error");
      return;
    }
    setSaving("email");
    try {
      await userService.updateEmail({ newEmail: emailForm.newEmail.trim() });
      pushToast("OTP sent to new email", "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to request email OTP", "error");
    } finally {
      setSaving("");
    }
  };

  const verifyEmail = async () => {
    if (!emailForm.otp.trim()) {
      pushToast("OTP is required", "error");
      return;
    }
    setSaving("verify-email");
    try {
      await userService.verifyNewEmail(emailForm.otp.trim());
      await refreshUser();
      setEmailForm({ newEmail: "", otp: "" });
      pushToast("Email updated", "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to verify email", "error");
    } finally {
      setSaving("");
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      pushToast("New passwords do not match", "error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      pushToast("Password must be at least 6 characters", "error");
      return;
    }
    setSaving("password");
    try {
      await userService.updatePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      pushToast("Password updated", "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to update password", "error");
    } finally {
      setSaving("");
    }
  };

  const deleteAccountWithPassword = async (event) => {
    event.preventDefault();
    if (!deleteForm.currentPassword.trim()) {
      pushToast("Current password is required", "error");
      return;
    }
    setDeleteConfirmMode("password");
  };

  const confirmDeleteWithPassword = async () => {
    setSaving("delete");
    try {
      await userService.deleteAccount({ currentPassword: deleteForm.currentPassword });
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to delete account", "error");
    } finally {
      setSaving("");
    }
  };

  const requestDeleteOtp = async () => {
    setSaving("delete-otp");
    try {
      await userService.requestDeleteOtp();
      pushToast("Delete OTP sent to your registered email", "success");
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to request delete OTP", "error");
    } finally {
      setSaving("");
    }
  };

  const verifyDeleteOtp = async () => {
    if (!deleteForm.otp.trim()) {
      pushToast("Delete OTP is required", "error");
      return;
    }
    setDeleteConfirmMode("otp");
  };

  const confirmDeleteWithOtp = async () => {
    setSaving("verify-delete");
    try {
      await userService.verifyDeleteOtp({ otp: deleteForm.otp.trim() });
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to verify delete OTP", "error");
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return (
      <PageGrid className="settings-dashboard">
        <Card className="settings-loading-card">Loading settings...</Card>
      </PageGrid>
    );
  }

  return (
    <PageGrid className="settings-dashboard">
      <Card className="settings-hero-card">
        <div className="settings-hero-copy">
          <span className="auth-badge">Private Settings</span>
          <h2>Account settings that match your profile workflow.</h2>
          <p>Update identity, optional profile details, login email, password, and account safety from one protected page.</p>
        </div>
        <div className="settings-profile-summary">
          <Avatar name={profileName} src={avatarUrl ? toMediaUrl(avatarUrl) : null} size="xl" online />
          <div>
            <strong>{profileName}</strong>
            <span>{profile?.email || "No email"}</span>
            <StatusBadge status={roleLabel} tone={profile?.role === "ROLE_ADMIN" ? "purple" : "green"} />
          </div>
        </div>
      </Card>

      <div className="settings-layout">
        <main className="settings-main">
          <Card className="settings-card settings-media-card">
            <SectionHeader title="Profile Media" subtitle="Update or reset your profile photo and clean mountain cover image." />
            <div className="settings-media-preview">
              <div className="settings-cover-preview">
                <img src={coverUrl ? toMediaUrl(coverUrl) : defaultProfileCover} alt="Profile cover preview" />
              </div>
              <div className="settings-avatar-preview">
                <Avatar name={profileName} src={avatarUrl ? toMediaUrl(avatarUrl) : null} size="xl" online />
                <div>
                  <strong>{profileName}</strong>
                  <span>{profile?.email || "No email"}</span>
                </div>
              </div>
            </div>
            <div className="settings-media-actions">
              <Button icon="image" onClick={() => coverInputRef.current?.click()} disabled={saving === "cover-image"}>
                {saving === "cover-image" ? "Uploading..." : "Change Cover Photo"}
              </Button>
              <Button icon="trash" variant="danger" onClick={() => setRemoveMediaTarget("cover-image")} disabled={!hasCustomCover || saving === "remove-cover-image"}>
                {saving === "remove-cover-image" ? "Removing..." : "Remove Cover Photo"}
              </Button>
              <Button icon="user" variant="gradient" onClick={() => avatarInputRef.current?.click()} disabled={saving === "profile-image"}>
                {saving === "profile-image" ? "Uploading..." : "Change Profile Photo"}
              </Button>
              <Button icon="trash" variant="danger" onClick={() => setRemoveMediaTarget("profile-image")} disabled={!hasCustomAvatar || saving === "remove-profile-image"}>
                {saving === "remove-profile-image" ? "Removing..." : "Remove Profile Photo"}
              </Button>
              <input
                ref={coverInputRef}
                className="hidden-file-input"
                type="file"
                accept="image/*"
                onChange={(event) => uploadProfileMedia("cover-image", event.target.files?.[0])}
              />
              <input
                ref={avatarInputRef}
                className="hidden-file-input"
                type="file"
                accept="image/*"
                onChange={(event) => uploadProfileMedia("profile-image", event.target.files?.[0])}
              />
            </div>
          </Card>

          <Card className="settings-card">
            <SectionHeader title="Display Name" subtitle="This name appears across posts, stories, marketplace, and admin workflows." />
            <form className="form-grid settings-form-grid" onSubmit={updateName}>
              <input className="ui-field" value={nameForm.name} onChange={(event) => setNameForm((previous) => ({ ...previous, name: event.target.value }))} placeholder="First name" />
              <input className="ui-field" value={nameForm.lastName} onChange={(event) => setNameForm((previous) => ({ ...previous, lastName: event.target.value }))} placeholder="Last name" />
              <Button variant="gradient" icon="check" type="submit" disabled={saving === "name"}>
                {saving === "name" ? "Saving..." : "Save Name"}
              </Button>
            </form>
          </Card>

          <Card className="settings-card">
            <SectionHeader title="Profile Details" subtitle="These fields are optional. Signup does not force users to complete them." />
            <form className="form-grid settings-profile-form" onSubmit={updateDetails}>
              <div className="settings-two-grid">
                <input className="ui-field" value={profileDetailsForm.username} onChange={(event) => updateProfileDetailsField("username", event.target.value)} placeholder="Username" />
                <input className="ui-field" value={profileDetailsForm.phoneNumber} onChange={(event) => updateProfileDetailsField("phoneNumber", event.target.value)} placeholder="Phone number" />
              </div>
              <div className="settings-two-grid">
                <input className="ui-field" type="email" value={profileDetailsForm.backupEmail} onChange={(event) => updateProfileDetailsField("backupEmail", event.target.value)} placeholder="Backup email" />
                <select className="ui-field" value={profileDetailsForm.preferredLanguage} onChange={(event) => updateProfileDetailsField("preferredLanguage", event.target.value)}>
                  <option value="">Preferred language</option>
                  <option value="English">English</option>
                  <option value="Sinhala">Sinhala</option>
                  <option value="Tamil">Tamil</option>
                </select>
              </div>
              <div className="settings-two-grid">
                <input className="ui-field" value={profileDetailsForm.location} onChange={(event) => updateProfileDetailsField("location", event.target.value)} placeholder="Location" />
                <input className="ui-field" value={profileDetailsForm.website} onChange={(event) => updateProfileDetailsField("website", event.target.value)} placeholder="Website" />
              </div>
              <textarea className="ui-field" rows={4} maxLength={280} value={profileDetailsForm.bio} onChange={(event) => updateProfileDetailsField("bio", event.target.value)} placeholder="Bio" />
              <div className="settings-interest-grid">
                {INTEREST_OPTIONS.map((interest) => (
                  <button key={interest} type="button" className={profileDetailsForm.interests.includes(interest) ? "active" : ""} onClick={() => toggleInterest(interest)}>
                    {interest}
                  </button>
                ))}
              </div>
              <div className="profile-hobby-editor settings-hobby-editor">
                {splitCsv(profileDetailsForm.hobbies).map((hobby) => (
                  <button key={hobby} type="button" onClick={() => removeHobby(hobby)}>
                    {hobby} <span aria-hidden="true">x</span>
                  </button>
                ))}
                <input
                  value={profileDetailsForm.hobbyInput}
                  onChange={(event) => updateProfileDetailsField("hobbyInput", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addHobby();
                    }
                  }}
                  placeholder="Add hobby..."
                />
              </div>
              <Button variant="gradient" icon="check" type="submit" disabled={saving === "details"}>
                {saving === "details" ? "Saving..." : "Save Profile Details"}
              </Button>
            </form>
          </Card>

          <div className="settings-account-grid">
            <Card className="settings-card">
              <SectionHeader title="Update Email" subtitle="A verification OTP is required before the email changes." />
              <form className="form-grid" onSubmit={sendEmailOtp}>
                <input className="ui-field" type="email" value={emailForm.newEmail} onChange={(event) => setEmailForm((previous) => ({ ...previous, newEmail: event.target.value }))} placeholder="New email" />
                <Button variant="gradient" icon="send" type="submit" disabled={saving === "email"}>
                  {saving === "email" ? "Sending..." : "Send OTP"}
                </Button>
                <div className="inline-action-row settings-inline-field">
                  <input className="ui-field" value={emailForm.otp} onChange={(event) => setEmailForm((previous) => ({ ...previous, otp: event.target.value }))} placeholder="OTP code" />
                  <Button icon="check" onClick={verifyEmail} disabled={saving === "verify-email"}>
                    {saving === "verify-email" ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="settings-card">
              <SectionHeader title="Update Password" subtitle="Keep your account secure with a strong password." />
              <form className="form-grid" onSubmit={updatePassword}>
                <input className="ui-field" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((previous) => ({ ...previous, currentPassword: event.target.value }))} placeholder="Current password" />
                <input className="ui-field" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))} placeholder="New password" />
                <input className="ui-field" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((previous) => ({ ...previous, confirmPassword: event.target.value }))} placeholder="Confirm password" />
                <Button variant="gradient" icon="check" type="submit" disabled={saving === "password"}>
                  {saving === "password" ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </Card>
          </div>

          <Card className="settings-card settings-danger-card">
            <SectionHeader title="Danger Zone" subtitle="Delete your own account with password confirmation or email OTP." action={<StatusBadge status="Protected" tone="red" />} />
            <form className="form-grid settings-danger-grid" onSubmit={deleteAccountWithPassword}>
              <input className="ui-field" type="password" value={deleteForm.currentPassword} onChange={(event) => setDeleteForm((previous) => ({ ...previous, currentPassword: event.target.value }))} placeholder="Current password" />
              <Button variant="danger" icon="trash" type="submit" disabled={saving === "delete"}>
                {saving === "delete" ? "Deleting..." : "Delete Account"}
              </Button>
            </form>
            <div className="settings-delete-otp-row">
              <Button icon="send" onClick={requestDeleteOtp} disabled={saving === "delete-otp"}>
                {saving === "delete-otp" ? "Sending..." : "Request Delete OTP"}
              </Button>
              <input className="ui-field" value={deleteForm.otp} onChange={(event) => setDeleteForm((previous) => ({ ...previous, otp: event.target.value }))} placeholder="Delete OTP" />
              <Button variant="danger" icon="check" onClick={verifyDeleteOtp} disabled={saving === "verify-delete"}>
                {saving === "verify-delete" ? "Deleting..." : "Verify & Delete"}
              </Button>
            </div>
          </Card>
        </main>

        <aside className="settings-side">
          <Card className="settings-side-card">
            <SectionHeader title="Account Overview" action={<Icon name="settings" />} />
            <div className="settings-account-metadata">
              <span><strong>Role</strong>{roleLabel}</span>
              <span><strong>Email</strong>{profile?.email || "Not available"}</span>
              <span><strong>XP</strong>{Number(profile?.verifiedXp || 0).toLocaleString()}</span>
              <span><strong>Interests</strong>{interests.length || 0}</span>
            </div>
          </Card>

          <Card className="settings-side-card">
            <SectionHeader title="Profile Completion" subtitle="Optional details can always be updated after signup." />
            <div className="settings-check-list">
              {completionItems.map((item) => (
                <span key={item.label} className={item.done ? "done" : ""}>
                  <Icon name={item.done ? "check" : "plus"} />
                  {item.label}
                </span>
              ))}
            </div>
            <Button icon="user" onClick={() => navigate("/profile")}>Open Profile</Button>
          </Card>

          {profile?.moderationMessage ? (
            <Card className="settings-side-card settings-moderation-card">
              <SectionHeader title="Admin Message" action={<StatusBadge status={profile?.moderationStatus || "Message"} tone="orange" />} />
              <p>{profile.moderationMessage}</p>
            </Card>
          ) : null}
        </aside>
      </div>

      <Modal
        open={Boolean(removeMediaTarget)}
        title={removeMediaTarget === "cover-image" ? "Remove Cover Photo" : "Remove Profile Photo"}
        subtitle="This resets your saved profile media."
        onClose={saving ? undefined : () => setRemoveMediaTarget("")}
        footer={(
          <>
            <Button onClick={() => setRemoveMediaTarget("")} disabled={Boolean(saving)}>Cancel</Button>
            <Button icon="trash" variant="danger" onClick={removeProfileMedia} disabled={Boolean(saving)}>
              {saving ? "Removing..." : "Remove Photo"}
            </Button>
          </>
        )}
      >
        <p className="settings-remove-media-copy">
          {removeMediaTarget === "cover-image"
            ? "Your custom cover will be removed and the default mountain sunset cover will be shown."
            : "Your custom profile photo will be removed and the default avatar will be shown."}
        </p>
      </Modal>

      <Modal
        open={Boolean(deleteConfirmMode)}
        title="Delete Account"
        subtitle="This is permanent and cannot be undone."
        onClose={saving ? undefined : () => setDeleteConfirmMode("")}
        footer={(
          <>
            <Button onClick={() => setDeleteConfirmMode("")} disabled={Boolean(saving)}>Cancel</Button>
            <Button
              icon="trash"
              variant="danger"
              onClick={deleteConfirmMode === "otp" ? confirmDeleteWithOtp : confirmDeleteWithPassword}
              disabled={Boolean(saving)}
            >
              {saving ? "Deleting..." : "Delete Account"}
            </Button>
          </>
        )}
      >
        <div className="confirmation-panel danger-confirmation-panel">
          <span><Icon name="trash" /></span>
          <div>
            <strong>Confirm permanent account deletion</strong>
            <p>{deleteConfirmMode === "otp" ? "Your delete OTP will be verified before removal." : "Your current password will be used before removal."}</p>
          </div>
        </div>
      </Modal>
    </PageGrid>
  );
}
