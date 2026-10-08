"use client";

import { useState } from "react";
import { CalculatorSpec } from "@/lib/types";
import { applyCalculatorEdits } from "@/lib/edit";

export function CalculatorEditor({ spec, onSave, onCancel }: {
  spec: CalculatorSpec; onSave: (spec: CalculatorSpec) => void; onCancel: () => void;
}) {
  const [error, setError] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { onSave(applyCalculatorEdits(spec, new FormData(event.currentTarget))); }
    catch (err) { setError(err instanceof Error ? err.message : "Please check your changes."); }
  }
  return <section className="panel editor-panel"><div className="panel-titlebar"><h2>Edit calculator</h2></div>
    <form onSubmit={submit} className="panel-body">
      <div className="form-grid"><label className="full-width">Title<input name="title" required maxLength={100} defaultValue={spec.title} /></label>
        <label className="full-width">Description<textarea name="description" required maxLength={280} defaultValue={spec.description} /></label></div>
      <fieldset><legend>Inputs</legend><div className="edit-inputs">
        {spec.inputs.map((input) => <div className="edit-input-row" key={input.id}>
          <label>{input.id}: label<input name={`${input.id}-label`} required maxLength={80} defaultValue={input.label} /></label>
          <label>{input.id}: default<input name={`${input.id}-default`} type="number" required step="any"
            min={input.min ?? undefined} max={input.max ?? undefined} defaultValue={input.default} /></label>
          <label>{input.id}: unit<input name={`${input.id}-unit`} maxLength={24} defaultValue={input.unit} /></label>
        </div>)}
      </div></fieldset>
      <div className="form-grid"><label>Result label<input name="outputLabel" required maxLength={80} defaultValue={spec.output.label} /></label>
        <label>Result unit<input name="outputUnit" maxLength={24} defaultValue={spec.output.unit} /></label>
        <label>Assumptions <span className="optional">(up to 5, one per line)</span><textarea name="assumptions" defaultValue={spec.assumptions.join("\n")} /></label>
        <label>Useful tips <span className="optional">(up to 4, one per line)</span><textarea name="tips" defaultValue={spec.tips.join("\n")} /></label></div>
      <label className="checkbox-label"><input name="leadCapture" type="checkbox" defaultChecked={spec.leadCapture.enabled} /> Include a request form after the result</label>
      <p className="small-copy">The formula and input limits stay fixed. To change the calculation, generate a new calculator.</p>
      <div className="toolbar"><button className="classic-button primary-button" type="submit">Save changes</button>
        <button className="classic-button" type="button" onClick={onCancel}>Cancel</button></div>
      {error && <div className="error-box" role="alert">{error}</div>}
    </form></section>;
}
