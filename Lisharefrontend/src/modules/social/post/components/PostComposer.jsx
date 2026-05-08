import { useState } from "react";

export default function PostComposer({ onSubmit, submitting }) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);

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
    <form className="card composer" onSubmit={submit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        rows={3}
      />
      <div className="composer-actions">
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
