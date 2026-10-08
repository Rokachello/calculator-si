import Link from "next/link";
import { decodeCalculator } from "@/lib/share";
import { Calculator } from "./calculator";
import { SiteFooter, SiteHeader } from "./site";

export function PublicCalculator({ encoded, embedded = false }: { encoded?: string; embedded?: boolean }) {
  let spec;
  try { spec = decodeCalculator(encoded ?? ""); } catch { /* render a useful error without untrusted content */ }
  const content = spec ? <Calculator spec={spec} publicView /> :
    <div className="panel"><div className="panel-body"><h1>Calculator unavailable</h1>
      <p>This shared calculator is invalid or incomplete. Ask the sender for a new link.</p><Link href="/">Open calculator builder</Link></div></div>;
  if (embedded) return <main className="embed-wrap">{content}<div className="embed-credit">
    <Link href="/" target="_blank" rel="noopener noreferrer">Built with Calculators.si</Link></div></main>;
  return <div className="site-frame"><SiteHeader /><main className="content-wrap">
    <div className="breadcrumb"><Link href="/">Calculator builder</Link> &raquo; Shared calculator</div>{content}
  </main><SiteFooter /></div>;
}
