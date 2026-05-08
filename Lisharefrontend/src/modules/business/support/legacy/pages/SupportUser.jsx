// src/components/Support.jsx
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Box,
  Avatar,
  IconButton,
  Fade,
  Zoom,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LockIcon from "@mui/icons-material/Lock";
import HomeIcon from "@mui/icons-material/Home";
import api from "/src/legacy/api";

// Helper for status display (same as admin)
const getStatusInfo = (status) => {
  const upper = status?.toUpperCase() || "OPEN";
  switch (upper) {
    case "ANSWERED":
      return { icon: <CheckCircleIcon fontSize="inherit" />, label: "Answered", color: "#2e7d32" };
    case "CLOSED":
      return { icon: <LockIcon fontSize="inherit" />, label: "Closed", color: "#757575" };
    default:
      return { icon: <AccessTimeIcon fontSize="inherit" />, label: "Open", color: "#b76e00" };
  }
};

export default function Support() {
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyQuestions();
  }, []);

  const fetchMyQuestions = async () => {
    try {
      const res = await api.get("/support/my", { withCredentials: true });
      setQuestions(res.data);
    } catch {
      setError("Failed to load questions");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    try {
      const res = await api.post("/support", { question: questionText }, { withCredentials: true });
      setQuestions([res.data, ...questions]);
      setQuestionText("");
    } catch {
      setError("Failed to submit question");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/support/${id}`, { withCredentials: true });
      setQuestions(questions.filter((q) => q.id !== id));
    } catch {
      setError("Failed to delete");
    }
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "#e91e63", width: 48, height: 48 }}>
              <QuestionAnswerIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#e91e63" }}>
                My Support
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {questions.length} conversation{questions.length !== 1 ? "s" : ""}
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

        {/* Ask new question form */}
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
            Ask a new question
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Type your question here..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
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
              Submit
            </Button>
          </Box>
        </Paper>

        {/* Chat list */}
        {questions.length === 0 && !error ? (
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
            <Typography sx={{ color: "#666" }}>
              You haven't asked any questions yet.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {questions.map((q, index) => {
              const statusInfo = getStatusInfo(q.status);
              return (
                <Zoom in timeout={300 + index * 100} key={q.id}>
                  <Box>
                    {/* User question bubble (right) */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                      <Box sx={{ maxWidth: "70%", display: "flex", alignItems: "flex-end", gap: 1 }}>
                        <Paper
                          sx={{
                            p: 2,
                            borderRadius: "20px 20px 4px 20px",
                            bgcolor: alpha("#e91e63", 0.1),
                            border: "1px solid rgba(0,0,0,0.05)",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          }}
                        >
                          <Typography variant="body2" sx={{ color: "#333" }}>
                            {q.question}
                          </Typography>
                          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mt: 1 }}>
                            <Typography variant="caption" sx={{ color: "#999" }}>
                              {new Date(q.createdAt).toLocaleTimeString()}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(q.id)}
                              sx={{
                                color: "#f44336",
                                "&:hover": { backgroundColor: alpha("#f44336", 0.08) },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                        <Avatar sx={{ bgcolor: "#e91e63", width: 32, height: 32 }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      </Box>
                    </Box>

                    {/* Admin response bubble (left) if exists */}
                    {q.adminResponse && (
                      <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 1.5, mt: 1 }}>
                        <Avatar sx={{ bgcolor: "#ff9800", color: "#fff", width: 32, height: 32 }}>
                          <QuestionAnswerIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ maxWidth: "70%" }}>
                          <Paper
                            sx={{
                              p: 2,
                              borderRadius: "20px 20px 20px 4px",
                              bgcolor: "#f5f5f5",
                              border: "1px solid rgba(0,0,0,0.05)",
                            }}
                          >
                            <Typography variant="body2" sx={{ color: "#2196f3", mb: 1 }}>
                              {q.adminResponse}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  color: statusInfo.color,
                                }}
                              >
                                {statusInfo.icon}
                                <Typography variant="caption" fontWeight={600}>
                                  {statusInfo.label}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: "#999" }}>
                                {new Date(q.updatedAt).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          </Paper>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Zoom>
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
}