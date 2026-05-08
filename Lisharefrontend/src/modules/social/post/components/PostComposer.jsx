import { useMemo, useState } from "react";
import { useAuth } from "/src/modules/platform/app/store";

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
    send: (
      <>
        <path d="m3 11 18-8-6.5 18-2.4-7.1z" />
        <path d="M21 3 12 14" />
      </>
    )
  };

  return (
    <svg className="composer-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] || icons.image}
    </svg>
  );
}

function ComposerToolButton({ label, icon }) {
  return (
    <button type="button" className="composer-tool-button" aria-label={label} title={label}>
      {icon === "gif" ? <span className="composer-tool-gif">GIF</span> : <ComposerToolIcon name={icon} />}
    </button>
  );
}

export default function PostComposer({ onSubmit, submitting }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "there";
  const firstName = displayName.split(" ")[0] || "there";

  const fileLabel = useMemo(() => {
    if (!imageFile) return "";
    return imageFile.name;
  }, [imageFile]);

  const submit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("content", content);
    if (imageFile) formData.append("image", imageFile);
    await onSubmit(formData);
    setContent("");
    setImageFile(null);
    event.target.reset();
  };

  return (
    <form className="card composer composer-premium" onSubmit={submit}>
      <div className="composer-top premium-composer-top">
        <div>
          <h3>Create Post</h3>
          <p>Share updates, photos and moments with your network.</p>
        </div>
        <span className="composer-badge">Live Feed</span>
      </div>

      <div className="composer-input-row">
        <span className="composer-avatar" aria-hidden="true">
          {(user?.firstName || user?.name || "A").slice(0, 1)}
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's happening, ${firstName}?`}
          rows={2}
        />
      </div>

      <div className="composer-actions premium-composer-actions">
        <div className="composer-tool-row">
          <label className="composer-tool-button composer-file-label" aria-label="Attach image or video" title="Attach image or video">
            <input type="file" accept="image/*,video/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <ComposerToolIcon name="image" />
          </label>
          <ComposerToolButton label="Add video" icon="video" />
          <ComposerToolButton label="Add emoji" icon="smile" />
          <ComposerToolButton label="Add GIF" icon="gif" />
          <ComposerToolButton label="Add poll" icon="chart" />
          <ComposerToolButton label="Add location" icon="pin" />
        </div>
        {fileLabel ? <small className="composer-file-name">{fileLabel}</small> : null}
        <button type="submit" className="btn btn-primary composer-publish-btn" disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
