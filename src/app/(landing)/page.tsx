import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Hero } from "./Hero";
import { Features } from "./Features";
import "./landing-new.css";

export const metadata: Metadata = {
  title: "RetailIQ — Grocery Inventory & Forecasting Platform",
  description:
    "Store-floor operations for grocery chains: shelf compliance, inventory forecasting, and real-time demand insights.",
};

// Public landing, replicating the newui prototype: a fixed glass navbar, the
// product hero, the capability grid, and a footer. The prototype's pitch-deck
// sections (Research / Scope / Impact / Integrations / Demo / Closing) are not
// part of that design and were removed with it.
//
// Everything is wrapped in .rlp-new because the ported stylesheet uses generic
// names — .container, .hero, .section-title — that would otherwise reach into
// the retail app rendered from the same document.
export default function RetailCrmLanding() {
  return (
    <div className="rlp-new">
      <nav className="navbar">
        <div className="container navbar-container">
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="logo" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#16A34A",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  boxShadow: "0 0 15px rgba(22,163,74,0.5)",
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                R
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1 }}>
                <span style={{ color: "#FFFFFF" }}>Retail</span>
                <span className="logo-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.5)", display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: "#10B981" }}>IQ</span>
              </span>
            </div>
          </Link>

          <Link
            href="/login?switch=true"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, #10B981 0%, #15803D 100%)",
              color: "#FFFFFF",
              border: "none",
              padding: "8px 18px",
              borderRadius: 20,
              fontSize: "0.88rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
              transition: "all 0.25s ease",
            }}
          >
            <Lock size={15} />
            <span>Login</span>
          </Link>
        </div>
      </nav>

      <main>
        <Hero />
        <Features />
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2rem 0", textAlign: "center", color: "#555", marginTop: "4rem" }}>
          {/* Rendered on the server, so the year comes from the server clock and
              can't hydrate-mismatch against a client in another timezone. */}
          <p>&copy; {new Date().getFullYear()} RetailIQ. Concept designed for Hackathon.</p>
        </footer>
      </main>
    </div>
  );
}
