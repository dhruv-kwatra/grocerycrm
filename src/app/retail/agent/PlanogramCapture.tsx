"use client";

import { useRef, useState } from "react";
import { Camera, Check, X, ScanLine, Loader2 } from "lucide-react";
import { notify, errorMessage } from "@/lib/toast";
import { submitPlanogram } from "./actions";

type Sku = { id: number; skuCode: string; name: string; isFocus: boolean };
type Counter = { id: number; name: string };

// D4 — planogram photo audit. Phone-first: pick a counter + SKU, mark the shelf
// OK or non-compliant. A ✗ opens the camera with a ghost-frame guide; the shot
// is downscaled client-side to a data URL and sent with the check (server
// uploads it and raises the finding). No multipart proxy needed.
export function PlanogramCapture({ counters, skus }: { counters: Counter[]; skus: Sku[] }) {
  const [counterId, setCounterId] = useState<number | "">(counters[0]?.id ?? "");
  const [skuId, setSkuId] = useState<number | "">(skus[0]?.id ?? "");
  const [photo, setPhoto] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState<null | "ok" | "fail">(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Downscale the captured frame to ≤1280px JPEG (keeps the upload small).
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    setPhoto(canvas.toDataURL("image/jpeg", 0.7));
  }

  async function submit(status: "ok" | "fail") {
    if (!skuId) return;
    setBusy(status);
    const fd = new FormData();
    fd.set("skuId", String(skuId));
    if (counterId) fd.set("counterId", String(counterId));
    fd.set("status", status);
    if (status === "fail") {
      if (photo) fd.set("photoDataUrl", photo);
      if (detail.trim()) fd.set("detail", detail.trim());
    }
    try {
      const res = await submitPlanogram(null, fd);
      if (res.ok) {
        notify.success(res.message ?? "Planogram check submitted");
        setPhoto(null); setDetail("");
      } else {
        notify.error(res.error);
      }
    } catch (e) {
      notify.error(errorMessage(e, "Could not submit the planogram check"));
    } finally {
      setBusy(null);
    }
  }

  const sel = "px-2.5 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)] w-full";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-[var(--faint)]">Counter</span>
          <select className={sel} value={counterId} onChange={(e) => setCounterId(e.target.value ? Number(e.target.value) : "")}>
            {counters.length === 0 && <option value="">No counters</option>}
            {counters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-[var(--faint)]">SKU</span>
          <select className={sel} value={skuId} onChange={(e) => setSkuId(e.target.value ? Number(e.target.value) : "")}>
            {skus.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isFocus ? " ★" : ""}</option>)}
          </select>
        </label>
      </div>

      {/* Ghost-frame camera guide */}
      <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface-raised)] aspect-[4/3] flex items-center justify-center">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="planogram" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[var(--faint)] pointer-events-none">
            <ScanLine size={30} />
            <span className="text-[11px]">Align the shelf inside the frame</span>
          </div>
        )}
        <div className="absolute inset-4 border border-[var(--accent)]/40 rounded-lg pointer-events-none" />
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      <button type="button" onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium border border-[var(--border-strong)] text-[var(--text)] rounded-lg hover:bg-[var(--surface-raised)]">
        <Camera size={16} /> {photo ? "Retake photo" : "Take photo"}
      </button>

      <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="What's wrong? (optional)"
        className="w-full px-2.5 py-2 text-sm border border-[var(--border-strong)] rounded-lg bg-[var(--surface)]" />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={busy !== null || !skuId} onClick={() => submit("ok")}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold bg-[var(--success)] text-white rounded-lg disabled:opacity-50 hover:brightness-110">
          {busy === "ok" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Compliant
        </button>
        <button type="button" disabled={busy !== null || !skuId} onClick={() => submit("fail")}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold bg-[var(--error)] text-white rounded-lg disabled:opacity-50 hover:brightness-110">
          {busy === "fail" ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Report ✗
        </button>
      </div>
      <p className="text-[11px] text-[var(--faint)] text-center">A ✗ opens a finding on your manager's fix-list.</p>
    </div>
  );
}
