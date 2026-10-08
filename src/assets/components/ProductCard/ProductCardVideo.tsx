'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Play } from 'lucide-react';
import type { ProductVideoSource } from '@/lib/products/variantVideos';
import styles from './ProductCardVideo.module.css';

export type ProductCardVideoSource = ProductVideoSource;

export function ProductCardVideo({ src, width, height, poster, label, children, desktopOnly = false }: ProductCardVideoSource & { label: string; children: ReactNode; desktopOnly?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const attempt = useRef({ generation: 0 });
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');

  const showImage = useCallback(() => {
    attempt.current.generation++;
    const video = videoRef.current;
    const restoreFocus = document.activeElement === video;
    video?.pause();
    setPlaying(false);
    if (restoreFocus) requestAnimationFrame(() => playRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const playback = attempt.current;
    const desktop = desktopOnly ? matchMedia('(min-width: 768px)') : null;
    const onViewportChange = () => { if (!desktop?.matches) showImage(); };
    desktop?.addEventListener('change', onViewportChange);
    return () => {
      playback.generation++;
      video?.pause();
      desktop?.removeEventListener('change', onViewportChange);
    };
  }, [desktopOnly, showImage]);

  function playbackFailed() {
    showImage();
    setError('Videoen kunne ikke spilles av. Prøv igjen.');
  }

  function play() {
    const video = videoRef.current;
    if (!video) return;
    const currentAttempt = ++attempt.current.generation;
    setError('');
    setPlaying(true);
    // The source is discoverable in server HTML; preload="none" defers the
    // media download until the customer chooses to play it.
    if (video.error) video.load();
    if (video.readyState > 0) video.currentTime = 0;
    void video.play().catch(() => {
      if (attempt.current.generation === currentAttempt) playbackFailed();
    });
    requestAnimationFrame(() => video.focus({ preventScroll: true }));
  }

  return <div className={`${styles.media}${desktopOnly ? ` ${styles.desktopOnly}` : ''}`}>
    <div className={styles.image} hidden={playing}>
      {children}
      <button ref={playRef} type="button" className={styles.play} onClick={play} aria-label={`Spill av video av ${label}`}>
        <Play aria-hidden="true" fill="currentColor" />
      </button>
    </div>
    <video ref={videoRef} src={src} poster={poster} hidden={!playing} className={styles.video} width={width} height={height}
      playsInline preload="none" tabIndex={0} aria-label={`Produktvideo: ${label}`}
      onEnded={showImage} onError={() => { if (playing) playbackFailed(); }}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); showImage(); } }}>
      <a href={src}>Se produktvideoen av {label}</a>
    </video>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
