"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { useGameStore } from "@/lib/game/store";
import { useMultiplayerStore } from "@/lib/multiplayer/store";
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

  // Multiplayer subscriptions
  const mpStatus = useMultiplayerStore((s) => s.status);
  const mpSelectedCountry = useMultiplayerStore((s) => s.selectedCountry);
  const mpHoveredCountry = useMultiplayerStore((s) => s.hoveredCountry);
  const mpLatestDuelResult = useMultiplayerStore((s) => s.latestDuelResult);
  const mpSelectCountry = useMultiplayerStore((s) => s.selectCountry);
  const mpHoverCountry = useMultiplayerStore((s) => s.hoverCountry);

  const isMpActive =
    mpStatus === "roundActive" ||
    mpStatus === "roundReview" ||
    mpStatus === "roundRevealing";

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

    const handleFlyTo = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (globeRef.current && detail?.lat != null && detail?.lng != null) {
        const pov = globeRef.current.pointOfView();
        const targetAlt =
          detail.altitude ??
          (pov?.altitude ? Math.max(1.1, Math.min(pov.altitude, 2.2)) : 1.7);
        globeRef.current.pointOfView(
          {
            lat: detail.lat,
            lng: detail.lng,
            altitude: targetAlt,
          },
          detail.duration ?? 850
        );
      }
    };

    window.addEventListener("globe:zoom", handleZoom);
    window.addEventListener("globe:recenter", handleRecenter);
    window.addEventListener("globe:fly-to", handleFlyTo);
    return () => {
      window.removeEventListener("globe:zoom", handleZoom);
      window.removeEventListener("globe:recenter", handleRecenter);
      window.removeEventListener("globe:fly-to", handleFlyTo);
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
    // Multiplayer battle dual arcs
    if (
      isMpActive &&
      (mpStatus === "roundReview" || mpStatus === "roundRevealing") &&
      mpLatestDuelResult
    ) {
      const arcs: ArcData[] = [];
      const actual = mpLatestDuelResult.actualCountry;
      const p1 = mpLatestDuelResult.player1Guess;
      const p2 = mpLatestDuelResult.player2Guess;

      if (p1 && !p1.isExact && p1.lat != null && p1.lng != null && (p1.lat !== 0 || p1.lng !== 0)) {
        arcs.push({
          startLat: p1.lat,
          startLng: p1.lng,
          endLat: actual.lat,
          endLng: actual.lng,
          color: ["#3b82f6", "#10b981"], // Electric Blue -> Emerald Green
          altitude: 0.28,
        });
      }

      if (p2 && !p2.isExact && p2.lat != null && p2.lng != null && (p2.lat !== 0 || p2.lng !== 0)) {
        arcs.push({
          startLat: p2.lat,
          startLng: p2.lng,
          endLat: actual.lat,
          endLng: actual.lng,
          color: ["#f59e0b", "#10b981"], // Vivid Amber -> Emerald Green
          altitude: 0.34,
        });
      }

      return arcs;
    }

    // Solo game arc
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
  }, [
    gameStatus,
    latestResult,
    isMpActive,
    mpStatus,
    mpLatestDuelResult,
  ]);

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
      if (isMpActive) {
        if (mpStatus !== "roundActive") return;
        if (!polygon) {
          mpHoverCountry(null);
          return;
        }
        const feat = polygon as CountryFeature;
        const country = resolveCountry(feat);
        mpHoverCountry(country || null);
        return;
      }

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
    [
      isMpActive,
      mpStatus,
      mpHoverCountry,
      gameStatus,
      hoverCountry,
      resolveCountry,
    ]
  );

  const handlePolygonClick = useCallback(
    (polygon: object, _event?: MouseEvent, coords?: { lat: number; lng: number }) => {
      const feat = polygon as CountryFeature;
      const country = resolveCountry(feat);
      if (!country) return;

      if (isMpActive) {
        if (mpStatus === "roundActive") {
          mpSelectCountry(country);
        }
      } else if (gameStatus === "playing" || gameStatus === "guessing") {
        selectCountry(country);
      }

      // Fixate and center camera on the clicked country
      if (globeRef.current) {
        const pov = globeRef.current.pointOfView();
        const targetAltitude = pov?.altitude
          ? Math.max(1.1, Math.min(pov.altitude, 2.2))
          : 1.7;

        const targetLat = country.lat ?? coords?.lat;
        const targetLng = country.lng ?? coords?.lng;

        if (targetLat != null && targetLng != null) {
          globeRef.current.pointOfView(
            {
              lat: targetLat,
              lng: targetLng,
              altitude: targetAltitude,
            },
            850
          );
        }
      }
    },
    [
      isMpActive,
      mpStatus,
      mpSelectCountry,
      gameStatus,
      selectCountry,
      resolveCountry,
    ]
  );

  const handleGlobeClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      if (globeRef.current && coords?.lat != null && coords?.lng != null) {
        const pov = globeRef.current.pointOfView();
        const targetAltitude = pov?.altitude
          ? Math.max(1.1, Math.min(pov.altitude, 2.4))
          : 1.8;

        globeRef.current.pointOfView(
          {
            lat: coords.lat,
            lng: coords.lng,
            altitude: targetAltitude,
          },
          850
        );
      }
    },
    []
  );

  // Track active globe view mode in a ref for synchronous onBeforeRender shader checks
  const currentViewModeRef = useRef(globeViewMode);
  useEffect(() => {
    currentViewModeRef.current = globeViewMode;
  }, [globeViewMode]);

  // Preload all globe textures on mount for instantaneous, lag-free view switching
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
    loader.load("//unpkg.com/three-globe/example/img/earth-dark.jpg");
    loader.load("/images/BlackMarble_2016_3km.jpg");
  }, []);

  // Dynamic uniforms to control night lights contrast and brightness in custom Three.js shader
  const nightUniforms = useRef({
    uIsNight: { value: 0 },
  });

  // Enhanced globe material with custom shader for vibrant, high-contrast night lights
  const customGlobeMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial({
      shininess: 15,
    });

    // Per-frame guard: ensure night shader logic ONLY runs when the night texture is actively bound to mat.map.
    // This completely eliminates any visual artifact where the daytime satellite map would flash through the night shader.
    mat.onBeforeRender = () => {
      const mapSrc = (mat.map?.image as HTMLImageElement | undefined)?.src || "";
      const isNightTextureActive =
        currentViewModeRef.current === "night" &&
        (mapSrc.includes("BlackMarble") || mapSrc.includes("earth-night"));

      nightUniforms.current.uIsNight.value = isNightTextureActive ? 1.0 : 0.0;
    };

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uIsNight = nightUniforms.current.uIsNight;

      // Inject uniform declaration in fragment shader
      shader.fragmentShader = `
        uniform float uIsNight;
      ` + shader.fragmentShader;

      // Replace map_fragment to apply contrast and brightness boost for city lights
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D( map, vMapUv );
          #ifdef DECODE_VIDEO_TEXTURE
            sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
          #endif

          if (uIsNight > 0.5) {
            float lum = dot(sampledDiffuseColor.rgb, vec3(0.299, 0.587, 0.114));

            if (lum > 0.16) {
              // Extract city lights with steep contrast response
              float normLum = clamp((lum - 0.16) / 0.84, 0.0, 1.0);

              // Non-linear contrast curve: strongly amplifies midtones and highlights
              float contrastBoost = pow(normLum, 0.70) * 4.0;

              // Warm, luminous incandescent city glow (golden amber highlights)
              vec3 cityColor = sampledDiffuseColor.rgb * (1.0 + contrastBoost) * vec3(1.18, 1.06, 0.88);

              // Emissive self-illumination guarantees vivid brightness from all viewing angles
              totalEmissiveRadiance += cityColor * 2.4;
              sampledDiffuseColor.rgb = cityColor;
            } else {
              // Deep obsidian continent silhouette with pitch-black oceans
              float landFactor = clamp((lum - 0.04) / 0.11, 0.0, 1.0);
              sampledDiffuseColor.rgb = vec3(0.015, 0.018, 0.024) * landFactor;
            }
          }

          diffuseColor *= sampledDiffuseColor;
        #endif
        `
      );
    };

    mat.customProgramCacheKey = () => "globe-custom-phong-material";

    return mat;
  }, []);

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
          globeImage: "/images/BlackMarble_2016_3km.jpg",
          bumpImage: "//unpkg.com/three-globe/example/img/earth-topology.png",
          atmosphereColor: "#f59e0b",
          atmosphereAltitude: 0.14,
          strokeColor: "rgba(255, 255, 255, 0.22)",
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

      // Completely clear polygon cap on night mode so city lights are not dimmed by dark overlays
      const defaultColor = isSat
        ? "rgba(0, 0, 0, 0.04)"
        : isNight
        ? "rgba(0, 0, 0, 0)"
        : "rgba(14, 20, 32, 0.72)";

      if (!country) return defaultColor;

      // Multiplayer mode styling
      if (isMpActive) {
        if (mpStatus === "roundReview" || mpStatus === "roundRevealing") {
          if (mpLatestDuelResult) {
            if (country.code === mpLatestDuelResult.actualCountry.code) {
              return "rgba(16, 185, 129, 0.85)"; // Vivid Emerald green (answer)
            }
            if (mpLatestDuelResult.player1Guess?.countryCode === country.code) {
              return "rgba(59, 130, 246, 0.85)"; // Player 1 guess (Electric Blue)
            }
            if (mpLatestDuelResult.player2Guess?.countryCode === country.code) {
              return "rgba(245, 158, 11, 0.85)"; // Player 2 guess (Vivid Amber)
            }
          }
          return isSat || isNight ? "rgba(0, 0, 0, 0.2)" : "rgba(14, 20, 32, 0.6)";
        }

        // Multiplayer selected country state
        if (mpSelectedCountry && country.code === mpSelectedCountry.code) {
          return "rgba(37, 99, 235, 0.75)";
        }

        // Multiplayer hovered country state
        if (mpHoveredCountry && country.code === mpHoveredCountry.code) {
          return isSat
            ? "rgba(34, 197, 94, 0.5)"
            : isNight
            ? "rgba(245, 158, 11, 0.45)"
            : "rgba(56, 189, 248, 0.6)";
        }

        return defaultColor;
      }

      // Solo game: In reveal or roundResult state: highlight answer in green and guess in red
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
        return isSat || isNight ? "rgba(0, 0, 0, 0.2)" : "rgba(14, 20, 32, 0.6)";
      }

      // Selected country state
      if (selectedCountry && country.code === selectedCountry.code) {
        return "rgba(37, 99, 235, 0.75)"; // Vibrant electric blue
      }

      // Hovered country state (Radio Garden green-cyan beacon glow, warm amber on night mode)
      if (hoveredCountry && country.code === hoveredCountry.code) {
        return isSat
          ? "rgba(34, 197, 94, 0.5)"
          : isNight
          ? "rgba(245, 158, 11, 0.45)"
          : "rgba(56, 189, 248, 0.6)";
      }

      return defaultColor;
    },
    [
      isMpActive,
      mpStatus,
      mpLatestDuelResult,
      mpSelectedCountry,
      mpHoveredCountry,
      gameStatus,
      latestResult,
      selectedCountry,
      hoveredCountry,
      resolveCountry,
      globeViewMode,
    ]
  );

  const getPolygonAltitude = useCallback(
    (featObj: object): number => {
      const feat = featObj as CountryFeature;
      const country = resolveCountry(feat);
      if (!country) return 0.008;

      if (isMpActive) {
        if (mpStatus === "roundReview" || mpStatus === "roundRevealing") {
          if (
            mpLatestDuelResult &&
            (country.code === mpLatestDuelResult.actualCountry.code ||
              mpLatestDuelResult.player1Guess?.countryCode === country.code ||
              mpLatestDuelResult.player2Guess?.countryCode === country.code)
          ) {
            return 0.05;
          }
          return 0.008;
        }
        if (mpSelectedCountry && country.code === mpSelectedCountry.code) {
          return 0.04;
        }
        if (mpHoveredCountry && country.code === mpHoveredCountry.code) {
          return 0.022;
        }
        return 0.008;
      }

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
    [
      isMpActive,
      mpStatus,
      mpLatestDuelResult,
      mpSelectedCountry,
      mpHoveredCountry,
      gameStatus,
      latestResult,
      selectedCountry,
      hoveredCountry,
      resolveCountry,
    ]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[450px] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <Globe
        ref={globeRef}
        globeMaterial={customGlobeMaterial}
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
        onGlobeClick={handleGlobeClick}
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
