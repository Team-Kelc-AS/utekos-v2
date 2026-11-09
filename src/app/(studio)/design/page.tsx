import type { Metadata } from "next";
import { FreeformStudio } from "@/components/studio/FreeformStudio";

export const metadata: Metadata = {
  title: "Designstudio | Utekos",
  description: "Lag og last ned dine egne kort og designfiler.",
  robots: { index: false, follow: false },
};

export default function DesignStudioPage() {
  return <FreeformStudio />;
}
