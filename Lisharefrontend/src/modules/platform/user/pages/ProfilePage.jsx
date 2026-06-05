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
import defaultProfileCover from "/src/assets/backgrounds/profile-cover-4k-background.png";
import chatBubbleEmptyState from "/src/assets/chat_bubble_empty.png";
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
const PROFILE_MEDIA_MAX_BYTES = 8 * 1024 * 1024;
const PROFILE_COMMENT_MEDIA_MAX_BYTES = 12 * 1024 * 1024;
const PROFILE_COMMENT_MEDIA_ACCEPT = "image/*,application/pdf,.pdf";
const EMPTY_MEDIA_DRAFT = { type: "", file: null, previewUrl: "", error: "" };

const PROFILE_MEDIA_COPY = {
  cover: {
    title: "Change Cover Photo",
    subtitle: "Preview the new cover before saving. The clean mountain sunset image remains the default fallback.",
    success: "Cover photo updated",
    removeTitle: "Remove Cover Photo",
    removeBody: "This will remove your custom cover and return the Profile cover to the default mountain sunset background."
  },
  avatar: {
    title: "Change Profile Photo",
    subtitle: "Preview your new profile picture before saving it.",
    success: "Profile photo updated",
    removeTitle: "Remove Profile Photo",
    removeBody: "This will remove your custom profile picture and return your avatar to the default initial badge."
  }
};

