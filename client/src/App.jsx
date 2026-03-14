import { BrowserRouter,Routes,Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Report from "./pages/Report";
import Admin from "./pages/Admin";
import Home from "./pages/Home";

function App(){

 return(

  <BrowserRouter>

   <Navbar/>

   <Routes>

    <Route
    path="/"
    element={<Home/>}
    />

    <Route
    path="/report"
    element={<Report/>}
    />

    <Route
    path="/analytics"
    element={<AnalyticsDashboard/>}
    />

    <Route
    path="/admin"
    element={<Admin/>}
    />

   </Routes>

  </BrowserRouter>

 );

}

export default App;
