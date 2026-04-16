import type { StyleSpecification } from 'maplibre-gl'

const satelliteStyle: StyleSpecification = {
  version: 8,
  name: 'Satellite',
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        '© Esri, Maxar, Earthstar Geographics — <a href="https://www.esri.com/">Esri</a>',
    },
  },
  layers: [
    {
      id: 'esri-satellite',
      type: 'raster',
      source: 'esri',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

export type BaseLayerId = 'minimal' | 'blueprint' | 'terrain' | 'satellite'

export const MAP_BASE_LAYERS: {
  id: BaseLayerId
  label: string
  description: string
  style: string | StyleSpecification
}[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Light basemap',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    description: 'Low-light contrast',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  {
    id: 'terrain',
    label: 'Terrain',
    description: 'Topographic context',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    description: 'Aerial imagery',
    style: satelliteStyle,
  },
]
