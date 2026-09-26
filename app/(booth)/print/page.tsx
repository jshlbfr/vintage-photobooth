import type { Metadata } from "next";
import { PrintingScreen } from "@/components/screens/printing-screen";

export const metadata: Metadata = { title: "Printing Your Photos" };
export default function PrintPage() { return <PrintingScreen />; }
