"use client";

import { JarvisCommandCenter } from "@/features/companion/JarvisCommandCenter";

export default function JarvisPage() {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-[#2614DF]/30 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
      <JarvisCommandCenter />
    </div>
  );
}
