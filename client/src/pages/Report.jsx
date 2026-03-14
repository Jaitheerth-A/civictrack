import { useNavigate } from "react-router-dom";
import ComplaintForm from "../components/ComplaintForm";

export default function Report(){

 const navigate = useNavigate();

 return(

  <div className="report-page">

   <button
    className="report-back-btn"
    onClick={()=>navigate("/")}
   >
    ← Back
   </button>

   <ComplaintForm/>

  </div>

 );

}
