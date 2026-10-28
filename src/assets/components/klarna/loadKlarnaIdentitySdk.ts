'use client';

export type KlarnaIdentitySignInResponse = {
  user_account_linking: { user_account_linking_id_token: string };
};

export function klarnaIdentityIdToken(response: KlarnaIdentitySignInResponse): string {
  const token = response?.user_account_linking?.user_account_linking_id_token;
  if (typeof token !== 'string' || token.length < 100 || token.length > 12000) {
    throw new Error('Klarna sign-in response is missing an ID token');
  }
  return token;
}
export type KlarnaIdentitySdk = {
  Identity: {
    button: (config: {
      clientType: 'public'; id: string; locale: string;
      redirectUri: string; scope: string; theme: 'default';
    }) => {
      mount: (container: HTMLElement) => void;
      on(event: 'ready' | 'click', callback: () => Promise<void>): void;
      unmount: () => void;
    };
    on: {
      (event: 'signin', callback: (response: KlarnaIdentitySignInResponse) => Promise<void>): void;
      (event: 'error', callback: (error: Error) => Promise<void>): void;
    };
    clearLoginState: () => Promise<void>;
  };
};

type KlarnaSdkFactory = (config: {
  clientId: string; locale: string; products: ['IDENTITY'];
}) => Promise<KlarnaIdentitySdk>;

const SDK_URL = 'https://js.klarna.com/web-sdk/v2/klarna.mjs';
let factoryPromise: Promise<KlarnaSdkFactory> | undefined;

export async function loadKlarnaIdentitySdk(clientId: string): Promise<KlarnaIdentitySdk> {
  factoryPromise ??= import(/* webpackIgnore: true */ SDK_URL)
    .then((module: { KlarnaSDK?: KlarnaSdkFactory }) => {
      if (typeof module.KlarnaSDK !== 'function') throw new Error('Klarna Identity SDK is unavailable');
      return module.KlarnaSDK;
    })
    .catch(error => { factoryPromise = undefined; throw error; });
  const factory = await factoryPromise;
  return factory({ clientId, locale: 'nb-NO', products: ['IDENTITY'] });
}
