import Image from "next/image";
import { cn } from "cn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import styles from "./SkreddersyBanner.module.css";

export function SkreddersyBanner({
  mobileLayout = "vertical",
}: {
  mobileLayout?: "vertical" | "horizontal";
}) {
  return (
    <Card
      className={cn("rounded-md ring-0 md:rounded-[25px]", styles.banner, mobileLayout === "vertical" && styles.mobileLayout)}
      data-skreddersy-banner
      data-mobile-layout={mobileLayout}
    >
      <CardHeader className={styles.copy}>
        <CardTitle>
          <h1 className={styles.title}>
            <span>Skreddersy</span>{" "}<span>varmen</span>
          </h1>
        </CardTitle>
        <CardDescription className={styles.description}>
          Opplev kompromissløs komfort og overlegen allsidighet
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.brand}>
        <Image
          src="/WordmarkWhite.svg"
          alt="Utekos"
          width={1280}
          height={311}
          className={styles.wordmark}
          loading="eager"
          unoptimized
        />
      </CardContent>
    </Card>
  );
}
