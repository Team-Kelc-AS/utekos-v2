import type { StaticImageData } from "next/image";
import comfyrobeManWall from "@/assets/nbcc/Comfyrobe-Man-Wall-Logo-800x800.webp";
import comfyrobeManOutside from "@/assets/nbcc/Comfyrobe-Man-Outside-Logo-800x800.webp";
import comfyrobeWoman from "@/assets/nbcc/Comfyrobe-Woman-Logo-800x800.webp";
import comfyrobeFrontWall from "@/assets/nbcc/Comfyrobe-FrontWall-Logo-800x800.webp";
import comfyrobeBacksideWall from "@/assets/nbcc/Comfyrobe-Backside-Wall-Logo-800x800.webp";
import comfyrobeCampaignV2 from "@/assets/nbcc/Comfyrobe-Campaign.v2-Logo-800x800.webp";
import mikrofiberWoodsOff from "@/assets/nbcc/Mikrofiber-Woods-Off-Logo-800x800.webp";
import mikrofiberWoman from "@/assets/nbcc/Mikrofiber-Woman-Logo-800x800.webp";
import mikrofiberFrontFull from "@/assets/nbcc/Mikrofiber-Front-Full-Logo-800x800.webp";
import mikrofiberBacksideWall from "@/assets/nbcc/Mikrofiber-Backside-Wall-Logo-800x800.webp";
import mikrofiberFrontHalfWall from "@/assets/nbcc/Mikrofiber-Front-Half-Wall-Logo-800x800.webp";
import techdownWomanWallKikkert from "@/assets/nbcc/TechDown-WomanWall-Kikkert-v4-Logo-1200x1200.webp";
import techdownWomenKikkert from "@/assets/nbcc/TechDown-Women-Kikkert-Logo-800x800.webp";
import techdownWomanWall from "@/assets/nbcc/TechDown-Woman-Wall-Logo-800x800.webp";
import techdownBackside from "@/assets/nbcc/TechDown-Backside-Logo-800x800.webp";
import techdownDiagonalWall from "@/assets/nbcc/TechDown-Diagoal-Logo-Wall-800x800.webp";
import techdownFullFront from "@/assets/nbcc/TechDown-FullFront-Logo-800x800.webp";
import techdownBackSideHalv from "@/assets/nbcc/TechDown-BackSide-Halv-Logo-800x800.webp";
import techdownFrontHalv from "@/assets/nbcc/TechDown-Front-Halv-Logo-800x800.webp";
export { default as heroImage } from "@/assets/nbcc/nbcc-retro-master.webp";
export { default as nbccLogo } from "@/assets/nbcc/nbcc_logo_red_bg.png";

export type NbccProductConfig = {
  title: string; shortTitle: string; description: string; bestFor: string;
  images: { src: StaticImageData; alt: string }[];
  href: string; handle: string; sizes: string[]; color: string;
  tracking: Record<string, string>;
};

export const nbccProducts = [
  {
    title: 'Utekos TechDown™',
    shortTitle: 'TechDown™',
    description:
      'CloudWeave™-isolasjon og YKK® Dual V-Zip™ lar deg tilpasse plagget mellom fullengde, oppfestet modus og parkas.',
    bestFor: 'For bobil, campingvogn, fortelt og faste plasser.',
    images: [
      {
        src: techdownWomanWallKikkert,
        alt: 'Kvinne med kikkert i Utekos TechDown™'
      },
      {
        src: techdownWomenKikkert,
        alt: 'Kvinner med kikkert i Utekos TechDown™'
      },
      {
        src: techdownWomanWall,
        alt: 'Kvinne i Utekos TechDown™ foran vegg'
      },
      {
        src: techdownBackside,
        alt: 'Utekos TechDown™ sett bakfra'
      },
      {
        src: techdownDiagonalWall,
        alt: 'Utekos TechDown™ diagonalt mot vegg'
      },
      {
        src: techdownFullFront,
        alt: 'Utekos TechDown™ helfigur forfra'
      },
      {
        src: techdownBackSideHalv,
        alt: 'Utekos TechDown™ halvfigur bakfra'
      },
      {
        src: techdownFrontHalv,
        alt: 'Utekos TechDown™ halvfigur forfra'
      }
    ],
    href: '/produkter/utekos-techdown',
    handle: 'utekos-techdown',
    color: 'Havdyp',
    sizes: ['Middels', 'Stor', 'Større'],
    tracking: {
      page: 'nbcc',
      section: 'products',
      product: 'utekos-techdown'
    }
  },
  {
    title: 'Utekos Mikrofiber™',
    shortTitle: 'Mikrofiber™',
    description:
      'Lett, praktisk og enkel å pakke med når du vil ha et varmt lag klart ved stolen eller markisen.',
    bestFor: 'For sommerhalvåret, reisedager og raske turer ut.',
    images: [
      {
        src: mikrofiberWoodsOff,
        alt: 'Utekos Mikrofiber™ i Vargnatt og Fjellblå i skogen'
      },
      {
        src: mikrofiberWoman,
        alt: 'Kvinne i Utekos Mikrofiber™'
      },
      {
        src: mikrofiberFrontFull,
        alt: 'Utekos Mikrofiber™ helfigur forfra'
      },
      {
        src: mikrofiberBacksideWall,
        alt: 'Utekos Mikrofiber™ sett bakfra mot vegg'
      },
      {
        src: mikrofiberFrontHalfWall,
        alt: 'Utekos Mikrofiber™ halvfigur forfra mot vegg'
      }
    ],
    href: '/produkter/utekos-mikrofiber',
    handle: 'utekos-mikrofiber',
    sizes: ['Medium', 'Large'],
    color: 'Fjellblå',
    tracking: {
      page: 'nbcc',
      section: 'products',
      product: 'utekos-mikrofiber'
    }
  },
  {
    title: 'Comfyrobe™',
    shortTitle: 'Comfyrobe™',
    description:
      'Vanntett skall med 8000 mm vannsøyle og isolerende Sherpa-fleece. Et varmt lag etter dusj, bad eller en våt runde over campingplassen.',
    bestFor:
      'For våte morgener, skifte etter bad og kjølige kvelder ute.',
    images: [
      {
        src: comfyrobeManWall,
        alt: 'Mann i Comfyrobe foran vegg'
      },
      {
        src: comfyrobeManOutside,
        alt: 'Mann i Comfyrobe utendørs'
      },
      { src: comfyrobeWoman, alt: 'Kvinne i Comfyrobe' },
      {
        src: comfyrobeFrontWall,
        alt: 'Comfyrobe forfra mot vegg'
      },
      {
        src: comfyrobeBacksideWall,
        alt: 'Comfyrobe sett bakfra mot vegg'
      },
      {
        src: comfyrobeCampaignV2,
        alt: 'Comfyrobe kampanjebilde'
      }
    ],
    href: '/produkter/comfyrobe',
    handle: 'comfyrobe',
    sizes: ['XS', 'XL'],
    color: 'Fjellnatt',
    tracking: {
      page: 'nbcc',
      section: 'products',
      product: 'comfyrobe'
    }
  }
] satisfies NbccProductConfig[]
