import { BrowserRouter,Routes,Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import MapDashboard from "./components/MapDashboard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Report from "./pages/Report";

function App(){

 return(

  <BrowserRouter>

   <Navbar/>

   <Routes>

    <Route
    path="/"
    element={<MapDashboard/>}
    />

    <Route
    path="/report"
    element={<Report/>}
    />

    <Route
    path="/analytics"
    element={<AnalyticsDashboard/>}
    />

   </Routes>

  </BrowserRouter>

 );

}

export default App;
