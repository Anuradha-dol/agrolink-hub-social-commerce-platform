import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

const REACTIONS = [
  { key: "like", label: "Like" },
  { key: "love", label: "Love" },
  { key: "care", label: "Care" },
  { key: "haha", label: "Haha" },
  { key: "wow", label: "Wow" },
  { key: "sad", label: "Sad" },
  { key: "angry", label: "Angry" }
];

const QUICK_EMOJIS = ["\u{1F600}", "\u{1F60D}", "\u{1F525}", "\u{1F44F}", "\u{1F4AF}", "\u{2728}", "\u{1F64C}", "\u{1F62E}"];
const POST_VALUES = [
  { key: "top", label: "Top", hint: "High signal" },
  { key: "medium", label: "Medium", hint: "Normal share" },
  { key: "low", label: "Low", hint: "Light note" }
];
const SHARE_AUDIENCES = [
  { key: "public", label: "Public" },
  { key: "followers", label: "Followers" },
  { key: "friends", label: "Friends" }
];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".avi"];

function isVideoAsset(url = "") {
  const normalized = String(url).toLowerCase().split("?")[0];
  return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function reactionByKey(key) {
  const normalizedKey = String(key || "").toLowerCase();
  return REACTIONS.find((reaction) => reaction.key === normalizedKey) || REACTIONS[0];
}

function KebabIcon() {
  return (
    <svg className="kebab-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg className="feed-verified-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8l2.2 1.6 2.7-.2 1.1 2.5 2.4 1.4-.8 2.6.8 2.7-2.4 1.4-1.1 2.5-2.7-.2-2.2 1.6-2.2-1.6-2.7.2L6 14.8l-2.4-1.4.8-2.7-.8-2.6L6 6.7l1.1-2.5 2.7.2L12 2.8z" />
      <path d="M8.7 11.9l2.1 2.1 4.6-4.8" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="feed-meta-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M4.2 12h15.6M12 3.8c2 2 3 4.7 3 8.2s-1 6.2-3 8.2M12 3.8c-2 2-3 4.7-3 8.2s1 6.2 3 8.2" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="feed-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.5 17.4a7.5 7.5 0 1 1 3.1 2.1L4 20.2l1.5-2.8z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="feed-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 6l4 4-4 4" />
      <path d="M19 10h-7a7 7 0 0 0-7 7v1" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="feed-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 4.5h11v15l-5.5-3.2-5.5 3.2v-15z" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg className="feed-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M8.8 10h.1M15.1 10h.1M8.4 14.2c.9 1 2.1 1.5 3.6 1.5s2.7-.5 3.6-1.5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="feed-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2.4" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m7 17 4.2-4.2 2.4 2.4 2-2L20 17" />
    </svg>
  );
}

function GifIcon() {
  return <span className="feed-gif-icon" aria-hidden="true">GIF</span>;
}

function ChevronDownIcon() {
  return (
    <svg className="feed-chevron-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 9 5 5 5-5" />
    </svg>
  );
}

function FeedShareIcon() {
  return (
    <svg className="share-panel-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <path d="M15 14.5h4M17 12.5v4" />
    </svg>
  );
}

function StoryShareIcon() {
  return (
    <svg className="share-panel-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.5v9M7.5 12h9" />
    </svg>
  );
}

function ChatShareIcon() {
  return (
    <svg className="share-panel-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 4 9.8 15.2" />
      <path d="m21 4-6.8 17-4.4-5.8L3 12.5 21 4z" />
    </svg>
  );
}

function ShareCloseIcon() {
  return (
    <svg className="share-close-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="share-option-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9.8a6 6 0 0 0-12 0c0 7-2.5 7.2-2.5 7.2h17S18 16.8 18 9.8z" />
      <path d="M9.8 20a2.4 2.4 0 0 0 4.4 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="share-input-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function AudienceIcon() {
  return (
    <svg className="share-input-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M4.2 12h15.6M12 3.8c2 2 3 4.7 3 8.2s-1 6.2-3 8.2M12 3.8c-2 2-3 4.7-3 8.2s1 6.2 3 8.2" />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg className="feed-tool-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.4" />
      <path d="M15.4 12v1.4a2.2 2.2 0 0 0 4.2.9A8 8 0 1 0 16 19.5" />
    </svg>
  );
}

function PostValueIcon({ type }) {
  const paths = {
    top: (
      <>
        <path d="M12 18V6" />
        <path d="m7.5 10.5 4.5-4.5 4.5 4.5" />
        <path d="M6 18h12" />
      </>
    ),
    medium: (
      <>
        <path d="m5 14 4-4 4 4 6-6" />
        <path d="M15 8h4v4" />
      </>
    ),
    low: (
      <>
        <path d="M19 12a7 7 0 1 1-7-7" />
        <path d="M13 11 20 4" />
        <path d="m15.5 4H20v4.5" />
      </>
    )
  };

  return (
    <svg className="share-value-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      {paths[type] || paths.medium}
    </svg>
  );
}

function renderContentWithHashtags(content = "", onHashtagClick) {
  return String(content).split(/(#[a-zA-Z0-9_]+)/g).map((part, index) => {
    if (!part) return null;
    if (part.startsWith("#")) {
      return (
        <button
          key={`${part}-${index}`}
          type="button"
          className="feed-hashtag"
          onClick={() => onHashtagClick?.(part)}
        >
          {part}
        </button>
      );
    }
    return part;
  });
}

function ReactionIcon({ type, className = "" }) {
  let shape = null;
  switch (type) {
    case "like":
      shape = <path d="M9 21H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h4m0 10V11l4-7 2 1v4h4a2 2 0 0 1 2 2l-1 5a2 2 0 0 1-2 2H9z" />;
      break;
    case "love":
      shape = <path d="M12 20s-6.4-4.2-8.3-7.6C2.4 9.7 3.2 6 6.6 6c2 0 3 1.2 3.4 2 .4-.8 1.4-2 3.4-2 3.4 0 4.2 3.7 2.9 6.4C18.4 15.8 12 20 12 20z" />;
      break;
    case "care":
      shape = (
        <>
          <path d="M4 12h3v8H4z" />
          <path d="M7 19h4.1c1.6 0 3.1-.7 4.2-1.9l2.4-2.7a1.5 1.5 0 0 0-2.1-2.2l-1.5 1.6c-.8.8-1.8 1.2-2.9 1.2-1.4 0-2.1-.5-2.8-1.2-.5-.6-1-1.1-2.1-1.1" />
        </>
      );
      break;
    case "haha":
      shape = (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.2 10.4h.1M15.7 10.4h.1M8 14.4c1 .9 2.3 1.4 4 1.4s3-.5 4-1.4" />
        </>
      );
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
    case "sad":
      shape = (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 10.3h.1M15 10.3h.1M8.5 16.2c.8-1 1.9-1.5 3.5-1.5s2.7.5 3.5 1.5" />
        </>
      );
      break;
    case "angry":
      shape = (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.1 10.2l2-.7M15.9 10.2l-2-.7M8.6 16.2c.8-.9 1.9-1.4 3.4-1.4s2.6.5 3.4 1.4" />
        </>
      );
      break;
    default:
      shape = <circle cx="12" cy="12" r="8.5" />;
  }

  return (
    <svg className={`reaction-glyph ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true">
      {shape}
    </svg>
  );
}

function initialFromName(name = "U") {
  return String(name || "U").trim().slice(0, 1).toUpperCase() || "U";
}

function shareUserName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Unknown user";
}

function commentAuthorName(comment) {
  return comment?.authorName || `${comment?.firstName || ""} ${comment?.lastName || ""}`.trim() || "Member";
}

function firstNumericId(...values) {
  const found = values.find((value) => Number(value) > 0);
  return found ? Number(found) : 0;
}

function comparableName(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function itemAuthorId(item) {
  return firstNumericId(
    item?.authorId,
    item?.userId,
    item?.ownerId,
    item?.createdById,
    item?.user?.userId,
    item?.user?.id,
    item?.author?.userId,
    item?.author?.id
  );
}

function isOwnedPost(item, currentUserId, currentUserName) {
  const ownerId = itemAuthorId(item);
  const viewerId = firstNumericId(currentUserId);
  if (ownerId && viewerId) return ownerId === viewerId;

  const ownerName = comparableName(item?.authorName || item?.author?.name);
  const viewerName = comparableName(currentUserName);
  return Boolean(ownerName && viewerName && ownerName === viewerName);
}

function mentionFromName(name = "member") {
  const cleaned = String(name)
    .trim()
    .replace(/[^a-zA-Z0-9_ ]/g, "")
    .replace(/\s+/g, "");
  return `@${cleaned || "member"}`;
}

function formatCommentTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function countCommentThread(comments = []) {
  return comments.reduce((total, comment) => total + 1 + (Array.isArray(comment.replies) ? comment.replies.length : 0), 0);
}

function normalizeCategory(category) {
  return String(category || "GENERAL").trim().toUpperCase() || "GENERAL";
}

function categoryLabel(category) {
  return normalizeCategory(category)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function categoryTone(category) {
  const normalized = normalizeCategory(category);
  if (normalized === "EDUCATION" || normalized === "NEWS") return "green";
  if (normalized === "BUSINESS" || normalized === "TECH") return "silver";
  if (normalized === "FUNNY" || normalized === "LIFESTYLE") return "gold";
  return "neutral";
}

function badgeForAuthorXp(xp) {
  const value = Number(xp || 0);
  if (value >= 1000) return { tone: "gold", label: "Platinum XP" };
  if (value >= 500) return { tone: "gold", label: "Gold XP" };
  if (value >= 100) return { tone: "silver", label: "Silver XP" };
  return null;
}

function hasVerifiedAuthorBadge(item, isShare) {
  const verifiedXp = Number(isShare ? item?.sharedByVerifiedXp : item?.authorVerifiedXp);
  return Boolean(isShare ? item?.sharedByVerified : item?.authorVerified) || verifiedXp >= 100;
}

export default function FeedCard({
  item,
  comments = [],
  reactions = {},
  reactionUsers = [],
  saved = false,
  currentUserId,
  currentUserName = "",
  onComment,
  onUpdateComment,
  onDeleteComment,
  onReact,
  onShare,
  onDelete,
  onDeleteShare,
  onSaveToggle,
  onReport,
  onEdit,
  onReelView,
  onShareToStory,
  onShareToChat,
  onSearchShareUsers,
  onHashtagClick,
  onAuthorClick
}) {
  const [commentText, setCommentText] = useState("");
  const [shareCaption, setShareCaption] = useState("");
  const [shareDestination, setShareDestination] = useState("feed");
  const [shareAlsoStory, setShareAlsoStory] = useState(false);
  const [shareNotifyFollowers, setShareNotifyFollowers] = useState(true);
  const [sharePostValue, setSharePostValue] = useState("medium");
  const [shareAudience, setShareAudience] = useState("public");
  const [shareAudienceOpen, setShareAudienceOpen] = useState(false);
  const [shareUserSearch, setShareUserSearch] = useState("");
  const [shareUserResults, setShareUserResults] = useState([]);
  const [shareUserSearchLoading, setShareUserSearchLoading] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareToolMenu, setShareToolMenu] = useState("");
  const [commentToolMenu, setCommentToolMenu] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentComposerOpen, setCommentComposerOpen] = useState(false);
  const [openReplyId, setOpenReplyId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentActionBusy, setCommentActionBusy] = useState("");
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
  const [deleteConfirmCommentId, setDeleteConfirmCommentId] = useState(null);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [shareComposerOpen, setShareComposerOpen] = useState(false);
  const [reactionUsersOpen, setReactionUsersOpen] = useState(false);
  const [selectedReactionKey, setSelectedReactionKey] = useState("");
  const [editingOpen, setEditingOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(item.content || "");
  const [editingFile, setEditingFile] = useState(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);

  const pickerRef = useRef(null);
  const menuRef = useRef(null);
  const shareAudienceRef = useRef(null);
  const shareCaptionRef = useRef(null);
  const commentInputRef = useRef(null);
  const isShare = item.type === "SHARE";
  const originalPostDeleted = Boolean(item.originalPostDeleted);
  const targetPostId = isShare ? item.originalPostId : item.postId;
  const validTargetPost = Number(targetPostId) > 0 && !originalPostDeleted;
  const mediaUrl = !originalPostDeleted && item.imageUrl ? toMediaUrl(item.imageUrl) : "";
  const videoAsset = (item.mediaType || "").toUpperCase() === "VIDEO" || isVideoAsset(item.imageUrl || "");
  const canEditPost = !isShare && isOwnedPost(item, currentUserId, currentUserName);
  const canDeletePost = canEditPost;
  const canDeleteShare = isShare && Number(item.sharedById) === Number(currentUserId);
  const canShareToStory = Boolean(validTargetPost && mediaUrl);
  const displayContent = originalPostDeleted ? "" : String(item.content || "").trim();
  const sharePreviewTitle = (item.content || "").trim() || (videoAsset ? "Shared reel" : "Shared post");
  const sharePreviewType = videoAsset ? "Reel" : "Post";

  const totalReactions = useMemo(
    () => Object.values(reactions || {}).reduce((total, value) => total + Number(value || 0), 0),
    [reactions]
  );
  const postCategory = normalizeCategory(item.category);
  const postCategoryLabel = categoryLabel(postCategory);
  const authorXp = Number(isShare ? item?.sharedByVerifiedXp : item?.authorVerifiedXp);
  const authorXpBadge = badgeForAuthorXp(authorXp);
  const educationBadge = {
    tone: authorXpBadge?.tone || categoryTone(postCategory),
    label: authorXpBadge?.label || postCategoryLabel
  };
  const authorVerified = hasVerifiedAuthorBadge(item, isShare);

  const reactionSummary = useMemo(
    () => Object.entries(reactions || {})
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3)
      .map(([key, count]) => ({ ...reactionByKey(key), count: Number(count) })),
    [reactions]
  );

  const selectedReaction = selectedReactionKey ? reactionByKey(selectedReactionKey) : null;
  const selectedShareAudience = SHARE_AUDIENCES.find((audience) => audience.key === shareAudience) || SHARE_AUDIENCES[0];
  const authorName = isShare ? item.sharedByName : item.authorName;
  const headTimestamp = item.sharedAt || item.createdAt;
  const visibleComments = commentsExpanded ? comments : comments.slice(0, 3);
  const hiddenCommentCount = Math.max(0, comments.length - visibleComments.length);
  const totalCommentCount = countCommentThread(comments);
  const reactionSummaryText = totalReactions
    ? selectedReactionKey
      ? totalReactions > 1
        ? `You and ${totalReactions - 1} ${totalReactions - 1 === 1 ? "other" : "others"}`
        : "You reacted"
      : `${totalReactions} ${totalReactions === 1 ? "reaction" : "reactions"}`
    : "Be first to react";
  const realReactionUsers = Array.isArray(reactionUsers) ? reactionUsers : [];
  const reactionAvatarUsers = realReactionUsers
    .filter((reactionUser) => Number(reactionUser?.userId) > 0 || reactionUser?.name)
    .slice(0, 3);

  useEffect(() => {
    setEditingContent(item.content || "");
    setEditingFile(null);
    setRemoveMedia(false);
    setEditingOpen(false);
    setOpenReplyId(null);
    setReplyDrafts({});
    setEditingCommentId(null);
    setEditingCommentText("");
    setCommentActionBusy("");
    setOpenCommentMenuId(null);
    setDeleteConfirmCommentId(null);
    setCommentsExpanded(false);
    setMediaFailed(false);
  }, [item.postId, item.content, item.imageUrl]);

  useEffect(() => {
    if (shareDestination === "story" && !canShareToStory) {
      setShareDestination("feed");
    }
    if (!canShareToStory && shareAlsoStory) {
      setShareAlsoStory(false);
    }
  }, [canShareToStory, shareAlsoStory, shareDestination]);

  useEffect(() => {
    if (!shareComposerOpen || !onSearchShareUsers || shareUserSearch.trim().length < 2) {
      setShareUserResults([]);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setShareUserSearchLoading(true);
      onSearchShareUsers(shareUserSearch.trim())
        .then((users) => {
          if (cancelled) return;
          setShareUserResults(Array.isArray(users) ? users : []);
        })
        .catch(() => {
          if (!cancelled) setShareUserResults([]);
        })
        .finally(() => {
          if (!cancelled) setShareUserSearchLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [onSearchShareUsers, shareComposerOpen, shareUserSearch]);

  useEffect(() => {
    if (!shareComposerOpen || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shareComposerOpen]);

  useEffect(() => {
    if (shareComposerOpen) {
      setShareAudience("public");
    }
    setShareAudienceOpen(false);
  }, [shareComposerOpen]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (shareAudienceRef.current && !shareAudienceRef.current.contains(event.target)) {
        setShareAudienceOpen(false);
      }
      if (event.target instanceof Element && !event.target.closest(".comment-menu-wrap")) {
        setOpenCommentMenuId(null);
        setDeleteConfirmCommentId(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  const submitComment = async (event) => {
    event.preventDefault();
    if (!validTargetPost || !commentText.trim()) return;
    await onComment(targetPostId, commentText);
    setCommentText("");
    setCommentComposerOpen(true);
    setCommentsExpanded(true);
  };

  const openReplyComposer = (comment) => {
    const commentId = Number(comment?.commentId || 0);
    if (!commentId) return;
    const mention = `${mentionFromName(commentAuthorName(comment))} `;
    setOpenReplyId(commentId);
    setReplyDrafts((prev) => ({
      ...prev,
      [commentId]: prev[commentId] || mention
    }));
    setCommentsExpanded(true);
  };

  const updateReplyDraft = (commentId, value) => {
    setReplyDrafts((prev) => ({ ...prev, [commentId]: value }));
  };

  const submitReply = async (event, comment) => {
    event.preventDefault();
    const commentId = Number(comment?.commentId || 0);
    const draft = replyDrafts[commentId] || "";
    if (!validTargetPost || !commentId || !draft.trim()) return;
    await onComment(targetPostId, draft, commentId);
    setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
    setOpenReplyId(null);
    setCommentsExpanded(true);
  };

  const beginEditComment = (comment) => {
    const commentId = Number(comment?.commentId || 0);
    if (!commentId) return;
    setEditingCommentId(commentId);
    setEditingCommentText(String(comment?.content || ""));
    setOpenReplyId(null);
    setOpenCommentMenuId(null);
    setDeleteConfirmCommentId(null);
    setCommentsExpanded(true);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const submitCommentEdit = async (event, comment) => {
    event.preventDefault();
    const commentId = Number(comment?.commentId || 0);
    const cleanText = editingCommentText.trim();
    if (!validTargetPost || !commentId || !cleanText || !onUpdateComment) return;
    setCommentActionBusy(`edit-${commentId}`);
    try {
      await onUpdateComment(targetPostId, commentId, cleanText);
      setEditingCommentId(null);
      setEditingCommentText("");
    } finally {
      setCommentActionBusy("");
    }
  };

  const deleteComment = async (comment) => {
    const commentId = Number(comment?.commentId || 0);
    if (!validTargetPost || !commentId || !onDeleteComment) return;
    setCommentActionBusy(`delete-${commentId}`);
    try {
      await onDeleteComment(targetPostId, commentId);
    } finally {
      setCommentActionBusy("");
      setOpenCommentMenuId(null);
      setDeleteConfirmCommentId(null);
    }
  };

  const toggleCommentMenu = (commentId) => {
    setDeleteConfirmCommentId(null);
    setOpenCommentMenuId((currentId) => (currentId === commentId ? null : commentId));
  };

  const renderCommentMenu = (comment, label = "Comment options") => {
    const commentId = Number(comment?.commentId || 0);
    const canManage = Number(comment?.authorId) === Number(currentUserId);
    if (!commentId || !canManage) return null;
    const isOpen = openCommentMenuId === commentId;
    const confirmingDelete = deleteConfirmCommentId === commentId;
    const deleting = commentActionBusy === `delete-${commentId}`;

    return (
      <div className="comment-menu-wrap">
        <button
          type="button"
          className={`comment-menu-trigger ${isOpen ? "active" : ""}`.trim()}
          onClick={() => toggleCommentMenu(commentId)}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <KebabIcon />
        </button>
        {isOpen ? (
          <div className={`comment-action-menu ${confirmingDelete ? "confirming" : ""}`.trim()} role="menu">
            {confirmingDelete ? (
              <>
                <strong>Delete comment?</strong>
                <p>This removes it from the post.</p>
                <div className="comment-delete-actions">
                  <button type="button" onClick={() => setDeleteConfirmCommentId(null)} disabled={deleting}>
                    Cancel
                  </button>
                  <button type="button" className="danger" onClick={() => deleteComment(comment)} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button type="button" role="menuitem" onClick={() => beginEditComment(comment)}>
                  Edit comment
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="danger"
                  onClick={() => setDeleteConfirmCommentId(commentId)}
                  disabled={deleting}
                >
                  Delete comment
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  const submitShare = async (event) => {
    event.preventDefault();
    if (!validTargetPost) return;
    setShareSubmitting(true);
    setShareError("");
    try {
      const mentionedUserIds = mentionedUsers.map((user) => user.userId);
      if (shareDestination === "feed") {
        await onShare(targetPostId, shareCaption, {
          notifyFollowers: shareNotifyFollowers,
          mentionedUserIds,
          postValue: sharePostValue
        });
        if (shareAlsoStory && onShareToStory) {
          await onShareToStory(targetPostId, shareCaption, shareNotifyFollowers);
        }
      } else if (shareDestination === "story") {
        if (!canShareToStory) {
          throw new Error("Only posts and reels with media can be shared to story.");
        }
        if (!onShareToStory) {
          throw new Error("Story sharing is not available.");
        }
        await onShareToStory(targetPostId, shareCaption, shareNotifyFollowers);
      } else if (shareDestination === "chat") {
        if (!chatRecipient) {
          throw new Error("Select a PulseChat person.");
        }
        if (!onShareToChat) {
          throw new Error("PulseChat sharing is not available.");
        }
        await onShareToChat({
          recipientUserId: chatRecipient?.userId ? Number(chatRecipient.userId) : null,
          postItem: item,
          caption: shareCaption,
          postValue: sharePostValue,
          mentionedUserIds
        });
      }
      setShareCaption("");
      setShareAlsoStory(false);
      setMentionedUsers([]);
      setChatRecipient(null);
      setShareUserSearch("");
      setShareAudience("public");
      setShareAudienceOpen(false);
      setShareComposerOpen(false);
    } catch (errorResponse) {
      setShareError(errorResponse?.message || "Failed to share.");
    } finally {
      setShareSubmitting(false);
    }
  };

  const insertShareText = (text) => {
    const input = shareCaptionRef.current;
    if (!input) {
      setShareCaption((prev) => `${prev}${text}`);
      return;
    }
    const start = input.selectionStart ?? shareCaption.length;
    const end = input.selectionEnd ?? shareCaption.length;
    const next = `${shareCaption.slice(0, start)}${text}${shareCaption.slice(end)}`;
    setShareCaption(next);
    window.requestAnimationFrame(() => {
      input.focus();
      const cursor = start + text.length;
      input.setSelectionRange(cursor, cursor);
    });
  };

  const insertCommentText = (text) => {
    const input = commentInputRef.current;
    if (!input) {
      setCommentText((prev) => `${prev}${text}`);
      return;
    }
    const start = input.selectionStart ?? commentText.length;
    const end = input.selectionEnd ?? commentText.length;
    const next = `${commentText.slice(0, start)}${text}${commentText.slice(end)}`;
    setCommentText(next);
    window.requestAnimationFrame(() => {
      input.focus();
      const cursor = start + text.length;
      input.setSelectionRange(cursor, cursor);
    });
  };

  const addMentionedUser = (user) => {
    if (!user?.userId) return;
    setMentionedUsers((prev) => {
      if (prev.some((item) => Number(item.userId) === Number(user.userId))) return prev;
      return [...prev, user];
    });
    insertShareText(`@${shareUserName(user).replace(/\s+/g, "")} `);
  };

  const removeMentionedUser = (userId) => {
    setMentionedUsers((prev) => prev.filter((user) => Number(user.userId) !== Number(userId)));
    if (chatRecipient && Number(chatRecipient.userId) === Number(userId)) {
      setChatRecipient(null);
    }
  };

  const handleReact = async (reactionKey) => {
    if (!validTargetPost) return;
    await onReact(targetPostId, reactionKey);
    setSelectedReactionKey((prev) => (prev === reactionKey ? "" : reactionKey));
    setPickerOpen(false);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!onEdit || !canEditPost) return;
    setSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append("content", editingContent ?? "");
      if (editingFile) formData.append("image", editingFile);
      if (removeMedia) formData.append("removeMedia", "true");
      await onEdit(item.postId, formData);
      setEditingOpen(false);
      setEditingFile(null);
      setRemoveMedia(false);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <article className="card feed-card premium-feed-card" id={validTargetPost ? `feed-item-${targetPostId}` : undefined}>
      <header className="feed-card-header premium-feed-card-header">
        <div className="feed-card-author-wrap">
          <button
            type="button"
            className="feed-avatar-badge feed-author-button"
            onClick={() => {
              const profileUserId = isShare ? item.sharedById : item.authorId;
              if (profileUserId) onAuthorClick?.(profileUserId);
            }}
          >
            {(authorName || "U").slice(0, 1).toUpperCase()}
            <span className="feed-avatar-online" aria-hidden="true" />
          </button>
          <div>
            <button
              type="button"
              className="feed-author feed-author-line feed-author-name-button"
              onClick={() => {
                const profileUserId = isShare ? item.sharedById : item.authorId;
                if (profileUserId) onAuthorClick?.(profileUserId);
              }}
            >
              {isShare ? `${item.sharedByName} shared` : item.authorName}
              {authorVerified ? <VerifiedIcon /> : null}
              <span className={`learning-xp-badge ${educationBadge.tone}`}>
                {educationBadge.label}
              </span>
            </button>
            <p className="feed-time feed-time-row">
              {headTimestamp ? new Date(headTimestamp).toLocaleString() : ""}
              <span className="feed-time-dot" aria-hidden="true" />
              <GlobeIcon />
            </p>
          </div>
        </div>

        <div className="feed-header-actions" ref={menuRef}>
          <button type="button" className="icon-btn premium-icon-btn" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Post actions">
            <KebabIcon />
          </button>
          {menuOpen ? (
            <div className="post-menu premium-post-menu">
              <button
                type="button"
                onClick={() => {
                  if (validTargetPost) onSaveToggle(targetPostId, saved);
                  setMenuOpen(false);
                }}
                disabled={!validTargetPost}
              >
                {saved ? "Unsave" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validTargetPost) onReport(targetPostId);
                  setMenuOpen(false);
                }}
                disabled={!validTargetPost}
              >
                Report
              </button>
              {canEditPost && onEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  Edit
                </button>
              ) : null}
              {canDeletePost && onDelete ? (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    onDelete(item.postId);
                    setMenuOpen(false);
                  }}
                >
                  Delete Post
                </button>
              ) : null}
              {canDeleteShare && onDeleteShare ? (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    onDeleteShare(item.shareId || item.postId);
                    setMenuOpen(false);
                  }}
                >
                  Delete Reshare
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {isShare ? (
        <p className="feed-share-caption">
          {item.shareCaption || "Shared a post"}
        </p>
      ) : null}

      {originalPostDeleted ? (
        <div className="deleted-post-note">
          This content is unavailable because the original post was deleted by the author.
        </div>
      ) : null}

      {displayContent ? (
        <p className="feed-content">{renderContentWithHashtags(displayContent, onHashtagClick)}</p>
      ) : null}

      <span className={`feed-post-value-chip learning-value-chip ${educationBadge.tone}`}>
        {postCategoryLabel}
      </span>

      {mediaUrl ? (
        <div className="feed-media-shell">
          {mediaFailed ? (
            <div className="feed-media-fallback">
              <FeedShareIcon />
              <strong>Media unavailable</strong>
              <span>The original upload is missing from the server.</span>
            </div>
          ) : videoAsset ? (
            <video
              className="feed-video"
              src={mediaUrl}
              controls
              preload="metadata"
              onError={() => setMediaFailed(true)}
              onPlay={() => {
                if (validTargetPost && onReelView) onReelView(targetPostId);
              }}
            />
          ) : (
            <img className="feed-image" src={mediaUrl} alt="Post" onError={() => setMediaFailed(true)} />
          )}
        </div>
      ) : null}

      {videoAsset ? (
        <p className="feed-view-count">
          {Number(item.reelViewCount || 0)} views
        </p>
      ) : null}

      <div className="reaction-bar premium-reaction-bar">
        <div className="reaction-picker-wrap" ref={pickerRef}>
          <button
            type="button"
            className="btn btn-secondary reaction-trigger"
            onMouseEnter={() => setPickerOpen(true)}
            onFocus={() => setPickerOpen(true)}
            onClick={() => setPickerOpen((prev) => !prev)}
            disabled={!validTargetPost}
          >
            {selectedReaction ? (
              <span className="reaction-trigger-content feed-action-button-content">
                <ReactionIcon type={selectedReaction.key} />
                {selectedReaction.label}
              </span>
            ) : (
              <span className="reaction-trigger-content feed-action-button-content">
                <ReactionIcon type="like" />
                React
              </span>
            )}
          </button>
          {pickerOpen ? (
            <div className="reaction-popover premium-reaction-popover" role="menu" aria-label="Choose reaction">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.key}
                  type="button"
                  className="reaction-option"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleReact(reaction.key);
                  }}
                  title={reaction.label}
                >
                  <span className="reaction-option-icon">
                    <ReactionIcon type={reaction.key} />
                  </span>
                  <small>{reaction.label}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="feed-action-group">
          <button
            type="button"
            className={`btn btn-secondary ${commentComposerOpen ? "active" : ""}`}
            onClick={() => setCommentComposerOpen((prev) => !prev)}
            disabled={!validTargetPost}
          >
            <span className="feed-action-button-content">
              <CommentIcon />
              Comment
            </span>
          </button>
          <button
            type="button"
            className={`btn btn-secondary ${shareComposerOpen ? "active" : ""}`}
            onClick={() => {
              setShareError("");
              setShareComposerOpen(true);
            }}
            disabled={!validTargetPost}
          >
            <span className="feed-action-button-content">
              <ShareIcon />
              Share
            </span>
          </button>
          <button
            type="button"
            className={`btn btn-secondary feed-save-action ${saved ? "active" : ""}`}
            onClick={() => {
              if (validTargetPost) onSaveToggle(targetPostId, saved);
            }}
            disabled={!validTargetPost}
          >
            <span className="feed-action-button-content">
              <SaveIcon />
              {saved ? "Saved" : "Save"}
            </span>
          </button>
        </div>

        <div className="reaction-total premium-reaction-total">
          <span className="reaction-avatar-stack" aria-hidden="true">
            {reactionAvatarUsers.map((reactionUser, index) => (
              <span key={`${reactionUser.userId || reactionUser.name}-${index}`} className={`reaction-avatar-mini reaction-avatar-mini-${index + 1}`}>
                {reactionUser.profileImageUrl ? (
                  <img src={toMediaUrl(reactionUser.profileImageUrl)} alt="" />
                ) : (
                  initialFromName(reactionUser.name)
                )}
              </span>
            ))}
          </span>
          <span className="reaction-total-copy">
            <strong>{totalReactions}</strong>
            <span>Reactions</span>
            <button type="button" onClick={() => setReactionUsersOpen(true)} disabled={!validTargetPost || totalReactions === 0}>View</button>
          </span>
        </div>
      </div>

      <div className="feed-engagement-summary">
        <button
          type="button"
          className="feed-reaction-summary"
          onClick={() => (totalReactions > 0 ? setReactionUsersOpen(true) : setPickerOpen(true))}
          disabled={!validTargetPost}
        >
          <span className="feed-reaction-bubbles" aria-hidden="true">
            {(reactionSummary.length ? reactionSummary : [{ key: "love", label: "Love", count: 0 }, { key: "like", label: "Like", count: 0 }]).slice(0, 2).map((reaction) => (
              <span key={`summary-${reaction.key}`} className={`feed-reaction-bubble ${reaction.key}`}>
                <ReactionIcon type={reaction.key} />
              </span>
            ))}
          </span>
          <strong>{reactionSummaryText}</strong>
        </button>
        <button
          type="button"
          className="feed-comment-summary"
          onClick={() => {
            setCommentComposerOpen(true);
            setCommentsExpanded(true);
            window.setTimeout(() => commentInputRef.current?.focus(), 0);
          }}
        >
          <span>{totalCommentCount} {totalCommentCount === 1 ? "Comment" : "Comments"}</span>
          <ChevronDownIcon />
        </button>
      </div>

      {reactionUsersOpen ? createPortal(
        <div className="reaction-users-overlay" onMouseDown={() => setReactionUsersOpen(false)}>
          <section className="reaction-users-card reaction-users-modal-card" onMouseDown={(event) => event.stopPropagation()}>
            <header className="reaction-users-head">
              <div>
                <span className="reaction-users-head-icon">
                  <ReactionIcon type="like" />
                </span>
                <h3>People who reacted</h3>
                <p>{totalReactions} {totalReactions === 1 ? "person" : "people"}</p>
              </div>
              <button type="button" className="share-panel-close" onClick={() => setReactionUsersOpen(false)} aria-label="Close reactions">
                <ShareCloseIcon />
              </button>
            </header>
            <div className="reaction-users-filter-row" aria-label="Reaction summary">
              <button type="button" className="active">All <strong>{totalReactions}</strong></button>
              {reactionSummary.map((reaction) => (
                <button key={`filter-${reaction.key}`} type="button">
                  <ReactionIcon type={reaction.key} />
                  {reaction.label}
                  <strong>{reaction.count}</strong>
                </button>
              ))}
            </div>
            {realReactionUsers.length ? (
              <div className="reaction-users-list">
                {realReactionUsers.map((reactionUser, index) => {
                  const reaction = reactionByKey(reactionUser.type);
                  const reactionUserId = Number(reactionUser.userId || 0);
                  return (
                    <article key={`${reactionUser.reactionId || reactionUser.userId || reactionUser.name}-${index}`} className="reaction-user-row">
                      <button
                        type="button"
                        className="reaction-user-profile"
                        onClick={() => {
                          if (reactionUserId) {
                            setReactionUsersOpen(false);
                            onAuthorClick?.(reactionUserId);
                          }
                        }}
                        disabled={!reactionUserId}
                      >
                        <span className="reaction-user-avatar">
                          {reactionUser.profileImageUrl ? (
                            <img src={toMediaUrl(reactionUser.profileImageUrl)} alt="" />
                          ) : (
                            initialFromName(reactionUser.name)
                          )}
                          <i className={`reaction-user-mini-type ${reaction.key}`}>
                            <ReactionIcon type={reaction.key} />
                          </i>
                        </span>
                        <span>
                          <strong>{reactionUser.name || "Unknown user"}</strong>
                          <small>{reactionUser.email || "AgroLink member"}</small>
                        </span>
                      </button>
                      <span className={`reaction-user-type ${reaction.key}`}>
                        <ReactionIcon type={reaction.key} />
                        {reaction.label}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="reaction-users-empty">No reaction users found for this post.</p>
            )}
          </section>
        </div>,
        document.querySelector(".shell.shell-home-theme") || document.querySelector(".shell") || document.body
      ) : null}

      {validTargetPost || comments.length > 0 ? (
        <div className="feed-thread-shell">
          <form onSubmit={submitComment} className="inline-form feed-inline-form premium-inline-form">
            <span className="feed-comment-avatar">
              {(currentUserName || authorName || "U").slice(0, 1).toUpperCase()}
              <span className="feed-avatar-online" aria-hidden="true" />
            </span>
            <input
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              disabled={!validTargetPost}
            />
            <span className="feed-comment-tools">
              <button
                type="button"
                className="feed-tool-button"
                onClick={() => setCommentToolMenu((prev) => (prev === "emoji" ? "" : "emoji"))}
                aria-label="Add emoji"
              >
                <SmileIcon />
              </button>
              <button
                type="button"
                className="feed-tool-button"
                onClick={() => insertCommentText(" [photo] ")}
                aria-label="Add image"
                disabled={!validTargetPost}
              >
                <ImageIcon />
              </button>
              <button
                type="button"
                className="feed-tool-button gif-tool-button"
                onClick={() => insertCommentText(" GIF ")}
                aria-label="Add GIF"
                disabled={!validTargetPost}
              >
                <GifIcon />
              </button>
              {commentToolMenu ? (
                <span className="feed-tool-popover comment-tool-popover">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={`comment-emoji-${emoji}`}
                      type="button"
                      onClick={() => {
                        insertCommentText(emoji);
                        setCommentToolMenu("");
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </span>
              ) : null}
            </span>
            <button className="btn btn-primary feed-comment-submit" type="submit" disabled={!validTargetPost}>
              Send
            </button>
          </form>

          {comments.length > 0 ? (
            <div className="comment-list premium-comment-list" role="list">
              <div className="thread-summary-row">
                <span>{totalCommentCount} {totalCommentCount === 1 ? "comment" : "comments"}</span>
                {hiddenCommentCount > 0 ? (
                  <button type="button" onClick={() => setCommentsExpanded(true)}>
                    View {hiddenCommentCount} older {hiddenCommentCount === 1 ? "comment" : "comments"}
                  </button>
                ) : null}
              </div>

              {visibleComments.map((comment) => {
                const commentId = Number(comment.commentId || 0);
                const name = commentAuthorName(comment);
                const mention = mentionFromName(name);
                const replies = Array.isArray(comment.replies) ? comment.replies : [];
                const replyDraft = replyDrafts[commentId] || "";
                const isEditingComment = editingCommentId === commentId;
                return (
                  <article className="comment-thread-item" role="listitem" key={comment.commentId}>
                    <div className="comment-bubble-row">
                      <span className="comment-author-avatar">{initialFromName(name)}</span>
                      <div className="comment-bubble">
                        <header className="comment-bubble-header">
                          <span className="comment-author-meta">
                            <strong>{name}</strong>
                            {comment.createdAt ? <time>{formatCommentTime(comment.createdAt)}</time> : null}
                          </span>
                          {renderCommentMenu(comment, "Comment options")}
                        </header>
                        {isEditingComment ? (
                          <form className="comment-edit-form" onSubmit={(event) => submitCommentEdit(event, comment)}>
                            <input
                              value={editingCommentText}
                              onChange={(event) => setEditingCommentText(event.target.value)}
                              autoFocus
                            />
                            <button type="submit" disabled={!editingCommentText.trim() || commentActionBusy === `edit-${commentId}`}>
                              Save
                            </button>
                            <button type="button" onClick={cancelEditComment}>
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <p>{comment.content}</p>
                        )}
                      </div>
                    </div>

                    <div className="comment-actions">
                      <button type="button" className="comment-reply-link" onClick={() => openReplyComposer(comment)}>
                        Reply to {mention}
                      </button>
                      {replies.length > 0 ? <span>{replies.length} {replies.length === 1 ? "reply" : "replies"}</span> : null}
                    </div>

                    {openReplyId === commentId ? (
                      <form className="comment-reply-form" onSubmit={(event) => submitReply(event, comment)}>
                        <span className="comment-author-avatar compact">{initialFromName(currentUserName || authorName)}</span>
                        <input
                          value={replyDraft}
                          onChange={(event) => updateReplyDraft(commentId, event.target.value)}
                          placeholder={`Reply to ${mention}`}
                          autoFocus
                        />
                        <button className="btn btn-primary" type="submit" disabled={!replyDraft.trim()}>
                          Reply
                        </button>
                      </form>
                    ) : null}

                    {replies.length > 0 ? (
                      <div className="comment-replies" role="list" aria-label={`Replies to ${name}`}>
                        {replies.map((reply) => {
                          const replyName = commentAuthorName(reply);
                          const replyContent = String(reply.content || "");
                          const hasRootMention = replyContent.toLowerCase().startsWith(mention.toLowerCase());
                          const replyId = Number(reply.commentId || 0);
                          const isEditingReply = editingCommentId === replyId;
                          return (
                            <article className="comment-reply-item" role="listitem" key={reply.commentId}>
                              <span className="comment-author-avatar compact">{initialFromName(replyName)}</span>
                              <div className="comment-bubble reply">
                                <header className="comment-bubble-header">
                                  <span className="comment-author-meta">
                                    <strong>{replyName}</strong>
                                    {reply.createdAt ? <time>{formatCommentTime(reply.createdAt)}</time> : null}
                                  </span>
                                  {renderCommentMenu(reply, "Reply options")}
                                </header>
                                {isEditingReply ? (
                                  <form className="comment-edit-form" onSubmit={(event) => submitCommentEdit(event, reply)}>
                                    <input
                                      value={editingCommentText}
                                      onChange={(event) => setEditingCommentText(event.target.value)}
                                      autoFocus
                                    />
                                    <button type="submit" disabled={!editingCommentText.trim() || commentActionBusy === `edit-${replyId}`}>
                                      Save
                                    </button>
                                    <button type="button" onClick={cancelEditComment}>
                                      Cancel
                                    </button>
                                  </form>
                                ) : (
                                  <p>
                                    {!hasRootMention ? <><span className="comment-root-mention">{mention}</span>{" "}</> : null}
                                    {replyContent}
                                  </p>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {shareComposerOpen && validTargetPost && typeof document !== "undefined" ? createPortal(
        <div className="share-panel-backdrop" onClick={() => !shareSubmitting && setShareComposerOpen(false)}>
          <section className="share-panel-card" onClick={(event) => event.stopPropagation()} aria-label="Share post">
            <form onSubmit={submitShare}>
              <div className="share-panel-grid">
                <div className="share-panel-intro">
                  <span className="share-panel-mark">
                    <ChatShareIcon />
                  </span>
                  <div>
                    <h3>Share this {videoAsset ? "reel" : "post"}</h3>
                    <p>Let others see what you are excited about.</p>
                  </div>
                  <button
                    type="button"
                    className="share-panel-close"
                    onClick={() => setShareComposerOpen(false)}
                    disabled={shareSubmitting}
                    aria-label="Close share dialog"
                  >
                    <ShareCloseIcon />
                  </button>
                </div>

                <aside className="share-preview-card">
                  <div className="share-preview-media">
                    {mediaUrl ? (
                      videoAsset ? (
                        <video src={mediaUrl} muted />
                      ) : (
                        <img src={mediaUrl} alt={sharePreviewTitle} />
                      )
                    ) : (
                      <div className="share-preview-empty">
                        <FeedShareIcon />
                      </div>
                    )}
                    {videoAsset ? <span className="share-preview-play">Play</span> : null}
                  </div>
                  <div>
                    <strong>{sharePreviewTitle}</strong>
                    <span>{authorName || "Creator"}</span>
                    <small>{sharePreviewType}</small>
                  </div>
                </aside>

                <label className="share-caption-box">
                  <textarea
                    ref={shareCaptionRef}
                    value={shareCaption}
                    onChange={(event) => setShareCaption(event.target.value)}
                    maxLength={1000}
                    placeholder="Add your thoughts or share caption..."
                  />
                  <span className="share-caption-tools">
                    <button
                      type="button"
                      className="feed-tool-button"
                      onClick={() => setShareToolMenu((prev) => (prev === "emoji" ? "" : "emoji"))}
                      aria-label="Add emoji"
                    >
                      <SmileIcon />
                    </button>
                    <button
                      type="button"
                      className="feed-tool-button"
                      onClick={() => {
                        setShareToolMenu("");
                        window.requestAnimationFrame(() => {
                          document.getElementById(`share-user-search-${item.type}-${item.postId}`)?.focus();
                        });
                      }}
                      aria-label="Mention someone"
                    >
                      <AtIcon />
                    </button>
                    {shareToolMenu ? (
                      <span className="feed-tool-popover share-tool-popover">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={`share-emoji-${emoji}`}
                            type="button"
                            onClick={() => {
                              insertShareText(emoji);
                              setShareToolMenu("");
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </span>
                    ) : null}
                  </span>
                  <small>{shareCaption.length} / 1000</small>
                </label>

                <div className="share-panel-controls">
                  <div className="share-field">
                    <span>Share to</span>
                    <div className="share-destination-tabs">
                      <button
                        type="button"
                        className={shareDestination === "feed" ? "active" : ""}
                        onClick={() => setShareDestination("feed")}
                      >
                        <FeedShareIcon />
                        Feed
                      </button>
                      <button
                        type="button"
                        className={shareDestination === "story" ? "active" : ""}
                        onClick={() => canShareToStory && setShareDestination("story")}
                        disabled={!canShareToStory}
                      >
                        <StoryShareIcon />
                        Story
                      </button>
                      <button
                        type="button"
                        className={shareDestination === "chat" ? "active" : ""}
                        onClick={() => setShareDestination("chat")}
                      >
                        <ChatShareIcon />
                        PulseChat
                      </button>
                    </div>
                  </div>

                  <div className="share-field">
                    <span>Post value</span>
                    <div className="share-value-tabs">
                      {POST_VALUES.map((value) => (
                        <button
                          key={value.key}
                          type="button"
                          className={sharePostValue === value.key ? "active" : ""}
                          onClick={() => setSharePostValue(value.key)}
                        >
                          <span className={`share-value-icon value-${value.key}`}>
                            <PostValueIcon type={value.key} />
                          </span>
                          <span className="share-value-copy">
                            <strong>{value.label}</strong>
                            <small>{value.hint}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="share-field share-user-field">
                    <span>{shareDestination === "chat" ? "Send personally to" : "Mention people"}</span>
                    <div className="share-input-wrap">
                      <SearchIcon />
                      <input
                        id={`share-user-search-${item.type}-${item.postId}`}
                        value={shareUserSearch}
                        onChange={(event) => setShareUserSearch(event.target.value)}
                        placeholder="Search any user in database..."
                      />
                    </div>
                    {shareUserSearch.trim().length >= 2 ? (
                      <div className="share-user-results">
                        {shareUserSearchLoading ? (
                          <p>Searching...</p>
                        ) : shareUserResults.length === 0 ? (
                          <p>No users found</p>
                        ) : (
                          shareUserResults.slice(0, 6).map((user) => (
                            <button
                              key={`share-user-${user.userId}`}
                              type="button"
                              onClick={() => {
                                addMentionedUser(user);
                                if (shareDestination === "chat") {
                                  setChatRecipient(user);
                                }
                                setShareUserSearch("");
                                setShareUserResults([]);
                              }}
                            >
                              <span>{initialFromName(shareUserName(user))}</span>
                              <strong>{shareUserName(user)}</strong>
                              <small>{user.email}</small>
                            </button>
                          ))
                        )}
                      </div>
                    ) : null}
                    {mentionedUsers.length > 0 ? (
                      <div className="share-mention-chips">
                        {mentionedUsers.map((user) => (
                          <button key={`mention-${user.userId}`} type="button" onClick={() => removeMentionedUser(user.userId)}>
                            @{shareUserName(user)}
                            <span aria-hidden="true">x</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {shareDestination === "chat" ? (
                      <p className="share-chat-target">
                        {chatRecipient ? `PulseChat will open a direct chat with ${shareUserName(chatRecipient)}.` : "Pick a user above to send this personally."}
                      </p>
                    ) : null}
                  </div>

                  {shareDestination === "chat" ? (
                    null
                  ) : (
                    <div className="share-field">
                      <span>Audience</span>
                      <div className={`share-select-wrap ${shareAudienceOpen ? "open" : ""}`} ref={shareAudienceRef}>
                        <AudienceIcon />
                        <button
                          type="button"
                          className="share-audience-button"
                          aria-haspopup="listbox"
                          aria-expanded={shareAudienceOpen}
                          onClick={() => setShareAudienceOpen((prev) => !prev)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setShareAudienceOpen(false);
                            }
                            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                              event.preventDefault();
                              setShareAudienceOpen(true);
                            }
                          }}
                        >
                          {selectedShareAudience.label}
                        </button>
                        {shareAudienceOpen ? (
                          <div className="share-audience-menu" role="listbox" aria-label="Share audience">
                            {SHARE_AUDIENCES.map((audience) => (
                              <button
                                key={audience.key}
                                type="button"
                                role="option"
                                aria-selected={shareAudience === audience.key}
                                className={shareAudience === audience.key ? "active" : ""}
                                onClick={() => {
                                  setShareAudience(audience.key);
                                  setShareAudienceOpen(false);
                                }}
                              >
                                <span>{audience.label}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className="share-option-row">
                    <label className={`share-check-option ${!canShareToStory ? "disabled" : ""}`}>
                      <span className="share-option-iconbox">
                        <StoryShareIcon />
                      </span>
                      <span>Also share to story</span>
                      <input
                        type="checkbox"
                        checked={shareAlsoStory}
                        onChange={(event) => setShareAlsoStory(event.target.checked)}
                        disabled={!canShareToStory || shareDestination === "story"}
                      />
                    </label>
                    <label className="share-check-option">
                      <span className="share-option-iconbox">
                        <BellIcon />
                      </span>
                      <span>Notify followers</span>
                      <input
                        type="checkbox"
                        checked={shareNotifyFollowers}
                        onChange={(event) => setShareNotifyFollowers(event.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {shareError ? <p className="share-panel-error">{shareError}</p> : null}

              <footer className="share-panel-footer">
                <button
                  type="button"
                  className="btn btn-secondary share-cancel-btn"
                  onClick={() => setShareComposerOpen(false)}
                  disabled={shareSubmitting}
                >
                  Cancel
                </button>
                <button className="btn btn-primary share-submit-btn" type="submit" disabled={shareSubmitting}>
                  <ChatShareIcon />
                  {shareSubmitting
                    ? "Sharing..."
                    : shareDestination === "story"
                      ? "Add to Story"
                      : shareDestination === "chat"
                        ? "Send to PulseChat"
                        : "Share Post"}
                </button>
              </footer>
            </form>
          </section>
        </div>,
        document.querySelector(".shell.shell-home-theme") || document.querySelector(".shell") || document.body
      ) : null}

      {editingOpen ? (
        <div className="feed-inline-edit-shell">
          <form className="grid-form" onSubmit={handleEditSubmit}>
            <textarea
              rows={3}
              value={editingContent}
              onChange={(event) => setEditingContent(event.target.value)}
              placeholder="Edit your post"
            />
            <label className="composer-file-label">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => setEditingFile(event.target.files?.[0] || null)}
              />
              <span>{editingFile ? editingFile.name : "Replace media (optional)"}</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={removeMedia}
                onChange={(event) => setRemoveMedia(event.target.checked)}
              />
              Remove current media
            </label>
            <div className="row-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingOpen(false)} disabled={savingEdit}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </article>
  );
}
