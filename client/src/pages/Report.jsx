import { useNavigate } from "react-router-dom";
import ComplaintForm from "../components/ComplaintForm";

export default function Report(){

 const navigate = useNavigate();

 return(

  <div>

   <button
    onClick={()=>navigate("/")}
    style={{
     margin:"20px",
     padding:"8px 16px",
     cursor:"pointer"
    }}
   >
    ← Back
   </button>

   <ComplaintForm/>

  </div>

 );

}