import type { KlarnaCollectedShippingAddress, KlarnaExpressOrderPayload } from '@/lib/klarna/contracts';

export type KlarnaAuthorizationResult = {
  approved?: boolean;
  authorization_token?: string;
  show_form?: boolean;
  finalize_required?: boolean;
  collected_shipping_address?: KlarnaCollectedShippingAddress;
} & KlarnaCollectedShippingAddress;

export type KlarnaAuthorize = (
  options: { auto_finalize: true; collect_shipping_address: true },
  payload: KlarnaExpressOrderPayload,
  callback: (result: KlarnaAuthorizationResult) => void,
) => void;

declare global {
  interface Window {
    klarnaAsyncCallback?: () => void;
    Klarna?: {
      Payments: {
        Buttons: {
          init: (config: { client_id: string }) => {
            load: (
              config: {
                container: string;
                theme: 'default';
                shape: 'pill';
                locale: 'nb-NO';
                on_click: (authorize: KlarnaAuthorize) => void;
              },
              callback: (result: { show_form?: boolean }) => void,
            ) => void;
          };
        };
      };
    };
  }
}
