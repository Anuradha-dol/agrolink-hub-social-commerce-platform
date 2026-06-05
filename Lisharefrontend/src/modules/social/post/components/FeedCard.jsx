import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  { key: "public", label: "Public", icon: "🌐" },
  { key: "friends_followers", label: "Friends + followers", icon: "👥" },
  { key: "followers", label: "Followers", icon: "👤" },
  { key: "friends", label: "Friends", icon: "🤝" }
];
const AUDIENCE_OPTIONS = [
  { key: "public", value: "PUBLIC", label: "Public", hint: "Everyone can view", icon: "globe" },
  { key: "friends_followers", value: "FRIENDS_FOLLOWERS", label: "Friends + followers", hint: "Friends and followers", icon: "users" },
  { key: "friends", value: "FRIENDS", label: "Friends", hint: "Accepted friends only", icon: "handshake" },
  { key: "followers", value: "FOLLOWERS", label: "Followers", hint: "Followers only", icon: "user" }
];
const POST_CATEGORIES = [
  { value: "GENERAL", label: "General", xp: 1, icon: "fileText" },
  { value: "EDUCATION", label: "Education", xp: 5, icon: "graduationCap" },
  { value: "FUNNY", label: "Funny", xp: 2, icon: "laugh" },
  { value: "NEWS", label: "News", xp: 5, icon: "newspaper" },
  { value: "BUSINESS", label: "Business", xp: 3, icon: "briefcase" },
  { value: "LIFESTYLE", label: "Lifestyle", xp: 2, icon: "palette" },
  { value: "TECH", label: "Tech", xp: 2, icon: "laptop" },
  { value: "OTHER", label: "Other", xp: 2, icon: "sparkles" }
];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".avi"];

function isVideoAsset(url = "") {
  const normalized = String(url).toLowerCase().split("?")[0];
  return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function isGifAsset(url = "") {
  return String(url).toLowerCase().split("?")[0].endsWith(".gif");
}

function parseListValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map((item) => String(item || "").trim()).filter(Boolean) : [];
    } catch {
      return trimmed.slice(1, -1).split(",").map((item) => item.replace(/^"|"$/g, "").trim()).filter(Boolean);
    }
  }
  if (trimmed.includes("|")) {
    return trimmed.split("|").map((item) => item.trim()).filter(Boolean);
  }
  return [trimmed];
}

function normalizePollOptions(value) {
  return parseListValue(value).filter(Boolean);
}

function normalizePollVotes(value, optionCount) {
  const votes = Array.isArray(value) ? value : parseListValue(value);
  return Array.from({ length: optionCount }, (_, index) => Number(votes[index] || 0));
}

function normalizeViewerPollOption(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : null;
}

function normalizeViewerPollOptions(value, fallbackValue = null) {
  const source = Array.isArray(value) ? value : [];
  const normalized = source
    .map((item) => normalizeViewerPollOption(item))
    .filter((item) => item !== null);
  const fallback = normalizeViewerPollOption(fallbackValue);
  return [...new Set(fallback !== null && normalized.length === 0 ? [fallback] : normalized)].sort((a, b) => a - b);
}

function mediaTypeFromUrl(url = "") {
  if (isGifAsset(url)) return "GIF";
  if (isVideoAsset(url)) return "VIDEO";
  return "IMAGE";
}

function normalizeAudienceKey(value = "PUBLIC") {
  const normalized = String(value || "PUBLIC").trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "friends_and_followers" || normalized === "followers_friends") return "friends_followers";
  return ["public", "friends", "followers", "friends_followers"].includes(normalized) ? normalized : "public";
}

function audienceLabel(value = "PUBLIC") {
  const key = normalizeAudienceKey(value);
  return AUDIENCE_OPTIONS.find((option) => option.key === key)?.label || "Public";
}

function mediaFileKind(file) {
  if (!file) return "Media";
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  if (type === "image/gif" || name.endsWith(".gif")) return "GIF";
  if (type.startsWith("video")) return "Video";
  return "Photo";
}

function normalizeMediaItems(item) {
  const mediaUrls = parseListValue(item?.mediaUrls);
  const legacyUrl = firstNonEmptyString(item?.imageUrl, item?.originalImageUrl);
  const urls = mediaUrls.length ? mediaUrls : (legacyUrl ? [legacyUrl] : []);
  const mediaTypes = parseListValue(item?.mediaTypes);
  const fallbackType = String(item?.mediaType || item?.originalMediaType || "").toUpperCase();

  return urls.map((url, index) => ({
    url,
    type: (mediaTypes[index] || (urls.length === 1 && fallbackType !== "GALLERY" ? fallbackType : "") || mediaTypeFromUrl(url)).toUpperCase()
  }));
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

function LocationPinIcon({ className = "feed-meta-chip-icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6.4-5.5 6.4-11.2a6.4 6.4 0 0 0-12.8 0C5.6 15.5 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.2" />
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
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    handshake: (
      <>
        <path d="m11 17 2 2 1-1" />
        <path d="m18 14 2.5 2.5a3.3 3.3 0 0 1-4.7 4.7L11 16.5" />
        <path d="m8 14.5-4 4a3.3 3.3 0 0 0 4.7 4.7L11 21" />
        <path d="m14 11.5 2 2" />
        <path d="M20 11.5a3.3 3.3 0 0 0-4.7-4.7L10.5 11.5" />
        <path d="M14 6.8a3.3 3.3 0 0 0-4.7 4.7l4.7 4.7" />
        <path d="M8.5 13.2 4 8.7a3.3 3.3 0 0 1 4.7-4.7l4.3 4.3" />
      </>
    ),
    graduationCap: (
      <>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3.3 4.5 8.7 4.5 12 0v-5" />
      </>
    ),
    newspaper: (
      <>
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
      </>
    ),
    briefcase: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </>
    ),
    laugh: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </>
    ),
    palette: (
      <>
        <circle cx="13.5" cy="6.5" r=".5" />
        <circle cx="17.5" cy="10.5" r=".5" />
        <circle cx="8.5" cy="7.5" r=".5" />
        <circle cx="6.5" cy="12.5" r=".5" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.5 1.6-1.3 0-.4-.1-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6 0-5-4.5-9-10-9z" />
      </>
    ),
    laptop: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" />
        <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
      </>
    ),
    fileText: (
      <>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </>
    )
  };

  return (
    <svg 
      className="share-value-icon-svg" 
      viewBox="0 0 24 24" 
      aria-hidden="true"
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {paths[type] || paths.medium}
    </svg>
  );
}

