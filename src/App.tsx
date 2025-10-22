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
import { computeCoordinatesBbox } from "./lib/utils";
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
  const [marker, setMarker] = useState<LngLat | null>(null);
  const [showFeatureTable, setShowFeatureTable] = useState(false);
  const [activeInfoMode, setActiveInfoMode] = useState<
    "points" | "lines" | "polygons" | null
  >(null);
  const [showMarkerInfo, setShowMarkerInfo] = useState(false);
  const [showMarkerAttributes, setShowMarkerAttributes] = useState(false);
  const [activeTool, setActiveTool] = useState<
    "info" | "attributes" | "rectangle" | null
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
    setShowLayers((prev) => !prev);
  };

  const handleBaseMapsClick = () => {
    setShowBaseMaps((prev) => !prev);
  };

  const handleAttributesClick = () => {
    setShowAttributes((prev) => !prev);
  };

  const handleLegendClick = () => {
    setShowLegend((prev) => !prev);
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
    // Zoom to feature
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      // For simplicity, zoom to a fixed level and center on the feature
      // In a real app, you'd calculate bounds from the feature geometry
      if (!feature) return;
      const coords = (feature.geometry as any).coordinates as [number, number];
      map.flyTo({
        center: [coords[0], coords[1]],
        zoom: 12,
        duration: 1000,
      });
    }
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
    } else {
      // Default behavior
      setClickedFeatures(features);
      if (showMarkerInfo) {
        setMarker(lngLat);
      }
    }
  };

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
              map.flyTo({ center, zoom: 12, duration: 1000 });
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
                { padding: 80, duration: 1000 },
              );
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
                hoveredFeatures={hoveredFeatures}
                clickedFeatures={clickedFeatures}
                showFeatureTable={showFeatureTable}
                onToggleFeatureTable={setShowFeatureTable}
                activeInfoMode={activeInfoMode}
                onSetActiveInfoMode={(mode) => {
                  setActiveInfoMode(mode);
                  if (mode) setShowMarkerInfo(false);
                }}
                showMarkerInfo={showMarkerInfo}
                onToggleMarkerInfo={(show) => {
                  if (show) {
                    setActiveTool("info");
                    setShowMarkerInfo(true);
                    setShowMarkerAttributes(false);
                    setShowRectangleSelection(false);
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
                  } else {
                    if (activeTool === "info") setActiveTool(null);
                    setShowMarkerInfo(false);
                  }
                }}
                showMarkerAttributes={showMarkerAttributes}
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
                    setActiveInfoMode(null);
                  } else {
                    if (activeTool === "rectangle") setActiveTool(null);
                    setShowRectangleSelection(false);
                  }
                }}
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
