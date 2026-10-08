import "server-only";

import styles from "./HomeVideo.module.css";
import { VideoPlayback } from "./VideoPlayback";
import { homeVideos } from "@/lib/seo/videoMedia";

export function HomeVideo() {
  return (
    <VideoPlayback>
      <video
        className={`${styles.video} ${styles.desktop}`}
        width={1920}
        height={720}
        poster={homeVideos.desktop.poster}
        loop
        muted
        playsInline
        preload="none"
        aria-label="Film fra Utekos"
      >
        <source src={homeVideos.desktop.src} type="video/mp4" />
        <a href={homeVideos.desktop.src}>Se filmen fra Utekos</a>
      </video>
      <video
        className={`${styles.video} ${styles.mobile}`}
        width={1080}
        height={1920}
        poster={homeVideos.mobile.poster}
        loop
        muted
        playsInline
        preload="none"
        aria-label="Film fra Utekos"
      >
        <source src={homeVideos.mobile.src} type="video/mp4" />
        <a href={homeVideos.mobile.src}>Se filmen fra Utekos</a>
      </video>
    </VideoPlayback>
  );
}
