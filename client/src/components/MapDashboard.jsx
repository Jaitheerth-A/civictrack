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
  };

  const formatStatusLabel = (statusValue) => {
    if (statusValue === "Resolved") return "Finished";

    return statusValue || "Pending";
  };

  const formatTimestamp = (value) => {
    if (!value) return "Not available";

    return new Date(value).toLocaleString();
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
                zIndexOffset={1000}
                eventHandlers={{
                  mouseover: (e) => {
                    e.target._icon.classList.add("marker-hover");
                  },
                  mouseout: (e) => {
                    e.target._icon.classList.remove("marker-hover");
                  }
                }}
              >

                <Popup>

                  <b>{c.title}</b>

                  <br />

                  {c.description}

                  <br />

                Category: {c.category}

                <br />

                Severity: {c.severity}

                <br />

                Stage:{" "}
                <span className={`status-pill ${String(c.status || "Pending").toLowerCase().replace(/\s+/g, "-")}`}>
                    {formatStatusLabel(c.status)}
                  </span>

                  <br />

                  Posted: {formatTimestamp(c.createdAt)}

                  <br />

                  Solved: {c.status === "Resolved" ? formatTimestamp(c.resolvedAt) : "Not solved yet"}

              </Popup>

              </Marker>

            ))}

          </MarkerClusterGroup>

        </MapContainer>
      </div>

    </div>

  );

}
