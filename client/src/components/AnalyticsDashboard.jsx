import { Bar, Line } from "react-chartjs-2";
import { useEffect, useState } from "react";
import API from "../services/api";
import "./AnalyticsDashboard.css";

import {
 Chart as ChartJS,
 CategoryScale,
 LinearScale,
 BarElement,
 LineElement,
 PointElement,
 Title,
 Tooltip,
 Legend
} from "chart.js";

ChartJS.register(
 CategoryScale,
 LinearScale,
 BarElement,
 LineElement,
 PointElement,
 Title,
 Tooltip,
 Legend
);

export default function AnalyticsDashboard(){

 const [complaints,setComplaints] = useState([]);
 const [categoryFilter,setCategoryFilter] = useState("All");
 const [statusFilter,setStatusFilter] = useState("All");
 const [insights,setInsights] = useState([]);
 const [insightsSource,setInsightsSource] = useState("heuristic");
 const [insightsLoading,setInsightsLoading] = useState(false);

 useEffect(()=>{
  loadComplaints();
 },[]);

 useEffect(()=>{
  loadInsights();
 },[categoryFilter,statusFilter]);

 const loadComplaints = async()=>{
  try{
   const res = await API.get("/complaints");
   setComplaints(Array.isArray(res.data) ? res.data : []);
  }
  catch(err){
   console.error("Failed to load complaints",err);
   setComplaints([]);
  }
 };

 const loadInsights = async()=>{
  setInsightsLoading(true);

  try{
   const res = await API.get("/complaints/insights", {
    params:{
     category:categoryFilter,
     status:statusFilter
    }
   });

   setInsights(Array.isArray(res.data?.insights) ? res.data.insights : []);
   setInsightsSource(res.data?.source || "heuristic");
  }
  catch(err){
   console.error("Failed to load insights",err);
   setInsights([]);
   setInsightsSource("heuristic");
  }
  finally{
   setInsightsLoading(false);
  }
 };

 const formatStatusLabel = (statusValue)=>{
  if(statusValue === "Resolved") return "Finished";

  return statusValue || "Pending";
 };

 const validComplaints = complaints.filter((c)=>{
  const lat = Number(c?.location?.lat);
  const lng = Number(c?.location?.lng);

  return Number.isFinite(lat) && Number.isFinite(lng);
 });

 const filteredComplaints = complaints.filter((c)=>{
  if(categoryFilter !== "All" && c.category !== categoryFilter) return false;
  if(statusFilter !== "All" && c.status !== statusFilter) return false;

  return true;
 });

 const filteredValidComplaints = validComplaints.filter((c)=>{
  if(categoryFilter !== "All" && c.category !== categoryFilter) return false;
  if(statusFilter !== "All" && c.status !== statusFilter) return false;

  return true;
 });

 /* -------------------- BASIC STATS -------------------- */

 const total = filteredComplaints.length;

 const pending = filteredComplaints.filter(c=>c.status==="Pending").length;

 const inProgress = filteredComplaints.filter(c=>c.status==="In Progress").length;

 const resolved = filteredComplaints.filter(c=>c.status==="Resolved").length;

 /* -------------------- CATEGORY BAR CHART -------------------- */

 const categories = ["Roads","Water","Electricity","Sanitation"];

 const categoryCounts = categories.map(cat =>
  filteredComplaints.filter(c=>c.category===cat).length
 );

 const categoryData = {
  labels: categories,
  datasets:[
   {
    label:"Complaints",
    data:categoryCounts,
    backgroundColor:[
     "#ff6384",
     "#36a2eb",
     "#ffce56",
     "#4bc0c0"
    ]
   }
  ]
 };

 /* -------------------- TREND GRAPH -------------------- */

 const dateCounts = {};

 filteredComplaints.forEach(c=>{
  const date = new Date(c.createdAt).toLocaleDateString();
  dateCounts[date] = (dateCounts[date] || 0) + 1;
 });

 const trendData = {
  labels: Object.keys(dateCounts),
  datasets:[
   {
    label:"Complaints per day",
    data:Object.values(dateCounts),
    borderColor:"#4bc0c0",
    backgroundColor:"#4bc0c0"
   }
  ]
 };

 /* -------------------- AREA ANALYSIS -------------------- */

 const areaCounts = {};

 filteredValidComplaints.forEach(c=>{

  const area = `${Number(c.location.lat).toFixed(2)},${Number(c.location.lng).toFixed(2)}`;

  areaCounts[area] = (areaCounts[area] || 0) + 1;

 });

 const sortedAreas = Object.entries(areaCounts)
 .sort((a,b)=>b[1]-a[1])
 .slice(0,5);

 const areaData = {
  labels: sortedAreas.map(a=>a[0]),
  datasets:[
   {
    label:"Top Complaint Zones",
    data: sortedAreas.map(a=>a[1]),
    backgroundColor:"#ff6384"
   }
  ]
 };

 const statusLabels = ["Pending","In Progress","Resolved"];

 const statusData = {
  labels: statusLabels.map(formatStatusLabel),
  datasets:[
   {
    label:"Complaints by Stage",
    data: statusLabels.map((statusOption) =>
     filteredComplaints.filter((c)=>c.status===statusOption).length
    ),
    backgroundColor:["#fbbf24","#60a5fa","#34d399"]
   }
  ]
 };

 /* -------------------- UI -------------------- */

 return(

 <div className="analytics">

  <div className="insights-card">
   <div className="insights-header">
    <div>
     <p className="insights-eyebrow">Smart Insights</p>
     <h3>Operations summary for the current view</h3>
    </div>
    <span className={`insights-badge ${insightsSource}`}>
     {insightsSource === "openai" ? "AI-powered" : "Heuristic"}
    </span>
   </div>

   {insightsLoading ? (
    <p className="insights-loading">Generating insights...</p>
   ) : (
    <div className="insights-list">
     {insights.map((insight,index)=>(
      <div key={`${insight}-${index}`} className="insight-item">
       {insight}
      </div>
     ))}
     {!insights.length && (
      <div className="insight-item">
       No insights are available for the current filters yet.
      </div>
     )}
    </div>
   )}
  </div>

  {/* STAT CARDS */}

 <div className="cards">

   <div className="card">
    <h3>Total Complaints</h3>
    <p>{total}</p>
   </div>

   <div className="card">
    <h3>Pending</h3>
    <p>{pending}</p>
   </div>

   <div className="card">
    <h3>In Progress</h3>
    <p>{inProgress}</p>
   </div>

   <div className="card">
    <h3>Finished</h3>
    <p>{resolved}</p>
   </div>

  </div>

  <div className="analytics-filters">
   <select
    value={categoryFilter}
    onChange={(e)=>setCategoryFilter(e.target.value)}
   >
    <option value="All">All Categories</option>
    {categories.map((category)=>(
     <option key={category} value={category}>
      {category}
     </option>
    ))}
   </select>

   <select
    value={statusFilter}
    onChange={(e)=>setStatusFilter(e.target.value)}
   >
    <option value="All">All Stages</option>
    <option value="Pending">Pending</option>
    <option value="In Progress">In Progress</option>
    <option value="Resolved">Finished</option>
   </select>
  </div>

  {/* CATEGORY CHART */}

  <div className="chart-card">
   <h3>Cases by Type</h3>
   <Bar data={categoryData}/>
  </div>

  <div className="chart-card">
   <h3>Issue Stages</h3>
   <Bar data={statusData}/>
  </div>

  {/* TREND GRAPH */}

  <div className="chart-card">
   <h3>Complaint Trends</h3>
   <Line data={trendData}/>
  </div>

  {/* AREA HOTSPOTS */}

  <div className="chart-card">
   <h3>Top Complaint Areas</h3>
   <Bar data={areaData}/>
  </div>

 </div>

 );
}
