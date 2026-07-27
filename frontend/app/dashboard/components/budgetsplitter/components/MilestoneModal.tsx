"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flame } from "lucide-react";

function milestoneMessage(streak: number) {
  if (streak === 1) return "Amazing work on submitting your first submission! Establishing the habit is the hardest part.";
  if (streak === 7) return "You've reached a 7 check-in streak! A solid week of consistency!";
  if (streak === 50) return "50 check-ins! You're almost at a full year of consistent tracking.";
  if (streak === 100) return "100 check-ins! Absolute dedication to your financial future.";
  if (streak === 365) return "365 check-ins! A full 'year' of streaks. Your consistency is incredibly inspiring.";
  return `You've reached a massive ${streak} check-in streak! Incredible dedication!`;
}

/**
 * Full-page streak celebration.
 *
 * Rendered through a portal into document.body: the dashboard wraps each card
 * in an animated FadeCard whose transform makes it the containing block for
 * position:fixed children, which would otherwise trap this overlay inside the
 * budget card instead of covering the viewport.
 */
export function MilestoneModal({ streak, onClose }: { streak: number; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // Stop the dashboard scrolling behind the overlay
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${streak} check-in streak reached`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-orange-900/20 animate-in zoom-in-95 duration-500 fade-in slide-in-from-bottom-4">
        <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-orange-600/20 to-yellow-500/20 rounded-full flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping opacity-20"></div>
          <Flame className="w-12 h-12 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" fill="currentColor" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-500">
            {streak} Streak!
          </span>
        </h2>
        <p className="text-zinc-400 leading-relaxed mb-8">{milestoneMessage(streak)}</p>
        <button
          onClick={onClose}
          autoFocus
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all active:scale-[0.98]"
        >
          Keep it up!
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default MilestoneModal;
