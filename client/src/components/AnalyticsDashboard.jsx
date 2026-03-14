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

 useEffect(()=>{
  loadComplaints();
 },[]);

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

 const validComplaints = complaints.filter((c)=>{
  const lat = Number(c?.location?.lat);
  const lng = Number(c?.location?.lng);

  return Number.isFinite(lat) && Number.isFinite(lng);
 });

 /* -------------------- BASIC STATS -------------------- */

 const total = complaints.length;

 const pending = complaints.filter(c=>c.status==="Pending").length;

 const resolved = complaints.filter(c=>c.status==="Resolved").length;

 /* -------------------- CATEGORY BAR CHART -------------------- */

 const categories = ["Roads","Water","Electricity","Sanitation"];

 const categoryCounts = categories.map(cat =>
  complaints.filter(c=>c.category===cat).length
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

 complaints.forEach(c=>{
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

 validComplaints.forEach(c=>{

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

 /* -------------------- UI -------------------- */

 return(

 <div className="analytics">

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
    <h3>Resolved</h3>
    <p>{resolved}</p>
   </div>

  </div>

  {/* CATEGORY CHART */}

  <div className="chart-card">
   <h3>Cases by Type</h3>
   <Bar data={categoryData}/>
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
