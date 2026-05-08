// src/components/Chatbot.jsx
import { useState } from "react";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Button,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import "./Chatbot.css";

const ChatContainer = styled(Box)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: "#faf7f2", // cream background
});

const Header = styled(Box)({
  padding: "16px 20px",
  background: "#fff",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const MessagesArea = styled(Box)({
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
});

const MessageBubble = styled(Paper)(({ isUser }) => ({
  padding: "12px 16px",
  maxWidth: "80%",
  alignSelf: isUser ? "flex-end" : "flex-start",
  backgroundColor: isUser ? "#e91e63" : "#fff", // rose for user, white for bot
  color: isUser ? "#fff" : "#333",
  borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  border: isUser ? "none" : "1px solid rgba(0,0,0,0.05)",
}));

const InputArea = styled(Box)({
  padding: "20px",
  background: "#fff",
  borderTop: "1px solid rgba(0,0,0,0.05)",
  display: "flex",
  gap: "12px",
});

const QuickReplyButton = styled(Button)({
  borderRadius: "30px",
  textTransform: "none",
  backgroundColor: "#fff",
  color: "#2196f3", // blue text
  border: "1px solid #2196f3",
  padding: "8px 16px",
  fontSize: "0.875rem",
  "&:hover": {
    backgroundColor: alpha("#2196f3", 0.08),
    borderColor: "#1976d2",
  },
});

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMessage = { sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await axios.post("http://localhost:9091/api/chat", { message: text });
      setMessages((prev) => [...prev, { sender: "bot", text: res.data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "bot", text: "Error connecting to backend" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ChatContainer>
      <Header>
        <Avatar sx={{ bgcolor: "#e91e63" }}>
          <SmartToyIcon />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#333" }}>
            Bondly Assistant
          </Typography>
          <Typography variant="caption" sx={{ color: "#666" }}>
            Online • 24/7 support
          </Typography>
        </Box>
      </Header>

      <MessagesArea>
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              gap: 1,
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              flexDirection: msg.sender === "user" ? "row-reverse" : "row",
              maxWidth: "100%",
            }}
          >
            {msg.sender === "bot" && (
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#fff", border: "1px solid rgba(0,0,0,0.05)", color: "#2196f3" }}>
                <SmartToyIcon sx={{ fontSize: 18 }} />
              </Avatar>
            )}
            <MessageBubble isUser={msg.sender === "user"}>
              <Typography variant="body2">{msg.text}</Typography>
            </MessageBubble>
            {msg.sender === "user" && (
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#2196f3" }}>
                <PersonIcon sx={{ fontSize: 18 }} />
              </Avatar>
            )}
          </Box>
        ))}
        {isTyping && (
          <Box sx={{ display: "flex", gap: 1, alignSelf: "flex-start" }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "#fff", border: "1px solid rgba(0,0,0,0.05)", color: "#2196f3" }}>
              <SmartToyIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Paper sx={{ p: 2, borderRadius: "20px 20px 20px 4px", background: "#fff", border: "1px solid rgba(0,0,0,0.05)" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Typing...
              </Typography>
            </Paper>
          </Box>
        )}
      </MessagesArea>

      {/* Quick reply buttons */}
      <Box sx={{ px: 2, pb: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <QuickReplyButton size="small" onClick={() => sendMessage("Tell me about Bondly")}>
          About Bondly
        </QuickReplyButton>
        <QuickReplyButton size="small" onClick={() => sendMessage("How to connect with friends")}>
          Connect
        </QuickReplyButton>
        <QuickReplyButton size="small" onClick={() => sendMessage("How to post")}>
          How to post
        </QuickReplyButton>
      </Box>

      <InputArea>
        <TextField
          fullWidth
          placeholder="Type your message..."
          variant="outlined"
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "30px",
              backgroundColor: "#fff",
              border: "1px solid rgba(0,0,0,0.05)",
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "#e91e63" },
              "&.Mui-focused fieldset": { borderColor: "#e91e63" },
            },
          }}
        />
        <IconButton
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          sx={{
            bgcolor: "#e91e63",
            color: "#fff",
            "&:hover": { bgcolor: "#c2185b" },
            "&:disabled": { bgcolor: "#ccc" },
          }}
        >
          <SendIcon />
        </IconButton>
      </InputArea>
    </ChatContainer>
  );
}