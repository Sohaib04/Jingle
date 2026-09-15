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

  const gameStatus = useGameStore((s) => s.gameStatus);
  const selectedCountry = useGameStore((s) => s.selectedCountry);
  const hoveredCountry = useGameStore((s) => s.hoveredCountry);
  const latestResult = useGameStore((s) => s.latestResult);
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

  // Configure OrbitControls and camera defaults
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed = 0.7;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 150;
        controls.maxDistance = 500;
        controls.autoRotate = gameStatus === "idle";
        controls.autoRotateSpeed = 0.5;
      }
    }
  }, [hasLoadedData, gameStatus]);

  // Handle camera fly-to on answer reveal
  useEffect(() => {
    if (gameStatus === "revealing" && latestResult && globeRef.current) {
      const { actualCountry } = latestResult;
      // Fly camera smoothly to the correct country
      globeRef.current.pointOfView(
        {
          lat: actualCountry.lat,
          lng: actualCountry.lng,
          altitude: 1.8,
        },
        1400
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

  // Helper to resolve CountryMetadata from feature
  const resolveCountry = useCallback((feat: CountryFeature): CountryMetadata | undefined => {
    const code = feat.properties?.ISO_A2 || feat.properties?.NAME || feat.properties?.ADMIN;
    return code ? getCountry(String(code)) : undefined;
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

  // Styling accessor functions
  const getPolygonCapColor = useCallback(
    (featObj: object): string => {
      const feat = featObj as CountryFeature;
      const country = resolveCountry(feat);
      if (!country) return "rgba(18, 24, 38, 0.75)";

      // In reveal or roundResult state: highlight answer in green and guess in red
      if (gameStatus === "revealing" || gameStatus === "roundResult") {
        if (latestResult) {
          if (country.code === latestResult.actualCountry.code) {
            return "rgba(16, 185, 129, 0.9)"; // Emerald green
          }
          if (
            latestResult.guessedCountry &&
            country.code === latestResult.guessedCountry.code
          ) {
            return "rgba(239, 68, 68, 0.9)"; // Crimson red
          }
        }
        return "rgba(18, 24, 38, 0.65)";
      }

      // Selected country state
      if (selectedCountry && country.code === selectedCountry.code) {
        return "rgba(37, 99, 235, 0.85)"; // Vibrant blue
      }

      // Hovered country state
      if (hoveredCountry && country.code === hoveredCountry.code) {
        return "rgba(56, 189, 248, 0.65)"; // Light cyan
      }

      return "rgba(18, 24, 38, 0.75)";
    },
    [gameStatus, latestResult, selectedCountry, hoveredCountry, resolveCountry]
  );

  const getPolygonAltitude = useCallback(
    (featObj: object): number => {
      const feat = featObj as CountryFeature;
      const country = resolveCountry(feat);
      if (!country) return 0.01;

      if (gameStatus === "revealing" || gameStatus === "roundResult") {
        if (
          latestResult &&
          (country.code === latestResult.actualCountry.code ||
            (latestResult.guessedCountry && country.code === latestResult.guessedCountry.code))
        ) {
          return 0.055;
        }
        return 0.01;
      }

      if (selectedCountry && country.code === selectedCountry.code) {
        return 0.045;
      }

      if (hoveredCountry && country.code === hoveredCountry.code) {
        return 0.025;
      }

      return 0.01;
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
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere={true}
        atmosphereColor="#0284c7"
        atmosphereAltitude={0.16}
        polygonsData={countriesData}
        polygonCapColor={getPolygonCapColor}
        polygonSideColor={() => "rgba(10, 15, 24, 0.4)"}
        polygonStrokeColor={() => "rgba(255, 255, 255, 0.12)"}
        polygonAltitude={getPolygonAltitude}
        polygonCapCurvatureResolution={2}
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
