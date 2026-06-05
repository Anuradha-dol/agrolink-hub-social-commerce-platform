// src/components/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  TextField,
  Stack,
  IconButton,
  Card,
  CardContent,
  Popover,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Home as HomeIcon,
  PhotoCamera,
  ThumbUp,
  Favorite,
  EmojiEmotions,
  SentimentSatisfied,
  SentimentVeryDissatisfied,
  Mood,
  MoodBad,
  MoreHoriz,
  Delete,
  Person,
  RateReview,
  Support,
  Search,
  Notifications,
  People,
  Share,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import api from "/src/legacy/api";
import { followUser, unfollowUser, searchUsers, getFollowing } from "/src/legacy/followApi";

const backendBaseUrl = "http://localhost:4041";

// Reaction icon mapping
const reactionIcons = {
  like: <ThumbUp fontSize="small" sx={{ color: "#2196f3" }} />,
  love: <Favorite fontSize="small" sx={{ color: "#e91e63" }} />,
  care: <Mood fontSize="small" sx={{ color: "#ff9800" }} />,
  haha: <SentimentSatisfied fontSize="small" sx={{ color: "#9e9e9e" }} />,
  wow: <EmojiEmotions fontSize="small" sx={{ color: "#00bcd4" }} />,
  sad: <SentimentVeryDissatisfied fontSize="small" sx={{ color: "#9e9e9e" }} />,
  angry: <MoodBad fontSize="small" sx={{ color: "#f44336" }} />,
};

