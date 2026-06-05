// src/components/Friends.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import api from "/src/legacy/api";
import {
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Home as HomeIcon,
  PersonRemove as PersonRemoveIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchFriends();
    fetchPending();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await api.get("/api/friends/all", { withCredentials: true });
      setFriends(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get("/api/friends/pending", { withCredentials: true });
      setPending(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load pending requests");
    }
  };

  const handleAction = async (type, userId) => {
    if (processingIds.includes(userId)) return;
    setProcessingIds((prev) => [...prev, userId]);

    try {
      let res;
      switch (type) {
        case "accept":
          res = await api.post(`/api/friends/${userId}/accept`, {}, { withCredentials: true });
          break;
        case "reject":
          res = await api.post(`/api/friends/${userId}/reject`, {}, { withCredentials: true });
          break;
        case "unfriend":
          res = await api.delete(`/api/friends/${userId}/unfriend`, { withCredentials: true });
          break;
        default:
          break;
      }

      if (res?.status === 200) {
        fetchFriends();
        fetchPending();
      }
    } catch (err) {
      console.error(err);
      console.warn(err.response?.data?.message || "Action failed");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== userId));
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
      <Typography color="error" align="center" sx={{ mt: 8, color: "#f44336" }}>
        {error}
      </Typography>
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
              Friends
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Manage your connections
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

        {/* Tabs and Lists Card */}
        <Paper
          elevation={4}
          sx={{
            borderRadius: 3,
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={tab}
            onChange={(e, val) => setTab(val)}
            variant="fullWidth"
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              borderBottom: 1,
              borderColor: "rgba(0,0,0,0.05)",
              "& .MuiTab-root": { color: "#666" },
              "& .Mui-selected": { color: "#e91e63" },
              "& .MuiTabs-indicator": { backgroundColor: "#e91e63" },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>My Friends</span>
                  <Box
                    component="span"
                    sx={{
                      bgcolor: "#e91e63",
                      color: "#fff",
                      borderRadius: 10,
                      px: 1,
                      py: 0.5,
                      fontSize: "0.75rem",
                    }}
                  >
                    {friends.length}
                  </Box>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>Pending</span>
                  {pending.length > 0 && (
                    <Box
                      component="span"
                      sx={{
                        bgcolor: "#ff9800",
                        color: "#fff",
                        borderRadius: 10,
                        px: 1,
                        py: 0.5,
                        fontSize: "0.75rem",
                      }}
                    >
                      {pending.length}
                    </Box>
                  )}
                </Box>
              }
            />
          </Tabs>

          {/* Friends List */}
          {tab === 0 && (
            <List sx={{ p: 0 }}>
              {friends.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography sx={{ color: "#666" }}>
                    No friends yet. Start connecting!
                  </Typography>
                </Box>
              ) : (
                friends.map((friend, index) => (
                  <React.Fragment key={friend.userId}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Button
                          variant="outlined"
                          startIcon={<PersonRemoveIcon />}
                          onClick={() => handleAction("unfriend", friend.userId)}
                          disabled={processingIds.includes(friend.userId)}
                          size="small"
                          sx={{
                            borderColor: "#2196f3",
                            color: "#2196f3",
                            "&:hover": {
                              borderColor: "#1976d2",
                              backgroundColor: alpha("#2196f3", 0.08),
                            },
                          }}
                        >
                          Unfriend
                        </Button>
                      }
                      sx={{
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#2196f3", color: "#fff" }}>
                          {getInitials(friend.firstName, friend.lastName)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ color: "#333" }}>
                            {friend.firstName} {friend.lastName}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < friends.length - 1 && (
                      <Divider sx={{ bgcolor: "rgba(0,0,0,0.05)" }} variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))
              )}
            </List>
          )}

          {/* Pending Requests */}
          {tab === 1 && (
            <List sx={{ p: 0 }}>
              {pending.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography sx={{ color: "#666" }}>
                    No pending friend requests.
                  </Typography>
                </Box>
              ) : (
                pending.map((request, index) => (
                  <React.Fragment key={request.userId}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Button
                            variant="contained"
                            startIcon={<CheckIcon />}
                            onClick={() => handleAction("accept", request.userId)}
                            disabled={processingIds.includes(request.userId)}
                            size="small"
                            sx={{
                              bgcolor: "#e91e63",
                              color: "#fff",
                              "&:hover": { bgcolor: "#c2185b" },
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={() => handleAction("reject", request.userId)}
                            disabled={processingIds.includes(request.userId)}
                            size="small"
                            sx={{
                              borderColor: "#2196f3",
                              color: "#2196f3",
                              "&:hover": {
                                borderColor: "#1976d2",
                                backgroundColor: alpha("#2196f3", 0.08),
                              },
                            }}
                          >
                            Reject
                          </Button>
                        </Box>
                      }
                      sx={{
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#ff9800", color: "#fff" }}>
                          {getInitials(request.firstName, request.lastName)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ color: "#333" }}>
                            {request.firstName} {request.lastName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: "#666" }}>
                            Sent you a friend request
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < pending.length - 1 && (
                      <Divider sx={{ bgcolor: "rgba(0,0,0,0.05)" }} variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))
              )}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Friends;
