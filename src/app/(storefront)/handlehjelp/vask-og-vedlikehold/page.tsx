import Content from "./content.mdx";
import { typesetComponents } from "@/components/mdx/typeset";
import type { ReactNode } from "react";

function MaintenanceTypeset({ children }: { children?: ReactNode }) {
  return <div className="typeset typeset-docs w-full max-w-none">{children}</div>;
}

const maintenanceComponents = {
  ...typesetComponents,
  wrapper: MaintenanceTypeset,
};

export const metadata = {
  title: "Vedlikehold av Utekos | Slik bevarer du varmen i mange år",
  description:
    "En tydelig vedlikeholdsguide for Utekos Dun™, Utekos Mikrofiber™, Utekos TechDown™ og Comfyrobe™. Riktig vask, tørking og oppbevaring bevarer varmen, formen og kvaliteten.",
};

export default function MaintenancePage() {
  return <Content components={maintenanceComponents} />;
}
