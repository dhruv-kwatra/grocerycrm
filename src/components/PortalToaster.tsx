"use client";

import { Toaster } from "react-hot-toast";

// App-wide toast surface, themed to the portal's dark/amber tokens. Mounted once
// in the root layout so any client component can fire toasts via the `notify`
// helper (@/lib/toast) — success / error / warning.
export default function PortalToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#17171b",
          color: "#f5f5f7",
          border: "1px solid #303036",
          borderRadius: "12px",
          fontSize: "13px",
          fontWeight: 500,
          padding: "10px 14px",
          maxWidth: "420px",
          boxShadow: "0 20px 50px -16px rgba(0,0,0,0.72)",
        },
        success: { iconTheme: { primary: "#34d399", secondary: "#0b0b0d" }, duration: 3000 },
        error: { iconTheme: { primary: "#34d399", secondary: "#0b0b0d" }, duration: 5000 },
      }}
    />
  );
}
