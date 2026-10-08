import { CalculatorSpec } from "./types";
import { validateCalculatorSpec } from "./validate";

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeCalculator(spec: CalculatorSpec): string {
  return toBase64Url(JSON.stringify(spec));
}

export function decodeCalculator(encoded: string): CalculatorSpec {
  if (encoded.length > 12000) throw new Error("Shared calculator is too large");
  const raw = JSON.parse(fromBase64Url(encoded));
  const source = raw?.source === "verified" ? "verified" : raw?.source === "demo" ? "demo" : "ai";
  return validateCalculatorSpec(raw, source);
}
