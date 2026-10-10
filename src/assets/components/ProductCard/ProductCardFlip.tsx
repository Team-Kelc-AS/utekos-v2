'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProductCardVideo, type ProductCardVideoSource } from './ProductCardVideo';
import styles from './ProductCardFlip.module.css';

export function ProductCardFlip({ children, back, label, video }: {
  children: ReactNode;
  back: ReactNode;
  label: string;
  video?: ProductCardVideoSource;
}) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [playing, setPlaying] = useState(false);

  return <div className={styles.media} data-card-flipped={flipped} onKeyDown={event => {
    if (event.key === 'Escape' && flipped) {
      event.preventDefault();
      setFlipped(false);
      buttonRef.current?.focus();
    }
  }}>
    <div id={id} className={styles.turn}>
      <div className={styles.front} aria-hidden={flipped} inert={flipped}>
        {video ? <ProductCardVideo {...video} label={label} onPlayingChange={setPlaying}>{children}</ProductCardVideo> : children}
      </div>
      <div className={styles.back} aria-hidden={!flipped} inert={!flipped}>{back}</div>
    </div>
    <button ref={buttonRef} type="button" className={styles.toggle} hidden={playing}
      aria-label={`${flipped ? 'Vis produktbilde' : 'Vis fargeark'} for ${label}`}
      aria-controls={id} aria-pressed={flipped}
      onClick={event => { event.stopPropagation(); setFlipped(previous => !previous); }}>
      {flipped ? <ArrowLeft aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
    </button>
    <span className="sr-only" role="status">{flipped ? `Fargeark for ${label}` : ''}</span>
  </div>;
}
