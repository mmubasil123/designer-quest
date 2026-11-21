// Shared look for the MoMu teaser: tokens from mockups/theme.css (see style.md), the caption, the phone, the logo.
import { loadFont } from "@remotion/fonts";
import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

export const C = { paper: "#ffffff", wall: "#ededed", ink: "#000000", muted: "#595959", line: "#cbcbcb", accent: "#d72f25" };
export const SANS = "Hanken Grotesk";
export const SERIF = "Source Serif 4";
export const SAFE = 80;   // style.md: readable things stay 80 px inside every edge

loadFont({ family: SANS, url: staticFile("momu/hanken-grotesk.woff2"), weight: "400 600" });
loadFont({ family: SERIF, url: staticFile("momu/source-serif-4-italic.woff2"), style: "italic", weight: "400 600" });

// things arrive fast and settle (style.md): a short spring-like ease, never a slow fade
export const ARRIVE = Easing.bezier(0.16, 1, 0.3, 1);
export const arrive = (frame: number, at: number, len = 9) =>
  interpolate(frame, [at, at + len], [0, 1], { easing: ARRIVE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// a number that counts up between two frames
export const countUp = (frame: number, at: number, len: number, a: number, b: number) =>
  Math.round(interpolate(frame, [at, at + len], [a, b], { easing: Easing.bezier(0.33, 1, 0.68, 1), extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

const Accent: React.FC<{ text: string }> = ({ text }) => (
  <>{text.split(/(\*[^*]+\*)/).map((t, i) => t.startsWith("*") ? <span key={i} style={{ color: C.accent }}>{t.slice(1, -1)}</span> : t)}</>
);

// The caption: the sentence in phrases, each arriving on its reading time
export const Caption: React.FC<{ phrases: { text: string; at: number }[]; top?: number; width?: number; size?: number }> = ({ phrases, top = 150, width = 1000, size = 68 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 120, top, width, fontFamily: SANS, fontSize: size, lineHeight: 1.12, color: C.ink, letterSpacing: "-0.01em" }}>
      {phrases.map(({ text, at }) => {
        const p = arrive(frame, at);
        return <div key={text} style={{ opacity: p, translate: `0px ${(1 - p) * 28}px` }}><Accent text={text} /></div>;
      })}
    </div>
  );
};

// A phone showing one of the app's real screens (390 x 844 captures in public/shots/)
export const PHONE = { w: 404, h: Math.round(404 * 844 / 390), bezel: 14 };
export const Phone: React.FC<{ src: string; x: number; y: number; style?: React.CSSProperties; screen?: React.CSSProperties; children?: React.ReactNode }> = ({ src, x, y, style, screen, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: PHONE.w + 2 * PHONE.bezel, height: PHONE.h + 2 * PHONE.bezel,
    background: "#111", borderRadius: 58, padding: PHONE.bezel, boxShadow: "0 30px 70px rgb(0 0 0 / .22)", ...style }}>
    <div style={{ position: "relative", width: PHONE.w, height: PHONE.h, borderRadius: 44, overflow: "hidden", background: C.paper }}>
      <div style={{ position: "absolute", inset: 0, ...screen }}>
        <Img src={staticFile(`shots/${src}`)} style={{ width: "100%", height: "100%", display: "block" }} />
        {children}
      </div>
    </div>
  </div>
);
// app coordinates (390 x 844 points) to phone-screen pixels
export const pt = (v: number) => (v * PHONE.w) / 390;

// MoMu's official two-M logo (mockups/assets/brand/momu-logo.svg, viewBox 0 0 202 42)
export const Logo: React.FC<{ width: number; color?: string }> = ({ width, color = C.ink }) => (
  <svg viewBox="0 0 202 42" width={width} height={(width * 42) / 202} role="img" aria-label="MoMu">
    <g fill={color} fillRule="evenodd">
      <polygon points="93.7308089 0 50.1255238 40.3757678 4.82491673 0 0 0 0 42 25.9339274 42 25.9339274 19.7578271 50.6796291 42 74.57917 42 98.8387794 19.7578271 98.8387794 42 100 42 100 0" />
      <polygon points="195.731684 0 152.123526 40.3757678 106.825013 0 102 0 102 42 127.933446 42 127.933446 19.7578271 152.679643 42 176.579662 42 200.840757 19.7578271 200.840757 42 202 42 202 0" />
    </g>
  </svg>
);

// A MoMu photo on the gallery grey, sharp corners like the museum's pictures
export const Photo: React.FC<{ src: string; w: number; h: number; style?: React.CSSProperties }> = ({ src, w, h, style }) => (
  <div style={{ width: w, height: h, background: C.wall, overflow: "hidden", ...style }}>
    <Img src={staticFile(`momu/${src}`)} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
  </div>
);

export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 24 }) => (
  <div style={{ fontFamily: SANS, fontSize: size, letterSpacing: "0.06em", textTransform: "uppercase", color }}>{children}</div>
);
