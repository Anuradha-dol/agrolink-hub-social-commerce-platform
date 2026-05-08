import { useState } from "react";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

const REACTIONS = ["like", "love", "care", "haha", "wow", "sad", "angry"];

export default function FeedCard({
  item,
  comments = [],
  reactions = {},
  saved = false,
  onComment,
  onReact,
  onShare,
  onDelete,
  onSaveToggle,
  onReport
}) {
  const [commentText, setCommentText] = useState("");
  const [shareCaption, setShareCaption] = useState("");
  const postId = item.type === "SHARE" ? item.originalPostId : item.postId;

  const submitComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    await onComment(postId, commentText);
    setCommentText("");
  };

  const submitShare = async (event) => {
    event.preventDefault();
    await onShare(postId, shareCaption);
    setShareCaption("");
  };

  return (
    <article className="card feed-card">
      <header className="feed-card-header">
        <div>
          <p className="feed-author">
            {item.type === "SHARE" ? `${item.sharedByName} shared` : item.authorName}
          </p>
          <p className="feed-time">
            {item.sharedAt || item.createdAt ? new Date(item.sharedAt || item.createdAt).toLocaleString() : ""}
          </p>
        </div>
        {onDelete && item.type === "POST" ? (
          <button className="btn btn-secondary" type="button" onClick={() => onDelete(item.postId)}>
            Delete
          </button>
        ) : null}
      </header>

      {item.shareCaption ? <p className="feed-share-caption">{item.shareCaption}</p> : null}
      <p className="feed-content">{item.content}</p>
      {item.imageUrl ? <img className="feed-image" src={toMediaUrl(item.imageUrl)} alt="Post" /> : null}

      <div className="reaction-row">
        {REACTIONS.map((reaction) => (
          <button key={reaction} type="button" className="chip" onClick={() => onReact(postId, reaction)}>
            {reaction} {reactions?.[reaction] || 0}
          </button>
        ))}
      </div>

      <div className="row-actions">
        <button className="btn btn-secondary" type="button" onClick={() => onSaveToggle(postId, saved)}>
          {saved ? "Saved" : "Save"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => onReport(postId)}>
          Report
        </button>
      </div>

      <form onSubmit={submitComment} className="inline-form">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment"
        />
        <button className="btn btn-primary" type="submit">
          Comment
        </button>
      </form>

      <ul className="comment-list">
        {comments.slice(0, 3).map((comment) => (
          <li key={comment.commentId}>
            <strong>{comment.authorName || `${comment.firstName || ""} ${comment.lastName || ""}`.trim()}:</strong>{" "}
            {comment.content}
          </li>
        ))}
      </ul>

      <form onSubmit={submitShare} className="inline-form">
        <input
          value={shareCaption}
          onChange={(e) => setShareCaption(e.target.value)}
          placeholder="Share caption"
        />
        <button className="btn btn-secondary" type="submit">
          Share
        </button>
      </form>
    </article>
  );
}
