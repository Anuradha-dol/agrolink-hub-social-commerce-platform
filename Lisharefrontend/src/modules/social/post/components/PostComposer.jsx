import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "/src/modules/platform/app/store";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

function ComposerToolIcon({ name }) {
  const icons = {
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="M8 11.5 11 9l5 5M8 16h8" />
        <circle cx="8.2" cy="8.2" r="1.2" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="5" width="13" height="14" rx="2" />
        <path d="m16 10 5-3v10l-5-3z" />
      </>
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9 10h.1M15 10h.1M8.8 14.5c1.8 1.7 4.6 1.7 6.4 0" />
      </>
    ),
    chart: (
      <>
        <path d="M5 19V9M12 19V5M19 19v-7" />
        <path d="M3.5 19.5h17" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s6-5.3 6-11a6 6 0 0 0-12 0c0 5.7 6 11 6 11z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    liveFeed: (
      <>
        <circle cx="5" cy="12" r="2" />
        <path d="M2 12c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10" />
        <path d="M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1.4" />
        <circle cx="12" cy="12" r="1.4" />
        <circle cx="19" cy="12" r="1.4" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    drag: (
      <>
        <circle cx="9" cy="5" r="1" />
        <circle cx="9" cy="12" r="1" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="5" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="15" cy="19" r="1" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    chat: (
      <>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </>
    ),
    chevronRight: (
      <>
        <polyline points="9 18 15 12 9 6" />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    refresh: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
    <svg className="composer-inline-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.image}
    </svg>
  );
}

const QUICK_EMOJIS = ["\u{1F642}", "\u{1F44F}", "\u{1F4A1}", "\u{1F4DA}", "\u{1F680}", "\u{1F4AF}"];
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
const AUDIENCE_OPTIONS = [
  { value: "PUBLIC", label: "Public", hint: "Everyone can see it", icon: "globe" },
  { value: "FRIENDS_FOLLOWERS", label: "Friends + followers", hint: "Accepted friends and followers", icon: "users" },
  { value: "FRIENDS", label: "Friends", hint: "Accepted friends only", icon: "handshake" },
  { value: "FOLLOWERS", label: "Followers", hint: "Followers only", icon: "user" }
];

function displayUserName(user) {
  return `${user?.firstName || user?.firstname || ""} ${user?.lastName || user?.lastname || ""}`.trim()
    || user?.name
    || user?.email
    || "Member";
}

function mentionHandle(user) {
  const source = user?.username || user?.email?.split("@")[0] || displayUserName(user);
  return String(source || "member").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32) || "member";
}

function activeMentionQuery(value = "") {
  const match = String(value).match(/(^|\s)@([a-zA-Z0-9_]{1,40})$/);
  return match ? match[2] : "";
}

function replaceActiveMention(value = "", handle = "") {
  return String(value).replace(/(^|\s)@([a-zA-Z0-9_]{0,40})$/, (match, prefix) => `${prefix}@${handle} `);
}

function ComposerToolButton({ label, icon, active = false, onClick }) {
  return (
    <button type="button" className={`composer-tool-button ${active ? "active" : ""}`} aria-label={label} title={label} onClick={onClick}>
      {icon === "gif" ? <span className="composer-tool-gif">GIF</span> : <ComposerToolIcon name={icon} />}
      <span className="composer-tool-label">{label}</span>
    </button>
  );
}

export default function PostComposer({ onSubmit, submitting, onSearchMentionUsers }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("PUBLIC");
  const [fileAccept, setFileAccept] = useState("image/*,video/*,.gif");
  const [activeTool, setActiveTool] = useState("");
  const [locationText, setLocationText] = useState("");
  const [feeling, setFeeling] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [mentionResults, setMentionResults] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const fileInputRef = useRef(null);
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "there";
  const firstName = displayName.split(" ")[0] || "there";
  const avatarUrl = user?.profileImageUrl || user?.imageUrl ? toMediaUrl(user.profileImageUrl || user.imageUrl) : "";

  const fileLabel = mediaFile?.name || "";
  const mediaPreviewItem = useMemo(
    () => (mediaFile ? { file: mediaFile, url: URL.createObjectURL(mediaFile) } : null),
    [mediaFile]
  );

  useEffect(() => () => {
    if (mediaPreviewItem?.url) URL.revokeObjectURL(mediaPreviewItem.url);
  }, [mediaPreviewItem]);

  useEffect(() => {
    const query = activeMentionQuery(content);
    if (!query || !onSearchMentionUsers) {
      setMentionResults([]);
      setMentionLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setMentionLoading(true);
      onSearchMentionUsers(query)
        .then((users) => {
          if (!cancelled) setMentionResults(Array.isArray(users) ? users.slice(0, 6) : []);
        })
        .catch(() => {
          if (!cancelled) setMentionResults([]);
        })
        .finally(() => {
          if (!cancelled) setMentionLoading(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [content, onSearchMentionUsers]);

  const appendToken = (token) => {
    setContent((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${token}`);
  };

  const openFilePicker = (accept) => {
    setFileAccept(accept);
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const clearMediaFile = () => {
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!category) return;
    const trimmedLocation = locationText.trim();
    const filledPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
    const trimmedPollQuestion = pollQuestion.trim();

    const formData = new FormData();
    formData.append("content", content.trim());
    formData.append("category", category);
    formData.append("audience", audience);
    formData.append("feeling", feeling);
    formData.append("locationName", trimmedLocation);
    if (trimmedPollQuestion && filledPollOptions.length >= 2) {
      formData.append("pollQuestion", trimmedPollQuestion);
      formData.append("pollOptions", JSON.stringify(filledPollOptions));
      formData.append("allowMultipleVotes", allowMultipleVotes);
      formData.append("notifyFollowers", notifyFollowers);
    }
    if (mediaFile) {
      formData.append("image", mediaFile);
    }
    await onSubmit(formData);
    setContent("");
    setMediaFile(null);
    setCategory("");
    setAudience("PUBLIC");
    setActiveTool("");
    setLocationText("");
    setFeeling("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setAllowMultipleVotes(false);
    setNotifyFollowers(true);
    setMentionResults([]);
    event.target.reset();
  };

  return (
    <form className="card composer composer-premium" onSubmit={submit}>
      {/* Input row: avatar + textarea + live-feed badge */}
      <div className="composer-input-row">
        <span className={`composer-avatar ${avatarUrl ? "has-image" : ""}`} aria-hidden="true">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : (user?.firstName || user?.name || "A").slice(0, 1)}
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's happening, ${firstName}?`}
          rows={1}
        />
        {mentionResults.length || mentionLoading ? (
          <div className="composer-mention-menu">
            {mentionLoading ? <p>Finding people...</p> : null}
            {mentionResults.map((mentionUser) => (
              <button
                key={`composer-mention-${mentionUser.userId || mentionUser.email}`}
                type="button"
                onClick={() => {
                  setContent((previous) => replaceActiveMention(previous, mentionHandle(mentionUser)));
                  setMentionResults([]);
                }}
              >
                <span className={`composer-mention-avatar ${mentionUser.profileImageUrl || mentionUser.imageUrl ? "has-image" : ""}`}>
                  {mentionUser.profileImageUrl || mentionUser.imageUrl ? (
                    <img src={toMediaUrl(mentionUser.profileImageUrl || mentionUser.imageUrl)} alt="" />
                  ) : (
                    displayUserName(mentionUser).slice(0, 1).toUpperCase()
                  )}
                </span>
                <span>
                  <strong>@{mentionHandle(mentionUser)}</strong>
                  <small>{displayUserName(mentionUser)}</small>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          className={`composer-input-emoji ${activeTool === "emoji" ? "active" : ""}`}
          aria-label="Add emoji"
          onClick={() => setActiveTool((prev) => prev === "emoji" ? "" : "emoji")}
        >
          <ComposerToolIcon name="smile" />
        </button>
      </div>

      {/* Toolbar row: tools on left, Post button on right */}
      <div className="composer-actions premium-composer-actions">
        <div className="composer-tool-row">
          <label className="composer-tool-button composer-file-label" aria-label="Attach image, GIF, or video" title="Attach image, GIF, or video" onClick={() => setFileAccept("image/*,video/*,.gif")}>
            <input ref={fileInputRef} type="file" accept={fileAccept} onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
            <ComposerToolIcon name="image" />
            <span className="composer-tool-label">Photo</span>
          </label>
          <ComposerToolButton label="Video" icon="video" onClick={() => openFilePicker("video/*")} />
          <ComposerToolButton label="GIF" icon="gif" onClick={() => openFilePicker("image/gif")} />
          <ComposerToolButton label="Poll" icon="chart" active={activeTool === "poll"} onClick={() => setActiveTool((prev) => prev === "poll" ? "" : "poll")} />
          <ComposerToolButton label="Feeling" icon="smile" active={activeTool === "feeling"} onClick={() => setActiveTool((prev) => prev === "feeling" ? "" : "feeling")} />
          <ComposerToolButton label="Location" icon="pin" active={activeTool === "location"} onClick={() => setActiveTool((prev) => prev === "location" ? "" : "location")} />
          <ComposerToolButton label="Mention" icon="more" onClick={() => appendToken("@")} />
        </div>
        {fileLabel ? <small className="composer-file-name">{fileLabel}</small> : null}
        <div className="composer-category-stack">
          <label className="composer-category-field">
            <span>Category</span>
            <div style={{ position: 'relative' }}>
              <select 
                value={category} 
                onChange={(event) => setCategory(event.target.value)} 
                required
                style={{ 
                  paddingLeft: '2.5rem',
                  color: '#0f172a',
                  fontWeight: '600'
                }}
              >
                <option value="">Choose category</option>
                {POST_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} - {item.xp} XP
                  </option>
                ))}
              </select>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: '#64748b' }}
                >
                  <ComposerToolIcon name={POST_CATEGORIES.find(c => c.value === category)?.icon || 'fileText'} />
                </svg>
              </span>
            </div>
          </label>
          <label className="composer-category-field composer-audience-field">
            <span>Audience</span>
            <div style={{ position: 'relative' }}>
              <select 
                value={audience} 
                onChange={(event) => setAudience(event.target.value)}
                style={{ 
                  paddingLeft: '2.5rem',
                  color: '#0f172a',
                  fontWeight: '600'
                }}
              >
                {AUDIENCE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: '#64748b' }}
                >
                  <ComposerToolIcon name={AUDIENCE_OPTIONS.find(a => a.value === audience)?.icon || 'globe'} />
                </svg>
              </span>
            </div>
            <small>{AUDIENCE_OPTIONS.find((item) => item.value === audience)?.hint}</small>
          </label>
        </div>
        <button type="submit" className="btn btn-primary composer-publish-btn" disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>

      {mediaPreviewItem && (
        <div className="composer-media-preview-container" style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-color, #eee)',
          background: 'rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', maxWidth: '100%' }}>
            {mediaFile.type.startsWith('image/') ? (
              <img 
                src={mediaPreviewItem.url} 
                alt="Upload preview" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '3px solid var(--accent-color, #00d2ff)'
                }}
              />
            ) : (
              <video 
                src={mediaPreviewItem.url} 
                controls
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '3px solid var(--accent-color, #00d2ff)'
                }}
              />
            )}
            <button
              type="button"
              onClick={clearMediaFile}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#ff4d4f',
                color: 'white',
                border: '2px solid white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
              title="Remove media"
            >
              &times;
            </button>
          </div>
          <span style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {mediaFile.name}
          </span>
        </div>
      )}

      {activeTool ? (
        <div className="composer-tool-panel">
          {activeTool === "emoji" ? (
            <div className="composer-token-row" aria-label="Emoji choices">
              {QUICK_EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => appendToken(emoji)}>{emoji}</button>
              ))}
            </div>
          ) : null}
          {activeTool === "feeling" ? (
            <div className="composer-token-row composer-feeling-row" aria-label="Feeling choices">
              {FEELINGS.map((item) => {
                const meta = FEELING_META[item] || { emoji: "\u{1F642}", hint: "Today" };
                return (
                  <button
                    key={item}
                    type="button"
                    className={feeling === item ? "active" : ""}
                    onClick={() => setFeeling(item)}
                  >
                    <span className="composer-feeling-emoji" aria-hidden="true">{meta.emoji}</span>
                    <span className="composer-feeling-copy">
                      <strong>{item}</strong>
                      <small>{meta.hint}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {activeTool === "gif" ? (
            <div className="composer-gif-upload-note">
              <strong>Upload an animated GIF</strong>
              <button type="button" onClick={() => openFilePicker("image/gif")}>Choose GIF</button>
            </div>
          ) : null}
          {activeTool === "location" ? (
            <label className="composer-inline-field composer-location-field">
              <span>Location</span>
              <span className="composer-location-input-shell">
                <span className="composer-location-icon" aria-hidden="true">
                  <ComposerToolIcon name="pin" />
                </span>
                <input value={locationText} onChange={(event) => setLocationText(event.target.value)} placeholder="Add city, venue, or online link" />
              </span>
            </label>
          ) : null}
          {activeTool === "poll" ? (
            <div className="composer-poll-container">
              <header className="composer-poll-header">
                <div className="composer-poll-header-icon-wrap">
                  <ComposerToolIcon name="chat" />
                </div>
                <div className="composer-poll-header-info">
                  <h3>Create poll</h3>
                  <p>Ask a question and let people vote</p>
                </div>
                <div className="composer-poll-header-badge">
                  <div className="composer-poll-header-icon-wrap secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                  <div className="composer-poll-header-info">
                    <strong>Polls are anonymous</strong>
                    <p>Voters' names are visible only after voting</p>
                  </div>
                </div>
              </header>

              <div className="composer-poll-main-card">
                <div className="composer-poll-field-group">
                  <div className="composer-poll-field-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#8b5cf6'}}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span>Poll question</span>
                  </div>
                  <div className="composer-poll-input-wrap">
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(event) => setPollQuestion(event.target.value)}
                      placeholder="Ask a clear question..."
                      maxLength={200}
                    />
                    <span className="composer-poll-char-count">{pollQuestion.length}/200</span>
                  </div>
                </div>

                <div className="composer-poll-field-group">
                  <div className="composer-poll-field-header">
                    <div className="composer-poll-field-label">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#8b5cf6'}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      <span>Poll options</span>
                    </div>
                    {pollOptions.length < 8 ? (
                      <button
                        type="button"
                        className="composer-poll-add-btn"
                        onClick={() => setPollOptions((prev) => [...prev, ""])}
                      >
                        <ComposerToolIcon name="plus" />
                        <span>Add option</span>
                      </button>
                    ) : null}
                  </div>

                  <div className="composer-poll-options-list">
                    {pollOptions.map((option, index) => (
                      <div key={`poll-opt-${index}`} className="composer-poll-option-row">
                        <div className="composer-poll-option-drag">
                          <ComposerToolIcon name="drag" />
                        </div>
                        <div className="composer-poll-option-input-wrap">
                          <input
                            type="text"
                            value={option}
                            onChange={(event) => {
                              const next = [...pollOptions];
                              next[index] = event.target.value;
                              setPollOptions(next);
                            }}
                            placeholder={`Enter option ${index + 1}...`}
                          />
                        </div>
                        {pollOptions.length > 2 ? (
                          <button
                            type="button"
                            className="composer-poll-option-remove"
                            onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== index))}
                          >
                            <ComposerToolIcon name="trash" />
                          </button>
                        ) : (
                          <div className="composer-poll-option-spacer" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
                        checked={allowMultipleVotes}
                        onChange={(e) => setAllowMultipleVotes(e.target.checked)}
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
                    <p>Share this poll with your connections</p>
                  </div>
                  <div className="composer-poll-setting-action">
                    <label className="composer-poll-switch">
                      <input
                        type="checkbox"
                        checked={notifyFollowers}
                        onChange={(e) => setNotifyFollowers(e.target.checked)}
                      />
                      <span className="composer-poll-slider" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="composer-poll-footer-actions">
                <button
                  type="submit"
                  className="composer-poll-submit-btn premium-gradient-btn"
                  disabled={submitting || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: 'rotate(-45deg)', marginTop: '-2px'}}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  <span>{submitting ? "Creating..." : "Create poll"}</span>
                </button>
                <button
                  type="button"
                  className="composer-poll-reset-btn"
                  onClick={() => {
                    setPollQuestion("");
                    setPollOptions(["", ""]);
                    setAllowMultipleVotes(false);
                    setNotifyFollowers(true);
                    setActiveTool("");
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  <span>Reset</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {(feeling || locationText.trim() || pollQuestion.trim()) ? (
        <div className="composer-preview-chips">
          {feeling ? <span>{FEELING_META[feeling]?.emoji || "\u{1F642}"} Feeling {feeling}</span> : null}
          {locationText.trim() ? (
            <span className="composer-location-chip">
              <ComposerToolIcon name="pin" />
              {locationText.trim()}
            </span>
          ) : null}
          {pollQuestion.trim() ? <span>Poll ready</span> : null}
        </div>
      ) : null}
      {mediaPreviewItem ? (
        <div className={`composer-media-preview ${mediaPreviewItem.file?.type === "image/gif" ? "gif" : ""}`.trim()}>
          <div className="composer-media-preview-grid single">
            <figure>
              {mediaPreviewItem.file?.type?.startsWith("video") ? (
                <video src={mediaPreviewItem.url} controls muted />
              ) : (
                <img src={mediaPreviewItem.url} alt={mediaPreviewItem.file?.type === "image/gif" ? "Animated GIF preview" : "Post media preview"} />
              )}
              <button
                type="button"
                onClick={clearMediaFile}
                aria-label={`Remove ${mediaPreviewItem.file.name}`}
              >
                Remove
              </button>
            </figure>
          </div>
          <button type="button" onClick={clearMediaFile}>Remove media</button>
        </div>
      ) : null}
    </form>
  );
}
