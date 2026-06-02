import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "/src/modules/platform/app/store";
import { userService } from "/src/modules/platform/user/services/userService";
import { feedService } from "/src/modules/social/post/services/feedService";
import { followService } from "/src/modules/social/follow/services/followService";
import { friendService } from "/src/modules/social/friend/services/friendService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import {
  Avatar,
  Button,
  Card,
  EmptyPanel,
  GradientButton,
  Icon,
  LineChart,
  Modal,
  PageGrid,
  SectionHeader,
  StatCard,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".avi"];

function payload(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function isVideoAsset(url = "") {
  return VIDEO_EXTENSIONS.some((ext) => String(url).toLowerCase().split("?")[0].endsWith(ext));
}

function isVideoItem(item) {
  return String(item?.mediaType || "").toUpperCase() === "VIDEO" || isVideoAsset(item?.imageUrl);
}

function displayName(profile, fallback) {
  return `${profile?.firstName || profile?.firstname || profile?.name || ""} ${profile?.lastName || profile?.lastname || ""}`.trim()
    || fallback?.name
    || fallback?.email
    || "AgroLink User";
}

function xpModel(user) {
  const xp = Number(user?.verifiedXp ?? user?.xp ?? user?.experiencePoints ?? 0);
  const level = Number(user?.level ?? Math.floor(Math.max(0, xp) / 1000) + 1);
  const next = Math.max(1000, level * 1000);
  const start = Math.max(0, (level - 1) * 1000);
  const progress = Math.min(100, Math.max(0, ((xp - start) / Math.max(1, next - start)) * 100));
  const history = Array.isArray(user?.xpHistory) ? user.xpHistory : [];
  const badges = Array.isArray(user?.badges) ? user.badges : [];
  return { xp, level, next, progress, history, badges };
}

function resolveUserId(profile) {
  return Number(profile?.userId || profile?.id || 0);
}

function hasVerifiedBadge(profile) {
  return Boolean(profile?.profileVerified || profile?.verifiedBadge || Number(profile?.verifiedXp || 0) >= 100);
}

function isOnlineUser(profile) {
  return Boolean(profile?.online || profile?.isOnline || profile?.presence === "ONLINE");
}

function compactText(value = "", fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function truncateText(value = "", length = 58) {
  const text = compactText(value);
  return text.length > length ? `${text.slice(0, length - 3)}...` : text;
}

function savedItemMediaUrl(post) {
  const mediaPath = post?.imageUrl || post?.mediaUrl || post?.thumbnailUrl || post?.coverImageUrl || "";
  return mediaPath ? toMediaUrl(mediaPath) : "";
}

function savedItemTitle(post, video) {
  return truncateText(
    post?.title || post?.content || post?.shareCaption,
    54
  ) || (video ? "Saved reel" : "Saved post");
}

function formatProfileDate(value) {
  if (!value) return "Recently saved";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently saved";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

const XP_SYSTEM_STEPS = [
  {
    icon: "bookmark",
    title: "Create Valuable Content",
    text: "Share educational posts, useful answers, and verified listings."
  },
  {
    icon: "users",
    title: "Help & Support Community",
    text: "Earn when your support is accepted or positively reviewed."
  },
  {
    icon: "spark",
    title: "Stay Active & Consistent",
    text: "Build a steady record of trusted activity over time."
  }
];

const DEFAULT_ACHIEVEMENTS = [
  {
    title: "Getting Started",
    subtitle: "Complete your profile setup",
    date: "Profile milestone",
    tone: "green"
  }
];

const PROFILE_INTEREST_OPTIONS = ["Funny", "News", "Education", "Business", "Lifestyle", "Marketplace", "Community", "Farming", "Technology", "Sports"];

function splitCsv(value = "") {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [profileUser, setProfileUser] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeSavedTab, setActiveSavedTab] = useState("posts");
  const [stats, setStats] = useState({ followers: 0, following: 0, friends: 0 });
  const [networkLists, setNetworkLists] = useState({ followers: [], following: [], friends: [] });
  const [activeNetwork, setActiveNetwork] = useState("");
  const [relationship, setRelationship] = useState({ isFollowing: false, isFriend: false, requested: false });
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
  const viewingUserId = Number(routeUserId || 0);
  const isOwnProfile = !viewingUserId || viewingUserId === Number(user?.userId || user?.id || 0);
  const currentUserId = Number(user?.userId || user?.id || 0);
  const name = displayName(profileUser, user);
  const handleSource = profileUser?.username || (isOwnProfile ? (profileUser?.email || user?.email || name) : (profileUser?.email || name));
  const handle = `@${String(handleSource).split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()}`;
  const profileEmail = isOwnProfile ? (profileUser?.email || user?.email || "") : (profileUser?.email || "");
  const profileBio = compactText(profileUser?.bio, "Add a short bio from Profile Settings so others understand your purpose.");
  const profileLocation = compactText(profileUser?.location, "Location not added");
  const profileLanguage = compactText(profileUser?.preferredLanguage, "Language not added");
  const profileWebsite = compactText(profileUser?.website, "");
  const profileInterests = splitCsv(profileUser?.interests);
  const profileHobbies = splitCsv(profileUser?.hobbies);
  const xp = xpModel(profileUser || user);
  const xpChartValues = xp.history.length
    ? xp.history.slice(-7).map((entry) => Math.max(4, Number(entry.points || entry.value || 0)))
    : [Math.max(0, xp.progress || 0)];
  const achievementRows = xp.history.length
    ? xp.history.slice(0, 3).map((entry) => ({ title: entry.reason || "Verified XP earned", subtitle: `+${Number(entry.points || 0)} XP`, date: formatProfileDate(entry.createdAt), tone: "green" }))
    : xp.badges.length
      ? xp.badges.slice(0, 3).map((badge) => ({ title: badge, subtitle: "Badge unlocked", date: "Verified milestone", tone: "purple" }))
      : DEFAULT_ACHIEVEMENTS;

  const savedFeedPosts = useMemo(() => savedPosts.filter((post) => !isVideoItem(post)), [savedPosts]);
  const savedReels = useMemo(() => savedPosts.filter((post) => isVideoItem(post)), [savedPosts]);
  const activeSaved = activeSavedTab === "posts" ? savedFeedPosts : savedReels;
  const activeNetworkList = activeNetwork ? (networkLists[activeNetwork] || []) : [];
  const activeNetworkTitle = activeNetwork
    ? `${activeNetwork.slice(0, 1).toUpperCase()}${activeNetwork.slice(1)}`
    : "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isOwnProfile) {
          const [followersRes, followingRes, friendsRes, savedRes] = await Promise.all([
            followService.followers(),
            followService.following(),
            friendService.getFriends(),
            feedService.getSavedPosts({ page: 0, size: 100 })
          ]);
          const followers = Array.isArray(followersRes.data) ? followersRes.data : [];
          const following = Array.isArray(followingRes.data) ? followingRes.data : [];
          const friends = Array.isArray(friendsRes.data) ? friendsRes.data : [];
          setProfileUser(user);
          setNameForm({ name: user?.firstName || user?.firstname || user?.name || "", lastName: user?.lastName || user?.lastname || "" });
          setProfileDetailsForm({
            username: user?.username || "",
            phoneNumber: user?.phoneNumber || "",
            backupEmail: user?.backupEmail || user?.tempEmail || "",
            bio: user?.bio || "",
            location: user?.location || "",
            preferredLanguage: user?.preferredLanguage || "",
            website: user?.website || "",
            interests: splitCsv(user?.interests),
            hobbies: splitCsv(user?.hobbies).join(", "),
            hobbyInput: ""
          });
          setStats({
            followers: followers.length,
            following: following.length,
            friends: friends.length
          });
          setNetworkLists({ followers, following, friends });
          setRelationship({ isFollowing: false, isFriend: false, requested: false });
          setSavedPosts(savedRes?.data?.data?.content || []);
        } else {
          const [profileRes, followersRes, followingRes, friendsRes, myFollowingRes, myFriendsRes] = await Promise.all([
            userService.getPublicProfile(viewingUserId),
            followService.followersForUser(viewingUserId),
            followService.followingForUser(viewingUserId),
            friendService.getFriendsForUser(viewingUserId),
            followService.following(),
            friendService.getFriends()
          ]);
          const followers = Array.isArray(followersRes.data) ? followersRes.data : [];
          const following = Array.isArray(followingRes.data) ? followingRes.data : [];
          const friends = Array.isArray(friendsRes.data) ? friendsRes.data : [];
          const myFollowing = Array.isArray(myFollowingRes.data) ? myFollowingRes.data : [];
          const myFriends = Array.isArray(myFriendsRes.data) ? myFriendsRes.data : [];
          setProfileUser(payload(profileRes));
          setStats({ followers: followers.length, following: following.length, friends: friends.length });
          setNetworkLists({ followers, following, friends });
          setRelationship({
            isFollowing: myFollowing.some((entry) => Number(entry.userId) === viewingUserId),
            isFriend: myFriends.some((entry) => Number(entry.userId) === viewingUserId),
            requested: false
          });
          setSavedPosts([]);
        }
      } catch {
        pushToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOwnProfile, pushToast, user, viewingUserId]);

  const openSavedItem = (post) => {
    const postId = Number(post?.postId);
    if (!postId) return;
    navigate("/home", { state: { openPostId: postId, mode: isVideoItem(post) ? "reels" : "posts" } });
  };

  const openNetworkUser = (entry) => {
    const targetUserId = Number(entry?.userId || entry?.id || 0);
    if (!targetUserId) return;
    setActiveNetwork("");
    navigate(targetUserId === currentUserId ? "/profile" : `/profile/${targetUserId}`);
  };

  const uploadProfileMedia = async (type, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setSaving(type);
    try {
      const response = type === "profile-image"
        ? await userService.uploadProfileImage(formData)
        : await userService.uploadCoverImage(formData);
      const imageUrl = response?.data || "";
      setProfileUser((prev) => ({
        ...prev,
        ...(type === "profile-image"
          ? { profileImageUrl: imageUrl, imageUrl }
          : { coverImageUrl: imageUrl })
      }));
      await refreshUser();
      pushToast(type === "profile-image" ? "Profile picture updated" : "Cover picture updated", "success");
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Image upload failed", "error");
    } finally {
      setSaving("");
    }
  };

  const toggleProfileFollow = async () => {
    if (!viewingUserId) return;
    setSaving("follow");
    try {
      if (relationship.isFollowing) {
        await followService.unfollow(viewingUserId);
        setRelationship((prev) => ({ ...prev, isFollowing: false }));
        setStats((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        setNetworkLists((prev) => ({
          ...prev,
          followers: prev.followers.filter((entry) => Number(entry.userId) !== currentUserId)
        }));
        pushToast("Unfollowed", "success");
      } else {
        await followService.follow(viewingUserId);
        setRelationship((prev) => ({ ...prev, isFollowing: true }));
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
        setNetworkLists((prev) => ({
          ...prev,
          followers: [{ ...user, userId: currentUserId }, ...prev.followers]
        }));
        pushToast("Followed", "success");
      }
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Failed to update follow", "error");
    } finally {
      setSaving("");
    }
  };

  const toggleProfileFriend = async () => {
    if (!viewingUserId) return;
    setSaving("friend");
    try {
      if (relationship.isFriend) {
        await friendService.unfriend(viewingUserId);
        setRelationship((prev) => ({ ...prev, isFriend: false }));
        setStats((prev) => ({ ...prev, friends: Math.max(0, prev.friends - 1) }));
        setNetworkLists((prev) => ({
          ...prev,
          friends: prev.friends.filter((entry) => Number(entry.userId) !== currentUserId)
        }));
        pushToast("Friend removed", "success");
      } else {
        await friendService.request(viewingUserId);
        setRelationship((prev) => ({ ...prev, requested: true }));
        pushToast("Friend request sent", "success");
      }
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Failed to update friend", "error");
    } finally {
      setSaving("");
    }
  };

  const unsaveSavedItem = async (post) => {
    const postId = Number(post?.postId);
    if (!postId) return;
    setSaving(`unsave-${postId}`);
    try {
      await feedService.unsavePost(postId);
      setSavedPosts((prev) => prev.filter((item) => Number(item?.postId) !== postId));
      pushToast("Saved item removed", "success");
    } catch {
      pushToast("Failed to remove saved item", "error");
    } finally {
      setSaving("");
    }
  };

  const updateName = async (event) => {
    event.preventDefault();
    if (!nameForm.name.trim()) {
      pushToast("First name is required", "error");
      return;
    }
    setSaving("name");
    try {
      await userService.updateName(nameForm);
      await refreshUser();
      pushToast("Name updated", "success");
    } catch {
      pushToast("Failed to update name", "error");
    } finally {
      setSaving("");
    }
  };

  const updateProfileDetailsField = (field, value) => {
    setProfileDetailsForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProfileInterest = (interest) => {
    setProfileDetailsForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest]
    }));
  };

  const addProfileHobby = () => {
    const hobby = profileDetailsForm.hobbyInput.trim();
    if (!hobby) return;
    const current = splitCsv(profileDetailsForm.hobbies);
    if (current.includes(hobby)) {
      updateProfileDetailsField("hobbyInput", "");
      return;
    }
    setProfileDetailsForm((prev) => ({
      ...prev,
      hobbies: [...current, hobby].join(", "),
      hobbyInput: ""
    }));
  };

  const removeProfileHobby = (hobby) => {
    setProfileDetailsForm((prev) => ({
      ...prev,
      hobbies: splitCsv(prev.hobbies).filter((item) => item !== hobby).join(", ")
    }));
  };

  const updateProfileDetails = async (event) => {
    event.preventDefault();
    setSaving("profile-details");
    try {
      const optionalValue = (value) => {
        const cleaned = String(value || "").trim();
        return cleaned || null;
      };
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
      setProfileUser(response?.data || { ...profileUser, ...payload });
      await refreshUser();
      pushToast("Profile details updated", "success");
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Failed to update profile details", "error");
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
      await userService.updateEmail({ newEmail: emailForm.newEmail });
      pushToast("OTP sent to new email", "success");
    } catch {
      pushToast("Failed to send email OTP", "error");
    } finally {
      setSaving("");
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailForm.otp.trim()) {
      pushToast("OTP is required", "error");
      return;
    }
    setSaving("otp");
    try {
      await userService.verifyNewEmail(emailForm.otp.trim());
      await refreshUser();
      pushToast("Email updated", "success");
      setEmailForm({ newEmail: "", otp: "" });
    } catch {
      pushToast("Failed to verify OTP", "error");
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
    if (passwordForm.newPassword.length < 8) {
      pushToast("Password must be at least 8 characters", "error");
      return;
    }
    setSaving("password");
    try {
      await userService.updatePassword(passwordForm);
      pushToast("Password updated", "success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      pushToast("Failed to update password", "error");
    } finally {
      setSaving("");
    }
  };

  if (loading) return <LoadingState text="Loading profile..." />;

  return (
    <PageGrid className="profile-dashboard">
      <Card className="profile-cover-card">
        <div className="profile-cover-art">
          {profileUser?.coverImageUrl ? <img src={toMediaUrl(profileUser.coverImageUrl)} alt="Profile cover" /> : null}
          {isOwnProfile ? (
            <>
              <button
                type="button"
                className="profile-cover-upload-btn"
                onClick={() => coverInputRef.current?.click()}
                disabled={saving === "cover-image"}
              >
                <Icon name="image" />
                {saving === "cover-image" ? "Uploading..." : "Change Cover"}
              </button>
              <input
                ref={coverInputRef}
                className="hidden-file-input"
                type="file"
                accept="image/*"
                onChange={(event) => uploadProfileMedia("cover-image", event.target.files?.[0])}
              />
            </>
          ) : null}
        </div>
        <div className="profile-identity-row">
          <div className="profile-avatar-wrap">
            <Avatar
              name={name}
              src={profileUser?.profileImageUrl || profileUser?.imageUrl ? toMediaUrl(profileUser.profileImageUrl || profileUser.imageUrl) : null}
              size="xl"
              online
              className="profile-main-avatar"
            />
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  className="profile-avatar-upload-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={saving === "profile-image"}
                  aria-label="Change profile picture"
                  title="Change profile picture"
                >
                  <Icon name="image" />
                </button>
                <input
                  ref={avatarInputRef}
                  className="hidden-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => uploadProfileMedia("profile-image", event.target.files?.[0])}
                />
              </>
            ) : null}
          </div>
          <div className="profile-name-stack">
            <h2>
              {name}
              {isOnlineUser(profileUser) ? <StatusBadge status="Online" tone="green" /> : <StatusBadge status="Profile" tone="blue" />}
              {hasVerifiedBadge(profileUser) ? <StatusBadge status="Verified XP" tone="blue" /> : null}
            </h2>
            <p className="profile-hero-bio">{profileBio}</p>
            <div className="profile-contact-list">
              <span><Icon name="user" /> {handle}</span>
              {profileEmail ? <span><Icon name="send" /> {profileEmail}</span> : null}
              <span><Icon name="pin" /> {profileLocation}</span>
            </div>
          </div>
          {isOwnProfile ? (
            <GradientButton icon="edit" onClick={() => document.querySelector(".profile-forms-grid")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Edit Profile</GradientButton>
          ) : (
            <div className="profile-action-row">
              <Button icon="user" variant={relationship.isFollowing ? "secondary" : "gradient"} disabled={saving === "follow"} onClick={toggleProfileFollow}>
                {relationship.isFollowing ? "Unfollow" : "Follow"}
              </Button>
              <Button icon={relationship.isFriend ? "trash" : "users"} variant={relationship.isFriend ? "danger" : "secondary"} disabled={saving === "friend" || relationship.requested} onClick={toggleProfileFriend}>
                {relationship.isFriend ? "Unfriend" : relationship.requested ? "Requested" : "Add Friend"}
              </Button>
              <Button icon="chat" onClick={() => navigate("/chat", { state: { startUserId: viewingUserId } })}>Chat</Button>
            </div>
          )}
        </div>
        <div className="profile-pill-stats">
          <button type="button" onClick={() => setActiveNetwork("followers")}><Icon name="users" /> <strong>{stats.followers}</strong> Followers</button>
          <button type="button" onClick={() => setActiveNetwork("following")}><Icon name="user" /> <strong>{stats.following}</strong> Following</button>
          <button type="button" onClick={() => setActiveNetwork("friends")}><Icon name="chat" /> <strong>{stats.friends}</strong> Friends</button>
        </div>
      </Card>

      <div className="profile-content-grid profile-reference-grid">
        <div className="profile-main-stack">
          <div className="stat-grid profile-mini-stats">
            <StatCard icon="users" label="Followers" value={stats.followers} trend="Tap to view" tone="blue" onClick={() => setActiveNetwork("followers")} />
            <StatCard icon="user" label="Following" value={stats.following} trend="Tap to view" tone="purple" onClick={() => setActiveNetwork("following")} />
            <StatCard icon="chat" label="Friends" value={stats.friends} trend="Tap to view" tone="pink" onClick={() => setActiveNetwork("friends")} />
          </div>

          <Card className="saved-card profile-saved-card">
            <SectionHeader
              title="Saved Posts & Reels"
              subtitle="Posts and reels you saved from the social feed."
              action={<Button icon="home" onClick={() => navigate("/home")}>Open Feed</Button>}
            />
            <Tabs
              active={activeSavedTab}
              onChange={setActiveSavedTab}
              tabs={[
                { value: "posts", label: "Saved Posts", icon: "image", count: savedFeedPosts.length },
                { value: "reels", label: "Saved Reels", icon: "video", count: savedReels.length }
              ]}
            />
            <div className="saved-list-grid saved-tile-grid">
              {activeSaved.length === 0 ? (
                <EmptyPanel icon="save" title={`No saved ${activeSavedTab} yet`} subtitle="Saved feed items will appear here for quick access." />
              ) : activeSaved.slice(0, 4).map((post, index) => {
                const video = isVideoItem(post);
                const mediaUrl = savedItemMediaUrl(post);
                const title = savedItemTitle(post, video);
                return (
                  <article key={`${activeSavedTab}-${post.postId}`} className={`saved-tile-card saved-tile-${index % 4}`}>
                    <button type="button" className="saved-tile-open" onClick={() => openSavedItem(post)}>
                      <div className="saved-tile-media">
                        {mediaUrl ? (
                          video ? <video src={mediaUrl} muted playsInline /> : <img src={mediaUrl} alt={title} />
                        ) : (
                          <span className="saved-tile-placeholder"><Icon name={video ? "video" : "image"} /></span>
                        )}
                        {video ? <span className="saved-tile-type">Reel</span> : null}
                      </div>
                      <div className="saved-tile-copy">
                        <strong>{title}</strong>
                        <span>{formatProfileDate(post.savedAt || post.createdAt || post.sharedAt)}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="saved-tile-save"
                      disabled={saving === `unsave-${post.postId}`}
                      onClick={() => unsaveSavedItem(post)}
                      aria-label="Remove saved item"
                      title="Remove saved item"
                    >
                      <Icon name="bookmark" />
                    </button>
                  </article>
                );
              })}
            </div>
            {activeSaved.length > 4 ? (
              <button type="button" className="text-link saved-view-all" onClick={() => navigate("/home", { state: { mode: activeSavedTab === "reels" ? "reels" : "posts" } })}>
                View All Saved {activeSavedTab === "reels" ? "Reels" : "Posts"}
              </button>
            ) : null}
          </Card>

          {isOwnProfile ? (
            <div className="profile-forms-grid">
              <Card>
                <SectionHeader title="Update Name" subtitle="Keep your display name current." />
                <form className="form-grid" onSubmit={updateName}>
                  <input className="ui-field" value={nameForm.name} onChange={(e) => setNameForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="First name" />
                  <input className="ui-field" value={nameForm.lastName} onChange={(e) => setNameForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Last name" />
                  <Button variant="gradient" icon="check" type="submit" disabled={saving === "name"}>{saving === "name" ? "Saving..." : "Save"}</Button>
                </form>
              </Card>

              <Card className="profile-details-form-card">
                <SectionHeader title="Profile Details" subtitle="Optional signup details can be added or changed here anytime." />
                <form className="form-grid profile-details-form" onSubmit={updateProfileDetails}>
                  <div className="profile-form-two">
                    <input className="ui-field" value={profileDetailsForm.username} onChange={(e) => updateProfileDetailsField("username", e.target.value)} placeholder="Username" />
                    <input className="ui-field" value={profileDetailsForm.phoneNumber} onChange={(e) => updateProfileDetailsField("phoneNumber", e.target.value)} placeholder="Phone number" />
                  </div>
                  <div className="profile-form-two">
                    <input className="ui-field" type="email" value={profileDetailsForm.backupEmail} onChange={(e) => updateProfileDetailsField("backupEmail", e.target.value)} placeholder="Backup email" />
                    <select className="ui-field" value={profileDetailsForm.preferredLanguage} onChange={(e) => updateProfileDetailsField("preferredLanguage", e.target.value)}>
                      <option value="">Preferred language</option>
                      <option value="English">English</option>
                      <option value="Sinhala">Sinhala</option>
                      <option value="Tamil">Tamil</option>
                    </select>
                  </div>
                  <div className="profile-form-two">
                    <input className="ui-field" value={profileDetailsForm.location} onChange={(e) => updateProfileDetailsField("location", e.target.value)} placeholder="Location" />
                    <input className="ui-field" value={profileDetailsForm.website} onChange={(e) => updateProfileDetailsField("website", e.target.value)} placeholder="Website" />
                  </div>
                  <textarea className="ui-field" rows={4} maxLength={280} value={profileDetailsForm.bio} onChange={(e) => updateProfileDetailsField("bio", e.target.value)} placeholder="Bio" />
                  <div className="profile-interest-editor">
                    {PROFILE_INTEREST_OPTIONS.map((interest) => (
                      <button key={interest} type="button" className={profileDetailsForm.interests.includes(interest) ? "active" : ""} onClick={() => toggleProfileInterest(interest)}>
                        {interest}
                      </button>
                    ))}
                  </div>
                  <div className="profile-hobby-editor">
                    {splitCsv(profileDetailsForm.hobbies).map((hobby) => (
                      <button key={hobby} type="button" onClick={() => removeProfileHobby(hobby)}>
                        {hobby} <span aria-hidden="true">x</span>
                      </button>
                    ))}
                    <input
                      value={profileDetailsForm.hobbyInput}
                      onChange={(event) => updateProfileDetailsField("hobbyInput", event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addProfileHobby();
                        }
                      }}
                      placeholder="Add hobby..."
                    />
                  </div>
                  <Button variant="gradient" icon="check" type="submit" disabled={saving === "profile-details"}>{saving === "profile-details" ? "Saving..." : "Save Profile Details"}</Button>
                </form>
              </Card>

              <Card>
                <SectionHeader title="Update Email" subtitle="Verify the new address with OTP." />
                <form className="form-grid" onSubmit={sendEmailOtp}>
                  <input className="ui-field" type="email" value={emailForm.newEmail} onChange={(e) => setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))} placeholder="New email" />
                  <Button variant="gradient" icon="send" type="submit" disabled={saving === "email"}>{saving === "email" ? "Sending..." : "Send OTP"}</Button>
                  <div className="inline-action-row">
                    <input className="ui-field" value={emailForm.otp} onChange={(e) => setEmailForm((prev) => ({ ...prev, otp: e.target.value }))} placeholder="OTP code" />
                    <Button icon="check" onClick={verifyEmailOtp} disabled={saving === "otp"}>{saving === "otp" ? "Verifying..." : "Verify"}</Button>
                  </div>
                </form>
              </Card>

              <Card>
                <SectionHeader title="Update Password" subtitle="Use at least 8 characters." />
                <form className="form-grid" onSubmit={updatePassword}>
                  <input className="ui-field" type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
                  <input className="ui-field" type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
                  <input className="ui-field" type="password" placeholder="Confirm password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
                  <Button variant="gradient" icon="check" type="submit" disabled={saving === "password"}>{saving === "password" ? "Updating..." : "Update Password"}</Button>
                </form>
              </Card>
            </div>
          ) : null}
        </div>

        <aside className="side-stack profile-right-stack">
          <Card className="profile-about-card">
            <SectionHeader title="About Me" action={isOwnProfile ? <button type="button" className="text-link" onClick={() => document.querySelector(".profile-details-form-card")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Edit</button> : null} />
            <p className="profile-about-bio">{profileBio}</p>
            <div className="profile-about-list">
              {profileEmail ? <span><Icon name="send" /> {profileEmail}</span> : null}
              {profileUser?.phoneNumber ? <span><Icon name="phone" /> {profileUser.phoneNumber}</span> : null}
              <span><Icon name="pin" /> {profileLocation}</span>
              <span><Icon name="user" /> {profileLanguage}</span>
              {profileWebsite ? <span><Icon name="home" /> {profileWebsite}</span> : null}
            </div>
            <div className="profile-chip-cloud">
              {[...profileInterests, ...profileHobbies].slice(0, 12).map((item) => (
                <span key={item}>{item}</span>
              ))}
              {profileInterests.length + profileHobbies.length === 0 ? <small>No interests or hobbies added yet.</small> : null}
            </div>
          </Card>

          <Card className="profile-xp-summary-card">
            <div className="profile-xp-summary-head">
              <div>
                <p>Verified XP <Icon name="check" /></p>
                <strong>{xp.xp.toLocaleString()}</strong>
                <span>Total XP Earned</span>
              </div>
              <div className="profile-xp-chart">
                <LineChart values={xpChartValues} tone="purple" />
              </div>
            </div>
            <div className="profile-xp-level-row">
              <StatusBadge status={`Level ${xp.level}`} tone="purple" />
              <span>{xp.xp.toLocaleString()} / {xp.next.toLocaleString()} XP</span>
            </div>
            <div className="progress-track"><span style={{ width: `${xp.progress}%` }} /></div>
          </Card>

          <Card className="xp-system-card">
            <div className="xp-system-hero">
              <span><Icon name="spark" /></span>
              <div>
                <h2>Verified XP System</h2>
                <p>Earn verified XP by sharing educational content, helping the community, and making positive contributions.</p>
              </div>
            </div>
            <div className="xp-system-action-grid">
              {XP_SYSTEM_STEPS.map((item) => (
                <article key={item.title}>
                  <span><Icon name={item.icon} /></span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </Card>

          <Card className="recent-achievements-card">
            <SectionHeader title="Recent Achievements" action={<span className="text-link">View All</span>} />
            <ul className="achievement-list">
              {achievementRows.map((entry, index) => (
                <li key={`${entry.title}-${index}`} className="achievement-row">
                  <span className={`achievement-icon achievement-${entry.tone || "green"}`}><Icon name="star" /></span>
                  <div>
                    <strong>{entry.title}</strong>
                    <p>{entry.subtitle}</p>
                    <small>{entry.date}</small>
                  </div>
                  <Icon name="check" className="achievement-check" />
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <Modal
        open={Boolean(activeNetwork)}
        title={activeNetworkTitle}
        subtitle={`${activeNetworkList.length} ${activeNetworkList.length === 1 ? "person" : "people"}`}
        onClose={() => setActiveNetwork("")}
        footer={<button type="button" className="profile-network-close-button" onClick={() => setActiveNetwork("")}>Close</button>}
        className="profile-network-modal"
      >
        <div className="profile-network-list">
          {activeNetworkList.length === 0 ? (
            <EmptyPanel icon="users" title={`No ${activeNetworkTitle.toLowerCase()} yet`} subtitle="People will appear here when the network changes." />
          ) : activeNetworkList.map((entry) => {
            const entryName = displayName(entry);
            const entryAvatar = entry.profileImageUrl || entry.imageUrl;
            const entryHandle = entry.email || `@${entryName.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
            return (
              <article key={`${activeNetwork}-${resolveUserId(entry)}`} className="profile-network-row">
                <Avatar name={entryName} src={entryAvatar ? toMediaUrl(entryAvatar) : null} size="xl" online={isOnlineUser(entry)} className="profile-network-avatar" />
                <div className="profile-network-person-main">
                  <strong>{entryName}</strong>
                  <small>{entryHandle}</small>
                  {isOnlineUser(entry) ? <StatusBadge status="Online" tone="green" /> : <StatusBadge status="Profile" tone="blue" />}
                </div>
                <button type="button" className="profile-network-view-button" onClick={() => openNetworkUser(entry)}>
                  <Icon name="eye" />
                  View profile
                </button>
                <button type="button" className="profile-network-icon-button" onClick={() => openNetworkUser(entry)} aria-label={`Open ${entryName} profile`}>
                  <Icon name="user" />
                </button>
              </article>
            );
          })}
        </div>
      </Modal>
    </PageGrid>
  );
}
