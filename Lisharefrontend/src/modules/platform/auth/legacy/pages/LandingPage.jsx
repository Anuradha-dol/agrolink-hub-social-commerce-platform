import React, { useState, useRef, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  IconButton,
  Drawer,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  Avatar,
  Rating,
  Zoom,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import { motion, useAnimation, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LoginIcon from "@mui/icons-material/Login";
import Chatbot from "/src/modules/social/chatbot/legacy/pages/Chatbot";
import "./LandingPage.css";

// ========== STYLED COMPONENTS ==========
const GlassCard = styled(Card)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(10px)",
  borderRadius: "32px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.5)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  height: "100%",
  "&:hover": {
    transform: "translateY(-10px)",
    boxShadow: "0 30px 60px rgba(233,30,99,0.15)",
  },
}));

const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: "90vh",
  display: "flex",
  alignItems: "center",
  background: `linear-gradient(145deg, ${alpha("#faf7f2", 0.9)} 0%, ${alpha("#f5e6e9", 0.9)} 100%), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')`, // Mountain lake
  backgroundSize: "cover",
  backgroundPosition: "center",
  padding: theme.spacing(4),
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 20% 50%, rgba(233,30,99,0.1) 0%, transparent 50%)",
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: "50px",
  padding: "12px 36px",
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "none",
  fontSize: "1.1rem",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 25px rgba(233,30,99,0.3)",
  },
}));

const FeatureIconWrapper = styled(Box)(({ theme }) => ({
  width: "80px",
  height: "80px",
  borderRadius: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)",
  color: "#fff",
  marginBottom: theme.spacing(2),
  fontSize: "2.5rem",
  boxShadow: "0 15px 30px rgba(233,30,99,0.2)",
}));

const StatBox = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(3),
  background: "rgba(255,255,255,0.5)",
  backdropFilter: "blur(4px)",
  borderRadius: "24px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.02)",
  border: "1px solid rgba(255,255,255,0.3)",
}));

const ReviewCard = styled(Card)(({ theme }) => ({
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(4px)",
  borderRadius: "24px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
  transition: "all 0.3s ease",
  height: "100%",
  border: "1px solid rgba(255,255,255,0.3)",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 16px 48px rgba(33,150,243,0.15)",
  },
}));

// ========== ANIMATION VARIANTS ==========
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

