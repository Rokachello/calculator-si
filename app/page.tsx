import { Builder } from "@/components/builder";
import { decodeCalculator } from "@/lib/share";


export default async function Home({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  const { c } = await searchParams;
  let calculator = null, error = "";
  if (typeof c === "string") {
    try { calculator = decodeCalculator(c); }
    catch { error = "This shared calculator is invalid or damaged."; }
  }
  return <Builder initialCalculator={calculator} initialError={error} />;
}
