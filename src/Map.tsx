import { useEffect, useRef, useState } from 'react';
import WebMap from '@arcgis/core/WebMap.js';
import MapView from '@arcgis/core/views/MapView.js';
import '@arcgis/core/assets/esri/themes/light/main.css';
// 
const MapDashboard = () => {
  const mapDiv = useRef(null);
  const [activeMapId, setActiveMapId] = useState('a1e59770fbbc44b2b71172112fa96124');

  const mapsList = [
    { title: "McCall Impact Assessment", id: "a1e59770fbbc44b2b71172112fa96124" },
    { title: "JPUD Fiber Status", id: "a7b011003d364640ba661a9366778300" },
    { title: "MN Grant Map", id: "1b01f51de1e549629b8cf1831b210486" },
    {title: "3D Test", id: "36605741870743c1bc967119f4a5661d"}
  ];

  useEffect(() => {
    if (mapDiv.current) {
      // Initialize WebMap with the selected ID
      const webmap = new WebMap({
        portalItem: {
          id: activeMapId
        }
      });

      const view = new MapView({
        container: mapDiv.current,
        map: webmap
      });

      return () => view && view.destroy();
    }
  }, [activeMapId]); // Re-run whenever activeMapId changes

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar List */}
      <div style={{ width: '300px', background: '#f4f4f4', padding: '20px', borderRight: '1px solid #ddd' }}>
        <h3>Available Maps</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {mapsList.map(map => (
            <li key={map.id} style={{ marginBottom: '10px' }}>
              <button 
                onClick={() => setActiveMapId(map.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: activeMapId === map.id ? '#0070ff' : '#fff',
                  color: activeMapId === map.id ? '#fff' : '#000',
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {map.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Map Display */}
      <div style={{ flex: 1 }} ref={mapDiv}></div>
    </div>
  );
};

export default MapDashboard;