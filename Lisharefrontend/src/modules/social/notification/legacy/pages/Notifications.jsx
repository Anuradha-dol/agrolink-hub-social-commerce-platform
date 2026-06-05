// src/components/Notifications.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import api from "/src/legacy/api";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

// Helper to get initials
const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      // 1️⃣ Current user
      const userRes = await api.get("/user/me", { withCredentials: true });
      const userId = userRes.data.userId;
      setCurrentUserId(userId);

      // 2️⃣ Followers
      const followersRes = await api.get("/follow/followers", { withCredentials: true });
      const followers = followersRes.data; // [{ userId, firstName, lastName }]

      // 3️⃣ Following
      const followingRes = await api.get("/follow/following", { withCredentials: true });
      const following = followingRes.data; // [{ userId, firstName, lastName }]
      const followingIds = following.map(u => u.userId);

      // 4️⃣ Build notifications
      const notifList = followers.map(u => ({
        ...u,
        isFollower: true,
        isFollowing: followingIds.includes(u.userId),
        type: "follower",
      }));

      // Optional: also include users you are following who don't follow you back
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
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (notif) => {
    if (processingIds.includes(notif.userId)) return;

    setProcessingIds(prev => [...prev, notif.userId]);
    const currentlyFollowing = notif.isFollowing;

    // Optimistic UI
    setNotifications(prev =>
      prev.map(n => n.userId === notif.userId ? { ...n, isFollowing: !currentlyFollowing } : n)
    );

    try {
      if (currentlyFollowing) {
        await api.delete(`/follow/${notif.userId}/unfollow`, { withCredentials: true });
      } else {
        await api.post(`/follow/${notif.userId}/follow`, {}, { withCredentials: true });
      }
    } catch (err) {
      console.error(err);
      console.warn(err.response?.data?.message || "Action failed");

      // rollback
      setNotifications(prev =>
        prev.map(n => n.userId === notif.userId ? { ...n, isFollowing: currentlyFollowing } : n)
      );
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== notif.userId));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8, bgcolor: "#faf7f2", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#2196f3" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ maxWidth: 600, mx: "auto", mt: 4, bgcolor: "#fff", color: "#333", border: "1px solid #f44336" }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#faf7f2",
        minHeight: "100vh",
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Header Card with Home Button */}
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ color: "#e91e63" }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              See who's interacting with you
            </Typography>
          </Box>
          <IconButton
            component={RouterLink}
            to="/home"
            sx={{
              color: "#2196f3",
              "&:hover": { backgroundColor: alpha("#2196f3", 0.08) },
            }}
          >
            <HomeIcon />
          </IconButton>
        </Paper>

        {/* Notifications List Card */}
        <Paper
          elevation={4}
          sx={{
            borderRadius: 3,
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography sx={{ color: "#666" }}>No notifications yet.</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notif, index) => (
                <React.Fragment key={notif.userId}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      notif.type === "follower" && (
                        <Button
                          variant={notif.isFollowing ? "outlined" : "contained"}
                          onClick={() => handleFollowToggle(notif)}
                          disabled={processingIds.includes(notif.userId)}
                          size="small"
                          sx={
                            notif.isFollowing
                              ? {
                                  borderColor: "#2196f3",
                                  color: "#2196f3",
                                  "&:hover": {
                                    borderColor: "#1976d2",
                                    backgroundColor: alpha("#2196f3", 0.08),
                                  },
                                }
                              : {
                                  bgcolor: "#e91e63",
                                  color: "#fff",
                                  "&:hover": { bgcolor: "#c2185b" },
                                }
                          }
                        >
                          {notif.isFollowing ? "Unfollow" : "Follow Back"}
                        </Button>
                      )
                    }
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: 2,
                      "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: notif.type === "follower" ? "#2196f3" : "#ff9800",
                          color: "#fff",
                        }}
                      >
                        {getInitials(notif.firstName, notif.lastName)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="medium" sx={{ color: "#333" }}>
                          {notif.firstName} {notif.lastName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          {notif.type === "follower"
                            ? notif.isFollowing
                              ? "Follows you · You follow back"
                              : "Follows you"
                            : "You follow them"}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && (
                    <Divider sx={{ bgcolor: "rgba(0,0,0,0.05)" }} variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Notifications;
