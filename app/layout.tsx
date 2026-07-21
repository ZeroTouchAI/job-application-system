import type { ReactNode } from "react";
import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Job Application System — Land your next job, honestly",
  description:
    "A free, open-source job-search co-pilot by ZeroTouchAI: tailored resumes grounded in your verified skills, job postings sourced from legitimate APIs, applications you always review before they go out.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
