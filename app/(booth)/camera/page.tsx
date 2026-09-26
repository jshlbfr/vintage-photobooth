import type { Metadata } from "next";
import { CameraSetup } from "@/components/screens/camera-setup";

export const metadata: Metadata = { title: "Camera Setup" };
export default function CameraPage() { return <CameraSetup />; }
