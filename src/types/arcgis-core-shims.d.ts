declare module '@arcgis/core/WebMap.js' {
  type WebMapOptions = {
    portalItem?: {
      id?: string
    }
  }

  export default class WebMap {
    constructor(options?: WebMapOptions)
  }
}

declare module '@arcgis/core/views/MapView.js' {
  type MapViewOptions = {
    container?: HTMLElement | null
    map?: unknown
  }

  export default class MapView {
    constructor(options?: MapViewOptions)
    destroy(): void
  }
}
