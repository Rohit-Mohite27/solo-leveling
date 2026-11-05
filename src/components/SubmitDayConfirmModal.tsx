"use client";

type SubmitDayConfirmModalProps = {
  open: boolean;
  /** True when today's No Fap quest is marked held */
  noFapHeld: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Always shown before day submit — day locks after confirm. */
export function SubmitDayConfirmModal({
  open,
  noFapHeld,
  onClose,
  onConfirm,
}: SubmitDayConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1e1a3a]/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-day-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-level-rise rounded-[1.5rem] bg-white p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-lilac-400">
          System confirm
        </p>
        <h2
          id="submit-day-title"
          className="mt-3 font-display text-2xl font-semibold leading-tight text-ink-900"
        >
          Submit today&apos;s log?
        </h2>
        <p className="mt-3 font-body text-sm font-semibold leading-relaxed text-ink-700/70">
          Are you sure you want to submit for the day? You won&apos;t be able to add any more
          progress after this for today.
        </p>
        {!noFapHeld ? (
          <p className="mt-3 rounded-xl bg-system-danger/10 px-3 py-2.5 text-sm font-semibold text-system-danger">
            No Fap is not marked Held. Submitting now resets your streak and seals allies &amp;
            shadows until you hold again.
          </p>
        ) : (
          <p className="mt-3 rounded-xl bg-lilac-100/80 px-3 py-2.5 text-sm font-semibold text-lilac-700">
            No Fap Held — your streak continues. Workout goals still affect XP and day-clear
            bonuses, but not the streak count.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 w-full rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-pill transition hover:bg-lilac-600"
          >
            Yes, submit day
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-2xl bg-white text-sm font-bold uppercase tracking-[0.14em] text-lilac-600 ring-1 ring-lilac-200 transition hover:bg-lilac-50"
          >
            Keep logging
          </button>
        </div>
      </div>
    </div>
  );
}
