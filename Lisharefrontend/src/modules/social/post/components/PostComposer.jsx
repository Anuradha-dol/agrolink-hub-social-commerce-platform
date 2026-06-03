import { useMemo, useRef, useState } from "react";
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

function ComposerToolButton({ label, icon, active = false, onClick }) {
  return (
    <button type="button" className={`composer-tool-button ${active ? "active" : ""}`} aria-label={label} title={label} onClick={onClick}>
      {icon === "gif" ? <span className="composer-tool-gif">GIF</span> : <ComposerToolIcon name={icon} />}
    </button>
  );
}

export default function PostComposer({ onSubmit, submitting }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [category, setCategory] = useState("");
  const [fileAccept, setFileAccept] = useState("image/*,video/*");
  const [activeTool, setActiveTool] = useState("");
  const [locationText, setLocationText] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const fileInputRef = useRef(null);
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "there";
  const firstName = displayName.split(" ")[0] || "there";
  const avatarUrl = user?.profileImageUrl || user?.imageUrl ? toMediaUrl(user.profileImageUrl || user.imageUrl) : "";

  const fileLabel = useMemo(() => {
    if (!imageFile) return "";
    return imageFile.name;
  }, [imageFile]);

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
    const enrichedContent = [
      content.trim(),
      trimmedLocation ? `Location: ${trimmedLocation}` : "",
      filledPollOptions.length >= 2 ? `Poll: ${filledPollOptions.join(" / ")}` : ""
    ].filter(Boolean).join("\n");

    const formData = new FormData();
    formData.append("content", enrichedContent);
    formData.append("category", category);
    if (imageFile) formData.append("image", imageFile);
    await onSubmit(formData);
    setContent("");
    setImageFile(null);
    setCategory("");
    setActiveTool("");
    setLocationText("");
    setPollOptions(["", ""]);
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
        <span className="composer-live-badge" aria-hidden="true">
          <ComposerToolIcon name="liveFeed" />
          Live Feed
        </span>
      </div>

      {/* Toolbar row: tools on left, Post button on right */}
      <div className="composer-actions premium-composer-actions">
        <div className="composer-tool-row">
          <label className="composer-tool-button composer-file-label" aria-label="Attach image or video" title="Attach image or video" onClick={() => setFileAccept("image/*,video/*")}>
            <input ref={fileInputRef} type="file" accept={fileAccept} onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <ComposerToolIcon name="image" />
          </label>
          <ComposerToolButton label="Add video" icon="video" onClick={() => openFilePicker("video/*")} />
          <ComposerToolButton label="Add GIF" icon="gif" active={activeTool === "gif"} onClick={() => setActiveTool((prev) => prev === "gif" ? "" : "gif")} />
          <ComposerToolButton label="Add emoji" icon="smile" active={activeTool === "emoji"} onClick={() => setActiveTool((prev) => prev === "emoji" ? "" : "emoji")} />
          <ComposerToolButton label="Add location" icon="pin" active={activeTool === "location"} onClick={() => setActiveTool((prev) => prev === "location" ? "" : "location")} />
          <ComposerToolButton label="Add poll" icon="chart" active={activeTool === "poll"} onClick={() => setActiveTool((prev) => prev === "poll" ? "" : "poll")} />
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
          {activeTool === "gif" ? (
            <div className="composer-token-row" aria-label="GIF suggestions">
              {["study tip", "launch", "thank you", "progress"].map((tag) => (
                <button key={tag} type="button" onClick={() => appendToken(`#${tag.replace(/\s+/g, "")}`)}>{tag}</button>
              ))}
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
              {pollOptions.map((option, index) => (
                <label key={`poll-${index}`}>
                  Option {index + 1}
                  <input value={option} onChange={(event) => {
                    const next = [...pollOptions];
                    next[index] = event.target.value;
                    setPollOptions(next);
                  }} placeholder={`Poll option ${index + 1}`} />
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
