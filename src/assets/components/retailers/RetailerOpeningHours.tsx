import "server-only";

import { connection } from "next/dist/server/request/connection";
import { retailerMapsUrl, type Retailer } from "@/lib/retailers";
import { getRetailerOpeningHours } from "@/lib/retailers/opening-hours";
import styles from "./retailers.module.css";

export function OpeningHoursFallback({ retailer }: { retailer: Retailer }) {
  return <p>Ring <a href={`tel:${retailer.telephone}`}>{retailer.phone}</a> før besøket.</p>;
}

export default async function RetailerOpeningHours({ retailer }: { retailer: Retailer }) {
  await connection();
  const hours = await getRetailerOpeningHours(retailer);
  if (!hours) return <OpeningHoursFallback retailer={retailer} />;
  return (
    <div className={styles.googleHours}>
      <ul className={styles.hours}>{hours.days.map((day, index) => <li key={index}>{day}</li>)}</ul>
      <a href={retailerMapsUrl(retailer)} className={styles.googleAttribution} translate="no">Google Maps</a>
      {hours.attributions.map(({ provider, providerUri }) => <a key={providerUri} href={providerUri}>{provider}</a>)}
    </div>
  );
}
