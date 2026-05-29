import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import PostComposer from "../components/PostComposer";
import FeedCard from "../components/FeedCard";
import { feedService } from "../services/feedService";
import { storyService } from "../services/storyService";
import { chatService } from "../../chat/services/chatService";
import { followService } from "../../follow/services/followService";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import EmptyState from "/src/modules/platform/common/components/EmptyState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import { useAuth } from "/src/modules/platform/app/store";

const CHAT_PRODUCT_NAME = "PulseChat";
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".avi"];
const HASHTAG_PATTERN = /#[a-zA-Z0-9_]+/g;
const STORY_CAPTION_EMOJIS = ["😊", "🔥", "💗", "✨", "👏", "😂"];
const STORY_REACTIONS = [
  { key: "like", label: "Like", emoji: "👍" },
  { key: "love", label: "Love", emoji: "💗" },
  { key: "fire", label: "Fire", emoji: "🔥" },
  { key: "wow", label: "Wow", emoji: "😮" }
];

function FeedIcon({ name, className = "" }) {
  const iconClassName = `feed-inline-icon ${className}`.trim();
  const icons = {
    bolt: (
      <path d="M13 2 5 13h5l-1 9 8-11h-5z" />
    ),
    chat: (
      <path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    ),
    posts: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="M8 11.5 11 9l5 5M8 16h8" />
        <circle cx="8.2" cy="8.2" r="1.2" />
      </>
    ),
    reels: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="m10 9 5 3-5 3zM3 8h18M8 4l2 4M14 4l2 4" />
      </>
    ),
    play: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m10 8.8 5.2 3.2-5.2 3.2z" />
      </>
    ),
    trending: (
      <path d="M4 16 9 11l3 3 7-8M15 6h4v4" />
    ),
    fire: (
      <path d="M12.2 2.5s.5 2.8-1.8 4.9c-2 1.9-2.9 3.3-2.9 5.3a4.5 4.5 0 0 0 9 0c0-1.8-.7-3-2.2-4.4-.9-.8-1.4-2.3-2.1-5.8zM9.8 15.7a2.2 2.2 0 0 0 4.4 0c0-.7-.3-1.2-.9-1.8-.5-.4-.8-1.1-1.1-2.1-.3 1-.8 1.6-1.4 2.1-.7.6-1 1.1-1 1.8z" />
    ),
    bookmark: (
      <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z" />
    ),
    plus: (
      <path d="M12 5v14M5 12h14" />
    ),
    close: (
      <path d="m6 6 12 12M18 6 6 18" />
    ),
    home: (
      <>
        <path d="m4 10 8-6 8 6" />
        <path d="M6.5 9.5V20h11V9.5" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
    cloudUpload: (
      <>
        <path d="M17.5 17.5h.8a3.7 3.7 0 0 0 .3-7.4 6 6 0 0 0-11.5-1.7A4.6 4.6 0 0 0 7 17.5h1" />
        <path d="M12 18V10" />
        <path d="m8.8 13.2 3.2-3.2 3.2 3.2" />
      </>
    ),
    hashtag: (
      <>
        <path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" />
      </>
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9 10h.1M15 10h.1M8.8 14.5c1.8 1.7 4.6 1.7 6.4 0" />
      </>
    ),
    love: (
      <path d="M12 20s-6.4-4.2-8.3-7.6C2.4 9.7 3.2 6 6.6 6c2 0 3 1.2 3.4 2 .4-.8 1.4-2 3.4-2 3.4 0 4.2 3.7 2.9 6.4C18.4 15.8 12 20 12 20z" />
    ),
    check: (
      <path d="m5 12 4 4 10-10" />
    ),
    chevronLeft: (
      <path d="m15 6-6 6 6 6" />
    ),
    chevronRight: (
      <path d="m9 6 6 6-6 6" />
    ),
    chevronDown: (
      <path d="m6 9 6 6 6-6" />
    ),
    eye: (
      <>
        <path d="M2.8 12s3.3-6 9.2-6 9.2 6 9.2 6-3.3 6-9.2 6-9.2-6-9.2-6z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
    comment: (
      <path d="M5.5 17.4a7.5 7.5 0 1 1 3.1 2.1L4 20.2l1.5-2.8z" />
    ),
    paperPlane: (
      <>
        <path d="M21 3 10.5 13.5" />
        <path d="m21 3-6.2 18-4.3-7.5L3 9.2 21 3z" />
      </>
    ),
    share: (
      <>
        <path d="M15 6l4 4-4 4" />
        <path d="M19 10h-7a7 7 0 0 0-7 7v1" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </>
    )
  };

  return (
    <svg className={iconClassName} viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] || icons.bolt}
    </svg>
  );
}

