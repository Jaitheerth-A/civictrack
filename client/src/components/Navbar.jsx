import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar(){

 const navigate = useNavigate();

 return(

  <div className="navbar">

    <h1
    className="logo"
    onClick={()=>navigate("/")}
    >
    CivicTrack
    </h1>

    <div className="nav-buttons">

      <button
      onClick={()=>navigate("/")}
      >
      Map
      </button>

      <button
      onClick={()=>navigate("/report")}
      >
      Report Issue
      </button>

      <button
      onClick={()=>navigate("/analytics")}
      >
      Analytics
      </button>

    </div>

  </div>

 );

}