import { useEffect, useState } from "react";
import { useAuth } from "/src/modules/platform/app/store";
import { userService } from "/src/modules/platform/user/services/userService";
import { followService } from "/src/modules/social/follow/services/followService";
import { friendService } from "/src/modules/social/friend/services/friendService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    friends: 0
  });
  const [nameForm, setNameForm] = useState({ name: "", lastName: "" });
  const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [followersCount, followingCount, friends] = await Promise.all([
          followService.followersCount(),
          followService.followingCount(),
          friendService.getFriends()
        ]);

        setStats({
          followers: followersCount.data || 0,
          following: followingCount.data || 0,
          friends: Array.isArray(friends.data) ? friends.data.length : 0
        });
      } catch {
        pushToast("Failed to load profile stats", "error");
      } finally {
        setLoading(false);
      }
    };

    setNameForm({ name: user?.firstName || "", lastName: user?.lastName || "" });
    load();
  }, [user, pushToast]);

  const updateName = async (event) => {
    event.preventDefault();
    try {
      await userService.updateName(nameForm);
      await refreshUser();
      pushToast("Name updated", "success");
    } catch {
      pushToast("Failed to update name", "error");
    }
  };

  const sendEmailOtp = async (event) => {
    event.preventDefault();
    try {
      await userService.updateEmail({ newEmail: emailForm.newEmail });
      pushToast("OTP sent to new email", "success");
    } catch {
      pushToast("Failed to send email OTP", "error");
    }
  };

  const verifyEmailOtp = async () => {
    try {
      await userService.verifyNewEmail(emailForm.otp);
      await refreshUser();
      pushToast("Email updated", "success");
      setEmailForm({ newEmail: "", otp: "" });
    } catch {
      pushToast("Failed to verify OTP", "error");
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    try {
      await userService.updatePassword(passwordForm);
      pushToast("Password updated", "success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      pushToast("Failed to update password", "error");
    }
  };

  if (loading) return <LoadingState text="Loading profile..." />;

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-cover">
          {user?.coverImageUrl ? <img src={toMediaUrl(user.coverImageUrl)} alt="Cover" /> : null}
        </div>
        <div className="profile-avatar-wrap">
          {user?.profileImageUrl || user?.imageUrl ? (
            <img className="profile-avatar" src={toMediaUrl(user.profileImageUrl || user.imageUrl)} alt="Profile" />
          ) : (
            <div className="profile-avatar">{user?.firstName?.[0] || "U"}</div>
          )}
          <div>
            <h2>
              {user?.firstName} {user?.lastName}
            </h2>
            <p>{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="card"><h3>{stats.followers}</h3><p>Followers</p></article>
        <article className="card"><h3>{stats.following}</h3><p>Following</p></article>
        <article className="card"><h3>{stats.friends}</h3><p>Friends</p></article>
      </section>

      <section className="profile-forms">
        <form className="card" onSubmit={updateName}>
          <h3>Update Name</h3>
          <input value={nameForm.name} onChange={(e) => setNameForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input
            value={nameForm.lastName}
            onChange={(e) => setNameForm((prev) => ({ ...prev, lastName: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit">Save</button>
        </form>

        <form className="card" onSubmit={sendEmailOtp}>
          <h3>Update Email</h3>
          <input
            type="email"
            placeholder="New email"
            value={emailForm.newEmail}
            onChange={(e) => setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))}
          />
          <button className="btn btn-secondary" type="submit">Send OTP</button>
          <div className="inline-form">
            <input
              placeholder="OTP"
              value={emailForm.otp}
              onChange={(e) => setEmailForm((prev) => ({ ...prev, otp: e.target.value }))}
            />
            <button className="btn btn-primary" type="button" onClick={verifyEmailOtp}>
              Verify
            </button>
          </div>
        </form>

        <form className="card" onSubmit={updatePassword}>
          <h3>Update Password</h3>
          <input
            type="password"
            placeholder="Current password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
          />
          <input
            type="password"
            placeholder="New password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit">Update Password</button>
        </form>
      </section>
    </div>
  );
}
