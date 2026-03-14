import { useEffect, useState } from "react";
import API from "../services/api";
import "./Admin.css";

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "In Progress" },
  { value: "Resolved", label: "Finished" },
];

export default function Admin() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [adminUser, setAdminUser] = useState(
    localStorage.getItem("civictrackAdminUser") || ""
  );
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasToken = Boolean(localStorage.getItem("civictrackAdminToken"));

  const formatTimestamp = (value) => {
    if (!value) return "Not solved yet";

    return new Date(value).toLocaleString();
  };

  const getStatusHistory = (complaint) => {
    if (Array.isArray(complaint.statusHistory) && complaint.statusHistory.length) {
      return complaint.statusHistory;
    }

    const fallbackHistory = [
      {
        status: complaint.status || "Pending",
        label: complaint.status === "Resolved" ? "Finished" : (complaint.status || "Pending"),
        changedAt: complaint.status === "Resolved" ? (complaint.resolvedAt || complaint.createdAt) : complaint.createdAt,
        changedBy: "system",
      },
    ];

    return fallbackHistory;
  };

  useEffect(() => {
    if (hasToken) {
      loadComplaints();
    }
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.get("/complaints");
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/admin/login", credentials);

      localStorage.setItem("civictrackAdminToken", res.data.token);
      localStorage.setItem("civictrackAdminUser", res.data.admin.username);

      setAdminUser(res.data.admin.username);
      setCredentials({ username: "", password: "" });
      await loadComplaints();
    } catch (err) {
      setError(err?.response?.data?.error || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("civictrackAdminToken");
    localStorage.removeItem("civictrackAdminUser");
    setAdminUser("");
    setComplaints([]);
    setError("");
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await API.patch(`/complaints/${id}`, { status });

      setComplaints((currentComplaints) =>
        currentComplaints.map((complaint) =>
          complaint._id === id ? res.data : complaint
        )
      );
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update complaint");
    }
  };

  const downloadExcel = async () => {
    try {
      setError("");

      const res = await API.get("/complaints/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.download = "civictrack-complaints.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to download Excel report");
    }
  };

  if (!hasToken) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <h2>Admin Login</h2>
          <p>Only admins can access complaint resolution tools.</p>

          <form className="admin-form" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Admin username"
              value={credentials.username}
              onChange={(e) =>
                setCredentials((currentCredentials) => ({
                  ...currentCredentials,
                  username: e.target.value,
                }))
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials((currentCredentials) => ({
                  ...currentCredentials,
                  password: e.target.value,
                }))
              }
            />

            <button type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Login as Admin"}
            </button>
          </form>

          {error && <p className="admin-error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>Admin Panel</h2>
          <p>Welcome, {adminUser || "admin"}. Review and resolve civic issues here.</p>
        </div>

        <div className="admin-actions">
          <button type="button" className="download-btn" onClick={downloadExcel}>
            Download Excel
          </button>
          <button type="button" onClick={loadComplaints}>
            Refresh
          </button>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Location</th>
              <th>Posted</th>
              <th>Solved</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint._id}>
                <td>
                  <strong>{complaint.title}</strong>
                  <div className="admin-description">{complaint.description}</div>
                  <div className="admin-timeline">
                    {getStatusHistory(complaint).map((entry, index) => (
                      <div key={`${complaint._id}-history-${index}`} className="admin-timeline-item">
                        <span className={`admin-status-chip ${String(entry.status || "Pending").toLowerCase().replace(/\s+/g, "-")}`}>
                          {entry.label || entry.status}
                        </span>
                        <span>{formatTimestamp(entry.changedAt)}</span>
                        <span>by {entry.changedBy || "system"}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td>{complaint.category}</td>
                <td>{complaint.severity}</td>
                <td>
                  <select
                    value={complaint.status || "Pending"}
                    onChange={(e) => updateStatus(complaint._id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption.value} value={statusOption.value}>
                        {statusOption.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {Number.isFinite(Number(complaint?.location?.lat)) &&
                  Number.isFinite(Number(complaint?.location?.lng))
                    ? `${Number(complaint.location.lat).toFixed(4)}, ${Number(
                        complaint.location.lng
                      ).toFixed(4)}`
                    : "No location"}
                </td>
                <td>{formatTimestamp(complaint.createdAt)}</td>
                <td>{complaint.status === "Resolved" ? formatTimestamp(complaint.resolvedAt) : "Not solved yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && complaints.length === 0 && (
          <div className="admin-empty">No complaints found.</div>
        )}
      </div>
    </div>
  );
}
