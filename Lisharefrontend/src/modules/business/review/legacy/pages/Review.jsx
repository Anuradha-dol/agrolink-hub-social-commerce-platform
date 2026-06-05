// src/components/Review.jsx
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  Rating,
  Box,
  Avatar,
  IconButton,
  Fade,
  Zoom,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import RateReviewIcon from "@mui/icons-material/RateReview";
import api from "/src/legacy/api";

export default function Review() {
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("positive");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    try {
      const res = await api.get("/reviews/gets", { withCredentials: true });
      setReviews(res.data);
    } catch (err) {
      setError(err.response?.status === 403 ? "Not authorized" : "Failed to load reviews");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return setError("Comment cannot be empty");

    try {
      if (editingId) {
        const res = await api.put(`/reviews/${editingId}`, { comment, rating, status }, { withCredentials: true });
        setReviews((prev) => prev.map((r) => (r.id === editingId ? res.data : r)));
        console.warn("Updated ✅");
      } else {
        const res = await api.post("/reviews", { comment, rating, status }, { withCredentials: true });
        setReviews((prev) => [res.data, ...prev]);
        console.warn("Added ✅");
      }
      resetForm();
    } catch (err) {
      setError(err.response?.status === 403 ? "You can only modify your own reviews" : "Failed to save review");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reviews/${id}`, { withCredentials: true });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      console.warn("Deleted ✅");
    } catch {
      setError("Failed to delete");
    }
  };

  const handleEdit = (review) => {
    setEditingId(review.id);
    setComment(review.comment);
    setRating(review.rating);
    setStatus(review.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setComment("");
    setRating(5);
    setStatus("positive");
  };

  // Helper for status colors
  const getStatusColor = (status) => {
    if (status === "positive") return "#2e7d32";
    if (status === "neutral") return "#ed6c02";
    return "#d32f2f";
  };

  return (
    <Box
      sx={{
        bgcolor: "#faf7f2",
        minHeight: "100vh",
        py: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Header card with home button and AgroLink Hub branding */}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "#e91e63", width: 48, height: 48 }}>
              <RateReviewIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#e91e63" }}>
                My Reviews
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
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

        {/* Error Alert */}
        {error && (
          <Fade in={!!error}>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: "#fff",
                color: "#333",
                border: "1px solid #f44336",
                "& .MuiAlert-icon": { color: "#f44336" },
              }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Form Card */}
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 4,
            borderRadius: 3,
            bgcolor: "#fff",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: "#e91e63" }}>
            {editingId ? "Edit Review" : "Share Your Feedback"}
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Write your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <Rating
                value={rating}
                onChange={(e, v) => setRating(v || 5)}
                precision={1}
                sx={{
                  "& .MuiRating-iconFilled": { color: "#e91e63" },
                  "& .MuiRating-iconHover": { color: "#e91e63" },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: "#666" }}>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                  sx={{
                    color: "#333",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.1)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e91e63" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#e91e63" },
                    "& .MuiSvgIcon-root": { color: "#666" },
                  }}
                >
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                endIcon={<SendIcon />}
                sx={{
                  bgcolor: "#e91e63",
                  "&:hover": { bgcolor: "#c2185b" },
                  borderRadius: 30,
                  px: 4,
                }}
              >
                {editingId ? "Update" : "Submit"}
              </Button>
              {editingId && (
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={resetForm}
                  sx={{
                    borderColor: "#2196f3",
                    color: "#2196f3",
                    "&:hover": { borderColor: "#1976d2", backgroundColor: alpha("#2196f3", 0.08) },
                    borderRadius: 30,
                  }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Reviews List */}
        {reviews.length === 0 && !error ? (
          <Paper
            elevation={4}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              bgcolor: "#fff",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <Typography sx={{ color: "#666" }}>No reviews yet.</Typography>
          </Paper>
        ) : (
          reviews.map((r, idx) => (
            <Zoom in timeout={300 + idx * 100} key={r.id}>
              <Card
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  bgcolor: "#fff",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: "#2196f3" }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#e91e63" }}>
                        {r.username}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#999" }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2, color: "#333" }}>
                    {r.comment}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Rating
                      value={r.rating}
                      readOnly
                      size="small"
                      sx={{ "& .MuiRating-iconFilled": { color: "#e91e63" } }}
                    />
                    <Typography variant="caption" fontWeight={600} sx={{ color: getStatusColor(r.status) }}>
                      {r.status}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(r)}
                    sx={{ color: "#2196f3", "&:hover": { backgroundColor: alpha("#2196f3", 0.08) } }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(r.id)}
                    sx={{ color: "#f44336", "&:hover": { backgroundColor: alpha("#f44336", 0.08) } }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Zoom>
          ))
        )}
      </Container>
    </Box>
  );
}
