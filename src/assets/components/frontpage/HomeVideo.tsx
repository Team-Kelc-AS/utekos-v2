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
        data-deferred-poster={homeVideos.desktop.poster}
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
        data-deferred-poster={homeVideos.mobile.poster}
        loop
        muted
        playsInline
        preload="none"
        aria-label="Film fra Utekos"
      >
        <source src={homeVideos.mobile.src} type="video/mp4" />
        <a href={homeVideos.mobile.src}>Se filmen fra Utekos</a>
      </video>
      <noscript>
        <style>{"video[data-deferred-poster] { display: none; }"}</style>
        <picture>
          <source media="(min-width: 1024px)" srcSet={homeVideos.desktop.poster} width={1920} height={720} />
          {/* Native noscript fallback preserves the original responsive posters. */}
          <img src={homeVideos.mobile.poster} width={1080} height={1920} alt="Film fra Utekos" className={styles.video} />
        </picture>
      </noscript>
    </VideoPlayback>
  );
}
