import { ImageResponse } from "next/og";

// iPhone home-screen icon: the purple Joby leaf on white.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <svg width="136" height="136" viewBox="0 0 100 100">
          <path fill="#7c31e6" d="M52.5 95.7 L47.9 95.6 L47.4 94.9 L47.0 79.5 L25.8 81.6 L25.4 80.2 L27.1 73.7 L4.0 56.3 L4.0 55.3 L7.4 53.0 L8.1 51.7 L5.3 38.8 L5.6 36.4 L18.5 38.2 L22.2 33.3 L33.4 42.5 L35.0 42.5 L31.8 18.6 L40.5 20.0 L49.7 4.3 L50.9 4.8 L59.9 19.9 L68.7 18.6 L65.1 41.5 L65.6 42.5 L67.2 42.8 L78.2 33.3 L80.9 37.9 L81.9 38.2 L94.8 36.5 L95.1 37.9 L91.9 51.7 L96.0 55.3 L95.7 56.3 L73.3 73.7 L74.6 81.1 L53.4 79.7 L53.4 94.9 Z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