function payload(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function isVideoAsset(url = "") {
  return VIDEO_EXTENSIONS.some((ext) => String(url).toLowerCase().split("?")[0].endsWith(ext));
}

function isPdfAsset(url = "") {
  return String(url).toLowerCase().split("?")[0].endsWith(".pdf");
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

function parsePostListValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
}

function mediaItemsForProfilePost(post) {
  const mediaUrls = parsePostListValue(post?.mediaUrls);
  const legacyUrl = post?.imageUrl || post?.mediaUrl || post?.thumbnailUrl || post?.coverImageUrl || "";
  const legacyUrls = legacyUrl ? [legacyUrl] : [];
  const urls = mediaUrls.length ? mediaUrls : legacyUrls;
  const mediaTypes = parsePostListValue(post?.mediaTypes);
  const fallbackType = String(post?.mediaType || "").toUpperCase();

  return urls.map((url, index) => ({
    url,
    type: (mediaTypes[index] || (urls.length === 1 ? fallbackType : "") || (isVideoAsset(url) ? "VIDEO" : "IMAGE")).toUpperCase()
  }));
}

function normalizeProfileRole(value = "") {
  const raw = Array.isArray(value) ? value[0] : value;
  const label = String(raw || "")
    .replace(/^ROLE_/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!label) return "";
  return label.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function roleKey(value = "") {
  return normalizeProfileRole(value).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "member";
}

function roleIconName(value = "") {
  const key = roleKey(value);
  if (key.includes("business")) return "bag";
  if (key.includes("farmer")) return "spark";
  if (key.includes("creator")) return "video";
  if (key.includes("admin")) return "settings";
  return "user";
}

function countCommentThread(comments = []) {
  if (!Array.isArray(comments)) return 0;
  return comments.reduce((total, comment) => total + 1 + countCommentThread(comment?.replies || []), 0);
}

function commentAuthorName(comment) {
  return comment?.authorName
    || `${comment?.firstName || ""} ${comment?.lastName || ""}`.trim()
    || comment?.email
    || "Community member";
}

function commentIdValue(comment) {
  return Number(comment?.commentId || comment?.id || 0);
}

function commentAuthorIdValue(comment) {
  return Number(comment?.authorId || comment?.userId || comment?.user?.userId || comment?.user?.id || 0);
}

function commentMediaUrl(comment) {
  return comment?.mediaUrl || comment?.attachmentUrl || comment?.fileUrl || "";
}

function commentMediaType(comment) {
  const mediaType = String(comment?.mediaType || "").toUpperCase();
  const mediaUrl = commentMediaUrl(comment);
  if (mediaType) return mediaType;
  if (isPdfAsset(mediaUrl)) return "PDF";
  if (isVideoAsset(mediaUrl)) return "VIDEO";
  return mediaUrl ? "IMAGE" : "";
}

function commentFileKind(file) {
  if (!file) return "Attachment";
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  if (type.startsWith("image")) return "Image";
  return "Attachment";
}

function validateProfileCommentMedia(file) {
  if (!file) return "";
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const allowed = type.startsWith("image/") || type === "application/pdf" || name.endsWith(".pdf");
  if (!allowed) return "Only image or PDF files are allowed for comments.";
  if (file.size > PROFILE_COMMENT_MEDIA_MAX_BYTES) return "Comment attachment must be 12 MB or smaller.";
  return "";
}

function postAuthorNameForModal(post, fallbackName) {
  return post?.authorName
    || post?.ownerName
    || post?.userName
    || post?.author?.name
    || fallbackName
    || "AgroLink User";
}

function postAuthorAvatarForModal(post, fallbackAvatar) {
  return post?.authorProfileImageUrl
    || post?.authorProfilePic
    || post?.profileImageUrl
    || post?.author?.profileImageUrl
    || fallbackAvatar
    || "";
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const coverInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const profileCommentMediaInputRef = useRef(null);
  const profileReplyMediaInputRefs = useRef({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [mediaDraft, setMediaDraft] = useState(EMPTY_MEDIA_DRAFT);
  const [removeMediaTarget, setRemoveMediaTarget] = useState("");
  const [profileUser, setProfileUser] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [activeProfilePostTab, setActiveProfilePostTab] = useState("posts");
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeSavedTab, setActiveSavedTab] = useState("posts");
  const [stats, setStats] = useState({ followers: 0, following: 0, friends: 0 });
  const [networkLists, setNetworkLists] = useState({ followers: [], following: [], friends: [] });
  const [activeNetwork, setActiveNetwork] = useState("");
  const [relationship, setRelationship] = useState({ isFollowing: false, isFriend: false, requested: false, incomingRequest: false });
  const [activeProfilePost, setActiveProfilePost] = useState(null);
  const [activeProfilePostMediaIndex, setActiveProfilePostMediaIndex] = useState(0);
  const [profilePostComments, setProfilePostComments] = useState([]);
  const [profilePostCommentsLoading, setProfilePostCommentsLoading] = useState(false);
  const [profilePostCommentDraft, setProfilePostCommentDraft] = useState("");
  const [profilePostCommentMedia, setProfilePostCommentMedia] = useState(null);
  const [profileReplyDrafts, setProfileReplyDrafts] = useState({});
  const [profileReplyMediaDrafts, setProfileReplyMediaDrafts] = useState({});
  const [openProfileReplyId, setOpenProfileReplyId] = useState(null);
  const [profileEditingCommentId, setProfileEditingCommentId] = useState(null);
  const [profileEditingCommentText, setProfileEditingCommentText] = useState("");
  const [profilePostActionBusy, setProfilePostActionBusy] = useState("");
  const viewingUserId = Number(routeUserId || 0);
  const isOwnProfile = !viewingUserId || viewingUserId === Number(user?.userId || user?.id || 0);
  const currentUserId = Number(user?.userId || user?.id || 0);
  const name = displayName(profileUser, user);
  const profileRoleSource = profileUser?.role || profileUser?.roles || user?.role || user?.roles || "";
  const profileRoleLabel = normalizeProfileRole(profileRoleSource) || "Member";
  const profileRoleClass = `profile-role-${roleKey(profileRoleSource)}`;
  const profileRoleIcon = roleIconName(profileRoleSource);
  const handleSource = profileUser?.username || (isOwnProfile ? (profileUser?.email || user?.email || name) : (profileUser?.email || name));
  const handle = `@${String(handleSource).split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()}`;
  const profileEmail = isOwnProfile ? (profileUser?.email || user?.email || "") : (profileUser?.email || "");
  const profileAvatarSource = profileUser?.profileImageUrl || profileUser?.imageUrl || "";
  const hasCustomCover = Boolean(profileUser?.coverImageUrl);
  const hasCustomAvatar = Boolean(profileAvatarSource);
  const profileCoverSrc = hasCustomCover ? toMediaUrl(profileUser.coverImageUrl) : defaultProfileCover;
  const mediaDraftCopy = mediaDraft.type ? PROFILE_MEDIA_COPY[mediaDraft.type] : null;
  const removeMediaCopy = removeMediaTarget ? PROFILE_MEDIA_COPY[removeMediaTarget] : null;
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
  const activeProfilePostId = postIdForItem(activeProfilePost);
  const activeProfilePostMediaItems = useMemo(() => mediaItemsForProfilePost(activeProfilePost), [activeProfilePost]);
  const activeProfilePostMedia = activeProfilePostMediaItems[Math.min(activeProfilePostMediaIndex, Math.max(0, activeProfilePostMediaItems.length - 1))] || null;
  const activeProfilePostVideo = activeProfilePostMedia?.type === "VIDEO" || isVideoAsset(activeProfilePostMedia?.url || "");
  const activeProfilePostTitle = activeProfilePost ? authoredPostTitle(activeProfilePost, activeProfilePostVideo) : "";
  const activeProfilePostAuthorName = activeProfilePost ? postAuthorNameForModal(activeProfilePost, name) : name;
  const activeProfilePostAuthorAvatar = activeProfilePost ? postAuthorAvatarForModal(activeProfilePost, profileAvatarSource) : profileAvatarSource;
  const activeProfilePostTags = activeProfilePost ? postHashtags(activeProfilePost) : [];
  const activeProfilePostAuthorId = postAuthorId(activeProfilePost);
  const profileOwnerId = resolveUserId(profileUser) || currentUserId;
  const activeProfilePostRoleSource = activeProfilePost?.authorRole
    || activeProfilePost?.author?.role
    || activeProfilePost?.role
    || (activeProfilePostAuthorId === profileOwnerId ? profileRoleSource : "");
  const activeProfilePostRoleLabel = normalizeProfileRole(activeProfilePostRoleSource) || (activeProfilePostAuthorId === profileOwnerId ? profileRoleLabel : "Member");
  const activeProfilePostRoleIcon = roleIconName(activeProfilePostRoleSource || activeProfilePostRoleLabel);

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
          setRelationship({ isFollowing: false, isFriend: false, requested: false, incomingRequest: false });
          setSavedPosts(listFromResponse(savedRes));
          setProfilePosts(listFromResponse(myPostsRes));
        } else {
          const [profileRes, followersRes, followingRes, friendsRes, myFollowingRes, myFriendsRes, myPendingRes, mySentRes, feedRes] = await Promise.all([
            userService.getPublicProfile(viewingUserId),
            followService.followersForUser(viewingUserId),
            followService.followingForUser(viewingUserId),
            friendService.getFriendsForUser(viewingUserId),
            followService.following(),
            friendService.getFriends(),
            friendService.getPending(),
            friendService.getSent(),
            feedService.getFeed()
          ]);
          const followers = Array.isArray(followersRes.data) ? followersRes.data : [];
          const following = Array.isArray(followingRes.data) ? followingRes.data : [];
          const friends = Array.isArray(friendsRes.data) ? friendsRes.data : [];
          const myFollowing = Array.isArray(myFollowingRes.data) ? myFollowingRes.data : [];
          const myFriends = Array.isArray(myFriendsRes.data) ? myFriendsRes.data : [];
          const myPending = Array.isArray(myPendingRes.data) ? myPendingRes.data : [];
          const mySent = Array.isArray(mySentRes.data) ? mySentRes.data : [];
          setProfileUser(payload(profileRes));
          setStats({ followers: followers.length, following: following.length, friends: friends.length });
          setNetworkLists({ followers, following, friends });
          setRelationship({
            isFollowing: myFollowing.some((entry) => Number(entry.userId) === viewingUserId),
            isFriend: myFriends.some((entry) => Number(entry.userId) === viewingUserId),
            requested: mySent.some((entry) => Number(entry.userId) === viewingUserId),
            incomingRequest: myPending.some((entry) => Number(entry.userId) === viewingUserId)
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

  useEffect(() => {
    return () => {
      if (mediaDraft.previewUrl) URL.revokeObjectURL(mediaDraft.previewUrl);
    };
  }, [mediaDraft.previewUrl]);

  useEffect(() => {
    const postId = activeProfilePostId;
    if (!postId) {
      setProfilePostComments([]);
      setProfilePostCommentDraft("");
      setProfilePostCommentMedia(null);
      setProfileReplyDrafts({});
      setProfileReplyMediaDrafts({});
      setOpenProfileReplyId(null);
      setProfileEditingCommentId(null);
      setProfileEditingCommentText("");
      return undefined;
    }

    let active = true;
    setProfilePostCommentsLoading(true);
    setProfilePostComments([]);
    setProfilePostCommentDraft("");
    setProfilePostCommentMedia(null);
    setProfileReplyDrafts({});
    setProfileReplyMediaDrafts({});
    setOpenProfileReplyId(null);
    setProfileEditingCommentId(null);
    setProfileEditingCommentText("");

    feedService.getComments(postId)
      .then((response) => {
        if (!active) return;
        const comments = listFromResponse(response);
        setProfilePostComments(comments);
        const commentCount = countCommentThread(comments);
        setActiveProfilePost((previous) => postIdForItem(previous) === postId ? { ...previous, comments, commentCount } : previous);
        setProfilePosts((previous) => previous.map((item) => (
          postIdForItem(item) === postId ? { ...item, comments, commentCount } : item
        )));
      })
      .catch(() => {
        if (active) pushToast("Failed to load comments", "error");
      })
      .finally(() => {
        if (active) setProfilePostCommentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeProfilePostId, pushToast]);

  const updateProfilePostMetrics = (postId, patch) => {
    setActiveProfilePost((previous) => postIdForItem(previous) === postId ? { ...previous, ...patch } : previous);
    setProfilePosts((previous) => previous.map((item) => (
      postIdForItem(item) === postId ? { ...item, ...patch } : item
    )));
  };

  const syncProfilePostComments = (postId, comments) => {
    const commentCount = countCommentThread(comments);
    setProfilePostComments(comments);
    updateProfilePostMetrics(postId, { comments, commentCount });
  };

  const refreshProfilePostComments = async (postId = activeProfilePostId) => {
    if (!postId) return [];
    const response = await feedService.getComments(postId);
    const comments = listFromResponse(response);
    syncProfilePostComments(postId, comments);
    return comments;
  };

  const canManageProfileComment = (comment) => commentAuthorIdValue(comment) === currentUserId;

  const selectProfileCommentMedia = (file) => {
    if (!file) {
      setProfilePostCommentMedia(null);
      if (profileCommentMediaInputRef.current) profileCommentMediaInputRef.current.value = "";
      return;
    }
    const error = validateProfileCommentMedia(file);
    if (error) {
      pushToast(error, "error");
      setProfilePostCommentMedia(null);
      if (profileCommentMediaInputRef.current) profileCommentMediaInputRef.current.value = "";
      return;
    }
    setProfilePostCommentMedia(file || null);
  };

  const selectProfileReplyMedia = (commentId, file) => {
    if (!file) {
      setProfileReplyMediaDrafts((previous) => ({ ...previous, [commentId]: null }));
      if (profileReplyMediaInputRefs.current[commentId]) profileReplyMediaInputRefs.current[commentId].value = "";
      return;
    }
    const error = validateProfileCommentMedia(file);
    if (error) {
      pushToast(error, "error");
      setProfileReplyMediaDrafts((previous) => ({ ...previous, [commentId]: null }));
      if (profileReplyMediaInputRefs.current[commentId]) profileReplyMediaInputRefs.current[commentId].value = "";
      return;
    }
    setProfileReplyMediaDrafts((previous) => ({ ...previous, [commentId]: file || null }));
  };

  const openSavedItem = (post) => {
    const postId = Number(post?.postId);
    if (!postId) return;
    setActiveProfilePost(post);
    setActiveProfilePostMediaIndex(0);
  };

  const openProfilePost = (post) => {
    const postId = postIdForItem(post);
    if (!postId) return;
    setActiveProfilePost(post);
    setActiveProfilePostMediaIndex(0);
  };

  const closeProfilePostViewer = () => {
    if (profilePostActionBusy) return;
    setActiveProfilePost(null);
    setProfilePostComments([]);
    setProfilePostCommentDraft("");
    setProfilePostCommentMedia(null);
    setProfileReplyDrafts({});
    setProfileReplyMediaDrafts({});
    setOpenProfileReplyId(null);
    setProfileEditingCommentId(null);
    setProfileEditingCommentText("");
    setActiveProfilePostMediaIndex(0);
  };

  const reactToProfilePost = async (type) => {
    const postId = postIdForItem(activeProfilePost);
    if (!postId) return;
    setProfilePostActionBusy(`react-${type}`);
    try {
      await feedService.react(postId, type);
      const response = await feedService.getReactions(postId);
      const reactionCounts = response?.data || {};
      const reactionCount = Object.values(reactionCounts).reduce((total, value) => total + Number(value || 0), 0);
      updateProfilePostMetrics(postId, { reactionCounts, reactionCount });
    } catch {
      pushToast("Failed to update reaction", "error");
    } finally {
      setProfilePostActionBusy("");
    }
  };

  const submitProfilePostComment = async (event) => {
    event.preventDefault();
    const postId = postIdForItem(activeProfilePost);
    const content = profilePostCommentDraft.trim();
    if (!postId || (!content && !profilePostCommentMedia)) return;
    setProfilePostActionBusy("comment");
    try {
      await feedService.addComment(postId, content, profilePostCommentMedia);
      await refreshProfilePostComments(postId);
      setProfilePostCommentDraft("");
      setProfilePostCommentMedia(null);
      if (profileCommentMediaInputRef.current) profileCommentMediaInputRef.current.value = "";
      pushToast("Comment added", "success");
    } catch {
      pushToast("Failed to add comment", "error");
    } finally {
      setProfilePostActionBusy("");
    }
  };

  const submitProfileReply = async (event, comment) => {
    event.preventDefault();
    const postId = postIdForItem(activeProfilePost);
    const commentId = commentIdValue(comment);
    const content = String(profileReplyDrafts[commentId] || "").trim();
    const mediaFile = profileReplyMediaDrafts[commentId] || null;
    if (!postId || !commentId || (!content && !mediaFile)) return;

    setProfilePostActionBusy(`reply-${commentId}`);
    try {
      await feedService.addReply(postId, commentId, content, mediaFile);
      await refreshProfilePostComments(postId);
      setProfileReplyDrafts((previous) => ({ ...previous, [commentId]: "" }));
      setProfileReplyMediaDrafts((previous) => ({ ...previous, [commentId]: null }));
      if (profileReplyMediaInputRefs.current[commentId]) profileReplyMediaInputRefs.current[commentId].value = "";
      setOpenProfileReplyId(null);
      pushToast("Reply added", "success");
    } catch {
      pushToast("Failed to add reply", "error");
    } finally {
      setProfilePostActionBusy("");
    }
  };

  const startProfileCommentEdit = (comment) => {
    const commentId = commentIdValue(comment);
    if (!commentId || !canManageProfileComment(comment)) return;
    setProfileEditingCommentId(commentId);
    setProfileEditingCommentText(comment?.content || comment?.body || "");
    setOpenProfileReplyId(null);
  };

  const submitProfileCommentEdit = async (event, comment) => {
    event.preventDefault();
    const postId = postIdForItem(activeProfilePost);
    const commentId = commentIdValue(comment);
    const content = profileEditingCommentText.trim();
    if (!postId || !commentId || !content || !canManageProfileComment(comment)) return;

    setProfilePostActionBusy(`edit-${commentId}`);
    try {
      await feedService.updateComment(commentId, content);
      await refreshProfilePostComments(postId);
      setProfileEditingCommentId(null);
      setProfileEditingCommentText("");
      pushToast("Comment updated", "success");
    } catch {
      pushToast("Failed to update comment", "error");
    } finally {
      setProfilePostActionBusy("");
    }
  };

  const deleteProfileComment = async (comment) => {
    const postId = postIdForItem(activeProfilePost);
    const commentId = commentIdValue(comment);
    if (!postId || !commentId || !canManageProfileComment(comment)) return;
    const confirmed = typeof window === "undefined" ? true : window.confirm("Delete this comment?");
    if (!confirmed) return;

    setProfilePostActionBusy(`delete-${commentId}`);
    try {
      await feedService.deleteComment(commentId);
      await refreshProfilePostComments(postId);
      pushToast("Comment deleted", "success");
    } catch {
      pushToast("Failed to delete comment", "error");
    } finally {
      setProfilePostActionBusy("");
    }
  };

  const openNetworkUser = (entry) => {
    const targetUserId = Number(entry?.userId || entry?.id || 0);
    if (!targetUserId) return;
    setActiveNetwork("");
    navigate(targetUserId === currentUserId ? "/profile" : `/profile/${targetUserId}`);
  };

  const resetMediaDraft = () => {
    setMediaDraft(EMPTY_MEDIA_DRAFT);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (profileInputRef.current) profileInputRef.current.value = "";
  };

  const openMediaPicker = (type) => {
    if (type === "cover") {
      coverInputRef.current?.click();
    } else {
      profileInputRef.current?.click();
    }
  };

  const handleMediaFileSelected = (type, file) => {
    if (!file || !isOwnProfile) return;

    let error = "";
    if (!file.type?.startsWith("image/")) {
      error = "Only image files are allowed.";
    } else if (file.size > PROFILE_MEDIA_MAX_BYTES) {
      error = "Image must be 8 MB or smaller.";
    }

    setMediaDraft({
      type,
      file: error ? null : file,
      previewUrl: error ? "" : URL.createObjectURL(file),
      error
    });

    if (error) pushToast(error, "error");
  };

  const saveMediaDraft = async () => {
    if (!mediaDraft.file || !mediaDraft.type || !isOwnProfile) return;
    const formData = new FormData();
    formData.append("file", mediaDraft.file);
    const isCover = mediaDraft.type === "cover";
    const savingKey = isCover ? "cover-image" : "profile-image";
    setSaving(savingKey);
    try {
      const response = isCover
        ? await userService.uploadCoverImage(formData)
        : await userService.uploadProfileImage(formData);
      const imageUrl = response?.data || "";
      setProfileUser((previous) => ({
        ...previous,
        ...(isCover
          ? { coverImageUrl: imageUrl }
          : { profileImageUrl: imageUrl, imageUrl })
      }));
      await refreshUser();
      pushToast(PROFILE_MEDIA_COPY[mediaDraft.type].success, "success");
      resetMediaDraft();
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Image upload failed", "error");
    } finally {
      setSaving("");
    }
  };

  const confirmRemoveMedia = async () => {
    if (!removeMediaTarget || !isOwnProfile) return;
    const isCover = removeMediaTarget === "cover";
    const savingKey = isCover ? "remove-cover" : "remove-avatar";
    setSaving(savingKey);
    try {
      if (isCover) {
        await userService.removeCoverImage();
        setProfileUser((previous) => ({ ...previous, coverImageUrl: "" }));
      } else {
        await userService.removeProfileImage();
        setProfileUser((previous) => ({ ...previous, profileImageUrl: "", imageUrl: "" }));
      }
      await refreshUser();
      pushToast(isCover ? "Cover photo removed" : "Profile photo removed", "success");
      setRemoveMediaTarget("");
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Failed to remove image", "error");
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
        setRelationship((prev) => ({ ...prev, isFriend: false, requested: false, incomingRequest: false }));
        setStats((prev) => ({ ...prev, friends: Math.max(0, prev.friends - 1) }));
        setNetworkLists((prev) => ({
          ...prev,
          friends: prev.friends.filter((entry) => Number(entry.userId) !== currentUserId)
        }));
        pushToast("Friend removed", "success");
      } else if (relationship.requested) {
        const response = await friendService.cancel(viewingUserId);
        const message = String(response?.data?.message || "");
        setRelationship((prev) => ({ ...prev, requested: false, incomingRequest: false }));
        pushToast(message || "Friend request cancelled", "success");
      } else if (relationship.incomingRequest) {
        const response = await friendService.accept(viewingUserId);
        const message = String(response?.data?.message || "");
        const accepted = /accepted/i.test(message);
        if (accepted) {
          setRelationship((prev) => ({ ...prev, isFriend: true, requested: false, incomingRequest: false }));
          setStats((prev) => ({ ...prev, friends: prev.friends + 1 }));
          setNetworkLists((prev) => ({
            ...prev,
            friends: prev.friends.some((entry) => Number(entry.userId) === currentUserId)
              ? prev.friends
              : [{ ...user, userId: currentUserId }, ...prev.friends]
          }));
        }
        pushToast(message || (accepted ? "Request accepted" : "Request not accepted"), accepted ? "success" : "error");
      } else {
        const response = await friendService.request(viewingUserId);
        const message = String(response?.data?.message || "");
        const alreadyFriends = /already friends/i.test(message);
        const requestIsPending = /sent|pending/i.test(message);
        setRelationship((prev) => ({
          ...prev,
          isFriend: alreadyFriends ? true : prev.isFriend,
          requested: requestIsPending,
          incomingRequest: false
        }));
        pushToast(message || (requestIsPending ? "Friend request sent" : "Request not sent"), requestIsPending || alreadyFriends ? "success" : "error");
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

  const renderProfileAttachmentChip = (file, onRemove) => file ? (
    <div className="profile-comment-attachment-chip">
      <Icon name={commentFileKind(file) === "PDF" ? "invoice" : "image"} />
      <span>{commentFileKind(file)} attached: {file.name}</span>
      <button type="button" onClick={onRemove} aria-label="Remove attachment">
        <Icon name="close" />
      </button>
    </div>
  ) : null;

  const renderProfileCommentMedia = (comment) => {
    const mediaUrl = commentMediaUrl(comment);
    if (!mediaUrl) return null;
    const src = toMediaUrl(mediaUrl);
    const mediaType = commentMediaType(comment);

    if (mediaType === "PDF") {
      return (
        <div className="profile-comment-media profile-comment-media-pdf">
          <a href={src} target="_blank" rel="noreferrer">
            <Icon name="invoice" />
            Open PDF attachment
          </a>
          <iframe src={src} title="Comment PDF attachment" />
        </div>
      );
    }

    if (mediaType === "VIDEO") {
      return (
        <div className="profile-comment-media">
          <video src={src} controls preload="metadata" />
        </div>
      );
    }

    return (
      <div className="profile-comment-media">
        <img src={src} alt="Comment attachment" />
      </div>
    );
  };

  const renderProfileCommentItem = (comment, depth = 0) => {
    const commentId = commentIdValue(comment);
    const replies = Array.isArray(comment?.replies) ? comment.replies : [];
    const authorName = commentAuthorName(comment);
    const canManage = canManageProfileComment(comment);
    const isEditing = profileEditingCommentId === commentId;
    const replyOpen = openProfileReplyId === commentId;
    const replyDraft = String(profileReplyDrafts[commentId] || "");
    const replyMediaFile = profileReplyMediaDrafts[commentId] || null;
    const busyReply = profilePostActionBusy === `reply-${commentId}`;
    const busyEdit = profilePostActionBusy === `edit-${commentId}`;
    const busyDelete = profilePostActionBusy === `delete-${commentId}`;

    return (
      <article
        key={commentId}
        className={`profile-post-comment profile-post-comment-thread ${depth ? "is-reply" : ""}`.trim()}
        style={{ "--profile-comment-depth": Math.min(depth, 3) }}
      >
        <Avatar name={authorName} src={comment.authorProfileImageUrl ? toMediaUrl(comment.authorProfileImageUrl) : null} size={depth ? "xs" : "sm"} />
        <div className="profile-post-comment-content">
          <div className="profile-post-comment-header">
            <div>
              <strong>{authorName}</strong>
              <span>{comment.relationshipLabel || (canManage ? "You" : "Member")} · {formatProfileDate(comment.createdAt)}</span>
            </div>
            <div className="profile-comment-owner-actions">
              <button
                type="button"
                onClick={() => {
                  setOpenProfileReplyId(replyOpen ? null : commentId);
                  setProfileEditingCommentId(null);
                  setProfileEditingCommentText("");
                }}
                disabled={Boolean(profilePostActionBusy)}
              >
                <Icon name="chat" />
                Reply
              </button>
              {canManage ? (
                <>
                  <button type="button" onClick={() => startProfileCommentEdit(comment)} disabled={Boolean(profilePostActionBusy)}>
                    <Icon name="edit" />
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteProfileComment(comment)} disabled={busyDelete}>
                    <Icon name="trash" />
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <form className="profile-comment-edit-form" onSubmit={(event) => submitProfileCommentEdit(event, comment)}>
              <textarea
                value={profileEditingCommentText}
                onChange={(event) => setProfileEditingCommentText(event.target.value)}
                placeholder="Update your comment..."
                disabled={busyEdit}
              />
              <div>
                <button type="submit" disabled={!profileEditingCommentText.trim() || busyEdit}>
                  <Icon name="check" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileEditingCommentId(null);
                    setProfileEditingCommentText("");
                  }}
                  disabled={busyEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              {comment.content || comment.body ? <p>{comment.content || comment.body}</p> : null}
              {renderProfileCommentMedia(comment)}
            </>
          )}

          {replyOpen ? (
            <form className="profile-reply-form" onSubmit={(event) => submitProfileReply(event, comment)}>
              <textarea
                value={replyDraft}
                onChange={(event) => setProfileReplyDrafts((previous) => ({ ...previous, [commentId]: event.target.value }))}
                placeholder={`Reply to ${authorName}`}
                disabled={busyReply}
              />
              {renderProfileAttachmentChip(replyMediaFile, () => selectProfileReplyMedia(commentId, null))}
              <div className="profile-comment-form-tools">
                <input
                  ref={(node) => {
                    if (node) profileReplyMediaInputRefs.current[commentId] = node;
                  }}
                  type="file"
                  accept={PROFILE_COMMENT_MEDIA_ACCEPT}
                  onChange={(event) => selectProfileReplyMedia(commentId, event.target.files?.[0] || null)}
                />
                <button type="button" onClick={() => profileReplyMediaInputRefs.current[commentId]?.click()} disabled={busyReply}>
                  <Icon name="attach" />
                  Image / PDF
                </button>
                <button type="submit" disabled={(!replyDraft.trim() && !replyMediaFile) || busyReply}>
                  <Icon name="send" />
                  Reply
                </button>
              </div>
            </form>
          ) : null}

          {replies.length ? (
            <div className="profile-post-replies">
              {replies.map((reply) => renderProfileCommentItem(reply, depth + 1))}
            </div>
          ) : null}
        </div>
      </article>
    );
  };

  if (loading) return <LoadingState text="Loading profile..." />;

  return (
    <PageGrid className="profile-dashboard">
      <Card className="profile-cover-card">
        <div className="profile-cover-art">
          <img src={profileCoverSrc} alt={hasCustomCover ? "Profile cover" : "Default mountain sunset profile cover"} />
          {isOwnProfile ? (
            <>
              <div className="profile-cover-media-actions">
                <button
                  type="button"
                  className="profile-cover-upload-btn profile-cover-choose-btn"
                  onClick={() => openMediaPicker("cover")}
                  disabled={saving === "cover-image"}
                >
                  <Icon name="image" />
                  {saving === "cover-image" ? "Saving..." : "Change Cover"}
                </button>
                <button
                  type="button"
                  className="profile-cover-upload-btn profile-cover-remove-btn"
                  onClick={() => setRemoveMediaTarget("cover")}
                  disabled={!hasCustomCover || saving === "remove-cover"}
                >
                  <Icon name="trash" />
                  {saving === "remove-cover" ? "Removing..." : "Remove Cover Photo"}
                </button>
              </div>
              <input
                ref={coverInputRef}
                className="hidden-file-input"
                type="file"
                accept="image/*"
                onChange={(event) => handleMediaFileSelected("cover", event.target.files?.[0])}
              />
              <input
                ref={profileInputRef}
                className="hidden-file-input"
                type="file"
                accept="image/*"
                onChange={(event) => handleMediaFileSelected("avatar", event.target.files?.[0])}
              />
            </>
          ) : null}
        </div>
        <div className="profile-identity-row">
          <div className="profile-avatar-wrap">
            <Avatar
              name={name}
              src={profileAvatarSource ? toMediaUrl(profileAvatarSource) : null}
              size="xl"
              online={isOnlineUser(profileUser)}
              className="profile-main-avatar"
            />
            {isOwnProfile ? (
              <button
                type="button"
                className="profile-avatar-upload-btn"
                onClick={() => openMediaPicker("avatar")}
                disabled={saving === "profile-image"}
                title="Change Profile Photo"
                aria-label="Change Profile Photo"
              >
                <Icon name="image" />
              </button>
            ) : null}
          </div>
          <div className="profile-name-stack">
            <h2>
              {name}
              <span className={`profile-role-badge ${profileRoleClass}`}>
                <Icon name={profileRoleIcon} />
                {profileRoleLabel}
              </span>
              {isOnlineUser(profileUser) ? <StatusBadge status="Online" tone="green" /> : <StatusBadge status="Profile" tone="blue" />}
              {hasVerifiedBadge(profileUser) ? <StatusBadge status="Verified XP" tone="blue" /> : null}
            </h2>
            <p className="profile-hero-bio">{profileBio}</p>
            <div className="profile-contact-list">
              <span><Icon name="user" /> {handle}</span>
              <span className={`profile-role-contact ${profileRoleClass}`}><Icon name={profileRoleIcon} /> {profileRoleLabel} Account</span>
              {profileEmail ? <span><Icon name="send" /> {profileEmail}</span> : null}
              <span><Icon name="pin" /> {profileLocation}</span>
            </div>
            {isOwnProfile ? (
              <div className="profile-photo-action-row">
                <Button icon="image" onClick={() => openMediaPicker("avatar")} disabled={saving === "profile-image"}>
                  {saving === "profile-image" ? "Saving..." : "Change Profile Photo"}
                </Button>
                <Button icon="trash" variant="danger" onClick={() => setRemoveMediaTarget("avatar")} disabled={!hasCustomAvatar || saving === "remove-avatar"}>
                  {saving === "remove-avatar" ? "Removing..." : "Remove Profile Photo"}
                </Button>
              </div>
            ) : null}
          </div>
          {isOwnProfile ? (
            <div className="profile-action-row profile-self-action-row">
              <Button icon="edit" variant="gradient" className="profile-hero-edit" onClick={() => navigate("/settings")}>
                Edit Profile
              </Button>
            </div>
          ) : (
            <div className="profile-action-row">
            <Button
              icon="user"
              variant={relationship.isFollowing ? "secondary" : "gradient"}
              className="profile-action-button"
              disabled={saving === "follow"}
              onClick={toggleProfileFollow}
            >
              {relationship.isFollowing ? "Unfollow" : "Follow"}
            </Button>
            <Button
              icon={relationship.isFriend ? "trash" : relationship.incomingRequest ? "check" : "users"}
              variant={relationship.isFriend ? "danger" : "secondary"}
              className="profile-action-button"
              disabled={saving === "friend"}
              onClick={toggleProfileFriend}
            >
              {relationship.isFriend ? "Unfriend" : relationship.incomingRequest ? "Accept Request" : relationship.requested ? "Cancel Request" : "Add Friend"}
            </Button>
            <Button icon="chat" className="profile-action-button" onClick={() => navigate("/chat", { state: { startUserId: viewingUserId } })}>Chat</Button>
            </div>
          )}
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
              <span className={`profile-about-role ${profileRoleClass}`}><Icon name={profileRoleIcon} /> {profileRoleLabel} Account</span>
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
        open={Boolean(activeProfilePost)}
        title={activeProfilePostVideo ? "Reel Preview" : "Post Preview"}
        subtitle="Preview, react, and comment without leaving this profile."
        onClose={closeProfilePostViewer}
        footer={<Button variant="gradient" onClick={closeProfilePostViewer} disabled={Boolean(profilePostActionBusy)}>Close</Button>}
        className={`profile-post-viewer-modal ${activeProfilePostVideo ? "profile-reel-viewer-modal" : "profile-feed-viewer-modal"}`}
      >
        {activeProfilePost ? (
          <div className="profile-post-viewer">
            <section className="profile-post-viewer-media" aria-label={activeProfilePostVideo ? "Selected reel" : "Selected post media"}>
              <div className={`profile-post-viewer-stage ${activeProfilePostVideo ? "is-video" : "is-image"}`}>
                {activeProfilePostMedia ? (
                  activeProfilePostVideo ? (
                    <video src={toMediaUrl(activeProfilePostMedia.url)} controls autoPlay playsInline />
                  ) : (
                    <img src={toMediaUrl(activeProfilePostMedia.url)} alt={activeProfilePostTitle} />
                  )
                ) : (
                  <div className="profile-post-viewer-placeholder">
                    <Icon name={activeProfilePostVideo ? "video" : "image"} />
                    <strong>{activeProfilePostVideo ? "Reel" : "Post"}</strong>
                  </div>
                )}
                <span className="profile-post-viewer-kind">
                  <Icon name={activeProfilePostVideo ? "video" : "image"} />
                  {activeProfilePostVideo ? "Reel" : "Post"}
                </span>
              </div>
              {activeProfilePostMediaItems.length > 1 ? (
                <div className="profile-post-media-strip">
                  {activeProfilePostMediaItems.map((media, index) => {
                    const mediaIsVideo = media.type === "VIDEO" || isVideoAsset(media.url);
                    return (
                      <button
                        key={`${media.url}-${index}`}
                        type="button"
                        className={index === activeProfilePostMediaIndex ? "active" : ""}
                        onClick={() => setActiveProfilePostMediaIndex(index)}
                        aria-label={`Show media ${index + 1}`}
                      >
                        {mediaIsVideo ? <video src={toMediaUrl(media.url)} muted playsInline /> : <img src={toMediaUrl(media.url)} alt="" />}
                        <span><Icon name={mediaIsVideo ? "video" : "image"} /></span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <section className="profile-post-viewer-panel">
              <div className="profile-post-viewer-scroll-area">
                <header className="profile-post-viewer-author">
                  <Avatar name={activeProfilePostAuthorName} src={activeProfilePostAuthorAvatar ? toMediaUrl(activeProfilePostAuthorAvatar) : null} size="md" online={isOnlineUser(profileUser)} />
                  <div>
                    <strong>{activeProfilePostAuthorName}</strong>
                    <div className="author-meta-row">
                      <span>
                        <Icon name={activeProfilePostRoleIcon} />
                        {activeProfilePostRoleLabel}
                      </span>
                      <small>{formatProfileDate(activeProfilePost.createdAt || activeProfilePost.sharedAt)}</small>
                    </div>
                  </div>
                </header>

                <div className="profile-post-viewer-copy">
                  <p>{compactText(activeProfilePost.content || activeProfilePost.caption || activeProfilePost.shareCaption, activeProfilePostVideo ? "Reel from this profile." : "Post from this profile.")}</p>
                  <div className="profile-post-viewer-tags">
                    {activeProfilePostTags.length ? activeProfilePostTags.map((tag) => <span key={tag}>{tag}</span>) : <span>{activeProfilePostVideo ? "#reel" : "#post"}</span>}
                  </div>
                </div>

                <div className="profile-post-viewer-metrics">
                  <span><Icon name="heart" /> {formatMetricValue(postReactionCount(activeProfilePost))} reactions</span>
                  <span><Icon name="chat" /> {formatMetricValue(postCommentCount(activeProfilePost))} comments</span>
                  {activeProfilePostVideo ? <span><Icon name="eye" /> {formatMetricValue(activeProfilePost.reelViewCount)} views</span> : null}
                </div>

                <div className="profile-post-reaction-row">
                  {[
                    { type: "like", label: "Like", icon: "heart" },
                    { type: "love", label: "Love", icon: "spark" },
                    { type: "wow", label: "Wow", icon: "star" }
                  ].map((reaction) => (
                    <button
                      key={reaction.type}
                      type="button"
                      disabled={profilePostActionBusy === `react-${reaction.type}`}
                      onClick={() => reactToProfilePost(reaction.type)}
                    >
                      <Icon name={reaction.icon} />
                      {reaction.label}
                      <strong>{Number(activeProfilePost?.reactionCounts?.[reaction.type] || 0)}</strong>
                    </button>
                  ))}
                </div>

                <div className="profile-post-comments-panel">
                  <div className="profile-post-comments-head">
                    <strong>Comments</strong>
                    <span>{profilePostCommentsLoading ? "Loading..." : `${countCommentThread(profilePostComments)} comments`}</span>
                  </div>
                  <div className="profile-post-comments-list">
                    {profilePostCommentsLoading ? (
                      <p className="profile-post-comments-empty">Loading comments...</p>
                    ) : profilePostComments.length ? (
                      profilePostComments.map((comment) => renderProfileCommentItem(comment))
                    ) : (
                      <div className="profile-post-comments-empty-state">
                        <img src={chatBubbleEmptyState} alt="No comments" />
                        <p className="profile-post-comments-empty">No comments yet. Start the conversation here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-post-comment-form-wrapper">
                <form className="profile-post-comment-form" onSubmit={submitProfilePostComment}>
                  <Avatar name={displayName(user)} src={user?.profileImageUrl || user?.imageUrl ? toMediaUrl(user.profileImageUrl || user.imageUrl) : null} size="sm" />
                  <div className="profile-post-comment-composer">
                    <textarea
                      placeholder="Write a real comment..."
                      value={profilePostCommentDraft}
                      onChange={(event) => setProfilePostCommentDraft(event.target.value)}
                      disabled={profilePostActionBusy === "comment"}
                    />
                    {renderProfileAttachmentChip(profilePostCommentMedia, () => selectProfileCommentMedia(null))}
                    <div className="profile-comment-form-tools">
                      <input
                        ref={profileCommentMediaInputRef}
                        type="file"
                        accept={PROFILE_COMMENT_MEDIA_ACCEPT}
                        onChange={(event) => selectProfileCommentMedia(event.target.files?.[0] || null)}
                      />
                      <button type="button" onClick={() => profileCommentMediaInputRef.current?.click()} disabled={profilePostActionBusy === "comment"}>
                        <Icon name="attach" />
                        Image / PDF
                      </button>
                      <Button variant="gradient" type="submit" disabled={(!profilePostCommentDraft.trim() && !profilePostCommentMedia) || profilePostActionBusy === "comment"}>
                        <Icon name="send" />
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(mediaDraft.type)}
        title={mediaDraftCopy?.title || "Change Photo"}
        subtitle={mediaDraftCopy?.subtitle}
        onClose={saving ? undefined : resetMediaDraft}
        footer={(
          <>
            <Button onClick={resetMediaDraft} disabled={Boolean(saving)}>Cancel</Button>
            <Button
              icon="check"
              variant="gradient"
              onClick={saveMediaDraft}
              disabled={!mediaDraft.file || Boolean(mediaDraft.error) || Boolean(saving)}
            >
              {saving ? "Saving..." : "Save Photo"}
            </Button>
          </>
        )}
        className="profile-media-modal"
      >
        <div className="profile-media-draft">
          <div className={`profile-media-preview profile-media-preview-${mediaDraft.type || "cover"}`}>
            {mediaDraft.previewUrl ? (
              <img src={mediaDraft.previewUrl} alt="Selected media preview" />
            ) : (
              <span><Icon name={mediaDraft.type === "avatar" ? "user" : "image"} /></span>
            )}
          </div>
          <div className="profile-media-draft-copy">
            <strong>{mediaDraft.file?.name || "No valid image selected"}</strong>
            <p>
              JPG, PNG, WebP, or GIF. Maximum size is 8 MB.
              {mediaDraft.type === "cover" ? " Wide landscape images work best for the Profile cover." : " Square portraits work best for the avatar."}
            </p>
            {mediaDraft.error ? <p className="profile-media-error">{mediaDraft.error}</p> : null}
            <button type="button" className="profile-media-choose-again" onClick={() => openMediaPicker(mediaDraft.type || "cover")}>
              <Icon name="image" />
              Choose a different image
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(removeMediaTarget)}
        title={removeMediaCopy?.removeTitle || "Remove Photo"}
        subtitle="This action updates your saved profile media."
        onClose={saving ? undefined : () => setRemoveMediaTarget("")}
        footer={(
          <>
            <Button onClick={() => setRemoveMediaTarget("")} disabled={Boolean(saving)}>Cancel</Button>
            <Button icon="trash" variant="danger" onClick={confirmRemoveMedia} disabled={Boolean(saving)}>
              {saving ? "Removing..." : "Remove Photo"}
            </Button>
          </>
        )}
        className="profile-remove-media-modal"
      >
        <div className="profile-remove-media-body">
          <span><Icon name="trash" /></span>
          <p>{removeMediaCopy?.removeBody}</p>
        </div>
      </Modal>

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
