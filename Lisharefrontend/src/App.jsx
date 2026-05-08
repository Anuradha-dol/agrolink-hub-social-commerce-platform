import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage.jsx";
import Signup from "./components/SignUp.jsx";
import VerifyOtp from "./components/VerifyOtp.jsx";
import Login from "./components/Login.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Home from "./components/Home.jsx";
import Profile from "./components/Profile.jsx";
import Settings from "./components/Settings.jsx";
import Review from "./components/Review.jsx";
import SupportAdmin from "./components/SupportAdmin.jsx";
import SupportUser from "./components/SupportUser.jsx";
import SearchUsers from "./components/SearchUsers.jsx";
import Notifications from "./components/Notifications.jsx";
import Friends from "./components/Friends.jsx";
import Posts from "./components/Posts .jsx";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/review" element={<Review />} />
        <Route path="/supportAdmin" element={<SupportAdmin />} />
        <Route path="/supportUser" element={<SupportUser />} />

        <Route path="/searchUsers" element={<SearchUsers />} />
        <Route path="/notifications" element={<Notifications />} />


         <Route path="/friend" element={<Friends />} />
           <Route path="/post" element={<Posts />} />

           






      </Routes>
    </BrowserRouter>
  );
}

export default App;
