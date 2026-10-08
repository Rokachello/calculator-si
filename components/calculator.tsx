"use client";

import { useMemo, useState } from "react";
import { CalculatorSpec } from "@/lib/types";
import { evaluateFormula } from "@/lib/math-engine";
import { encodeCalculator } from "@/lib/share";

export function Calculator({ spec, publicView = false }: { spec: CalculatorSpec; publicView?: boolean }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(spec.inputs.map((input) => [input.id, String(input.default)])));
  const calculation = useMemo(() => {
    try {
      const numeric: Record<string, number> = {};
      for (const input of spec.inputs) {
        const value = values[input.id].trim() === "" ? NaN : Number(values[input.id]);
        if (!Number.isFinite(value) || (input.min !== null && value < input.min) || (input.max !== null && value > input.max)) {
          throw new Error(`Check the value for ${input.label}.`);
        }
        numeric[input.id] = value;
      }
      return { result: evaluateFormula(spec.formula, numeric), numeric, error: "" };
    } catch (error) {
      return { result: null, numeric: {}, error: error instanceof Error ? error.message : "Check your inputs." };
    }
  }, [spec, values]);

  return <section className="panel calculator-panel" aria-label="Calculator">
    <div className="panel-titlebar calculator-titlebar"><div><h2>{spec.title}</h2>
      <span className={`source-tag ${spec.source}`}>{spec.source === "demo" ? "DEMO TEMPLATE" : "AI GENERATED"}</span></div></div>
    <div className="panel-body">
      <p className="calculator-description">{spec.description}</p>
      <div className="calculator-layout"><div className="form-column"><table className="input-table"><tbody>
        {spec.inputs.map((input) => <tr key={input.id}><th><label htmlFor={`input-${input.id}`}>{input.label}</label></th><td>
          <input id={`input-${input.id}`} type="number" value={values[input.id]} min={input.min ?? undefined}
            max={input.max ?? undefined} step={input.step} onChange={(e) => setValues({ ...values, [input.id]: e.target.value })} />
          {input.unit && <span className="unit">{input.unit}</span>}
        </td></tr>)}
      </tbody></table></div>
      <aside className="result-box" aria-live="polite"><div className="result-heading">Your estimate</div>
        <div className="result-label">{spec.output.label}</div><div className="result-value">
          {calculation.result === null ? "—" : calculation.result.toLocaleString("en-GB", {
            minimumFractionDigits: spec.output.decimals, maximumFractionDigits: spec.output.decimals,
          })}{spec.output.unit && <span>{spec.output.unit}</span>}</div>
        {calculation.error && <div className="calculation-error">{calculation.error}</div>}
        <div className="formula-line">Formula: <code>{spec.formula}</code></div>
      </aside></div>
      <div className="info-section">
        {spec.assumptions.length > 0 && <div><h3>Assumptions</h3><ul>{spec.assumptions.map((text, i) => <li key={i}>{text}</li>)}</ul></div>}
        {spec.tips.length > 0 && <div className="tips-section"><h3>Useful tips</h3><ul>{spec.tips.map((text, i) => <li key={i}>{text}</li>)}</ul></div>}
        <div className="notice-box"><strong>Please note:</strong> {spec.confidenceNote}</div>
      </div>
      {spec.leadCapture.enabled && (publicView
        ? <LeadForm spec={spec} values={calculation.numeric} disabled={calculation.result === null} />
        : <div className="lead-preview">A request form will appear below the result on your public calculator.</div>)}
    </div>
  </section>;
}

function LeadForm({ spec, values, disabled }: { spec: CalculatorSpec; values: Record<string, number>; disabled: boolean }) {
  const [pending, setPending] = useState(false), [error, setError] = useState(""), [reference, setReference] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true); setError("");
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calculator: encodeCalculator(spec), values, name: data.get("name"), email: data.get("email"),
          phone: data.get("phone"), message: data.get("message") }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Your request could not be saved.");
      setReference(payload.reference); form.reset();
    } catch (err) { setError(err instanceof Error ? err.message : "Your request could not be saved."); }
    finally { setPending(false); }
  }
  return <section className="lead-form"><h3>Request a personalised quote</h3>
    <p>Leave your details with the calculator owner. Your inputs and estimate will be included.</p>
    <p className="small-copy">This trial inbox keeps requests for up to 24 hours and may close sooner. Avoid sensitive information.</p>
    {reference ? <div className="success-box" role="status">Your request was saved. Reference: {reference}</div> :
      <form onSubmit={submit} className="form-grid">
        <label>Name<input name="name" autoComplete="name" required maxLength={80} /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Phone <span className="optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
        <label className="full-width">Message <span className="optional">(optional)</span><textarea name="message" maxLength={1000} /></label>
        <div className="full-width"><button className="classic-button primary-button" disabled={disabled || pending || !spec.leadCapture.collectionId}>
          {pending ? "Saving request…" : "Request a quote"}</button></div>
      </form>}
    {error && <div className="error-box" role="alert">{error}</div>}
    {!spec.leadCapture.collectionId && <div className="notice-box">The owner has not opened a request inbox yet.</div>}
  </section>;
}
