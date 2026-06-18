// src/components/ProfilePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Fade,
  Zoom,
  TextField,
  Stack,
  IconButton,
  Card,
  CardContent,
  Popover,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Home as HomeIcon,
  Phone,
  AlternateEmail,
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
  Edit,
  Close,
  Share,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import api from "/src/legacy/api";

const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

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

export default function ProfilePage() {
  const navigate = useNavigate();

  // --- User & Profile State ---
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    profileImageUrl: "",
    coverImageUrl: "",
    email: "",
    phoneNumber: "",
    role: "",
    userId: null,
  });

   const handleHomeClick = () => {
    if (user.role === "ROLE_ADMIN") navigate("/dashboard");
    else navigate("/home");
  };
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState("");

  // --- Follower & Following Counts ---
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // --- Followers/Following Lists and Dialogs ---
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState([]);

  // --- Settings Forms ---
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [nameForm, setNameForm] = useState({ name: "", lastName: "" });
  const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteForm, setDeleteForm] = useState({ currentPassword: "" });

  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // --- Feed State (merged posts & shares) ---
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [commentText, setCommentText] = useState({});

  // --- Share Dialog State ---
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareCaption, setShareCaption] = useState("");
  const [sharingPostId, setSharingPostId] = useState(null);

  // --- Reaction Popover State ---
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // --- Feed Item Menu State (for three‑dot delete) ---
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedFeedItem, setSelectedFeedItem] = useState(null); // { id, type }

  const reactionTypes = ["like", "love", "care", "haha", "wow", "sad", "angry"];

  // Helper to build full name for matching
  const getCurrentUserFullName = () => {
    return `${user.firstName} ${user.lastName}`.trim();
  };

  // --- Helper: fetch followers and following lists and counts ---
  const fetchFollowers = async () => {
    try {
      const res = await api.get("/follow/followers", { withCredentials: true });
      setFollowers(res.data);
    } catch (err) {
      console.error("Failed to fetch followers", err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await api.get("/follow/following", { withCredentials: true });
      setFollowing(res.data);
    } catch (err) {
      console.error("Failed to fetch following", err);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        api.get("/follow/followers/count", { withCredentials: true }),
        api.get("/follow/following/count", { withCredentials: true }),
      ]);
      setFollowersCount(followersRes.data);
      setFollowingCount(followingRes.data);
    } catch (err) {
      console.error("Failed to fetch follow counts", err);
    }
  };

  const refreshFollowData = async () => {
    await Promise.all([fetchFollowers(), fetchFollowing(), fetchFollowCounts()]);
  };

  // --- Fetch Feed (posts + shares) ---
  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      // 1. Fetch user's own posts
      const postsRes = await api.get("/posts/my", { withCredentials: true });

      // 2. Fetch shares – try dedicated endpoint, fallback to feed filtering
      let shares = [];
      try {
        const sharesRes = await api.get("/shares/my", { withCredentials: true });
        shares = sharesRes.data;
        console.log("Shares from /shares/my:", shares);
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 404) {
          console.warn("/shares/my not available, using /shares/feed with filtering");
          try {
            const feedRes = await api.get("/shares/feed", { withCredentials: true });
            console.log("Feed response (full):", feedRes.data);

            if (user.userId && Array.isArray(feedRes.data)) {
              // Try multiple possible user ID fields
              shares = feedRes.data.filter((share) => {
                // Check various possible paths for user ID
                const sharerId =
                  share.sharedBy?.userId ||
                  share.sharedBy?.id ||
                  share.userId ||
                  share.sharerId;

                if (sharerId === user.userId) return true;

                // Fallback: match by name (if names are unique)
                const fullName = getCurrentUserFullName();
                if (share.sharedByName === fullName) {
                  console.warn("Matched share by name (unreliable):", share);
                  return true;
                }
                return false;
              });
              console.log("Filtered shares (by userId/name):", shares);
            } else {
              shares = [];
            }
          } catch (feedErr) {
            console.error("Failed to fetch shares feed", feedErr);
          }
        } else {
          console.warn("Failed to fetch shares:", err.message);
        }
      }



      // Enrich posts with comments and reactions
      const postItems = await Promise.all(
        postsRes.data.map(async (post) => {
          let comments = [];
          try {
            const commentsRes = await api.get(`/comments/${post.postId}/all`, { withCredentials: true });
            comments = commentsRes.data;
          } catch {}
          let reactions = {};
          try {
            const reactionsRes = await api.get(`/reactions/${post.postId}/counts`);
            reactions = reactionsRes.data;
          } catch {}
          return { ...post, type: "POST", comments, reactions };
        })
      );

      // Enrich shares with original post's comments and reactions
      const shareItems = await Promise.all(
        shares.map(async (share) => {
          // Use flat fields if originalPost is not nested
          const originalPostId = share.originalPostId || share.postId;
          const originalContent = share.originalContent || share.content;
          const originalImageUrl = share.originalImageUrl || share.imageUrl;
          const originalAuthorName = share.originalAuthorName || share.authorName;

          let comments = [];
          let reactions = {};
          if (originalPostId) {
            try {
              const commentsRes = await api.get(`/comments/${originalPostId}/all`, { withCredentials: true });
              comments = commentsRes.data;
            } catch {}
            try {
              const reactionsRes = await api.get(`/reactions/${originalPostId}/counts`);
              reactions = reactionsRes.data;
            } catch {}
          }

          // Use sharedAt for sorting if createdAt is missing
          const createdAt = share.sharedAt || share.createdAt || new Date().toISOString();

          return {
            ...share,
            type: "SHARE",
            shareId: share.postId || share.shareId, // share's own ID
            sharedByName: share.sharedByName || share.authorName,
            shareCaption: share.caption || share.shareCaption,
            createdAt, // for sorting
            originalPost: {
              postId: originalPostId,
              content: originalContent,
              imageUrl: originalImageUrl,
              authorName: originalAuthorName,
              comments,
              reactions,
            },
          };
        })
      );

      // Merge and sort by createdAt descending (newest first)
      const allItems = [...postItems, ...shareItems].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      console.log("Final feed items:", allItems);
      setFeed(allItems);
    } catch (err) {
      console.error("Failed to load feed", err);
      console.warn("Failed to load feed");
    } finally {
      setLoadingFeed(false);
    }
  };

  // --- Fetch Profile & Counts ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/me", { withCredentials: true });
        const data = res.data;
        setUser({
          firstName: data.firstName || data.name || "",
          lastName: data.lastName || "",
          userName: data.userName || data.username || "",
          profileImageUrl: data.profileImageUrl || "",
          coverImageUrl: data.coverImageUrl || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          role: data.role || "",
          userId: data.userId || data.id,
        });
        setNameForm({
          name: data.firstName || "",
          lastName: data.lastName || "",
        });

        await fetchFollowCounts();
      } catch (err) {
        if (err.response?.status === 401) navigate("/login");
        else setErrorProfile("Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch feed once user ID is available
  useEffect(() => {
    if (user.userId) {
      fetchFeed();
    }
  }, [user.userId]);

  // --- Followers/Following handlers ---
  const handleFollow = async (userId) => {
    if (processingIds.includes(userId)) return;
    setProcessingIds(prev => [...prev, userId]);
    try {
      await api.post(`/follow/${userId}/follow`, {}, { withCredentials: true });
      await refreshFollowData();
    } catch (err) {
      console.error(err);
      console.warn(err.response?.data?.message || "Follow failed");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleUnfollow = async (userId) => {
    if (processingIds.includes(userId)) return;
    setProcessingIds(prev => [...prev, userId]);
    try {
      await api.delete(`/follow/${userId}/unfollow`, { withCredentials: true });
      await refreshFollowData();
    } catch (err) {
      console.error(err);
      console.warn(err.response?.data?.message || "Unfollow failed");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== userId));
    }
  };

  // --- Dialog open handlers ---
  const handleShowFollowers = async () => {
    await fetchFollowers();
    setFollowersOpen(true);
  };

  const handleShowFollowing = async () => {
    await fetchFollowing();
    setFollowingOpen(true);
  };

  // --- API Handlers (unchanged) ---
  const handleResponse = (res, redirectLogin = false) => {
    setMessage(res.data?.message || "Success");
    setError("");
    if (redirectLogin) setTimeout(() => navigate("/login"), 1500);
  };
  const handleError = (err) => {
    setError(err.response?.data?.message || "Something went wrong");
    setMessage("");
  };

  const updateName = async () => {
    setLoading(true);
    try {
      const res = await api.put("/user/update-name", nameForm, { withCredentials: true });
      handleResponse(res);
      setUser({ ...user, firstName: nameForm.name, lastName: nameForm.lastName });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const requestEmailUpdate = async () => {
    setLoading(true);
    try {
      const res = await api.put("/user/update-email", { newEmail: emailForm.newEmail }, { withCredentials: true });
      handleResponse(res);
    } catch (err) { handleError(err); } finally { setLoading(false); }
  };
  const verifyNewEmail = async () => {
    setLoading(true);
    try {
      const res = await api.post("/user/verify-new-email", null, { params: { otp: emailForm.otp }, withCredentials: true });
      handleResponse(res, true);
      setEmailDialogOpen(false);
    } catch (err) { handleError(err); } finally { setLoading(false); }
  };

  const updatePassword = async () => {
    setLoading(true);
    try {
      const res = await api.put("/user/update-password", passwordForm, { withCredentials: true });
      handleResponse(res, true);
      setPasswordDialogOpen(false);
    } catch (err) { handleError(err); } finally { setLoading(false); }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      const res = await api.delete("/user/delete", { data: deleteForm, withCredentials: true });
      handleResponse(res, true);
      setDeleteDialogOpen(false);
    } catch (err) { handleError(err); } finally { setLoading(false); }
  };

  const uploadProfileImage = async () => {
    if (!profileFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", profileFile);
    try {
      const res = await api.post("/user/upload-profile-image", formData, { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true });
      setMessage("Profile image uploaded!");
      setUser({ ...user, profileImageUrl: res.data });
      setProfileFile(null);
    } catch (err) { setError(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const uploadCoverImage = async () => {
    if (!coverFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", coverFile);
    try {
      const res = await api.post("/user/upload-cover-image", formData, { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true });
      setMessage("Cover image uploaded!");
      setUser({ ...user, coverImageUrl: res.data });
      setCoverFile(null);
    } catch (err) { setError(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  // --- Post Handlers ---
  const handleCreatePost = async () => {
    if (!content.trim() && !image) return console.warn("Post must have content or image");
    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);
    try {
      await api.post("/posts/create", formData, { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true });
      setContent("");
      setImage(null);
      await fetchFeed();
    } catch (err) {
      console.error(err);
      console.warn("Failed to create post");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/delete/${postId}`, { withCredentials: true });
      await fetchFeed();
    } catch (err) {
      console.error(err);
      console.warn("Failed to delete post");
    }
    setMenuAnchorEl(null);
    setSelectedFeedItem(null);
  };

  // --- Share Handlers ---
  const handleSharePost = async () => {
    if (!sharingPostId) return;
    try {
      const response = await api.post(`/shares/${sharingPostId}/share`, { caption: shareCaption }, { withCredentials: true });
      const shareData = response.data; // ShareResponse from backend

      // Transform the response into a feed item and prepend it
      const newShareItem = {
        type: "SHARE",
        shareId: shareData.postId, // The response uses postId for shareId
        sharedByName: shareData.sharedByName,
        shareCaption: shareData.caption,
        createdAt: new Date().toISOString(), // Use current time
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

      // Optionally refetch in background to sync with server
      fetchFeed();
    } catch (err) {
      console.error("Share failed", err);
      if (err.response) {
        console.error("Server response:", err.response.data);
        console.warn(`Share failed: ${err.response.data.message || err.response.status}`);
      } else {
        console.warn("Failed to share post");
      }
    }
  };

  const handleDeleteShare = async (shareId) => {
    try {
      await api.delete(`/shares/${shareId}`, { withCredentials: true });
      // Remove from local state immediately
      setFeed(prev => prev.filter(item => !(item.type === "SHARE" && item.shareId === shareId)));
      // Also refetch to ensure consistency
      await fetchFeed();
    } catch (err) {
      console.error(err);
      console.warn("Failed to delete share");
    }
    setMenuAnchorEl(null);
    setSelectedFeedItem(null);
  };

  // --- Comment Handlers ---
  const handleAddComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    try {
      await api.post(`/comments/${postId}/add`, { content: text }, { withCredentials: true });
      await fetchFeed();
      setCommentText({ ...commentText, [postId]: "" });
    } catch (err) {
      console.error(err);
      console.warn("Failed to add comment");
    }
  };

  // --- Reaction Handlers ---
  const handleReact = async (postId, type) => {
    try {
      await api.post(`/reactions/${postId}`, null, { params: { type }, withCredentials: true });
      const res = await api.get(`/reactions/${postId}/counts`);
      setFeed(prev =>
        prev.map(item => {
          if (item.type === "POST" && item.postId === postId) {
            return { ...item, reactions: res.data };
          }
          if (item.type === "SHARE" && item.originalPost?.postId === postId) {
            return { ...item, originalPost: { ...item.originalPost, reactions: res.data } };
          }
          return item;
        })
      );
    } catch (err) {
      console.error(err);
      console.warn("Failed to react");
    }
  };

  // Reaction popover handlers
  const handleReactionClick = (event, postId) => {
    setReactionAnchorEl(event.currentTarget);
    setSelectedPostId(postId);
  };

  const handleReactionClose = () => {
    setReactionAnchorEl(null);
    setSelectedPostId(null);
  };

  const handleReactionSelect = (type) => {
    if (selectedPostId) {
      handleReact(selectedPostId, type);
    }
    handleReactionClose();
  };

  // --- Comment Component ---
  const Comment = ({ comment, postId }) => {
    const [reply, setReply] = useState("");
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
      setMenuAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
      setMenuAnchorEl(null);
    };

    const handleDeleteComment = async (commentId) => {
      try {
        await api.delete(`/comments/${commentId}/delete`, { withCredentials: true });
        await fetchFeed();
      } catch (err) {
        console.error(err);
        console.warn("Failed to delete comment");
      }
      handleMenuClose();
    };

    const handleAddReply = async (parentCommentId, replyContent) => {
      try {
        await api.post(`/comments/${postId}/reply/${parentCommentId}`, { content: replyContent }, { withCredentials: true });
        await fetchFeed();
        setReply("");
      } catch (err) {
        console.error(err);
        console.warn("Failed to add reply");
      }
    };

    return (
      <Box sx={{ ml: comment.parentComment ? 4 : 0, mt: 1 }}>
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
              <IconButton size="small" onClick={handleMenuOpen} sx={{ color: "rgba(0,0,0,0.3)" }}>
                <MoreHoriz fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { bgcolor: "#fff", color: "#333", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}
              >
                <MenuItem onClick={() => handleDeleteComment(comment.commentId)} sx={{ color: "#f44336" }}>
                  <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
                </MenuItem>
              </Menu>
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
                    handleAddReply(comment.commentId, reply);
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
          <Comment key={r.commentId} comment={r} postId={postId} />
        ))}
      </Box>
    );
  };

  if (loadingProfile) return <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "#faf7f2" }}><CircularProgress sx={{ color: "#e91e63" }} /></Box>;
  if (errorProfile) return <Alert severity="error" sx={{ bgcolor: "#fff", color: "#333", border: "1px solid #f44336" }}>{errorProfile}</Alert>;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#faf7f2", pb: 4 }}>
      {/* Top Bar */}
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
       <Container maxWidth="lg">
  <Box display="flex" alignItems="center" justifyContent="space-between">
    <Box display="flex" alignItems="center" gap={2}>
      <IconButton onClick={handleHomeClick}>
        <HomeIcon />
      </IconButton>
      <Typography variant="h6" fontWeight={600} sx={{ color: "#2196f3" }}>
        AgroLink Hub
      </Typography>
    </Box>
            <Typography variant="subtitle1" sx={{ color: "#e91e63", fontWeight: 500 }}>
              @{user.userName || user.firstName || "user"}
            </Typography>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Cover & Avatar */}
        <Zoom in timeout={600}>
          <Paper
            elevation={4}
            sx={{
              position: "relative",
              height: 250,
              borderRadius: 3,
              mb: 8,
            backgroundImage: user.coverImageUrl
      ? `url(${backendBaseUrl + user.coverImageUrl})`
      : "none",
    backgroundSize: "cover",
              backgroundPosition: "center",
              overflow: "visible",
              border: "1px solid rgba(0,0,0,0.1)",
              bgcolor: "#fff",
            }}
          >
            <Avatar
              src={user.profileImageUrl ? backendBaseUrl + user.profileImageUrl : undefined}
              sx={{
                width: 140,
                height: 140,
                position: "absolute",
                bottom: -70,
                left: "50%",
                transform: "translateX(-50%)",
                border: "4px solid #fff",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                fontSize: 56,
                bgcolor: "#2196f3",
              }}
            >
              {!user.profileImageUrl && (user.firstName?.charAt(0) || "U")}
            </Avatar>
          </Paper>
        </Zoom>

        {/* User Info Card */}
        <Fade in timeout={1000}>
          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#fff",
              border: "1px solid rgba(0,0,0,0.05)",
              textAlign: "center",
              mt: 2,
            }}
          >
            <Typography variant="h4" fontWeight={700} sx={{ color: "#333" }}>
              {user.firstName} {user.lastName}
            </Typography>
            {user.userName && (
              <Typography variant="subtitle1" sx={{ color: "#e91e63", mb: 1 }}>
                @{user.userName}
              </Typography>
            )}
            <Chip
              label={user.role?.replace("ROLE_", "")}
              sx={{ mt: 1, bgcolor: alpha("#e91e63", 0.1), color: "#e91e63", borderColor: "#e91e63" }}
              variant="outlined"
              size="small"
            />
            <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 2, flexWrap: "wrap" }}>
              {user.email && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <AlternateEmail fontSize="small" sx={{ color: "rgba(0,0,0,0.4)" }} />
                  <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.7)" }}>{user.email}</Typography>
                </Box>
              )}
              {user.phoneNumber && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Phone fontSize="small" sx={{ color: "rgba(0,0,0,0.4)" }} />
                  <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.7)" }}>{user.phoneNumber}</Typography>
                </Box>
              )}
            </Box>

            {/* Followers & Following Stats */}
            <Stack direction="row" justifyContent="center" spacing={4} sx={{ mt: 3 }}>
              <Box textAlign="center" onClick={handleShowFollowers} sx={{ cursor: "pointer" }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#2196f3" }}>{followersCount}</Typography>
                <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.5)" }}>Followers</Typography>
              </Box>
              <Box textAlign="center" onClick={handleShowFollowing} sx={{ cursor: "pointer" }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#2196f3" }}>{followingCount}</Typography>
                <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.5)" }}>Following</Typography>
              </Box>
            </Stack>

            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate("/settings")}
                sx={{ bgcolor: "#e91e63", "&:hover": { bgcolor: "#c2185b" }, borderRadius: 20, px: 4 }}
              >
                Edit Profile
              </Button>
              <Button
  variant="outlined"
  color="error"
  onClick={() => {
    localStorage.clear(); // optional, clear any local storage
    navigate("/login");
  }}
  sx={{ borderRadius: 20, px: 4, borderColor: "#f44336", color: "#f44336" }}
>
  Logout
</Button>
            </Stack>
          </Paper>
        </Fade>

        {/* Create Post Card */}
        <Box sx={{ mt: 4 }}>
          <Paper
            elevation={4}
            sx={{
              p: 2,
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
                  "&:hover fieldset": { borderColor: "#e91e63" },
                  "&.Mui-focused fieldset": { borderColor: "#e91e63" },
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
                sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" }, ml: "auto" }}
              >
                Post
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Feed Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" fontWeight={600} sx={{ color: "#e91e63", mb: 2 }}>
            My Activity
          </Typography>
          {loadingFeed ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress sx={{ color: "#2196f3" }} />
            </Box>
          ) : (
            feed.map((item) => {
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
                    {/* Header with three-dot menu */}
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        src={user.profileImageUrl ? backendBaseUrl + user.profileImageUrl : undefined}
                        sx={{ bgcolor: "#2196f3" }}
                      >
                        {!user.profileImageUrl && (user.firstName?.charAt(0) || "U")}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#2196f3" }}>
                          {item.type === "POST" ? item.authorName : item.sharedByName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.4)" }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
                        </Typography>
                      </Box>
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
                    </Box>

                    {/* Share caption (if SHARE) */}
                    {item.type === "SHARE" && item.shareCaption && (
                      <Typography variant="body2" sx={{ color: "#e91e63", fontStyle: "italic", mb: 1 }}>
                        "{item.shareCaption}"
                      </Typography>
                    )}

                    {/* Original post content */}
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
                            alt="post"
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

                    {/* Reactions */}
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

                    {/* Action Buttons: Like, Share */}
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
                        <Comment key={c.commentId} comment={c} postId={postIdForComments} />
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
            })
          )}
        </Box>
      </Container>

      {/* Followers Dialog */}
      <Dialog
        open={followersOpen}
        onClose={() => setFollowersOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { bgcolor: "#fff", borderRadius: 4 } }}
      >
        <DialogTitle sx={{ color: "#e91e63", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Followers
          <IconButton onClick={() => setFollowersOpen(false)} sx={{ color: "#999" }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {followers.length === 0 ? (
            <Typography sx={{ color: "#666", textAlign: "center", py: 2 }}>No followers yet.</Typography>
          ) : (
            <List>
              {followers.map((follower) => {
                const isFollowed = following.some(f => f.userId === follower.userId);
                return (
                  <ListItem key={follower.userId} disableGutters sx={{ py: 1 }}>
                    <ListItemText primary={`${follower.firstName} ${follower.lastName}`} />
                    {follower.userId !== user?.userId && !isFollowed && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleFollow(follower.userId)}
                        disabled={processingIds.includes(follower.userId)}
                        sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}
                      >
                        {processingIds.includes(follower.userId) ? "..." : "Follow"}
                      </Button>
                    )}
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog
        open={followingOpen}
        onClose={() => setFollowingOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { bgcolor: "#fff", borderRadius: 4 } }}
      >
        <DialogTitle sx={{ color: "#e91e63", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Following
          <IconButton onClick={() => setFollowingOpen(false)} sx={{ color: "#999" }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {following.length === 0 ? (
            <Typography sx={{ color: "#666", textAlign: "center", py: 2 }}>Not following anyone yet.</Typography>
          ) : (
            <List>
              {following.map((followedUser) => (
                <ListItem key={followedUser.userId} disableGutters sx={{ py: 1 }}>
                  <ListItemText primary={`${followedUser.firstName} ${followedUser.lastName}`} />
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleUnfollow(followedUser.userId)}
                    disabled={processingIds.includes(followedUser.userId)}
                    sx={{ borderColor: "#f44336", color: "#f44336" }}
                  >
                    {processingIds.includes(followedUser.userId) ? "..." : "Unfollow"}
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Feed Item Menu (three-dot) - only delete options */}
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

      {/* Settings Dialogs */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} PaperProps={{ sx: { bgcolor: "#fff", color: "#333", borderRadius: 4 } }}>
        <DialogTitle sx={{ color: "#e91e63" }}>Verify New Email</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#333" }}>Are you sure you want to update your email to {emailForm.newEmail}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} sx={{ color: "#333" }}>Cancel</Button>
          <Button onClick={verifyNewEmail} variant="contained" sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}>Verify</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} PaperProps={{ sx: { bgcolor: "#fff", color: "#333", borderRadius: 4 } }}>
        <DialogTitle sx={{ color: "#e91e63" }}>Update Password</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#333" }}>You will be logged out after updating your password.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)} sx={{ color: "#333" }}>Cancel</Button>
          <Button onClick={updatePassword} variant="contained" sx={{ bgcolor: "#2196f3", "&:hover": { bgcolor: "#1976d2" } }}>Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { bgcolor: "#fff", color: "#333", borderRadius: 4 } }}>
        <DialogTitle sx={{ color: "#f44336" }}>Delete Account</DialogTitle>
        <DialogContent>
          <Typography color="error" gutterBottom>This action cannot be undone!</Typography>
          <Typography sx={{ color: "#333" }}>All your data will be permanently deleted.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "#333" }}>Cancel</Button>
          <Button onClick={deleteAccount} variant="contained" color="error" sx={{ bgcolor: "#f44336", "&:hover": { bgcolor: "#d32f2f" } }}>Delete Permanently</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
