import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "/src/modules/platform/app/store";
import { userService } from "/src/modules/platform/user/services/userService";
import { feedService } from "/src/modules/social/post/services/feedService";
import { followService } from "/src/modules/social/follow/services/followService";
import { friendService } from "/src/modules/social/friend/services/friendService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".avi"];

function extractApiPayload(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function isVideoAsset(url = "") {
  const normalized = String(url).toLowerCase().split("?")[0];
  return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function isVideoItem(item) {
  const mediaType = String(item?.mediaType || "").toUpperCase();
  if (mediaType === "VIDEO") return true;
  return item?.imageUrl ? isVideoAsset(item.imageUrl) : false;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [unsavingPostIds, setUnsavingPostIds] = useState([]);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    friends: 0
  });
  const [nameForm, setNameForm] = useState({ name: "", lastName: "" });
  const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const viewingUserId = Number(routeUserId || 0);
  const isOwnProfile = !viewingUserId || viewingUserId === Number(user?.userId || user?.id || 0);

  const displayName = `${profileUser?.firstName || profileUser?.firstname || profileUser?.name || ""} ${profileUser?.lastName || ""}`.trim()
    || user?.email
    || "User";

  const savedFeedPosts = useMemo(
    () => savedPosts.filter((post) => !isVideoItem(post)),
    [savedPosts]
  );

  const savedReels = useMemo(
    () => savedPosts.filter((post) => isVideoItem(post)),
    [savedPosts]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isOwnProfile) {
          const [followersCount, followingCount, friends, savedRes] = await Promise.all([
            followService.followersCount(),
            followService.followingCount(),
            friendService.getFriends(),
            feedService.getSavedPosts({ page: 0, size: 100 })
          ]);

          setProfileUser(user);
          setStats({
            followers: followersCount.data || 0,
            following: followingCount.data || 0,
            friends: Array.isArray(friends.data) ? friends.data.length : 0
          });
          setSavedPosts(savedRes?.data?.data?.content || []);
        } else {
          const response = await userService.getPublicProfile(viewingUserId);
          setProfileUser(extractApiPayload(response));
          setStats({ followers: 0, following: 0, friends: 0 });
          setSavedPosts([]);
        }
      } catch {
        pushToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    };

    setNameForm({ name: user?.firstName || "", lastName: user?.lastName || "" });
    load();
  }, [isOwnProfile, pushToast, user, viewingUserId]);

  const openSavedItem = (post) => {
    const postId = Number(post?.postId);
    if (!postId) return;
    navigate("/home", { state: { openPostId: postId, mode: isVideoItem(post) ? "reels" : "posts" } });
  };

  const unsaveSavedItem = async (post) => {
    const postId = Number(post?.postId);
    if (!postId || unsavingPostIds.includes(postId)) return;

    setUnsavingPostIds((prev) => [...prev, postId]);
    try {
      await feedService.unsavePost(postId);
      setSavedPosts((prev) => prev.filter((item) => Number(item?.postId) !== postId));
      pushToast(isVideoItem(post) ? "Reel removed from saved" : "Post removed from saved", "success");
    } catch {
      pushToast("Failed to remove saved item", "error");
    } finally {
      setUnsavingPostIds((prev) => prev.filter((id) => id !== postId));
    }
  };

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
      <section className="page-hero">
        <div>
          <h2>{isOwnProfile ? "Account Center" : displayName}</h2>
          <p>{isOwnProfile ? "Manage your identity, security and personal profile experience." : "Public profile overview."}</p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{stats.followers}</strong>
            <span>Followers</span>
          </article>
          <article>
            <strong>{stats.following}</strong>
            <span>Following</span>
          </article>
          <article>
            <strong>{stats.friends}</strong>
            <span>Friends</span>
          </article>
        </div>
      </section>

      <section className="profile-hero">
        <div className="profile-cover">
          {profileUser?.coverImageUrl ? <img src={toMediaUrl(profileUser.coverImageUrl)} alt="Cover" /> : null}
        </div>
        <div className="profile-avatar-wrap">
          {profileUser?.profileImageUrl || profileUser?.imageUrl ? (
            <img className="profile-avatar" src={toMediaUrl(profileUser.profileImageUrl || profileUser.imageUrl)} alt="Profile" />
          ) : (
            <div className="profile-avatar">{displayName.slice(0, 1) || "U"}</div>
          )}
          <div>
            <h2>{displayName}</h2>
            <p>{isOwnProfile ? user?.email : "Bondly profile"}</p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="card"><h3>{stats.followers}</h3><p>Followers</p></article>
        <article className="card"><h3>{stats.following}</h3><p>Following</p></article>
        <article className="card"><h3>{stats.friends}</h3><p>Friends</p></article>
      </section>

      {isOwnProfile ? (
        <section className="profile-saved-section card">
          <div className="feed-section-head compact">
            <h3>Saved Posts & Reels</h3>
            <button type="button" className="feed-view-btn" onClick={() => navigate("/home")}>Open Feed</button>
          </div>
          <div className="profile-saved-grid">
            <section>
              <h4>Saved Posts</h4>
              {savedFeedPosts.length === 0 ? <p className="muted">No saved posts yet.</p> : null}
              <ul className="simple-list saved-rail-list">
                {savedFeedPosts.slice(0, 6).map((post) => (
                  <li key={`profile-saved-post-${post.postId}`}>
                    <div className="profile-saved-row">
                      <button type="button" className="saved-rail-item" onClick={() => openSavedItem(post)}>
                        <span>{post.authorName || "Author"}</span>
                        <small>{(post.content || "Image post").slice(0, 80)}</small>
                      </button>
                      <button
                        type="button"
                        className="profile-unsave-btn"
                        disabled={unsavingPostIds.includes(Number(post.postId))}
                        onClick={() => unsaveSavedItem(post)}
                      >
                        {unsavingPostIds.includes(Number(post.postId)) ? "Removing" : "Unsave"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Saved Reels</h4>
              {savedReels.length === 0 ? <p className="muted">No saved reels yet.</p> : null}
              <ul className="simple-list saved-rail-list">
                {savedReels.slice(0, 6).map((post) => (
                  <li key={`profile-saved-reel-${post.postId}`}>
                    <div className="profile-saved-row">
                      <button type="button" className="saved-rail-item" onClick={() => openSavedItem(post)}>
                        <span>{post.authorName || "Author"}</span>
                        <small>{(post.content || "Video reel").slice(0, 80)}</small>
                      </button>
                      <button
                        type="button"
                        className="profile-unsave-btn"
                        disabled={unsavingPostIds.includes(Number(post.postId))}
                        onClick={() => unsaveSavedItem(post)}
                      >
                        {unsavingPostIds.includes(Number(post.postId)) ? "Removing" : "Unsave"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      ) : (
        <section className="card profile-public-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/home")}>Back to feed</button>
        </section>
      )}

      {isOwnProfile ? (
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
      ) : null}
    </div>
  );
}
