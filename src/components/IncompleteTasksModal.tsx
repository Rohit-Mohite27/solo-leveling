"use client";

type IncompleteTasksModalProps = {
  open: boolean;
  onClose: () => void;
};

/** Blocks day submit until every assigned core quest is cleared. */
export function IncompleteTasksModal({ open, onClose }: IncompleteTasksModalProps) {
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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-system-danger">
          Quest incomplete
        </p>
        <h2
          id="incomplete-tasks-title"
          className="mt-3 font-display text-2xl font-semibold leading-tight text-ink-900"
        >
          You didn&apos;t finish today&apos;s tasks
        </h2>
        <p className="mt-3 font-body text-sm font-semibold leading-relaxed text-ink-700/70">
          Complete every task created or assigned for today first. The System will not accept a
          partial day.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-11 w-full rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-pill transition hover:bg-lilac-600"
        >
          Back to quests
        </button>
      </div>
    </div>
  );
}
