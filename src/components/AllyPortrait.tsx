import Image from "next/image";
import type { Ally } from "@/lib/demo-data";

type Props = {
  ally: Ally;
  size?: "sm" | "md" | "lg";
  locked?: boolean;
};

const SIZE = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-40 w-40",
} as const;

export function AllyPortrait({ ally, size = "md", locked = false }: Props) {
  const dim = SIZE[size];

  if (ally.image && !locked) {
    return (
      <div
        className={`relative ${dim} overflow-hidden rounded-full border-2 shadow-soft`}
        style={{ borderColor: `${ally.accent}99` }}
      >
        <Image
          src={ally.image}
          alt={ally.name}
          fill
          sizes={size === "lg" ? "160px" : size === "md" ? "80px" : "48px"}
          className="object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex ${dim} items-end justify-center overflow-hidden rounded-full border`}
      style={{
        borderColor: locked ? "rgba(124,108,240,0.2)" : `${ally.accent}66`,
        background: locked
          ? "linear-gradient(180deg, #eee6ff, #fffaf5)"
          : `linear-gradient(180deg, ${ally.accent}33, #fffaf5)`,
        boxShadow: locked ? undefined : `0 8px 24px ${ally.accent}33`,
      }}
      aria-hidden
    >
      {ally.image && locked ? (
        <Image
          src={ally.image}
          alt=""
          fill
          sizes="48px"
          className="object-cover object-top opacity-25 blur-[1px]"
        />
      ) : (
        <div
          className="relative"
          style={{
            width: size === "lg" ? 96 : size === "md" ? 48 : 28,
            height: size === "lg" ? 128 : size === "md" ? 64 : 40,
            opacity: locked ? 0.3 : 0.95,
          }}
        >
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              width: "38%",
              height: "22%",
              top: "8%",
              transform: "translateX(-50%)",
              background: `linear-gradient(180deg, ${ally.accent}, #2c2550)`,
            }}
          />
          <div
            className="absolute bottom-0 left-1/2"
            style={{
              width: "78%",
              height: "58%",
              transform: "translateX(-50%)",
              borderRadius: "40% 40% 12% 12%",
              background: `linear-gradient(180deg, ${ally.accent}cc, #4f42b0)`,
            }}
          />
        </div>
      )}
      {locked && (
        <span className="absolute inset-0 flex items-center justify-center bg-lilac-50/40 text-[10px] font-bold uppercase tracking-wide text-lilac-500">
          Locked
        </span>
      )}
    </div>
  );
}
