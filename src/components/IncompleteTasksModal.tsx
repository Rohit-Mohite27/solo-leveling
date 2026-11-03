"use client";

type IncompleteTasksModalProps = {
  open: boolean;
  onClose: () => void;
  /** Confirm submitting a day that is not fully cleared */
  onConfirmPartial?: () => void;
};

/**
 * Warns before submitting a partial day (streak will reset).
 * Quests still clear automatically when logged value hits the goal.
 */
export function IncompleteTasksModal({
  open,
  onClose,
  onConfirmPartial,
}: IncompleteTasksModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1e1a3a]/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incomplete-tasks-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-level-rise rounded-[1.5rem] bg-white p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-lilac-400">
          Partial day
        </p>
        <h2
          id="incomplete-tasks-title"
          className="mt-3 font-display text-2xl font-semibold leading-tight text-ink-900"
        >
          Some goals are still open
        </h2>
        <p className="mt-3 font-body text-sm font-semibold leading-relaxed text-ink-700/70">
          You can submit what you logged (e.g. 60 of 100 push-ups). A task only flips to Clear
          when it hits the target. Submitting short of a full clear will reset your streak.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {onConfirmPartial && (
            <button
              type="button"
              onClick={onConfirmPartial}
              className="min-h-11 w-full rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-pill transition hover:bg-lilac-600"
            >
              Submit anyway
            </button>
          )}
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
