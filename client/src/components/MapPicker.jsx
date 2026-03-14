import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useState, useEffect } from "react";

function LocationMarker({ setLocation }) {

 const [position,setPosition] = useState(null);

 useMapEvents({
  click(e){
   setPosition(e.latlng);
   setLocation(e.latlng);
  }
 });

 return position ? <Marker position={position}/> : null;
}

function ChangeView({ coords }){

 const map = useMap();

 useEffect(()=>{
  if(coords){
   map.setView([coords.lat,coords.lng],15);
  }
 },[coords]);

 return null;
}

export default function MapPicker({ setLocation }){

 const [query,setQuery] = useState("");
 const [results,setResults] = useState([]);
 const [coords,setCoords] = useState(null);

 const runSearch = async (value)=>{
  const searchValue = value.trim();

  if(searchValue.length < 3){
   setResults([]);
   return;
  }

  const res = await fetch(
   `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}`
  );

  const data = await res.json();

  setResults(data);
 };

 const searchLocation = async (value)=>{
  setQuery(value);
  await runSearch(value);
 };

 const selectLocation = (place)=>{

  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lon);

  const location = {lat,lng};

  setCoords(location);
  setLocation(location);

  setResults([]);
  setQuery(place.display_name);
 };

 const locateMe = ()=>{

  navigator.geolocation.getCurrentPosition((pos)=>{

   const location = {
    lat:pos.coords.latitude,
    lng:pos.coords.longitude
   };

   setCoords(location);
   setLocation(location);

  });

 };

 return(

  <div className="map-section">

   <div className="map-search">

    <input
     placeholder="Search location..."
     value={query}
     onChange={(e)=>searchLocation(e.target.value)}
    />

    <button onClick={()=>runSearch(query)}>
     Search
    </button>

    <button onClick={locateMe}>
     Locate Me
    </button>

   </div>

   {results.length > 0 && (

    <div className="location-results">

     {results.map((place)=>(
      
      <div
       key={place.place_id}
       className="location-item"
       onClick={()=>selectLocation(place)}
      >
       {place.display_name}
      </div>

     ))}

    </div>

   )}

   <MapContainer
    center={[13.0827,80.2707]}
    zoom={13}
    className="map-container"
   >

    <TileLayer
     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <ChangeView coords={coords} />

    <LocationMarker setLocation={setLocation}/>

   </MapContainer>

  </div>

 );

}
