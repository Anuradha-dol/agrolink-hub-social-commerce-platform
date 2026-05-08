// src/components/VerifyOtp.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Fade,
  Zoom,
} from "@mui/material";
import {
  VerifiedUser,
  Security,
  Timer,
  Send,
  ArrowBack,
  Refresh,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";
import api from "../api";

// Animation for pulse effect
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  borderRadius: theme.spacing(3),
  boxShadow: theme.shadows[8],
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background: "linear-gradient(90deg, #1976d2, #9c27b0)",
  },
}));

const OtpInput = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(2),
    fontSize: "1.5rem",
    fontWeight: 600,
    textAlign: "center",
    "& input": {
      textAlign: "center",
      letterSpacing: "0.5em",
    },
  },
  "&.pulse": {
    animation: `${pulse} 2s infinite`,
  },
}));

const VerifyButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  fontSize: "1rem",
  fontWeight: 600,
  textTransform: "none",
  background: "linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)",
  boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
  "&:hover": {
    background: "linear-gradient(45deg, #1565c0 30%, #1EAEDB 90%)",
  },
}));

const ResendButton = styled(Button)(({ theme, disabled }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.spacing(2),
  textTransform: "none",
  color: disabled ? theme.palette.text.disabled : theme.palette.primary.main,
  "& .MuiButton-startIcon": {
    color: disabled ? theme.palette.text.disabled : theme.palette.primary.main,
  },
}));

const CountdownCircle = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: theme.palette.primary.main,
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.875rem",
  fontWeight: 600,
  marginLeft: theme.spacing(1),
}));

const SuccessIcon = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
  color: "white",
  fontSize: "2rem",
}));

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const otpInputRef = useRef(null);
  const countdownRef = useRef(null);

  // Handle countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0 && isResendDisabled) {
      countdownRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendDisabled(false);
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown, isResendDisabled]);

  // Focus OTP input on mount
  useEffect(() => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    return seconds < 10 ? `0${seconds}` : seconds;
  };

  // Helper to format backend messages
  const toMessage = (data) => {
    if (!data) return "Something went wrong";
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return "Something went wrong";
  };

  // Handle OTP input change with auto-formatting
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  // Handle OTP verification
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setMessage({ type: "error", text: "Please enter the 6-digit OTP" });
      return;
    }
    
    if (otp.length !== 6) {
      setMessage({ type: "error", text: "OTP must be 6 digits" });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/auth/verify-code",
        { verifyCode: otp },
        { withCredentials: true }
      );

      const messageText = toMessage(res.data);
      setMessage({
        type: res.data.success ? "success" : "error",
        text: messageText,
      });

      if (res.data.success) {
        setIsVerified(true);
        // Show success state for 2 seconds before redirecting
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Verification error:", err.response?.data || err);
      setMessage({
        type: "error",
        text: toMessage(err.response?.data) || "Verification failed",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (isResendDisabled) return;

    try {
      setLoading(true);
      const res = await api.post(
        "/auth/resend-otp",
        {},
        { withCredentials: true }
      );
      
      const messageText = toMessage(res.data);
      setMessage({
        type: res.data.success ? "success" : "error",
        text: messageText,
      });

      if (res.data.success) {
        // Reset countdown
        setCountdown(30);
        setIsResendDisabled(true);
        setOtp("");
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
      }
    } catch (err) {
      console.error("Resend error:", err.response?.data || err);
      setMessage({
        type: "error",
        text: toMessage(err.response?.data) || "Failed to resend OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle back to signup
  const handleBack = () => {
    navigate("/signup");
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <StyledPaper elevation={3}>
            {/* Header with icon */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              {isVerified ? (
                <SuccessIcon>
                  <VerifiedUser fontSize="large" />
                </SuccessIcon>
              ) : (
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    color: "white",
                    fontSize: "2rem",
                  }}
                >
                  <Security fontSize="large" />
                </Box>
              )}
              <Typography
                component="h1"
                variant="h4"
                gutterBottom
                sx={{ mt: 2, fontWeight: 600 }}
                color={isVerified ? "success.main" : "primary.main"}
              >
                {isVerified ? "Verified Successfully!" : "Verify Your Account"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isVerified
                  ? "Your account has been verified successfully!"
                  : "We've sent a 6-digit code to your email"}
              </Typography>
            </Box>

            {/* Message Alert */}
            {message.text && (
              <Fade in={true}>
                <Alert
                  severity={message.type}
                  sx={{ mb: 3 }}
                  onClose={() => setMessage({ type: "", text: "" })}
                  variant="filled"
                >
                  {message.text}
                </Alert>
              </Fade>
            )}

            {/* OTP Form */}
            {!isVerified ? (
              <form onSubmit={handleVerify}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    gutterBottom
                  >
                    Enter the verification code
                  </Typography>
                  <OtpInput
                    fullWidth
                    inputRef={otpInputRef}
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="000000"
                    inputProps={{
                      maxLength: 6,
                      style: { textAlign: "center" },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Security color="action" />
                        </InputAdornment>
                      ),
                    }}
                    disabled={loading}
                    autoComplete="off"
                    className={!otp ? "pulse" : ""}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block", textAlign: "center" }}
                  >
                    Code expires in 10 minutes
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleBack}
                      startIcon={<ArrowBack />}
                      sx={{ borderRadius: 2, textTransform: "none" }}
                      disabled={loading}
                    >
                      Back
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <VerifyButton
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={loading || otp.length !== 6}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <Send />
                        )
                      }
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </VerifyButton>
                  </Grid>
                </Grid>

                {/* Resend OTP Section */}
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Didn't receive the code?
                    </Typography>
                    <ResendButton
                      variant="text"
                      onClick={handleResend}
                      disabled={isResendDisabled || loading}
                      startIcon={<Refresh />}
                    >
                      Resend OTP
                    </ResendButton>
                    {isResendDisabled && (
                      <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                        <Timer fontSize="small" color="action" />
                        <CountdownCircle>
                          {formatTime(countdown)}
                        </CountdownCircle>
                      </Box>
                    )}
                  </Box>
                  {isResendDisabled && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", textAlign: "center", mt: 1 }}
                    >
                      Wait {countdown} seconds before requesting a new code
                    </Typography>
                  )}
                </Box>
              </form>
            ) : (
              // Success State
              <Fade in={true}>
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <CircularProgress
                    size={60}
                    sx={{ mb: 2, color: "success.main" }}
                  />
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Redirecting you to login page...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    You will be redirected automatically
                  </Typography>
                </Box>
              </Fade>
            )}

            {/* Footer Info */}
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", textAlign: "center" }}
              >
                For security reasons, this code will expire in 10 minutes
                <br />
                Check your spam folder if you don't see the email
              </Typography>
            </Box>
          </StyledPaper>
        </Zoom>

        {/* Page Footer */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Need help?{" "}
            <Button
              variant="text"
              size="small"
              sx={{ textTransform: "none", minWidth: 0 }}
              onClick={() => navigate("/contact")}
            >
              Contact Support
            </Button>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}