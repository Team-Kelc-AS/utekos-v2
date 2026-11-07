'use client';

import { Children, type ReactNode } from 'react';
import { CarouselItem } from '@/components/ui/carousel';
import { useMobileFirstItems } from './useMobileFirstItems';

export function MobileFirstCarouselItems({ children, mobileFirstIndex, className }: { children: ReactNode; mobileFirstIndex?: number; className?: string }) {
  const items = useMobileFirstItems(Children.toArray(children), mobileFirstIndex);
  return Children.map(items, (child, index) => <CarouselItem className={className} aria-label={`${index + 1} av ${items.length}`}>{child}</CarouselItem>);
}
