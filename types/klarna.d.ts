import 'react/jsx-runtime';
import type { KlarnaPlacementProps } from '@/components/klarna/types';

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'klarna-placement': KlarnaPlacementProps;
    }
  }
}
