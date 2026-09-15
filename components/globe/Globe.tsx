"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamic import to prevent SSR hydration errors with WebGL/Three.js
const GlobeInner = dynamic(() => import("./GlobeInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border border-emerald-500/20 animate-ping opacity-25" />
        <div className="absolute w-40 h-40 rounded-full border border-white/10 bg-slate-950/60 flex items-center justify-center backdrop-blur-md shadow-2xl">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </div>
      <p className="text-xs font-mono font-semibold text-slate-400 tracking-widest uppercase">
        Connecting to Planetary Audio Stream...
      </p>
    </div>
  ),
});

export default function Globe() {
  return <GlobeInner />;
}
