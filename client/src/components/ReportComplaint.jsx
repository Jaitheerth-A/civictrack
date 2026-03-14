import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import API from "../services/api";

function LocationMarker({ setLocation }) {

  useMapEvents({
    click(e) {
      setLocation(e.latlng);
    }
  });

  return null;
}

export default function ReportComplaint(){

  const [title,setTitle] = useState("");
  const [description,setDescription] = useState("");
  const [category,setCategory] = useState("Roads");
  const [severity,setSeverity] = useState("Low");

  const [location,setLocation] = useState(null);

  const submitComplaint = async ()=>{

    if(!location){
      alert("Select location on map");
      return;
    }

    await API.post("/complaints",{
      title,
      description,
      category,
      severity,
      location:{
        lat:location.lat,
        lng:location.lng
      }
    });

    alert("Complaint submitted");
  };

  return(

  <div style={{padding:"30px"}}>

    <h2>Report Civic Issue</h2>

    <input
    placeholder="Title"
    value={title}
    onChange={(e)=>setTitle(e.target.value)}
    />

    <br/><br/>

    <textarea
    placeholder="Description"
    value={description}
    onChange={(e)=>setDescription(e.target.value)}
    />

    <br/><br/>

    <select
    value={category}
    onChange={(e)=>setCategory(e.target.value)}
    >
      <option>Roads</option>
      <option>Water</option>
      <option>Electricity</option>
      <option>Sanitation</option>
    </select>

    <br/><br/>

    <select
    value={severity}
    onChange={(e)=>setSeverity(e.target.value)}
    >
      <option>Low</option>
      <option>Medium</option>
      <option>High</option>
    </select>

    <br/><br/>

    <MapContainer
      center={[13.0827,80.2707]}
      zoom={13}
      style={{height:"400px"}}
    >

      <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationMarker setLocation={setLocation}/>

      {location && (
        <Marker position={location}/>
      )}

    </MapContainer>

    <br/>

    <button onClick={submitComplaint}>
      Submit Complaint
    </button>

  </div>

  );
}