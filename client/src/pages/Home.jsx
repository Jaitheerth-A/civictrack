import { useNavigate } from "react-router-dom";
import MapDashboard from "../components/MapDashboard";

export default function Home(){

 const navigate = useNavigate();

 return(

  <div className="home-page">

   <div className="home-header">

    <h1>CivicTrack</h1>

    <button
     className="report-btn"
     onClick={()=>navigate("/report")}
    >
     Report Civic Issue
    </button>

   </div>

   <MapDashboard/>

  </div>

 );

}