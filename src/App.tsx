import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { AppHeader } from "./components/AppHeader";
import { MapView } from "./components/Map";
import { RightPanel } from "./components/RightPanel";
import { LeftPanel } from "./components/LeftPanel";
import { AttributesPanel } from "./components/AttributesPanel";
import { LegendPanel } from "./components/LegendPanel";
import { BottomPanel } from "./components/BottomPanel";

import { Label } from "./components/ui/label";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { Checkbox } from "./components/ui/checkbox";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { LIGHT_MAP_STYLE } from "./constants/mapStyles";
import { ALL_BASEMAPS } from "./lib/basemaps";
import bbox from "@turf/bbox";
import { TILE_SERVER_URL } from "./config";
import { ReportCardDialog } from "./components/ui/ReportCardDialog";
import { exportLuFeaturesToExcel } from './lib/excelExport';
import type {
  Layer,
  ReportRow,
  FilteredFeature,
  SelectedAttributeRow,
  Feature,
  LngLat,
} from "./types";

// Using shared Layer type

export default function App() {
  const [basemapKey, setBasemapKey] = useState<string>("osm");
  const [showBaseMaps, setShowBaseMaps] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [hoveredFeatures, setHoveredFeatures] = useState<Feature[]>([]);
  const [clickedFeatures, setClickedFeatures] = useState<Feature[]>([]);
  const [showLuSelect, setShowLuSelect] = useState(false);
  const [luFeatures, setLuFeatures] = useState<Feature[]>([]);
  const [selectedLu, setSelectedLu] = useState<Feature | null>(null);
  const [marker, setMarker] = useState<LngLat | null>(null);
  const [markerLuName, setMarkerLuName] = useState<string | null>(null);
  const [showFeatureTable, setShowFeatureTable] = useState(false);
  const [activeInfoMode, setActiveInfoMode] = useState<
    "points" | "lines" | "polygons" | null
  >(null);
  const [showMarkerInfo, setShowMarkerInfo] = useState(false);
  const [showMarkerAttributes, setShowMarkerAttributes] = useState(false);
  const [activeTool, setActiveTool] = useState<
    "info" | "hover-info" | "attributes" | "rectangle" | "lu-select" | null
  >(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [attributesPointsData, setAttributesPointsData] = useState<ReportRow[]>(
    [],
  );
  const [attributesLinesData, setAttributesLinesData] = useState<ReportRow[]>(
    [],
  );
  const [attributesPolygonsData, setAttributesPolygonsData] = useState<
    ReportRow[]
  >([]);
  const [mouseCoords, setMouseCoords] = useState<LngLat | null>(null);
  const [coordSystem, setCoordSystem] = useState<"EPSG:4326" | "EPSG:3857">(
    "EPSG:4326",
  );
  const [currentZoom, setCurrentZoom] = useState<number>(2);
  const [highlightedPoints, setHighlightedPoints] = useState<Set<string>>(
    new Set(),
  );
  const [highlightedLines, setHighlightedLines] = useState<Set<string>>(
    new Set(),
  );
  const [highlightedPolygons, setHighlightedPolygons] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [selectedAttributeRow, setSelectedAttributeRow] =
    useState<SelectedAttributeRow | null>(null);
  const [isMapRedrawing, setIsMapRedrawing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredFeature, setFilteredFeature] =
    useState<FilteredFeature | null>(null);
  const [showRectangleSelection, setShowRectangleSelection] = useState(false);
  const [showBboxDialog, setShowBboxDialog] = useState(false);
  const [showReportCardDialog, setShowReportCardDialog] = useState(false);
  const [reportCardData, setReportCardData] = useState<{row: any, type: 'points' | 'lines' | 'polygons'} | null>(null);
  const [bboxData, setBboxData] = useState<{
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  } | null>(null);
  const [isLuSearching, setIsLuSearching] = useState(false);
 const mapRef = useRef<any>(null);

  useEffect(() => {
    fetch(`${TILE_SERVER_URL}/index.json`)
      .then((response) => response.json())
      .then((data) => {
        // pg_tileserv returns { tables: [...] } or direct object with table IDs as keys
        const tables = data.tables || data || {};
        const titleMap: Record<string, string> = {
          "gdx2.stp": "Отчеты - точки",
          "gdx2.stl": "Отчеты - линии",
          "gdx2.sta": "Отчеты - Полигоны",
          "gdx2.lu": "Лицензионные участки",
          "gdx2.field": "Месторождения",
        };
        const order = ["field", "lu", "sta", "stl", "stp"];
        
        // Handle both array format and object format from pg_tileserv
        let tableEntries: Array<{ id: string; description?: string; table?: string; schema?: string }> = [];
        
        if (Array.isArray(tables)) {
          // Array format: [{ id: "gdx2.field", schema: "gdx2", table: "field", description: "..." }, ...]
          tableEntries = tables;
        } else {
          // Object format: { "gdx2.field": { description: "..." }, ... }
          tableEntries = Object.keys(tables).map((id) => ({
            id,
            description: tables[id].description,
            table: id.split('.').pop() || id,
            schema: id.split('.')[0] || 'public',
          }));
        }
        
        const fetchedLayers: Layer[] = tableEntries
          .map((table) => {
            // Extract table name from id (e.g., "gdx2.field" -> "field")
            const tableName = table.table || table.id.split('.').pop() || table.id;
            const fullId = table.id || `${table.schema || 'gdx2'}.${tableName}`;
            
            return {
              name: tableName,
              title:
                titleMap[fullId] ||
                table.description ||
                tableName,
              description: table.description || tableName,
              type: "xyz",
              // pg_tileserv format: /{schema}.{table}/{z}/{x}/{y}.pbf
              url: `${TILE_SERVER_URL}/${fullId}/{z}/{x}/{y}.pbf`,
              level: { min: 0, max: 22 },
            };
          })
          .filter((layer) => order.includes(layer.name))
          .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
        setLayers(fetchedLayers);
        // Set all visible
        const initialVisible = new Set(fetchedLayers.map((l) => l.name));
        setVisibleLayers(initialVisible);
      })
      .catch((error) => console.error("Failed to fetch layers:", error));
  }, []);
  const style = useMemo(() => {
    const found = ALL_BASEMAPS.find((b) => b.key === basemapKey);
    return found ? found.url : LIGHT_MAP_STYLE;
  }, [basemapKey]);

  const clearSelectedFeatures = () => {
    setSelectedFeature(null);
    setHoveredFeature(null);
    setSelectedAttributeRow(null);
    setHighlightedPoints(new Set());
    setHighlightedLines(new Set());
    setHighlightedPolygons(new Set());
  };

  const clearMapSelections = () => {
    // Clear only map selections, but preserve attribute panel data
    setSelectedFeature(null);
    setHoveredFeature(null);
    setHighlightedPoints(new Set());
    setHighlightedLines(new Set());
    setHighlightedPolygons(new Set());
  };

  const handleLayersClick = () => {
    if (showLayers) {
      setShowLayers(false);
    } else {
      setShowLayers(true);
      setShowBaseMaps(false);
      setShowLegend(false);
      setShowAttributes(false);
    }
 };

  const handleBaseMapsClick = () => {
    if (showBaseMaps) {
      setShowBaseMaps(false);
    } else {
      setShowBaseMaps(true);
      setShowLayers(false);
      setShowLegend(false);
      setShowAttributes(false);
    }
  };

  const handleAttributesClick = () => {
    if (showAttributes) {
      setShowAttributes(false);
    } else {
      setShowAttributes(true);
      setShowLayers(false);
      setShowBaseMaps(false);
      setShowLegend(false);
    }
  };

  const handleLegendClick = () => {
    if (showLegend) {
      setShowLegend(false);
    } else {
      setShowLegend(true);
      setShowLayers(false);
      setShowBaseMaps(false);
      setShowAttributes(false);
    }
  };

  const handleLayerToggle = (layerName: string, checked: boolean) => {
    setVisibleLayers((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(layerName);
      } else {
        newSet.delete(layerName);
      }
      return newSet;
    });
  };

  const handleBasemapSelect = (key: string) => {
    setBasemapKey(key);
    setShowBaseMaps(false);
  };

  // Handle mouse move to update hovered feature when in info mode
   useEffect(() => {
     if (activeInfoMode && hoveredFeatures.length > 0) {
       // When in info mode, set the first hovered feature as the hovered feature for highlighting
       const firstHoveredFeature = hoveredFeatures[0];
       setHoveredFeature(firstHoveredFeature);
       
       // According to requirements, don't update attributes data when using "Info under marker"
       // Only update if we're not in marker info mode
       if (!showMarkerInfo) {
         // Always update attributes data when hovering, even if there's a selectedAttributeRow
         // This allows hover to work even after selecting a row in the table
         const points: ReportRow[] = [];
         const lines: ReportRow[] = [];
         const polygons: ReportRow[] = [];

         hoveredFeatures.forEach((feature) => {
           const type = feature.layer.id.split(".")[1];
           if (type === "stp") {
             points.push(feature.properties);
           } else if (type === "stl") {
             lines.push(feature.properties);
           } else if (type === "sta") {
             polygons.push(feature.properties);
           }
         });

         setAttributesPointsData(points);
         setAttributesLinesData(lines);
         setAttributesPolygonsData(polygons);
       }
       
       // If we have a selected feature and we're hovering over a different feature, clear the selection
       if (selectedFeature && selectedFeature.properties.id !== firstHoveredFeature.properties.id) {
         setSelectedFeature(null);
       }
     } else if (activeInfoMode && hoveredFeatures.length === 0 && selectedFeature) {
       // When in info mode but not hovering over any features, but we have a selected feature
       // Keep showing the selected feature's data in the panel
       // But only if we're not in marker info mode
       if (!showMarkerInfo) {
         const points: ReportRow[] = [];
         const lines: ReportRow[] = [];
         const polygons: ReportRow[] = [];

         // Only add the selected feature to the appropriate array
         const type = selectedFeature.layer.id.split(".")[1];
         if (type === "stp") {
           points.push(selectedFeature.properties);
         } else if (type === "stl") {
           lines.push(selectedFeature.properties);
         } else if (type === "sta") {
           polygons.push(selectedFeature.properties);
         }

         setAttributesPointsData(points);
         setAttributesLinesData(lines);
         setAttributesPolygonsData(polygons);
       }
       // Only set hoveredFeature to null if it's different from selectedFeature
       if (hoveredFeature?.properties.id !== selectedFeature.properties.id) {
         setHoveredFeature(null);
       }
     } else if (activeInfoMode && hoveredFeatures.length === 0 && !selectedFeature) {
       // When in info mode but not hovering over any features and no selected feature
       // Don't clear data if there's a selectedAttributeRow - keep the table data
       // But don't clear if we're in marker info mode
       if (!selectedAttributeRow && !showMarkerInfo) {
         setAttributesPointsData([]);
         setAttributesLinesData([]);
         setAttributesPolygonsData([]);
       }
       // Only set hoveredFeature to null if there's no selected feature
       if (hoveredFeature && !selectedFeature) {
         setHoveredFeature(null);
       }
     }
  }, [hoveredFeatures, activeInfoMode, selectedFeature, setSelectedFeature, setAttributesPointsData, setAttributesLinesData, setAttributesPolygonsData, setHoveredFeature, hoveredFeature, selectedAttributeRow, showMarkerInfo]);


  const updateAttributesData = (features: Feature[]) => {
    const points: ReportRow[] = [];
    const lines: ReportRow[] = [];
    const polygons: ReportRow[] = [];

    features.forEach((feature) => {
      const type = feature.layer.id.split(".")[1];
      if (type === "stp") {
        points.push(feature.properties);
      } else if (type === "stl") {
        lines.push(feature.properties);
      } else if (type === "sta") {
        polygons.push(feature.properties);
      }
    });

    setAttributesPointsData(points);
    setAttributesLinesData(lines);
    setAttributesPolygonsData(polygons);
  };

  const toggleHighlightPoints = () => {
    if (highlightedPoints.size > 0) {
      setHighlightedPoints(new Set());
    } else {
      const ids = new Set<string>(
        attributesPointsData
          .map((item) => item.id)
          .filter((v): v is string | number => v != null)
          .map((v) => v.toString()),
      );
      setHighlightedPoints(ids);
      // Ensure layer is visible
      setVisibleLayers((prev) => new Set([...prev, "stp"]));
    }
  };

  const toggleHighlightLines = () => {
    if (highlightedLines.size > 0) {
      setHighlightedLines(new Set());
    } else {
      const ids = new Set<string>(
        attributesLinesData
          .map((item) => item.id)
          .filter((v): v is string | number => v != null)
          .map((v) => v.toString()),
      );
      setHighlightedLines(ids);
      // Ensure layer is visible
      setVisibleLayers((prev) => new Set([...prev, "stl"]));
    }
  };

  const toggleHighlightPolygons = () => {
    if (highlightedPolygons.size > 0) {
      setHighlightedPolygons(new Set());
    } else {
      const ids = new Set<string>(
        attributesPolygonsData
          .map((item) => item.id)
          .filter((v): v is string | number => v != null)
          .map((v) => v.toString()),
      );
      setHighlightedPolygons(ids);
      // Ensure layer is visible
      setVisibleLayers((prev) => new Set([...prev, "sta"]));
    }
  };

  const handleFeatureSelect = (feature: Feature | null) => {
    setSelectedFeature(feature);
    setSelectedAttributeRow(null); // Clear attribute selection when selecting feature
  };

  const handleMarkerAttributesClick = () => {
    if (activeTool === "attributes") {
      // If already active, deactivate
      setActiveTool(null);
      setShowMarkerAttributes(false);
    } else {
      // Activate marker attributes mode
      setActiveTool("attributes");
      setShowMarkerAttributes(true);
      setShowMarkerInfo(false);
      setShowRectangleSelection(false);
      setShowLuSelect(false);
      setActiveInfoMode(null);
      // Clear any existing clicked features to allow fresh selection
      setClickedFeatures([]);
      setMarker(null);
      // Do not clear attributes data when activating marker attributes - let user see existing data until they click
      // setShowAttributes(true);
      // Clear selected features but preserve the attributes panel functionality
      setSelectedFeature(null);
      setSelectedAttributeRow(null);
      setHoveredFeature(null);
      // Also clear any highlighting
      setHighlightedPoints(new Set());
      setHighlightedLines(new Set());
      setHighlightedPolygons(new Set());
    }
  };


 // Handle map click when marker attributes mode is active
const handleMapClickWithMarkerAttributes = (
    features: Feature[],
    lngLat: LngLat,
  ) => {
    if (showMarkerAttributes) {
      // Update clicked features and transfer to attributes
      // But according to requirements, don't update attributes panel when using "Info under marker"
      setClickedFeatures(features);
      updateAttributesData(features);
      setMarker(lngLat);
      // Show attributes panel when using marker attributes
      setShowAttributes(true);
    } else if (activeInfoMode) {
      // When info mode is active, clicking on a feature should select it
      if (features.length > 0) {
        // Select the first feature from the clicked features
        setSelectedFeature(features[0]);
        // Set it as the hovered feature as well for highlighting
        setHoveredFeature(features[0]);
        // Update attributes data to show only the selected feature
        // But according to requirements, don't update if we're in marker info mode
        if (!showMarkerInfo) {
          updateAttributesData([features[0]]);
        }
        // According to requirements, don't show attributes panel when using "Info under marker"
        // setShowAttributes(true);
      } else {
        // If clicked on empty space, deselect any selected feature
        setSelectedFeature(null);
        setHoveredFeature(null);
      }
    } else {
      // Default behavior
      setClickedFeatures(features);
      if (showMarkerInfo) {
        setMarker(lngLat);
        // When marker info is active, also update attributes data to show clicked features
        // But according to requirements, we should NOT update attributes panel when using "Info under marker"
        // updateAttributesData(features);
        // setShowAttributes(true);
      }
    }
 };

  // Load LU features when LU layer becomes visible and we're in LU select mode
  useEffect(() => {
    if (showLuSelect && visibleLayers.has("lu")) {
      // Load LU features with a delay to ensure map is ready
      const loadLuFeatures = () => {
        if (mapRef.current) {
          const map = mapRef.current.getMap();
          if (map && map.isStyleLoaded()) {
            try {
              // Query all source features from the LU layer (not just rendered ones)
              const sourceId = "gdx2.lu";
              const sourceLayer = "gdx2.lu";
              
              // First try to query source features
              let features: Feature[] = [];
              try {
                const sourceFeatures = map.querySourceFeatures(sourceId, {
                  sourceLayer: sourceLayer,
                });
                features = sourceFeatures as Feature[];
              } catch {
                // If source query fails, try without sourceLayer
                try {
                  const sourceFeatures = map.querySourceFeatures(sourceId);
                  features = sourceFeatures as Feature[];
                } catch {
                  // Fallback to rendered features if source query fails
                  const renderedFeatures = map.queryRenderedFeatures({ layers: ["gdx2.lu"] });
                  features = renderedFeatures as Feature[];
                }
              }
              
              if (features.length > 0) {
                setLuFeatures(features);
              } else {
                // If no features found, try again after a delay (maybe layer is still loading)
                setTimeout(loadLuFeatures, 500);
              }
            } catch (e) {
              console.error("Error loading LU features:", e);
              // Retry after delay
              setTimeout(loadLuFeatures, 500);
            }
          } else {
            // If map is not ready, try again after a short delay
            setTimeout(loadLuFeatures, 200);
          }
        }
      };
      
      // Start loading after a small delay
      const timer = setTimeout(loadLuFeatures, 300);
      return () => clearTimeout(timer);
    } else if (!showLuSelect) {
      // Clear LU features when panel is closed
      setLuFeatures([]);
    }
  }, [showLuSelect, visibleLayers]);

  const handleFilterToFeature = (
    row: ReportRow,
    type: "points" | "lines" | "polygons",
  ) => {
    setIsFiltering(true);
    setFilteredFeature({ row, type });
    // Ensure layer is visible
    const layerName =
      type === "points" ? "stp" : type === "lines" ? "stl" : "sta";
    setVisibleLayers(new Set([layerName])); // Only show this layer

    // Apply filter and hide other layers immediately
    setTimeout(() => {
      if (mapRef.current && row) {
        const map = mapRef.current.getMap();
        const fullLayerName =
          type === "points"
            ? "gdx2.stp"
            : type === "lines"
              ? "gdx2.stl"
              : "gdx2.sta";
        
        // Hide all other layers first
        const allLayerNames = ['gdx2.stp', 'gdx2.stl', 'gdx2.sta', 'gdx2.lu', 'gdx2.field'];
        allLayerNames.forEach(name => {
          if (map.getLayer(name)) {
            if (name === fullLayerName) {
              // Make target layer visible
              map.setLayoutProperty(name, 'visibility', 'visible');
              // Apply filter to show only the selected feature
              // Try both string and number comparison for id
              const idValue = row.id;
              const filter = typeof idValue === 'number' 
                ? ["==", ["get", "id"], idValue]
                : ["==", ["get", "id"], String(idValue)];
              map.setFilter(name, filter as any);
            } else {
              // Hide all other layers
              map.setLayoutProperty(name, 'visibility', 'none');
              // Clear any existing filters on hidden layers
              map.setFilter(name, null);
            }
          }
        });

        map.triggerRepaint();

        // Zoom to the feature after filter is applied
        setTimeout(() => {
          // Wait a bit more for tiles to load
          const checkFeatures = () => {
            const features = map.queryRenderedFeatures(undefined, {
              layers: [fullLayerName],
            });
            
            if (features.length > 0) {
              const featureCollection = {
                type: "FeatureCollection" as const,
                features: features.map((f: any) => ({
                  type: "Feature" as const,
                  geometry: f.geometry,
                  properties: f.properties,
                })),
              };
              const [minLng, minLat, maxLng, maxLat] = bbox(featureCollection as any);
              map.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                {
                  padding: 50,
                  duration: 1000,
                },
              );
              setIsFiltering(false);
            } else {
              // If no rendered features, try querying source features
              const sourceId = fullLayerName;
              const sourceLayer = fullLayerName.split(".")[1];
              const idValue = row.id;
              const sourceFilter = typeof idValue === 'number' 
                ? ["==", "id", idValue]
                : ["==", "id", String(idValue)];
              
              const sourceFeatures = map.querySourceFeatures(sourceId, {
                sourceLayer: sourceLayer,
                filter: sourceFilter as any,
              });
              
              if (sourceFeatures.length > 0) {
                const feature = sourceFeatures[0];
                const geometry = feature.geometry as any;
                if (geometry.type === 'Point') {
                  const coords = geometry.coordinates as [number, number];
                  if (coords && coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                    map.flyTo({
                      center: coords,
                      zoom: 12,
                      duration: 1000,
                    });
                  }
                } else {
                  const featureForBbox = {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: geometry
                  };
                  const [minLng, minLat, maxLng, maxLat] = bbox(featureForBbox);
                  if (!isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat)) {
                    map.fitBounds(
                      [
                        [minLng, minLat],
                        [maxLng, maxLat],
                      ],
                      {
                        padding: 50,
                        duration: 1000,
                      },
                    );
                  }
                }
                setIsFiltering(false);
              } else {
                // Try again after a delay if features not found
                setTimeout(() => {
                  checkFeatures();
                }, 500);
              }
            }
          };
          
          checkFeatures();
        }, 300);
      } else {
        setIsFiltering(false);
      }
    }, 100);
  };

  const handleClearFilter = (type: "points" | "lines" | "polygons") => {
    setIsFiltering(true);
    setFilteredFeature(null);
    // Restore all layers
    const allLayers = ["field", "lu", "sta", "stl", "stp"];
    setVisibleLayers(new Set(allLayers));
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const layerName =
        type === "points"
          ? "gdx2.stp"
          : type === "lines"
            ? "gdx2.stl"
            : "gdx2.sta";
      map.setFilter(layerName, null);
      
      // Show all layers
      const allLayerNames = ['gdx2.stp', 'gdx2.stl', 'gdx2.sta', 'gdx2.lu', 'gdx2.field'];
      allLayerNames.forEach(name => {
        if (map.getLayer(name)) {
          map.setLayoutProperty(name, 'visibility', 'visible');
        }
      });
      
      map.triggerRepaint();
    }
    setTimeout(() => setIsFiltering(false), 300);
  };

  const handleShowBbox = (
    row: ReportRow,
    type: "points" | "lines" | "polygons",
  ) => {
    if (mapRef.current && row) {
      const map = mapRef.current.getMap();
      const layerName =
        type === "points"
          ? "gdx2.stp"
          : type === "lines"
            ? "gdx2.stl"
            : "gdx2.sta";
      const sourceId = layerName;
      const sourceLayer = layerName.split(".")[1];

      const features = map.querySourceFeatures(sourceId, {
        sourceLayer: sourceLayer,
        filter: ["==", "id", row.id],
      });

      if (features.length > 0) {
        const feature = features[0];
        const geometry = feature.geometry as any;
        const featureForBbox = {
          type: 'Feature' as const,
          properties: {},
          geometry: geometry
        };
        
        const [minLng, minLat, maxLng, maxLat] = bbox(featureForBbox);
        setBboxData({ minLng, minLat, maxLng, maxLat });
        setShowBboxDialog(true);
      }
    }
  };

  const handleAttributeRowSelect = (
    row: ReportRow,
    type: "points" | "lines" | "polygons",
  ) => {
    if (
      selectedAttributeRow &&
      selectedAttributeRow.data.id === row.id &&
      selectedAttributeRow.type === type
    ) {
      // Deselect if clicking the same row
      setSelectedAttributeRow(null);
      setSelectedFeature(null); // Also clear feature selection
    } else {
      setSelectedAttributeRow({ data: row, type });
      setSelectedFeature(null); // Clear feature selection when selecting attribute row
      // Don't clear filteredFeature - keep it so the table data remains visible

      // Ensure layer is visible for highlighting
      const layerName =
        type === "points" ? "stp" : type === "lines" ? "stl" : "sta";
      setVisibleLayers((prev) => new Set([...prev, layerName]));

      // Always zoom to the feature when selecting
      const zoomToFeature = () => {
        if (mapRef.current && row) {
          const map = mapRef.current.getMap();
          // Query rendered features instead of source features for better coordinate access
          const layerName =
            type === "points"
              ? "gdx2.stp"
              : type === "lines"
                ? "gdx2.stl"
                : "gdx2.sta";
          const features = map.queryRenderedFeatures(undefined, {
            layers: [layerName],
            filter: ["==", "id", row.id],
          });
          if (features.length > 0) {
            const feature = features[0];
            const geometry = feature.geometry as any;
            if (type === "points") {
              const center = geometry.coordinates as [number, number];
              // Check if coordinates are valid numbers
              if (center && center.length >= 2 && !isNaN(center[0]) && !isNaN(center[1])) {
                map.flyTo({ center, zoom: 12, duration: 1000 });
              }
            } else {
              // For lines and polygons, use Turf.js bbox for accurate bounding box calculation
              const featureForBbox = {
                type: 'Feature' as const,
                properties: {},
                geometry: geometry
              };
              
              const [minLng, minLat, maxLng, maxLat] = bbox(featureForBbox);
              // Check if bbox values are valid numbers
              if (!isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat)) {
                map.fitBounds(
                  [
                    [minLng, minLat],
                    [maxLng, maxLat],
                  ],
                  { padding: 80, duration: 1000 },
                );
              }
            }
          } else {
            // If no features found, try again after a longer delay (maybe layer is still loading)
            setTimeout(zoomToFeature, 200);
          }
        }
      };
      
      setTimeout(zoomToFeature, 10); // Small delay to ensure state updates are processed
    }
  };

  return (
    <div
      className={`min-h-screen bg-background text-foreground relative ${theme}`}
    >
      <AppHeader theme={theme} onThemeChange={setTheme} />
      <Dialog open={showBboxDialog} onOpenChange={setShowBboxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bounding Box объекта</DialogTitle>
          </DialogHeader>
          {bboxData && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Минимальная долгота:
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {bboxData.minLng.toFixed(6)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Максимальная долгота:
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {bboxData.maxLng.toFixed(6)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Минимальная широта:
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {bboxData.minLat.toFixed(6)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Максимальная широта:
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {bboxData.maxLat.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {reportCardData && reportCardData.row && (
        <ReportCardDialog
          open={showReportCardDialog}
          onOpenChange={setShowReportCardDialog}
          rowData={reportCardData.row}
          type={reportCardData.type || 'points'}
        />
      )}
      <main className="absolute top-14 left-0 right-0 bottom-0">
        <div className="absolute left-0 top-0 bottom-0 z-10">
          <LeftPanel
            onLayersClick={handleLayersClick}
            onBaseMapsClick={handleBaseMapsClick}
            onLegendClick={handleLegendClick}
            onAttributesClick={handleAttributesClick}
            isLayersActive={showLayers}
            isBaseMapsActive={showBaseMaps}
            isLegendActive={showLegend}
            isAttributesActive={showAttributes}
          />
        </div>
        {showLayers && (
          <div className="absolute left-16 top-0 bottom-0 z-20 bg-background border-r border-border p-3 w-64">
            <h3 className="text-lg font-semibold mb-3">Слои</h3>
            <div className="space-y-2">
              {[...layers].reverse().map((layer) => (
                <div key={layer.name} className="flex items-center gap-2">
                  <Checkbox
                    id={`layer-${layer.name}`}
                    checked={visibleLayers.has(layer.name)}
                    onCheckedChange={(checked) =>
                      handleLayerToggle(layer.name, checked as boolean)
                    }
                  />
                  <Label htmlFor={`layer-${layer.name}`}>{layer.title}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
        {showLegend && (
          <div className="absolute left-16 top-0 bottom-0 z-20 bg-background border-r border-border p-3 w-64">
            <LegendPanel visibleLayers={visibleLayers} layers={layers} />
          </div>
        )}
        {showBaseMaps && (
          <div className="absolute left-16 top-0 bottom-0 z-20 bg-background border-r border-border p-3 w-64">
            <h3 className="text-lg font-semibold mb-3">Базовые карты</h3>
            <RadioGroup value={basemapKey} onValueChange={handleBasemapSelect}>
              <div className="space-y-2">
                {ALL_BASEMAPS.map((b) => (
                  <div key={b.key} className="flex items-center gap-2">
                    <RadioGroupItem
                      id={`popup-basemap-${b.key}`}
                      value={b.key}
                    />
                    <Label htmlFor={`popup-basemap-${b.key}`}>{b.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}
        <div
          className={`absolute top-0 right-0 bottom-0 ${showBaseMaps || showLayers || showLegend ? "left-80" : "left-16"}`}
        >
          <PanelGroup
            direction="vertical"
            key={showAttributes ? "active" : "inactive"}
          >
            <Panel defaultSize={showAttributes ? 60 : 80} minSize={30}>
              <RightPanel
                hoveredFeatures={selectedFeature && hoveredFeatures.length === 0 && activeInfoMode ? [selectedFeature] : hoveredFeatures}
                clickedFeatures={clickedFeatures}
                showFeatureTable={showFeatureTable}
                onToggleFeatureTable={setShowFeatureTable}
                activeInfoMode={activeInfoMode}
                onSetActiveInfoMode={(mode) => {
                  setActiveInfoMode(mode);
                  // Only hide marker info if it's currently shown
                  if (mode && showMarkerInfo) {
                    setShowMarkerInfo(false);
                  }
                  // Also deactivate other tools when activating info mode
                  if (mode) {
                    setShowMarkerAttributes(false);
                    setShowRectangleSelection(false);
                    setShowLuSelect(false);
                    setActiveTool("hover-info");
                    clearMapSelections();
                  } else if (!mode && activeTool === "hover-info") {
                    setActiveTool(null);
                  }
                }}
                showMarkerInfo={showMarkerInfo}
                onToggleMarkerInfo={(show) => {
                  if (show) {
                    setActiveTool("info");
                    setShowMarkerInfo(true);
                    setShowMarkerAttributes(false);
                    setShowRectangleSelection(false);
                    setShowLuSelect(false);
                    setActiveInfoMode(null);
                    // Don't clear attributes data when activating marker info
                    // Only clear if there are no clicked features to preserve
                    // According to requirements, we should not populate attributes panel when using "Info under marker"
                    setAttributesPointsData([]);
                    setAttributesLinesData([]);
                    setAttributesPolygonsData([]);
                    // Don't hide attributes panel when activating marker info
                    // Only show it if there are features to display
                    // But don't show if we're only using marker info without attributes
                    // According to requirements, don't show attributes panel when using "Info under marker"
                    // if (clickedFeatures.length > 0) {
                    //   setShowAttributes(true);
                    // }
                    setSelectedAttributeRow(null);
                    setFilteredFeature(null);
                    // Clear selected objects on map (but keep clicked features for marker info)
                    setSelectedFeature(null);
                    setHoveredFeature(null);
                    // Don't clear clickedFeatures as they're needed for marker info
                    // setClickedFeatures([]);
                    setMarker(null);
                    // Also clear any highlighting
                    setHighlightedPoints(new Set());
                    setHighlightedLines(new Set());
                    setHighlightedPolygons(new Set());
                    clearSelectedFeatures();
                  } else {
                    if (activeTool === "info" || activeTool === "hover-info") setActiveTool(null);
                    setShowMarkerInfo(false);
                    // When turning off marker info, we should clear the attributes data if there was no selected attribute row
                    if (!selectedAttributeRow) {
                      setAttributesPointsData([]);
                      setAttributesLinesData([]);
                      setAttributesPolygonsData([]);
                    }
                  }
                }}
                showMarkerAttributes={showMarkerAttributes}
                showLuSelect={showLuSelect}
                onToggleLuSelect={(show) => {
                  if (show) {
                    setActiveTool("lu-select");
                    setShowLuSelect(true);
                    setShowMarkerInfo(false);
                    setShowMarkerAttributes(false);
                    setShowRectangleSelection(false);
                    setActiveInfoMode(null);
                    // Clear any existing clicked features to allow fresh selection
                    setClickedFeatures([]);
                    // Load LU features if not already loaded
                    // Feature loading is now handled by useEffect hook
                    if (luFeatures.length === 0 && visibleLayers.has("lu")) {
                      // The useEffect hook will handle loading the features
                    }
                    clearMapSelections();
                  } else {
                    if (activeTool === "lu-select") setActiveTool(null);
                    setShowLuSelect(false);
                    setSelectedFeature(null);
                  }
                }}
                luFeatures={luFeatures}
                selectedLu={selectedLu}
                onLuSelect={(lu, showInfo = true) => {
                  if (lu) {
                    // Check if this is a marker placement action (same LU selected)
                    if (selectedLu && selectedLu.properties.id === lu.properties.id) {
                      // Place marker at the center of the LU
                      const geometry = lu.geometry;
                      let centerLngLat: LngLat | null = null;
                      
                      // Calculate center based on geometry type
                      if (geometry.type === 'Point') {
                        centerLngLat = { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
                      } else {
                        // For polygons and other geometries, calculate bbox and use center
                        const featureForBbox = {
                          type: 'Feature' as const,
                          properties: {},
                          geometry: geometry
                        };
                        const [minLng, minLat, maxLng, maxLat] = bbox(featureForBbox);
                        centerLngLat = {
                          lng: (minLng + maxLng) / 2,
                          lat: (minLat + maxLat) / 2
                        };
                      }
                      
                      if (centerLngLat) {
                        setMarker(centerLngLat);
                        // Set the LU name for the marker
                        setMarkerLuName(lu.properties.name_rus || lu.properties.name || `Участок ${lu.properties.id}`);
                        // Only show marker info if explicitly requested (default is true)
                        if (showInfo) {
                          setShowMarkerInfo(true);
                          setActiveTool("info");
                        } else {
                          // If not showing info, make sure it's hidden
                          setShowMarkerInfo(false);
                          setActiveTool(null);
                        }
                        // Set the marker coordinates as the current marker position
                        // This will display the marker on the map with the LU name
                      }
                    } else {
                      // Different LU selected - reset marker and set new LU
                      setMarker(null);
                      // Update selected LU
                      setSelectedLu(lu);
                      setSelectedAttributeRow(null);
                      
                      // Clear previous attribute data before loading new data
                      setAttributesPolygonsData([]);
                      setAttributesLinesData([]);
                      setAttributesPointsData([]);
                      
                      // Set loading state
                      setIsLuSearching(true);
                      
                      // Additionally, zoom to the LU using its bbox if selected
                      if (mapRef.current && lu.geometry) {
                        const map = mapRef.current.getMap();
                        const geometry = lu.geometry;
                        
                        // Create a feature for bbox calculation
                        const featureForBbox = {
                          type: 'Feature' as const,
                          properties: {},
                          geometry: geometry
                        };
                        
                        // Calculate bbox
                        const [minLng, minLat, maxLng, maxLat] = bbox(featureForBbox);
                        
                        // Zoom to the bbox
                        map.fitBounds([
                          [minLng, minLat],
                          [maxLng, maxLat]
                        ], {
                          padding: 50,
                          duration: 100
                        });
                        
                        // Query features within the LU area and populate attribute tables
                        const searchFeatures = (retryCount = 0) => {
                          if (mapRef.current) {
                            const map = mapRef.current.getMap();
                            
                            // Query features from sta, stl, stp layers
                            const staFeatures = map.queryRenderedFeatures({ layers: ['gdx2.sta'] });
                            const stlFeatures = map.queryRenderedFeatures({ layers: ['gdx2.stl'] });
                            const stpFeatures = map.queryRenderedFeatures({ layers: ['gdx2.stp'] });
                            
                            // Filter features that intersect with the selected LU
                            const luBbox = bbox(featureForBbox);
                            
                            // For simplicity, we'll include all features that are within the LU bbox
                            // A more accurate implementation would check for actual intersection
                            const filterFeaturesInLu = (features: any[]) => {
                              return features.filter((feature: any) => {
                                const featureBbox = bbox({
                                  type: 'Feature',
                                  properties: {},
                                  geometry: feature.geometry
                                });
                                
                                // Check if feature bbox intersects with LU bbox
                                return !(featureBbox[2] < luBbox[0] ||
                                       featureBbox[0] > luBbox[2] ||
                                       featureBbox[3] < luBbox[1] ||
                                       featureBbox[1] > luBbox[3]);
                              });
                            };
                            
                            const filteredSta = filterFeaturesInLu(staFeatures);
                            const filteredStl = filterFeaturesInLu(stlFeatures);
                            const filteredStp = filterFeaturesInLu(stpFeatures);
                            
                            // If no features found and we haven't reached max retries, wait and try again
                            if ((filteredSta.length === 0 && filteredStp.length === 0 && filteredStl.length === 0) && retryCount < 3) {
                              setTimeout(() => searchFeatures(retryCount + 1), 200);
                              return;
                            }
                            
                            // Update attribute tables
                            setAttributesPolygonsData(filteredSta.map((f: any) => f.properties));
                            setAttributesLinesData(filteredStl.map((f: any) => f.properties));
                            setAttributesPointsData(filteredStp.map((f: any) => f.properties));
                            
                            // Show attributes panel
                            setShowAttributes(true);
                          }
                          // End loading state
                          setIsLuSearching(false);
                        };
                        
                        // Start searching immediately, with retry logic
                        setTimeout(() => searchFeatures(0), 100);
                      } else {
                        // End loading state if no geometry
                        setIsLuSearching(false);
                      }
                    }
                  } else {
                    // Deselect LU
                    setSelectedLu(null);
                    setMarker(null);
                    setMarkerLuName(null);
                    setAttributesPolygonsData([]);
                    setAttributesLinesData([]);
                    setAttributesPointsData([]);
                    // End loading state
                    setIsLuSearching(false);
                  }
                }}
                onExportLuToExcel={(lu) => {
                  exportLuFeaturesToExcel(
                    lu,
                    attributesPointsData,
                    attributesLinesData,
                    attributesPolygonsData
                  );
                }}
                showAttributes={showAttributes}
                onToggleAttributes={(show) => {
                  if (show) {
                    updateAttributesData(clickedFeatures);
                    setActiveInfoMode(null);
                  }
                  setShowAttributes(show);
                }}
                selectedFeature={selectedFeature}
                onFeatureSelect={handleFeatureSelect}
                onFeatureHover={setHoveredFeature}
                onMarkerAttributesClick={handleMarkerAttributesClick}
                showRectangleSelection={showRectangleSelection}
                onSetRectangleSelection={(enabled) => {
                  if (enabled) {
                    setActiveTool("rectangle");
                    setShowRectangleSelection(true);
                    setShowMarkerInfo(false);
                    setShowMarkerAttributes(false);
                    setShowLuSelect(false);
                    setActiveInfoMode(null);
                    clearMapSelections();
                  } else {
                    if (activeTool === "rectangle") setActiveTool(null);
                    setShowRectangleSelection(false);
                  }
                }}
                visibleLayers={visibleLayers}
                onClearSelectedFeatures={clearSelectedFeatures}
                onClearMapSelections={clearMapSelections}
              >
                <MapView
                  ref={mapRef}
                  styleUrl={style as any}
                  visibleLayers={visibleLayers}
                  layers={layers}
                  onFeaturesHover={setHoveredFeatures}
                  enableHover={activeInfoMode !== null}
                  infoMode={activeInfoMode}
                  onClick={handleMapClickWithMarkerAttributes}
                  marker={marker}
                  markerLuName={markerLuName ?? undefined}
                  onMouseMoveCoords={setMouseCoords}
                  highlightedPoints={highlightedPoints}
                  highlightedLines={highlightedLines}
                  highlightedPolygons={highlightedPolygons}
                  onZoomChange={setCurrentZoom}
                  selectedFeature={selectedFeature}
                  hoveredFeature={hoveredFeature}
                  selectedAttributeRow={selectedAttributeRow}
                  onRedrawStart={() => setIsMapRedrawing(true)}
                  onRedrawEnd={() => setIsMapRedrawing(false)}
                  filteredFeature={filteredFeature}
                  rectangleSelection={showRectangleSelection}
                  onRectangleSelect={(bounds) => {
                    // Query features within the rectangle bounds (project lng/lat to screen pixels)
                    if (mapRef.current) {
                      const map = mapRef.current.getMap();
                      // Collect target layers that exist on the map (ignore visibility for hit testing)
                      const visibleTargetLayers = [
                        "gdx2.stp",
                        "gdx2.stl",
                        "gdx2.sta",
                      ].filter((layerName) => !!map.getLayer(layerName));

                      const p1 = map.project({
                        lng: bounds[0][0],
                        lat: bounds[0][1],
                      } as any);
                      const p2 = map.project({
                        lng: bounds[1][0],
                        lat: bounds[1][1],
                      } as any);
                      let minX = Math.min(p1.x, p2.x);
                      let minY = Math.min(p1.y, p2.y);
                      let maxX = Math.max(p1.x, p2.x);
                      let maxY = Math.max(p1.y, p2.y);
                      // Pad by 1px and snap to integers for robust querying
                      minX = Math.floor(minX) - 1;
                      minY = Math.floor(minY) - 1;
                      maxX = Math.ceil(maxX) + 1;
                      maxY = Math.ceil(maxY) + 1;

                      const box = [
                        { x: minX, y: minY },
                        { x: maxX, y: maxY },
                      ] as unknown as any;
                      const features = map.queryRenderedFeatures(box, {
                        layers: visibleTargetLayers,
                      });

                      // Fallback: if no features, try without layers constraint
                      const results =
                        features && features.length > 0
                          ? features
                          : map.queryRenderedFeatures([
                              { x: minX, y: minY },
                              { x: maxX, y: maxY },
                            ] as unknown as any);

                      // Update attributes data and highlight
                      updateAttributesData(results as any);
                      setClickedFeatures(results as any);
                      setShowAttributes(true);
                      // Keep rectangle selection tool active for subsequent selections
                    }
                  }}
                />
              </RightPanel>
            </Panel>
            <PanelResizeHandle className="h-2 bg-border" />
            <Panel
              defaultSize={showAttributes ? 50 : 20}
              minSize={20}
              maxSize={50}
            >
              <AttributesPanel
                visibleLayers={visibleLayers}
                onLayerToggle={handleLayerToggle}
                pointsData={attributesPointsData}
                linesData={attributesLinesData}
                polygonsData={attributesPolygonsData}
                highlightedPoints={highlightedPoints}
                highlightedLines={highlightedLines}
                highlightedPolygons={highlightedPolygons}
                onToggleHighlightPoints={toggleHighlightPoints}
                onToggleHighlightLines={toggleHighlightLines}
                onToggleHighlightPolygons={toggleHighlightPolygons}
                selectedAttributeRow={selectedAttributeRow}
                onAttributeRowSelect={handleAttributeRowSelect}
                activeInfoMode={activeInfoMode}
                onZoomToFeature={(row, type) => {
                  if (mapRef.current && row) {
                    const map = mapRef.current.getMap();
                    const layerName =
                      type === "points"
                        ? "gdx2.stp"
                        : type === "lines"
                          ? "gdx2.stl"
                          : "gdx2.sta";
                    const sourceId = layerName;
                    const sourceLayer = layerName.split(".")[1];

                    const features = map.querySourceFeatures(sourceId, {
                      sourceLayer: sourceLayer,
                      filter: ["==", "id", row.id],
                    });

                    if (features.length === 0) {
                      // Try alternative query without sourceLayer
                      const altFeatures = map.querySourceFeatures(sourceId, {
                        filter: ["==", "id", row.id],
                      });
                      if (altFeatures.length > 0) {
                        features.splice(0, features.length, ...altFeatures);
                      }
                    }
                    if (features.length > 0) {
                      const feature = features[0];
                      const geometry = feature.geometry as any;
                      if (type === "points") {
                        const coords = geometry.coordinates as [number, number];
                        map.flyTo({
                          center: coords,
                          zoom: 12,
                          duration: 1000,
                        });
                      } else {
                        // For lines and polygons, use Turf.js bbox for accurate bounding box calculation
                        const featureForBbox = {
                          type: 'Feature' as const,
                          properties: {},
                          geometry: geometry
                        };
                        
                        const [minLng, minLat, maxLng, maxLat] = bbox(featureForBbox);

                        map.fitBounds(
                          [
                            [minLng, minLat],
                            [maxLng, maxLat],
                          ],
                          {
                            padding: 50,
                            duration: 1000,
                          },
                        );
                      }
                    } else {
                    }
                  }
                }}
                onShowBbox={handleShowBbox}
                onShowReportCard={(row: ReportRow, type: 'points' | 'lines' | 'polygons') => {
                  setReportCardData({ row, type });
                  setShowReportCardDialog(true);
                }}
                onFilterToFeature={handleFilterToFeature}
                onClearFilter={handleClearFilter}
                filteredFeature={filteredFeature}
              />
            </Panel>
            {/* <PanelResizeHandle className="h-2 bg-border" /> */}
            <Panel defaultSize={2} minSize={2} maxSize={2}>
              <BottomPanel
                mouseCoords={mouseCoords}
                coordSystem={coordSystem}
                onCoordSystemChange={setCoordSystem}
                zoom={currentZoom}
                isLoading={isMapRedrawing || isFiltering || isLuSearching}
              />
            </Panel>
          </PanelGroup>
        </div>
      </main>
    </div>
  );
}


