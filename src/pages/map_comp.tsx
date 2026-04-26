import React, { useEffect, useRef } from 'react';
import MapView from '@arcgis/core/views/MapView';
import Map from '@arcgis/core/Map';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Expand from '@arcgis/core/widgets/Expand';

// Import CSS
import '@arcgis/core/assets/esri/themes/light/main.css';

const CREDENTIALS = {
  username: import.meta.env.VITE_ARCGIS_USERNAME,
  password: import.meta.env. VITE_ARCGIS_PASSWORD,
  portalUrl: 'https://feccorp.maps.arcgis.com/sharing/rest',
  serviceUrl: import.meta.env.VITE_ARCGIS_SERVICE_ROOT
};

export const ArcGISMap = () => {
  const mapDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let view: MapView;

    const initializeMap = async () => {
      try {
        // 1. Silent Authentication
        const formData = new URLSearchParams();
        formData.append('username', CREDENTIALS.username);
        formData.append('password', CREDENTIALS.password);
        formData.append('referer', window.location.origin);
        formData.append('f', 'json');

        const tokenResp = await fetch(`${CREDENTIALS.portalUrl}/generateToken`, { method: 'POST', body: formData });
        const tokenData = await tokenResp.json();

        if (tokenData.token) {
          ["https://feccorp.maps.arcgis.com", "https://services5.arcgis.com"].forEach(s => 
            IdentityManager.registerToken({ server: s, token: tokenData.token })
          );
        }

        // 2. Load all 8 Sublayers (ordered so points stay on top of lines)
        // IDs: 0=Service Location, 1=Event Warning... 7=Drop Fiber
        const sublayerIds = [8, 7, 6, 5, 4, 3, 2, 1, 0];
        const layers = sublayerIds.map(id => new FeatureLayer({
          url: `${CREDENTIALS.serviceUrl}/${id}`,
          outFields: ["*"]
        }));

        const map = new Map({
          basemap: "hybrid", // Default to Imagery Hybrid
          layers: layers 
        });

        view = new MapView({
          container: mapDiv.current!,
          map: map,
          padding: { top: 10 }
        });

        // 3. Add the Basemap Toggle UI (Collapsed by default)
        const bgWidget = new BasemapGallery({
          view: view,
          container: document.createElement("div") // Create node for the widget
        });

        const bgExpand = new Expand({
          view: view,
          content: bgWidget.container, // Pass the DOM node
          expandIcon: "basemap",       // Standard icon for basemaps
          expanded: false              // Starts closed
        });

        view.ui.add(bgExpand, "top-right");

        // 4. Auto-zoom to the actual layer area
        // We wait for the Service Locations layer to load, then zoom to its extent
        layers[7].when(() => {
          if (layers[7].fullExtent) {
            view.goTo(layers[7].fullExtent, { duration: 1500 });
          }
        });

      } catch (error) {
        console.error("ArcGIS Error:", error);
      }
    };

    if (mapDiv.current) initializeMap();

    return () => {
      if (view) view.destroy();
    };
  }, []);

  return (
    <section className="fc-panel overflow-hidden border border-slate-200 rounded-xl mb-4 relative" style={{ height: '700px', width: '100%' }}>
      <div className="h-full w-full" ref={mapDiv} />
    </section>
  );
};