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

  Low: createSeverityIcon("#22c55e"),

  Medium: createSeverityIcon("#eab308"),

  High: createSeverityIcon("#ef4444")

};

const clusterIcon = (cluster) =>
  L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: "complaint-cluster-icon",
    iconSize: [44, 44],
  });

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

/* ---------------- HEATMAP ---------------- */

function HeatmapLayer({ complaints }) {

  const map = useMap();

  useEffect(() => {
    if (!complaints.length) return undefined;

    const points = complaints.map(c => {

      let intensity = 0.3;

      if (c.severity === "Medium") intensity = 0.6;
      if (c.severity === "High") intensity = 1;

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
  const [heatmap, setHeatmap] = useState(false);

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

  /* ---------------- FILTER ---------------- */

  const validComplaints = complaints.filter((c) => {
    const lat = Number(c?.location?.lat);
    const lng = Number(c?.location?.lng);

    return Number.isFinite(lat) && Number.isFinite(lng);
  });

  const filtered = validComplaints.filter(c => {

    if (category !== "All" && c.category !== category) return false;
    if (severity !== "All" && c.severity !== severity) return false;

    return true;

  });

  return (

    <div className="dashboard">

      {/* FILTER BAR */}

      <div className="filter-bar">

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
        </select>

        <button
          onClick={() => setHeatmap(!heatmap)}
        >
          Toggle Heatmap
        </button>

      </div>

      {/* MAP */}

      <MapContainer
        center={[13.0827, 80.2707]}
        zoom={13}
        className="dashboard-map"
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMap complaints={filtered} />

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
              icon={icons[c.severity] || icons.Low}
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

              </Popup>

            </Marker>

          ))}

        </MarkerClusterGroup>

      </MapContainer>

    </div>

  );

}