function StoryReactionIcon({ type }) {
  let shape = null;
  switch (type) {
    case "like":
      shape = <path d="M9 21H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h4m0 10V11l4-7 2 1v4h4a2 2 0 0 1 2 2l-1 5a2 2 0 0 1-2 2H9z" />;
      break;
    case "love":
      shape = <path d="M12 20s-6.4-4.2-8.3-7.6C2.4 9.7 3.2 6 6.6 6c2 0 3 1.2 3.4 2 .4-.8 1.4-2 3.4-2 3.4 0 4.2 3.7 2.9 6.4C18.4 15.8 12 20 12 20z" />;
      break;
    case "fire":
      shape = <path d="M12.2 2.5s.5 2.8-1.8 4.9c-2 1.9-2.9 3.3-2.9 5.3a4.5 4.5 0 0 0 9 0c0-1.8-.7-3-2.2-4.4-.9-.8-1.4-2.3-2.1-5.8zM9.8 15.7a2.2 2.2 0 0 0 4.4 0c0-.7-.3-1.2-.9-1.8-.5-.4-.8-1.1-1.1-2.1-.3 1-.8 1.6-1.4 2.1-.7.6-1 1.1-1 1.8z" />;
      break;
    case "wow":
      shape = (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 10h.1M15 10h.1" />
          <circle cx="12" cy="14.2" r="1.6" />
        </>
      );
      break;
    default:
      shape = <circle cx="12" cy="12" r="8.5" />;
  }

  return (
    <svg className="story-reaction-icon" viewBox="0 0 24 24" aria-hidden="true">
      {shape}
    </svg>
  );
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

function storyOwnerName(story) {
  if (story?.ownerName) return story.ownerName;
  const first = story?.firstName || "";
  const last = story?.lastName || "";
  return `${first} ${last}`.trim() || "Unknown";
}

function extractAuthorId(item) {
  const candidates = [item?.authorId, item?.userId, item?.ownerId, item?.sharedById, item?.originalAuthorId];
  const resolved = candidates.find((value) => Number(value) > 0);
  return resolved ? Number(resolved) : null;
}

function humanTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function normalizeStory(story) {
  return {
    ...story,
    id: Number(story?.id || 0),
    ownerUserId: Number(story?.ownerUserId || 0),
    mediaType: String(story?.mediaType || "IMAGE").toUpperCase(),
    resharedFromStoryId: story?.resharedFromStoryId ? Number(story.resharedFromStoryId) : null,
    resharedFromOwnerId: story?.resharedFromOwnerId ? Number(story.resharedFromOwnerId) : null,
    resharedFromOwnerName: story?.resharedFromOwnerName || "",
    reactionCounts: story?.reactionCounts || {}
  };
}

function extractApiPayload(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function normalizeHashtag(tag = "") {
  const normalized = String(tag).trim();
  if (!normalized) return "";
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function formatTrendCount(count) {
  const numeric = Number(count) || 0;
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(numeric >= 10000 ? 1 : 1)}K`;
  return String(numeric);
}

function extractHashtags(content = "") {
  return [...String(content || "").matchAll(HASHTAG_PATTERN)].map((match) => match[0]);
}

function renderTextWithHashtags(content = "", onHashtagClick) {
  return String(content).split(/(#[a-zA-Z0-9_]+)/g).map((part, index) => {
    if (!part) return null;
    if (part.startsWith("#")) {
      return (
        <button
          key={`${part}-${index}`}
          type="button"
          className="feed-hashtag story-caption-hashtag"
          onClick={() => onHashtagClick?.(part)}
        >
          {part}
        </button>
      );
    }
    return part;
  });
}

export default function FeedPage() {
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const viewedReelIdsRef = useRef(new Set());
  const storyFeedPickerRef = useRef(null);
  const handledOpenPostRef = useRef(null);

  const [activeMode, setActiveMode] = useState("posts");
  const [selectedHashtag, setSelectedHashtag] = useState("");
  const [feed, setFeed] = useState([]);
  const [commentsMap, setCommentsMap] = useState({});
  const [reactionsMap, setReactionsMap] = useState({});
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendPanelOpen, setTrendPanelOpen] = useState(false);
  const [trendVisibleCount, setTrendVisibleCount] = useState(9);
  const [loading, setLoading] = useState(true);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [error, setError] = useState("");

  const [stories, setStories] = useState([]);
  const [storyComposerOpen, setStoryComposerOpen] = useState(false);
  const [storySourceMode, setStorySourceMode] = useState("upload");
  const [storyFile, setStoryFile] = useState(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [storySourcePostId, setStorySourcePostId] = useState("");
  const [storyHours, setStoryHours] = useState("24");
  const [alsoAddStoryToFeed, setAlsoAddStoryToFeed] = useState(false);
  const [storyFeedPickerOpen, setStoryFeedPickerOpen] = useState(false);
  const [creatingStory, setCreatingStory] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState(-1);
  const [storyReply, setStoryReply] = useState("");
  const [sendingStoryReply, setSendingStoryReply] = useState(false);
  const [sharingStory, setSharingStory] = useState(false);

  const userId = Number(user?.userId || 0);
  const currentUserStoryName = `${user?.firstname || user?.firstName || ""} ${user?.lastName || user?.lastname || ""}`.trim()
    || user?.name
    || "Anuradh DK";

  const loadStories = useCallback(async () => {
    try {
      const response = await storyService.getFeedStories();
      const payload = extractApiPayload(response);
      const list = Array.isArray(payload) ? payload.map(normalizeStory) : [];
      setStories(list);
    } catch {
      setStories([]);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [feedRes, savedRes] = await Promise.all([
        feedService.getFeed(),
        feedService.getSavedPosts({ page: 0, size: 100 })
      ]);

      const feedList = Array.isArray(feedRes?.data) ? feedRes.data : [];
      setFeed(feedList);

      const savedItems = savedRes?.data?.data?.content || [];
      setSavedPosts(savedItems);
      setSavedPostIds(savedItems.map((post) => post.postId));

      const targetPostIds = [
        ...new Set(
          feedList
            .map((item) => (item.type === "SHARE" ? item.originalPostId : item.postId))
            .filter((postId, index) => Number(postId) > 0 && !feedList[index]?.originalPostDeleted)
            .map((postId) => Number(postId))
        )
      ];

      const commentEntries = await Promise.all(
        targetPostIds.map(async (postId) => {
          try {
            const response = await feedService.getComments(postId);
            return [postId, response.data || []];
          } catch {
            return [postId, []];
          }
        })
      );

      const reactionEntries = await Promise.all(
        targetPostIds.map(async (postId) => {
          try {
            const response = await feedService.getReactions(postId);
            return [postId, response.data || {}];
          } catch {
            return [postId, {}];
          }
        })
      );

      setCommentsMap(Object.fromEntries(commentEntries));
      setReactionsMap(Object.fromEntries(reactionEntries));
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuggestedUsers = useCallback(async () => {
    try {
      const [allUsersRes, followersRes, followingRes] = await Promise.all([
        followService.searchUsers(""),
        followService.followers(),
        followService.following()
      ]);

      const followerIds = new Set((Array.isArray(followersRes?.data) ? followersRes.data : []).map((item) => Number(item.userId)));
      const followingIds = new Set((Array.isArray(followingRes?.data) ? followingRes.data : []).map((item) => Number(item.userId)));
      const list = Array.isArray(allUsersRes?.data) ? allUsersRes.data : [];

      setSuggestedUsers(
        list
          .filter((item) => Number(item.userId) > 0 && Number(item.userId) !== userId)
          .map((item) => ({
            ...item,
            displayName: `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email || "User",
            isFollower: followerIds.has(Number(item.userId)),
            isFollowing: Boolean(item.isFollowing) || followingIds.has(Number(item.userId))
          }))
      );
    } catch {
      setSuggestedUsers([]);
    }
  }, [userId]);

  const refreshFeedAndStories = useCallback(async () => {
    await Promise.all([loadFeed(), loadStories(), loadSuggestedUsers()]);
  }, [loadFeed, loadStories, loadSuggestedUsers]);

  useEffect(() => {
    refreshFeedAndStories();
  }, [refreshFeedAndStories]);

  useEffect(() => {
    const postId = Number(location.state?.openPostId || 0);
    if (!postId || handledOpenPostRef.current === postId || feed.length === 0) return;
    handledOpenPostRef.current = postId;
    if (location.state?.mode === "reels" || location.state?.mode === "posts") {
      setActiveMode(location.state.mode);
    }
    window.setTimeout(() => {
      document.getElementById(`feed-item-${postId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 160);
  }, [feed.length, location.state]);

  const onCreatePost = async (formData) => {
    setSubmittingPost(true);
    try {
      await feedService.createPost(formData);
      pushToast("Post created", "success");
      await loadFeed();
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Failed to create post", "error");
    } finally {
      setSubmittingPost(false);
    }
  };

  const onEditPost = async (postId, formData) => {
    try {
      await feedService.updatePost(postId, formData);
      pushToast("Post updated", "success");
      await loadFeed();
    } catch {
      pushToast("Failed to update post", "error");
    }
  };

  const onComment = async (postId, content, parentCommentId = null) => {
    try {
      if (parentCommentId) {
        await feedService.addReply(postId, parentCommentId, content);
      } else {
        await feedService.addComment(postId, content);
      }
      const response = await feedService.getComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: response.data || [] }));
    } catch {
      pushToast(parentCommentId ? "Failed to add reply" : "Failed to add comment", "error");
    }
  };

  const onReact = async (postId, type) => {
    try {
      await feedService.react(postId, type);
      const response = await feedService.getReactions(postId);
      setReactionsMap((prev) => ({ ...prev, [postId]: response.data || {} }));
    } catch {
      pushToast("Failed to react", "error");
    }
  };

  const onShare = async (postId, caption, options = {}) => {
    try {
      await feedService.share(postId, caption, options);
      pushToast("Post shared", "success");
      await loadFeed();
    } catch {
      pushToast("Failed to share post", "error");
      throw new Error("Failed to share post");
    }
  };

  const onShareToStory = async (postId, caption, notifyFollowers = true) => {
    try {
      const formData = new FormData();
      formData.append("sourcePostId", String(postId));
      formData.append("expiresInHours", "24");
      formData.append("notifyFollowers", String(Boolean(notifyFollowers)));
      if (caption?.trim()) formData.append("caption", caption.trim());
      await storyService.createStory(formData);
      pushToast("Shared to story", "success");
      await loadStories();
    } catch (errorResponse) {
      const message = errorResponse?.response?.data?.message || "Failed to share to story";
      pushToast(message, "error");
      throw new Error(message);
    }
  };

  const onShareToChat = async ({ conversationId, recipientUserId, postItem, caption, postValue }) => {
    try {
      let targetConversationId = conversationId;
      if (!targetConversationId && recipientUserId) {
        const directResponse = await chatService.openDirectConversation(recipientUserId);
        targetConversationId = extractApiPayload(directResponse)?.conversationId;
      }
      if (!targetConversationId) {
        throw new Error("Select a PulseChat recipient.");
      }
      const text = String(postItem?.content || "").trim();
      const kind = isVideoItem(postItem) ? "reel" : "post";
      const author = postItem?.authorName || postItem?.sharedByName || "a creator";
      const captionPrefix = caption?.trim() ? `${caption.trim()}\n\n` : "";
      const valueLabel = postValue ? `Value: ${postValue}\n` : "";
      const content = `${captionPrefix}${valueLabel}Shared ${kind} from ${author}${text ? `\n${text}` : ""}`;
      await chatService.sendMessage(targetConversationId, {
        content,
        attachmentUrl: postItem?.imageUrl || null,
        attachmentType: postItem?.mediaType || (postItem?.imageUrl ? "IMAGE" : null)
      });
      pushToast("Sent to PulseChat", "success");
    } catch (errorResponse) {
      const message = errorResponse?.response?.data?.message || "Failed to send to PulseChat";
      pushToast(message, "error");
      throw new Error(message);
    }
  };

  const searchShareUsers = useCallback(async (query) => {
    const response = await followService.searchUsers(query);
    return Array.isArray(response?.data) ? response.data : [];
  }, []);

  const onDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await feedService.deletePost(postId);
      pushToast("Post deleted", "success");
      await loadFeed();
    } catch {
      pushToast("Failed to delete post", "error");
    }
  };

  const onDeleteShare = async (shareId) => {
    if (!window.confirm("Delete this reshare?")) return;
    try {
      await feedService.deleteShare(shareId);
      pushToast("Reshare deleted", "success");
      await loadFeed();
    } catch {
      pushToast("Failed to delete reshare", "error");
    }
  };

  const onSaveToggle = async (postId, saved) => {
    try {
      if (saved) {
        await feedService.unsavePost(postId);
        pushToast("Removed from saved posts", "success");
      } else {
        await feedService.savePost(postId);
        pushToast("Post saved", "success");
      }
      await loadFeed();
    } catch {
      pushToast("Failed to update saved posts", "error");
    }
  };

  const selectHashtag = useCallback((tag) => {
    const normalized = normalizeHashtag(tag);
    if (!normalized) return;
    setSelectedHashtag(normalized);
  }, []);

  const openUserProfile = useCallback((profileUserId) => {
    const normalizedUserId = Number(profileUserId);
    if (!normalizedUserId) return;
    navigate(normalizedUserId === userId ? "/profile" : `/profile/${normalizedUserId}`);
  }, [navigate, userId]);

  const followSuggestedUser = async (profileUserId) => {
    const normalizedUserId = Number(profileUserId);
    if (!normalizedUserId) return;
    try {
      await followService.follow(normalizedUserId);
      setSuggestedUsers((previous) =>
        previous.map((item) => (
          Number(item.userId) === normalizedUserId ? { ...item, isFollowing: true } : item
        ))
      );
      pushToast("Followed user", "success");
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Failed to follow user", "error");
    }
  };

  const openSavedItem = useCallback((post) => {
    const postId = Number(post?.postId);
    if (!postId) return;
    setSelectedHashtag("");
    setActiveMode(isVideoItem(post) ? "reels" : "posts");
    window.setTimeout(() => {
      document.getElementById(`feed-item-${postId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

  const onReport = async (postId) => {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason || !reason.trim()) return;
    try {
      await feedService.reportPost(postId, reason.trim());
      pushToast("Post reported", "success");
    } catch {
      pushToast("Failed to report post", "error");
    }
  };

  const onReelView = useCallback((postId) => {
    if (Number(postId) <= 0 || viewedReelIdsRef.current.has(postId)) return;
    viewedReelIdsRef.current.add(postId);

    feedService.markReelView(postId).catch(() => {
      viewedReelIdsRef.current.delete(postId);
    });

    setFeed((previous) => previous.map((item) => {
      const matchesPost = item.type === "POST" && Number(item.postId) === Number(postId);
      const matchesShare = item.type === "SHARE" && Number(item.originalPostId) === Number(postId);
      if (!matchesPost && !matchesShare) return item;
      return {
        ...item,
        reelViewCount: Number(item.reelViewCount || 0) + 1
      };
    }));
  }, []);

  const feedMediaCandidates = useMemo(
    () => feed
      .filter((item) => item.imageUrl)
      .map((item) => ({
        sourcePostId: item.type === "SHARE" ? item.originalPostId : item.postId,
        authorName: item.authorName || item.sharedByName || "User",
        content: item.content || "Media post",
        imageUrl: item.imageUrl,
        originalPostDeleted: Boolean(item.originalPostDeleted)
      }))
      .filter((item) => Number(item.sourcePostId) > 0 && !item.originalPostDeleted)
      .slice(0, 40),
    [feed]
  );

  const hashtagFilteredFeed = useMemo(() => {
    if (!selectedHashtag) return feed;
    const hashtagNeedle = normalizeHashtag(selectedHashtag).toLowerCase();
    return feed.filter((item) =>
      extractHashtags(item.content).some((tag) => tag.toLowerCase() === hashtagNeedle)
    );
  }, [feed, selectedHashtag]);

  const selectedStorySource = useMemo(
    () => feedMediaCandidates.find((item) => String(item.sourcePostId) === String(storySourcePostId)) || null,
    [feedMediaCandidates, storySourcePostId]
  );

  const storyFilePreviewUrl = useMemo(
    () => (storyFile ? URL.createObjectURL(storyFile) : ""),
    [storyFile]
  );

  useEffect(
    () => () => {
      if (storyFilePreviewUrl) {
        URL.revokeObjectURL(storyFilePreviewUrl);
      }
    },
    [storyFilePreviewUrl]
  );

  useEffect(() => {
    if (!storyFeedPickerOpen || typeof document === "undefined") return undefined;

    const closeOnOutsideClick = (event) => {
      if (!storyFeedPickerRef.current?.contains(event.target)) {
        setStoryFeedPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [storyFeedPickerOpen]);

  const storyPreviewUrl = storySourceMode === "upload"
    ? storyFilePreviewUrl
    : (selectedStorySource?.imageUrl ? toMediaUrl(selectedStorySource.imageUrl) : "");

  const storyPreviewIsVideo = storySourceMode === "upload"
    ? Boolean(storyFile?.type?.startsWith("video"))
    : Boolean(selectedStorySource && isVideoAsset(selectedStorySource.imageUrl));

  const reels = useMemo(
    () => hashtagFilteredFeed.filter((item) => item.imageUrl && isVideoItem(item)),
    [hashtagFilteredFeed]
  );

  const posts = useMemo(
    () => hashtagFilteredFeed.filter((item) => !isVideoItem(item)),
    [hashtagFilteredFeed]
  );

  const trendingHashtags = useMemo(() => {
    const counter = new Map();
    feed.forEach((item) => {
      extractHashtags(item.content).forEach((tag) => {
        const key = tag.toLowerCase();
        const existing = counter.get(key) || { tag, count: 0 };
        existing.count += 1;
        counter.set(key, existing);
      });
    });
    stories.forEach((story) => {
      extractHashtags(story.caption).forEach((tag) => {
        const key = tag.toLowerCase();
        const existing = counter.get(key) || { tag, count: 0 };
        existing.count += 1;
        counter.set(key, existing);
      });
    });
    return [...counter.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [feed, stories]);

  const suggestions = useMemo(() => {
    const authorCounts = new Map();
    feed.forEach((item) => {
      const authorId = extractAuthorId(item);
      if (Number(authorId) > 0) {
        authorCounts.set(Number(authorId), (authorCounts.get(Number(authorId)) || 0) + 1);
      }
    });
    return suggestedUsers
      .map((item) => ({
        ...item,
        posts: authorCounts.get(Number(item.userId)) || 0,
        score: (item.isFollower ? 30 : 0) + (authorCounts.get(Number(item.userId)) || 0)
      }))
      .sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName))
      .slice(0, 6);
  }, [feed, suggestedUsers]);

  const visibleTrendingHashtags = useMemo(
    () => (trendPanelOpen ? trendingHashtags.slice(0, trendVisibleCount) : trendingHashtags.slice(0, 8)),
    [trendPanelOpen, trendVisibleCount, trendingHashtags]
  );

  const hasMoreTrends = trendPanelOpen && trendVisibleCount < trendingHashtags.length;

  const savedFeedPosts = useMemo(
    () => savedPosts.filter((post) => !isVideoItem(post)),
    [savedPosts]
  );

  const savedReels = useMemo(
    () => savedPosts.filter((post) => isVideoItem(post)),
    [savedPosts]
  );

  const selectedStory = viewingStoryIndex >= 0 ? stories[viewingStoryIndex] : null;
  const selectedStoryIsOwn = Boolean(selectedStory && userId && Number(selectedStory.ownerUserId) === userId);

  const resetStoryComposer = useCallback(() => {
    setStorySourceMode("upload");
    setStoryFile(null);
    setStoryCaption("");
    setStorySourcePostId("");
    setStoryHours("24");
    setAlsoAddStoryToFeed(false);
    setStoryFeedPickerOpen(false);
  }, []);

  const closeStoryComposer = () => {
    if (creatingStory) return;
    resetStoryComposer();
    setStoryComposerOpen(false);
  };

  const appendStoryCaptionToken = (token) => {
    setStoryCaption((previous) => {
      const needsSpace = previous && !/\s$/.test(previous);
      return `${previous}${needsSpace ? " " : ""}${token}`.slice(0, 280);
    });
  };

  const replaceStory = useCallback((updatedStory) => {
    setStories((previous) =>
      previous.map((story) => (Number(story.id) === Number(updatedStory.id) ? normalizeStory(updatedStory) : story))
    );
  }, []);

  const openStory = useCallback(async (index) => {
    const target = stories[index];
    if (!target) return;
    setViewingStoryIndex(index);
    setStoryReply("");
    if (target.viewedByCurrentUser) return;

    try {
      const response = await storyService.markStoryViewed(target.id);
      const payload = extractApiPayload(response);
      if (payload) replaceStory(payload);
    } catch {
      // no-op
    }
  }, [replaceStory, stories]);

  const createStory = async (event) => {
    event.preventDefault();
    setCreatingStory(true);
    try {
      const formData = new FormData();
      const trimmedCaption = storyCaption.trim();
      const storyFeedFile = storyFile;
      const shouldAddToFeed = storySourceMode === "upload" && alsoAddStoryToFeed && storyFeedFile;
      if (trimmedCaption) {
        formData.append("caption", trimmedCaption);
      }
      formData.append("expiresInHours", storyHours || "24");

      if (storySourceMode === "upload") {
        if (!storyFile) {
          pushToast("Please select a story image or video", "error");
          return;
        }
        formData.append("media", storyFile);
      } else {
        if (!storySourcePostId) {
          pushToast("Please choose a feed media item", "error");
          return;
        }
        formData.append("sourcePostId", String(storySourcePostId));
      }

      await storyService.createStory(formData);

      let feedPublished = false;
      let feedPublishFailed = false;
      if (shouldAddToFeed) {
        try {
          const feedFormData = new FormData();
          const isVideoFeedItem = Boolean(storyFeedFile?.type?.startsWith("video"));
          feedFormData.append("content", trimmedCaption || (isVideoFeedItem ? "Shared a reel" : "Shared a photo"));
          feedFormData.append("image", storyFeedFile);
          await feedService.createPost(feedFormData);
          feedPublished = true;
        } catch {
          feedPublishFailed = true;
        }
      }

      resetStoryComposer();
      setStoryComposerOpen(false);
      if (feedPublishFailed) {
        pushToast("Story published, but feed publish failed", "error");
      } else {
        pushToast(feedPublished ? "Story published and added to feed" : "Story published", "success");
      }
      await Promise.all([loadStories(), feedPublished ? loadFeed() : Promise.resolve()]);
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Failed to create story", "error");
    } finally {
      setCreatingStory(false);
    }
  };

  const reactToStory = async (reactionKey) => {
    if (!selectedStory?.id) return;
    try {
      const response = await storyService.reactToStory(selectedStory.id, reactionKey);
      const payload = extractApiPayload(response);
      if (payload) replaceStory(payload);
    } catch {
      pushToast("Failed to react to story", "error");
    }
  };

  const replyToStory = async (event) => {
    event.preventDefault();
    if (!selectedStory?.id || !storyReply.trim()) return;
    setSendingStoryReply(true);
    try {
      await storyService.replyToStory(selectedStory.id, storyReply.trim());
      setStoryReply("");
      pushToast(`Reply sent to ${CHAT_PRODUCT_NAME}`, "success");
    } catch {
      pushToast(`Failed to send story reply to ${CHAT_PRODUCT_NAME}`, "error");
    } finally {
      setSendingStoryReply(false);
    }
  };

  const shareStory = async () => {
    if (!selectedStory?.id || sharingStory) return;
    setSharingStory(true);
    try {
      const response = await storyService.shareStory(selectedStory.id);
      const payload = extractApiPayload(response);
      if (payload) {
        const sharedStory = normalizeStory(payload);
        setStories((previous) => [sharedStory, ...previous.filter((story) => Number(story.id) !== Number(sharedStory.id))]);
        setViewingStoryIndex(0);
      } else {
        await loadStories();
      }
      pushToast("Story reshared", "success");
    } catch (errorResponse) {
      pushToast(errorResponse?.response?.data?.message || "Failed to share story", "error");
    } finally {
      setSharingStory(false);
    }
  };

  const deleteStory = async () => {
    if (!selectedStory?.id) return;
    if (!window.confirm("Delete this story?")) return;
    try {
      await storyService.deleteStory(selectedStory.id);
      pushToast("Story deleted", "success");
      setViewingStoryIndex(-1);
      await loadStories();
    } catch {
      pushToast("Failed to delete story", "error");
    }
  };

  if (loading) {
    return (
      <div className="feed-page premium-feed-page">
        <section className="feed-loading-shell">
          <div className="feed-skeleton feed-skeleton-hero" />
          <div className="feed-skeleton feed-skeleton-stories" />
          <div className="feed-skeleton feed-skeleton-card" />
          <div className="feed-skeleton feed-skeleton-card" />
        </section>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={refreshFeedAndStories} />;

  const renderFeedCards = (items, emptyTitle, emptySubtitle) => (
    items.length === 0 ? (
      <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
    ) : (
      items.map((item) => {
        const targetPostId = item.type === "SHARE" ? item.originalPostId : item.postId;
        const mapPostId = item.originalPostDeleted ? null : targetPostId;
        const normalizedMapPostId = Number(mapPostId) > 0 ? Number(mapPostId) : null;
        const cardKey = item.type === "SHARE"
          ? `SHARE-${item.shareId || item.postId}`
          : `POST-${item.postId}`;
        return (
          <FeedCard
            key={cardKey}
            item={item}
            comments={normalizedMapPostId ? (commentsMap[normalizedMapPostId] || []) : []}
            reactions={normalizedMapPostId ? (reactionsMap[normalizedMapPostId] || {}) : {}}
            saved={normalizedMapPostId ? savedPostIds.includes(normalizedMapPostId) : false}
            currentUserId={userId}
            currentUserName={currentUserStoryName}
            onComment={onComment}
            onReact={onReact}
            onShare={onShare}
            onDelete={onDelete}
            onDeleteShare={onDeleteShare}
            onSaveToggle={onSaveToggle}
            onReport={onReport}
            onEdit={onEditPost}
            onReelView={onReelView}
            onShareToStory={onShareToStory}
            onShareToChat={onShareToChat}
            onSearchShareUsers={searchShareUsers}
            onHashtagClick={selectHashtag}
            onAuthorClick={openUserProfile}
          />
        );
      })
    )
  );

  return (
    <div className="feed-page premium-feed-page">
      <section className="premium-feed-banner">
        <div className="premium-feed-banner-left">
          <div>
            <h2>Bondly Social Feed</h2>
            <p>
              Premium social workspace with
              clean posts and reels flow.
              {selectedHashtag ? ` Filter: ${selectedHashtag}` : ""}
            </p>
          </div>
        </div>
        <div className="premium-feed-banner-art" aria-hidden="true">
          {/* 3D Chat Bubble Illustration */}
          <div className="banner-3d-wrap">
            <div className="banner-bubble-orbit banner-bubble-orbit-1" />
            <div className="banner-bubble-orbit banner-bubble-orbit-2" />
            <div className="banner-bubble-main">
              <div className="banner-bubble-dots">
                <span /><span /><span />
              </div>
            </div>
            <div className="banner-bubble-small" />
            <div className="banner-bubble-tiny" />
          </div>
        </div>
      </section>

      <div className="feed-reference-grid">
        <div className="feed-reference-main">
          <section className="feed-stories-card">
            <header className="feed-section-head">
              <div>
                <h3>Stories</h3>
                <p>Manual stories only. Replies are delivered to {CHAT_PRODUCT_NAME}.</p>
              </div>
              <div className="row-actions">
                <button className="feed-view-btn" type="button" onClick={() => navigate("/chat")}>
                  See all
                </button>
              </div>
            </header>

            <div className="stories-row premium-stories-row">
              <button type="button" className="story-add-card" onClick={() => setStoryComposerOpen(true)}>
                <span className="story-add-icon">
                  <FeedIcon name="plus" />
                </span>
                <small>Create Story</small>
              </button>

              {stories.length === 0 ? (
                <article className="story-empty-card">
                  <h4>No stories yet</h4>
                  <p>Create or assign your first story to activate the stories rail.</p>
                </article>
              ) : null}

              {stories.map((story, index) => (
                <button
                  key={story.id}
                  type="button"
                  className="story-thumb-card"
                  onClick={() => openStory(index)}
                >
                  <span className={`story-ring ${story.viewedByCurrentUser ? "viewed" : ""}`}>
                    {story.mediaType === "VIDEO" ? (
                      <video src={toMediaUrl(story.mediaUrl)} muted />
                    ) : (
                      <img src={toMediaUrl(story.mediaUrl)} alt={storyOwnerName(story)} />
                    )}
                  </span>
                  {index === 0 ? <span className="story-live-badge">LIVE</span> : null}
                  <small>{storyOwnerName(story)}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="feed-mode-switch" role="tablist" aria-label="Feed modes">
            <button
              type="button"
              className={`feed-mode-pill ${activeMode === "posts" ? "active" : ""}`}
              onClick={() => setActiveMode("posts")}
            >
              <span className="feed-pill-content">
                <FeedIcon name="posts" className="feed-pill-icon" />
                Posts
              </span>
            </button>
            <button
              type="button"
              className={`feed-mode-pill ${activeMode === "reels" ? "active" : ""}`}
              onClick={() => setActiveMode("reels")}
            >
              <span className="feed-pill-content">
                <FeedIcon name="reels" className="feed-pill-icon" />
                Reels
              </span>
            </button>
          </section>

          <div className="feed-layout-grid">
            <main className="feed-main-column">
              <PostComposer onSubmit={onCreatePost} submitting={submittingPost} />

              {activeMode === "posts"
                ? renderFeedCards(
                  posts,
                  selectedHashtag ? `No posts for ${selectedHashtag}` : "No posts yet",
                  "Posts section shows image/text posts only."
                )
                : renderFeedCards(
                  reels,
                  selectedHashtag ? `No reels for ${selectedHashtag}` : "No reels yet",
                  "Reels section shows video posts only."
                )}
            </main>
          </div>
        </div>

        <aside className="feed-right-rail">
          {/* Trending Hashtags */}
          <section className="feed-side-panel rail-card rail-trending-card">
            <header className="feed-section-head compact">
              <h4>Trending Hashtags</h4>
              <button type="button" className="feed-view-btn" onClick={() => setTrendPanelOpen(!trendPanelOpen)}>View all</button>
            </header>
            <div className="trend-list">
              {trendingHashtags.length === 0 ? <p className="muted">No hashtags yet.</p> : null}
              {visibleTrendingHashtags.slice(0, trendPanelOpen ? visibleTrendingHashtags.length : 5).map(({ tag, count }, index) => (
                <button
                  key={tag}
                  type="button"
                  className={`trend-row ${index === 0 ? "featured" : ""} ${selectedHashtag.toLowerCase() === tag.toLowerCase() ? "active" : ""}`}
                  onClick={() => selectHashtag(tag)}
                  title={`${count} use${count === 1 ? "" : "s"}`}
                >
                  <span className="trend-dot-indicator" />
                  <span className="trend-tag-text">{tag}</span>
                  <span className="trend-count">
                    {formatTrendCount(count)} posts
                    <svg className="trend-wave-icon" viewBox="0 0 60 20" aria-hidden="true"><polyline points="0,14 10,6 20,14 30,6 40,14 50,6 60,14" /></svg>
                  </span>
                </button>
              ))}
            </div>
            {selectedHashtag ? (
              <div className="row-actions rail-clear-filter">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedHashtag("")}>
                  Clear Filter
                </button>
              </div>
            ) : null}
          </section>

          {/* Suggested People */}
          <section className="feed-side-panel rail-card rail-suggestions-card">
            <header className="feed-section-head compact">
              <h4>Suggested People</h4>
              <button type="button" className="feed-view-btn" onClick={() => navigate("/friends")}>View all</button>
            </header>
            {suggestions.length === 0 ? <p className="muted">No suggestions yet.</p> : null}
            <div className="suggestion-stack">
              {suggestions.slice(0, 3).map((suggestion) => (
                <article key={`suggestion-${suggestion.userId}`} className="suggestion-feature-card rail-suggestion-row">
                  <button type="button" className="suggestion-feature-user" onClick={() => openUserProfile(suggestion.userId)}>
                    <span className="suggestion-avatar">{(suggestion.displayName || "U").slice(0, 1)}</span>
                    <div>
                      <strong>{suggestion.displayName}</strong>
                      <p>@{String(suggestion.email || suggestion.displayName || "user").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()}</p>
                    </div>
                  </button>
                  <div className="suggestion-actions">
                    <button
                      type="button"
                      className="suggestion-follow-btn"
                      onClick={() => followSuggestedUser(suggestion.userId)}
                      disabled={suggestion.isFollowing}
                    >
                      {suggestion.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Explore Reels */}
          <section className="feed-side-panel rail-card rail-explore-card">
            <div className="rail-explore-content">
              <div className="rail-explore-icon-wrap">
                <FeedIcon name="reels" />
              </div>
              <div>
                <h4>Explore Reels</h4>
                <p>Discover short videos and trending content from the community.</p>
              </div>
            </div>
            <button
              type="button"
              className="rail-explore-thumb-btn"
              onClick={() => {
                setActiveMode("reels");
                setSelectedHashtag("");
              }}
              aria-label="Explore Reels"
            >
              {reels[0]?.imageUrl ? (
                <video
                  className="rail-explore-thumb"
                  src={toMediaUrl(reels[0].imageUrl)}
                  muted
                  playsInline
                />
              ) : (
                <div className="rail-explore-thumb-placeholder">
                  <span>▶</span>
                </div>
              )}
            </button>
          </section>

          {/* Explore Images */}
          <section className="feed-side-panel rail-card rail-explore-card">
            <div className="rail-explore-content">
              <div className="rail-explore-icon-wrap">
                <FeedIcon name="posts" />
              </div>
              <div>
                <h4>Explore Images</h4>
                <p>Browse stunning photos and captivating moments shared by the community.</p>
              </div>
            </div>
            <div className="rail-explore-grid">
              {feedMediaCandidates.filter((item) => !item.originalPostDeleted).slice(0, 4).map((item) => (
                <img
                  key={`explore-img-${item.sourcePostId}`}
                  className="rail-explore-grid-thumb"
                  src={toMediaUrl(item.imageUrl)}
                  alt={item.authorName}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ))}
              {feedMediaCandidates.filter((item) => !item.originalPostDeleted).length === 0 && (
                <div className="rail-explore-grid-empty">
                  <FeedIcon name="posts" />
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {storyComposerOpen && typeof document !== "undefined" ? createPortal(
        <div className="story-create-overlay" onClick={closeStoryComposer}>
          <section className="story-create-card" onClick={(event) => event.stopPropagation()}>
            <header className="story-create-head">
              <h3>Create Story</h3>
              <button type="button" className="story-create-close" onClick={closeStoryComposer} aria-label="Close create story">
                <FeedIcon name="close" />
              </button>
            </header>

            <form className="story-create-form" onSubmit={createStory}>
              <div className="story-create-tabs">
                <button
                  type="button"
                  className={storySourceMode === "upload" ? "active" : ""}
                  onClick={() => {
                    setStorySourceMode("upload");
                    setStoryFeedPickerOpen(false);
                  }}
                >
                  <FeedIcon name="home" />
                  Upload
                </button>
                <button
                  type="button"
                  className={storySourceMode === "feed" ? "active" : ""}
                  onClick={() => {
                    setStorySourceMode("feed");
                    setAlsoAddStoryToFeed(false);
                  }}
                >
                  <FeedIcon name="posts" />
                  Assign From Feed
                </button>
              </div>

              {storySourceMode === "upload" ? (
                <>
                  <label className="story-create-dropzone">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event) => setStoryFile(event.target.files?.[0] || null)}
                  />
                  <span className="story-create-cloud">
                    <FeedIcon name="cloudUpload" />
                  </span>
                  <strong>{storyFile ? storyFile.name : "Choose image or video"}</strong>
                  <small>Drag & drop or click to browse</small>
                  <em>JPG, PNG, MP4 or MOV · Max 100MB</em>
                  </label>
                  <label className="story-create-feed-toggle">
                    <input
                      type="checkbox"
                      checked={alsoAddStoryToFeed}
                      onChange={(event) => setAlsoAddStoryToFeed(event.target.checked)}
                    />
                    <span className="story-create-feed-check">
                      <FeedIcon name="check" />
                    </span>
                    <span>
                      <strong>Also add to feed</strong>
                      <small>{storyFile?.type?.startsWith("video") ? "Video will publish in Reels." : "Image will publish as a post."}</small>
                    </span>
                  </label>
                </>
              ) : (
                <div className="story-create-feed-picker" ref={storyFeedPickerRef}>
                  <span>Choose feed media</span>
                  <div className="story-feed-select">
                    <button
                      type="button"
                      className="story-feed-select-button"
                      onClick={() => setStoryFeedPickerOpen((open) => !open)}
                      disabled={feedMediaCandidates.length === 0}
                    >
                      <span>
                        {selectedStorySource
                          ? `${selectedStorySource.authorName}: ${selectedStorySource.content.slice(0, 48)}`
                          : (feedMediaCandidates.length ? "Select feed media" : "No feed media available")}
                      </span>
                      <FeedIcon name="chevronDown" className={storyFeedPickerOpen ? "open" : ""} />
                    </button>
                    {storyFeedPickerOpen ? (
                      <div className="story-feed-select-menu" role="listbox">
                        {feedMediaCandidates.map((item) => (
                          <button
                            key={`story-source-${item.sourcePostId}-${item.imageUrl}`}
                            type="button"
                            className={String(storySourcePostId) === String(item.sourcePostId) ? "story-feed-select-option active" : "story-feed-select-option"}
                            onClick={() => {
                              setStorySourcePostId(String(item.sourcePostId));
                              setStoryFeedPickerOpen(false);
                            }}
                          >
                            <span>{item.authorName}</span>
                            <small>{item.content.slice(0, 58)}</small>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="story-create-duration-row">
                {["24", "48", "72"].map((hours) => (
                  <button
                    key={`story-hours-${hours}`}
                    type="button"
                    className={storyHours === hours ? "active" : ""}
                    onClick={() => setStoryHours(hours)}
                  >
                    {hours}h
                  </button>
                ))}
              </div>

              <div className="story-create-body">
                <div className="story-create-fields">
                  <label className="story-create-caption">
                    <span>
                      <strong>Story caption</strong>
                      <small>{storyCaption.length}/280</small>
                    </span>
                    <textarea
                      rows={4}
                      maxLength={280}
                      placeholder="Write something exciting..."
                      value={storyCaption}
                      onChange={(event) => setStoryCaption(event.target.value)}
                    />
                    <div className="story-create-caption-tools">
                      {STORY_CAPTION_EMOJIS.map((emoji) => (
                        <button key={emoji} type="button" onClick={() => appendStoryCaptionToken(emoji)}>
                          {emoji}
                        </button>
                      ))}
                      <button type="button" onClick={() => appendStoryCaptionToken("#")}>
                        <FeedIcon name="hashtag" />
                      </button>
                    </div>
                  </label>

                  <section className="story-create-preview-note">
                    <h4>Story Preview</h4>
                    <p>This is how your story will look to your audience.</p>
                    <div>
                      <FeedIcon name="clock" />
                      <span>Stories disappear after the selected duration.</span>
                    </div>
                  </section>
                </div>

                <aside className="story-create-phone" aria-label="Story preview">
                  <div className="story-phone-top">
                    <span />
                    <span />
                    <span />
                  </div>
                  <header>
                    <span>{currentUserStoryName.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <strong>{currentUserStoryName}</strong>
                      <small>{storyHours}h</small>
                    </div>
                  </header>
                  <div className="story-phone-media">
                    {storyPreviewUrl ? (
                      storyPreviewIsVideo ? (
                        <video src={storyPreviewUrl} muted />
                      ) : (
                        <img src={storyPreviewUrl} alt="Story preview" />
                      )
                    ) : (
                      <div className="story-phone-empty">
                        <FeedIcon name="cloudUpload" />
                      </div>
                    )}
                  </div>
                  {storyCaption ? <p>{storyCaption}</p> : <p>Your story caption will appear here...</p>}
                  <footer>
                    <span>Send message</span>
                    <FeedIcon name="love" />
                  </footer>
                </aside>
              </div>

              <footer className="story-create-footer">
                <button className="story-create-cancel" type="button" onClick={closeStoryComposer} disabled={creatingStory}>
                  Cancel
                </button>
                <button className="story-create-publish" type="submit" disabled={creatingStory}>
                  <FeedIcon name="paperPlane" />
                  {creatingStory ? "Publishing..." : "Publish Story"}
                </button>
              </footer>
            </form>
          </section>
        </div>,
        document.querySelector(".shell.shell-home-theme") || document.querySelector(".shell") || document.body
      ) : null}

      {selectedStory && typeof document !== "undefined" ? createPortal(
        <div className="feed-modal-overlay story-viewer-overlay" onClick={() => setViewingStoryIndex(-1)}>
          <button
            type="button"
            className="story-viewer-nav story-viewer-nav-prev"
            onClick={(event) => {
              event.stopPropagation();
              openStory(viewingStoryIndex <= 0 ? stories.length - 1 : viewingStoryIndex - 1);
            }}
            disabled={stories.length <= 1}
            aria-label="Previous story"
          >
            <FeedIcon name="chevronLeft" />
          </button>

          <section className="feed-modal-card story-viewer-card premium-story-viewer-card" onClick={(event) => event.stopPropagation()}>
            <div className="story-progress-row" style={{ gridTemplateColumns: `repeat(${stories.length}, minmax(0, 1fr))` }} aria-hidden="true">
              {stories.map((story, index) => (
                <span
                  key={`story-progress-${story.id || index}`}
                  className={index < viewingStoryIndex ? "seen" : index === viewingStoryIndex ? "active" : ""}
                />
              ))}
            </div>

            <header className="story-viewer-head">
              <span className="story-viewer-avatar">
                {storyOwnerName(selectedStory).slice(0, 1).toUpperCase()}
                <span className="story-viewer-verified" aria-hidden="true" />
              </span>
              <div>
                <h3>{storyOwnerName(selectedStory)}</h3>
                <p>
                  {selectedStory.resharedFromStoryId
                    ? (selectedStory.resharedFromOwnerName ? `reshared ${selectedStory.resharedFromOwnerName}'s story` : "reshared a story")
                    : humanTime(selectedStory.createdAt)}
                  <span aria-hidden="true"> - </span>
                  <FeedIcon name="eye" className="story-head-mini-icon" />
                </p>
                {selectedStory.resharedFromStoryId ? (
                  <small className="story-repost-time">{humanTime(selectedStory.createdAt)}</small>
                ) : null}
              </div>
              <button type="button" className="story-viewer-close" onClick={() => setViewingStoryIndex(-1)} aria-label="Close story viewer">
                <FeedIcon name="close" />
              </button>
            </header>

            <div className="story-viewer-media">
              {selectedStory.mediaType === "VIDEO" ? (
                <video src={toMediaUrl(selectedStory.mediaUrl)} controls autoPlay />
              ) : (
                <img src={toMediaUrl(selectedStory.mediaUrl)} alt={storyOwnerName(selectedStory)} />
              )}
            </div>

            {selectedStory.caption ? (
              <p className="story-viewer-caption">
                {renderTextWithHashtags(selectedStory.caption, (tag) => {
                  selectHashtag(tag);
                  setViewingStoryIndex(-1);
                })}
              </p>
            ) : null}
            <div className="story-viewer-meta-row">
              <span>
                <FeedIcon name="eye" />
                Views {Number(selectedStory.viewCount || 0)}
              </span>
              <span>
                <FeedIcon name="clock" />
                {humanTime(selectedStory.createdAt)}
              </span>
            </div>

            <div className="story-action-row">
              {STORY_REACTIONS.map((reaction) => (
                <button
                  key={reaction.key}
                  type="button"
                  className="story-reaction-pill"
                  onClick={() => reactToStory(reaction.key)}
                >
                  <span aria-hidden="true">{reaction.emoji}</span>
                  <span>
                    {reaction.label}
                  </span>
                  <strong>{Number(selectedStory?.reactionCounts?.[reaction.key] || 0)}</strong>
                </button>
              ))}
              <span className="story-action-spacer" />
              <button type="button" className="story-secondary-action" onClick={shareStory} disabled={sharingStory}>
                <FeedIcon name="share" />
                {sharingStory ? "Sharing..." : "Share"}
              </button>
              {selectedStoryIsOwn ? (
                <button type="button" className="story-secondary-action danger" onClick={deleteStory}>
                  <FeedIcon name="trash" />
                  Delete
                </button>
              ) : null}
            </div>

            <form className="story-reply-panel" onSubmit={replyToStory}>
              <label>Reply to story (sends to {CHAT_PRODUCT_NAME})</label>
              <div>
                <FeedIcon name="comment" />
                <input
                  value={storyReply}
                  onChange={(event) => setStoryReply(event.target.value)}
                  placeholder="Write your reply..."
                />
                <button className="story-reply-submit" type="submit" disabled={sendingStoryReply}>
                  <FeedIcon name="paperPlane" />
                  {sendingStoryReply ? "Sending..." : "Reply"}
                </button>
              </div>
            </form>

            <div className="story-quick-reactions">
              <span>Quick Reactions</span>
              <div>
                {STORY_REACTIONS.map((reaction) => (
                  <button
                    key={`quick-${reaction.key}`}
                    type="button"
                    onClick={() => reactToStory(reaction.key)}
                    aria-label={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                ))}
                <button type="button" onClick={() => reactToStory("haha")} aria-label="Haha">{"\u{1F602}"}</button>
              </div>
            </div>

          </section>

          <button
            type="button"
            className="story-viewer-nav story-viewer-nav-next"
            onClick={(event) => {
              event.stopPropagation();
              openStory(viewingStoryIndex >= stories.length - 1 ? 0 : viewingStoryIndex + 1);
            }}
            disabled={stories.length <= 1}
            aria-label="Next story"
          >
            <FeedIcon name="chevronRight" />
          </button>
        </div>,
        document.querySelector(".shell.shell-home-theme") || document.querySelector(".shell") || document.body
      ) : null}
    </div>
  );
}
