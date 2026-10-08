import { PublicCalculator } from "@/components/public-calculator";

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  const { c } = await searchParams;
  return <PublicCalculator encoded={typeof c === "string" ? c : undefined} />;
}
