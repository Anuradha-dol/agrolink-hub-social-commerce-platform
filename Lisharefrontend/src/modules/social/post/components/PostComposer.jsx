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
    )
  };

  return (
    <svg className="composer-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] || icons.image}
    </svg>
  );
}

const QUICK_EMOJIS = ["\u{1F642}", "\u{1F44F}", "\u{1F4A1}", "\u{1F4DA}", "\u{1F680}", "\u{1F4AF}"];
const POST_CATEGORIES = [
  { value: "GENERAL", label: "General", xp: 1 },
  { value: "EDUCATION", label: "Education", xp: 5 },
  { value: "FUNNY", label: "Funny", xp: 2 },
  { value: "NEWS", label: "News", xp: 5 },
  { value: "BUSINESS", label: "Business", xp: 3 },
  { value: "LIFESTYLE", label: "Lifestyle", xp: 2 },
  { value: "TECH", label: "Tech", xp: 2 },
  { value: "OTHER", label: "Other", xp: 2 }
];
const FEELINGS = ["Happy", "Sad", "Excited", "Angry", "Loved", "Blessed", "Tired", "Motivated"];

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
  const [imageFile, setImageFile] = useState(null);
  const [category, setCategory] = useState("");
  const [fileAccept, setFileAccept] = useState("image/*,video/*");
  const [activeTool, setActiveTool] = useState("");
  const [locationText, setLocationText] = useState("");
  const [feeling, setFeeling] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [mentionResults, setMentionResults] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const fileInputRef = useRef(null);
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "there";
  const firstName = displayName.split(" ")[0] || "there";
  const avatarUrl = user?.profileImageUrl || user?.imageUrl ? toMediaUrl(user.profileImageUrl || user.imageUrl) : "";

  const fileLabel = useMemo(() => {
    if (!imageFile) return "";
    return imageFile.name;
  }, [imageFile]);
  const mediaPreviewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : ""), [imageFile]);

  useEffect(() => () => {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
  }, [mediaPreviewUrl]);

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

  const submit = async (event) => {
    event.preventDefault();
    if (!category) return;
    const trimmedLocation = locationText.trim();
    const filledPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
    const trimmedPollQuestion = pollQuestion.trim();

    const formData = new FormData();
    formData.append("content", content.trim());
    formData.append("category", category);
    formData.append("feeling", feeling);
    formData.append("locationName", trimmedLocation);
    if (trimmedPollQuestion && filledPollOptions.length >= 2) {
      formData.append("pollQuestion", trimmedPollQuestion);
      formData.append("pollOptions", JSON.stringify(filledPollOptions));
    }
    if (imageFile) formData.append("image", imageFile);
    await onSubmit(formData);
    setContent("");
    setImageFile(null);
    setCategory("");
    setActiveTool("");
    setLocationText("");
    setFeeling("");
    setPollQuestion("");
    setPollOptions(["", ""]);
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
          <label className="composer-tool-button composer-file-label" aria-label="Attach image or video" title="Attach image or video" onClick={() => setFileAccept("image/*,video/*")}>
            <input ref={fileInputRef} type="file" accept={fileAccept} onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
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
            <select value={category} onChange={(event) => setCategory(event.target.value)} required>
              <option value="">Choose category</option>
              {POST_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} - {item.xp} XP
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="btn btn-primary composer-publish-btn" disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
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
              {FEELINGS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={feeling === item ? "active" : ""}
                  onClick={() => setFeeling(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          {activeTool === "gif" ? (
            <div className="composer-gif-upload-note">
              <strong>Upload an animated GIF</strong>
              <button type="button" onClick={() => openFilePicker("image/gif")}>Choose GIF</button>
            </div>
          ) : null}
          {activeTool === "location" ? (
            <label className="composer-inline-field">
              Location
              <input value={locationText} onChange={(event) => setLocationText(event.target.value)} placeholder="Add city, venue, or online link" />
            </label>
          ) : null}
          {activeTool === "poll" ? (
            <div className="composer-poll-fields">
              <label>
                Poll question
                <input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="Ask a clear question" />
              </label>
              {pollOptions.map((option, index) => (
                <div key={`poll-${index}`} className="composer-poll-option-row">
                  <label>
                    Option {index + 1}
                    <input value={option} onChange={(event) => {
                      const next = [...pollOptions];
                      next[index] = event.target.value;
                      setPollOptions(next);
                    }} placeholder={`Poll option ${index + 1}`} />
                  </label>
                  {pollOptions.length > 2 ? (
                    <button type="button" onClick={() => setPollOptions((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}>
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
              {pollOptions.length < 8 ? (
                <button type="button" className="composer-add-option" onClick={() => setPollOptions((previous) => [...previous, ""])}>
                  Add option
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {(feeling || locationText.trim() || pollQuestion.trim()) ? (
        <div className="composer-preview-chips">
          {feeling ? <span>Feeling {feeling}</span> : null}
          {locationText.trim() ? <span>{locationText.trim()}</span> : null}
          {pollQuestion.trim() ? <span>Poll ready</span> : null}
        </div>
      ) : null}
      {mediaPreviewUrl ? (
        <div className={`composer-media-preview ${imageFile?.type === "image/gif" ? "gif" : ""}`.trim()}>
          {imageFile?.type?.startsWith("video") ? (
            <video src={mediaPreviewUrl} controls muted />
          ) : (
            <img src={mediaPreviewUrl} alt={imageFile?.type === "image/gif" ? "Animated GIF preview" : "Post media preview"} />
          )}
          <button type="button" onClick={() => setImageFile(null)}>Remove media</button>
        </div>
      ) : null}
    </form>
  );
}
