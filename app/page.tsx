"use client";

import { useEffect, useMemo, useState } from "react";
import { CalculatorSpec } from "@/lib/types";
import { evaluateFormula } from "@/lib/math-engine";
import { decodeCalculator, encodeCalculator } from "@/lib/share";

const EXAMPLES = [
  "Koliko barve potrebujem za 74 m2 sten, dva nanosa in 10 % rezerve?",
  "Koliko stane 420 km voznje pri porabi 6,4 L/100 km in gorivu 1,55 EUR/L?",
  "Koliko ploscic potrebujem za prostor 4 x 3 m z 10 % rezerve?",
];

export default function Home() {
  const [prompt, setPrompt] = useState(EXAMPLES[0]);
  const [calculator, setCalculator] = useState<CalculatorSpec | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareState, setShareState] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("c");
    if (!encoded) return;
    try {
      const decoded = decodeCalculator(encoded);
      setCalculator(decoded);
      setValues(Object.fromEntries(decoded.inputs.map((input) => [input.id, input.default])));
    } catch {
      setError("Deljeni kalkulator ni veljaven ali je poskodovan.");
    }
  }, []);

  const result = useMemo(() => {
    if (!calculator) return null;
    try { return evaluateFormula(calculator.formula, values); }
    catch { return null; }
  }, [calculator, values]);

  async function generate() {
    setLoading(true); setError(""); setShareState("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Generiranje ni uspelo.");
      const spec: CalculatorSpec = payload.calculator;
      setCalculator(spec);
      setValues(Object.fromEntries(spec.inputs.map((input) => [input.id, input.default])));
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generiranje ni uspelo.");
    } finally { setLoading(false); }
  }

  async function share() {
    if (!calculator) return;
    const url = `${window.location.origin}${window.location.pathname}?c=${encodeURIComponent(encodeCalculator(calculator))}`;
    window.history.replaceState({}, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setShareState("Povezava je kopirana.");
    } catch {
      setShareState("Povezava je pripravljena v naslovni vrstici.");
    }
  }

  return (
    <div className="site-frame">
      <header className="site-header">
        <div className="header-inner">
          <a className="site-logo" href="/">Calculators<span>.si</span></a>
          <div className="site-tagline">spletni kalkulatorji za vsakdan</div>
        </div>
        <nav className="main-nav" aria-label="Glavna navigacija">
          <div className="nav-inner">
            <a className="active" href="#generator">Ustvari kalkulator</a>
            <a href="#popularni">Popularni kalkulatorji</a>
            <a href="#kako-deluje">Kako deluje</a>
          </div>
        </nav>
      </header>

      <main className="content-wrap">
        <div className="breadcrumb">Domov &raquo; Ustvari svoj kalkulator</div>

        <section id="generator" className="panel generator-panel">
          <div className="panel-titlebar">
            <h1>Kaj zelite izracunati?</h1>
            <span className="status-label">BETA</span>
          </div>
          <div className="panel-body">
            <p className="intro-copy">
              Opisite izracun z navadnimi besedami. Sistem pripravi obrazec in matematicno formulo,
              rezultat pa izracuna nas varen racunski modul.
            </p>
            <label className="prompt-label" htmlFor="calculator-prompt">Opis izracuna:</label>
            <textarea id="calculator-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1000} />
            <div className="generator-actions">
              <div className="example-links">
                Primeri: {EXAMPLES.map((example, index) => (
                  <button key={example} onClick={() => setPrompt(example)}>{index + 1}</button>
                ))}
              </div>
              <button className="classic-button primary-button" onClick={generate} disabled={loading || !prompt.trim()}>
                {loading ? "Pripravljam..." : "Ustvari kalkulator"}
              </button>
            </div>
            {error && <div className="error-box"><strong>Napaka:</strong> {error}</div>}
          </div>
        </section>

        {calculator && (
          <section className="panel calculator-panel">
            <div className="panel-titlebar calculator-titlebar">
              <div>
                <h2>{calculator.title}</h2>
                <span className={`source-tag ${calculator.source}`}>
                  {calculator.source === "demo" ? "DEMO" : calculator.source === "verified" ? "PREVERJENO" : "USTVARJENO Z AI"}
                </span>
              </div>
              <button className="classic-button" onClick={share}>Deli kalkulator</button>
            </div>

            <div className="panel-body">
              <p className="calculator-description">{calculator.description}</p>
              <div className="calculator-layout">
                <div className="form-column">
                  <table className="input-table">
                    <tbody>
                      {calculator.inputs.map((input) => (
                        <tr key={input.id}>
                          <th><label htmlFor={`input-${input.id}`}>{input.label}</label></th>
                          <td>
                            <input
                              id={`input-${input.id}`}
                              type="number"
                              value={Number.isFinite(values[input.id]) ? values[input.id] : ""}
                              min={input.min ?? undefined}
                              max={input.max ?? undefined}
                              step={input.step}
                              onChange={(e) => setValues((current) => ({ ...current, [input.id]: Number(e.target.value) }))}
                            />
                            {input.unit && <span className="unit">{input.unit}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <aside className="result-box">
                  <div className="result-heading">Rezultat</div>
                  <div className="result-label">{calculator.output.label}</div>
                  <div className="result-value">
                    {result === null ? "-" : result.toLocaleString("sl-SI", {
                      minimumFractionDigits: calculator.output.decimals,
                      maximumFractionDigits: calculator.output.decimals,
                    })}
                    {calculator.output.unit && <span>{calculator.output.unit}</span>}
                  </div>
                  <div className="formula-line">Formula: <code>{calculator.formula}</code></div>
                </aside>
              </div>

              <div className="info-section">
                {calculator.assumptions.length > 0 && (
                  <div>
                    <h3>Predpostavke</h3>
                    <ul>{calculator.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
                <div className="notice-box"><strong>Opomba:</strong> {calculator.confidenceNote}</div>
                {shareState && <div className="success-box">{shareState}</div>}
              </div>
            </div>
          </section>
        )}

        <section id="popularni" className="two-column-section">
          <div className="panel compact-panel">
            <div className="small-titlebar">Popularni kalkulatorji</div>
            <div className="link-list">
              <a href="#generator">Poraba goriva <span>&raquo;</span></a>
              <a href="#generator">Kolicina barve <span>&raquo;</span></a>
              <a href="#generator">Ploscice in rezerva <span>&raquo;</span></a>
              <a href="#generator">Odstotki <span>&raquo;</span></a>
            </div>
          </div>
          <div id="kako-deluje" className="panel compact-panel">
            <div className="small-titlebar">Kako deluje?</div>
            <ol className="steps-list">
              <li><strong>Opisete problem.</strong> Sistem prepozna potrebne podatke.</li>
              <li><strong>Pripravi model.</strong> AI sestavi omejeno matematicno specifikacijo.</li>
              <li><strong>Engine izracuna.</strong> Ne izvajamo kode, ki jo ustvari AI.</li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>Calculators.si &copy; 2026 &middot; uporabni spletni izracuni brez kompliciranja</div>
        <div className="footer-note">Rezultati so informativni. Pri uradnih izracunih preverite veljavne vire.</div>
      </footer>
    </div>
  );
}
