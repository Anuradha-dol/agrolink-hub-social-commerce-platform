import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Alert,
  Box,
  Avatar,
  IconButton,
  Fade,
  Zoom,
  Button,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import api from "../api";
import { useNavigate } from "react-router-dom";

// ================= BRAND COLORS =================
const ROSE = "#e91e63";
const BLUE = "#2196f3";
const CREAM_BG = "#faf7f2";

// ================= STYLED COMPONENTS =================
const ChatContainer = styled(Box)(({ theme }) => ({
  maxWidth: 900,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "isAdmin",
})(({ theme, isAdmin }) => ({
  padding: theme.spacing(2),
  borderRadius: isAdmin ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
  backgroundColor: isAdmin ? alpha(BLUE, 0.08) : "#ffffff",
  maxWidth: "70%",
  alignSelf: isAdmin ? "flex-end" : "flex-start",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: `1px solid ${alpha(isAdmin ? BLUE : ROSE, 0.2)}`,
}));

const StatusBadge = styled(Box)(({ theme, color }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  color: color,
  fontSize: "0.75rem",
  fontWeight: 600,
}));

const ResponseInput = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 30,
    backgroundColor: "#ffffff",
    "& fieldset": {
      borderColor: alpha(ROSE, 0.3),
    },
    "&:hover fieldset": {
      borderColor: ROSE,
    },
    "&.Mui-focused fieldset": {
      borderColor: BLUE,
    },
  },
}));

const SendButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: BLUE,
  color: "#fff",
  "&:hover": {
    backgroundColor: "#1976d2",
  },
  "&:disabled": {
    backgroundColor: "#ccc",
  },
}));

// ================= HELPER =================
const getStatusInfo = (status) => {
  const upper = status?.toUpperCase() || "OPEN";
  switch (upper) {
    case "ANSWERED":
      return {
        icon: <CheckCircleIcon fontSize="inherit" />,
        label: "Answered",
        color: "#2e7d32",
      };
    case "CLOSED":
      return {
        icon: <LockIcon fontSize="inherit" />,
        label: "Closed",
        color: "#757575",
      };
    case "OPEN":
    default:
      return {
        icon: <AccessTimeIcon fontSize="inherit" />,
        label: "Open",
        color: ROSE,
      };
  }
};

// ================= MAIN COMPONENT =================
export default function SupportAdmin() {
  const [questions, setQuestions] = useState([]);
  const [responseText, setResponseText] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllQuestions();
  }, []);

  const fetchAllQuestions = async () => {
    try {
      const res = await api.get("/support", { withCredentials: true });
      setQuestions(res.data);
    } catch {
      setError("Failed to load questions");
    }
  };

  const handleRespond = async (id) => {
    if (!responseText[id]?.trim()) return;
    try {
      const res = await api.put(
        `/support/${id}/respond`,
        { response: responseText[id] },
        { withCredentials: true }
      );
      setQuestions(questions.map((q) => (q.id === id ? res.data : q)));
      setResponseText({ ...responseText, [id]: "" });
    } catch {
      setError("Failed to respond");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
         linear-gradient(rgba(250,247,242,0.75), rgba(250,247,242,0.75)),
          url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        {/* Back to Home Button */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{
              borderRadius: 3,
              color: BLUE,
              borderColor: BLUE,
              "&:hover": {
                backgroundColor: alpha(BLUE, 0.08),
                borderColor: BLUE,
              },
            }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Avatar sx={{ bgcolor: ROSE, width: 56, height: 56, mr: 2 }}>
            <QuestionAnswerIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: BLUE }}>
              Bondly Support
            </Typography>
            <Typography variant="subtitle1" sx={{ color: ROSE }}>
              {questions.length} conversation{questions.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>

        {/* Error */}
        {error && (
          <Fade in={!!error}>
            <Alert
              severity="error"
              sx={{ mb: 4, borderRadius: 3 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Chat */}
        {questions.length === 0 && !error ? (
          <Paper
            elevation={3}
            sx={{
              p: 6,
              textAlign: "center",
              bgcolor: "#fff",
              borderRadius: 4,
            }}
          >
            <Typography variant="h6" sx={{ color: ROSE }}>
              No questions yet.
            </Typography>
          </Paper>
        ) : (
          <ChatContainer>
            {questions.map((q, index) => {
              const statusInfo = getStatusInfo(q.status);
              return (
                <Zoom in timeout={300 + index * 100} key={q.id}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {/* User Message */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: alpha(ROSE, 0.2), color: ROSE, mt: 1 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {q.username}
                          </Typography>
                          <StatusBadge color={statusInfo.color}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </StatusBadge>
                        </Box>
                        <MessageBubble>
                          <Typography variant="body2">{q.question}</Typography>
                        </MessageBubble>
                      </Box>
                    </Box>

                    {/* Admin Response */}
                    {q.adminResponse ? (
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 1 }}>
                        <MessageBubble isAdmin>
                          <Typography variant="body2" sx={{ color: BLUE }}>
                            {q.adminResponse}
                          </Typography>
                        </MessageBubble>
                        <Avatar sx={{ bgcolor: BLUE, mt: 1 }}>
                          <QuestionAnswerIcon fontSize="small" />
                        </Avatar>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          gap: 1,
                          mt: 1,
                          ml: 7,
                        }}
                      >
                        <ResponseInput
                          placeholder="Reply as Bondly..."
                          value={responseText[q.id] || ""}
                          onChange={(e) =>
                            setResponseText({ ...responseText, [q.id]: e.target.value })
                          }
                          size="small"
                          fullWidth
                        />
                        <SendButton
                          onClick={() => handleRespond(q.id)}
                          disabled={!responseText[q.id]?.trim()}
                        >
                          <SendIcon />
                        </SendButton>
                      </Box>
                    )}
                  </Box>
                </Zoom>
              );
            })}
          </ChatContainer>
        )}
      </Container>
    </Box>
  );
}