function EditPostSelect({ label, value, options, open, onToggle, onClose, onChange, metaForOption, fallbackIcon = "fileText", className = "" }) {
  const dropdownRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];
  const selectedMeta = selected ? (metaForOption?.(selected) || selected.hint) : "";

  useEffect(() => {
    if (!open) return undefined;

    const closeFromOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        onClose();
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", closeFromOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeFromOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  return (
    <div className={`edit-post-select-field ${open ? "is-open" : ""} ${className}`.trim()} ref={dropdownRef}>
      <span className="edit-post-field-label">{label}</span>
      <div className="edit-post-select-wrap">
        <button
          type="button"
          className="edit-post-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${label}: ${selected?.label || "Select option"}`}
          onClick={onToggle}
        >
          <span className="edit-post-select-icon" aria-hidden="true">
            <PostValueIcon type={selected?.icon || fallbackIcon} />
          </span>
          <span className="edit-post-select-copy">
            <strong>{selected?.label || "Select option"}</strong>
            {selectedMeta ? <small>{selectedMeta}</small> : null}
          </span>
          <ChevronDownIcon />
        </button>

        {open ? (
          <div className="edit-post-select-menu" role="listbox" aria-label={label}>
            {options.map((option) => {
              const optionActive = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`edit-post-select-option ${optionActive ? "active" : ""}`.trim()}
                  role="option"
                  aria-selected={optionActive}
                  onClick={() => {
                    onChange(option.value);
                    onClose();
                  }}
                >
                  <span className="edit-post-select-option-icon" aria-hidden="true">
                    <PostValueIcon type={option.icon || fallbackIcon} />
                  </span>
                  <span className="edit-post-select-option-copy">
                    <strong>{option.label}</strong>
                    {option.hint ? <small>{option.hint}</small> : null}
                  </span>
                  {metaForOption ? <span className="edit-post-select-option-meta">{metaForOption(option)}</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EditReviewIcon({ type }) {
  const icons = {
    copy: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2.4" />
        <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.2" />
      </>
    ),
    audience: (
      <>
        <circle cx="12" cy="12" r="8.2" />
        <path d="M4.2 12h15.6M12 3.8c2 2 3 4.7 3 8.2s-1 6.2-3 8.2M12 3.8c-2 2-3 4.7-3 8.2s1 6.2 3 8.2" />
      </>
    ),
    media: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <circle cx="9" cy="10" r="1.4" />
        <path d="m7 17 4-4 2.3 2.3 1.9-1.9L20 17" />
      </>
    ),
    poll: (
      <>
        <path d="M6 19V11" />
        <path d="M12 19V5" />
        <path d="M18 19v-8" />
        <path d="M4 19.5h16" />
      </>
    )
  };

  return (
    <svg className="edit-review-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      {icons[type] || icons.copy}
    </svg>
  );
}

function EditActionIcon({ type }) {
  const icons = {
    cancel: (
      <>
        <path d="m7 7 10 10" />
        <path d="m17 7-10 10" />
      </>
    ),
    save: (
      <>
        <path d="m5 12 4 4 10-10" />
        <path d="M4 20h16" />
      </>
    )
  };

  return (
    <svg className="edit-action-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      {icons[type] || icons.save}
    </svg>
  );
}

function PollStatIcon({ type }) {
  const icons = {
    voters: (
      <>
        <circle cx="8.5" cy="8.2" r="2.8" />
        <circle cx="15.7" cy="9.4" r="2.3" />
        <path d="M3.8 18.7c.8-3.1 2.5-4.7 4.7-4.7s3.9 1.6 4.7 4.7" />
        <path d="M13.4 18.6c.5-2.2 1.7-3.4 3.4-3.4 1.5 0 2.7 1 3.4 3.4" />
      </>
    ),
    participation: (
      <>
        <path d="M5.5 18.5V12" />
        <path d="M10 18.5V8.5" />
        <path d="M14.5 18.5V5.5" />
        <path d="M19 18.5v-9" />
      </>
    ),
    result: (
      <>
        <path d="M12 4.5a7.5 7.5 0 1 1-7.5 7.5H12V4.5z" />
        <path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5H12V4.5z" />
      </>
    )
  };

  return (
    <svg className="feed-poll-stat-svg" viewBox="0 0 24 24" aria-hidden="true">
      {icons[type] || icons.result}
    </svg>
  );
}

function PollCheckIcon() {
  return (
    <svg className="feed-poll-check-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6.5 12.4 3.3 3.3 7.7-8.2" />
    </svg>
  );
}

function renderContentWithHashtags(content = "", onHashtagClick) {
  return String(content).split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g).map((part, index) => {
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
    if (part.startsWith("@")) {
      return <span key={`${part}-${index}`} className="feed-mention-pill">{part}</span>;
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

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function cardAuthorProfileImageUrl(item, isShare) {
  if (isShare) {
    return firstNonEmptyString(
      item?.sharedByProfileImageUrl,
      item?.sharedByProfilePic,
      item?.sharedByImageUrl,
      item?.sharerProfileImageUrl,
      item?.sharedBy?.profileImageUrl,
      item?.sharedBy?.imageUrl
    );
  }

  return firstNonEmptyString(
    item?.authorProfileImageUrl,
    item?.authorProfilePic,
    item?.authorImageUrl,
    item?.profileImageUrl,
    item?.userProfileImageUrl,
    item?.author?.profileImageUrl,
    item?.author?.imageUrl
  );
}

function shareUserName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Unknown user";
}

function mentionHandle(user) {
  const source = user?.username || user?.email?.split("@")[0] || shareUserName(user);
  return String(source || "member").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32) || "member";
}

function activeMentionQuery(value = "") {
  const match = String(value).match(/(^|\s)@([a-zA-Z0-9_]{1,40})$/);
  return match ? match[2] : "";
}

function replaceActiveMention(value = "", handle = "") {
  return String(value).replace(/(^|\s)@([a-zA-Z0-9_]{0,40})$/, (match, prefix) => `${prefix}@${handle} `);
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

function isEntityOnline(entity, currentUserId, ...idCandidates) {
  if (firstNumericId(currentUserId) && firstNumericId(...idCandidates) === firstNumericId(currentUserId)) {
    return true;
  }
  return Boolean(
    entity?.online ||
    entity?.isOnline ||
    entity?.authorOnline ||
    entity?.sharedByOnline ||
    entity?.userOnline ||
    entity?.presence === "ONLINE" ||
    entity?.author?.online ||
    entity?.author?.isOnline ||
    entity?.sharedBy?.online ||
    entity?.sharedBy?.isOnline ||
    entity?.user?.online ||
    entity?.user?.isOnline
  );
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
  return comments.reduce((total, comment) => total + 1 + countCommentThread(Array.isArray(comment.replies) ? comment.replies : []), 0);
}

function commentAuthorProfileImageUrl(comment) {
  return firstNonEmptyString(
    comment?.authorProfileImageUrl,
    comment?.profileImageUrl,
    comment?.authorImageUrl,
    comment?.userProfileImageUrl,
    comment?.author?.profileImageUrl,
    comment?.author?.imageUrl
  );
}

function commentMediaUrl(comment) {
  return firstNonEmptyString(comment?.mediaUrl, comment?.imageUrl, comment?.attachmentUrl);
}

function isCommentVideo(comment) {
  const mediaType = String(comment?.mediaType || "").toUpperCase();
  return mediaType === "VIDEO" || isVideoAsset(commentMediaUrl(comment));
}

function isCommentGif(comment) {
  const mediaType = String(comment?.mediaType || "").toUpperCase();
  return mediaType === "GIF" || isGifAsset(commentMediaUrl(comment));
}

function commentReactionCounts(comment) {
  return comment?.reactionCounts && typeof comment.reactionCounts === "object" ? comment.reactionCounts : {};
}

function countCommentReactions(comment) {
  const directCount = Number(comment?.reactionCount);
  if (Number.isFinite(directCount) && directCount > 0) return directCount;
  return Object.values(commentReactionCounts(comment)).reduce((total, value) => total + Number(value || 0), 0);
}

function commentSignalScore(comment) {
  const replies = Array.isArray(comment?.replies) ? comment.replies.length : Number(comment?.replyCount || 0);
  return countCommentReactions(comment) + replies;
}

function commentRelationship(comment) {
  return String(comment?.relationshipLabel || "Member").trim() || "Member";
}

function newestFirst(a, b) {
  return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
}

function relationshipMatches(comment, values = []) {
  const label = commentRelationship(comment).toLowerCase();
  return values.some((value) => label.includes(value));
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
  if (normalized === "EDUCATION" || normalized === "NEWS") return "blue";
  if (normalized === "BUSINESS" || normalized === "TECH") return "silver";
  if (normalized === "FUNNY" || normalized === "LIFESTYLE") return "rose";
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
  pollVoters = [],
  saved = false,
  currentUserId,
  currentUserName = "",
  currentUserProfileImageUrl = "",
  highlightCommentId = 0,
  highlightReplyId = 0,
  onComment,
  onUpdateComment,
  onDeleteComment,
  onReactComment,
  onReact,
  onVotePoll,
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
  onSearchMentionUsers,
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
  const [commentMediaFile, setCommentMediaFile] = useState(null);
  const [commentMediaAccept, setCommentMediaAccept] = useState("image/*,video/*,.gif");
  const [replyMediaDrafts, setReplyMediaDrafts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentActionBusy, setCommentActionBusy] = useState("");
  const [commentReactionBusy, setCommentReactionBusy] = useState("");
  const [openCommentReactionPickerId, setOpenCommentReactionPickerId] = useState(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
  const [deleteConfirmCommentId, setDeleteConfirmCommentId] = useState(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentTab, setCommentTab] = useState("all");
  const [shareComposerOpen, setShareComposerOpen] = useState(false);
  const [reactionUsersOpen, setReactionUsersOpen] = useState(false);
  const [reactionUserFilter, setReactionUserFilter] = useState("all");
  const [reactionUserSearch, setReactionUserSearch] = useState("");
  const [pollVotersOpen, setPollVotersOpen] = useState(false);
  const [pollVoterFilter, setPollVoterFilter] = useState("all");
  const [pollVoterSearch, setPollVoterSearch] = useState("");
  const [selectedReactionKey, setSelectedReactionKey] = useState("");
  const [editingOpen, setEditingOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(normalizeCategory(item.category));
  const normalizedItemPollOptions = normalizePollOptions(item.pollOptions);
  const [editingContent, setEditingContent] = useState(firstNonEmptyString(item.content, item.caption, item.postCaption, item.text));
  const [editingAudience, setEditingAudience] = useState(AUDIENCE_OPTIONS.find((option) => option.key === normalizeAudienceKey(item.audience || item.shareAudience))?.value || "PUBLIC");
  const [editDropdownOpen, setEditDropdownOpen] = useState("");
  const [editingFeeling, setEditingFeeling] = useState(item.feeling || "");
  const [editingLocation, setEditingLocation] = useState(item.locationName || "");
  const itemHasEditablePoll = Boolean(item.pollQuestion || normalizedItemPollOptions.some((option) => String(option || "").trim()));
  const [editingPollVisible, setEditingPollVisible] = useState(itemHasEditablePoll);
  const [editingPollQuestion, setEditingPollQuestion] = useState(item.pollQuestion || "");
  const [editingPollOptions, setEditingPollOptions] = useState(normalizedItemPollOptions.length ? normalizedItemPollOptions : ["", ""]);
  const [editingAllowMultipleVotes, setEditingAllowMultipleVotes] = useState(item.allowMultipleVotes || false);
  const [editingNotifyFollowers, setEditingNotifyFollowers] = useState(item.notifyFollowers !== false);
  const [editingFile, setEditingFile] = useState(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [mentionLookup, setMentionLookup] = useState({ key: "", items: [], loading: false });
  const [mediaFailed, setMediaFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [currentUserAvatarFailed, setCurrentUserAvatarFailed] = useState(false);

  const pickerRef = useRef(null);
  const menuRef = useRef(null);
  const shareAudienceRef = useRef(null);
  const shareCaptionRef = useRef(null);
  const commentInputRef = useRef(null);
  const editContentRef = useRef(null);
  const editFeelingRef = useRef(null);
  const editLocationRef = useRef(null);
  const commentMediaInputRef = useRef(null);
  const editMediaInputRef = useRef(null);
  const replyMediaInputRefs = useRef({});
  const isShare = item.type === "SHARE";
  const originalPostDeleted = Boolean(item.originalPostDeleted);
  const targetPostId = isShare ? item.originalPostId : item.postId;
  const validTargetPost = Number(targetPostId) > 0 && !originalPostDeleted;
  const mediaItems = originalPostDeleted ? [] : normalizeMediaItems(item);
  const feedGalleryPreviewItems = mediaItems.length > 5 ? mediaItems.slice(0, 5) : mediaItems;
  const feedGalleryHiddenCount = Math.max(0, mediaItems.length - feedGalleryPreviewItems.length);
  const primaryMediaItem = mediaItems[0] || null;
  const mediaUrl = primaryMediaItem ? toMediaUrl(primaryMediaItem.url) : "";
  const normalizedMediaType = String(primaryMediaItem?.type || item.mediaType || "").toUpperCase();
  const gifAsset = normalizedMediaType === "GIF" || isGifAsset(primaryMediaItem?.url || "");
  const videoAsset = normalizedMediaType === "VIDEO" || isVideoAsset(primaryMediaItem?.url || "");
  const hasVideoMedia = mediaItems.some((mediaItem) => mediaItem.type === "VIDEO" || isVideoAsset(mediaItem.url));
  const canEditPost = !isShare && isOwnedPost(item, currentUserId, currentUserName);
  const canDeletePost = canEditPost;
  const canDeleteShare = isShare && Number(item.sharedById) === Number(currentUserId);
  const canShareToStory = Boolean(validTargetPost && mediaUrl);
  const contentFallback = firstNonEmptyString(item.content, item.caption, item.postCaption, item.text);
  const hashtagFallback = Array.isArray(item.hashtags) ? item.hashtags.filter(Boolean).join(" ") : "";
  const displayContent = originalPostDeleted ? "" : String(contentFallback || hashtagFallback || "").trim();
  const pollOptions = normalizePollOptions(item.pollOptions);
  const pollVotes = normalizePollVotes(item.pollVotes, pollOptions.length);
  const pollTotalVotes = Number(item.pollTotalVotes ?? pollVotes.reduce((total, value) => total + Number(value || 0), 0));
  const viewerPollOptionIndex = normalizeViewerPollOption(item.viewerPollOptionIndex);
  const pollAllowsMultipleVotes = Boolean(item.allowMultipleVotes);
  const viewerPollOptionIndexes = normalizeViewerPollOptions(item.viewerPollOptionIndexes, viewerPollOptionIndex);
  const viewerPollSelectionSet = new Set(viewerPollOptionIndexes);
  const hasPoll = Boolean(!originalPostDeleted && item.pollQuestion && pollOptions.length >= 2);
  const sharePreviewTitle = displayContent || (gifAsset ? "Shared GIF" : videoAsset ? "Shared reel" : "Shared post");
  const sharePreviewType = gifAsset ? "GIF" : videoAsset ? "Reel" : "Post";

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
  const editingMediaPreviewItem = useMemo(
    () => (editingFile ? {
      file: editingFile,
      kind: mediaFileKind(editingFile),
      url: URL.createObjectURL(editingFile)
    } : null),
    [editingFile]
  );
  const editPollOptionCount = editingPollOptions.map((option) => String(option || "").trim()).filter(Boolean).length;
  const editMediaStatus = editingFile
    ? "1 selected"
    : removeMedia
      ? "Will remove"
      : mediaItems.length
        ? `${mediaItems.length} attached`
        : "Text only";
  const editCopyReady = Boolean(String(editingContent || "").trim());
  const editPollReady = !editingPollVisible || (Boolean(editingPollQuestion.trim()) && editPollOptionCount >= 2);
  const editPollStatus = editingPollVisible
    ? (editingPollQuestion.trim() ? `${editPollOptionCount}/2 options` : "Add question")
    : "Optional";
  const editReadinessItems = [
    { key: "copy", icon: "copy", label: "Copy", value: editCopyReady ? "Text ready" : "Text required", status: editCopyReady ? "Ready" : "Fix", active: editCopyReady },
    { key: "audience", icon: "audience", label: "Audience", value: audienceLabel(editingAudience), status: "Set", active: true },
    { key: "media", icon: "media", label: "Media", value: editMediaStatus, status: editingFile || removeMedia || mediaItems.length ? "Done" : "Optional", active: true },
    { key: "poll", icon: "poll", label: "Poll", value: editPollStatus, status: editPollReady ? (editingPollVisible ? "Ready" : "Off") : "Fix", active: editPollReady }
  ];
  const editReadyCount = editReadinessItems.filter((reviewItem) => reviewItem.active).length;
  const editReadyPercent = Math.round((editReadyCount / editReadinessItems.length) * 100);

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
  const currentAudienceLabel = audienceLabel(isShare ? item.shareAudience || item.audience : item.audience);
  const authorName = isShare ? item.sharedByName : item.authorName;
  const authorHandle = firstNonEmptyString(
    isShare ? item.sharedByUsername : item.authorUsername,
    item.username,
    item.author?.username,
    currentUserName
  ).replace(/^@/, "");
  const headTimestamp = item.sharedAt || item.createdAt;
  const visibleComments = comments.slice(0, 2);
  const totalCommentCount = countCommentThread(comments);
  const hiddenCommentCount = Math.max(0, totalCommentCount - countCommentThread(visibleComments));
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
  const realPollVoters = Array.isArray(pollVoters) ? pollVoters : [];
  const pollVoterCount = Math.max(realPollVoters.length, pollTotalVotes);
  const pollAvatarUsers = realPollVoters
    .filter((pollVoter) => Number(pollVoter?.userId) > 0 || pollVoter?.name || pollVoter?.profileImageUrl)
    .slice(0, 5);
  const pollHiddenVoterCount = Math.max(0, pollVoterCount - pollAvatarUsers.length);
  const leadingPollOptionIndex = pollVotes.reduce((bestIndex, votes, index) => (
    Number(votes || 0) > Number(pollVotes[bestIndex] || 0) ? index : bestIndex
  ), 0);
  const leadingPollPercent = pollTotalVotes > 0
    ? Math.round((Number(pollVotes[leadingPollOptionIndex] || 0) / pollTotalVotes) * 100)
    : 0;
  const viewerHasPollVote = viewerPollOptionIndexes.length > 0;
  const inlinePollVoterOptionIndex = viewerHasPollVote
    ? viewerPollOptionIndexes[0]
    : (pollTotalVotes > 0 ? leadingPollOptionIndex : null);
  const inlinePollVoters = Number.isInteger(inlinePollVoterOptionIndex)
    ? realPollVoters.filter((pollVoter) => Number(pollVoter?.optionIndex) === inlinePollVoterOptionIndex)
    : [];
  const inlinePollAvatarUsers = (inlinePollVoters.length ? inlinePollVoters : pollAvatarUsers).slice(0, 5);
  const inlinePollHiddenVoterCount = Math.max(
    0,
    Math.max(
      inlinePollVoters.length,
      Number.isInteger(inlinePollVoterOptionIndex) ? Number(pollVotes[inlinePollVoterOptionIndex] || 0) : 0,
      pollVoterCount
    ) - inlinePollAvatarUsers.length
  );
  const showInlinePollVoterBand = pollVoterCount > 0 && Number.isInteger(inlinePollVoterOptionIndex);
  const authorUserId = isShare
    ? firstNumericId(item.sharedById, item.sharedBy?.userId, item.sharedBy?.id)
    : firstNumericId(item.authorId, item.userId, item.author?.userId, item.author?.id, itemAuthorId(item));
  const authorOnline = isEntityOnline(item, currentUserId, authorUserId);
  const authorProfileImageUrl = cardAuthorProfileImageUrl(item, isShare);
  const authorAvatarUrl = !avatarFailed && authorProfileImageUrl ? toMediaUrl(authorProfileImageUrl) : "";
  const currentUserAvatarUrl = !currentUserAvatarFailed && currentUserProfileImageUrl ? toMediaUrl(currentUserProfileImageUrl) : "";
  const postReactionFilterOptions = useMemo(
    () => REACTIONS.map((reaction) => ({
      ...reaction,
      count: Number(reactions?.[reaction.key] || 0)
    })).filter((reaction) => reaction.count > 0),
    [reactions]
  );
  const filteredReactionUsers = useMemo(() => {
    const query = reactionUserSearch.trim().toLowerCase();
    return realReactionUsers.filter((reactionUser) => {
      const matchesType = reactionUserFilter === "all" || String(reactionUser?.type || "").toLowerCase() === reactionUserFilter;
      const searchable = `${reactionUser?.name || ""} ${reactionUser?.email || ""}`.toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      return matchesType && matchesSearch;
    });
  }, [realReactionUsers, reactionUserFilter, reactionUserSearch]);
  const pollVoterFilterOptions = useMemo(
    () => pollOptions.map((option, index) => {
      const realCount = realPollVoters.filter((pollVoter) => Number(pollVoter?.optionIndex) === index).length;
      return {
        index,
        option,
        count: realCount || Number(pollVotes[index] || 0)
      };
    }),
    [pollOptions, pollVotes, realPollVoters]
  );
  const filteredPollVoters = useMemo(() => {
    const query = pollVoterSearch.trim().toLowerCase();
    const optionIndex = pollVoterFilter === "all"
      ? null
      : Number(String(pollVoterFilter).replace("option-", ""));
    return realPollVoters.filter((pollVoter) => {
      const matchesOption = optionIndex === null || Number(pollVoter?.optionIndex) === optionIndex;
      const optionText = firstNonEmptyString(pollVoter?.optionText, pollOptions[Number(pollVoter?.optionIndex)] || "");
      const searchable = `${pollVoter?.name || ""} ${pollVoter?.username || ""} ${pollVoter?.email || ""} ${optionText}`.toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      return matchesOption && matchesSearch;
    });
  }, [pollOptions, pollVoterFilter, pollVoterSearch, realPollVoters]);
  const commentSections = useMemo(() => {
    const baseComments = [...comments];
    const topComments = [...baseComments]
      .filter((comment) => commentSignalScore(comment) > 0)
      .sort((a, b) => commentSignalScore(b) - commentSignalScore(a) || newestFirst(a, b));
    const latestComments = [...baseComments].sort(newestFirst);
    const olderComments = [...baseComments].sort((a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime());
    const followingComments = latestComments.filter((comment) => relationshipMatches(comment, ["following", "mutual"]));
    const followerComments = latestComments.filter((comment) => relationshipMatches(comment, ["follower"]));
    const friendComments = latestComments.filter((comment) => relationshipMatches(comment, ["friend"]));

    if (commentTab === "all") {
      return [{ key: "all", title: "All comments", emptyText: "No comments yet.", items: latestComments }];
    }
    if (commentTab === "top") {
      return [{ key: "top", title: "Most reacted and replied", items: topComments.length ? topComments : latestComments }];
    }
    if (commentTab === "latest") {
      return [{ key: "latest", title: "Latest comments", items: latestComments }];
    }
    if (commentTab === "older") {
      return [{ key: "older", title: "Older comments", items: olderComments }];
    }
    if (commentTab === "other") {
      const usedCommentIds = new Set();
      followingComments.forEach((comment) => usedCommentIds.add(Number(comment.commentId)));
      followerComments.forEach((comment) => usedCommentIds.add(Number(comment.commentId)));
      friendComments.forEach((comment) => usedCommentIds.add(Number(comment.commentId)));
      const otherMembers = latestComments.filter((comment) => !usedCommentIds.has(Number(comment.commentId)));

      return [
        { key: "following", title: "Following", emptyText: "No comments from people you follow yet.", items: followingComments },
        { key: "followers", title: "Followers", emptyText: "No follower comments yet.", items: followerComments },
        { key: "friends", title: "Friends", emptyText: "No friend comments yet.", items: friendComments },
        { key: "members", title: "Other members", emptyText: "No other member comments yet.", items: otherMembers }
      ];
    }

    return [{ key: "all", title: "All comments", emptyText: "No comments yet.", items: latestComments }];
  }, [commentTab, comments]);

  useEffect(() => () => {
    if (editingMediaPreviewItem?.url) URL.revokeObjectURL(editingMediaPreviewItem.url);
  }, [editingMediaPreviewItem]);

  useEffect(() => {
    setEditingContent(firstNonEmptyString(item.content, item.caption, item.postCaption, item.text));
    setEditingFeeling(item.feeling || "");
    setEditingLocation(item.locationName || "");
    setEditingPollVisible(itemHasEditablePoll);
    setEditingPollQuestion(item.pollQuestion || "");
    setEditingPollOptions(normalizedItemPollOptions.length ? normalizedItemPollOptions : ["", ""]);
    setEditingAllowMultipleVotes(Boolean(item.allowMultipleVotes));
    setEditingFile(null);
    setEditingCategory(normalizeCategory(item.category));
    setEditingAudience(AUDIENCE_OPTIONS.find((option) => option.key === normalizeAudienceKey(item.audience || item.shareAudience))?.value || "PUBLIC");
    setEditDropdownOpen("");
    setRemoveMedia(false);
    setEditingOpen(false);
    setOpenReplyId(null);
    setReplyDrafts({});
    setCommentMediaFile(null);
    setReplyMediaDrafts({});
    setEditingCommentId(null);
    setEditingCommentText("");
    setCommentActionBusy("");
    setCommentReactionBusy("");
    setOpenCommentReactionPickerId(null);
    setOpenCommentMenuId(null);
    setDeleteConfirmCommentId(null);
    setCommentsModalOpen(false);
    setCommentTab("all");
    setReactionUserFilter("all");
    setReactionUserSearch("");
    setMediaFailed(false);
  }, [item.postId, item.content, item.caption, item.postCaption, item.text, item.imageUrl, item.mediaUrls, item.feeling, item.locationName, item.audience, item.shareAudience, item.category, item.pollQuestion, item.pollOptions, item.allowMultipleVotes, itemHasEditablePoll]);

  useEffect(() => {
    if (!editingOpen) {
      setEditDropdownOpen("");
    }
  }, [editingOpen]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [authorProfileImageUrl, item.postId, item.shareId]);

  useEffect(() => {
    setCurrentUserAvatarFailed(false);
  }, [currentUserProfileImageUrl, currentUserId]);

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
    if ((!shareComposerOpen && !commentsModalOpen) || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shareComposerOpen, commentsModalOpen]);

  useEffect(() => {
    if (shareComposerOpen) {
      setShareAudience("public");
    }
    setShareAudienceOpen(false);
  }, [shareComposerOpen]);

  useEffect(() => {
    const targetId = Number(highlightReplyId || highlightCommentId || 0);
    if (!targetId || !validTargetPost) return;
    const threadContainsTarget = (items = []) => items.some((comment) => {
      if (Number(comment?.commentId) === targetId) return true;
      return threadContainsTarget(Array.isArray(comment?.replies) ? comment.replies : []);
    });
    if (!threadContainsTarget(comments)) return;
    setCommentsModalOpen(true);
    setCommentTab("all");
    window.setTimeout(() => {
      const targetElement = document.getElementById(`comment-${targetId}`);
      targetElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement?.classList.add("comment-target-highlight");
      window.setTimeout(() => targetElement?.classList.remove("comment-target-highlight"), 2800);
    }, 260);
  }, [comments, highlightCommentId, highlightReplyId, validTargetPost]);

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
      if (event.target instanceof Element && !event.target.closest(".comment-reaction-wrap")) {
        setOpenCommentReactionPickerId(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  const lookupMentions = (key, value) => {
    const query = activeMentionQuery(value);
    if (!query || !onSearchMentionUsers) {
      setMentionLookup((previous) => previous.key === key ? { key: "", items: [], loading: false } : previous);
      return;
    }

    setMentionLookup({ key, items: [], loading: true });
    window.clearTimeout(lookupMentions.timeoutId);
    lookupMentions.timeoutId = window.setTimeout(() => {
      onSearchMentionUsers(query)
        .then((users) => setMentionLookup({ key, items: Array.isArray(users) ? users.slice(0, 6) : [], loading: false }))
        .catch(() => setMentionLookup({ key, items: [], loading: false }));
    }, 180);
  };

  const renderMentionLookup = (key, onPick) => {
    if (mentionLookup.key !== key || (!mentionLookup.loading && mentionLookup.items.length === 0)) return null;
    return (
      <div className="comment-mention-menu">
        {mentionLookup.loading ? <p>Finding people...</p> : null}
        {mentionLookup.items.map((mentionUser) => (
          <button
            key={`mention-${key}-${mentionUser.userId || mentionUser.email}`}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(mentionUser);
              setMentionLookup({ key: "", items: [], loading: false });
            }}
          >
            <span className={`comment-mention-avatar ${mentionUser.profileImageUrl || mentionUser.imageUrl ? "has-image" : ""}`}>
              {mentionUser.profileImageUrl || mentionUser.imageUrl ? (
                <img src={toMediaUrl(mentionUser.profileImageUrl || mentionUser.imageUrl)} alt="" />
              ) : (
                initialFromName(shareUserName(mentionUser))
              )}
            </span>
            <span>
              <strong>@{mentionHandle(mentionUser)}</strong>
              <small>{shareUserName(mentionUser)}</small>
            </span>
          </button>
        ))}
      </div>
    );
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!validTargetPost || (!commentText.trim() && !commentMediaFile)) return;
    await onComment(targetPostId, commentText, null, commentMediaFile);
    setCommentText("");
    setCommentMediaFile(null);
    setCommentComposerOpen(true);
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
    setCommentsModalOpen(true);
  };

  const updateReplyDraft = (commentId, value) => {
    setReplyDrafts((prev) => ({ ...prev, [commentId]: value }));
  };

  const updateReplyMediaDraft = (commentId, file) => {
    setReplyMediaDrafts((prev) => ({ ...prev, [commentId]: file || null }));
  };

  const submitReply = async (event, comment) => {
    event.preventDefault();
    const commentId = Number(comment?.commentId || 0);
    const draft = replyDrafts[commentId] || "";
    const mediaFile = replyMediaDrafts[commentId] || null;
    if (!validTargetPost || !commentId || (!draft.trim() && !mediaFile)) return;
    await onComment(targetPostId, draft, commentId, mediaFile);
    setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
    setReplyMediaDrafts((prev) => ({ ...prev, [commentId]: null }));
    setOpenReplyId(null);
    setCommentsModalOpen(true);
  };

  const beginEditComment = (comment) => {
    const commentId = Number(comment?.commentId || 0);
    if (!commentId) return;
    setEditingCommentId(commentId);
    setEditingCommentText(String(comment?.content || ""));
    setOpenReplyId(null);
    setOpenCommentMenuId(null);
    setDeleteConfirmCommentId(null);
    setCommentsModalOpen(true);
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
          postValue: sharePostValue,
          audience: shareAudience
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

  const insertEditText = (text) => {
    const input = editContentRef.current;
    if (!input) {
      setEditingContent((prev) => `${prev}${text}`);
      return;
    }
    const currentValue = String(editingContent || "");
    const start = input.selectionStart ?? currentValue.length;
    const end = input.selectionEnd ?? currentValue.length;
    const next = `${currentValue.slice(0, start)}${text}${currentValue.slice(end)}`;
    setEditingContent(next);
    lookupMentions("edit-post", next);
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

  const clearEditingMediaFile = () => {
    setEditingFile(null);
    if (editMediaInputRef.current) editMediaInputRef.current.value = "";
  };

  const handleReact = async (reactionKey) => {
    if (!validTargetPost) return;
    await onReact(targetPostId, reactionKey);
    setSelectedReactionKey((prev) => (prev === reactionKey ? "" : reactionKey));
    setPickerOpen(false);
  };

  const handleCommentReaction = async (comment, reactionKey = "like") => {
    const commentId = Number(comment?.commentId || 0);
    if (!validTargetPost || !commentId || !onReactComment) return;
    setCommentReactionBusy(`${commentId}-${reactionKey}`);
    try {
      await onReactComment(targetPostId, commentId, reactionKey);
      setOpenCommentReactionPickerId(null);
    } finally {
      setCommentReactionBusy("");
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!onEdit || !canEditPost) return;
    setSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append("content", editingContent ?? "");
      formData.append("category", editingCategory || "GENERAL");
      formData.append("audience", editingAudience || "PUBLIC");
      formData.append("feeling", editingFeeling || "");
      formData.append("locationName", editingLocation || "");
    const cleanEditPollOptions = editingPollOptions.map((option) => String(option || "").trim()).filter(Boolean);
    if (editingPollVisible && editingPollQuestion.trim() && cleanEditPollOptions.length >= 2) {
      formData.append("pollQuestion", editingPollQuestion.trim());
      formData.append("pollOptions", JSON.stringify(cleanEditPollOptions));
      formData.append("allowMultipleVotes", editingAllowMultipleVotes ? "true" : "false");
      formData.append("notifyFollowers", editingNotifyFollowers ? "true" : "false");
    } else {
        formData.append("pollQuestion", "");
        formData.append("pollOptions", "[]");
      }
    if (editingFile) {
      formData.append("image", editingFile);
    }
      if (removeMedia) formData.append("removeMedia", "true");
      await onEdit(item.postId, formData);
      setEditingOpen(false);
      clearEditingMediaFile();
      setRemoveMedia(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const renderPollDisplay = () => {
    if (!hasPoll) return null;
    return (
      <section className="feed-poll-card-container premium-feed-poll-card" aria-label="Post poll">
        <header className="feed-poll-header-new">
          <div className="feed-poll-tag-wrap">
            <span className="feed-poll-tag premium">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              POLL
            </span>
          </div>
            <div className="feed-poll-main-info">
              <h2 className="feed-poll-question-text">{item.pollQuestion}</h2>
              <div className="feed-poll-meta-row">
                <span className="feed-poll-vote-count">{pollTotalVotes} {pollTotalVotes === 1 ? "vote" : "votes"}</span>
                <span className="feed-poll-dot">-</span>
                <span className="feed-poll-instruction">
                  {viewerHasPollVote
                    ? (pollAllowsMultipleVotes ? `${viewerPollOptionIndexes.length} ${viewerPollOptionIndexes.length === 1 ? "choice" : "choices"} saved` : "Your vote is saved")
                    : pollAllowsMultipleVotes
                      ? "Select one or more options" 
                      : "Choose one option"}
                </span>
              </div>
            </div>
          <div className="feed-poll-status-wrap">
            <span className="feed-poll-ended-badge feed-poll-live-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7 12h3l2-5 2 10 2-5h3"/></svg>
              {viewerHasPollVote ? (pollAllowsMultipleVotes ? "Multi vote" : "Voted") : onVotePoll ? "Live" : "Results"}
            </span>
          </div>
        </header>

        <div className="feed-poll-options-grid-new">
          {pollOptions.map((option, index) => {
            const votes = Number(pollVotes[index] || 0);
            const percent = pollTotalVotes > 0 ? Math.round((votes / pollTotalVotes) * 100) : 0;
            const selected = viewerPollSelectionSet.has(index);
            
            const isLeading = index === leadingPollOptionIndex && pollTotalVotes > 0;
            const showVotersRow = isLeading && pollTotalVotes > 0;
            const isEmphasized = isLeading || selected;
            const optionVoteLabel = selected
              ? (pollAllowsMultipleVotes ? "Selected by you" : "Your choice")
              : isLeading
                ? "Leading option"
                : `${votes} ${votes === 1 ? "vote" : "votes"}`;

            return (
              <div 
                key={`poll-new-${targetPostId}-${index}`} 
                className={`feed-poll-option-block ${isEmphasized ? "is-selected" : ""} ${selected ? "is-viewer-choice" : ""} ${isLeading ? "is-leading" : ""}`.trim()}
                role={onVotePoll ? "button" : undefined}
                tabIndex={onVotePoll ? 0 : -1}
                aria-label={`Vote for ${option}. ${votes} ${votes === 1 ? "vote" : "votes"}, ${percent} percent.`}
                onClick={(event) => {
                  if (event.target?.closest?.("button")) return;
                  onVotePoll?.(targetPostId, index);
                }}
                onKeyDown={(event) => {
                  if (!onVotePoll || event.target?.closest?.("button")) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onVotePoll(targetPostId, index);
                  }
                }}
                style={{ cursor: onVotePoll ? "pointer" : "default" }}
              >
                <div className="feed-poll-option-top-row">
                   <div className={`feed-poll-option-letter ${index % 2 === 0 ? "alt-1" : "alt-2"}`}>
                     {String.fromCharCode(65 + index)}
                   </div>
                   <div className="feed-poll-option-content">
                      <span className="feed-poll-option-name">{option}</span>
                      <span className="feed-poll-option-vote-stat">{optionVoteLabel}</span>
                   </div>
                   <div className="feed-poll-option-progress-container">
                     <div 
                        className={`feed-poll-option-progress-bar ${index % 2 === 0 ? "primary" : "secondary"} ${!isEmphasized && pollTotalVotes > 0 ? "not-filled" : ""}`} 
                        style={{ width: `${percent}%` }} 
                     />
                   </div>
                   <div className="feed-poll-option-right">
                     <div className="feed-poll-option-percent-box">
                       <strong>{percent}%</strong>
                       <small>{votes} {votes === 1 ? "vote" : "votes"}</small>
                     </div>
                     {isEmphasized && (
                       <div className="feed-poll-option-check-circle">
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                       </div>
                     )}
                   </div>
                </div>

                {showVotersRow && (
                  <div className="feed-poll-voters-row-new">
                    <div className="feed-poll-voters-label">VOTERS</div>
                    <div className="feed-poll-voters-avatars">
                      {pollAvatarUsers.map((voter, i) => (
                        <div key={i} className="feed-poll-voter-avatar-circle" title={voter.name || voter.username}>
                          {voter.profileImageUrl ? (
                            <img src={toMediaUrl(voter.profileImageUrl)} alt="" />
                          ) : (
                            <span>{initialFromName(voter.name || voter.username || "U")}</span>
                          )}
                          <div className="voter-tooltip-new">{voter.name || voter.username}</div>
                        </div>
                      ))}
                      {pollHiddenVoterCount > 0 && (
                        <div className="feed-poll-voter-avatar-circle more">
                          +{pollHiddenVoterCount}
                        </div>
                      )}
                    </div>
                    <div className="feed-poll-voters-summary">
                      <strong>{pollTotalVotes} {pollTotalVotes === 1 ? "person" : "people"}</strong>
                      <span>See who voted and their choice</span>
                    </div>
                    <button 
                      className="feed-poll-view-voters-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPollVotersOpen(true);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      View voters
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="feed-poll-stats-footer">
          <div className="feed-poll-stat-item">
            <div className="feed-poll-stat-icon green"><PollStatIcon type="voters" /></div>
            <div className="feed-poll-stat-info">
              <small>Total votes</small>
              <strong>{pollTotalVotes}</strong>
            </div>
          </div>
          <div className="feed-poll-stat-item">
            <div className="feed-poll-stat-icon blue"><PollStatIcon type="participation" /></div>
            <div className="feed-poll-stat-info">
              <small>Top result</small>
              <strong>{leadingPollPercent}%</strong>
              <small className="sub">{pollTotalVotes > 0 ? pollOptions[leadingPollOptionIndex] : "No votes yet"}</small>
            </div>
          </div>
          <div className="feed-poll-stat-item">
            <div className="feed-poll-stat-icon light-blue"><PollStatIcon type="result" /></div>
            <div className="feed-poll-stat-info">
              <small>Choices</small>
              <strong>{pollOptions.length}</strong>
              <small className="sub">
                {viewerHasPollVote
                  ? (pollAllowsMultipleVotes ? `${viewerPollOptionIndexes.length} selected` : "You voted")
                  : (pollAllowsMultipleVotes ? "Multi-select" : "Open voting")}
              </small>
            </div>
          </div>
          <div className="feed-poll-stat-item graph-item">
             <div className="feed-poll-stat-info">
               <small>Result overview</small>
               <div className="feed-poll-mini-graph">
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M0,25 Q10,25 20,22 T40,24 T60,20 T80,26 T100,10" fill="none" stroke={`url(#pollGraphGradient-${targetPostId})`} strokeWidth="2" />
                    <defs>
                      <linearGradient id={`pollGraphGradient-${targetPostId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#19c37d" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#0f8bd6" />
                      </linearGradient>
                    </defs>
                  </svg>
                   <div className="graph-dot" style={{ left: `${Math.max(8, Math.min(96, leadingPollPercent || 8))}%`, top: "10px" }} />
               </div>
             </div>
          </div>
        </footer>
      </section>
    );
  };


  const renderCommentAvatar = (comment, compact = false) => {
    const name = commentAuthorName(comment);
    const profileImageUrl = commentAuthorProfileImageUrl(comment);
    const authorId = Number(comment?.authorId || 0);
    const avatarContent = profileImageUrl ? (
      <img src={toMediaUrl(profileImageUrl)} alt="" />
    ) : (
      initialFromName(name)
    );

    if (authorId && onAuthorClick) {
      return (
        <button
          type="button"
          className={`comment-author-avatar ${compact ? "compact" : ""} ${profileImageUrl ? "has-image" : ""}`.trim()}
          onClick={() => onAuthorClick(authorId)}
          aria-label={`Open ${name} profile`}
        >
          {avatarContent}
        </button>
      );
    }

    return (
      <span className={`comment-author-avatar ${compact ? "compact" : ""} ${profileImageUrl ? "has-image" : ""}`.trim()}>
        {avatarContent}
      </span>
    );
  };

  const renderCommentMedia = (comment) => {
    const media = commentMediaUrl(comment);
    if (!media) return null;
    const src = toMediaUrl(media);
    const commentVideo = isCommentVideo(comment);
    const commentGif = isCommentGif(comment);
    return (
      <div className={`comment-media-card ${commentVideo ? "video" : "image"} ${commentGif ? "gif" : ""}`.trim()}>
        {commentVideo ? (
          <video src={src} controls preload="metadata" />
        ) : (
          <img src={src} alt={commentGif ? "Animated GIF comment attachment" : "Comment attachment"} />
        )}
        {commentGif ? <span className="comment-gif-badge">GIF</span> : null}
      </div>
    );
  };

  const renderCommentReactionSummary = (comment) => {
    const total = countCommentReactions(comment);
    if (!total) return null;
    const summary = Object.entries(commentReactionCounts(comment))
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 2);

    return (
      <span className="comment-reaction-summary">
        <span className="comment-reaction-bubbles" aria-hidden="true">
          {summary.map(([reactionKey]) => (
            <i key={`${comment.commentId}-${reactionKey}`} className={`feed-reaction-bubble ${reactionKey}`}>
              <ReactionIcon type={reactionKey} />
            </i>
          ))}
        </span>
        {total}
      </span>
    );
  };

  const renderReplyForm = (comment, mention) => {
    const commentId = Number(comment?.commentId || 0);
    const replyDraft = replyDrafts[commentId] || "";
    const replyMediaFile = replyMediaDrafts[commentId] || null;
    if (!commentId) return null;

    return (
      <form className="comment-reply-form premium-comment-reply-form" onSubmit={(event) => submitReply(event, comment)}>
        <span className={`comment-author-avatar compact ${currentUserAvatarUrl ? "has-image" : ""}`.trim()}>
          {currentUserAvatarUrl ? (
            <img src={currentUserAvatarUrl} alt="" onError={() => setCurrentUserAvatarFailed(true)} />
          ) : (
            initialFromName(currentUserName || authorName)
          )}
        </span>
        <div className="comment-reply-input-wrap">
          <input
            value={replyDraft}
            onChange={(event) => {
              updateReplyDraft(commentId, event.target.value);
              lookupMentions(`reply-${commentId}`, event.target.value);
            }}
            placeholder={`Reply to ${mention}`}
            autoFocus
          />
          {renderMentionLookup(`reply-${commentId}`, (mentionUser) => {
            updateReplyDraft(commentId, replaceActiveMention(replyDraft, mentionHandle(mentionUser)));
          })}
          {replyMediaFile ? (
            <span className="comment-media-chip">
              {mediaFileKind(replyMediaFile)} attached
              <button type="button" onClick={() => updateReplyMediaDraft(commentId, null)} aria-label="Remove reply media">
                x
              </button>
            </span>
          ) : null}
        </div>
        <span className="comment-reply-tools">
          <input
            hidden
            ref={(node) => {
              if (node) replyMediaInputRefs.current[commentId] = node;
            }}
            type="file"
            accept="image/*,video/*,.gif"
            onChange={(event) => updateReplyMediaDraft(commentId, event.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="feed-tool-button"
            onClick={() => replyMediaInputRefs.current[commentId]?.click()}
            aria-label="Attach reply photo or video"
            disabled={!validTargetPost}
          >
            <ImageIcon />
          </button>
          <button
            type="button"
            className="feed-tool-button gif-tool-button"
            onClick={() => replyMediaInputRefs.current[commentId]?.click()}
            aria-label="Attach reply GIF"
            disabled={!validTargetPost}
          >
            <GifIcon />
          </button>
          <button className="btn btn-primary" type="submit" disabled={!replyDraft.trim() && !replyMediaFile}>
            Reply
          </button>
        </span>
      </form>
    );
  };

  const renderCommentItem = (comment, options = {}) => {
    const { isReply = false, rootMention = "", showReplies = true, modal = false, depth = 0 } = options;
    const commentId = Number(comment.commentId || 0);
    const name = commentAuthorName(comment);
    const mention = mentionFromName(name);
    const replies = Array.isArray(comment.replies) ? comment.replies : [];
    const isEditingComment = editingCommentId === commentId;
    const content = String(comment.content || "");
    const hasRootMention = rootMention && content.toLowerCase().startsWith(rootMention.toLowerCase());
    const relationshipLabel = commentRelationship(comment);
    const activeReaction = comment?.viewerReaction ? reactionByKey(comment.viewerReaction) : null;
    const reactionBusy = commentReactionBusy.startsWith(`${commentId}-`);

    return (
      <article
        id={commentId ? `comment-${commentId}` : undefined}
        className={`comment-thread-item ${isReply ? "is-reply" : ""} ${modal ? "modal-comment-item" : ""} comment-depth-${Math.min(depth, 4)}`.trim()}
        role="listitem"
        key={comment.commentId}
      >
        <div className="comment-bubble-row">
          {renderCommentAvatar(comment, isReply)}
          <div className="comment-bubble">
            <header className="comment-bubble-header">
              <span className="comment-author-meta">
                <strong>{name}</strong>
                {relationshipLabel ? <em>{relationshipLabel}</em> : null}
                {comment.createdAt ? <time>{formatCommentTime(comment.createdAt)}</time> : null}
              </span>
              {renderCommentMenu(comment, isReply ? "Reply options" : "Comment options")}
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
            ) : content ? (
              <p>
                {isReply && rootMention && !hasRootMention ? <><span className="comment-root-mention">{rootMention}</span>{" "}</> : null}
                {renderContentWithHashtags(content, onHashtagClick)}
              </p>
            ) : null}
            {renderCommentMedia(comment)}
          </div>
        </div>

        <div className="comment-actions">
          <span className="comment-reaction-wrap">
            <button
              type="button"
              className={`comment-react-link ${activeReaction ? `active ${activeReaction.key}` : ""}`.trim()}
              onClick={() => setOpenCommentReactionPickerId((currentId) => (currentId === commentId ? null : commentId))}
              disabled={!validTargetPost || !onReactComment || reactionBusy}
              aria-haspopup="menu"
              aria-expanded={openCommentReactionPickerId === commentId}
            >
              <ReactionIcon type={activeReaction?.key || "like"} />
              {activeReaction ? activeReaction.label : "React"}
            </button>
            {openCommentReactionPickerId === commentId ? (
              <span className="comment-reaction-popover" role="menu" aria-label="Choose comment reaction">
                {REACTIONS.map((reaction) => (
                  <button
                    key={`${commentId}-${reaction.key}`}
                    type="button"
                    className={`comment-reaction-choice ${activeReaction?.key === reaction.key ? "active" : ""}`.trim()}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleCommentReaction(comment, reaction.key);
                    }}
                    disabled={commentReactionBusy === `${commentId}-${reaction.key}`}
                    title={reaction.label}
                  >
                    <ReactionIcon type={reaction.key} />
                    <span>{reaction.label}</span>
                  </button>
                ))}
              </span>
            ) : null}
          </span>
          {renderCommentReactionSummary(comment)}
          <button type="button" className="comment-reply-link" onClick={() => openReplyComposer(comment)}>
            Reply to {mention}
          </button>
          {replies.length > 0 ? <span>{replies.length} {replies.length === 1 ? "reply" : "replies"}</span> : null}
        </div>

        {openReplyId === commentId ? renderReplyForm(comment, mention) : null}

        {showReplies && replies.length > 0 ? (
          <div className="comment-replies" role="list" aria-label={`Replies to ${name}`}>
            {replies.map((reply) => renderCommentItem(reply, {
              isReply: true,
              rootMention: mention,
              showReplies: true,
              modal,
              depth: depth + 1
            }))}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <article className="card feed-card premium-feed-card" id={validTargetPost ? `feed-item-${targetPostId}` : undefined}>
      <header className="feed-card-header premium-feed-card-header">
        <div className="feed-card-author-wrap">
          <button
            type="button"
            className={`feed-avatar-badge feed-author-button ${authorAvatarUrl ? "has-image" : ""}`}
            onClick={() => {
              const profileUserId = isShare ? item.sharedById : item.authorId;
              if (profileUserId) onAuthorClick?.(profileUserId);
            }}
          >
            {authorAvatarUrl ? (
              <img src={authorAvatarUrl} alt="" onError={() => setAvatarFailed(true)} />
            ) : (
              (authorName || "U").slice(0, 1).toUpperCase()
            )}
            <span className={`feed-avatar-online ${authorOnline ? "online" : "offline"}`} aria-hidden="true" />
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
              <span className="feed-audience-label">{currentAudienceLabel}</span>
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
                    setEditingAudience(AUDIENCE_OPTIONS.find((option) => option.key === normalizeAudienceKey(item.audience || item.shareAudience))?.value || "PUBLIC");
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

      {(item.feeling || item.locationName) && !originalPostDeleted ? (
        <div className="feed-post-meta-chips">
          {item.feeling ? <span>Feeling {item.feeling}</span> : null}
          {item.locationName ? (
            <span className="feed-location-chip">
              <LocationPinIcon />
              {item.locationName}
            </span>
          ) : null}
        </div>
      ) : null}

      {renderPollDisplay()}

      {mediaItems.length > 1 ? (
        <div className={`feed-media-gallery gallery-count-${Math.min(mediaItems.length, 5)} ${mediaItems.length > 5 ? "gallery-count-many" : ""}`.trim()}>
          <span className="feed-gallery-count-badge">{mediaItems.length} media</span>
          {feedGalleryPreviewItems.map((mediaItem, index) => {
            const galleryUrl = toMediaUrl(mediaItem.url);
            const galleryVideo = mediaItem.type === "VIDEO" || isVideoAsset(mediaItem.url);
            const galleryGif = mediaItem.type === "GIF" || isGifAsset(mediaItem.url);
            return (
              <div className={`feed-gallery-tile ${galleryVideo ? "video" : ""} ${galleryGif ? "gif" : ""}`.trim()} key={`${mediaItem.url}-${index}`}>
                {galleryVideo ? (
                  <video
                    src={galleryUrl}
                    controls
                    preload="metadata"
                    onPlay={() => {
                      if (validTargetPost && onReelView) onReelView(targetPostId);
                    }}
                  />
                ) : (
                  <img src={galleryUrl} alt={galleryGif ? "Animated GIF post" : "Post media"} />
                )}
                {galleryVideo ? <span className="feed-gallery-badge">Video</span> : null}
                {galleryGif ? <span className="feed-gallery-badge">GIF</span> : null}
                {index === feedGalleryPreviewItems.length - 1 && feedGalleryHiddenCount > 0 ? (
                  <span className="feed-gallery-more">
                    <strong>+{feedGalleryHiddenCount}</strong>
                    <small>more</small>
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : mediaUrl ? (
        <div className={`feed-media-shell ${gifAsset ? "gif-media-shell" : ""}`.trim()}>
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
            <img className={`feed-image ${gifAsset ? "feed-gif-image" : ""}`.trim()} src={mediaUrl} alt={gifAsset ? "Animated GIF post" : "Post"} onError={() => setMediaFailed(true)} />
          )}
          {gifAsset ? <span className="feed-gif-badge">GIF</span> : null}
        </div>
      ) : null}

      {hasVideoMedia ? (
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
            setCommentsModalOpen(true);
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
              <button
                type="button"
                className={reactionUserFilter === "all" ? "active" : ""}
                onClick={() => setReactionUserFilter("all")}
              >
                All <strong>{totalReactions}</strong>
              </button>
              {postReactionFilterOptions.map((reaction) => (
                <button
                  key={`filter-${reaction.key}`}
                  type="button"
                  className={reactionUserFilter === reaction.key ? "active" : ""}
                  onClick={() => setReactionUserFilter(reaction.key)}
                >
                  <ReactionIcon type={reaction.key} />
                  {reaction.label}
                  <strong>{reaction.count}</strong>
                </button>
              ))}
            </div>
            <label className="reaction-users-search">
              <SearchIcon />
              <input
                value={reactionUserSearch}
                onChange={(event) => setReactionUserSearch(event.target.value)}
                placeholder="Search people..."
              />
            </label>
            {filteredReactionUsers.length ? (
              <div className="reaction-users-list">
                {filteredReactionUsers.map((reactionUser, index) => {
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
                      <button
                        type="button"
                        className="reaction-user-view-btn"
                        onClick={() => {
                          if (reactionUserId) {
                            setReactionUsersOpen(false);
                            onAuthorClick?.(reactionUserId);
                          }
                        }}
                        disabled={!reactionUserId}
                      >
                        View profile
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="reaction-users-empty">No people found for this reaction filter.</p>
            )}
          </section>
        </div>,
        document.querySelector(".shell.shell-home-theme") || document.querySelector(".shell") || document.body
      ) : null}

      {pollVotersOpen ? createPortal(
        <div className="reaction-users-overlay poll-voters-overlay" onMouseDown={() => setPollVotersOpen(false)}>
          <section className="reaction-users-card reaction-users-modal-card poll-voters-modal-card" onMouseDown={(event) => event.stopPropagation()}>
            <header className="reaction-users-head poll-voters-head">
              <div>
                <span className="reaction-users-head-icon poll-voters-head-icon" aria-hidden="true">
                  {pollAvatarUsers.length ? (
                    pollAvatarUsers.slice(0, 3).map((pollVoter, index) => (
                      <span
                        key={`poll-head-voter-${pollVoter.voteId || pollVoter.userId || index}`}
                        className={`poll-voters-head-avatar ${pollVoter.profileImageUrl ? "has-image" : ""}`.trim()}
                      >
                        {pollVoter.profileImageUrl ? (
                          <img src={toMediaUrl(pollVoter.profileImageUrl)} alt="" />
                        ) : (
                          initialFromName(pollVoter.name || pollVoter.username || pollVoter.email)
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="poll-voters-head-avatar">?</span>
                  )}
                </span>
                <h3>Poll vote details</h3>
                <p>{pollVoterCount} {pollVoterCount === 1 ? "person" : "people"} voted. See each voter and the option they selected.</p>
              </div>
              <button type="button" className="share-panel-close" onClick={() => setPollVotersOpen(false)} aria-label="Close poll voters">
                <ShareCloseIcon />
              </button>
            </header>
            <div className="reaction-users-filter-row poll-voters-filter-row" aria-label="Poll voter options">
              <button
                type="button"
                className={pollVoterFilter === "all" ? "active" : ""}
                onClick={() => setPollVoterFilter("all")}
              >
                All <strong>{pollVoterCount}</strong>
              </button>
              {pollVoterFilterOptions.map((pollOption) => (
                <button
                  key={`poll-voter-filter-${targetPostId}-${pollOption.index}`}
                  type="button"
                  className={pollVoterFilter === `option-${pollOption.index}` ? "active" : ""}
                  onClick={() => setPollVoterFilter(`option-${pollOption.index}`)}
                >
                  <span className="poll-voter-option-letter">{String.fromCharCode(65 + pollOption.index)}</span>
                  {pollOption.option}
                  <strong>{pollOption.count}</strong>
                </button>
              ))}
            </div>
            <label className="reaction-users-search poll-voters-search">
              <SearchIcon />
              <input
                value={pollVoterSearch}
                onChange={(event) => setPollVoterSearch(event.target.value)}
                placeholder="Search voters or choices..."
              />
            </label>
            {filteredPollVoters.length ? (
              <div className="reaction-users-list poll-voters-list">
                {filteredPollVoters.map((pollVoter, index) => {
                  const pollVoterId = Number(pollVoter.userId || 0);
                  const optionIndex = Number(pollVoter.optionIndex);
                  const optionText = firstNonEmptyString(pollVoter.optionText, pollOptions[optionIndex] || "Unknown option");
                  const voterHandle = pollVoter.username ? `@${String(pollVoter.username).replace(/^@/, "")}` : pollVoter.email || "AgroLink member";
                  return (
                    <article key={`${pollVoter.voteId || pollVoter.userId || pollVoter.name}-${index}`} className="reaction-user-row poll-voter-row">
                      <button
                        type="button"
                        className="reaction-user-profile poll-voter-profile"
                        onClick={() => {
                          if (pollVoterId) {
                            setPollVotersOpen(false);
                            onAuthorClick?.(pollVoterId);
                          }
                        }}
                        disabled={!pollVoterId}
                      >
                        <span className="reaction-user-avatar poll-voter-avatar">
                          {pollVoter.profileImageUrl ? (
                            <img src={toMediaUrl(pollVoter.profileImageUrl)} alt="" />
                          ) : (
                            initialFromName(pollVoter.name || pollVoter.username || pollVoter.email)
                          )}
                          <i>{String.fromCharCode(65 + (Number.isInteger(optionIndex) && optionIndex >= 0 ? optionIndex : 0))}</i>
                        </span>
                        <span>
                          <strong>{pollVoter.name || pollVoter.username || "Unknown user"}</strong>
                          <small>{voterHandle}</small>
                          <small>{pollVoter.votedAt ? `Voted ${formatCommentTime(pollVoter.votedAt)}` : "Voted in this poll"}</small>
                        </span>
                      </button>
                      <span className="poll-voter-choice-chip" title={`Selected option ${String.fromCharCode(65 + (Number.isInteger(optionIndex) && optionIndex >= 0 ? optionIndex : 0))}: ${optionText}`}>
                        <b>Choice {String.fromCharCode(65 + (Number.isInteger(optionIndex) && optionIndex >= 0 ? optionIndex : 0))}</b>
                        <span>{optionText}</span>
                      </span>
                      <button
                        type="button"
                        className="poll-voter-profile-btn"
                        onClick={() => {
                          if (pollVoterId) {
                            setPollVotersOpen(false);
                            onAuthorClick?.(pollVoterId);
                          }
                        }}
                        disabled={!pollVoterId}
                      >
                        View profile
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="reaction-users-empty poll-voters-empty">
                {realPollVoters.length ? "No voters found for this filter." : "Voter details are not available yet for this poll."}
              </p>
            )}
          </section>
        </div>,
        document.querySelector(".shell.shell-home-theme") || document.querySelector(".shell") || document.body
      ) : null}

      {validTargetPost || comments.length > 0 ? (
        <div className="feed-thread-shell">
          <form onSubmit={submitComment} className="inline-form feed-inline-form premium-inline-form comment-publisher-form">
            <span className={`feed-comment-avatar ${currentUserAvatarUrl ? "has-image" : ""}`.trim()}>
              {currentUserAvatarUrl ? (
                <img src={currentUserAvatarUrl} alt="" onError={() => setCurrentUserAvatarFailed(true)} />
              ) : (
                initialFromName(currentUserName || authorName)
              )}
              <span className="feed-avatar-online online" aria-hidden="true" />
            </span>
            <div className="comment-publisher-input-wrap">
              <input
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  lookupMentions("comment", e.target.value);
                }}
                placeholder="Write a comment..."
                disabled={!validTargetPost}
              />
              {renderMentionLookup("comment", (mentionUser) => {
                setCommentText((previous) => replaceActiveMention(previous, mentionHandle(mentionUser)));
              })}
              {commentMediaFile ? (
                <span className="comment-media-chip">
                  {mediaFileKind(commentMediaFile)} attached
                  <button type="button" onClick={() => setCommentMediaFile(null)} aria-label="Remove comment media">
                    x
                  </button>
                </span>
              ) : null}
            </div>
            <span className="feed-comment-tools">
              <input
                hidden
                ref={commentMediaInputRef}
                type="file"
                accept={commentMediaAccept}
                onChange={(event) => setCommentMediaFile(event.target.files?.[0] || null)}
              />
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
                onClick={() => {
                  setCommentMediaAccept("image/*,video/*,.gif");
                  window.setTimeout(() => commentMediaInputRef.current?.click(), 0);
                }}
                aria-label="Add photo or video"
                disabled={!validTargetPost}
              >
                <ImageIcon />
              </button>
              <button
                type="button"
                className="feed-tool-button gif-tool-button"
                onClick={() => {
                  setCommentMediaAccept("image/gif,.gif");
                  window.setTimeout(() => commentMediaInputRef.current?.click(), 0);
                }}
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
            <button className="btn btn-primary feed-comment-submit" type="submit" disabled={!validTargetPost || (!commentText.trim() && !commentMediaFile)}>
              Send
            </button>
          </form>

          {comments.length > 0 ? (
            <div className="comment-list premium-comment-list comment-preview-list" role="list">
              <div className="thread-summary-row comment-preview-summary">
                <span>{totalCommentCount} {totalCommentCount === 1 ? "comment" : "comments"}</span>
                {hiddenCommentCount > 0 ? (
                  <button type="button" onClick={() => setCommentsModalOpen(true)}>
                    +{hiddenCommentCount} {hiddenCommentCount === 1 ? "comment" : "comments"}
                  </button>
                ) : totalCommentCount > 0 ? (
                  <button type="button" onClick={() => setCommentsModalOpen(true)}>
                    View all
                  </button>
                ) : null}
              </div>

              {visibleComments.map((comment) => renderCommentItem(comment, { showReplies: false }))}
            </div>
          ) : null}
        </div>
      ) : null}

      {commentsModalOpen && typeof document !== "undefined" ? createPortal(
        <div className="comments-modal-overlay" onMouseDown={() => setCommentsModalOpen(false)}>
          <section className="comments-modal-card" onMouseDown={(event) => event.stopPropagation()} aria-label="All comments">
            <header className="comments-modal-head">
              <div>
                <span className="comments-modal-kicker">Post discussion</span>
                <h3>All Comments ({totalCommentCount})</h3>
                <p>Top reactions, friends, followers, and the rest of the thread in one place.</p>
              </div>
              <button type="button" className="share-panel-close" onClick={() => setCommentsModalOpen(false)} aria-label="Close comments">
                <ShareCloseIcon />
              </button>
            </header>

            <div className="comments-modal-tabs" role="tablist" aria-label="Comment filters">
              {[
                ["all", "All"],
                ["top", "Top"],
                ["latest", "Latest"],
                ["older", "Older"],
                ["other", "Other"]
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={commentTab === key ? "active" : ""}
                  onClick={() => setCommentTab(key)}
                  role="tab"
                  aria-selected={commentTab === key}
                >
                  {label}
                  {key === "all" ? <strong>{totalCommentCount}</strong> : null}
                </button>
              ))}
            </div>

            <div className="comments-modal-scroll">
              {commentSections.length ? (
                commentSections.map((section) => (
                  <section className="comments-section-block" key={section.key}>
                    <div className="comments-section-title">
                      <span>{section.title}</span>
                      <strong>{section.items.length}</strong>
                    </div>
                  <div className="comments-section-list" role="list">
                    {section.items.length ? (
                      section.items.map((comment) => renderCommentItem(comment, { showReplies: true, modal: true }))
                    ) : (
                      <p className="comments-section-empty">{section.emptyText || "No comments in this section yet."}</p>
                    )}
                  </div>
                  </section>
                ))
              ) : (
                <p className="comments-modal-empty">No comments found for this filter.</p>
              )}
            </div>
          </section>
        </div>,
        document.querySelector(".shell.shell-home-theme") || document.querySelector(".shell") || document.body
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

      {editingOpen ? createPortal(
        <div className="feed-inline-edit-shell premium-edit-post-shell">
          <form className={`grid-form edit-post-modal-card ${editingPollVisible ? "has-edit-poll" : ""}`.trim()} onSubmit={handleEditSubmit}>
            <header className="edit-post-modal-head">
              <div className="edit-post-title-icon premium-icon-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div className="edit-post-title-copy">
                <h4>Edit post</h4>
                <p>Update your text, media, feeling, location, and poll details.</p>
              </div>
              <button type="button" className="edit-post-close-btn" onClick={() => setEditingOpen(false)} aria-label="Close edit post">
                <ShareCloseIcon />
              </button>
            </header>

            <section className="edit-post-author-panel">
              <span className={`edit-post-avatar ${authorAvatarUrl ? "has-image" : ""}`.trim()}>
                {authorAvatarUrl ? (
                  <img src={authorAvatarUrl} alt="" onError={() => setAvatarFailed(true)} />
                ) : (
                  initialFromName(authorName || currentUserName)
                )}
                <span className={`edit-post-avatar-presence ${authorOnline ? "online" : "offline"}`} aria-hidden="true" />
              </span>
              <div className="edit-post-author-info">
                <strong>{authorName || "Creator"}</strong>
                <p>
                  {authorHandle ? `@${authorHandle} - ` : ""}
                  Editing this post before updating the feed
                </p>
              </div>
              <div className="edit-post-author-status">
                <span>{currentAudienceLabel}</span>
                <span>{postCategoryLabel}</span>
              </div>
            </section>

            <div className="edit-post-scroll-area">
              <div className="edit-post-workspace">
                <main className="edit-post-main-panel">
                  <div className="edit-post-panel-heading">
                    <span>Post details</span>
                    <strong>Refine the content before publishing the update.</strong>
                  </div>

                  <div className="edit-post-textarea-container">
                    <textarea
                      ref={editContentRef}
                      className="edit-post-textarea"
                      rows={5}
                      value={editingContent}
                      maxLength={500}
                      onChange={(event) => {
                        setEditingContent(event.target.value);
                        lookupMentions("edit-post", event.target.value);
                      }}
                      placeholder="Write a clear update for your audience..."
                    />
                    {renderMentionLookup("edit-post", (mentionUser) => {
                      setEditingContent((previous) => replaceActiveMention(previous, mentionHandle(mentionUser)));
                      window.requestAnimationFrame(() => editContentRef.current?.focus());
                    })}
                    <small className="edit-post-char-count">{String(editingContent || "").length} / 500</small>
                  </div>

                  <div className="edit-post-tool-row-v2" aria-label="Edit post quick tools">
                    <button type="button" className="edit-post-tool-btn" onClick={() => insertEditText("#")}>
                      <span className="tool-icon">#</span>
                      Hashtags
                    </button>
                    <button type="button" className="edit-post-tool-btn" onClick={() => insertEditText("@")}>
                      <AtIcon className="tool-icon" />
                      Mention
                    </button>
                    <button type="button" className="edit-post-tool-btn" onClick={() => editFeelingRef.current?.focus()}>
                      <SmileIcon className="tool-icon" />
                      Feeling
                    </button>
                    <button type="button" className="edit-post-tool-btn" onClick={() => editLocationRef.current?.focus()}>
                      <LocationPinIcon className="tool-icon" />
                      Location
                    </button>
                    <button
                      type="button"
                      className={`edit-post-tool-btn ${editingPollVisible ? "active" : ""}`}
                      aria-pressed={editingPollVisible}
                      onClick={() => {
                        setEditingPollVisible((previous) => !previous);
                        setEditingPollOptions((previous) => (Array.isArray(previous) && previous.length >= 2 ? previous : ["", ""]));
                      }}
                    >
                      <PostValueIcon type="medium" />
                      Poll
                    </button>
                  </div>

                  <div className="edit-post-category-row">
                    <EditPostSelect
                      label="Category"
                      value={editingCategory}
                      options={POST_CATEGORIES}
                      open={editDropdownOpen === "category"}
                      onToggle={() => setEditDropdownOpen((previous) => previous === "category" ? "" : "category")}
                      onClose={() => setEditDropdownOpen("")}
                      onChange={setEditingCategory}
                      metaForOption={(option) => `${option.xp} XP`}
                      fallbackIcon="fileText"
                    />
                    <EditPostSelect
                      label="Audience"
                      value={editingAudience}
                      options={AUDIENCE_OPTIONS}
                      open={editDropdownOpen === "audience-primary"}
                      onToggle={() => setEditDropdownOpen((previous) => previous === "audience-primary" ? "" : "audience-primary")}
                      onClose={() => setEditDropdownOpen("")}
                      onChange={setEditingAudience}
                      fallbackIcon="globe"
                    />
                  </div>

                  <div className="edit-post-meta-grid">
                    <div className="edit-post-field-v2">
                      <span className="edit-post-field-label">Feeling</span>
                      <div className="edit-post-input-shell-v2">
                        <SmileIcon />
                        <input
                          ref={editFeelingRef}
                          value={editingFeeling}
                          onChange={(event) => setEditingFeeling(event.target.value)}
                          placeholder="Happy, Loved, Motivated..."
                        />
                        <ChevronDownIcon />
                      </div>
                    </div>
                    <div className="edit-post-field-v2">
                      <span className="edit-post-field-label">Location</span>
                      <div className="edit-post-input-shell-v2">
                        <LocationPinIcon className="edit-post-location-icon" />
                        <input
                          ref={editLocationRef}
                          value={editingLocation}
                          onChange={(event) => setEditingLocation(event.target.value)}
                          placeholder="City or place"
                        />
                      </div>
                    </div>
                    <EditPostSelect
                      label="Audience"
                      value={editingAudience}
                      options={AUDIENCE_OPTIONS}
                      open={editDropdownOpen === "audience-meta"}
                      onToggle={() => setEditDropdownOpen((previous) => previous === "audience-meta" ? "" : "audience-meta")}
                      onClose={() => setEditDropdownOpen("")}
                      onChange={setEditingAudience}
                      fallbackIcon="globe"
                      className="edit-post-audience-field-v2 edit-post-meta-select-field"
                    />
                  </div>

                  {editingPollVisible ? (
                    <section className="composer-poll-container edit-mode-poll">
                      <header className="composer-poll-header">
                        <div className="composer-poll-header-icon-wrap">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </div>
                        <div className="composer-poll-header-info">
                          <h3>Poll settings</h3>
                          <p>Edit the question and choices that appear in the feed.</p>
                        </div>
                        <button
                          type="button"
                          className="edit-post-remove-poll-btn"
                          onClick={() => setEditingPollVisible(false)}
                        >
                          Remove poll
                        </button>
                      </header>

                      <div className="composer-poll-main-card">
                        <div className="composer-poll-field-group">
                          <div className="composer-poll-field-label">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#1687ff'}}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <span>Poll question</span>
                          </div>
                          <div className="composer-poll-input-wrap">
                            <input
                              type="text"
                              value={editingPollQuestion}
                              onChange={(event) => setEditingPollQuestion(event.target.value)}
                              placeholder="Ask a clear question..."
                            />
                          </div>
                        </div>

                        <div className="composer-poll-options-list">
                          {editingPollOptions.map((option, index) => (
                            <div key={`edit-poll-${index}`} className="composer-poll-option-row">
                              <div className="composer-poll-option-drag">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/></svg>
                              </div>
                              <div className="composer-poll-option-input-wrap">
                                <input
                                  value={option}
                                  onChange={(event) => {
                                    const next = [...editingPollOptions];
                                    next[index] = event.target.value;
                                    setEditingPollOptions(next);
                                  }}
                                  placeholder={`Option ${index + 1}`}
                                />
                              </div>
                              {editingPollOptions.length > 2 && !itemHasEditablePoll ? (
                                <button
                                  type="button"
                                  className="composer-poll-option-remove"
                                  onClick={() => setEditingPollOptions((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                              ) : null}
                            </div>
                          ))}
                        </div>

                        {!itemHasEditablePoll && editingPollOptions.length < 8 ? (
                          <button type="button" className="edit-post-add-option-btn" onClick={() => setEditingPollOptions((previous) => [...previous, ""])}>
                            <span>+ Add another option</span>
                          </button>
                        ) : null}
                      </div>

                      <div className="composer-poll-settings">
                        <div className="composer-poll-setting-item">
                          <div className="composer-poll-setting-icon-wrap">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </div>
                          <div className="composer-poll-setting-info">
                            <strong>Allow multiple votes</strong>
                            <p>People can select more than one option</p>
                          </div>
                          <div className="composer-poll-setting-action">
                            <label className="composer-poll-switch">
                              <input
                                type="checkbox"
                                checked={editingAllowMultipleVotes}
                                onChange={(e) => setEditingAllowMultipleVotes(e.target.checked)}
                              />
                              <span className="composer-poll-slider" />
                            </label>
                          </div>
                        </div>

                        <div className="composer-poll-setting-divider" />

                        <div className="composer-poll-setting-item">
                          <div className="composer-poll-setting-icon-wrap secondary">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                          </div>
                          <div className="composer-poll-setting-info">
                            <strong>Notify friends & followers</strong>
                            <p>Share this poll update with your connections</p>
                          </div>
                          <div className="composer-poll-setting-action">
                            <label className="composer-poll-switch">
                              <input
                                type="checkbox"
                                checked={editingNotifyFollowers}
                                onChange={(e) => setEditingNotifyFollowers(e.target.checked)}
                              />
                              <span className="composer-poll-slider" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <section className="edit-post-media-section edit-post-media-manager single-media-manager">
                    <div className="edit-post-section-head">
                      <span>Media</span>
                      <strong>Replace with one polished asset</strong>
                    </div>
                    <label className="composer-file-label v2">
                      <input
                        ref={editMediaInputRef}
                        type="file"
                        accept="image/*,video/*,.gif"
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] || null;
                          setEditingFile(nextFile);
                          if (nextFile) setRemoveMedia(false);
                        }}
                      />
                      <div className="edit-post-upload-icon-wrap">
                        <ImageIcon />
                      </div>
                      <div className="edit-post-upload-info">
                        <strong>{editingFile ? editingFile.name : "Replace media"}</strong>
                        <p>Choose one image, video, or GIF. The selected file will replace the current post media.</p>
                      </div>
                      <div className="edit-post-upload-arrow">
                        <ChatShareIcon />
                      </div>
                    </label>

                    {editingMediaPreviewItem ? (
                      <div className="edit-post-selected-media-grid single visible-preview">
                        <figure style={{ 
                          width: '100%', 
                          maxWidth: '500px', 
                          margin: '1.5rem auto',
                          padding: '1rem',
                          background: 'rgba(0,0,0,0.03)',
                          borderRadius: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          {String(editingMediaPreviewItem.file.type || "").startsWith("video") ? (
                            <video 
                              src={editingMediaPreviewItem.url} 
                              controls
                              muted 
                              playsInline 
                              preload="metadata" 
                              style={{ 
                                width: '100%', 
                                borderRadius: '12px', 
                                border: '4px solid var(--accent-color, #00d2ff)', 
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                maxHeight: '400px',
                                objectFit: 'contain'
                              }} 
                            />
                          ) : (
                            <img 
                              src={editingMediaPreviewItem.url} 
                              alt={editingMediaPreviewItem.file.name || "Selected media"} 
                              style={{ 
                                width: '100%', 
                                borderRadius: '12px', 
                                border: '4px solid var(--accent-color, #00d2ff)', 
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                maxHeight: '400px',
                                objectFit: 'contain'
                              }} 
                            />
                          )}
                          <figcaption style={{ 
                            padding: '1rem 0', 
                            width: '100%',
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1rem' }}>
                              New: {editingMediaPreviewItem.kind}
                            </span>
                            <button
                              type="button"
                              className="remove-preview-btn"
                              onClick={clearEditingMediaFile}
                              aria-label={`Remove ${editingMediaPreviewItem.file.name}`}
                              style={{ 
                                padding: '6px 16px', 
                                borderRadius: '20px', 
                                backgroundColor: '#ff4d4f', 
                                color: 'white', 
                                border: 'none', 
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              Remove
                            </button>
                          </figcaption>
                        </figure>
                      </div>
                    ) : null}

                    <label className={`edit-post-remove-media-checkbox ${!mediaItems.length || editingFile ? "disabled" : ""}`.trim()}>
                      <input
                        type="checkbox"
                        checked={removeMedia}
                        disabled={!mediaItems.length || Boolean(editingFile)}
                        onChange={(event) => {
                          setRemoveMedia(event.target.checked);
                          if (event.target.checked) clearEditingMediaFile();
                        }}
                      />
                      <span>Remove current media</span>
                    </label>
                  </section>
                </main>

                <aside className="edit-post-side-panel" aria-label="Edit post review">
                  <section className="edit-post-review-card">
                    <div className="edit-post-section-head">
                      <span>Review</span>
                      <strong>Publish checklist</strong>
                    </div>
                    <div className="edit-post-review-summary">
                      <div>
                        <strong>{editReadyCount}/{editReadinessItems.length}</strong>
                        <span>ready</span>
                      </div>
                      <div className="edit-post-review-meter" aria-hidden="true">
                        <span style={{ width: `${editReadyPercent}%` }} />
                      </div>
                    </div>
                    <div className="edit-post-review-list">
                      {editReadinessItems.map((reviewItem) => (
                        <div key={reviewItem.label} className={`edit-post-review-item ${reviewItem.active ? "active" : ""}`.trim()}>
                          <span className="edit-post-review-icon">
                            <EditReviewIcon type={reviewItem.icon} />
                          </span>
                          <span className="edit-post-review-copy">
                            <small>{reviewItem.label}</small>
                            <strong>{reviewItem.value}</strong>
                          </span>
                          <span className="edit-post-review-badge">{reviewItem.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="edit-post-current-media-card">
                    <div className="edit-post-section-head">
                      <span>Media</span>
                      <strong>Current post assets</strong>
                    </div>
                    {mediaItems.length ? (
                      <div className={`edit-post-current-media-grid count-${Math.min(mediaItems.length, 4)} visible-current-media`}>
                        {mediaItems.slice(0, 4).map((mediaItem, index) => {
                          const previewUrl = toMediaUrl(mediaItem.url);
                          const previewIsVideo = String(mediaItem.type || "").toUpperCase() === "VIDEO" || isVideoAsset(mediaItem.url);
                          return (
                            <figure key={`edit-current-media-${mediaItem.url}-${index}`} style={{ 
                              width: '100%', 
                              marginBottom: '1.5rem',
                              borderBottom: '1px solid rgba(0,0,0,0.05)',
                              paddingBottom: '1rem'
                            }}>
                              {previewIsVideo ? (
                                <video 
                                  src={previewUrl} 
                                  controls
                                  muted 
                                  playsInline 
                                  preload="metadata" 
                                  style={{ 
                                    width: '100%', 
                                    borderRadius: '12px', 
                                    border: '2px solid #eee',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                  }} 
                                />
                              ) : (
                                <img 
                                  src={previewUrl} 
                                  alt="Current post media" 
                                  style={{ 
                                    width: '100%', 
                                    borderRadius: '12px', 
                                    border: '2px solid #eee',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                  }} 
                                />
                              )}
                              <figcaption style={{ 
                                textAlign: 'center', 
                                fontSize: '0.9rem', 
                                marginTop: '8px',
                                color: 'var(--text-secondary)',
                                fontWeight: '500'
                              }}>
                                Current {mediaItem.type || "Media"}
                              </figcaption>
                            </figure>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="edit-post-empty-media">
                        <ImageIcon />
                        <span>No media attached</span>
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            </div>
            <footer className="edit-post-modal-footer">
              <button type="button" className="edit-post-cancel-btn" onClick={() => setEditingOpen(false)} disabled={savingEdit}>
                <EditActionIcon type="cancel" />
                Cancel
              </button>
              <button type="submit" className="edit-post-save-btn premium-gradient-btn" disabled={savingEdit}>
                <EditActionIcon type="save" />
                {savingEdit ? "Saving..." : "Update Post"}
              </button>
            </footer>
          </form>
        </div>,
        document.querySelector(".shell.shell-home-theme") || document.querySelector(".shell") || document.body
      ) : null}
    </article>
  );
}
