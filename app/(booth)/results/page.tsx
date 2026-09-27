import type { Metadata } from "next";
import { ResultsScreen } from "@/components/screens/results-screen";

export const metadata: Metadata = { title: "Your Photos Are Ready" };
export default function ResultsPage() { return <ResultsScreen />; }
