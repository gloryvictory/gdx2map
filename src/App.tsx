import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { AppHeader } from "./components/AppHeader";
import { MapView } from "./components/Map";
import { RightPanel } from "./components/RightPanel";
import { LeftPanel } from "./components/LeftPanel";
import { AttributesPanel } from "./components/AttributesPanel";
import { LegendPanel } from "./components/LegendPanel";
import { BottomPanel } from "./components/BottomPanel";
import { LuSelectPanel } from "./components/LuSelectPanel";
import { Label } from "./components/ui/label";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { Checkbox } from "./components/ui/checkbox";
import { LuSelectButton } from "./components/ui/LuSelectButton";
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
  const [luMarker, setLuMarker] = useState<LngLat | null>(null);
  const [marker, setMarker] = useState<LngLat | null>(null);
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
 const mapRef = useRef<any>(null);

  useEffect(() => {
    fetch(`${TILE_SERVER_URL}/catalog`)
      .then((response) => response.json())
      .then((data) => {
        const tiles = data.tiles || {};
        const titleMap: Record<string, string> = {
          "gdx2.stp.geom": "Отчеты - точки",
          "gdx2.stl.geom": "Отчеты - линии",
          "gdx2.sta.geom": "Отчеты - Полигоны",
          "gdx2.lu.geom": "Лицензионные участки",
          "gdx2.field.geom": "Месторождения",
        };
        const order = ["field", "lu", "sta", "stl", "stp"];
        const fetchedLayers: Layer[] = Object.keys(tiles)
          .map((tableName) => ({
            name: tableName,
            title:
              titleMap[tiles[tableName].description] ||
              tiles[tableName].description ||
              tableName,
            description: tiles[tableName].description || tableName,
            type: "xyz",
            url: `${TILE_SERVER_URL}/${tableName}/{z}/{x}/{y}`,
            level: { min: 0, max: 22 },
          }))
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
      
      // If we have a selected feature and we're hovering over a different feature, clear the selection
      if (selectedFeature && selectedFeature.properties.id !== firstHoveredFeature.properties.id) {
        setSelectedFeature(null);
        // Update attributes data to show the hovered feature instead
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
      } else if (!selectedFeature) {
        // If no feature is selected, show the hovered features in the panel
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
    } else if (activeInfoMode && hoveredFeatures.length === 0 && selectedFeature) {
      // When in info mode but not hovering over any features, but we have a selected feature
      // Keep showing the selected feature's data in the panel
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
      // Only set hoveredFeature to null if it's different from selectedFeature
      if (hoveredFeature?.properties.id !== selectedFeature.properties.id) {
        setHoveredFeature(null);
      }
    } else if (activeInfoMode && hoveredFeatures.length === 0 && !selectedFeature) {
      // When in info mode but not hovering over any features and no selected feature
      setAttributesPointsData([]);
      setAttributesLinesData([]);
      setAttributesPolygonsData([]);
      // Only set hoveredFeature to null if there's no selected feature
      if (hoveredFeature && !selectedFeature) {
        setHoveredFeature(null);
      }
    }
 }, [hoveredFeatures, activeInfoMode, selectedFeature, setSelectedFeature, setAttributesPointsData, setAttributesLinesData, setAttributesPolygonsData, setHoveredFeature, hoveredFeature, selectedLu]);


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
      // Transfer clicked features to attributes data (will be empty initially)
      updateAttributesData([]);
      setShowAttributes(true);
    }
 };


 // Handle map click when marker attributes mode is active
 const handleMapClickWithMarkerAttributes = (
    features: Feature[],
    lngLat: LngLat,
  ) => {
    if (showMarkerAttributes) {
      // Update clicked features and transfer to attributes
      setClickedFeatures(features);
      updateAttributesData(features);
      setMarker(lngLat);
      setShowAttributes(true);
    } else if (activeInfoMode) {
      // When info mode is active, clicking on a feature should select it
      if (features.length > 0) {
        // Select the first feature from the clicked features
        setSelectedFeature(features[0]);
        // Set it as the hovered feature as well for highlighting
        setHoveredFeature(features[0]);
        // Update attributes data to show only the selected feature
        updateAttributesData([features[0]]);
        setShowAttributes(true);
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
      }
    }
  };

  // Load LU features when LU layer becomes visible and we're in LU select mode
  useEffect(() => {
    if (showLuSelect && visibleLayers.has("lu") && luFeatures.length === 0) {
      // Load LU features with a delay to ensure map is ready
      const loadLuFeatures = () => {
        if (mapRef.current) {
          const map = mapRef.current.getMap();
          if (map && map.isStyleLoaded()) {
            try {
              // Query all rendered features from the LU layer
              const features = map.queryRenderedFeatures({ layers: ["gdx2.lu"] }) as Feature[];
              console.log("Loaded LU features:", features.length);
              setLuFeatures(features);
            } catch (e) {
              console.error("Error loading LU features:", e);
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
    }
  }, [showLuSelect, visibleLayers, luFeatures.length]);

  const handleFilterToFeature = (
    row: ReportRow,
    type: "points" | "lines" | "polygons",
  ) => {
    setFilteredFeature({ row, type });
    // Ensure layer is visible
    const layerName =
      type === "points" ? "stp" : type === "lines" ? "stl" : "sta";
    setVisibleLayers(new Set([layerName])); // Only show this layer

    // Zoom to the feature
    setTimeout(() => {
      if (mapRef.current && row) {
        const map = mapRef.current.getMap();
        const layerName =
          type === "points"
            ? "gdx2.stp"
            : type === "lines"
              ? "gdx2.stl"
              : "gdx2.sta";
        map.setFilter(layerName, ["==", ["get", "id"], row.id]);

        // Unified zooming to the filtered feature(s)
        const features = map.queryRenderedFeatures(undefined, {
          layers: [layerName],
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
              duration: 100,
            },
          );
        }
      }
    }, 100);
  };

  const handleClearFilter = (type: "points" | "lines" | "polygons") => {
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
    }
  };

  const handleShowBbox = (
    row: ReportRow,
    type: "points" | "lines" | "polygons",
  ) => {
    console.log("handleShowBbox called with row:", row, "type:", type);
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

      console.log("Found features:", features.length);
      if (features.length > 0) {
        const feature = features[0];
        const geometry = feature.geometry as any;
        const featureForBbox = {
          type: 'Feature' as const,
          properties: {},
          geometry: geometry
        };
        
        const [minLng, minLat, maxLng, maxLat] = bbox(featureForBbox);
        console.log("Bbox coords:", [minLng, minLat, maxLng, maxLat]);
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
      setFilteredFeature(null); // Clear any filtered feature when selecting a new row

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
                    // Clear attributes data and hide attributes panel
                    setAttributesPointsData([]);
                    setAttributesLinesData([]);
                    setAttributesPolygonsData([]);
                    setShowAttributes(false);
                    setSelectedAttributeRow(null);
                    setFilteredFeature(null);
                    // Clear selected objects on map
                    setSelectedFeature(null);
                    setHoveredFeature(null);
                    setClickedFeatures([]);
                    setMarker(null);
                    // Also clear any highlighting
                    setHighlightedPoints(new Set());
                    setHighlightedLines(new Set());
                    setHighlightedPolygons(new Set());
                  } else {
                    if (activeTool === "info" || activeTool === "hover-info") setActiveTool(null);
                    setShowMarkerInfo(false);
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
                      console.log("LU features will be loaded by useEffect hook");
                    }
                  } else {
                    if (activeTool === "lu-select") setActiveTool(null);
                    setShowLuSelect(false);
                    setSelectedLu(null);
                  }
                }}
                luFeatures={luFeatures}
                selectedLu={selectedLu}
                onLuSelect={(lu) => {
                  setSelectedLu(lu);
                  // When LU is selected, also select it as a feature to trigger highlighting
                  setSelectedFeature(lu);
                  setSelectedAttributeRow(null);
                  
                  // Additionally, zoom to the LU using its bbox if selected
                  if (lu && mapRef.current && lu.geometry) {
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
                      duration: 1000
                    });
                    
                    // Query features within the LU area and populate attribute tables
                    setTimeout(() => {
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
                        
                        // Update attribute tables
                        setAttributesPolygonsData(filteredSta.map((f: any) => f.properties));
                        setAttributesLinesData(filteredStl.map((f: any) => f.properties));
                        setAttributesPointsData(filteredStp.map((f: any) => f.properties));
                        
                        // Show attributes panel
                        setShowAttributes(true);
                      }
                    }, 100);
                  } else {
                    // If lu is null, clear the attribute tables
                    setAttributesPolygonsData([]);
                    setAttributesLinesData([]);
                    setAttributesPointsData([]);
                  }
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
                  } else {
                    if (activeTool === "rectangle") setActiveTool(null);
                    setShowRectangleSelection(false);
                  }
                }}
                visibleLayers={visibleLayers}
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
                onZoomToFeature={(row, type) => {
                  console.log(
                    "onZoomToFeature called with row:",
                    row,
                    "type:",
                    type,
                  );
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

                    console.log(
                      "Querying source:",
                      sourceId,
                      "sourceLayer:",
                      sourceLayer,
                      "filter:",
                      ["==", "id", row.id],
                    );
                    console.log("Found features for zoom:", features.length);
                    if (features.length === 0) {
                      // Try alternative query without sourceLayer
                      console.log("Trying query without sourceLayer...");
                      const altFeatures = map.querySourceFeatures(sourceId, {
                        filter: ["==", "id", row.id],
                      });
                      console.log(
                        "Alternative query found features:",
                        altFeatures.length,
                      );
                      if (altFeatures.length > 0) {
                        features.splice(0, features.length, ...altFeatures);
                      }
                    }
                    if (features.length > 0) {
                      const feature = features[0];
                      const geometry = feature.geometry as any;
                      console.log("Object coordinates:", geometry.coordinates);

                      if (type === "points") {
                        const coords = geometry.coordinates as [number, number];
                        console.log("Flying to point:", coords);
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
                        console.log("Calculated bbox:", [minLng, minLat, maxLng, maxLat]);

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
                      console.log("No features found for zoom");
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
                isLoading={isMapRedrawing}
              />
            </Panel>
          </PanelGroup>
        </div>
      </main>
    </div>
  );
}
