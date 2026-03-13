import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomeFeed from "./components/HomeFeed";

// Temporary placeholder components for your pages
const Home = () => <div><h1 className="text-2xl font-bold mb-4">Home Feed</h1><p>Post feed goes here!</p></div>;
const MapView = () => <div><h1 className="text-2xl font-bold">Dog Park Map</h1></div>;
const HealthVault = () => <div><h1 className="text-2xl font-bold">Health Vault</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route index element={<HomeFeed />} />
          <Route path="map" element={<MapView />} />
          <Route path="health" element={<HealthVault />} />
          {/* Add more routes here as you build them */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;