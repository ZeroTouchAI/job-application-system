import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Groundwork</h1>
      <p>
        A free, open-source job-search co-pilot. Tailored resumes grounded in
        your verified skills — never invented. Job postings sourced from
        legitimate public APIs — never scraped. Applications go through the
        employer&apos;s own channel — never auto-submitted without your review.
      </p>
      <p>
        <Link href="/onboarding">Get started</Link> ·{" "}
        <Link href="/dashboard">Dashboard</Link>
      </p>
    </main>
  );
}