export default function LandingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  // ========== REVIEWS ==========
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4041";
        const res = await fetch(`${apiBaseUrl}/reviews`);
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const fallbackTestimonials = [
    { username: "Alex Johnson", rating: 5, comment: "AgroLink Hub has completely changed how I connect with friends. The feed is so engaging!", createdAt: new Date().toISOString() },
    { username: "Maria Garcia", rating: 5, comment: "I love sharing photos and seeing what my friends are up to. It's like Instagram but better!", createdAt: new Date().toISOString() },
    { username: "James Smith", rating: 4, comment: "Great community features. The chat and reactions are spot on.", createdAt: new Date().toISOString() },
    { username: "Emily Davis", rating: 5, comment: "Finally a platform that values real connections. Highly recommended!", createdAt: new Date().toISOString() },
    { username: "Michael Brown", rating: 5, comment: "The privacy controls are excellent. I feel safe sharing here.", createdAt: new Date().toISOString() },
    { username: "Sophia Wilson", rating: 4, comment: "Love the design and the ability to follow friends and influencers.", createdAt: new Date().toISOString() },
  ];

  const displayReviews = reviews.length > 0 ? reviews : fallbackTestimonials;

  // ========== SCROLL ANIMATIONS ==========
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.3 });
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const isTestimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.3 });

  const featuresControls = useAnimation();
  const statsControls = useAnimation();
  const testimonialsControls = useAnimation();

  useEffect(() => {
    if (isFeaturesInView) featuresControls.start("visible");
    if (isStatsInView) statsControls.start("visible");
    if (isTestimonialsInView) testimonialsControls.start("visible");
  }, [isFeaturesInView, isStatsInView, isTestimonialsInView]);

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) return;
    setDrawerOpen(open);
  };

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.warn("Thank you for contacting us! We'll get back to you soon.");
    setContactForm({ name: "", email: "", message: "" });
  };

  const handleLogin = () => navigate("/login");

  return (
    <Box sx={{ bgcolor: "#faf7f2", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ========== NAVBAR ========== */}
      <AppBar
        position="sticky"
        component={motion.div}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.05)",
          color: "#333",
          borderBottom: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <FavoriteIcon sx={{ mr: 1, color: "#e91e63" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#2196f3", letterSpacing: "-0.5px" }}>
              AgroLink Hub
            </Typography>
          </Box>
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Button color="inherit" href="#features" sx={{ color: "#333", fontWeight: 500 }}>Features</Button>
              <Button color="inherit" href="#testimonials" sx={{ color: "#333", fontWeight: 500 }}>Testimonials</Button>
              <Button color="inherit" href="#contact" sx={{ color: "#333", fontWeight: 500 }}>Contact</Button>
              <Button color="inherit" onClick={() => setPrivacyOpen(true)} sx={{ color: "#333", fontWeight: 500 }}>Privacy</Button>
              <Button
                variant="outlined"
                startIcon={<LoginIcon />}
                onClick={handleLogin}
                sx={{
                  ml: 2,
                  borderRadius: "50px",
                  borderColor: "#e91e63",
                  color: "#e91e63",
                  fontWeight: 600,
                  px: 3,
                  "&:hover": { borderColor: "#c2185b", background: alpha("#e91e63", 0.04) },
                }}
              >
                Login
              </Button>
            </Box>
          )}
          {isMobile && (
            <IconButton edge="end" color="inherit">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* ========== HERO ========== */}
      <HeroSection>
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "3rem", md: "4rem" },
                    lineHeight: 1.1,
                    color: "#333",
                    mb: 2,
                  }}
                >
                  Connect, Share,
                  <br />
                  <Box component="span" sx={{ color: "#e91e63" }}>
                    Grow Together
                  </Box>
                </Typography>
                <Typography variant="h6" paragraph sx={{ color: "#666", fontWeight: 400, maxWidth: 500 }}>
                  AgroLink Hub is your agriculture social space - share moments, discover markets, and connect with a vibrant community.
                </Typography>
                <StyledButton
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate("/signup")}
                  sx={{
                    mt: 2,
                    bgcolor: "#e91e63",
                    "&:hover": { bgcolor: "#c2185b" },
                  }}
                >
                  Join Now
                </StyledButton>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" // Friends laughing outdoors
                  alt="Friends enjoying life outdoors"
                  sx={{
                    width: "100%",
                    maxWidth: 600,
                    borderRadius: "40px",
                    boxShadow: "0 30px 60px rgba(0,0,0,0.2)",
                    display: "block",
                    margin: "0 auto",
                    border: "4px solid rgba(233,30,99,0.3)",
                  }}
                />
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      {/* ========== STATS ========== */}
      <Container ref={statsRef} sx={{ py: 10 }}>
        <motion.div variants={staggerContainer} initial="hidden" animate={statsControls}>
          <Grid container spacing={4} justifyContent="center">
            {[
              { value: "1M+", label: "Active Users" },
              { value: "50M+", label: "Posts Shared" },
              { value: "98%", label: "User Satisfaction" },
            ].map((stat, idx) => (
              <Grid item xs={12} sm={4} key={idx}>
                <motion.div variants={fadeInUp}>
                  <StatBox>
                    <Typography variant="h2" sx={{ fontWeight: 800, color: "#e91e63", mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="h6" sx={{ color: "#666" }}>
                      {stat.label}
                    </Typography>
                  </StatBox>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* ========== FEATURES ========== */}
      <Container id="features" ref={featuresRef} sx={{ py: 8 }}>
        <motion.div variants={staggerContainer} initial="hidden" animate={featuresControls}>
          <Typography
            variant="h2"
            align="center"
            sx={{ fontWeight: 700, color: "#333", mb: 2, letterSpacing: "-1px" }}
          >
            Why AgroLink Hub?
          </Typography>
          <Typography variant="h6" align="center" sx={{ color: "#666", mb: 8, fontWeight: 400 }}>
            Discover the tools that make socializing fun and meaningful
          </Typography>
          <Grid container spacing={4}>
            {[
              { icon: <ShareIcon />, title: "Share Moments", desc: "Post photos, updates, and stories to share with friends and family." },
              { icon: <PeopleIcon />, title: "Connect with Friends", desc: "Follow friends, see what they're up to, and build your network." },
              { icon: <FavoriteIcon />, title: "Express Yourself", desc: "React with emojis, comment, and engage in conversations." },
            ].map((feature, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <motion.div variants={fadeInUp}>
                  <GlassCard>
                    <CardContent sx={{ textAlign: "center", p: 4 }}>
                      <FeatureIconWrapper>{feature.icon}</FeatureIconWrapper>
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: "#333" }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </GlassCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* ========== TESTIMONIALS ========== */}
      <Box id="testimonials" ref={testimonialsRef} sx={{ py: 10, bgcolor: "#f5e6e9" }}>
        <Container>
          <motion.div variants={staggerContainer} initial="hidden" animate={testimonialsControls}>
            <Typography
              variant="h2"
              align="center"
              sx={{ fontWeight: 700, color: "#333", mb: 2, letterSpacing: "-1px" }}
            >
              User Reviews
            </Typography>
            <Typography variant="h6" align="center" sx={{ color: "#666", mb: 8, fontWeight: 400 }}>
              Real feedback from our community
            </Typography>

            {loading ? (
              <Typography align="center" sx={{ color: "#666" }}>Loading reviews...</Typography>
            ) : error ? (
              <Typography align="center" color="error">{error}</Typography>
            ) : (
              <Grid container spacing={4}>
                {displayReviews.slice(0, 6).map((review, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Zoom in timeout={500 + index * 100}>
                      <ReviewCard>
                        <CardContent sx={{ p: 4 }}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <Avatar sx={{ bgcolor: "#2196f3", mr: 2 }}>
                              {review.username?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#333" }}>
                                {review.username}
                              </Typography>
                              <Rating value={review.rating} readOnly size="small" sx={{ color: "#e91e63" }} />
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
                            "{review.comment}"
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#999" }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </ReviewCard>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            )}
          </motion.div>
        </Container>
      </Box>

      {/* ========== FOOTER ========== */}
      <Box component="footer" sx={{ bgcolor: "#333", color: "#fff", py: 6 }}>
        <Container>
          <Grid container spacing={4} justifyContent="space-between" alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <FavoriteIcon sx={{ mr: 1, color: "#e91e63" }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#2196f3" }}>
                  AgroLink Hub
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "#aaa" }}>
                © {new Date().getFullYear()} All rights reserved.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <IconButton color="inherit" href="#" sx={{ color: "#e91e63" }}><FacebookIcon /></IconButton>
                <IconButton color="inherit" href="#" sx={{ color: "#e91e63" }}><TwitterIcon /></IconButton>
                <IconButton color="inherit" href="#" sx={{ color: "#e91e63" }}><LinkedInIcon /></IconButton>
                <IconButton color="inherit" href="#" sx={{ color: "#e91e63" }}><InstagramIcon /></IconButton>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: "center", md: "right" } }}>
              <Button color="inherit" onClick={() => setPrivacyOpen(true)} sx={{ mr: 2, color: "#e91e63" }}>Privacy Policy</Button>
              <Button color="inherit" href="#contact" sx={{ color: "#e91e63" }}>Contact</Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Floating Chat Button */}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}>
        <Fab color="primary" aria-label="chat" onClick={toggleDrawer(true)} sx={{ position: "fixed", bottom: 24, right: 24, bgcolor: "#e91e63", "&:hover": { bgcolor: "#c2185b" } }}>
          <ChatIcon />
        </Fab>
      </motion.div>

      {/* Chatbot Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: isMobile ? "100vw" : 400, height: "100%" }}>
          <Chatbot />
        </Box>
      </Drawer>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} PaperProps={{ sx: { bgcolor: "#fff", color: "#333", borderRadius: 4 } }}>
        <DialogTitle sx={{ color: "#e91e63" }}>Privacy Policy</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#666" }}>
            At AgroLink Hub, we value your privacy. This policy outlines how we collect, use, and protect your information. We do not share your personal data with third parties without your consent. For more details, please contact us.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivacyOpen(false)} sx={{ color: "#2196f3" }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
