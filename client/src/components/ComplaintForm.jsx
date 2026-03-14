import { useState } from "react";
import API from "../services/api";
import ImageUpload from "./ImageUpload";
import MapPicker from "./MapPicker";
import "../styles/form.css";

export default function ComplaintForm(){

 const [form,setForm] = useState({
  title:"",
  description:"",
  category:"Roads",
  severity:"Low"
 });

 const [location,setLocation] = useState(null);
 const [file,setFile] = useState(null);

 const handleChange = (e)=>{
  setForm({
   ...form,
   [e.target.name]:e.target.value
  });
 };

 const submitComplaint = async ()=>{

  try{
   if(!location){
    alert("Please search or select a location on the map");
    return;
   }

   const data = new FormData();

   data.append("title",form.title);
   data.append("description",form.description);
   data.append("category",form.category);
   data.append("severity",form.severity);

   if(location){
    data.append("lat",location.lat);
    data.append("lng",location.lng);
   }

   if(file){
    data.append("image",file);
   }

   const res = await API.post("/complaints/create",data);

   console.log(res.data);

   alert("Complaint submitted");

   setForm({
    title:"",
    description:"",
    category:"Roads",
    severity:"Low"
   });
   setLocation(null);
   setFile(null);

  }
  catch(err){

   console.error(err);
   const message =
    err?.response?.data?.error ||
    err?.message ||
    "Submission failed";

   alert(`Submission failed: ${message}`);

  }

 };

 return(

  <div className="form-container">

   <h2>Report Civic Issue</h2>

   <input
    name="title"
    placeholder="Title"
    value={form.title}
    onChange={handleChange}
   />

   <textarea
    name="description"
    placeholder="Describe problem"
    value={form.description}
    onChange={handleChange}
   />

   <select
    name="category"
    value={form.category}
    onChange={handleChange}
   >
    <option>Roads</option>
    <option>Water</option>
    <option>Electricity</option>
    <option>Sanitation</option>
   </select>

   <select
    name="severity"
    value={form.severity}
    onChange={handleChange}
   >
    <option>Low</option>
    <option>Medium</option>
    <option>High</option>
    <option>Critical</option>
   </select>

   <MapPicker setLocation={setLocation} />

   <ImageUpload setFile={setFile} />

   <button onClick={submitComplaint}>
    Submit Complaint
   </button>

  </div>

 );

}
