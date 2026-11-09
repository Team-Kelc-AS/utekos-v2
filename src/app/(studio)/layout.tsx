import type { ReactNode } from "react";
import { googleSansFlex } from "@/lib/fonts";
import "./studio.css";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nb" className={googleSansFlex.variable}>
      <body>{children}</body>
    </html>
  );
}
