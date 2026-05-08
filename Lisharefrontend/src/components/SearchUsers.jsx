// src/components/SearchUsers.jsx
import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import api from "../api";
import { followUser, unfollowUser, searchUsers, getFollowing } from "../followApi";

export default function SearchUsers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [followingList, setFollowingList] = useState([]);
  const [processingIds, setProcessingIds] = useState([]);

  useEffect(() => {
    const fetchMeAndFollowing = async () => {
      try {
        const res = await api.get("/user/me", { withCredentials: true });
        setCurrentUserId(res.data.userId);

        const following = await getFollowing();
        setFollowingList(following.map(u => u.userId));
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user info");
      }
    };
    fetchMeAndFollowing();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchUsers(query);

      const pendingRes = await api.get("/api/friends/pending", { withCredentials: true });
      const pendingIds = pendingRes.data.map(u => u.userId);

      setResults(
        data.map((user) => ({
          ...user,
          isFollowing: followingList.includes(user.userId),
          isFriend: false,
          requestSent: pendingIds.includes(user.userId),
        }))
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (user) => {
    if (processingIds.includes(user.userId)) return;
    setProcessingIds(prev => [...prev, user.userId]);
    try {
      if (user.isFollowing) {
        await unfollowUser(user.userId);
        setFollowingList(prev => prev.filter(id => id !== user.userId));
      } else {
        await followUser(user.userId);
        setFollowingList(prev => [...prev, user.userId]);
      }

      setResults(prev =>
        prev.map(u => u.userId === user.userId ? { ...u, isFollowing: !u.isFollowing } : u)
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== user.userId));
    }
  };

  const handleAddFriend = async (user) => {
    if (processingIds.includes(user.userId)) return;
    setProcessingIds(prev => [...prev, user.userId]);
    try {
      await api.post(`/api/friends/${user.userId}/request`, {}, { withCredentials: true });
      setResults(prev => prev.map(u =>
        u.userId === user.userId ? { ...u, requestSent: true } : u
      ));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send friend request");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== user.userId));
    }
  };

  const handleCancelRequest = async (user) => {
    if (processingIds.includes(user.userId)) return;
    setProcessingIds(prev => [...prev, user.userId]);
    try {
      await api.delete(`/api/friends/${user.userId}/unfriend`, { withCredentials: true });
      setResults(prev => prev.map(u =>
        u.userId === user.userId ? { ...u, requestSent: false } : u
      ));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to cancel request");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== user.userId));
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#faf7f2",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: 600, margin: "0 auto", px: { xs: 2, sm: 3 } }}>
        {/* Header Card with Home Button */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
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
              Search Users
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Find and connect with people
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

        {/* Search Input */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <Box sx={{ display: "flex" }}>
            <TextField
              fullWidth
              label="Type a name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{
                input: { color: "#333" },
                label: { color: "#666" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
                  "&:hover fieldset": { borderColor: "#e91e63" },
                  "&.Mui-focused fieldset": { borderColor: "#e91e63" },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{
                ml: 2,
                bgcolor: "#e91e63",
                "&:hover": { bgcolor: "#c2185b" },
              }}
            >
              Search
            </Button>
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress sx={{ color: "#2196f3" }} />
          </Box>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
              bgcolor: "#fff",
              color: "#333",
              border: "1px solid #f44336",
              "& .MuiAlert-icon": { color: "#f44336" },
            }}
          >
            {error}
          </Alert>
        )}

        {!loading && !error && results.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              mt: 2,
              borderRadius: 3,
              bgcolor: "#fff",
              border: "1px solid rgba(0,0,0,0.05)",
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            <List>
              {results.map((user) => (
                <ListItem
                  key={user.userId}
                  divider
                  sx={{
                    borderColor: "rgba(0,0,0,0.05)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ color: "#333" }}>
                        {user.userId === currentUserId ? "You" : `${user.firstName} ${user.lastName}`}
                      </Typography>
                    }
                  />
                  {user.userId !== currentUserId && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {/* Follow/Unfollow */}
                      <Button
                        variant={user.isFollowing ? "outlined" : "contained"}
                        onClick={() => handleFollowToggle(user)}
                        disabled={processingIds.includes(user.userId)}
                        sx={
                          user.isFollowing
                            ? {
                                borderColor: "#2196f3",
                                color: "#2196f3",
                                "&:hover": { borderColor: "#1976d2", backgroundColor: alpha("#2196f3", 0.08) },
                              }
                            : {
                                bgcolor: "#e91e63",
                                color: "#fff",
                                "&:hover": { bgcolor: "#c2185b" },
                              }
                        }
                      >
                        {user.isFollowing ? "Unfollow" : "Follow"}
                      </Button>

                      {/* Add Friend / Cancel Request */}
                      {user.requestSent ? (
                        <Button
                          variant="outlined"
                          onClick={() => handleCancelRequest(user)}
                          disabled={processingIds.includes(user.userId)}
                          sx={{
                            borderColor: "#ff9800",
                            color: "#ff9800",
                            "&:hover": { borderColor: "#ed6c02", backgroundColor: alpha("#ff9800", 0.08) },
                          }}
                        >
                          Cancel Request
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => handleAddFriend(user)}
                          disabled={processingIds.includes(user.userId)}
                          sx={{
                            bgcolor: "#e91e63",
                            color: "#fff",
                            "&:hover": { bgcolor: "#c2185b" },
                          }}
                        >
                          Add Friend
                        </Button>
                      )}
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {!loading && !error && results.length === 0 && query && (
          <Typography sx={{ mt: 2, color: "#666", textAlign: "center" }}>
            No users found.
          </Typography>
        )}
      </Box>
    </Box>
  );
}