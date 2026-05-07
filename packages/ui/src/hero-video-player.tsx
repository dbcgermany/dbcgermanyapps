"use client";

import { useRef, useState } from "react";

// Self-hosted hero video with autoplay + loop + muted-by-default (browser
// autoplay rules) and a single mute/volume affordance — no scrub bar, no
// fullscreen, no share, no third-party branding. Volume slider only
// appears while the user is hovering the control cluster, and only when
// the audio is unmuted. SVGs are inlined so @dbc/ui stays free of a
// lucide-react dependency (matches the page-back.tsx convention).

function VolumeOnIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function VolumeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

export function HeroVideoPlayer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [hovering, setHovering] = useState(false);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      v.volume = volume;
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
  }

  function handleVolume(next: number) {
    const value = Math.max(0, Math.min(1, next));
    setVolume(value);
    const v = videoRef.current;
    if (!v) return;
    v.volume = value;
    if (value > 0 && v.muted) {
      v.muted = false;
      setMuted(false);
    }
    if (value === 0 && !v.muted) {
      v.muted = true;
      setMuted(true);
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        aria-label={title}
      />
      <div
        className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-full bg-black/45 px-1 py-1 pl-2 backdrop-blur-sm"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
      >
        {hovering && !muted && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => handleVolume(parseFloat(e.target.value))}
            aria-label="Volume"
            className="h-1 w-20 cursor-pointer accent-white"
          />
        )}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
        >
          {muted ? (
            <VolumeOffIcon className="h-4 w-4" />
          ) : (
            <VolumeOnIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </>
  );
}
