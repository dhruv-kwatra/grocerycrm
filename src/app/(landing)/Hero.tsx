"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, Play, Cpu, Zap, Award, ShoppingCart, Apple, Package, Sparkles } from "lucide-react";
import { CyberParticles } from "@/components/CyberParticles";
import { PillTabs } from "@/components/ui/PillTabs";

const PRODUCT_MODELS = [
  {
    id: "fresh-produce",
    label: "Fresh Produce Analytics",
    icon: Apple,
    badge: "AI-Powered",
    tagline: "Predictive expiry tracking · Daily demand forecasting · Minimum waste",
    securityBadge: "Temperature Monitoring Sync",
    syncBadge: "Real-time Farm to Store Tracking",
    awardBadge: "Sustainability Excellence",
  },
  {
    id: "fmcg-goods",
    label: "FMCG Inventory Tracking",
    icon: Package,
    badge: "Automated",
    tagline: "Automated Reordering · Supplier Delay Alerts · Stockout Risk Score",
    securityBadge: "Barcode Verification System",
    syncBadge: "Warehouse to Shelf Sync",
    awardBadge: "Operational Excellence",
  },
  {
    id: "checkout-optimization",
    label: "Smart Checkout Optimization",
    icon: ShoppingCart,
    badge: "Performance",
    tagline: "Basket Size Analysis · Customer Loyalty Integration · Peak Hour Predictions",
    securityBadge: "Fraud Detection Engine",
    syncBadge: "Sub-second Transaction Sync",
    awardBadge: "Customer Experience",
  },
];

// The three floating HUD cards share a shell; only their position, radius and
// contents differ.
const HUD = {
  panel: {
    position: "absolute" as const,
    background: "rgba(20, 26, 38, 0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    color: "#E2E8F0",
    fontWeight: 600,
    zIndex: 20,
  },
  icon: { width: 30, height: 30, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" },
  caption: { fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase" as const },
};

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const [activeModel, setActiveModel] = useState("x1carbon");
  const model = PRODUCT_MODELS.find((m) => m.id === activeModel) ?? PRODUCT_MODELS[0];

  // Calm 3D parallax on the product render, driven by pointer position.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, spring);
  const smoothY = useSpring(mouseY, spring);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const translateZ = useTransform(smoothY, [-0.5, 0.5], [15, -15]);

  const onMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      className="hero"
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1400, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", paddingTop: 80, paddingBottom: 40, background: "#0B0F17" }}
    >
      <CyberParticles count={40} />

      <div
        aria-hidden="true"
        style={{ position: "absolute", top: "25%", right: "18%", width: 550, height: 550, background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(30,58,138,0.03) 50%, transparent 70%)", filter: "blur(70px)", pointerEvents: "none", zIndex: 1 }}
      />

      <div className="container" style={{ position: "relative", zIndex: 10, width: "100%" }}>
        <div className="hero-content" style={{ maxWidth: 680 }}>
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hero-badge"
          >
            <span className="badge-pulse" />
            <ShieldCheck size={14} className="badge-icon" />
            <span className="hero-badge-text">RetailIQ Grocery Forecasting Platform</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="hero-title" style={{ fontSize: "4.6rem", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0.8rem 0 1.2rem 0" }}>
              <span className="text-gradient">Smart.</span>
              <br />
              <span className="text-gradient">Fresh.</span>
              <br />
              <span className="text-gradient-green">RetailIQ.</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="hero-pills-scroll-wrapper"
            style={{ marginBottom: "1.5rem" }}
          >
            <PillTabs tabs={PRODUCT_MODELS} activeTab={activeModel} onChange={setActiveModel} layoutId="heroProductPill" ariaLabel="Product model" />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeModel}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="hero-model-specs"
              style={{ marginBottom: "2.4rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#34D399", fontWeight: 600, fontSize: "0.88rem", marginBottom: 4 }}>
                <Sparkles size={15} />
                <span>
                  {model.label} — {model.badge} Edition
                </span>
              </div>
              <p style={{ fontSize: "1.15rem", color: "#94A3B8", fontWeight: 300, margin: 0 }}>{model.tagline}</p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="hero-actions"
            style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}
          >
            {/* A real <a>, not a button that pushes the router: the primary call
                to action on a public page has to be middle-clickable and
                crawlable. /login sends you on to /retail once signed in. */}
            <Link href="/login?switch=true" className="btn-premium" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <Play size={15} fill="#FFFFFF" style={{ color: "#FFFFFF" }} />
              <span>Live Demo Access</span>
              <ArrowRight size={17} />
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="hero-3d-container" style={{ position: "absolute", top: 0, right: 0, width: "55vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, pointerEvents: "none" }}>
        <div
          aria-hidden="true"
          style={{ position: "absolute", bottom: "20%", width: 460, height: 120, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.02) 60%, transparent 80%)", transform: "rotateX(70deg)", filter: "blur(20px)" }}
        />

        <motion.div
          style={{ rotateX, rotateY, z: translateZ, position: "relative", width: "100%", maxWidth: 720, pointerEvents: "auto" }}
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div animate={{ y: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} style={{ position: "relative" }}>
            {/* priority — this is the landing page's LCP element.
                mix-blend-mode:screen is kept from the prototype but cannot
                actually take effect here: the parallax and float wrappers are
                both transformed, and a transform opens a stacking context, so
                the image only ever blends against its own (empty) parent
                rather than the hero behind it. The source JPEG is opaque with
                a black field, so without help it lands as a hard rectangle.
                The radial mask is the prototype's own answer to that — it uses
                the identical treatment on the login photo. */}
            <Image
              src="/grocery_hero.png"
              alt="RetailIQ Platform"
              width={720}
              height={480}
              priority
              sizes="55vw"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                mixBlendMode: "screen",
                maskImage: "radial-gradient(circle at 50% 50%, black 60%, transparent 92%)",
                WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 60%, transparent 92%)",
                filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5))",
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div key={`${activeModel}-badges`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                <div className="mobile-hide-badge" style={{ ...HUD.panel, top: "12%", left: "-2%", borderRadius: 16, padding: "10px 16px", gap: 10, fontSize: "0.82rem" }}>
                  <div style={{ ...HUD.icon, background: "rgba(16,185,129,0.12)", color: "#34D399" }}>
                    <Cpu size={15} />
                  </div>
                  <div>
                    <div style={HUD.caption}>Security Engine</div>
                    <div style={{ color: "#FFFFFF" }}>{model.securityBadge}</div>
                  </div>
                </div>

                <div className="mobile-hide-badge" style={{ ...HUD.panel, bottom: "15%", right: "3%", borderRadius: 16, padding: "10px 16px", gap: 10, fontSize: "0.82rem" }}>
                  <div style={{ ...HUD.icon, background: "rgba(52,211,153,0.12)", color: "#34D399" }}>
                    <Zap size={15} />
                  </div>
                  <div>
                    <div style={HUD.caption}>Telemetry</div>
                    <div style={{ color: "#34D399" }}>{model.syncBadge}</div>
                  </div>
                </div>

                <div className="mobile-hide-badge" style={{ ...HUD.panel, top: "5%", right: "10%", borderRadius: 14, padding: "8px 14px", gap: 8, fontSize: "0.78rem" }}>
                  <Award size={15} style={{ color: "#60A5FA" }} />
                  <span>{model.awardBadge}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