// Helper to get initials
const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [error, setError] = useState("");
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [commentText, setCommentText] = useState({});

  // Reaction popover state
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Feed item menu state (three-dot)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedFeedItem, setSelectedFeedItem] = useState(null); // { id, type }

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareCaption, setShareCaption] = useState("");
  const [sharingPostId, setSharingPostId] = useState(null);

  const reactionTypes = ["like", "love", "care", "haha", "wow", "sad", "angry"];

  // --- Search Users state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [followingList, setFollowingList] = useState([]);
  const [processingIds, setProcessingIds] = useState([]);

  // --- Notifications state ---
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");

  // --- Shared follow/friend handlers (from SearchUsers) ---
  const handleFollowToggle = async (userId, isFollowing) => {
    if (processingIds.includes(userId)) return;
    setProcessingIds(prev => [...prev, userId]);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setFollowingList(prev => prev.filter(id => id !== userId));
      } else {
        await followUser(userId);
        setFollowingList(prev => [...prev, userId]);
      }
      // Update search results optimistically
      setSearchResults(prev =>
        prev.map(u => u.userId === userId ? { ...u, isFollowing: !isFollowing } : u)
      );
      // Update notifications if this user appears there
      setNotifications(prev =>
        prev.map(n => n.userId === userId ? { ...n, isFollowing: !isFollowing } : n)
      );
    } catch (err) {
      console.error(err);
      setSearchError(err.response?.data?.message || "Action failed");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleAddFriend = async (userId) => {
    if (processingIds.includes(userId)) return;
    setProcessingIds(prev => [...prev, userId]);
    try {
      await api.post(`/api/friends/${userId}/request`, {}, { withCredentials: true });
      setSearchResults(prev =>
        prev.map(u => u.userId === userId ? { ...u, requestSent: true } : u)
      );
    } catch (err) {
      console.error(err);
      console.warn(err.response?.data?.message || "Failed to send friend request");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleCancelRequest = async (userId) => {
    if (processingIds.includes(userId)) return;
    setProcessingIds(prev => [...prev, userId]);
    try {
      await api.delete(`/api/friends/${userId}/unfriend`, { withCredentials: true });
      setSearchResults(prev =>
        prev.map(u => u.userId === userId ? { ...u, requestSent: false } : u)
      );
    } catch (err) {
      console.error(err);
      console.warn(err.response?.data?.message || "Failed to cancel request");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== userId));
    }
  };

  // --- Fetch current user, following list, and welcome message ---
  useEffect(() => {
    const fetchUserAndWelcome = async () => {
      try {
        const userRes = await api.get("/user/me", { withCredentials: true });
        setUser(userRes.data);

        // Fetch welcome message from /user/home
        const homeRes = await api.get("/user/home", { withCredentials: true });
        setWelcomeMessage(homeRes.data.welcomeMessage || "");

        const following = await getFollowing();
        setFollowingList(following.map(u => u.userId));
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
        else setError("Failed to load user data");
      }
    };
    fetchUserAndWelcome();
  }, [navigate]);

  // --- Fetch notifications ---
  const fetchNotifications = async () => {
    try {
      const userRes = await api.get("/user/me", { withCredentials: true });
      const userId = userRes.data.userId;

      const [followersRes, followingRes] = await Promise.all([
        api.get("/follow/followers", { withCredentials: true }),
        api.get("/follow/following", { withCredentials: true }),
      ]);
      const followers = followersRes.data;
      const following = followingRes.data;
      const followingIds = following.map(u => u.userId);

      const notifList = followers.map(u => ({
        ...u,
        isFollower: true,
        isFollowing: followingIds.includes(u.userId),
        type: "follower",
      }));

      const followingOnly = following
        .filter(u => !followers.some(f => f.userId === u.userId))
        .map(u => ({
          ...u,
          isFollower: false,
          isFollowing: true,
          type: "following",
        }));

      setNotifications([...notifList, ...followingOnly]);
    } catch (err) {
      console.error(err);
      setNotificationsError("Failed to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // --- Fetch feed (posts + shares) ---
  const fetchFeed = async () => {
    setLoading(true);
    try {
      // 1. Fetch posts from feed (posts from followed users)
      const postsRes = await api.get("/posts/feed", { withCredentials: true });
      const postsWithDetails = await Promise.all(
        postsRes.data.map(async (post) => {
          let comments = [];
          try {
            const commentsRes = await api.get(`/comments/${post.postId}/all`, { withCredentials: true });
            comments = commentsRes.data;
          } catch {}
          let reactions = {};
          try {
            const reactionsRes = await api.get(`/reactions/${post.postId}/counts`, { withCredentials: true });
            reactions = reactionsRes.data;
          } catch {}
          return { ...post, type: "POST", comments, reactions };
        })
      );

      // 2. Fetch shares from feed (shares by followed users)
      let shares = [];
      try {
        const sharesRes = await api.get("/shares/feed", { withCredentials: true });
        shares = await Promise.all(
          sharesRes.data.map(async (share) => {
            const originalPostId = share.originalPostId || share.postId;
            let comments = [];
            let reactions = {};
            if (originalPostId) {
              try {
                const commentsRes = await api.get(`/comments/${originalPostId}/all`, { withCredentials: true });
                comments = commentsRes.data;
              } catch {}
              try {
                const reactionsRes = await api.get(`/reactions/${originalPostId}/counts`, { withCredentials: true });
                reactions = reactionsRes.data;
              } catch {}
            }
            return {
              ...share,
              type: "SHARE",
              shareId: share.postId || share.shareId,
              sharedByName: share.sharedByName || share.authorName,
              shareCaption: share.caption || share.shareCaption,
              createdAt: share.sharedAt || share.createdAt,
              originalPost: {
                postId: originalPostId,
                content: share.originalContent || share.content,
                imageUrl: share.originalImageUrl || share.imageUrl,
                authorName: share.originalAuthorName || share.authorName,
                comments,
                reactions,
              },
            };
          })
        );
      } catch (err) {
        console.warn("Failed to fetch shares", err);
      }

      // Merge and sort by createdAt descending (newest first)
      const allItems = [...postsWithDetails, ...shares].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setFeed(allItems);
    } catch (err) {
      console.error("Failed to load feed", err);
      console.warn("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // --- Search handler ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    try {
      const data = await searchUsers(searchQuery);
      const pendingRes = await api.get("/api/friends/pending", { withCredentials: true });
      const pendingIds = pendingRes.data.map(u => u.userId);

      setSearchResults(
        data.map((user) => ({
          ...user,
          isFollowing: followingList.includes(user.userId),
          isFriend: false,
          requestSent: pendingIds.includes(user.userId),
        }))
      );
    } catch (err) {
      console.error(err);
      setSearchError(err.response?.data?.message || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  // --- Post handlers ---
  const handleCreatePost = async () => {
    if (!content.trim() && !image) return console.warn("Post must have content or image");
    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);
    try {
      const res = await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      // Add the new post to feed with empty comments and reactions
      const newPost = { ...res.data, type: "POST", comments: [], reactions: {} };
      setFeed([newPost, ...feed]);
      setContent("");
      setImage(null);
    } catch (err) {
      console.error(err);
      console.warn("Failed to create post");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const res = await api.delete(`/posts/delete/${postId}`, { withCredentials: true });
      if (res.status === 200) setFeed(feed.filter((item) => !(item.type === "POST" && item.postId === postId)));
      else console.warn(res.data || "Failed to delete post");
    } catch (err) {
      console.error(err);
      console.warn(err.response?.data || "Failed to delete post");
    }
    setMenuAnchorEl(null);
    setSelectedFeedItem(null);
  };

  const handleDeleteShare = async (shareId) => {
    try {
      await api.delete(`/shares/${shareId}`, { withCredentials: true });
      setFeed(prev => prev.filter(item => !(item.type === "SHARE" && item.shareId === shareId)));
      // Optionally refetch to ensure consistency
      fetchFeed();
    } catch (err) {
      console.error(err);
      console.warn("Failed to delete share");
    }
    setMenuAnchorEl(null);
    setSelectedFeedItem(null);
  };

  const handleAddComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    try {
      const res = await api.post(`/comments/${postId}/add`, { content: text }, { withCredentials: true });
      setFeed(feed.map((item) => {
        const targetPost = item.type === "POST" ? item : item.originalPost;
        if (targetPost.postId === postId) {
          if (item.type === "POST") {
            return { ...item, comments: [...(item.comments || []), res.data] };
          } else {
            return { ...item, originalPost: { ...item.originalPost, comments: [...(item.originalPost.comments || []), res.data] } };
          }
        }
        return item;
      }));
      setCommentText({ ...commentText, [postId]: "" });
    } catch (err) {
      console.error(err);
      console.warn("Failed to add comment");
    }
  };

  const handleAddReply = async (postId, parentCommentId, replyContent) => {
    try {
      const res = await api.post(
        `/comments/${postId}/reply/${parentCommentId}`,
        { content: replyContent },
        { withCredentials: true }
      );
      setFeed(feed.map((item) => {
        const targetPost = item.type === "POST" ? item : item.originalPost;
        if (targetPost.postId === postId) {
          const updatedComments = addReplyRecursive(targetPost.comments, parentCommentId, res.data);
          if (item.type === "POST") {
            return { ...item, comments: updatedComments };
          } else {
            return { ...item, originalPost: { ...item.originalPost, comments: updatedComments } };
          }
        }
        return item;
      }));
    } catch (err) {
      console.error(err);
      console.warn("Failed to add reply");
    }
  };

  const addReplyRecursive = (comments, parentId, reply) =>
    comments.map((c) => {
      if (c.commentId === parentId) {
        c.replies = [...(c.replies || []), reply];
      } else if (c.replies) {
        c.replies = addReplyRecursive(c.replies, parentId, reply);
      }
      return c;
    });

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await api.delete(`/comments/${commentId}/delete`, { withCredentials: true });
      setFeed(feed.map((item) => {
        const targetPost = item.type === "POST" ? item : item.originalPost;
        if (targetPost.postId === postId) {
          const updatedComments = deleteCommentRecursive(targetPost.comments, commentId);
          if (item.type === "POST") {
            return { ...item, comments: updatedComments };
          } else {
            return { ...item, originalPost: { ...item.originalPost, comments: updatedComments } };
          }
        }
        return item;
      }));
    } catch (err) {
      console.error(err);
      console.warn("Failed to delete comment");
    }
  };

  const deleteCommentRecursive = (comments, commentId) =>
    comments
      .filter((c) => c.commentId !== commentId)
      .map((c) => ({ ...c, replies: c.replies ? deleteCommentRecursive(c.replies, commentId) : [] }));

  const handleReact = async (postId, type) => {
    try {
      await api.post(`/reactions/${postId}`, null, { params: { type }, withCredentials: true });
      const res = await api.get(`/reactions/${postId}/counts`, { withCredentials: true });
      setFeed(feed.map((item) => {
        if (item.type === "POST" && item.postId === postId) {
          return { ...item, reactions: res.data };
        }
        if (item.type === "SHARE" && item.originalPost?.postId === postId) {
          return { ...item, originalPost: { ...item.originalPost, reactions: res.data } };
        }
        return item;
      }));
    } catch (err) {
      console.error(err);
      console.warn("Failed to react");
    }
  };

  const handleReactionClick = (event, postId) => {
    setReactionAnchorEl(event.currentTarget);
    setSelectedPostId(postId);
  };

  const handleReactionClose = () => {
    setReactionAnchorEl(null);
    setSelectedPostId(null);
  };

  const handleReactionSelect = (type) => {
    if (selectedPostId) handleReact(selectedPostId, type);
    handleReactionClose();
  };

  // --- Share handler ---
  const handleSharePost = async () => {
    if (!sharingPostId) return;
    try {
      const response = await api.post(`/shares/${sharingPostId}/share`, { caption: shareCaption }, { withCredentials: true });
      const shareData = response.data; // ShareResponse from backend

      // Construct a new share item to prepend optimistically
      const newShareItem = {
        type: "SHARE",
        shareId: shareData.postId,               // The share's own ID
        sharedByName: shareData.sharedByName,
        shareCaption: shareData.caption,
        createdAt: new Date().toISOString(),
        originalPost: {
          postId: shareData.originalPostId,
          content: shareData.originalContent,
          imageUrl: shareData.originalImageUrl,
          authorName: shareData.originalAuthorName,
          comments: [],
          reactions: {},
        },
      };

      setFeed(prev => [newShareItem, ...prev]);

      setShareDialogOpen(false);
      setShareCaption("");
      setSharingPostId(null);

      // Optionally refetch feed to sync with server
      fetchFeed();
    } catch (err) {
      console.error("Share failed", err);
      console.warn("Failed to share post");
    }
  };

  // --- Facebook-style Comment component (nested indentation) ---
  const Comment = ({ comment, postId, depth = 0 }) => {
    const [reply, setReply] = useState("");
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    const handleMenuOpen = (event) => setMenuAnchorEl(event.currentTarget);
    const handleMenuClose = () => setMenuAnchorEl(null);

    const handleDelete = async () => {
      await handleDeleteComment(postId, comment.commentId);
      handleMenuClose();
    };

    const maxIndent = 4; // limit indentation depth
    const indent = Math.min(depth, maxIndent) * 3; // each level adds 24px left margin

    return (
      <Box sx={{ ml: indent, mt: 1 }}>
        <Box display="flex" alignItems="flex-start" gap={1}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: "#2196f3", fontSize: 14 }}>
            {comment.authorName?.charAt(0) || "U"}
          </Avatar>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: "#f9f9f9",
                  borderRadius: 2,
                  display: "inline-block",
                  maxWidth: "calc(100% - 40px)",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ color: "#2196f3" }}>
                  {comment.authorName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#333", wordBreak: "break-word" }}>
                  {comment.content}
                </Typography>
              </Paper>
              {comment.authorId === user?.userId && (
                <>
                  <IconButton size="small" onClick={handleMenuOpen} sx={{ color: "rgba(0,0,0,0.3)" }}>
                    <MoreHoriz fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{ sx: { bgcolor: "#fff", color: "#333", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}
                  >
                    <MenuItem onClick={handleDelete} sx={{ color: "#f44336" }}>
                      <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={2} mt={0.5}>
              <Button
                size="small"
                onClick={() => setReply(reply ? "" : "replying")}
                sx={{ color: "#2196f3", minWidth: 0, p: 0 }}
              >
                Reply
              </Button>
            </Box>
            {reply !== "" && (
              <Box display="flex" gap={1} mt={1}>
                <TextField
                  size="small"
                  placeholder="Write a reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  sx={{
                    flex: 1,
                    input: { color: "#333" },
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
                      "&:hover fieldset": { borderColor: "#2196f3" },
                    },
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    if (!reply.trim()) return;
                    handleAddReply(postId, comment.commentId, reply);
                    setReply("");
                  }}
                  sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}
                >
                  Send
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        {(comment.replies || []).map((r) => (
          <Comment key={r.commentId} comment={r} postId={postId} depth={depth + 1} />
        ))}
      </Box>
    );
  };

  if (error) return <Alert severity="error" sx={{ bgcolor: "#fff", color: "#333", border: "1px solid #f44336", maxWidth: 600, mx: "auto", mt: 4 }}>{error}</Alert>;
  if (!user || loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress sx={{ color: "#2196f3" }} /></Box>;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#faf7f2" }}>
      {/* Top Bar with Navigation and AgroLink Hub */}
      <Paper
        elevation={0}
        sx={{
          py: 1,
          px: 2,
          bgcolor: "#fff",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Container maxWidth="xl">
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={() => navigate("/home")} sx={{ color: "#2196f3" }}>
                <HomeIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={600} sx={{ color: "#2196f3" }}>
                AgroLink Hub
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button startIcon={<Person />} onClick={() => navigate("/profile")} sx={{ color: "#e91e63" }}>Profile</Button>
              <Button startIcon={<RateReview />} onClick={() => navigate("/review")} sx={{ color: "#2196f3" }}>Reviews</Button>
              <Button startIcon={<Support />} onClick={() => navigate("/supportUser")} sx={{ color: "#2196f3" }}>Support</Button>
              <Button startIcon={<Notifications />} onClick={() => navigate("/notifications")} sx={{ color: "#2196f3" }}>Notifications</Button>
              <Button startIcon={<People />} onClick={() => navigate("/friend")} sx={{ color: "#2196f3" }}>Friends</Button>
            </Stack>
          </Box>
        </Container>
      </Paper>

      {/* Three-Column Layout */}
      <Container maxWidth="xl" sx={{ mt: 3, px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2}>
          {/* Left Sidebar - Search Users */}
          <Grid item xs={12} md={3}>
            <Paper
              elevation={4}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid rgba(0,0,0,0.05)",
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                position: "sticky",
                top: 80,
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ color: "#e91e63", mb: 2 }}>
                Find People
              </Typography>
              <Box sx={{ display: "flex", mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  sx={{
                    input: { color: "#333" },
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
                      "&:hover fieldset": { borderColor: "#e91e63" },
                      "&.Mui-focused fieldset": { borderColor: "#e91e63" },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSearch}
                  disabled={searchLoading}
                  sx={{ ml: 1, bgcolor: "#e91e63", "&:hover": { bgcolor: "#c2185b" } }}
                >
                  Go
                </Button>
              </Box>

              {searchLoading && <CircularProgress size={24} sx={{ color: "#2196f3", display: "block", mx: "auto", my: 2 }} />}
              {searchError && <Alert severity="error" sx={{ mb: 2, bgcolor: "#fff", color: "#333", border: "1px solid #f44336" }}>{searchError}</Alert>}

              {searchResults.length > 0 && (
                <List sx={{ p: 0 }}>
                  {searchResults.map((userResult) => (
                    <ListItem
                      key={userResult.userId}
                      disableGutters
                      sx={{ px: 0, py: 1, borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: "#333" }}>
                            {userResult.userId === user.userId ? "You" : `${userResult.firstName} ${userResult.lastName}`}
                          </Typography>
                        }
                      />
                      {userResult.userId !== user.userId && (
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Button
                            size="small"
                            variant={userResult.isFollowing ? "outlined" : "contained"}
                            onClick={() => handleFollowToggle(userResult.userId, userResult.isFollowing)}
                            disabled={processingIds.includes(userResult.userId)}
                            sx={{
                              minWidth: 60,
                              ...(userResult.isFollowing
                                ? { borderColor: "#2196f3", color: "#2196f3", "&:hover": { borderColor: "#1976d2", backgroundColor: alpha("#2196f3", 0.08) } }
                                : { bgcolor: "#e91e63", color: "#fff", "&:hover": { bgcolor: "#c2185b" } }
                              ),
                            }}
                          >
                            {userResult.isFollowing ? "Unfollow" : "Follow"}
                          </Button>
                          {userResult.requestSent ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleCancelRequest(userResult.userId)}
                              disabled={processingIds.includes(userResult.userId)}
                              sx={{ borderColor: "#ff9800", color: "#ff9800", minWidth: 70 }}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleAddFriend(userResult.userId)}
                              disabled={processingIds.includes(userResult.userId)}
                              sx={{ bgcolor: "#e91e63", color: "#fff", minWidth: 70, "&:hover": { bgcolor: "#c2185b" } }}
                            >
                              Add
                            </Button>
                          )}
                        </Box>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
              {searchResults.length === 0 && searchQuery && !searchLoading && !searchError && (
                <Typography variant="body2" sx={{ color: "#666", textAlign: "center", py: 2 }}>
                  No users found.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Center - Feed */}
          <Grid item xs={12} md={6}>
            {/* Welcome Message */}
            <Paper
              elevation={4}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography variant="h5" fontWeight={600} sx={{ color: "#e91e63" }}>
                Welcome, {user.firstName || user.userName || "User"}!
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {welcomeMessage || "Share your thoughts with the community."}
              </Typography>
            </Paper>

            {/* Create Post Card */}
            <Paper
              elevation={4}
              sx={{
                p: 2,
                mb: 4,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ color: "#e91e63", mb: 2 }}>
                Create Post
              </Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{
                  mb: 2,
                  textarea: { color: "#333" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
                    "&:hover fieldset": { borderColor: "#2196f3" },
                    "&.Mui-focused fieldset": { borderColor: "#2196f3" },
                  },
                }}
              />
              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  sx={{ borderColor: "#2196f3", color: "#2196f3", "&:hover": { borderColor: "#1976d2", backgroundColor: alpha("#2196f3", 0.08) } }}
                >
                  Add Image
                  <input type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files[0])} />
                </Button>
                {image && (
                  <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.5)" }}>
                    {image.name}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  onClick={handleCreatePost}
                  sx={{ bgcolor: "#e91e63", "&:hover": { bgcolor: "#c2185b" }, ml: "auto" }}
                >
                  Post
                </Button>
              </Box>
            </Paper>

            {/* Feed */}
            <Typography variant="h5" fontWeight={600} sx={{ color: "#e91e63", mb: 2 }}>
              Feed
            </Typography>
            {feed.length === 0 && !loading && (
              <Paper sx={{ p: 4, textAlign: "center", bgcolor: "#fff", borderRadius: 3, border: "1px solid rgba(0,0,0,0.05)" }}>
                <Typography sx={{ color: "#666" }}>No posts or shares yet</Typography>
              </Paper>
            )}
            {feed.map((item) => {
              // For shares, the original post holds comments and reactions
              const postForComments = item.type === "POST" ? item : item.originalPost;
              const postIdForComments = postForComments.postId;
              const comments = postForComments.comments || [];
              const reactions = postForComments.reactions || {};
              const reactionEntries = Object.entries(reactions);
              const topEntry = reactionEntries.sort((a, b) => b[1] - a[1])[0];
              const topReactionType = topEntry ? topEntry[0] : null;
              const topReactionCount = topEntry ? topEntry[1] : 0;

              return (
                <Card
                  key={`${item.type}-${item.postId || item.shareId}`}
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: "#fff",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <CardContent>
                    {/* Header */}
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        src={item.authorProfilePic ? backendBaseUrl + item.authorProfilePic : undefined}
                        sx={{ bgcolor: "#2196f3" }}
                      >
                        {!item.authorProfilePic && (item.authorName?.charAt(0) || "U")}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#e91e63" }}>
                          {item.type === "POST" ? item.authorName : item.sharedByName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.4)" }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
                        </Typography>
                      </Box>
                      {/* Three-dot menu - visible only for user's own posts/shares */}
                      {(item.type === "POST" && item.authorId === user.userId) ||
                       (item.type === "SHARE" && item.sharedByName === `${user.firstName} ${user.lastName}`) ? (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchorEl(e.currentTarget);
                            setSelectedFeedItem({
                              id: item.type === "POST" ? item.postId : item.shareId,
                              type: item.type,
                            });
                          }}
                          sx={{ color: "rgba(0,0,0,0.3)" }}
                        >
                          <MoreHoriz />
                        </IconButton>
                      ) : null}
                    </Box>

                    {/* Share caption (if SHARE) - changed color to gray */}
                    {item.type === "SHARE" && item.shareCaption && (
                      <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                        "{item.shareCaption}"
                      </Typography>
                    )}

                    {/* Original post content (if SHARE) */}
                    {item.type === "SHARE" && (
                      <Box
                        sx={{
                          border: "1px solid rgba(0,0,0,0.05)",
                          borderRadius: 2,
                          p: 2,
                          bgcolor: "#f9f9f9",
                          mb: 2,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ color: "#2196f3" }}>
                          {item.originalPost.authorName}
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#333", whiteSpace: "pre-wrap" }}>
                          {item.originalPost.content}
                        </Typography>
                        {item.originalPost.imageUrl && (
                          <Box
                            component="img"
                            src={`${backendBaseUrl}${item.originalPost.imageUrl}`}
                            alt="original post"
                            sx={{
                              width: "100%",
                              maxHeight: 400,
                              objectFit: "cover",
                              borderRadius: 2,
                              mt: 1,
                            }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Regular post content */}
                    {item.type === "POST" && (
                      <>
                        <Typography variant="body1" sx={{ color: "#333", mb: 2, whiteSpace: "pre-wrap" }}>
                          {item.content}
                        </Typography>
                        {item.imageUrl && (
                          <Box
                            component="img"
                            src={`${backendBaseUrl}${item.imageUrl}`}
                            alt="post"
                            sx={{
                              width: "100%",
                              maxHeight: 400,
                              objectFit: "cover",
                              borderRadius: 2,
                              mb: 2,
                            }}
                          />
                        )}
                      </>
                    )}

                    {/* Top Reaction Display */}
                    {topReactionType && (
                      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {reactionIcons[topReactionType]}
                          <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.6)" }}>
                            {topReactionCount}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ThumbUp />}
                        onClick={(e) => handleReactionClick(e, postIdForComments)}
                        sx={{ borderColor: "#2196f3", color: "#2196f3", "&:hover": { borderColor: "#1976d2", backgroundColor: alpha("#2196f3", 0.08) } }}
                      >
                        Like
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Share />}
                        onClick={() => {
                          setSharingPostId(postIdForComments);
                          setShareDialogOpen(true);
                        }}
                        sx={{ borderColor: "#4caf50", color: "#4caf50", "&:hover": { borderColor: "#388e3c", backgroundColor: alpha("#4caf50", 0.08) } }}
                      >
                        Share
                      </Button>
                    </Box>

                    {/* Comments Section */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: "#2196f3", mb: 1 }}>
                        Comments
                      </Typography>
                      {comments.map((c) => (
                        <Comment key={c.commentId} comment={c} postId={postIdForComments} depth={0} />
                      ))}
                      <Box display="flex" gap={1} mt={2}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Write a comment..."
                          value={commentText[postIdForComments] || ""}
                          onChange={(e) => setCommentText({ ...commentText, [postIdForComments]: e.target.value })}
                          sx={{
                            input: { color: "#333" },
                            "& .MuiOutlinedInput-root": {
                              "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
                              "&:hover fieldset": { borderColor: "#2196f3" },
                              "&.Mui-focused fieldset": { borderColor: "#2196f3" },
                            },
                          }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAddComment(postIdForComments)}
                          sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}
                        >
                          Post
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Grid>

          {/* Right Sidebar - Notifications */}
          <Grid item xs={12} md={3}>
            <Paper
              elevation={4}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "#fff",
                border: "1px solid rgba(0,0,0,0.05)",
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                position: "sticky",
                top: 80,
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ color: "#e91e63", mb: 2 }}>
                Notifications
              </Typography>
              {notificationsLoading ? (
                <CircularProgress size={24} sx={{ color: "#2196f3", display: "block", mx: "auto", my: 2 }} />
              ) : notificationsError ? (
                <Alert severity="error" sx={{ bgcolor: "#fff", color: "#333", border: "1px solid #f44336" }}>{notificationsError}</Alert>
              ) : notifications.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#666", textAlign: "center", py: 2 }}>
                  No notifications yet.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {notifications.map((notif, index) => (
                    <React.Fragment key={notif.userId}>
                      <ListItem
                        alignItems="flex-start"
                        disableGutters
                        sx={{ px: 0, py: 1 }}
                      >
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: notif.type === "follower" ? "#2196f3" : "#ff9800",
                              fontSize: 14,
                            }}
                          >
                            {getInitials(notif.firstName, notif.lastName)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={500} sx={{ color: "#333" }}>
                              {notif.firstName} {notif.lastName}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: "#666" }}>
                              {notif.type === "follower"
                                ? notif.isFollowing
                                  ? "Follows you · You follow back"
                                  : "Follows you"
                                : "You follow them"}
                            </Typography>
                          }
                        />
                        {notif.type === "follower" && (
                          <Button
                            size="small"
                            variant={notif.isFollowing ? "outlined" : "contained"}
                            onClick={() => handleFollowToggle(notif.userId, notif.isFollowing)}
                            disabled={processingIds.includes(notif.userId)}
                            sx={{
                              minWidth: 70,
                              ...(notif.isFollowing
                                ? { borderColor: "#2196f3", color: "#2196f3", "&:hover": { borderColor: "#1976d2", backgroundColor: alpha("#2196f3", 0.08) } }
                                : { bgcolor: "#e91e63", color: "#fff", "&:hover": { bgcolor: "#c2185b" } }
                              ),
                            }}
                          >
                            {notif.isFollowing ? "Unfollow" : "Follow Back"}
                          </Button>
                        )}
                      </ListItem>
                      {index < notifications.length - 1 && (
                        <Divider sx={{ bgcolor: "rgba(0,0,0,0.05)" }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Reaction Popover */}
      <Popover
        open={Boolean(reactionAnchorEl)}
        anchorEl={reactionAnchorEl}
        onClose={handleReactionClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{
          sx: {
            bgcolor: "#fff",
            borderRadius: 4,
            p: 1,
            display: "flex",
            gap: 1,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.05)",
          },
        }}
      >
        {reactionTypes.map((type) => (
          <IconButton key={type} onClick={() => handleReactionSelect(type)} sx={{ p: 1 }}>
            {reactionIcons[type]}
          </IconButton>
        ))}
      </Popover>

      {/* Feed Item Menu (three-dot) */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => {
          setMenuAnchorEl(null);
          setSelectedFeedItem(null);
        }}
        PaperProps={{ sx: { bgcolor: "#fff", color: "#333", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}
      >
        {selectedFeedItem?.type === "POST" && (
          <MenuItem onClick={() => handleDeletePost(selectedFeedItem.id)} sx={{ color: "#f44336" }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Post
          </MenuItem>
        )}
        {selectedFeedItem?.type === "SHARE" && (
          <MenuItem onClick={() => handleDeleteShare(selectedFeedItem.id)} sx={{ color: "#f44336" }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Share
          </MenuItem>
        )}
      </Menu>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} PaperProps={{ sx: { bgcolor: "#fff", borderRadius: 4 } }}>
        <DialogTitle sx={{ color: "#e91e63" }}>Share Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Caption (optional)"
            fullWidth
            variant="outlined"
            value={shareCaption}
            onChange={(e) => setShareCaption(e.target.value)}
            sx={{ input: { color: "#333" } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)} sx={{ color: "#333" }}>Cancel</Button>
          <Button onClick={handleSharePost} variant="contained" sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}>
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
