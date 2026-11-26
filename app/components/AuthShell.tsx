import Link from "next/link";
import Skyline from "./Skyline";

/** The shared sign-in / sign-up layout: sky gradient, skyline, logo, card, footer. */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="au">
      <Skyline className="au-skyline" />
      <div className="au-inner">
        <Link href="/" className="au-brand" aria-label="Joby home">
          <img src="/joby-leaf.svg" alt="" width={84} height={84} />
          <span>Joby</span>
        </Link>
        <h1>{title}</h1>
        <p className="au-sub">{subtitle}</p>
        <div className="au-card">{children}</div>
      </div>
      <footer className="au-foot">
        <span className="au-foot-brand">
          <img src="/joby-leaf.svg" alt="" width={26} height={26} />
          Joby
        </span>
        <small>
          Powered by{" "}
          <a href="https://zerotouchai.com" target="_blank" rel="noreferrer">
            ZeroTouchAI.com
          </a>
        </small>
      </footer>
    </div>
  );
}
