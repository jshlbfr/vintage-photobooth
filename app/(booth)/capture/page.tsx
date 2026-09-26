import type { Metadata } from "next";
import { CaptureScreen } from "@/components/screens/capture-screen";

export const metadata: Metadata = { title: "Strike a Pose" };
export default function CapturePage() { return <CaptureScreen />; }
