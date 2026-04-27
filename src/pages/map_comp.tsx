import { useCallback, useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import MapView from '@arcgis/core/views/MapView';
import Map from '@arcgis/core/Map';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Expand from '@arcgis/core/widgets/Expand';
import '@arcgis/core/assets/esri/themes/light/main.css';

import { ArcgisMapEventControls } from '@/components/ArcgisMapEventControls';
import { ArcgisLegendExpandContent } from '@/components/ArcgisLegendExpandContent';
import { applyDistributionFiberRenderer } from '@/lib/arcgisDistributionFiberRenderer';
import {
  dedupeOrderedSublayerIds,
  fetchMapServiceLayers,
  resolveOrderedLayerIds,
} from '@/services/arcgisService';

const CREDENTIALS = {
  username: import.meta.env.VITE_ARCGIS_USERNAME,
  password: import.meta.env.VITE_ARCGIS_PASSWORD,
  portalUrl: 'https://feccorp.maps.arcgis.com/sharing/rest',
  serviceUrl: import.meta.env.VITE_ARCGIS_SERVICE_ROOT
};

export const ArcGISMap = () => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const eventWarningLayerRef = useRef<InstanceType<typeof FeatureLayer> | null>(null);

  const refreshEventWarningLayer = useCallback(() => {
    const layer = eventWarningLayerRef.current
    if (layer) {
      void layer.refresh()
    }
  }, [])

  useEffect(() => {
    let view: MapView | undefined;
    let legendReactRoot: Root | undefined;

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

        if (!tokenData.token) {
          console.error('ArcGIS: no token; cannot load service metadata or layers.');
          return;
        }

        // 2. Sublayers: resolve IDs from service metadata (hardcoded indices break when the service is republished).
        const metaLayers = await fetchMapServiceLayers(
          CREDENTIALS.serviceUrl,
          tokenData.token,
        );
        let sublayerIds = dedupeOrderedSublayerIds(
          resolveOrderedLayerIds(metaLayers),
          metaLayers,
        );
        if (sublayerIds.length === 0 && metaLayers.length > 0) {
          sublayerIds = dedupeOrderedSublayerIds(
            [...metaLayers].sort((a, b) => a.id - b.id).map((l) => l.id),
            metaLayers,
          );
        }
        if (sublayerIds.length === 0) {
          // Bottom → top; 0 = Service Location, 1 = Event Warning — keep 1 last so warnings stay on top.
          sublayerIds = [7, 6, 5, 4, 3, 2, 0, 1];
        }
        if (import.meta.env.DEV) {
          console.info(
            '[ArcGIS] sublayers:',
            metaLayers.map((l) => `${l.id}=${l.name}`).join(', ') || '(none from metadata)',
            '→ order:',
            sublayerIds.join(','),
          );
        }

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

        eventWarningLayerRef.current = null
        const eventWarningMeta = metaLayers.find((l) => {
          const s = l.name.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
          return s.includes('event') && s.includes('warning')
        })
        if (eventWarningMeta) {
          const ix = sublayerIds.indexOf(eventWarningMeta.id)
          if (ix >= 0) {
            eventWarningLayerRef.current = layers[ix] as InstanceType<typeof FeatureLayer>
          }
        }

        // DigitalTwin-style Distribution Fiber: color by Size, dash vs solid by Placement (AER / UG).
        for (const layer of layers) {
          void layer.when().then(() => applyDistributionFiberRenderer(layer));
        }

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

        // Legend + per-layer visibility (Eye / EyeOff) in the expand panel
        const legendHost = document.createElement('div');
        legendReactRoot = createRoot(legendHost);
        legendReactRoot.render(<ArcgisLegendExpandContent view={view} />);
        const legendExpand = new Expand({
          view: view,
          content: legendHost,
          expandIcon: 'legend',
          expanded: true,
        });
        view.ui.add(legendExpand, 'bottom-left');

        // 4. Auto-zoom to first layer that exposes a usable extent (index 3 was brittle).
        const zoomToFirstExtent = async () => {
          for (const layer of layers) {
            try {
              await layer.load();
              const ext = layer.fullExtent;
              if (ext && ext.width > 0 && ext.height > 0) {
                await view.goTo(
                  { target: ext, zoom: 17.5 },
                  { duration: 1500, easing: 'ease-in-out' },
                );
                return;
              }
            } catch {
              /* layer may be empty or inaccessible */
            }
          }
        };
        void zoomToFirstExtent();

      } catch (error) {
        console.error("ArcGIS Main Initialization Error:", error);
      }
    };

    if (mapDiv.current) initializeMap();
    return () => {
      eventWarningLayerRef.current = null;
      legendReactRoot?.unmount();
      legendReactRoot = undefined;
      view?.destroy();
      view = undefined;
    };
  }, []);

  return (
    <section
      className="fc-panel relative mb-4 overflow-hidden rounded-xl border border-slate-200"
      style={{ height: '700px', width: '100%' }}
    >
      <div className="h-full w-full" ref={mapDiv} />
      <ArcgisMapEventControls onEventWarningLayerChange={refreshEventWarningLayer} />
    </section>
  );
};