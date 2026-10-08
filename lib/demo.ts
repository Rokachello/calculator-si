import { CalculatorSpec } from "./types";

export function demoCalculatorForPrompt(prompt: string): CalculatorSpec {
  const p = prompt.toLowerCase();
  if (p.includes("goriv") || p.includes("fuel") || p.includes("vozn")) {
    return {
      version: 1, title: "Strosek goriva za pot",
      description: "Izracun porabe goriva in stroska glede na razdaljo, porabo vozila in ceno goriva.",
      inputs: [
        { id: "distance", label: "Razdalja", unit: "km", default: 200, min: 0, max: 100000, step: 1 },
        { id: "consumption", label: "Poraba vozila", unit: "L/100 km", default: 6.5, min: 0, max: 100, step: 0.1 },
        { id: "price", label: "Cena goriva", unit: "EUR/L", default: 1.55, min: 0, max: 20, step: 0.01 }
      ],
      formula: "distance * consumption / 100 * price",
      output: { label: "Strosek goriva", unit: "EUR", decimals: 2 },
      assumptions: ["Razdalja je skupna razdalja poti.", "Poraba je povprecna poraba vozila."],
      confidenceNote: "Gre za deterministicen izracun iz vnesenih vrednosti.", source: "demo"
    };
  }
  if (p.includes("barv") || p.includes("paint")) {
    return {
      version: 1, title: "Kolicina barve",
      description: "Ocena potrebne kolicine barve glede na povrsino, stevilo nanosov, pokrivnost in rezervo.",
      inputs: [
        { id: "area", label: "Povrsina", unit: "m2", default: 74, min: 0, max: 100000, step: 1 },
        { id: "coats", label: "Stevilo nanosov", unit: "", default: 2, min: 1, max: 10, step: 1 },
        { id: "coverage", label: "Pokrivnost", unit: "m2/L", default: 10, min: 0.1, max: 100, step: 0.1 },
        { id: "reserve", label: "Rezerva", unit: "%", default: 10, min: 0, max: 100, step: 1 }
      ],
      formula: "area * coats / coverage * (1 + reserve / 100)",
      output: { label: "Potrebna barva", unit: "L", decimals: 1 },
      assumptions: ["Pokrivnost proizvajalca velja za podlago in nacin nanosa.", "Rezerva pokrije manjse izgube in popravke."],
      confidenceNote: "Pred nakupom preveri deklarirano pokrivnost konkretne barve.", source: "demo"
    };
  }
  if (p.includes("plosc") || p.includes("tile")) {
    return {
      version: 1, title: "Kolicina ploscic",
      description: "Ocena potrebne povrsine ploscic z dodatkom za rezanje in odpad.",
      inputs: [
        { id: "length", label: "Dolzina", unit: "m", default: 4, min: 0, max: 1000, step: 0.01 },
        { id: "width", label: "Sirina", unit: "m", default: 3, min: 0, max: 1000, step: 0.01 },
        { id: "reserve", label: "Rezerva", unit: "%", default: 10, min: 0, max: 100, step: 1 }
      ],
      formula: "length * width * (1 + reserve / 100)",
      output: { label: "Potrebna povrsina ploscic", unit: "m2", decimals: 2 },
      assumptions: ["Izracun ne odsteva odprtin ali fiksnih elementov."],
      confidenceNote: "Pri diagonalnem polaganju je pogosto smiselna vecja rezerva.", source: "demo"
    };
  }
  return {
    version: 1, title: "Odstotek od vrednosti",
    description: "Demo kalkulator. Za poljubne zahteve dodaj OPENAI_API_KEY.",
    inputs: [
      { id: "value", label: "Vrednost", unit: "", default: 100, min: null, max: null, step: 1 },
      { id: "percent", label: "Odstotek", unit: "%", default: 15, min: null, max: null, step: 1 }
    ],
    formula: "value * percent / 100",
    output: { label: "Rezultat", unit: "", decimals: 2 },
    assumptions: ["To je lokalni demo fallback, ker OPENAI_API_KEY ni nastavljen."],
    confidenceNote: "Dodaj API kljuc za generiranje poljubnih kalkulatorjev.", source: "demo"
  };
}
