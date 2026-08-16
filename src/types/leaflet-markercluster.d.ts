declare module "leaflet.markercluster" {
  import * as L from "leaflet";
  export interface MarkerClusterGroupOptions {
    showCoverageOnHover?: boolean;
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    chunkedLoading?: boolean;
    chunkInterval?: number;
    chunkDelay?: number;
  }
  export class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
    getBounds(): L.LatLngBounds;
  }
  const plugin: {
    MarkerClusterGroup: new (options?: MarkerClusterGroupOptions) => MarkerClusterGroup;
  };
  export default plugin;
}