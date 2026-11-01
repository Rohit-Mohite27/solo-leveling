type Props = {
  xp: number;
  xpToNext: number;
  progress: number;
};

export function XpBar({ xp, xpToNext, progress }: Props) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between text-sm font-bold text-lilac-500">
        <span>XP</span>
        <span>
          {xp} / {xpToNext}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-lilac-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lilac-400 to-sea-400 transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
