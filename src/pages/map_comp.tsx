import { useEffect, useRef } from 'react';
import MapView from '@arcgis/core/views/MapView';
import Map from '@arcgis/core/Map';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Expand from '@arcgis/core/widgets/Expand';
import Legend from '@arcgis/core/widgets/Legend';
import '@arcgis/core/assets/esri/themes/light/main.css';

const CREDENTIALS = {
  username: import.meta.env.VITE_ARCGIS_USERNAME,
  password: import.meta.env.VITE_ARCGIS_PASSWORD,
  portalUrl: 'https://feccorp.maps.arcgis.com/sharing/rest',
  serviceUrl: import.meta.env.VITE_ARCGIS_SERVICE_ROOT
};

export const ArcGISMap = () => {
  const mapDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let view: MapView;

    const initializeMap = async () => {
      try {
        // 1. Authentication
        const formData = new URLSearchParams();
        formData.append('username', CREDENTIALS.username);
        formData.append('password', CREDENTIALS.password);
        formData.append('referer', window.location.origin);
        formData.append('f', 'json');

        const tokenResp = await fetch(`${CREDENTIALS.portalUrl}/generateToken`, {
          method: 'POST',
          body: formData
        });
        const tokenData = await tokenResp.json();

        if (tokenData.token) {
          ["https://feccorp.maps.arcgis.com", "https://services5.arcgis.com"].forEach(s =>
            IdentityManager.registerToken({ server: s, token: tokenData.token })
          );
        }

        // 2. Define all 8 Sublayers
        // Ordered from Bottom (Lines) to Top (Points)
        // 7=Drop Fiber, 6=Distribution Fiber, 5=Handhole, 4=Dist Splice, 3=Drop Splice, 2=PON Cabinet, 1=Event Warning, 0=Service Location
        const sublayerIds = [7, 6, 5, 4, 3, 2, 1, 0];

        const layers = sublayerIds.map(id => {
          const layer = new FeatureLayer({
            url: `${CREDENTIALS.serviceUrl}/${id}`,
            outFields: ["*"],
            visible: true
          });

          // Check if the layer is allowed/accessible
          layer.load().catch((err) => {
            console.error(`Layer ${id} Load Error:`, err);
            if (err.name === "identity-manager:not-authorized" || err.code === 403) {
              layer.title = `${layer.title || 'Layer ' + id} (Access Forbidden)`;
            }
          });

          return layer;
        });

        const map = new Map({
          basemap: "hybrid",
          layers: layers
        });

        view = new MapView({
          container: mapDiv.current!,
          map: map,
          padding: { top: 10, right: 0, bottom: 0, left: 0 }
        });

        // 3. UI Widgets
        const bgExpand = new Expand({
          view: view,
          content: new BasemapGallery({ view: view }),
          expandIcon: "basemap"
        });
        view.ui.add(bgExpand, "top-right");

        // NEW: Legend Widget to show status
        const legend = new Legend({ view: view });
        const legendExpand = new Expand({
          view: view,
          content: legend,
          expandIcon: "legend",
          expanded: true // Start expanded so you can see the layer status immediately
        });
        view.ui.add(legendExpand, "bottom-left");

        // 4. Auto-zoom
   // 4. Auto-zoom with TypeScript safety
layers[3].when(() => {
  if (layers[3].fullExtent) {
    view.goTo({
      target: layers[3].fullExtent,
      zoom: 17.5 // Set your desired zoom level here (0 is world, 20 is street)
    }, { 
      duration: 1500,
      easing: "ease-in-out" 
    });
  }
});

      } catch (error) {
        console.error("ArcGIS Main Initialization Error:", error);
      }
    };

    if (mapDiv.current) initializeMap();
    return () => { if (view) view.destroy(); };
  }, []);

  return (
    <section className="fc-panel overflow-hidden border border-slate-200 rounded-xl mb-4 relative" style={{ height: '700px', width: '100%' }}>
      <div className="h-full w-full" ref={mapDiv} />
    </section>
  );
};