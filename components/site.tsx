import Link from "next/link";

export function SiteHeader() {
  return <header className="site-header">
    <div className="header-inner"><Link className="site-logo" href="/">Calculators<span>.si</span></Link>
      <div className="site-tagline">Practical calculators for your business</div></div>
    <nav className="main-nav" aria-label="Main navigation"><div className="nav-inner">
      <Link href="/">Calculator builder</Link><Link href="/#templates">Business templates</Link>
      <Link href="/#how-it-works">How it works</Link>
    </div></nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div>Calculators.si &copy; 2026</div>
    <div className="footer-note">Estimates depend on your inputs. Confirm assumptions before using a result.</div></footer>;
}
