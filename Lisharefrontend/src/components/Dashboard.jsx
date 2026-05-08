// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("user/dashboard", {
          withCredentials: true,
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
        else setError(err.response?.data?.message || "Failed to load dashboard");
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (error)
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
          color: "red",
          fontWeight: "bold",
        }}
      >
        {error}
      </div>
    );

  if (!data)
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
          color: "#555",
          fontWeight: "bold",
        }}
      >
        Loading...
      </div>
    );

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "'Arial', sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #faf7f2, #e1f5fe)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 style={{ color: "#2196f3", marginBottom: "10px" }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: "16px", color: "#555" }}>
          Welcome back! Here’s an overview of your system.
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          justifyContent: "center",
          marginBottom: "40px",
        }}
      >
        {/* Welcome Message */}
        <div
          style={{
            flex: "1 1 250px",
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "15px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            minWidth: "250px",
          }}
        >
          <h3 style={{ color: "#e91e63" }}>Welcome</h3>
          <p style={{ color: "#555" }}>{data.welcomeMessage}</p>
        </div>

        {/* Notifications */}
        <div
          style={{
            flex: "1 1 250px",
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "15px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            minWidth: "250px",
          }}
        >
          <h3 style={{ color: "#2196f3" }}>Notifications</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>
            {data.notifications}
          </p>
        </div>

        {/* Tasks */}
        <div
          style={{
            flex: "1 1 250px",
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "15px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            minWidth: "250px",
          }}
        >
          <h3 style={{ color: "#ff9800" }}>Tasks</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>
            {data.tasks}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={() => navigate("/profile")}
          style={{
            backgroundColor: "#e91e63",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            padding: "12px 30px",
            margin: "10px",
            cursor: "pointer",
            fontSize: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "0.3s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#c2185b")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#e91e63")
          }
        >
          Go to Profile
        </button>

        <button
          onClick={() => navigate("/supportAdmin")}
          style={{
            backgroundColor: "#2196f3",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            padding: "12px 30px",
            margin: "10px",
            cursor: "pointer",
            fontSize: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "0.3s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#1976d2")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#2196f3")
          }
        >
          Go to Support Panel
        </button>
      </div>
    </div>
  );
}