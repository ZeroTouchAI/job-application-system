import type { ReactNode } from "react";

export const metadata = {
  title: "Groundwork",
  description:
    "A free, grounded job-search co-pilot: tailored resumes, ToS-compliant job sourcing, application tracking.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
