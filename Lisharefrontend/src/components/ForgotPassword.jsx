// src/components/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Email,
  Phone,
  Lock,
  VpnKey,
  Refresh,
  ArrowForward,
  ArrowBack,
  Send,
  Visibility,
  VisibilityOff,
  Favorite,
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import api from "../api";

// Custom Step Icon with Bondly colors
const StepIconRoot = styled("div")(({ theme, ownerState }) => ({
  backgroundColor: ownerState.completed
    ? theme.palette.success.main
    : ownerState.active
    ? "#e91e63" // rose
    : "#ccc",
  zIndex: 1,
  color: "#fff",
  width: 30,
  height: 30,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  fontSize: 16,
  boxShadow: ownerState.active ? theme.shadows[3] : "none",
  transition: "all 0.2s",
}));

function StepIcon(props) {
  const { active, completed, className } = props;
  return (
    <StepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Favorite sx={{ fontSize: 16 }} /> : props.icon}
    </StepIconRoot>
  );
}

const steps = ["Contact", "Verify OTP", "New Password"];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [form, setForm] = useState({
    email: "",
    tempEmail: "",
    phoneNumber: "",
    otp: "",
    password: "",
    repeatPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!form.email.trim() && !form.phoneNumber.trim())
        newErrors.email = "Email or phone required";
      if (form.email && !/\S+@\S+\.\S+/.test(form.email))
        newErrors.email = "Invalid email";
    } else if (currentStep === 2) {
      if (!form.otp.trim()) newErrors.otp = "OTP required";
      else if (!/^\d{6}$/.test(form.otp)) newErrors.otp = "OTP must be 6 digits";
    } else if (currentStep === 3) {
      if (!form.password.trim()) newErrors.password = "Password required";
      else if (form.password.length < 8)
        newErrors.password = "Minimum 8 characters";
      if (!form.repeatPassword.trim())
        newErrors.repeatPassword = "Confirm password";
      else if (form.password !== form.repeatPassword)
        newErrors.repeatPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const startOtpTimer = () => {
    setOtpTimer(60);
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const errs = validateStep(1);
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/forgotpass/send-otp", form, { withCredentials: true });
      setMessage(res.data.message || "OTP sent!");
      startOtpTimer();
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const errs = validateStep(2);
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const res = await api.post("/forgotpass/verify-otp", { otp: form.otp }, { withCredentials: true });
      setMessage(res.data.message || "OTP verified");
      setStep(3);
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post("/forgotpass/resend-otp", {}, { withCredentials: true });
      setMessage(res.data.message || "OTP resent");
      startOtpTimer();
    } catch (err) {
      setMessage(err.response?.data?.message || "Resend failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const errs = validateStep(3);
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const res = await api.post("/forgotpass/change-password", form, { withCredentials: true });
      setMessage(res.data.message || "Password changed!");
      setTimeout(() => navigate("/login", { state: { message: "Password reset successful" } }), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(rgba(250,247,242,0.6), rgba(250,247,242,0.6)), url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')`, // beautiful mountain lake
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, bgcolor: "#fff", border: "1px solid rgba(0,0,0,0.05)" }}>
          <Typography variant="h4" align="center" fontWeight={700} sx={{ color: "#e91e63", mb: 1 }}>
            Reset Password
          </Typography>
          <Typography align="center" sx={{ color: "#666", mb: 3 }}>
            Step {step} of 3: {steps[step - 1]}
          </Typography>

          <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label, idx) => (
              <Step key={label}>
                <StepLabel StepIconComponent={StepIcon}>
                  <Typography variant="caption" sx={{ color: "#666" }}>{label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {message && (
            <Alert
              severity={message.includes("success") || message.includes("sent") || message.includes("verified") ? "success" : "error"}
              sx={{
                mb: 3,
                bgcolor: "#fff",
                color: message.includes("error") ? "#f44336" : "#2e7d32",
                border: message.includes("error") ? "1px solid #f44336" : "1px solid #2e7d32",
                "& .MuiAlert-icon": { color: message.includes("error") ? "#f44336" : "#2e7d32" },
              }}
              onClose={() => setMessage("")}
            >
              {message}
            </Alert>
          )}

          {/* Step 1: Contact Info */}
          {step === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  value={form.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: "#2196f3" }} />
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="tempEmail"
                  label="Alternative Email (Optional)"
                  value={form.tempEmail}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: "#2196f3" }} />
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="phoneNumber"
                  label="Phone Number"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: "#2196f3" }} />
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
              </Grid>
            </Grid>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="otp"
                  label="6-digit OTP"
                  value={form.otp}
                  onChange={handleChange}
                  error={!!errors.otp}
                  helperText={errors.otp}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey sx={{ color: "#2196f3" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& input": { letterSpacing: 4, fontSize: "1.5rem", color: "#333" },
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
                      "&:hover fieldset": { borderColor: "#e91e63" },
                      "&.Mui-focused fieldset": { borderColor: "#e91e63" },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Button
                    onClick={handleResendOtp}
                    disabled={otpTimer > 0 || loading}
                    startIcon={<Refresh />}
                    sx={{ color: "#2196f3" }}
                  >
                    {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend"}
                  </Button>
                  <Chip
                    label={`Sent to ${form.email || form.phoneNumber}`}
                    variant="outlined"
                    sx={{ borderColor: "#e91e63", color: "#e91e63" }}
                  />
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="password"
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: "#2196f3" }} />
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="repeatPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.repeatPassword}
                  onChange={handleChange}
                  error={!!errors.repeatPassword}
                  helperText={errors.repeatPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: "#2196f3" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                          {showConfirmPassword ? <VisibilityOff sx={{ color: "#666" }} /> : <Visibility sx={{ color: "#666" }} />}
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
              </Grid>
            </Grid>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              onClick={() => (step === 1 ? navigate("/login") : setStep(step - 1))}
              disabled={loading}
              startIcon={<ArrowBack />}
              sx={{ color: "#2196f3" }}
            >
              {step === 1 ? "Back to Login" : "Back"}
            </Button>
            <Button
              variant="contained"
              onClick={
                step === 1 ? handleSendOtp : step === 2 ? handleVerifyOtp : handleChangePassword
              }
              disabled={loading}
              endIcon={step < 3 ? <ArrowForward /> : null}
              startIcon={step === 1 && <Send />}
              sx={{
                minWidth: 120,
                bgcolor: "#e91e63",
                "&:hover": { bgcolor: "#c2185b" },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : step === 1 ? (
                "Send OTP"
              ) : step === 2 ? (
                "Verify"
              ) : (
                "Reset"
              )}
            </Button>
          </Box>

          {/* Login link */}
          <Typography align="center" sx={{ mt: 3, color: "#666" }}>
            Remember your password?{" "}
            <Link to="/login" style={{ textDecoration: "none", fontWeight: 600, color: "#2196f3" }}>
              Sign in
            </Link>
          </Typography>
        </Paper>

        <Typography variant="caption" display="block" align="center" sx={{ mt: 3, color: "#666" }}>
          © {new Date().getFullYear()} Bondly. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}