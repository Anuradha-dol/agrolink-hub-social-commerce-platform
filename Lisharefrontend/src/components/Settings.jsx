// src/App.jsx
import React, { useState, useEffect } from "react";

const BASE_URL = "http://localhost:9091"; // your backend

export default function App() {
  const [user, setUser] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Forms
  const [nameForm, setNameForm] = useState({ name: "", lastName: "" });
  const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteForm, setDeleteForm] = useState({ currentPassword: "" });
  const [deleteOtpForm, setDeleteOtpForm] = useState({ otp: "" });

  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  // Fetch user profile
  useEffect(() => {
    fetch(BASE_URL + "/user/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setNameForm({ name: data.firstName || "", lastName: data.lastName || "" });
      })
      .catch(() => setError("Failed to fetch user profile"));
  }, []);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage("");
    } else {
      setMessage(msg);
      setError("");
    }
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 4000);
  };

  // --- Handlers ---
  const updateName = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/user/update-name", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nameForm),
      });
      const data = await res.text();
      showMessage(data);
      setUser({ ...user, firstName: nameForm.name, lastName: nameForm.lastName });
    } catch {
      showMessage("Failed to update name", true);
    } finally {
      setLoading(false);
    }
  };

  const requestEmailUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/user/update-email", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: emailForm.newEmail }),
      });
      const data = await res.text();
      showMessage(data);
    } catch {
      showMessage("Failed to request email update", true);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + `/user/verify-new-email?otp=${emailForm.otp}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.text();
      showMessage(data);
      // Navigate to login after successful email verification
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch {
      showMessage("Failed to verify email", true);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/user/update-password", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.text();
      showMessage(data);
      // Navigate to login after successful password update
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch {
      showMessage("Failed to update password", true);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/user/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteForm),
      });
      const data = await res.text();
      showMessage(data);
      // Navigate to login after successful account deletion
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch {
      showMessage("Failed to delete account", true);
    } finally {
      setLoading(false);
    }
  };

  const requestDeleteOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/user/delete-forgot-request", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.text();
      showMessage(data);
    } catch {
      showMessage("Failed to request delete OTP", true);
    } finally {
      setLoading(false);
    }
  };

  const verifyDeleteOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/user/delete-forgot-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteOtpForm),
      });
      const data = await res.text();
      showMessage(data);
      // Navigate to login after successful OTP deletion
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch {
      showMessage("Failed to verify delete OTP", true);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file, endpoint) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(BASE_URL + endpoint, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.text();
      showMessage("Upload successful!");
      // Refresh user profile
      const profile = await fetch(BASE_URL + "/user/me", { credentials: "include" });
      setUser(await profile.json());
    } catch {
      showMessage("Upload failed", true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FADCD9, #BFD8FF, #FFF5E1)",
      paddingBottom: 50
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        
        {/* Cover and profile section */}
        <div style={{ position: "relative" }}>
          {user.coverImageUrl ? (
            <img
              src={BASE_URL + user.coverImageUrl}
              alt="Cover"
              style={{ width: "100%", height: 250, objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: 250, backgroundColor: "#ccc" }} />
          )}

          {user.profileImageUrl && (
            <img
              src={BASE_URL + user.profileImageUrl}
              alt="Profile"
              style={{
                width: 150,
                height: 150,
                borderRadius: "50%",
                objectFit: "cover",
                border: "5px solid #fff",
                position: "absolute",
                bottom: -75,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#fff"
              }}
            />
          )}
        </div>

        {/* Name */}
        <div style={{ textAlign: "center", paddingTop: 90 }}>
          <h2>{user.firstName} {user.lastName}</h2>
        </div>

        {/* Messages */}
        <div style={{ textAlign: "center" }}>
          {message && <div style={{ color: "green" }}>{message}</div>}
          {error && <div style={{ color: "red" }}>{error}</div>}
        </div>

        <div style={{ padding: 20 }}>
          {/* Upload Profile / Cover */}
          <div style={{ marginBottom: 30, textAlign: "center" }}>
            <input type="file" onChange={(e) => setProfileFile(e.target.files[0])} />
            <button onClick={() => uploadFile(profileFile, "/user/upload-profile-image")} disabled={uploading} style={{ marginLeft: 10 }}>Upload Profile</button>
            <br /><br />
            <input type="file" onChange={(e) => setCoverFile(e.target.files[0])} />
            <button onClick={() => uploadFile(coverFile, "/user/upload-cover-image")} disabled={uploading} style={{ marginLeft: 10 }}>Upload Cover</button>
          </div>

          {/* Update Name */}
          <div style={{ marginBottom: 30 }}>
            <h3>Update Name</h3>
            <input type="text" placeholder="First Name" value={nameForm.name}
                   onChange={(e) => setNameForm({ ...nameForm, name: e.target.value })} style={{ marginRight: 10 }} />
            <input type="text" placeholder="Last Name" value={nameForm.lastName}
                   onChange={(e) => setNameForm({ ...nameForm, lastName: e.target.value })} />
            <button onClick={updateName} disabled={loading} style={{ marginLeft: 10 }}>Save Name</button>
          </div>

          {/* Update Email */}
          <div style={{ marginBottom: 30 }}>
            <h3>Update Email</h3>
            <input type="email" placeholder="New Email" value={emailForm.newEmail}
                   onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })} style={{ marginRight: 10 }} />
            <button onClick={requestEmailUpdate} disabled={loading}>Request OTP</button>
            <br /><br />
            <input type="text" placeholder="OTP" value={emailForm.otp}
                   onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value })} style={{ marginRight: 10 }} />
            <button onClick={verifyEmail} disabled={loading}>Verify Email</button>
          </div>

          {/* Update Password */}
          <div style={{ marginBottom: 30 }}>
            <h3>Update Password</h3>
            <input type="password" placeholder="Current Password" value={passwordForm.currentPassword}
                   onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} style={{ marginRight: 10 }} />
            <input type="password" placeholder="New Password" value={passwordForm.newPassword}
                   onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} style={{ marginRight: 10 }} />
            <input type="password" placeholder="Confirm Password" value={passwordForm.confirmPassword}
                   onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            <button onClick={updatePassword} disabled={loading} style={{ marginLeft: 10 }}>Update Password</button>
          </div>

          {/* Delete Account */}
          <div>
            <h3>Delete Account</h3>
            <input type="password" placeholder="Current Password" value={deleteForm.currentPassword}
                   onChange={(e) => setDeleteForm({ currentPassword: e.target.value })} style={{ marginRight: 10 }} />
            <button onClick={deleteAccount} disabled={loading}>Delete Account</button>
            <div style={{ marginTop: 10 }}>
              <p>Or via OTP:</p>
              <button onClick={requestDeleteOtp} disabled={loading} style={{ marginRight: 10 }}>Request Delete OTP</button>
              <input type="text" placeholder="OTP" value={deleteOtpForm.otp}
                     onChange={(e) => setDeleteOtpForm({ otp: e.target.value })} style={{ marginRight: 10 }} />
              <button onClick={verifyDeleteOtp} disabled={loading}>Verify & Delete</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}