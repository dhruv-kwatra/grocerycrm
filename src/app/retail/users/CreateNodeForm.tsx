"use client";

import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { createNode } from "./actions";

type Parent = { id: number; name: string; nodeType: string; path: string; childTypes: string[] };

const TYPE_LABEL: Record<string, string> = {
  distributor: "Distributor company",
  partner: "Partner / franchisee",
  store: "Store",
};

// Field descriptor: [name, label, required?, type?]
type F = [string, string, boolean?, ("text" | "email" | "tel" | "number" | "date")?];

// Per-type onboarding field sets (mandatory vs optional) from the onboarding
// requirements doc. The node name is captured separately (below).
const FIELDS: Record<string, { required: F[]; optional: F[] }> = {
  distributor: {
    required: [
      ["companyName", "Company / firm name", true], ["gstin", "GSTIN", true], ["pan", "Company PAN", true],
      ["address", "Registered address", true], ["pincode", "Pincode", true],
      ["contactName", "Primary contact name", true], ["contactMobile", "Contact mobile", true, "tel"], ["contactEmail", "Contact email", true, "email"],
      ["bankAccountNo", "Bank account no.", true], ["bankIfsc", "IFSC", true], ["bankName", "Bank name", true],
    ],
    optional: [
      ["website", "Website"], ["altContactName", "Alt. contact name"], ["altContactMobile", "Alt. contact mobile", false, "tel"],
      ["creditTerms", "Credit terms (e.g. Net 30)"], ["categoriesHandled", "Categories/brands handled"], ["tradeReferences", "Trade references"],
    ],
  },
  partner: {
    required: [
      ["partnerName", "Partner name", true], ["panAadhaarGstin", "PAN / Aadhaar or GSTIN", true],
      ["mobile", "Mobile", true, "tel"], ["email", "Email", true, "email"], ["commissionPct", "Commission %", true, "number"],
      ["bankAccountNo", "Bank account no.", true], ["bankIfsc", "IFSC", true], ["bankName", "Bank name", true],
    ],
    optional: [
      ["territory", "Territory / area"], ["contractStart", "Contract start", false, "date"], ["contractEnd", "Contract end", false, "date"],
      ["emergencyContact", "Emergency contact"], ["priorExperience", "Prior experience"],
    ],
  },
  store: {
    required: [
      ["managerName", "Store manager / owner", true], ["contactNumber", "Contact number", true, "tel"],
      ["address", "Full address", true], ["pincode", "Pincode", true],
    ],
    optional: [
      ["city", "City"], ["state", "State"], ["email", "Store email", false, "email"], ["floorAreaSqft", "Shop size (sq ft)", false, "number"],
      ["operatingHours", "Operating hours"], ["localTaxReg", "Local tax registration"], ["socialHandles", "Social handles"],
    ],
  },
};

// Onboard a company/store into the channel tree with its KYC/onboarding profile.
export function CreateNodeForm({ parents }: { parents: Parent[] }) {
  const [parentId, setParentId] = useState(parents[0]?.id ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parent = parents.find((p) => p.id === parentId) ?? parents[0];
  const childTypes = parent?.childTypes ?? [];
  const [nodeType, setNodeType] = useState(childTypes[0] ?? "");
  const field = "px-3 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  const effectiveType = childTypes.includes(nodeType) ? nodeType : (childTypes[0] ?? "");
  const set = FIELDS[effectiveType] ?? { required: [], optional: [] };

  async function submit(fd: FormData) {
    setBusy(true); setError(null);
    try { await createNode(fd); } catch (e) { setError(e instanceof Error ? e.message : "Could not onboard"); } finally { setBusy(false); }
  }

  if (parents.length === 0) {
    return <p className="text-sm text-[var(--faint)]">You don’t have permission to add companies or stores.</p>;
  }

  const renderField = ([name, label, required, type]: F) => (
    <label key={name} className="block">
      <span className="text-[11px] text-[var(--faint)]">{label}{required ? <span className="text-[var(--error)]"> *</span> : ""}</span>
      <input name={name} type={type ?? "text"} required={required} step={type === "number" ? "any" : undefined} className={field} />
    </label>
  );

  return (
    <form action={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] text-[var(--faint)]">Under</span>
          <select className={field} value={parentId}
            onChange={(e) => { const id = Number(e.target.value); setParentId(id); const p = parents.find((x) => x.id === id); setNodeType(p?.childTypes[0] ?? ""); }}>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.nodeType})</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-[var(--faint)]">Type</span>
          <select name="nodeType" value={effectiveType} onChange={(e) => setNodeType(e.target.value)} className={field} required>
            {childTypes.map((t) => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
          </select>
        </label>
        <input type="hidden" name="parentId" value={parentId} />
        <label className="block sm:col-span-2">
          <span className="text-[11px] text-[var(--faint)]">{effectiveType === "store" ? "Store name" : "Name"}<span className="text-[var(--error)]"> *</span></span>
          <input name="name" required className={field} placeholder={`e.g. ${effectiveType === "distributor" ? "Redington Delhi" : effectiveType === "partner" ? "Mehta Retail" : "Nehru Place LES"}`} />
        </label>
      </div>

      {effectiveType && (
        <>
          <div>
            <p className="text-[11px] font-semibold text-[var(--faint)] uppercase tracking-wide mb-2">Required details</p>
            <div className="grid gap-3 sm:grid-cols-2">{set.required.map(renderField)}</div>
          </div>
          <details className="group">
            <summary className="text-[12px] font-medium text-[var(--accent)] cursor-pointer select-none">Optional details</summary>
            <div className="grid gap-3 sm:grid-cols-2 mt-2">{set.optional.map(renderField)}</div>
          </details>
        </>
      )}

      {error && <p className="text-[13px] text-[var(--error)]">{error}</p>}

      <button type="submit" disabled={busy || !effectiveType}
        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dark)] disabled:opacity-50">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />} Onboard {TYPE_LABEL[effectiveType]?.toLowerCase() ?? "node"}
      </button>
    </form>
  );
}
