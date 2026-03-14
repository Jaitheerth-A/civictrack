import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar(){

 return(

  <div className="navbar">

    <NavLink
    to="/"
    className="logo"
    >
    CivicTrack
    </NavLink>

    <div className="nav-buttons">

      <NavLink
      to="/"
      end
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
      Map
      </NavLink>

      <NavLink
      to="/report"
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
      Report Issue
      </NavLink>

      <NavLink
      to="/analytics"
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
      Analytics
      </NavLink>

      <NavLink
      to="/admin"
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
      Admin
      </NavLink>

    </div>

  </div>

 );

}
