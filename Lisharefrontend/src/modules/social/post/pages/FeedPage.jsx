import { useCallback, useEffect, useMemo, useState } from "react";
import PostComposer from "../components/PostComposer";
import FeedCard from "../components/FeedCard";
import { feedService } from "../services/feedService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import EmptyState from "/src/modules/platform/common/components/EmptyState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { userBlockService } from "/src/modules/platform/user/services/userBlockService";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

export default function FeedPage() {
  const { pushToast } = useToast();
  const [feed, setFeed] = useState([]);
  const [commentsMap, setCommentsMap] = useState({});
  const [reactionsMap, setReactionsMap] = useState({});
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [blockUserId, setBlockUserId] = useState("");
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [error, setError] = useState("");

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data }, savedRes, blockedRes] = await Promise.all([
        feedService.getFeed(),
        feedService.getSavedPosts({ page: 0, size: 100 }),
        userBlockService.listBlocked()
      ]);

      const feedList = Array.isArray(data) ? data : [];
      setFeed(feedList);
      const savedItems = savedRes?.data?.data?.content || [];
      setSavedPosts(savedItems);
      setSavedPostIds(savedItems.map((post) => post.postId));
      setBlockedUsers(blockedRes?.data?.data || []);

      const commentEntries = await Promise.all(
        feedList.map(async (item) => {
          const postId = item.type === "SHARE" ? item.originalPostId : item.postId;
          const response = await feedService.getComments(postId);
          return [postId, response.data || []];
        })
      );
      const reactionEntries = await Promise.all(
        feedList.map(async (item) => {
          const postId = item.type === "SHARE" ? item.originalPostId : item.postId;
          const response = await feedService.getReactions(postId);
          return [postId, response.data || {}];
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

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

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

  const onComment = async (postId, content) => {
    try {
      await feedService.addComment(postId, content);
      const response = await feedService.getComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: response.data || [] }));
    } catch {
      pushToast("Failed to add comment", "error");
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

  const onShare = async (postId, caption) => {
    try {
      await feedService.share(postId, caption);
      pushToast("Post shared", "success");
      await loadFeed();
    } catch {
      pushToast("Failed to share post", "error");
    }
  };

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

  const blockUser = async () => {
    const targetUserId = Number(blockUserId);
    if (!targetUserId) return;
    try {
      await userBlockService.blockUser(targetUserId);
      pushToast("User blocked", "success");
      setBlockUserId("");
      await loadFeed();
    } catch {
      pushToast("Failed to block user", "error");
    }
  };

  const unblockUser = async (userId) => {
    try {
      await userBlockService.unblockUser(userId);
      pushToast("User unblocked", "success");
      await loadFeed();
    } catch {
      pushToast("Failed to unblock user", "error");
    }
  };

  const trendingHashtags = useMemo(() => {
    const counter = new Map();
    feed.forEach((item) => {
      const content = item.content || "";
      const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
      hashtags.forEach((tag) => counter.set(tag, (counter.get(tag) || 0) + 1));
    });
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [feed]);

  const stories = useMemo(
    () => feed.filter((item) => item.imageUrl).slice(0, 8),
    [feed]
  );

  const reels = useMemo(
    () => feed.filter((item) => item.imageUrl).slice(8, 16),
    [feed]
  );

  if (loading) return <LoadingState text="Loading feed..." />;
  if (error) return <ErrorState message={error} onRetry={loadFeed} />;

  return (
    <div className="feed-page">
      <PostComposer onSubmit={onCreatePost} submitting={submittingPost} />

      <section className="card">
        <h3>Stories</h3>
        <div className="stories-row">
          {stories.length === 0 ? <p className="muted">No stories yet.</p> : null}
          {stories.map((item) => (
            <div key={`story-${item.postId}`} className="story-item">
              <img src={toMediaUrl(item.imageUrl)} alt="Story" />
              <span>{item.authorName}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Reels</h3>
        <div className="reels-grid">
          {reels.length === 0 ? <p className="muted">No reels yet.</p> : null}
          {reels.map((item) => (
            <div key={`reel-${item.postId}`} className="reel-item">
              <img src={toMediaUrl(item.imageUrl)} alt="Reel" />
              <p>{item.content || "Short reel post"}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Trending Hashtags</h3>
        <div className="reaction-row">
          {trendingHashtags.length === 0 ? <p className="muted">No trending hashtags yet.</p> : null}
          {trendingHashtags.map(([tag, count]) => (
            <span key={tag} className="chip">
              {tag} ({count})
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Saved Posts</h3>
        <ul className="simple-list">
          {savedPosts.length === 0 ? <li className="muted">No saved posts yet.</li> : null}
          {savedPosts.slice(0, 6).map((post) => (
            <li key={post.postId}>{post.authorName}: {post.content?.slice(0, 80) || "Image post"}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Privacy & Blocking</h3>
        <div className="inline-form">
          <input
            placeholder="User ID to block"
            value={blockUserId}
            onChange={(event) => setBlockUserId(event.target.value)}
          />
          <button className="btn btn-secondary" type="button" onClick={blockUser}>
            Block User
          </button>
        </div>
        <ul className="simple-list">
          {blockedUsers.length === 0 ? <li className="muted">No blocked users.</li> : null}
          {blockedUsers.map((blocked) => (
            <li key={blocked.id} className="user-row">
              <span>{blocked.blockedUserName} (ID: {blocked.blockedUserId})</span>
              <button className="btn btn-secondary" type="button" onClick={() => unblockUser(blocked.blockedUserId)}>
                Unblock
              </button>
            </li>
          ))}
        </ul>
      </section>

      {feed.length === 0 ? (
        <EmptyState title="No posts yet" subtitle="Create the first post to start your feed." />
      ) : (
        feed.map((item) => {
          const postId = item.type === "SHARE" ? item.originalPostId : item.postId;
          return (
            <FeedCard
              key={`${item.type}-${item.postId}`}
              item={item}
              comments={commentsMap[postId] || []}
              reactions={reactionsMap[postId] || {}}
              onComment={onComment}
              onReact={onReact}
              onShare={onShare}
              onDelete={onDelete}
              saved={savedPostIds.includes(postId)}
              onSaveToggle={onSaveToggle}
              onReport={onReport}
            />
          );
        })
      )}
    </div>
  );
}
