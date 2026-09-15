"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { useGameStore } from "@/lib/game/store";
import { getCountry, CountryMetadata } from "@/lib/geo/countries";

interface CountryFeature {
  type: string;
  properties: {
    NAME?: string;
    ADMIN?: string;
    ISO_A2?: string;
    ISO_A3?: string;
    [key: string]: unknown;
  };
  geometry: unknown;
}

interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  altitude: number;
}

export default function GlobeInner() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [countriesData, setCountriesData] = useState<CountryFeature[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Store subscriptions
  const gameStatus = useGameStore((s) => s.gameStatus);
  const selectedCountry = useGameStore((s) => s.selectedCountry);
  const hoveredCountry = useGameStore((s) => s.hoveredCountry);
  const latestResult = useGameStore((s) => s.latestResult);
  const globeViewMode = useGameStore((s) => s.globeViewMode);
  const isAutoRotating = useGameStore((s) => s.isAutoRotating);
  const hoverCountry = useGameStore((s) => s.hoverCountry);
  const selectCountry = useGameStore((s) => s.selectCountry);

  // Resize listener
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || window.innerWidth,
          height: clientHeight || window.innerHeight,
        });
      }
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fetch countries GeoJSON once
  useEffect(() => {
    let isMounted = true;
    fetch("/data/countries.geojson")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.features) {
          setCountriesData(data.features);
          setHasLoadedData(true);
        }
      })
      .catch((err) => console.error("Error loading countries GeoJSON:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Configure OrbitControls and camera defaults with Radio Garden smooth damping
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.05; // Silky Radio Garden momentum
        controls.rotateSpeed = 0.65;
        controls.zoomSpeed = 0.75;
        controls.minDistance = 130;
        controls.maxDistance = 460;
        controls.autoRotate = gameStatus === "idle" && isAutoRotating;
        controls.autoRotateSpeed = 0.4;
      }
    }
  }, [hasLoadedData, gameStatus, isAutoRotating]);

  // Listen to custom zoom & recenter events from GlobeControls
  useEffect(() => {
    const handleZoom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (globeRef.current) {
        const pov = globeRef.current.pointOfView();
        const deltaAlt = detail?.delta > 0 ? 0.35 : -0.35;
        const newAlt = Math.max(0.4, Math.min(3.8, pov.altitude + deltaAlt));
        globeRef.current.pointOfView({ altitude: newAlt }, 400);
      }
    };

    const handleRecenter = () => {
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 900);
      }
    };

    window.addEventListener("globe:zoom", handleZoom);
    window.addEventListener("globe:recenter", handleRecenter);
    return () => {
      window.removeEventListener("globe:zoom", handleZoom);
      window.removeEventListener("globe:recenter", handleRecenter);
    };
  }, []);

  // Handle camera fly-to on answer reveal
  useEffect(() => {
    if (gameStatus === "revealing" && latestResult && globeRef.current) {
      const { actualCountry } = latestResult;
      // Fly camera smoothly to the correct country
      globeRef.current.pointOfView(
        {
          lat: actualCountry.lat,
          lng: actualCountry.lng,
          altitude: 1.6,
        },
        1300
      );
    }
  }, [gameStatus, latestResult]);

  // Compute curved 3D arcs (for revealing guess to answer)
  const arcsData = useMemo<ArcData[]>(() => {
    if (
      (gameStatus === "revealing" || gameStatus === "roundResult") &&
      latestResult &&
      latestResult.guessedCountry &&
      !latestResult.isExact
    ) {
      return [
        {
          startLat: latestResult.guessedCountry.lat,
          startLng: latestResult.guessedCountry.lng,
          endLat: latestResult.actualCountry.lat,
          endLng: latestResult.actualCountry.lng,
          color: ["#ef4444", "#10b981"], // Red at guess -> Green at answer
          altitude: 0.25,
        },
      ];
    }
    return [];
  }, [gameStatus, latestResult]);

  // Fast memoized lookup cache for features
  const featureToCountryMap = useRef<WeakMap<CountryFeature, CountryMetadata | null>>(new WeakMap());

  const resolveCountry = useCallback((feat: CountryFeature): CountryMetadata | undefined => {
    if (featureToCountryMap.current.has(feat)) {
      return featureToCountryMap.current.get(feat) || undefined;
    }
    const code = feat.properties?.ISO_A2 || feat.properties?.NAME || feat.properties?.ADMIN;
    const country = code ? getCountry(String(code)) : undefined;
    featureToCountryMap.current.set(feat, country || null);
    return country;
  }, []);

  // Handlers for hover & click
  const handlePolygonHover = useCallback(
    (polygon: object | null) => {
      if (gameStatus !== "playing" && gameStatus !== "guessing") {
        return;
      }
      if (!polygon) {
        hoverCountry(null);
        return;
      }
      const feat = polygon as CountryFeature;
      const country = resolveCountry(feat);
      hoverCountry(country || null);
    },
    [gameStatus, hoverCountry, resolveCountry]
  );

  const handlePolygonClick = useCallback(
    (polygon: object) => {
      if (gameStatus !== "playing" && gameStatus !== "guessing") {
        return;
      }
      const feat = polygon as CountryFeature;
      const country = resolveCountry(feat);
      if (country) {
        selectCountry(country);
      }
    },
    [gameStatus, selectCountry, resolveCountry]
  );

  // Satellite vs Dark vs Night texture & styling configurations
  const globeConfig = useMemo(() => {
    switch (globeViewMode) {
      case "satellite":
        return {
          globeImage: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
          bumpImage: "//unpkg.com/three-globe/example/img/earth-topology.png",
          atmosphereColor: "#38bdf8",
          atmosphereAltitude: 0.17,
          strokeColor: "rgba(255, 255, 255, 0.22)",
          sideColor: "rgba(16, 185, 129, 0.1)",
        };
      case "night":
        return {
          globeImage: "//unpkg.com/three-globe/example/img/earth-night.jpg",
          bumpImage: "//unpkg.com/three-globe/example/img/earth-topology.png",
          atmosphereColor: "#f59e0b",
          atmosphereAltitude: 0.14,
          strokeColor: "rgba(255, 255, 255, 0.18)",
          sideColor: "rgba(245, 158, 11, 0.1)",
        };
      case "dark":
      default:
        return {
          globeImage: "//unpkg.com/three-globe/example/img/earth-dark.jpg",
          bumpImage: "//unpkg.com/three-globe/example/img/earth-topology.png",
          atmosphereColor: "#0284c7",
          atmosphereAltitude: 0.15,
          strokeColor: "rgba(255, 255, 255, 0.12)",
          sideColor: "rgba(10, 15, 24, 0.4)",
        };
    }
  }, [globeViewMode]);

  // Styling accessor functions (Translucent in satellite view for photorealistic look)
  const getPolygonCapColor = useCallback(
    (featObj: object): string => {
      const feat = featObj as CountryFeature;
      const country = resolveCountry(feat);
      const isSat = globeViewMode === "satellite";
      const isNight = globeViewMode === "night";

      const defaultColor = isSat
        ? "rgba(0, 0, 0, 0.04)"
        : isNight
        ? "rgba(10, 14, 20, 0.35)"
        : "rgba(14, 20, 32, 0.72)";

      if (!country) return defaultColor;

      // In reveal or roundResult state: highlight answer in green and guess in red
      if (gameStatus === "revealing" || gameStatus === "roundResult") {
        if (latestResult) {
          if (country.code === latestResult.actualCountry.code) {
            return "rgba(16, 185, 129, 0.85)"; // Vivid Emerald green
          }
          if (
            latestResult.guessedCountry &&
            country.code === latestResult.guessedCountry.code
          ) {
            return "rgba(239, 68, 68, 0.85)"; // Vivid Crimson red
          }
        }
        return isSat ? "rgba(0, 0, 0, 0.25)" : "rgba(14, 20, 32, 0.6)";
      }

      // Selected country state
      if (selectedCountry && country.code === selectedCountry.code) {
        return "rgba(37, 99, 235, 0.75)"; // Vibrant electric blue
      }

      // Hovered country state (Radio Garden green-cyan beacon glow)
      if (hoveredCountry && country.code === hoveredCountry.code) {
        return isSat ? "rgba(34, 197, 94, 0.5)" : "rgba(56, 189, 248, 0.6)";
      }

      return defaultColor;
    },
    [gameStatus, latestResult, selectedCountry, hoveredCountry, resolveCountry, globeViewMode]
  );

  const getPolygonAltitude = useCallback(
    (featObj: object): number => {
      const feat = featObj as CountryFeature;
      const country = resolveCountry(feat);
      if (!country) return 0.008;

      if (gameStatus === "revealing" || gameStatus === "roundResult") {
        if (
          latestResult &&
          (country.code === latestResult.actualCountry.code ||
            (latestResult.guessedCountry && country.code === latestResult.guessedCountry.code))
        ) {
          return 0.05;
        }
        return 0.008;
      }

      if (selectedCountry && country.code === selectedCountry.code) {
        return 0.04;
      }

      if (hoveredCountry && country.code === hoveredCountry.code) {
        return 0.022;
      }

      return 0.008;
    },
    [gameStatus, latestResult, selectedCountry, hoveredCountry, resolveCountry]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[450px] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0, 0, 0, 0)"
        globeImageUrl={globeConfig.globeImage}
        bumpImageUrl={globeConfig.bumpImage}
        showAtmosphere={true}
        atmosphereColor={globeConfig.atmosphereColor}
        atmosphereAltitude={globeConfig.atmosphereAltitude}
        polygonsData={countriesData}
        polygonCapColor={getPolygonCapColor}
        polygonSideColor={() => globeConfig.sideColor}
        polygonStrokeColor={() => globeConfig.strokeColor}
        polygonAltitude={getPolygonAltitude}
        polygonCapCurvatureResolution={2}
        polygonsTransitionDuration={150}
        onPolygonHover={handlePolygonHover}
        onPolygonClick={handlePolygonClick}
        arcsData={arcsData}
        arcColor={(arc: object) => (arc as ArcData).color}
        arcAltitude={(arc: object) => (arc as ArcData).altitude}
        arcStroke={1.5}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1600}
      />
    </div>
  );
}
