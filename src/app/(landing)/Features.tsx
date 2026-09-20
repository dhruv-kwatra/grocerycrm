"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { BarChart3, Shield, Zap, Database, ArrowUpRight, Sparkles } from "lucide-react";
import { PillTabs } from "@/components/ui/PillTabs";

const FEATURE_CATEGORIES = [
  { id: "all", label: "All Capabilities", icon: Sparkles },
  { id: "analytics", label: "Demand Forecasting", icon: BarChart3 },
  { id: "security", label: "Shelf & Expiry AI", icon: Shield },
  { id: "sync", label: "Smart Reorder Engine", icon: Zap },
  { id: "scale", label: "Grocery Chain Scale", icon: Database },
];

type Feature = {
  id: string;
  category: string;
  Icon: typeof BarChart3;
  title: string;
  description: string;
  tag: string;
  accent: string;
};

const FEATURES: Feature[] = [
  {
    id: "analytics-1",
    category: "analytics",
    Icon: BarChart3,
    title: "AI Demand Forecasting",
    description: "Harness historical sales & weather telemetry. Predict 7-day and 30-day demand spikes for milk, fruits, rice, and cold beverages with 94%+ accuracy.",
    tag: "Predictive Analytics",
    accent: "#34D399",
  },
  {
    id: "security-1",
    category: "security",
    Icon: Shield,
    title: "Fresh Expiry & Shelf AI",
    description: "Prevent perishable food waste. AI-driven shelf audits and automated expiration alerts flag near-expiry produce before loss occurs.",
    tag: "Zero Waste AI",
    accent: "#60A5FA",
  },
  {
    id: "sync-1",
    category: "sync",
    Icon: Zap,
    title: "Smart Reorder Engine",
    description: "Automated replenishment workflows. Instantly calculate optimal purchase quantities and send alerts for overstock or impending stockouts.",
    tag: "Auto-Replenish",
    accent: "#FBBF24",
  },
  {
    id: "scale-1",
    category: "scale",
    Icon: Database,
    title: "Multi-Store Grocery Scale",
    description: "Built for supermarket chains & dark stores. Seamlessly sync inventory from central regional warehouses to local retail supermarket counters.",
    tag: "Grocery Chain Scale",
    accent: "#C084FC",
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { damping: 25, stiffness: 140 };
  const rotateX = useTransform(useSpring(mouseY, spring), [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(useSpring(mouseX, spring), [-0.5, 0.5], [-5, 5]);

  const onMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const { Icon } = feature;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          background: "linear-gradient(145deg, rgba(20, 26, 38, 0.65) 0%, rgba(12, 16, 24, 0.85) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          borderRadius: 24,
          padding: "3rem 2.2rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.25)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
        whileHover={{ borderColor: "rgba(16, 185, 129, 0.25)", boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)" }}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.8rem" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: `${feature.accent}12`,
                border: `1px solid ${feature.accent}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: feature.accent,
              }}
            >
              <Icon size={28} strokeWidth={1.5} />
            </div>

            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                padding: "4px 12px",
                borderRadius: 20,
                background: `${feature.accent}12`,
                color: feature.accent,
                border: `1px solid ${feature.accent}20`,
              }}
            >
              {feature.tag}
            </span>
          </div>

          <h3 style={{ fontSize: "1.65rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.8rem", letterSpacing: "-0.02em" }}>{feature.title}</h3>
          <p style={{ color: "#94A3B8", fontSize: "1.02rem", lineHeight: 1.65, fontWeight: 300 }}>{feature.description}</p>
        </div>

        {/* Presentational in the prototype — it had nowhere to go. Kept as
            plain text rather than dressed up as a link, so nobody clicks a
            cursor:pointer that does nothing. */}
        <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: 6, fontSize: "0.88rem", color: feature.accent, fontWeight: 600 }}>
          <span>Explore Capability</span>
          <ArrowUpRight size={15} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Features() {
  const [activeCategory, setActiveCategory] = useState("all");
  const shown = activeCategory === "all" ? FEATURES : FEATURES.filter((f) => f.category === activeCategory);

  return (
    <section className="features-section" style={{ background: "#0B0F17", padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div className="container" style={{ position: "relative", zIndex: 10 }}>
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              padding: "4px 14px",
              borderRadius: 20,
              fontSize: "0.78rem",
              color: "#34D399",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "1rem",
            }}
          >
            <Sparkles size={14} />
            <span>Architecture Capabilities</span>
          </div>

          <h2 className="section-title" style={{ fontSize: "3.8rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: "0.8rem" }}>
            Uncompromising <span className="text-gradient-green">Performance.</span>
          </h2>

          <p className="section-subtitle" style={{ fontSize: "1.2rem", color: "#94A3B8", fontWeight: 300, maxWidth: 600, margin: "0 auto 2.2rem auto" }}>
            Every feature meticulously engineered to elevate your retail operations. Serene, powerful, and reliable.
          </p>

          <div className="hero-pills-scroll-wrapper" style={{ display: "flex", justifyContent: "center" }}>
            <PillTabs tabs={FEATURE_CATEGORIES} activeTab={activeCategory} onChange={setActiveCategory} layoutId="featureCategoryPill" ariaLabel="Capability category" />
          </div>
        </motion.div>

        <motion.div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem" }}>
          <AnimatePresence mode="popLayout">
            {shown.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
