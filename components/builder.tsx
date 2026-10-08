"use client";

import { useState } from "react";
import { CalculatorSpec } from "@/lib/types";
import { BUSINESS_DEMOS } from "@/lib/business-demos";
import { decodeCalculator, encodeCalculator } from "@/lib/share";
import { validateCalculatorSpec } from "@/lib/validate";
import type { Lead } from "@/lib/leads";
import { Calculator } from "./calculator";
import { CalculatorEditor } from "./editor";
import { SiteFooter, SiteHeader } from "./site";

type Publication = { url: string; editorUrl: string; embed: string; collectionId: string | null; ownerToken: string | null };
const DEFAULT_PROMPT = "Create a painting quote calculator with area, number of coats, labour and materials per square metre.";

export function Builder({ initialCalculator, initialError }: { initialCalculator: CalculatorSpec | null; initialError: string }) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT), [calculator, setCalculator] = useState(initialCalculator);
  const [pending, setPending] = useState(false), [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(initialError), [editing, setEditing] = useState(false);
  const [published, setPublished] = useState<Publication | null>(null);
  const [message, setMessage] = useState(""), [leads, setLeads] = useState<Lead[] | null>(null);

  function update(spec: CalculatorSpec) {
    setCalculator(spec); setEditing(false); setPublished(null); setLeads(null); setMessage(""); setError("");
  }
  async function generate() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not generate a calculator.");
      update(validateCalculatorSpec(payload.calculator, payload.mode === "demo" ? "demo" : "ai"));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not generate a calculator."); }
    finally { setPending(false); }
  }
  async function publish() {
    if (!calculator) return;
    setPublishing(true); setError(""); setMessage("");
    try {
      let spec = calculator, collectionId: string | null = null, ownerToken: string | null = null;
      if (spec.leadCapture.enabled) {
        const response = await fetch("/api/lead-collections", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calculator: encodeCalculator(spec) }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not open a request inbox.");
        spec = decodeCalculator(payload.calculator); collectionId = payload.collectionId; ownerToken = payload.ownerToken;
        try { localStorage.setItem(`calculator-inbox:${collectionId}`, ownerToken!); }
        catch { setMessage("Keep this window open to read requests. Your browser could not remember private inbox access."); }
      }
      const encoded = encodeCalculator(spec), url = `${window.location.origin}/calculator?c=${encoded}`;
      setCalculator(spec); setLeads(null);
      setPublished({ url, editorUrl: `${window.location.origin}/?c=${encoded}`, collectionId, ownerToken,
        embed: `<iframe src="${window.location.origin}/embed?c=${encoded}" title="Business calculator" width="100%" height="900" style="border:0" loading="lazy"></iframe>` });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not prepare the public calculator."); }
    finally { setPublishing(false); }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setMessage("Copied to clipboard."); }
    catch { setMessage("Select and copy the text below."); }
  }
  async function loadInbox() {
    const id = published?.collectionId || calculator?.leadCapture.collectionId;
    if (!id) return;
    setError("");
    try {
      const token = published?.ownerToken || localStorage.getItem(`calculator-inbox:${id}`);
      if (!token) throw new Error("Open this calculator in the browser where you published it to read requests.");
      const response = await fetch(`/api/lead-collections/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not read requests.");
      setLeads(payload.leads);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not read requests."); }
  }

  return <div className="site-frame"><SiteHeader /><main className="content-wrap">
    <div className="breadcrumb">Home &raquo; Calculator builder</div>
    <section className="panel generator-panel" id="generator"><div className="panel-titlebar">
      <h1>Build a calculator your customers can use</h1><span className="status-label">BETA</span></div>
      <div className="panel-body"><p className="intro-copy">Describe a quote, estimate or return-on-investment calculation.
        Review the result, adjust the wording and share it with your customers.</p>
        <label className="prompt-label" htmlFor="calculator-prompt">What should the calculator work out?</label>
        <textarea id="calculator-prompt" maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="generator-actions"><span className="small-copy">Your description sets the calculator language.</span>
          <button className="classic-button primary-button" disabled={pending || publishing || !prompt.trim()} onClick={generate}>
            {pending ? "Preparing calculator…" : "Generate calculator"}</button></div>
      </div></section>
    {calculator && <>
      <div className="workspace-heading"><h2>Review your calculator</h2><div className="toolbar">
        <button className="classic-button" disabled={publishing || pending} onClick={() => setEditing(!editing)}>{editing ? "Close editor" : "Edit calculator"}</button>
        <button className="classic-button primary-button" disabled={publishing || pending || editing} onClick={publish}>
          {publishing ? "Preparing link…" : published ? "Create another public link" : "Publish & share"}</button>
        {calculator.leadCapture.collectionId && <button className="classic-button" onClick={loadInbox}>View requests</button>}
      </div></div>
      {editing && <CalculatorEditor spec={calculator} onSave={update} onCancel={() => setEditing(false)} />}
      <Calculator key={encodeCalculator(calculator)} spec={calculator} />
    </>}
    {published && <section className="panel share-panel"><div className="panel-titlebar"><h2>Your public calculator</h2></div>
      <div className="panel-body"><p>Share this link with customers or paste the iframe into your website. The link includes your calculator and its default inputs.</p>
        <label>Public link<input readOnly aria-label="Public link" value={published.url} onFocus={(e) => e.target.select()} /></label>
        <div className="toolbar"><a className="classic-button" href={published.url} target="_blank" rel="noopener noreferrer">Open public calculator</a>
          <button className="classic-button" onClick={() => copy(published.url)}>Copy link</button></div>
        <label>Embed code<textarea readOnly aria-label="Embed code" value={published.embed} onFocus={(e) => e.target.select()} /></label>
        <button className="classic-button" onClick={() => copy(published.embed)}>Copy embed code</button>
        <p><a href={published.editorUrl}>Reopen this calculator in the editor</a>. Bookmark this editor link to return to your work.</p>
        {published.collectionId && <div className="notice-box">Your trial request inbox is available for up to 24 hours and closes if the server restarts.
          Check and save requests promptly. Private inbox access is kept in this browser; it is not part of the public link.</div>}
      </div></section>}
    {leads !== null && <section className="panel"><div className="panel-titlebar"><h2>Customer requests</h2>
      <button className="classic-button" onClick={loadInbox}>Refresh requests</button></div><div className="panel-body">
      {leads.length === 0 ? <p>No requests yet.</p> : <div className="request-list">{leads.map((lead) => <article className="request-item" key={lead.id}>
        <h3>{lead.name}</h3><p>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p>
        <p>Estimate: <strong>{lead.result.toLocaleString("en-GB", { maximumFractionDigits: 2 })} {lead.unit}</strong></p>
        <dl>{calculator?.inputs.map((input) => <div key={input.id}><dt>{input.label}</dt><dd>{lead.values[input.id]} {input.unit}</dd></div>)}</dl>
        {lead.message && <p className="request-message">{lead.message}</p>}<small>{lead.createdAt} · Reference: {lead.id}</small>
      </article>)}</div>}</div></section>}
    {error && <div className="error-box" role="alert">{error}</div>}
    {message && <div className="success-box" role="status">{message}</div>}
    <section className="panel templates-panel" id="templates"><div className="panel-titlebar"><h2>Start with a business template</h2></div>
      <div className="template-grid">{Object.entries(BUSINESS_DEMOS).map(([id, spec]) => <article className="template" key={id}>
        <h3>{spec.title}</h3><p>{spec.description}</p><span className="template-note">{spec.leadCapture.enabled ? "Includes a request form" : "Ready to customise"}</span>
        <button className="classic-button" disabled={pending || publishing} onClick={() => update(spec)}>Use {id} template</button>
      </article>)}</div></section>
    <section className="panel" id="how-it-works"><div className="small-titlebar">From an idea to a useful customer tool</div>
      <ol className="steps-list"><li><strong>Describe the calculation.</strong> Use your own rates and make the scope clear.</li>
        <li><strong>Review and edit.</strong> Check the formula, assumptions and example result before sharing.</li>
        <li><strong>Share or embed.</strong> Give customers a clear estimate and an optional way to request a quote.</li></ol>
    </section>
  </main><SiteFooter /></div>;
}
