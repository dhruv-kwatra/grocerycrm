"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiCopilotDrawer } from "@/app/grocery/ai/_components/AiCopilotDrawer";

export function StoreAssociateAskFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button (FAB) for Store Associates on Mobile View - Right hand side above bottom navbar */}
      <div className="lg:hidden fixed right-4 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full text-white font-bold text-xs shadow-2xl transition-all duration-200 transform active:scale-95 hover:scale-105 cursor-pointer border border-emerald-300/40 group"
          style={{
            background: "linear-gradient(135deg, #059669 0%, #10B981 60%, #047857 100%)",
            boxShadow: "0 10px 25px -3px rgba(16, 185, 129, 0.5), 0 4px 10px -2px rgba(16, 185, 129, 0.35)",
          }}
          aria-label="Ask Me GroceryCRM Intelligence Assistant"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-100 animate-pulse shrink-0" />
            <span className="tracking-tight text-[12px] font-bold drop-shadow-xs whitespace-nowrap">
              Ask Me
            </span>
          </div>
        </button>
      </div>

      {/* AI Assistant Drawer */}
      <AiCopilotDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
