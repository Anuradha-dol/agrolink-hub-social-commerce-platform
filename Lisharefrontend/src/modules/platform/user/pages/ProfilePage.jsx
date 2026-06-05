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
  Icon,
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

function listFromResponse(response) {
  const data = payload(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  return [];
}

function postIdForItem(post) {
  return Number(post?.postId || post?.id || post?.originalPostId || 0);
}

function postAuthorId(post) {
  return Number(
    post?.authorId ||
    post?.userId ||
    post?.ownerId ||
    post?.createdById ||
    post?.user?.userId ||
    post?.user?.id ||
    post?.author?.userId ||
    post?.author?.id ||
    0
  );
}

function authoredPostTitle(post, video) {
  return truncateText(post?.content || post?.title, 54) || (video ? "My reel" : "My post");
}

function formatProfileDate(value) {
  if (!value) return "Recently saved";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently saved";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatMetricValue(value) {
  const number = Number(value || 0);
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(".0", "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1).replace(".0", "")}K`;
  return number.toLocaleString();
}

function firstPositivePostValue(post, keys = []) {
  for (const key of keys) {
    const value = Number(post?.[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

function postReactionCount(post) {
  const direct = firstPositivePostValue(post, ["reactionCount", "reactionsCount", "likeCount", "likesCount", "likes"]);
  if (direct) return direct;
  const counts = post?.reactionCounts || post?.reactions;
  if (counts && typeof counts === "object" && !Array.isArray(counts)) {
    return Object.values(counts).reduce((total, value) => total + Number(value || 0), 0);
  }
  return 0;
}

function postCommentCount(post) {
  const direct = firstPositivePostValue(post, ["commentCount", "commentsCount", "replyCount", "repliesCount"]);
  if (direct) return direct;
  if (Array.isArray(post?.comments)) return post.comments.length;
  return 0;
}

function postHashtags(post) {
  const text = String(post?.content || post?.caption || post?.postCaption || post?.title || "");
  const tags = [...text.matchAll(/#[a-zA-Z0-9_]+/g)].map((match) => match[0]);
  if (tags.length) return tags.slice(0, 2);
  return splitCsv(post?.category || post?.tags).slice(0, 2).map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

const XP_SYSTEM_STEPS = [
  {
    icon: "edit",
    title: "Create Valuable Content",
    text: "Share educational posts, useful answers, and verified listings."
  },
  {
    icon: "users",
    title: "Help & Support Community",
    text: "Earn when your support is accepted or positively reviewed."
  },
  {
    icon: "check",
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
  const coverInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [profileUser, setProfileUser] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [activeProfilePostTab, setActiveProfilePostTab] = useState("posts");
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeSavedTab, setActiveSavedTab] = useState("posts");
  const [stats, setStats] = useState({ followers: 0, following: 0, friends: 0 });
  const [networkLists, setNetworkLists] = useState({ followers: [], following: [], friends: [] });
  const [activeNetwork, setActiveNetwork] = useState("");
  const [relationship, setRelationship] = useState({ isFollowing: false, isFriend: false, requested: false });
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
  const profileInterestChips = profileInterests.length + profileHobbies.length
    ? [...profileInterests, ...profileHobbies].slice(0, 12)
    : PROFILE_INTEREST_OPTIONS;
  const xp = xpModel(profileUser || user);
  const xpRemaining = Math.max(0, xp.next - xp.xp);
  const achievementRows = xp.history.length
    ? xp.history.slice(0, 3).map((entry) => ({ title: entry.reason || "Verified XP earned", subtitle: `+${Number(entry.points || 0)} XP`, date: formatProfileDate(entry.createdAt), tone: "green" }))
    : xp.badges.length
      ? xp.badges.slice(0, 3).map((badge) => ({ title: badge, subtitle: "Badge unlocked", date: "Verified milestone", tone: "purple" }))
      : DEFAULT_ACHIEVEMENTS;

  const authoredFeedPosts = useMemo(() => profilePosts.filter((post) => !isVideoItem(post)), [profilePosts]);
  const authoredReels = useMemo(() => profilePosts.filter((post) => isVideoItem(post)), [profilePosts]);
  const activeProfilePosts = activeProfilePostTab === "posts" ? authoredFeedPosts : authoredReels;
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
          const [followersRes, followingRes, friendsRes, savedRes, myPostsRes] = await Promise.all([
            followService.followers(),
            followService.following(),
            friendService.getFriends(),
            feedService.getSavedPosts({ page: 0, size: 100 }),
            feedService.getMyPosts()
          ]);
          const followers = Array.isArray(followersRes.data) ? followersRes.data : [];
          const following = Array.isArray(followingRes.data) ? followingRes.data : [];
          const friends = Array.isArray(friendsRes.data) ? friendsRes.data : [];
          setProfileUser(user);
          setStats({
            followers: followers.length,
            following: following.length,
            friends: friends.length
          });
          setNetworkLists({ followers, following, friends });
          setRelationship({ isFollowing: false, isFriend: false, requested: false });
          setSavedPosts(listFromResponse(savedRes));
          setProfilePosts(listFromResponse(myPostsRes));
        } else {
          const [profileRes, followersRes, followingRes, friendsRes, myFollowingRes, myFriendsRes, feedRes] = await Promise.all([
            userService.getPublicProfile(viewingUserId),
            followService.followersForUser(viewingUserId),
            followService.followingForUser(viewingUserId),
            friendService.getFriendsForUser(viewingUserId),
            followService.following(),
            friendService.getFriends(),
            feedService.getFeed()
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
          setProfilePosts(
            listFromResponse(feedRes)
              .filter((item) => String(item?.type || "POST").toUpperCase() !== "SHARE")
              .filter((item) => postAuthorId(item) === viewingUserId)
          );
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

  const openProfilePost = (post) => {
    const postId = postIdForItem(post);
    if (!postId) return;
    navigate("/home", { state: { openPostId: postId, mode: isVideoItem(post) ? "reels" : "posts" } });
  };

  const openNetworkUser = (entry) => {
    const targetUserId = Number(entry?.userId || entry?.id || 0);
    if (!targetUserId) return;
    setActiveNetwork("");
    navigate(targetUserId === currentUserId ? "/profile" : `/profile/${targetUserId}`);
  };

  const uploadCoverImage = async (file) => {
    if (!file || !isOwnProfile) return;
    const formData = new FormData();
    formData.append("file", file);
    setSaving("cover-image");
    try {
      const response = await userService.uploadCoverImage(formData);
      const imageUrl = response?.data || "";
      setProfileUser((previous) => ({ ...previous, coverImageUrl: imageUrl }));
      await refreshUser();
      pushToast("Cover picture updated", "success");
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Cover upload failed", "error");
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
                className="profile-cover-upload-btn profile-cover-choose-btn"
                onClick={() => coverInputRef.current?.click()}
                disabled={saving === "cover-image"}
              >
                <Icon name="image" />
                {saving === "cover-image" ? "Uploading..." : "Choose Cover"}
              </button>
              <input
                ref={coverInputRef}
                className="hidden-file-input"
                type="file"
                accept="image/*"
                onChange={(event) => uploadCoverImage(event.target.files?.[0])}
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
              online={isOnlineUser(profileUser)}
              className="profile-main-avatar"
            />
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
          {!isOwnProfile ? (
            <div className="profile-action-row">
              <Button icon="user" variant={relationship.isFollowing ? "secondary" : "gradient"} disabled={saving === "follow"} onClick={toggleProfileFollow}>
                {relationship.isFollowing ? "Unfollow" : "Follow"}
              </Button>
              <Button icon={relationship.isFriend ? "trash" : "users"} variant={relationship.isFriend ? "danger" : "secondary"} disabled={saving === "friend" || relationship.requested} onClick={toggleProfileFriend}>
                {relationship.isFriend ? "Unfriend" : relationship.requested ? "Requested" : "Add Friend"}
              </Button>
              <Button icon="chat" onClick={() => navigate("/chat", { state: { startUserId: viewingUserId } })}>Chat</Button>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="profile-content-grid profile-reference-grid">
        <div className="profile-main-stack">
          <div className="stat-grid profile-mini-stats">
            <StatCard icon="users" label="Followers" value={stats.followers} trend="Tap to view" tone="blue" onClick={() => setActiveNetwork("followers")} />
            <StatCard icon="user" label="Following" value={stats.following} trend="Tap to view" tone="purple" onClick={() => setActiveNetwork("following")} />
            <StatCard icon="chat" label="Friends" value={stats.friends} trend="Tap to view" tone="pink" onClick={() => setActiveNetwork("friends")} />
          </div>

          <Card className="saved-card profile-posts-card">
            <SectionHeader
              title={isOwnProfile ? "My Posts & Reels" : `${name}'s Posts & Reels`}
              subtitle={isOwnProfile ? "Posts and reels you published from the feed." : "Posts and reels published by this profile."}
              action={<Button icon="home" onClick={() => navigate("/home")}>Open Feed</Button>}
            />
            <Tabs
              active={activeProfilePostTab}
              onChange={setActiveProfilePostTab}
              tabs={[
                { value: "posts", label: "Posts", icon: "image", count: authoredFeedPosts.length },
                { value: "reels", label: "Reels", icon: "video", count: authoredReels.length }
              ]}
            />
            <div className="saved-list-grid saved-tile-grid profile-post-tile-grid">
              {activeProfilePosts.length === 0 ? (
                <EmptyPanel icon="image" title={`No ${activeProfilePostTab} yet`} subtitle={isOwnProfile ? "Your published posts will appear here." : "This profile has not published anything in this tab yet."} />
              ) : activeProfilePosts.slice(0, 6).map((post, index) => {
                const video = isVideoItem(post);
                const mediaUrl = savedItemMediaUrl(post);
                const title = authoredPostTitle(post, video);
                const postId = postIdForItem(post);
                const tags = postHashtags(post);
                return (
                  <article key={`profile-post-${postId || index}`} className={`saved-tile-card profile-post-tile profile-feed-tile saved-tile-${index % 4}`}>
                    <button type="button" className="saved-tile-open" onClick={() => openProfilePost(post)}>
                      <div className="saved-tile-media">
                        {mediaUrl ? (
                          video ? <video src={mediaUrl} muted playsInline /> : <img src={mediaUrl} alt={title} />
                        ) : (
                          <span className="saved-tile-placeholder"><Icon name={video ? "video" : "image"} /></span>
                        )}
                        <span className="saved-tile-type">{video ? "Reel" : "Post"}</span>
                        <span className="saved-tile-date">{formatProfileDate(post.createdAt || post.sharedAt)}</span>
                        {!isOwnProfile ? <span className="saved-tile-menu"><Icon name="more" /></span> : null}
                      </div>
                      <div className="saved-tile-copy">
                        <strong>{title}</strong>
                        <div className="saved-tile-tags">
                          {tags.length ? tags.map((tag) => <span key={tag}>{tag}</span>) : <span>{video ? "#reel" : "#post"}</span>}
                        </div>
                        <div className="saved-tile-metrics">
                          <span><Icon name="heart" /> {formatMetricValue(postReactionCount(post))}</span>
                          <span><Icon name="chat" /> {formatMetricValue(postCommentCount(post))}</span>
                        </div>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
            {activeProfilePosts.length > 6 ? (
              <button type="button" className="text-link saved-view-all" onClick={() => navigate("/home", { state: { mode: activeProfilePostTab === "reels" ? "reels" : "posts" } })}>
                View All {activeProfilePostTab === "reels" ? "Reels" : "Posts"}
              </button>
            ) : null}
          </Card>

          {isOwnProfile ? (
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
                  const tags = postHashtags(post);
                  return (
                    <article key={`${activeSavedTab}-${post.postId}`} className={`saved-tile-card profile-feed-tile saved-tile-${index % 4}`}>
                      <button type="button" className="saved-tile-open" onClick={() => openSavedItem(post)}>
                        <div className="saved-tile-media">
                          {mediaUrl ? (
                            video ? <video src={mediaUrl} muted playsInline /> : <img src={mediaUrl} alt={title} />
                          ) : (
                            <span className="saved-tile-placeholder"><Icon name={video ? "video" : "image"} /></span>
                          )}
                          <span className="saved-tile-type">{video ? "Saved Reel" : "Saved"}</span>
                          <span className="saved-tile-date">{formatProfileDate(post.savedAt || post.createdAt || post.sharedAt)}</span>
                        </div>
                        <div className="saved-tile-copy">
                          <strong>{title}</strong>
                          <div className="saved-tile-tags">
                            {tags.length ? tags.map((tag) => <span key={tag}>{tag}</span>) : <span>{video ? "#savedreel" : "#savedpost"}</span>}
                          </div>
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
          ) : null}

          {isOwnProfile ? (
            <div className="profile-reward-strip">
              <span><Icon name="star" /></span>
              <p>Your posts, reels, saves, and community activity help you earn more XP and unlock achievements.</p>
            </div>
          ) : null}

        </div>

        <aside className="side-stack profile-right-stack">
          <Card className="profile-xp-summary-card">
            <div className="profile-xp-shield">
              <Icon name="star" />
            </div>
            <div className="profile-xp-copy">
              <span>Level {xp.level}</span>
              <strong>{xp.xp.toLocaleString()} XP</strong>
              <p>{xpRemaining.toLocaleString()} XP to reach Level {xp.level + 1}</p>
            </div>
            <div className="progress-track"><span style={{ width: `${xp.progress}%` }} /></div>
          </Card>

          <Card className="profile-about-card">
            <SectionHeader title="About Me" />
            <p className="profile-about-bio">{profileBio}</p>
            <div className="profile-about-list">
              {profileEmail ? <span><Icon name="send" /> {profileEmail}</span> : null}
              {profileUser?.phoneNumber ? <span><Icon name="phone" /> {profileUser.phoneNumber}</span> : null}
              <span><Icon name="pin" /> {profileLocation}</span>
              <span><Icon name="user" /> {profileLanguage}</span>
              {profileWebsite ? <span><Icon name="home" /> {profileWebsite}</span> : null}
            </div>
            <h3 className="profile-chip-heading">Interests / Hobbies</h3>
            <div className="profile-chip-cloud">
              {profileInterestChips.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Card>

          <Card className="xp-system-card profile-tips-card">
            <SectionHeader title="Profile Tips" />
            <div className="xp-system-action-grid profile-tips-grid">
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
