// Local preview of the supplied prototype; purchase controls are demo-only.
export function GET() {
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };

  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404, headers });
  }

  return new Response(html, {
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}

// String.raw preserves the inline JavaScript's regular expressions.
const html = String.raw`<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Utekos Svale – Produktside Prototype</title>
  <style>
    :root {
      --bg: #001211;
      --bg-soft: #012622;
      --bg-card: #0a1f1d;
      --bg-elevated: #102826;
      --text: #f0eee9;
      --muted: #cfc9bf;
      --subtle: #9ea7a2;
      --line: rgba(240, 238, 233, 0.14);
      --line-strong: rgba(240, 238, 233, 0.24);
      --accent: #b44701;
      --accent-hover: #c95611;
      --panel: #0c1716;
      --success: #d5e6d9;
      --shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
      --radius-xl: 28px;
      --radius-lg: 20px;
      --radius-md: 14px;
      --radius-sm: 10px;
      --max: 1440px;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top right, rgba(180, 71, 1, 0.12), transparent 28%),
        linear-gradient(180deg, #011312 0%, #001211 100%);
      color: var(--text);
      line-height: 1.5;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    img {
      max-width: 100%;
      display: block;
    }

    .container {
      width: min(calc(100% - 32px), var(--max));
      margin: 0 auto;
    }

    .topbar {
      border-bottom: 1px solid var(--line);
      background: rgba(0, 18, 17, 0.85);
      backdrop-filter: blur(14px);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .topbar-inner {
      min-height: 76px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: 0;
      white-space: nowrap;
    }

    .brand-mark {
      width: 34px;
      height: 34px;
      border: 1px solid rgba(240, 238, 233, 0.18);
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, rgba(240,238,233,0.04), rgba(240,238,233,0.01));
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    }

    .brand-mark span {
      font-size: 0.95rem;
      color: var(--accent);
      font-weight: 700;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: 22px;
      color: var(--muted);
      font-size: 0.97rem;
    }

    .nav a {
      opacity: 0.95;
    }

    .nav a:hover {
      color: var(--text);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon-btn,
    .btn,
    .size-btn,
    .qty-btn,
    .accordion-trigger {
      font: inherit;
    }

    .icon-btn {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      border: 1px solid var(--line);
      display: grid;
      place-items: center;
      background: rgba(255,255,255,0.02);
      color: var(--text);
      cursor: pointer;
      transition: 0.2s ease;
    }

    .icon-btn:hover {
      background: rgba(255,255,255,0.05);
      border-color: var(--line-strong);
    }

    .hero {
      padding: 36px 0 48px;
    }

    .breadcrumbs {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      color: var(--subtle);
      font-size: 0.92rem;
      margin-bottom: 20px;
    }

    .breadcrumbs span {
      opacity: 0.7;
    }

    .product-layout {
      display: grid;
      grid-template-columns: 1.08fr 0.92fr;
      gap: 34px;
      align-items: start;
    }

    .gallery {
      display: grid;
      grid-template-columns: 96px 1fr;
      gap: 18px;
      position: sticky;
      top: 108px;
    }

    .thumbs {
      display: grid;
      gap: 12px;
      align-content: start;
    }

    .thumb {
      width: 96px;
      aspect-ratio: 4 / 5;
      border-radius: 16px;
      border: 1px solid var(--line);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)),
        #0a1615;
      overflow: hidden;
      cursor: pointer;
      padding: 0;
      transition: 0.2s ease;
    }

    .thumb:hover,
    .thumb.active {
      border-color: rgba(240, 238, 233, 0.34);
      transform: translateY(-1px);
    }

    .thumb img,
    .main-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .main-media-wrap {
      display: grid;
      gap: 14px;
    }

    .main-media {
      aspect-ratio: 4 / 5;
      border-radius: var(--radius-xl);
      overflow: hidden;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)),
        #091514;
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      position: relative;
    }

    .media-badge {
      position: absolute;
      top: 18px;
      left: 18px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 18, 17, 0.66);
      border: 1px solid rgba(240, 238, 233, 0.16);
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 0.88rem;
      color: var(--muted);
      backdrop-filter: blur(8px);
    }

    .gallery-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--subtle);
      font-size: 0.92rem;
    }

    .details {
      display: grid;
      gap: 22px;
    }

    .eyebrow {
      color: var(--muted);
      font-size: 0.95rem;
      letter-spacing: 0.01em;
    }

    h1 {
      margin: 6px 0 0;
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1.02;
      letter-spacing: -0.03em;
      font-weight: 800;
    }

    .lead {
      max-width: 58ch;
      color: var(--muted);
      font-size: 1.03rem;
    }

    .price-card,
    .info-card,
    .shipping-card,
    .sticky-mobile-actions,
    .accordion-item,
    .editorial-panel {
      background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012));
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
    }

    .price-card {
      padding: 22px;
      display: grid;
      gap: 20px;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .price-label {
      font-size: 0.94rem;
      color: var(--subtle);
    }

    .price-value {
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .muted-note {
      color: var(--subtle);
      font-size: 0.94rem;
    }

    .section-label {
      font-size: 0.84rem;
      text-transform: none;
      color: var(--subtle);
      margin-bottom: 10px;
    }

    .size-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .size-btn {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.02);
      color: var(--text);
      border-radius: 14px;
      padding: 15px 12px;
      cursor: pointer;
      transition: 0.2s ease;
      min-height: 56px;
    }

    .size-btn:hover {
      border-color: var(--line-strong);
      background: rgba(255,255,255,0.04);
    }

    .size-btn.active {
      border-color: var(--accent);
      background: rgba(180, 71, 1, 0.14);
      box-shadow: inset 0 0 0 1px rgba(180, 71, 1, 0.28);
    }

    .size-btn small {
      display: block;
      color: var(--subtle);
      font-size: 0.82rem;
      margin-top: 2px;
    }

    .actions-row {
      display: grid;
      grid-template-columns: 132px 1fr;
      gap: 12px;
    }

    .qty {
      display: grid;
      grid-template-columns: 44px 1fr 44px;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 999px;
      overflow: hidden;
      background: rgba(255,255,255,0.02);
      min-height: 56px;
    }

    .qty-btn {
      border: 0;
      height: 100%;
      background: transparent;
      color: var(--text);
      cursor: pointer;
      font-size: 1.1rem;
    }

    .qty-value {
      text-align: center;
      font-weight: 600;
    }

    .btn {
      min-height: 56px;
      border-radius: 999px;
      border: 0;
      padding: 0 22px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.2s ease;
    }

    .btn-primary {
      background: var(--accent);
      color: #fff;
    }

    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--line);
      color: var(--text);
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.04);
      border-color: var(--line-strong);
    }

    .mini-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .mini-pill {
      padding: 11px 14px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      font-size: 0.93rem;
      background: rgba(255,255,255,0.02);
    }

    .info-card {
      padding: 22px;
      display: grid;
      gap: 16px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .info-box {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(240, 238, 233, 0.08);
      border-radius: 16px;
      padding: 16px;
    }

    .info-box strong {
      display: block;
      margin-bottom: 8px;
      font-size: 0.98rem;
    }

    .info-box p {
      margin: 0;
      color: var(--muted);
      font-size: 0.94rem;
    }

    .accordion {
      display: grid;
      gap: 12px;
    }

    .accordion-item {
      overflow: hidden;
    }

    .accordion-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 20px 22px;
      background: transparent;
      border: 0;
      color: var(--text);
      cursor: pointer;
      text-align: left;
    }

    .accordion-trigger span:first-child {
      font-weight: 600;
      font-size: 1rem;
    }

    .accordion-trigger .plus {
      color: var(--subtle);
      font-size: 1.2rem;
      transition: transform 0.2s ease;
    }

    .accordion-item.open .accordion-trigger .plus {
      transform: rotate(45deg);
    }

    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease;
      border-top: 1px solid transparent;
    }

    .accordion-item.open .accordion-content {
      border-top-color: rgba(240,238,233,0.08);
    }

    .accordion-inner {
      padding: 18px 22px 22px;
      color: var(--muted);
    }

    .accordion-inner p:first-child {
      margin-top: 0;
    }

    .accordion-inner p:last-child {
      margin-bottom: 0;
    }

    .spec-list,
    .benefit-list {
      margin: 0;
      padding-left: 1.1rem;
    }

    .spec-list li,
    .benefit-list li {
      margin: 0 0 10px;
    }

    .content-sections {
      padding: 28px 0 86px;
      display: grid;
      gap: 28px;
    }

    .editorial-panel {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      overflow: hidden;
    }

    .editorial-copy {
      padding: 34px;
      display: grid;
      align-content: center;
      gap: 16px;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)),
        linear-gradient(135deg, rgba(180,71,1,0.08), transparent 30%);
    }

    .editorial-copy h2,
    .content-block h2 {
      margin: 0;
      font-size: clamp(1.6rem, 2.3vw, 2.35rem);
      line-height: 1.08;
      letter-spacing: -0.03em;
    }

    .editorial-copy p,
    .content-block p {
      margin: 0;
      color: var(--muted);
      max-width: 58ch;
    }

    .editorial-visual {
      min-height: 360px;
      background:
        linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.28)),
        url("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat;
      border-left: 1px solid var(--line);
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
    }

    .content-block {
      padding: 28px;
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012));
      box-shadow: var(--shadow);
    }

    .table-wrap {
      overflow-x: auto;
      margin-top: 18px;
      border: 1px solid rgba(240,238,233,0.08);
      border-radius: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 560px;
    }

    th, td {
      text-align: left;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(240,238,233,0.08);
      font-size: 0.95rem;
    }

    th {
      color: var(--subtle);
      font-weight: 600;
      background: rgba(255,255,255,0.02);
    }

    td {
      color: var(--muted);
    }

    tr:last-child td {
      border-bottom: 0;
    }

    .faq-intro {
      color: var(--muted);
      margin-top: 8px;
      max-width: 60ch;
    }

    .shipping-card {
      padding: 22px;
      display: grid;
      gap: 10px;
    }

    .shipping-card strong {
      font-size: 1rem;
    }

    .shipping-card p {
      margin: 0;
      color: var(--muted);
    }

    footer {
      border-top: 1px solid var(--line);
      padding: 26px 0 60px;
      color: var(--subtle);
    }

    .footer-grid {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
    }

    .sticky-mobile-actions {
      display: none;
      position: fixed;
      left: 14px;
      right: 14px;
      bottom: 14px;
      z-index: 70;
      padding: 14px;
      backdrop-filter: blur(14px);
      background: rgba(0, 18, 17, 0.82);
    }

    .sticky-mobile-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .sticky-mobile-price {
      display: grid;
      gap: 2px;
    }

    .sticky-mobile-price strong {
      font-size: 1.1rem;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      border: 0;
    }

    @media (max-width: 1180px) {
      .product-layout {
        grid-template-columns: 1fr;
      }

      .gallery {
        position: static;
      }

      .details {
        max-width: 860px;
      }
    }

    @media (max-width: 860px) {
      .nav {
        display: none;
      }

      .gallery {
        grid-template-columns: 1fr;
      }

      .thumbs {
        grid-template-columns: repeat(4, 1fr);
        order: 2;
      }

      .thumb {
        width: 100%;
      }

      .info-grid,
      .content-grid,
      .editorial-panel {
        grid-template-columns: 1fr;
      }

      .editorial-visual {
        border-left: 0;
        border-top: 1px solid var(--line);
        min-height: 280px;
      }

      .actions-row {
        grid-template-columns: 1fr;
      }

      .size-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .sticky-mobile-actions {
        display: block;
      }

      body {
        padding-bottom: 110px;
      }
    }

    @media (max-width: 560px) {
      .topbar-inner {
        min-height: 68px;
      }

      .container {
        width: min(calc(100% - 20px), var(--max));
      }

      .hero {
        padding-top: 22px;
      }

      h1 {
        font-size: 2.25rem;
      }

      .price-card,
      .info-card,
      .shipping-card,
      .content-block,
      .editorial-copy {
        padding: 18px;
      }

      .accordion-trigger {
        padding: 18px;
      }

      .accordion-inner {
        padding: 16px 18px 18px;
      }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="container topbar-inner">
      <a href="#" class="brand" aria-label="Utekos">
        <div class="brand-mark" aria-hidden="true"><span>U</span></div>
        <span>Utekos</span>
      </a>

      <nav class="nav" aria-label="Hovednavigasjon">
        <a href="#">Produkter</a>
        <a href="#">Svale</a>
        <a href="#">Størrelsesguide</a>
        <a href="#">Levering og retur</a>
        <a href="#">Kontakt</a>
      </nav>

      <div class="header-actions">
        <button class="icon-btn" aria-label="Søk">
          <span aria-hidden="true">⌕</span>
        </button>
        <button class="icon-btn" aria-label="Handlekurv">
          <span aria-hidden="true">👜</span>
        </button>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <div class="breadcrumbs" aria-label="Brødsmulesti">
          <a href="#">Hjem</a>
          <span>/</span>
          <a href="#">Produkter</a>
          <span>/</span>
          <a href="#">Ytterplagg</a>
          <span>/</span>
          <strong>Utekos Svale</strong>
        </div>

        <div class="product-layout">
          <section class="gallery" aria-label="Produktgalleri">
            <div class="thumbs" role="tablist" aria-label="Produktbilder">
              <button class="thumb active" role="tab" aria-selected="true" aria-label="Produktbilde 1"
                data-large="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80">
                <img src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80" alt="Utekos Svale produktvisning 1">
              </button>

              <button class="thumb" role="tab" aria-selected="false" aria-label="Produktbilde 2"
                data-large="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80">
                <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80" alt="Utekos Svale produktvisning 2">
              </button>

              <button class="thumb" role="tab" aria-selected="false" aria-label="Produktbilde 3"
                data-large="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80">
                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80" alt="Utekos Svale produktvisning 3">
              </button>

              <button class="thumb" role="tab" aria-selected="false" aria-label="Produktbilde 4"
                data-large="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80">
                <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=400&q=80" alt="Utekos Svale produktvisning 4">
              </button>
            </div>

            <div class="main-media-wrap">
              <div class="main-media">
                <div class="media-badge">Luxury editorial · Utekos Svale</div>
                <img
                  id="mainProductImage"
                  src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80"
                  alt="Utekos Svale hovedbilde"
                />
              </div>
              <div class="gallery-meta">
                <span>Rolig, premium presentasjon med tydelig produktfokus.</span>
                <span>4 bilder</span>
              </div>
            </div>
          </section>

          <section class="details" aria-labelledby="product-title">
            <div>
              <div class="eyebrow">Utekos</div>
              <h1 id="product-title">Svale</h1>
            </div>

            <p class="lead">
              En produktsideprototype utviklet for en kjøpssterk målgruppe som forventer høy kvalitet,
              enkel oversikt og en konsekvent premiumopplevelse gjennom hele kjøpsreisen.
            </p>

            <div class="price-card" aria-label="Kjøpsseksjon">
              <div class="price-row">
                <div>
                  <div class="price-label">Pris</div>
                  <div class="price-value">Pris legges inn her</div>
                </div>
                <div class="muted-note">Ingen pris oppgitt i briefen</div>
              </div>

              <div>
                <div class="section-label">Velg størrelse</div>
                <div class="size-grid" role="radiogroup" aria-label="Velg størrelse">
                  <button class="size-btn active" role="radio" aria-checked="true">
                    Liten
                    <small>XS/S</small>
                  </button>
                  <button class="size-btn" role="radio" aria-checked="false">
                    Middels
                    <small>M/L</small>
                  </button>
                  <button class="size-btn" role="radio" aria-checked="false">
                    Stor
                    <small>XL/XXL</small>
                  </button>
                  <button class="size-btn" role="radio" aria-checked="false">
                    Størrelsesguide
                    <small>Se mål</small>
                  </button>
                </div>
              </div>

              <div class="actions-row">
                <div class="qty" aria-label="Antall">
                  <button class="qty-btn" id="decreaseQty" aria-label="Reduser antall">−</button>
                  <div class="qty-value" id="qtyValue" aria-live="polite">1</div>
                  <button class="qty-btn" id="increaseQty" aria-label="Øk antall">+</button>
                </div>

                <button class="btn btn-primary" id="addToCartBtn">Legg i handlekurv</button>
              </div>

              <div class="mini-actions">
                <button class="btn btn-secondary">Kjøp nå</button>
                <button class="btn btn-secondary">Lagre</button>
              </div>

              <div class="shipping-card" aria-label="Kjøpsinformasjon">
                <strong>Trygg og forutsigbar kjøpsopplevelse</strong>
                <p>
                  Denne prototypen prioriterer tydelig informasjon, lav kognitiv belastning og en
                  kjøpsflyt som gjør det enkelt å gå fra vurdering til handling.
                </p>
              </div>
            </div>

            <div class="info-card">
              <div class="section-label">Hvorfor denne sidetypen fungerer</div>
              <div class="info-grid">
                <div class="info-box">
                  <strong>Tydelig hierarki</strong>
                  <p>Produkt, valg og primærhandling er prioritert i riktig rekkefølge.</p>
                </div>
                <div class="info-box">
                  <strong>Lav friksjon</strong>
                  <p>Få visuelle distraksjoner og enkel navigasjon støtter kjøpsintensjon.</p>
                </div>
                <div class="info-box">
                  <strong>Premium følelse</strong>
                  <p>Materialitet, luft og kontrast bygger en luksuriøs editorial-opplevelse.</p>
                </div>
              </div>
            </div>

            <div class="accordion" aria-label="Produktinformasjon">
              <div class="accordion-item open">
                <button class="accordion-trigger" aria-expanded="true">
                  <span>Produktoversikt</span>
                  <span class="plus" aria-hidden="true">+</span>
                </button>
                <div class="accordion-content" style="max-height: 260px;">
                  <div class="accordion-inner">
                    <p>
                      Her legges den endelige produktteksten for Utekos Svale inn. I denne prototypen
                      er seksjonen bevisst holdt ren og strukturert, slik at faktisk produktcopy kan
                      presenteres uten å tilføre nye påstander eller detaljer.
                    </p>
                    <ul class="benefit-list">
                      <li>Rolig og tydelig innholdspresentasjon.</li>
                      <li>Designet for å støtte kjøpsbeslutning.</li>
                      <li>Passer en målgruppe som forventer kvalitet og konsistens.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-trigger" aria-expanded="false">
                  <span>Størrelsesguide</span>
                  <span class="plus" aria-hidden="true">+</span>
                </button>
                <div class="accordion-content">
                  <div class="accordion-inner">
                    <p>Størrelsesinformasjon kan presenteres presist her med Utekos sine faktiske mål.</p>
                    <ul class="spec-list">
                      <li>Liten — tilsvarer XS/S</li>
                      <li>Middels — tilsvarer M/L</li>
                      <li>Stor — tilsvarer XL/XXL</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-trigger" aria-expanded="false">
                  <span>Levering og retur</span>
                  <span class="plus" aria-hidden="true">+</span>
                </button>
                <div class="accordion-content">
                  <div class="accordion-inner">
                    <p>
                      Bruk denne flaten til Utekos sin faktiske informasjon om levering, retur og eventuelle vilkår.
                    </p>
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-trigger" aria-expanded="false">
                  <span>Materialer og detaljer</span>
                  <span class="plus" aria-hidden="true">+</span>
                </button>
                <div class="accordion-content">
                  <div class="accordion-inner">
                    <p>
                      Denne seksjonen er satt av til endelige, bekreftede produktdetaljer og materialspesifikasjoner.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>

    <section class="content-sections">
      <div class="container">
        <section class="editorial-panel" aria-label="Editorial seksjon">
          <div class="editorial-copy">
            <div class="eyebrow">Luxury editorial experience</div>
            <h2>En produktside som føles like gjennomført som produktet.</h2>
            <p>
              For en sofistikert målgruppe handler tillit om helhetsinntrykk. Derfor er siden bygget
              med ro, tydelighet og en visuelt konsistent premiumfølelse som reduserer usikkerhet og
              støtter handling.
            </p>
          </div>
          <div class="editorial-visual" aria-hidden="true"></div>
        </section>
      </div>

      <div class="container content-grid">
        <section class="content-block" aria-labelledby="details-heading">
          <div class="eyebrow">Produktinformasjon</div>
          <h2 id="details-heading">Strukturert presentasjon av innholdet</h2>
          <p>
            Innholdet er organisert for å gjøre viktige valg enkle: se produktet, velg størrelse,
            forstå informasjonen og legg i handlekurv. Alt overflødig er tonet ned for å holde fokus på kjøpet.
          </p>

          <div class="table-wrap" aria-label="Eksempel på størrelsestabell">
            <table>
              <thead>
                <tr>
                  <th>Størrelse</th>
                  <th>Navn</th>
                  <th>Kommentar</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>XS/S</td>
                  <td>Liten</td>
                  <td>Faktiske mål legges inn</td>
                </tr>
                <tr>
                  <td>M/L</td>
                  <td>Middels</td>
                  <td>Faktiske mål legges inn</td>
                </tr>
                <tr>
                  <td>XL/XXL</td>
                  <td>Stor</td>
                  <td>Faktiske mål legges inn</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="content-block" aria-labelledby="faq-heading">
          <div class="eyebrow">Kundetrygghet</div>
          <h2 id="faq-heading">Vanlige spørsmål og beslutningsstøtte</h2>
          <p class="faq-intro">
            Denne delen kan brukes til spørsmål som ofte oppstår før kjøp, slik at brukeren opplever
            klarhet framfor tvil når de vurderer produktet.
          </p>

          <div class="accordion" style="margin-top: 18px;">
            <div class="accordion-item">
              <button class="accordion-trigger" aria-expanded="false">
                <span>Hvordan velger jeg riktig størrelse?</span>
                <span class="plus" aria-hidden="true">+</span>
              </button>
              <div class="accordion-content">
                <div class="accordion-inner">
                  <p>Lenk brukeren til størrelsesguide og konkret, verifisert veiledning.</p>
                </div>
              </div>
            </div>

            <div class="accordion-item">
              <button class="accordion-trigger" aria-expanded="false">
                <span>Hva følger med kjøpet?</span>
                <span class="plus" aria-hidden="true">+</span>
              </button>
              <div class="accordion-content">
                <div class="accordion-inner">
                  <p>Fyll inn kun bekreftet informasjon som skal kommuniseres på produktsiden.</p>
                </div>
              </div>
            </div>

            <div class="accordion-item">
              <button class="accordion-trigger" aria-expanded="false">
                <span>Hvordan fungerer levering og retur?</span>
                <span class="plus" aria-hidden="true">+</span>
              </button>
              <div class="accordion-content">
                <div class="accordion-inner">
                  <p>Bruk Utekos sine faktiske leverings- og returvilkår her.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>

  <div class="sticky-mobile-actions" aria-label="Mobil kjøpsseksjon">
    <div class="sticky-mobile-inner">
      <div class="sticky-mobile-price">
        <span class="muted-note">Pris</span>
        <strong>Pris legges inn her</strong>
      </div>
      <button class="btn btn-primary" style="min-width: 180px;">Legg i handlekurv</button>
    </div>
  </div>

  <footer>
    <div class="container footer-grid">
      <div>Utekos · Produktsideprototype</div>
      <div>Luxury editorial · Kjøpsfokusert opplevelse</div>
    </div>
  </footer>

  <script>
    // Galleri
    const thumbs = document.querySelectorAll('.thumb');
    const mainImage = document.getElementById('mainProductImage');

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        thumbs.forEach((item) => {
          item.classList.remove('active');
          item.setAttribute('aria-selected', 'false');
        });
        thumb.classList.add('active');
        thumb.setAttribute('aria-selected', 'true');
        mainImage.src = thumb.dataset.large;
        mainImage.alt = thumb.querySelector('img').alt;
      });
    });

    // Størrelsesvalg
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        sizeButtons.forEach((btn) => {
          btn.classList.remove('active');
          btn.setAttribute('aria-checked', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-checked', 'true');
      });
    });

    // Antall
    const qtyValue = document.getElementById('qtyValue');
    const decreaseQty = document.getElementById('decreaseQty');
    const increaseQty = document.getElementById('increaseQty');
    let qty = 1;

    function renderQty() {
      qtyValue.textContent = qty;
    }

    decreaseQty.addEventListener('click', () => {
      if (qty > 1) {
        qty -= 1;
        renderQty();
      }
    });

    increaseQty.addEventListener('click', () => {
      qty += 1;
      renderQty();
    });

    // Accordion
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach((item) => {
      const trigger = item.querySelector('.accordion-trigger');
      const content = item.querySelector('.accordion-content');

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        item.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(!isOpen));

        if (!isOpen) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = 0;
        }
      });
    });

    // CTA demo
    const addToCartBtn = document.getElementById('addToCartBtn');
    addToCartBtn.addEventListener('click', () => {
      const activeSize = document.querySelector('.size-btn.active');
      const sizeText = activeSize ? activeSize.innerText.replace(/\s+/g, ' ').trim() : 'ingen størrelse valgt';
      addToCartBtn.textContent = 'Lagt i handlekurv';
      addToCartBtn.disabled = true;

      setTimeout(() => {
        addToCartBtn.textContent = 'Legg i handlekurv';
        addToCartBtn.disabled = false;
        console.log('Demo:', { qty, size: sizeText, product: 'Utekos Svale' });
      }, 1600);
    });
  </script>
</body>
</html>`;
