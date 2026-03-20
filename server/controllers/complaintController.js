const Complaint = require("../models/Complaint");
const XLSX = require("xlsx");

function formatStatusLabel(status){
 if(status === "Resolved") return "Finished";

 return status || "Pending";
}

function buildInsightsSnapshot(complaints){
 const total = complaints.length;
 const pending = complaints.filter((c)=>c.status === "Pending").length;
 const inProgress = complaints.filter((c)=>c.status === "In Progress").length;
 const finished = complaints.filter((c)=>c.status === "Resolved").length;

 const categoryCounts = complaints.reduce((acc, complaint)=>{
  const key = complaint.category || "Unknown";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
 }, {});

 const hotspotCounts = complaints.reduce((acc, complaint)=>{
  if(!complaint.location) return acc;

  const key = `${Number(complaint.location.lat).toFixed(2)}, ${Number(complaint.location.lng).toFixed(2)}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
 }, {});

 const averageResolutionHours = complaints
  .filter((complaint)=>complaint.createdAt && complaint.resolvedAt)
  .reduce((acc, complaint, _, source)=>{
   const hours = (new Date(complaint.resolvedAt) - new Date(complaint.createdAt)) / (1000 * 60 * 60);
   return acc + (hours / source.length);
  }, 0);

 return {
  total,
  pending,
  inProgress,
  finished,
  categoryCounts,
  topCategory: Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1])[0] || null,
  topHotspot: Object.entries(hotspotCounts).sort((a,b)=>b[1]-a[1])[0] || null,
  averageResolutionHours: Number.isFinite(averageResolutionHours) ? Number(averageResolutionHours.toFixed(1)) : null
 };
}

function buildHeuristicInsights(complaints, filters){
 const snapshot = buildInsightsSnapshot(complaints);
 const insights = [];

 if(snapshot.total === 0){
  insights.push("No complaints match the current filters, so there are no risk patterns to summarize yet.");
 } else {
  insights.push(
   `${snapshot.total} complaints match the current view, with ${snapshot.pending} pending, ${snapshot.inProgress} in progress, and ${snapshot.finished} finished.`
  );

  if(snapshot.topCategory){
   insights.push(
    `${snapshot.topCategory[0]} is the busiest category right now with ${snapshot.topCategory[1]} complaints in the filtered dataset.`
   );
  }

  if(snapshot.topHotspot){
   insights.push(
    `The strongest hotspot in this view is around ${snapshot.topHotspot[0]}, where ${snapshot.topHotspot[1]} complaints are clustered.`
   );
  }

  if(snapshot.averageResolutionHours !== null){
   insights.push(
    `Finished complaints in this view are taking about ${snapshot.averageResolutionHours} hours on average to close.`
   );
  } else {
   insights.push("There is not enough finished complaint data in this view yet to estimate average resolution time.");
  }
 }

 return {
  source: "heuristic",
  generatedAt: new Date().toISOString(),
  filters,
  insights
 };
}

async function buildOpenAIInsights(complaints, filters){
 const apiKey = process.env.OPENAI_API_KEY;

 if(!apiKey){
  return null;
 }

 const snapshot = buildInsightsSnapshot(complaints);
 const model = process.env.OPENAI_INSIGHTS_MODEL || "gpt-4o-mini";

 const prompt = [
  "You are an analytics copilot for a civic issue tracking dashboard.",
  "Write exactly 4 short, high-signal bullet points.",
  "Focus on risk, hotspots, resolution progress, and one practical recommendation.",
  "Keep each bullet under 28 words.",
  `Filters: ${JSON.stringify(filters)}`,
  `Snapshot: ${JSON.stringify(snapshot)}`
 ].join("\n");

 const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
   "Content-Type": "application/json",
   "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
   model,
   instructions: "Return concise dashboard insights for non-technical civic operations users.",
   input: prompt
  })
 });

 if(!response.ok){
  throw new Error(`OpenAI request failed with status ${response.status}`);
 }

 const data = await response.json();
 const outputText =
  data.output_text ||
  data.output?.flatMap((item)=>item.content || [])
   .filter((content)=>content.type === "output_text")
   .map((content)=>content.text)
   .join("\n") ||
  "";

 const insights = outputText
  .split("\n")
  .map((line)=>line.replace(/^[-*\d.\s]+/, "").trim())
  .filter(Boolean)
  .slice(0, 4);

 return {
  source: "openai",
  model,
  generatedAt: new Date().toISOString(),
  filters,
  insights: insights.length ? insights : buildHeuristicInsights(complaints, filters).insights
 };
}

exports.createComplaint = async (req,res)=>{

 try{

  const {title,description,category,severity,lat,lng} = req.body;

  const complaint = new Complaint({

   title,
   description,
   category,
   severity,

   location:{
    lat,
    lng
   },

   image:req.file ? req.file.filename : null,
   statusHistory:[
    {
     status:"Pending",
     label:formatStatusLabel("Pending"),
     changedAt:new Date(),
     changedBy:"system"
    }
   ]

  });

  await complaint.save();

  res.json(complaint);

 }
 catch(err){

  res.status(500).json({error:err.message});

 }

};


exports.getComplaints = async (req,res)=>{

 try{

  const complaints = await Complaint.find().sort({createdAt:-1});

  res.json(complaints);

 }
 catch(err){

  res.status(500).json({error:err.message});

 }

};

exports.getComplaintInsights = async (req,res)=>{

 try{
  const { category = "All", status = "All" } = req.query;

  const complaints = await Complaint.find().sort({createdAt:-1});

  const filteredComplaints = complaints.filter((complaint)=>{
   if(category !== "All" && complaint.category !== category) return false;
   if(status !== "All" && complaint.status !== status) return false;
   return true;
  });

  const filters = { category, status };

  try{
   const aiInsights = await buildOpenAIInsights(filteredComplaints, filters);

   if(aiInsights){
    return res.json(aiInsights);
   }
  }
  catch(error){
   console.error("OpenAI insights fallback triggered", error.message);
  }

  res.json(buildHeuristicInsights(filteredComplaints, filters));
 }
 catch(err){
  res.status(500).json({error:err.message});
 }

};


exports.updateStatus = async (req,res)=>{

 try{
  const nextStatus = req.body.status;
  const complaint = await Complaint.findById(req.params.id);

  if(!complaint){
   return res.status(404).json({error:"Complaint not found"});
  }

  const previousStatus = complaint.status || "Pending";
  const update = {
   status:nextStatus
  };

  if(nextStatus === "Resolved"){
   update.resolvedAt = new Date();
  }

  if(nextStatus !== "Resolved"){
   update.resolvedAt = null;
  }

  if(previousStatus !== nextStatus){
   complaint.statusHistory = [
    ...(complaint.statusHistory || []),
    {
     status:nextStatus,
     label:formatStatusLabel(nextStatus),
     changedAt:new Date(),
     changedBy:req.admin?.username || "admin"
    }
   ];
  }

  complaint.status = update.status;
  complaint.resolvedAt = update.resolvedAt;

  await complaint.save();

  res.json(complaint);

 }
 catch(err){

  res.status(500).json({error:err.message});

 }

};


exports.exportComplaints = async (req,res)=>{

 try{
  const complaints = await Complaint.find();

  const data = complaints.map(c=>({

   Title:c.title,
   Description:c.description,
   Category:c.category,
   Severity:c.severity,
   Stage:formatStatusLabel(c.status),
   Latitude:c.location?.lat ?? "",
   Longitude:c.location?.lng ?? "",
   PostedAt:c.createdAt ? new Date(c.createdAt).toLocaleString() : "",
   SolvedAt:c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : "",
   StatusTimeline:(c.statusHistory || [])
    .map((entry)=>`${entry.label} at ${new Date(entry.changedAt).toLocaleString()} by ${entry.changedBy || "system"}`)
    .join(" | ")

  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook,worksheet,"Complaints");

  const buffer = XLSX.write(workbook, {
   bookType:"xlsx",
   type:"buffer"
  });

  res.setHeader("Content-Disposition","attachment; filename=\"civictrack-complaints.xlsx\"");
  res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  res.send(buffer);
 }
 catch(err){
  res.status(500).json({error:err.message});
 }

};
