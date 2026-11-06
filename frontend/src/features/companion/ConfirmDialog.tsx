"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  prompt: string;
  busy?: boolean;
  onConfirm: (answer: "yes" | "no") => void;
}

export function ConfirmDialog({ prompt, busy, onConfirm }: ConfirmDialogProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="w-full max-w-md rounded-xl border border-amber-500/50 bg-[#0C081D]/95 p-6 shadow-[0_0_30px_rgba(245,158,11,0.25)] flex flex-col gap-4 animate-scale-in"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white tracking-wide uppercase">
              JARVIS System Confirmation
            </h3>
            <p className="font-mono text-[10px] text-[#C0BEEF]/70">
              Authorized confirmation required for desktop action
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-black/40 border border-[#2614DF]/30 p-3.5">
          <p className="text-xs leading-relaxed text-[#E8EEFF] font-medium font-body">{prompt}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            className="rounded-lg border border-[#2614DF]/40 bg-[#0C081D] px-4 py-1.5 font-mono text-xs font-bold text-[#C0BEEF] hover:bg-[#2614DF]/30 hover:text-white transition-all cursor-pointer"
            onClick={() => onConfirm("no")}
            disabled={busy}
          >
            Cancel (No)
          </button>
          <button
            type="button"
            className="rounded-lg border border-amber-500/60 bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-1.5 font-mono text-xs font-bold text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:brightness-110 transition-all cursor-pointer"
            onClick={() => onConfirm("yes")}
            disabled={busy}
            autoFocus
          >
            Confirm (Yes)
          </button>
        </div>
      </div>
    </div>
  );
}
