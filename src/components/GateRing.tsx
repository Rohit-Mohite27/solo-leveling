export function GateRing() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      <div className="absolute h-[22rem] w-[22rem] rounded-full border border-lilac-300/50" />
      <div className="absolute h-[17rem] w-[17rem] rounded-full border border-lilac-400/35" />
      <div className="absolute h-[12rem] w-[12rem] rounded-full bg-lilac-200/40 blur-2xl" />
      <div className="absolute h-40 w-40 rounded-full bg-sand-200/70 blur-xl" />
    </div>
  );
}
