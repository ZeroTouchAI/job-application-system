import type { ReactNode } from "react";
import { Fraunces } from "next/font/google";
import Providers from "./providers";
import "./globals.css";
import "./joby.css";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Joby: Land your next job, honestly",
  // The Joby logo doubles as the favicon and the iOS home-screen icon.
  icons: {
    icon: "/joby-logo.png",
    shortcut: "/joby-logo.png",
    apple: "/apple-touch-icon.png",
  },
  description:
    "A free, open-source job-search co-pilot by ZeroTouchAI: tailored resumes grounded in your verified skills, job postings sourced from legitimate APIs, applications you always review before they go out.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
