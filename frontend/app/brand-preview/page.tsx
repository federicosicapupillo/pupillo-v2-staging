import React from 'react'

export default function BrandPreviewPage() {
  return (
    <>
      <style>{`
        /* Reset and Base Styles */
        html, body {
          background-color: #000000 !important;
          color: #ffffff !important;
          margin: 0;
          padding: 0;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
          scroll-behavior: smooth;
        }

        *, *::before, *::after {
          box-sizing: inherit;
        }

        /* Utility classes */
        .min-h-screen {
          min-height: 100vh;
        }

        .bg-black {
          background-color: #000000;
        }

        .text-white {
          color: #ffffff;
        }

        .max-w-7xl {
          max-width: 80rem;
          margin-left: auto;
          margin-right: auto;
        }

        .max-w-4xl {
          max-width: 56rem;
          margin-left: auto;
          margin-right: auto;
        }

        .px-4 {
          padding-left: 1rem;
        }

        .px-6 {
          padding-left: 1.5rem;
        }

        .px-8 {
          padding-right: 2rem;
          padding-left: 2rem;
        }

        .py-4 {
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .py-12 {
          padding-top: 3rem;
          padding-bottom: 3rem;
        }

        .py-16 {
          padding-top: 4rem;
          padding-bottom: 4rem;
        }

        .py-20 {
          padding-top: 5rem;
          padding-bottom: 5rem;
        }

        .pb-12 {
          padding-bottom: 3rem;
        }

        .mb-2 {
          margin-bottom: 0.5rem;
        }

        .mb-3 {
          margin-bottom: 0.75rem;
        }

        .mb-4 {
          margin-bottom: 1rem;
        }

        .mb-6 {
          margin-bottom: 1.5rem;
        }

        .mb-8 {
          margin-bottom: 2rem;
        }

        .mt-1 {
          margin-top: 0.25rem;
        }

        .mt-4 {
          margin-top: 1rem;
        }

        .mt-6 {
          margin-top: 1.5rem;
        }

        .pt-4 {
          padding-top: 1rem;
        }

        .pt-6 {
          padding-top: 1.5rem;
        }

        .border-t {
          border-top: 2px solid #1f2937;
        }

        /* Stylized Text Logo */
        .text-logo-brand {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          text-transform: uppercase;
          color: #eab308;
          background-color: #000000;
          border: 4px solid #ffffff;
          padding: 0.35rem 1.25rem;
          border-radius: 16px;
          box-shadow: 4px 4px 0px #7c3aed;
          display: inline-block;
          user-select: none;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        @media (min-width: 768px) {
          .text-logo-brand {
            font-size: 3rem;
            padding: 0.5rem 2rem;
            border-radius: 24px;
            box-shadow: 6px 6px 0px #7c3aed;
          }
        }

        .text-logo-brand:hover {
          transform: scale(1.03) rotate(-1deg);
          box-shadow: 8px 8px 0px #7c3aed;
        }

        .text-logo-small {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          text-transform: uppercase;
          color: #eab308;
          background-color: #000000;
          border: 3px solid #ffffff;
          padding: 0.2rem 0.75rem;
          border-radius: 10px;
          box-shadow: 3px 3px 0px #7c3aed;
          display: inline-block;
          user-select: none;
          text-decoration: none;
          transition: transform 0.2s ease;
        }

        .text-logo-small:hover {
          transform: scale(1.05);
        }

        /* Custom Header Styling */
        .brand-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: #000000;
          border-bottom: 6px solid #ffffff;
          padding: 1rem 1.5rem;
        }

        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 80rem;
          margin: 0 auto;
        }

        .logo-nav {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .badge-mvp {
          padding: 0.25rem 0.75rem;
          font-size: 0.65rem;
          font-weight: 900;
          border-radius: 8px;
          background-color: #7c3aed;
          border: 2px solid #ffffff;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 2px 2px 0px #ffffff;
          display: inline-block;
        }

        .desktop-nav {
          display: none;
          align-items: center;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .desktop-nav {
            display: flex;
          }
        }

        .nav-link {
          color: #ffffff;
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #eab308;
        }

        /* Hero styling */
        .hero-section {
          text-align: center;
          position: relative;
          padding: 3rem 1rem;
        }

        @media (min-width: 768px) {
          .hero-section {
            padding: 5rem 2rem;
          }
        }

        .hero-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 2.5rem;
        }

        .hero-title {
          font-size: 2.25rem; /* 36px */
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: #ffffff;
          margin: 0 0 1.5rem 0;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 4.5rem; /* 72px */
          }
        }

        .highlight-badge {
          display: inline-block;
          background-color: #eab308;
          border: 4px solid #ffffff;
          color: #000000;
          padding: 0.5rem 1.5rem;
          border-radius: 20px;
          transform: rotate(-1.5deg);
          margin-top: 0.75rem;
          box-shadow: 4px 4px 0px #7c3aed;
          font-size: 1.75rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        @media (min-width: 768px) {
          .highlight-badge {
            border: 6px solid #ffffff;
            font-size: 3.5rem;
            padding: 0.5rem 2rem;
            border-radius: 28px;
            box-shadow: 6px 6px 0px #7c3aed;
          }
        }

        .hero-subtitle {
          margin-top: 2.5rem;
          font-size: 1rem;
          font-weight: bold;
          color: #cbd5e1;
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        @media (min-width: 768px) {
          .hero-subtitle {
            font-size: 1.25rem;
          }
        }

        /* Buttons styling */
        .cta-container {
          margin-top: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          max-width: 28rem;
          margin-left: auto;
          margin-right: auto;
        }

        @media (min-width: 640px) {
          .cta-container {
            flex-direction: row;
            max-width: 100%;
          }
        }

        .pupillo-btn-yellow {
          background-color: #eab308;
          color: #000000;
          border: 4px solid #ffffff;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 16px;
          padding: 1rem 2rem;
          font-size: 0.875rem;
          text-align: center;
          text-decoration: none;
          box-shadow: 4px 4px 0px #7c3aed;
          transition: all 0.1s ease;
          cursor: pointer;
          width: 100%;
        }

        @media (min-width: 640px) {
          .pupillo-btn-yellow {
            width: auto;
          }
        }

        .pupillo-btn-yellow:hover {
          background-color: #facc15;
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #7c3aed;
        }

        .pupillo-btn-yellow:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px #7c3aed;
        }

        .pupillo-btn-purple {
          background-color: #7c3aed;
          color: #ffffff;
          border: 4px solid #ffffff;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 16px;
          padding: 1rem 2rem;
          font-size: 0.875rem;
          text-align: center;
          text-decoration: none;
          box-shadow: 4px 4px 0px #eab308;
          transition: all 0.1s ease;
          cursor: pointer;
          width: 100%;
        }

        @media (min-width: 640px) {
          .pupillo-btn-purple {
            width: auto;
          }
        }

        .pupillo-btn-purple:hover {
          background-color: #8b5cf6;
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #eab308;
        }

        .pupillo-btn-purple:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px #eab308;
        }

        /* Neobrutalist Cards */
        .section-title-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          border-bottom: 4px solid rgba(255,255,255,0.1);
          padding-bottom: 1rem;
          margin-bottom: 2.5rem;
        }

        .section-label {
          color: #eab308;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-top: 0.25rem;
          margin-bottom: 0;
          letter-spacing: -0.01em;
        }

        @media (min-width: 768px) {
          .section-title {
            font-size: 2.5rem;
          }
        }

        .pupillo-card-purple {
          background-color: #09090b;
          border: 6px solid #ffffff;
          box-shadow: 8px 8px 0px #7c3aed;
          border-radius: 32px;
          padding: 2rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .pupillo-card-purple:hover {
          transform: scale(1.01);
          box-shadow: 10px 10px 0px #7c3aed;
        }

        .pupillo-card-yellow {
          background-color: #09090b;
          border: 6px solid #ffffff;
          box-shadow: 8px 8px 0px #eab308;
          border-radius: 32px;
          padding: 2rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .pupillo-card-yellow:hover {
          transform: scale(1.01);
          box-shadow: 10px 10px 0px #eab308;
        }

        .pupillo-card-white {
          background-color: #09090b;
          border: 6px solid #ffffff;
          box-shadow: 8px 8px 0px #ffffff;
          border-radius: 32px;
          padding: 2rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .pupillo-card-white:hover {
          transform: scale(1.01);
          box-shadow: 10px 10px 0px #ffffff;
        }

        /* Badges */
        .pupillo-badge-purple {
          padding: 0.35rem 0.75rem;
          font-size: 0.65rem;
          font-weight: 900;
          border-radius: 8px;
          background-color: #7c3aed;
          border: 2px solid #ffffff;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 2px 2px 0px #ffffff;
          display: inline-block;
        }

        .pupillo-badge-yellow {
          padding: 0.35rem 0.75rem;
          font-size: 0.65rem;
          font-weight: 900;
          border-radius: 8px;
          background-color: #eab308;
          border: 2px solid #ffffff;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 2px 2px 0px #7c3aed;
          display: inline-block;
        }

        /* Layout Grid */
        .grid-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .space-y-24 > * + * {
          margin-top: 6rem;
        }

        /* Shift Card Details */
        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .shift-rate {
          font-size: 0.875rem;
          font-weight: 900;
          color: #eab308;
          background-color: #000000;
          padding: 0.25rem 0.65rem;
          border-radius: 8px;
          border: 2px solid #ffffff;
          transform: rotate(2deg);
          box-shadow: 2px 2px 0px #ffffff;
        }

        .shift-title {
          font-size: 1.25rem;
          font-weight: 900;
          text-transform: uppercase;
          margin: 0;
          color: #ffffff;
        }

        .shift-meta {
          font-size: 0.65rem;
          color: #9ca3af;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.25rem;
        }

        .shift-info-box {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 12px;
          background-color: #000000;
          border: 2px solid #1f2937;
          font-size: 0.7rem;
          font-weight: bold;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
        }

        .info-label {
          color: #64748b;
        }

        .shift-notes {
          font-size: 0.65rem;
          color: #94a3b8;
          font-style: italic;
          margin-top: 1rem;
          border-left: 2px solid #eab308;
          padding-left: 0.5rem;
          line-height: 1.4;
        }

        .card-btn {
          margin-top: 1.5rem;
          width: 100%;
          padding: 0.75rem;
          background-color: #eab308;
          color: #000000;
          border: 2px solid #ffffff;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.75rem;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 3px 3px 0px #7c3aed;
          transition: all 0.1s ease;
          text-align: center;
          display: block;
          text-decoration: none;
        }

        .card-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0px #7c3aed;
        }

        .card-btn:active {
          transform: translate(1px, 1px);
          box-shadow: 2px 2px 0px #7c3aed;
        }

        /* Come Funziona - Step styling */
        .step-number {
          font-size: 2.5rem;
          font-weight: 900;
          color: #eab308;
          line-height: 1;
        }

        .step-title {
          font-size: 1.25rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
        }

        .step-desc {
          font-size: 0.8rem;
          color: #cbd5e1;
          line-height: 1.6;
          font-weight: bold;
          margin: 0;
        }

        .step-badge {
          margin-top: 1.5rem;
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #eab308;
        }

        .step-badge-purple {
          color: #a78bfa;
        }

        .step-badge-white {
          color: #ffffff;
        }

        /* Reputazione Section */
        .trust-banner {
          border: 4px dashed #ffffff;
          border-radius: 32px;
          padding: 2.5rem 1.5rem;
          background-color: #09090b;
          text-align: center;
          max-width: 56rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .trust-banner {
            padding: 4rem;
          }
        }

        .trust-title {
          font-size: 1.75rem;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.1;
          margin-bottom: 1rem;
        }

        @media (min-width: 768px) {
          .trust-title {
            font-size: 3rem;
          }
        }

        .trust-desc {
          font-size: 0.8rem;
          color: #e2e8f0;
          max-width: 40rem;
          margin: 0 auto 2.5rem auto;
          line-height: 1.6;
          font-weight: bold;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-box {
          background-color: #000000;
          border: 2px solid rgba(255,255,255,0.1);
          padding: 1.25rem;
          border-radius: 16px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: #eab308;
        }

        @media (min-width: 768px) {
          .stat-value {
            font-size: 2.25rem;
          }
        }

        .stat-label {
          font-size: 0.55rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #94a3b8;
          margin-top: 0.25rem;
          letter-spacing: 0.05em;
        }

        .color-violet {
          color: #a78bfa;
        }

        /* Footer styling */
        .brand-footer {
          margin-top: 6rem;
          border-top: 6px solid #ffffff;
          background-color: #000000;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .footer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          max-width: 80rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .footer-container {
            flex-direction: row;
          }
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-logo-text {
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #cbd5e1;
        }

        .footer-copy {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0;
        }

        .footer-links {
          display: flex;
          gap: 1.5rem;
        }

        .footer-link {
          color: #64748b;
          text-decoration: none;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #ffffff;
        }

        /* Interactive micro-animations */
        .rotate-stars {
          position: absolute;
          font-weight: 900;
          font-size: 10rem;
          color: rgba(234, 179, 8, 0.04);
          user-select: none;
          pointer-events: none;
          display: none;
        }

        @media (min-width: 1024px) {
          .rotate-stars {
            display: block;
          }
        }

        .star-left {
          top: 300px;
          left: 2rem;
          transform: rotate(15deg);
        }

        .star-right {
          top: 700px;
          right: 2rem;
          transform: rotate(-15deg);
        }

      `}</style>

      <div className="min-h-screen bg-black text-white pb-12">
        
        {/* Floating Decorative Stars */}
        <div className="rotate-stars star-left">★</div>
        <div className="rotate-stars star-right">★</div>

        {/* Header / Navbar */}
        <header className="brand-header">
          <div className="header-container">
            <div className="logo-nav">
              <span className="text-logo-small">
                PUPILLO
              </span>
              <span className="badge-mvp">
                MVP Baseline
              </span>
            </div>

            <nav className="desktop-nav">
              <a href="#shifts" className="nav-link">Turni Extra</a>
              <a href="#how-it-works" className="nav-link">Come Funziona</a>
              <a href="#trust" className="nav-link">Fiducia</a>
            </nav>

            <div>
              <span className="pupillo-btn-yellow" style={{ fontSize: '0.65rem', padding: '0.6rem 1.2rem', borderRadius: '10px', borderWidth: '2px', boxShadow: '2px 2px 0px #7c3aed' }}>
                Preview Mode
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
          
          {/* Section 1: Hero Section */}
          <section className="hero-section">
            <div className="hero-logo-container">
              <span className="text-logo-brand">
                PUPILLO
              </span>
            </div>

            <h1 className="hero-title">
              Extra staff per il food,<br />
              <span className="highlight-badge">
                quando ti serve davvero
              </span>
            </h1>

            <p className="hero-subtitle">
              Pupillo connette ristoratori e lavoratori extra in modo rapido, affidabile e smart.
            </p>

            <div className="cta-container">
              <a href="#how-it-works" className="pupillo-btn-purple">
                Sono un Ristoratore 🍽️
              </a>
              <a href="#shifts" className="pupillo-btn-yellow">
                Cerco Turni Extra 🏃‍♂️
              </a>
            </div>
          </section>

          {/* Section 2: Three Card Demo */}
          <section id="shifts" style={{ scrollMarginTop: '6rem' }}>
            <div className="section-title-container">
              <span className="section-label">🔥 Occasioni Calde</span>
              <h2 className="section-title">Turni Disponibili in Demo</h2>
            </div>

            <div className="grid-3">
              
              {/* Card 1: Cameriere Extra */}
              <div className="pupillo-card-purple">
                <div>
                  <div className="card-header-row">
                    <span className="pupillo-badge-yellow">Cameriere Sala</span>
                    <span className="shift-rate">14.00 €/h</span>
                  </div>
                  <h3 className="shift-title">Bistrot Duomo</h3>
                  <div className="shift-meta">📍 Milano Centro</div>
                  
                  <div className="shift-info-box">
                    <div className="info-row">
                      <span className="info-label">DATA:</span>
                      <span>Venerdì, 5 Giugno</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">ORARIO:</span>
                      <span>18:00 - 00:00</span>
                    </div>
                  </div>

                  <p className="shift-notes">
                    "Richiesta camicia nera, pantalone scuro ed esperienza pregressa in servizi veloci."
                  </p>
                </div>
                <button className="card-btn">Candidati Ora 🏃‍♂️</button>
              </div>

              {/* Card 2: Aiuto Cucina */}
              <div className="pupillo-card-white">
                <div>
                  <div className="card-header-row">
                    <span className="pupillo-badge-purple">Aiuto Cucina</span>
                    <span className="shift-rate">15.50 €/h</span>
                  </div>
                  <h3 className="shift-title">Trattoria da Nando</h3>
                  <div className="shift-meta">📍 Roma Trastevere</div>
                  
                  <div className="shift-info-box">
                    <div className="info-row">
                      <span className="info-label">DATA:</span>
                      <span>Sabato, 6 Giugno</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">ORARIO:</span>
                      <span>17:00 - 23:30</span>
                    </div>
                  </div>

                  <p className="shift-notes">
                    "Supporto alle comande e lavaggio stoviglie. Attestato HACCP valido richiesto."
                  </p>
                </div>
                <button className="card-btn">Candidati Ora 🏃‍♂️</button>
              </div>

              {/* Card 3: Bartender */}
              <div className="pupillo-card-yellow">
                <div>
                  <div className="card-header-row">
                    <span className="pupillo-badge-yellow">Bartender</span>
                    <span className="shift-rate">18.00 €/h</span>
                  </div>
                  <h3 className="shift-title">Skyline Terrace Bar</h3>
                  <div className="shift-meta">📍 Firenze Centro</div>
                  
                  <div className="shift-info-box">
                    <div className="info-row">
                      <span className="info-label">DATA:</span>
                      <span>Sabato, 6 Giugno</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">ORARIO:</span>
                      <span>21:00 - 03:00</span>
                    </div>
                  </div>

                  <p className="shift-notes">
                    "Mixology e gestione del servizio bancone per serata ad alto afflusso. Divisa fornita."
                  </p>
                </div>
                <button className="card-btn">Candidati Ora 🏃‍♂️</button>
              </div>

            </div>
          </section>

          {/* Section 3: Come Funziona */}
          <section id="how-it-works" style={{ scrollMarginTop: '6rem' }}>
            <div className="section-title-container">
              <span className="section-label">🚀 Flusso Semplice</span>
              <h2 className="section-title">Come Funziona</h2>
            </div>

            <div className="grid-3">
              
              {/* Step 1 */}
              <div className="pupillo-card-purple">
                <div>
                  <div className="step-number">01</div>
                  <h3 className="step-title">Pubblica il turno</h3>
                  <p className="step-desc">
                    Il ristoratore compila i dettagli del turno extra (tariffa, orario, mansione) e lo pubblica istantaneamente in bacheca.
                  </p>
                </div>
                <div className="step-badge">★ Inserimento in 60s</div>
              </div>

              {/* Step 2 */}
              <div className="pupillo-card-white">
                <div>
                  <div className="step-number" style={{ color: '#a78bfa' }}>02</div>
                  <h3 className="step-title">Ricevi candidature</h3>
                  <p className="step-desc">
                    I lavoratori extra idonei e geolocalizzati ricevono la notifica e si candidano rapidamente con un singolo tocco.
                  </p>
                </div>
                <div className="step-badge step-badge-purple">★ Screening immediato</div>
              </div>

              {/* Step 3 */}
              <div className="pupillo-card-yellow">
                <div>
                  <div className="step-number" style={{ color: '#ffffff' }}>03</div>
                  <h3 className="step-title">Conferma</h3>
                  <p className="step-desc">
                    Valuta i rating e l'affidabilità storica del lavoratore, conferma il match e sblocca la chat diretta per organizzare i dettagli.
                  </p>
                </div>
                <div className="step-badge step-badge-white">★ Chat interna sicura</div>
              </div>

            </div>
          </section>

          {/* Section 4: Reputazione / Fiducia */}
          <section id="trust" style={{ scrollMarginTop: '6rem' }}>
            <div className="trust-banner">
              <span className="section-label" style={{ marginBottom: '1rem', display: 'block' }}>🛡️ Sistema Sicuro</span>
              <h2 className="trust-title">Fiducia e Reputazione</h2>
              <p className="trust-desc">
                Pupillo si basa su una community certificata. Dopo ogni turno svolto, ristoratore e lavoratore si scambiano feedback a specchio per garantire standard operativi d'eccellenza.
              </p>

              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-value">99%</div>
                  <div className="stat-label">Affidabilità</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value color-violet">98%</div>
                  <div className="stat-label">Puntualità</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">4.9</div>
                  <div className="stat-label">Recensioni Medie</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value color-violet">100%</div>
                  <div className="stat-label">Utenti Certificati</div>
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="brand-footer">
          <div className="footer-container">
            <div className="footer-brand">
              <span className="footer-logo-text">PUPILLO PLATFORM</span>
            </div>
            
            <p className="footer-copy">
              © {new Date().getFullYear()} PUPILLO PLATFORM. TUTTI I DIRITTI RISERVATI.
            </p>

            <div className="footer-links">
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Termini di Servizio</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
