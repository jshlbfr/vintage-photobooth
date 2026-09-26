import type { Metadata } from "next";
import { CustomizeScreen } from "@/components/screens/customize-screen";

export const metadata: Metadata = { title: "Customize Your Photo" };
export default function CustomizePage() { return <CustomizeScreen />; }
