"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  LockKeyhole,
  Cpu,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  UserPlus,
  Zap,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { CyberParticles } from "@/components/CyberParticles";
import { DEFAULT_DUMMY_USERS, type DummyUser } from "@/lib/auth/dummy-users";
import "./login.css";

const BADGE = {
  position: "absolute" as const,
  background: "rgba(20, 26, 38, 0.85)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: 14,
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  color: "#E2E8F0",
  fontSize: "0.82rem",
  fontWeight: 600,
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/retail";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Dummy Accounts state
  const [dummyList, setDummyList] = useState<DummyUser[]>(DEFAULT_DUMMY_USERS);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Dummy User Form
  const [newDummyName, setNewDummyName] = useState("");
  const [newDummyEmail, setNewDummyEmail] = useState("");
  const [newDummyRole, setNewDummyRole] = useState<DummyUser["role"]>("brand");
  const [newDummyPw, setNewDummyPw] = useState("password123");
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/dummy-user")
      .then((res) => res.json())
      .then((data) => {
        if (data?.users && Array.isArray(data.users)) {
          setDummyList(data.users);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLoginWithCredentials(userEmail: string, userPw: string) {
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email: userEmail, password: userPw, redirect: false });
    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleLoginWithCredentials(email, password);
  }

  function handleQuickLogin(dummy: DummyUser) {
    const pw = dummy.password || "admin123";
    setEmail(dummy.email);
    setPassword(pw);
    handleLoginWithCredentials(dummy.email, pw);
  }

  async function handleCreateDummySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDummyName || !newDummyEmail) return;
    setCreatingUser(true);
    try {
      const res = await fetch("/api/auth/dummy-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newDummyName,
          email: newDummyEmail,
          role: newDummyRole,
          password: newDummyPw,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCreatedSuccess(true);
        setDummyList((prev) => [...prev, data.user]);
        setTimeout(() => {
          setCreateModalOpen(false);
          setCreatedSuccess(false);
          setEmail(data.user.email);
          setPassword(data.user.password || "password123");
          handleLoginWithCredentials(data.user.email, data.user.password || "password123");
        }, 800);
      } else {
        setError(data.error || "Failed to create dummy ID");
      }
    } catch {
      setError("Network error creating dummy ID");
    } finally {
      setCreatingUser(false);
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "5px 14px", borderRadius: 20, fontSize: "0.78rem", color: "#34D399", fontWeight: 600, marginBottom: "0.75rem" }}>
          <ShieldCheck size={14} />
          <span>RetailIQ Grocery Ops Portal</span>
        </div>

        <h1 className="login-title" style={{ fontSize: "2.3rem", fontWeight: 800, color: "#FFFFFF", margin: 0, letterSpacing: "-0.02em" }}>Welcome to RetailIQ</h1>
        <p className="login-subtitle" style={{ color: "#94A3B8", fontSize: "0.88rem", margin: "0.3rem 0 1.2rem 0", fontWeight: 300 }}>
          Sign in to access grocery inventory forecasting, smart reordering & store telemetry.
        </p>
      </motion.div>

      {/* Quick Demo Login Chips Section */}
      <motion.div className="dummy-accounts-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="dummy-header">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#34D399]">
            <Zap size={14} className="text-[#34D399] animate-pulse" />
            <span>1-Click Grocery Store Role Sign-in</span>
          </div>
          <button
            type="button"
            className="dummy-create-btn"
            onClick={() => setCreateModalOpen(true)}
            title="Create a custom dummy ID"
          >
            <UserPlus size={13} />
            <span>+ Create Dummy ID</span>
          </button>
        </div>

        <div className="dummy-chips-grid">
          {dummyList.map((dummy) => (
            <button
              key={dummy.id}
              type="button"
              className="dummy-chip"
              disabled={loading}
              onClick={() => handleQuickLogin(dummy)}
            >
              <span className="dummy-chip-name">{dummy.name.split(" ")[0]}</span>
              <span className="dummy-chip-role">{dummy.roleLabel || dummy.role}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <form className="login-form" onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <motion.div className="input-group" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}>
          <div className="input-wrapper">
            <Mail size={17} className={`input-icon ${emailFocus ? "active" : ""}`} style={{ color: emailFocus ? "#34D399" : "#64748B" }} />
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              required
            />
            <label htmlFor="email" className={emailFocus || email ? "floating-label active" : "floating-label"}>RetailIQ Staff Email / Role ID</label>
          </div>
        </motion.div>

        <motion.div className="input-group" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}>
          <div className="input-wrapper">
            <Lock size={17} className={`input-icon ${passwordFocus ? "active" : ""}`} style={{ color: passwordFocus ? "#34D399" : "#64748B" }} />
            <input
              id="password"
              type={showPw ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock") ?? false)}
              style={{ paddingRight: 46 }}
              required
            />
            <label htmlFor="password" className={passwordFocus || password ? "floating-label active" : "floating-label"}>Password</label>
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex", padding: 4, zIndex: 2 }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {capsOn && (
            <p style={{ display: "flex", alignItems: "center", gap: 6, color: "#FBBF24", fontSize: "0.76rem", marginTop: 8 }}>
              <AlertCircle size={13} /> Caps Lock is on
            </p>
          )}
        </motion.div>

        <motion.div className="login-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.6 }}>
          <label className="checkbox-container">
            <input type="checkbox" defaultChecked /> Remember session
          </label>
          <button type="button" className="forgot-link" onClick={() => setForgotOpen((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            Forgot Password?
          </button>
        </motion.div>

        {forgotOpen && (
          <p style={{ color: "#94A3B8", fontSize: "0.8rem", marginTop: -4, marginBottom: 4 }}>
            Retail accounts are provisioned by your administrator — or click any Quick Login dummy ID above.
          </p>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.28)", color: "#34D399", borderRadius: 12, padding: "10px 14px", fontSize: "0.84rem", fontWeight: 500 }}
          >
            <AlertCircle size={15} /> {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          className="btn-primary login-submit"
          disabled={loading}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={loading ? undefined : { scale: 1.02 }}
          whileTap={loading ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "linear-gradient(135deg, #10B981 0%, #15803D 100%)",
            padding: 15,
            borderRadius: 16,
            fontWeight: 600,
            fontSize: "1.02rem",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight size={17} />
            </>
          )}
        </motion.button>
      </form>

      {/* Modal for Creating Custom Dummy ID */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="dummy-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
            <motion.div
              className="dummy-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="dummy-modal-header">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-red-400" size={18} />
                  <h3>Create Custom Dummy ID</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="dummy-modal-close"
                >
                  <X size={18} />
                </button>
              </div>

              {createdSuccess ? (
                <div className="p-6 text-center space-y-3">
                  <CheckCircle2 size={42} className="text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-white font-bold text-lg">Dummy ID Created Successfully!</p>
                  <p className="text-sm text-slate-400">Signing you in automatically…</p>
                </div>
              ) : (
                <form onSubmit={handleCreateDummySubmit} className="space-y-4">
                  <div>
                    <label className="dummy-label">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newDummyName}
                      onChange={(e) => setNewDummyName(e.target.value)}
                      className="dummy-input"
                    />
                  </div>

                  <div>
                    <label className="dummy-label">Email / Dummy Identifier</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john.doe@retailiq.com"
                      value={newDummyEmail}
                      onChange={(e) => setNewDummyEmail(e.target.value)}
                      className="dummy-input"
                    />
                  </div>

                  <div>
                    <label className="dummy-label">Assigned Grocery Role</label>
                    <select
                      value={newDummyRole}
                      onChange={(e) => setNewDummyRole(e.target.value as DummyUser["role"])}
                      className="dummy-select"
                    >
                      <option value="superadmin">🛡️ Platform Staff (Admin)</option>
                      <option value="brand">🏢 Brand (Brand Admin)</option>
                      <option value="distributor">🚚 Distributor (Supply Chain)</option>
                      <option value="partner">🤝 Partner (Franchise Owner)</option>
                      <option value="store_manager">🏬 Store Manager (Store Lead)</option>
                      <option value="store_associate">📋 Store Associate (Frontline)</option>
                    </select>
                  </div>

                  <div>
                    <label className="dummy-label">Password (Default)</label>
                    <input
                      type="text"
                      value={newDummyPw}
                      onChange={(e) => setNewDummyPw(e.target.value)}
                      className="dummy-input"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      className="dummy-modal-cancel"
                      onClick={() => setCreateModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingUser}
                      className="dummy-modal-submit"
                    >
                      {creatingUser ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Creating…</span>
                        </>
                      ) : (
                        <span>Create & Sign In Now</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { damping: 25, stiffness: 120 };
  const rotateX = useTransform(useSpring(mouseY, spring), [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(useSpring(mouseX, spring), [-0.5, 0.5], [-8, 8]);

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
    <div
      className="login-page"
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", paddingTop: 30, background: "#0B0F17" }}
    >
      <CyberParticles count={35} color="rgba(16, 185, 129, 0.35)" />

      <div
        aria-hidden="true"
        style={{ position: "absolute", top: "25%", left: "10%", width: 450, height: 450, background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }}
      />

      <div className="login-form-container" style={{ position: "relative", zIndex: 10 }}>
        <motion.div
          className="login-glass-panel"
          initial={{ opacity: 0, x: -40, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "linear-gradient(135deg, rgba(20, 26, 38, 0.75) 0%, rgba(12, 16, 24, 0.9) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
            maxWidth: 520,
          }}
        >
          <Suspense fallback={<div style={{ minHeight: 420 }} />}>
            <LoginForm />
          </Suspense>
        </motion.div>
      </div>

      <div className="login-3d-container" style={{ flex: 1.2, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, background: "#0B0F17" }}>
        <div className="overlay-gradient" style={{ background: "linear-gradient(90deg, #0B0F17 0%, transparent 20%)" }} />

        <motion.div
          style={{ rotateX, rotateY, z: 100, width: "85%", maxWidth: 650, position: "relative" }}
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} style={{ position: "relative" }}>
            <Image
              src="/grocery_cart_login.png"
              alt="Fresh Grocery Store Produce"
              width={650}
              height={450}
              priority
              sizes="55vw"
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 24,
                objectFit: "cover",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
              }}
            />

            <div style={{ ...BADGE, top: "15%", left: "-5%" }}>
              <LockKeyhole size={16} style={{ color: "#34D399" }} />
              <div>
                <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>SMART BASKET AI</div>
                <div>Real-Time Basket Telemetry</div>
              </div>
            </div>

            <div style={{ ...BADGE, bottom: "15%", right: "-5%" }}>
              <Cpu size={16} style={{ color: "#60A5FA" }} />
              <div>
                <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>RETAILIQ AUTH</div>
                <div>Encrypted Staff Portal</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
