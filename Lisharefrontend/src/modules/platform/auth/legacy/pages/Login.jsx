// src/components/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  IconButton,
  InputAdornment,
  Avatar,
  Grid,
  CircularProgress,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
  ArrowForward,
  Favorite,
  People,
  Share,
  VerifiedUser,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import api from "/src/legacy/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email address";
    if (!form.password.trim()) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/auth/login", form, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        setMessage("Login successful! Redirecting...");
        if (res.data.token) localStorage.setItem("token", res.data.token);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));

        setTimeout(() => {
          const role = res.data.role || res.data.user?.role;
          if (role === "ROLE_ADMIN") navigate("/dashboard");
          else if (role === "ROLE_MANAGER") navigate("/management");
          else navigate("/home");
        }, 1500);
      } else {
        setMessage(res.data.message || "Login failed. Check credentials.");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(rgba(250,247,242,0.6), rgba(250,247,242,0.6)), url('https://images.unsplash.com/photo-1530789253388-582c481c54b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')`, // mountain lake scene
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Bondly welcome with icons */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={800}>
              <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                <Zoom in timeout={600}>
                  <Favorite sx={{ fontSize: 64, color: "#e91e63", mb: 2 }} />
                </Zoom>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #e91e63, #f48fb1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 2,
                    lineHeight: 1.2,
                  }}
                >
                  Bondly
                </Typography>
                <Typography variant="h5" sx={{ color: "#333", fontWeight: 600, mb: 3 }}>
                  Connect, share, and grow together
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
                  {[
                    { icon: <Favorite />, text: "Share moments with friends and family" },
                    { icon: <People />, text: "Join a community of millions worldwide" },
                    { icon: <Share />, text: "Express yourself with posts and reactions" },
                  ].map((item, idx) => (
                    <Fade in timeout={1000 + idx * 200} key={idx}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha("#e91e63", 0.1), color: "#e91e63" }}>
                          {item.icon}
                        </Avatar>
                        <Typography variant="body1" sx={{ color: "#666" }}>
                          {item.text}
                        </Typography>
                      </Box>
                    </Fade>
                  ))}
                </Box>
                <Typography variant="body2" sx={{ color: "#999" }}>
                  Join 10M+ users already connecting on Bondly.
                </Typography>
              </Box>
            </Fade>
          </Grid>

          {/* Right side - Clean Login Card */}
          <Grid item xs={12} md={6}>
            <Zoom in timeout={800}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: "#fff",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                }}
              >
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: "#e91e63",
                      width: 56,
                      height: 56,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <LoginIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} sx={{ color: "#333" }}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Sign in to continue your journey
                  </Typography>
                </Box>

                {message && (
                  <Fade in>
                    <Alert
                      severity={message.includes("successful") ? "success" : "error"}
                      sx={{
                        mb: 3,
                        bgcolor: "#fff",
                        color: message.includes("successful") ? "#2e7d32" : "#f44336",
                        border: message.includes("successful") ? "1px solid #2e7d32" : "1px solid #f44336",
                      }}
                      onClose={() => setMessage("")}
                    >
                      {message}
                    </Alert>
                  </Fade>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: errors.email ? "#f44336" : "#2196f3" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
                        "&:hover fieldset": { borderColor: "#e91e63" },
                        "&.Mui-focused fieldset": { borderColor: "#e91e63" },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: errors.password ? "#f44336" : "#2196f3" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff sx={{ color: "#666" }} /> : <Visibility sx={{ color: "#666" }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
                        "&:hover fieldset": { borderColor: "#e91e63" },
                        "&.Mui-focused fieldset": { borderColor: "#e91e63" },
                      },
                    }}
                  />

                  <Box sx={{ textAlign: "right", mt: 1 }}>
                    <Button
                      component={Link}
                      to="/forgot-password"
                      sx={{ textTransform: "none", color: "#2196f3" }}
                    >
                      Forgot password?
                    </Button>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    endIcon={loading ? null : <ArrowForward />}
                    sx={{
                      mt: 3,
                      py: 1.5,
                      borderRadius: 2,
                      bgcolor: "#e91e63",
                      "&:hover": {
                        bgcolor: "#c2185b",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 20px rgba(233,30,99,0.3)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Login"}
                  </Button>
                </Box>

                <Typography align="center" sx={{ mt: 3, color: "#666" }}>
                  New to Bondly?{" "}
                  <Button
                    component={Link}
                    to="/signup"
                    sx={{ textTransform: "none", fontWeight: 600, color: "#2196f3" }}
                  >
                    Sign up
                  </Button>
                </Typography>
              </Paper>
            </Zoom>
          </Grid>
        </Grid>

        {/* Footer */}
        <Typography variant="caption" display="block" align="center" sx={{ mt: 4, color: "#666" }}>
          © {new Date().getFullYear()} Bondly. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}