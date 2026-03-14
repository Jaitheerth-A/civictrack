import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet.heat";
import API from "../services/api";
import "./MapDashboard.css";

/* ---------------- ICONS ---------------- */

function createSeverityIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
      <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M17 1C8.2 1 1 8.1 1 16.8c0 11.6 13.8 25.2 15 26.4a1.5 1.5 0 0 0 2 0c1.2-1.2 15-14.8 15-26.4C33 8.1 25.8 1 17 1Z"/>
      <circle cx="17" cy="17" r="6" fill="#ffffff"/>
    </svg>
  `;

  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -38],
  });
}

const icons = {

  Low: createSeverityIcon("#3b82f6"),

  Medium: createSeverityIcon("#eab308"),

  High: createSeverityIcon("#f97316"),

  Critical: createSeverityIcon("#dc2626"),

  Resolved: createSeverityIcon("#94a3b8")

};

const severityOrder = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

const clusterSeverityClass = {
  Low: "severity-low",
  Medium: "severity-medium",
  High: "severity-high",
  Critical: "severity-critical",
};

const clusterIcon = (cluster) => {
  const markers = cluster.getAllChildMarkers();

  const highestSeverity = markers.reduce((highest, marker) => {
    const markerSeverity = marker.options.severity || "Low";

    return severityOrder[markerSeverity] > severityOrder[highest]
      ? markerSeverity
      : highest;
  }, "Low");

  return L.divIcon({
    html: `<span class="${clusterSeverityClass[highestSeverity]}">${cluster.getChildCount()}</span>`,
    className: "complaint-cluster-icon",
    iconSize: [44, 44],
  });
};

const API_ORIGIN = API.defaults.baseURL.replace(/\/api$/, "");

/* ---------------- FIT MAP TO PINS ---------------- */

function FitMap({ complaints }) {

  const map = useMap();

  useEffect(() => {

    if (!complaints.length) return;

    const bounds = complaints.map(c => [
      c.location.lat,
      c.location.lng
    ]);

    map.fitBounds(bounds, { padding: [50, 50] });

  }, [complaints]);

  return null;

}

function NavigateMap({ targetLocation }) {

  const map = useMap();

  useEffect(() => {
    if (!targetLocation) return;

    map.flyTo([targetLocation.lat, targetLocation.lng], 15, {
      duration: 1.2,
    });
  }, [map, targetLocation]);

  return null;

}

/* ---------------- HEATMAP ---------------- */

function HeatmapLayer({ complaints }) {

  const map = useMap();

  useEffect(() => {
    if (!complaints.length) return undefined;

    const points = complaints.map(c => {

      let intensity = 0.25;

      if (c.severity === "Medium") intensity = 0.6;
      if (c.severity === "High") intensity = 0.85;
      if (c.severity === "Critical") intensity = 1;

      return [
        c.location.lat,
        c.location.lng,
        intensity
      ];

    });

    const heat = L.heatLayer(points, {

      radius: 35,
      blur: 25,
      minOpacity: 0.35,
      maxZoom: 17,

      gradient: {
        0.2: "green",
        0.5: "yellow",
        0.8: "orange",
        1: "red"
      }

    }).addTo(map);

    const redrawHeat = () => heat.redraw();

    redrawHeat();
    map.on("zoomend moveend resize", redrawHeat);

    return () => {
      map.off("zoomend moveend resize", redrawHeat);
      map.removeLayer(heat);
    };

  }, [complaints]);

  return null;

}

/* ---------------- MAIN COMPONENT ---------------- */

export default function MapDashboard() {

  const [complaints, setComplaints] = useState([]);
  const [category, setCategory] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("Active");
  const [heatmap, setHeatmap] = useState(false);
  const [issueQuery, setIssueQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [targetLocation, setTargetLocation] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const res = await API.get("/complaints");
      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load complaints", error);
      setComplaints([]);
    }
  };

  const searchLocation = async () => {
    const searchValue = locationQuery.trim();

    if (searchValue.length < 3) {
      setLocationResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}`
      );

      const data = await res.json();
      setLocationResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to search location", error);
      setLocationResults([]);
    }
  };

  const selectLocation = (place) => {
    const lat = Number(place.lat);
    const lng = Number(place.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setTargetLocation({ lat, lng });
    setLocationQuery(place.display_name);
    setLocationResults([]);
  };

  const clearSearch = () => {
    setIssueQuery("");
    setLocationQuery("");
    setLocationResults([]);
    setTargetLocation(null);
    setCategory("All");
    setSeverity("All");
    setStatus("Active");
    setSelectedComplaint(null);
  };

  const formatStatusLabel = (statusValue) => {
    if (statusValue === "Resolved") return "Finished";

    return statusValue || "Pending";
  };

  const formatTimestamp = (value) => {
    if (!value) return "Not available";

    return new Date(value).toLocaleString();
  };

  const getStatusHistory = (complaint) => {
    if (Array.isArray(complaint.statusHistory) && complaint.statusHistory.length) {
      return complaint.statusHistory;
    }

    return [
      {
        status: complaint.status || "Pending",
        label: formatStatusLabel(complaint.status),
        changedAt: complaint.status === "Resolved" ? (complaint.resolvedAt || complaint.createdAt) : complaint.createdAt,
        changedBy: "system",
      },
    ];
  };

  const hasAdminAccess = Boolean(localStorage.getItem("civictrackAdminToken"));

  const getImageUrl = (imageName) => {
    if (!imageName) return null;

    return `${API_ORIGIN}/uploads/${imageName}`;
  };

  const updateComplaintStatus = async (complaintId, nextStatus) => {
    try {
      const res = await API.patch(`/complaints/${complaintId}`, { status: nextStatus });
      const updatedComplaint = res.data;

      setComplaints((currentComplaints) =>
        currentComplaints.map((complaint) =>
          complaint._id === complaintId ? updatedComplaint : complaint
        )
      );

      setSelectedComplaint(updatedComplaint);
    } catch (error) {
      console.error("Failed to update complaint status", error);
    }
  };

  /* ---------------- FILTER ---------------- */

  const validComplaints = complaints.filter((c) => {
    const lat = Number(c?.location?.lat);
    const lng = Number(c?.location?.lng);

    return Number.isFinite(lat) && Number.isFinite(lng);
  });

  const filtered = validComplaints.filter(c => {
    const normalizedQuery = issueQuery.trim().toLowerCase();
    const matchesIssueQuery = !normalizedQuery || [
      c.title,
      c.description,
      c.category,
      c.severity,
      formatStatusLabel(c.status),
    ].some((value) => value?.toLowerCase().includes(normalizedQuery));

    if (category !== "All" && c.category !== category) return false;
    if (severity !== "All" && c.severity !== severity) return false;
    if (status === "Active" && c.status === "Resolved") return false;
    if (status === "Resolved" && c.status !== "Resolved") return false;
    if (status !== "All" && status !== "Active" && status !== "Resolved" && c.status !== status) return false;
    if (!matchesIssueQuery) return false;

    return true;

  });

  useEffect(() => {
    if (!selectedComplaint) return;

    const stillVisible = filtered.find((complaint) => complaint._id === selectedComplaint._id);

    if (!stillVisible) {
      setSelectedComplaint(null);
      return;
    }

    setSelectedComplaint(stillVisible);
  }, [filtered, selectedComplaint]);

  return (

    <div className="dashboard">

      {/* FILTER BAR */}

      <div className="filter-bar">

        <input
          type="text"
          value={issueQuery}
          onChange={(e) => setIssueQuery(e.target.value)}
          placeholder="Search by issue name, category, or details"
          className="map-filter-input issue-search-input"
        />

        <div className="location-search-group">
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => {
              setLocationQuery(e.target.value);
              if (!e.target.value.trim()) {
                setLocationResults([]);
                setTargetLocation(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchLocation();
              }
            }}
            placeholder="Search a location to move the map"
            className="map-filter-input"
          />

          <button onClick={searchLocation}>
            Search Location
          </button>

          {locationResults.length > 0 && (
            <div className="dashboard-location-results">
              {locationResults.slice(0, 5).map((place) => (
                <button
                  key={place.place_id}
                  type="button"
                  className="dashboard-location-item"
                  onClick={() => selectLocation(place)}
                >
                  {place.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Roads">Roads</option>
          <option value="Water">Water</option>
          <option value="Electricity">Electricity</option>
          <option value="Sanitation">Sanitation</option>
        </select>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="All">All Severity</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="Active">Active Issues</option>
          <option value="All">All Records</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Finished</option>
        </select>

        <button
          onClick={() => setHeatmap(!heatmap)}
        >
          Toggle Heatmap
        </button>

        <button
          type="button"
          className="clear-search-btn"
          onClick={clearSearch}
        >
          Clear Search
        </button>

      </div>

      {/* MAP */}

      <div className="dashboard-content">
        <div className="dashboard-map-shell">
          <MapContainer
            center={[13.0827, 80.2707]}
            zoom={13}
            className="dashboard-map"
          >

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {!targetLocation && <FitMap complaints={filtered} />}
            <NavigateMap targetLocation={targetLocation} />

            {heatmap && <HeatmapLayer complaints={filtered} />}

            <MarkerClusterGroup
              chunkedLoading
              showCoverageOnHover={false}
              iconCreateFunction={clusterIcon}
            >

              {filtered.map(c => (

                <Marker
                  key={c._id}
                  position={[c.location.lat, c.location.lng]}
                  icon={c.status === "Resolved" ? icons.Resolved : (icons[c.severity] || icons.Low)}
                  severity={c.severity}
                  zIndexOffset={selectedComplaint?._id === c._id ? 1400 : 1000}
                  eventHandlers={{
                    click: () => {
                      setSelectedComplaint(c);
                    },
                    mouseover: (e) => {
                      e.target._icon.classList.add("marker-hover");
                    },
                    mouseout: (e) => {
                      e.target._icon.classList.remove("marker-hover");
                    }
                  }}
                />

              ))}

            </MarkerClusterGroup>

          </MapContainer>
        </div>

        <aside className={`issue-drawer${selectedComplaint ? " open" : ""}`}>
          {selectedComplaint ? (
            <>
              <div className="issue-drawer-header">
                <div>
                  <p className="issue-drawer-eyebrow">Issue Details</p>
                  <h3>{selectedComplaint.title}</h3>
                </div>
                <button
                  type="button"
                  className="issue-drawer-close"
                  onClick={() => setSelectedComplaint(null)}
                >
                  Close
                </button>
              </div>

              {selectedComplaint.image && (
                <img
                  src={getImageUrl(selectedComplaint.image)}
                  alt={selectedComplaint.title}
                  className="issue-drawer-image"
                />
              )}

              <div className="issue-meta-grid">
                <div className="issue-meta-card">
                  <span>Category</span>
                  <strong>{selectedComplaint.category}</strong>
                </div>
                <div className="issue-meta-card">
                  <span>Severity</span>
                  <strong>{selectedComplaint.severity}</strong>
                </div>
                <div className="issue-meta-card">
                  <span>Stage</span>
                  <strong className={`status-pill ${String(selectedComplaint.status || "Pending").toLowerCase().replace(/\s+/g, "-")}`}>
                    {formatStatusLabel(selectedComplaint.status)}
                  </strong>
                </div>
                <div className="issue-meta-card">
                  <span>Location</span>
                  <strong>{`${Number(selectedComplaint.location.lat).toFixed(4)}, ${Number(selectedComplaint.location.lng).toFixed(4)}`}</strong>
                </div>
              </div>

              <div className="issue-drawer-section">
                <h4>Description</h4>
                <p>{selectedComplaint.description}</p>
              </div>

              <div className="issue-drawer-section">
                <h4>Timeline</h4>
                <div className="drawer-history">
                  {getStatusHistory(selectedComplaint).map((entry, index) => (
                    <div key={`${selectedComplaint._id}-drawer-${index}`} className="drawer-history-item">
                      <span className={`status-pill ${String(entry.status || "Pending").toLowerCase().replace(/\s+/g, "-")}`}>
                        {entry.label || formatStatusLabel(entry.status)}
                      </span>
                      <p>{formatTimestamp(entry.changedAt)}</p>
                      <small>by {entry.changedBy || "system"}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="issue-drawer-section">
                <h4>Timestamps</h4>
                <p><strong>Posted:</strong> {formatTimestamp(selectedComplaint.createdAt)}</p>
                <p><strong>Solved:</strong> {selectedComplaint.status === "Resolved" ? formatTimestamp(selectedComplaint.resolvedAt) : "Not solved yet"}</p>
              </div>

              {hasAdminAccess && (
                <div className="issue-drawer-section">
                  <h4>Admin Actions</h4>
                  <div className="drawer-actions">
                    <button type="button" onClick={() => updateComplaintStatus(selectedComplaint._id, "Pending")}>
                      Mark Pending
                    </button>
                    <button type="button" onClick={() => updateComplaintStatus(selectedComplaint._id, "In Progress")}>
                      Mark In Progress
                    </button>
                    <button type="button" className="drawer-finish-btn" onClick={() => updateComplaintStatus(selectedComplaint._id, "Resolved")}>
                      Mark Finished
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="issue-drawer-empty">
              <p className="issue-drawer-eyebrow">Issue Details</p>
              <h3>Select a pin on the map</h3>
              <p>We’ll show the image, stage history, timestamps, and admin controls here.</p>
            </div>
          )}
        </aside>
      </div>

    </div>

  );

}
