import React, { useEffect, useState, useCallback } from "react";
import api from "/src/legacy/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export default function Posts() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareCaption, setShareCaption] = useState({});

  // ================= FETCH FEED =================
  const fetchFeed = useCallback(async () => {
    try {
      const res = await api.get("/shares/feed");
      setFeed(res.data);
    } catch (err) {
      console.error(err);
      console.warn("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // ================= CREATE POST =================
  const handleCreatePost = async () => {
    if (!content.trim() && !image) {
      console.warn("Post must have content or image");
      return;
    }

    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);

    try {
      await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setContent("");
      setImage(null);
      await fetchFeed();
    } catch (err) {
      console.error(err);
      console.warn("Failed to create post");
    }
  };

  // ================= SHARE POST =================
  const handleShare = async (postId) => {
    try {
      const caption = shareCaption[postId] || "";
      await api.post(`/shares/${postId}/share`, { caption });
      setShareCaption((prev) => ({ ...prev, [postId]: "" }));
      await fetchFeed();
    } catch (err) {
      console.error(err);
      console.warn("Failed to share post");
    }
  };

  // ================= DELETE SHARE =================
  const handleDeleteShare = async (shareId) => {
    try {
      await api.delete(`/shares/${shareId}`);
      await fetchFeed();
    } catch (err) {
      console.error(err);
      console.warn("Failed to delete share");
    }
  };

  // ================= RENDER IMAGE =================
  const renderImage = (url) =>
    url && (
      <img
        src={`${API_BASE}${url}`}
        alt="post"
        style={{
          width: "100%",
          maxHeight: 350,
          objectFit: "cover",
          borderRadius: 6,
        }}
      />
    );

  if (loading) return <h3>Loading feed...</h3>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>Create Post</h2>
      <textarea
        placeholder="Write something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <br />
      <br />
      <button onClick={handleCreatePost}>Post</button>

      <hr />
      <h2>Feed</h2>
      {feed.length === 0 && <p>No posts yet</p>}

      {feed.map((item) => (
        <div
          key={`${item.type}-${item.postId}`}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 15,
            borderRadius: 8,
          }}
        >
          {/* POST */}
          {item.type === "POST" && (
            <>
              <h4>{item.authorName}</h4>
              <p>{item.content}</p>
              {renderImage(item.imageUrl)}
              <div style={{ marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="Add caption..."
                  value={shareCaption[item.postId] || ""}
                  onChange={(e) =>
                    setShareCaption((prev) => ({
                      ...prev,
                      [item.postId]: e.target.value,
                    }))
                  }
                  style={{ width: "70%", marginRight: 5 }}
                />
                <button onClick={() => handleShare(item.postId)}>Share</button>
              </div>
            </>
          )}

          {/* SHARE */}
          {item.type === "SHARE" && (
            <>
              <p>
                <strong>{item.sharedByName}</strong> shared this post
              </p>
              {item.shareCaption && (
                <p>
                  <strong>Caption:</strong> {item.shareCaption}
                </p>
              )}
              <div
                style={{
                  border: "1px solid #ddd",
                  padding: 10,
                  borderRadius: 6,
                  background: "#f9f9f9",
                }}
              >
                <h5>{item.authorName}</h5>
                <p>{item.content}</p>
                {renderImage(item.imageUrl)}
              </div>
              <button
                style={{ marginTop: 5, color: "red" }}
                onClick={() => handleDeleteShare(item.postId)}
              >
                Delete Share
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
