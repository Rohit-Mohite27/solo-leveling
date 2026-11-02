/**
 * Association-style hunter grades — earned by unbroken streak, not board place.
 * Everyone starts at E. S / A are hard-earned.
 */
export type HunterGrade = "E" | "D" | "C" | "B" | "A" | "S";

export type RankFace = {
  name: string;
  image: string;
};

export function gradeFromStreak(streak: number): HunterGrade {
  const s = Math.max(0, Math.floor(streak));
  if (s >= 30) return "S";
  if (s >= 20) return "A";
  if (s >= 14) return "B";
  if (s >= 7) return "C";
  if (s >= 3) return "D";
  return "E";
}

export function gradeLabel(grade: HunterGrade): string {
  return `${grade}-Rank`;
}

export function gradeRequirement(grade: HunterGrade): string {
  switch (grade) {
    case "S":
      return "30+ day streak";
    case "A":
      return "20–29 day streak";
    case "B":
      return "14–19 day streak";
    case "C":
      return "7–13 day streak";
    case "D":
      return "3–6 day streak";
    case "E":
    default:
      return "0–2 day streak";
  }
}

/**
 * Famous faces for grade cards (custom rank art).
 * First entry = full-bleed hero portrait.
 */
export function facesForGrade(grade: HunterGrade): RankFace[] {
  switch (grade) {
    case "S":
      return [{ name: "Sung Jinwoo", image: "/characters/rank/s-jinwoo.png" }];
    case "A":
      return [{ name: "Cha Hae-in", image: "/characters/rank/a-cha.png" }];
    case "B":
      return [{ name: "Choi Jong-in", image: "/characters/rank/b-choi.png" }];
    case "C":
      return [
        { name: "Yoo Jinho", image: "/characters/jinho.png" },
        { name: "Sung Jinah", image: "/characters/jinah.png" },
      ];
    case "D":
      return [{ name: "Woo Jinchul", image: "/characters/jinchul.png" }];
    case "E":
    default:
      return [{ name: "Rookie", image: "/characters/greeter.png" }];
  }
}

/**
 * Top-3 podium showcase art by board place (visual only).
 * Letter grade on the chip still comes from streak.
 */
export function showcaseForPodiumPlace(place: 1 | 2 | 3): RankFace {
  if (place === 1) return { name: "Sung Jinwoo", image: "/characters/rank/s-jinwoo.png" };
  if (place === 2) return { name: "Cha Hae-in", image: "/characters/rank/a-cha.png" };
  return { name: "Choi Jong-in", image: "/characters/rank/b-choi.png" };
}

/** Podium place chrome (board position), separate from earned letter grade. */
export function podiumFrame(place: 1 | 2 | 3): {
  ring: string;
  glow: string;
  chip: string;
  wash: string;
} {
  if (place === 1) {
    return {
      ring: "ring-[#f6d860]",
      glow: "shadow-[0_0_28px_rgba(246,216,96,0.45)]",
      chip: "bg-[#f6d860] text-[#2a2458]",
      wash: "from-[#5b4bb8]/40 via-[#2a2458]/20 to-[#0c0a18]/90",
    };
  }
  if (place === 2) {
    return {
      ring: "ring-[#9bb8ff]",
      glow: "shadow-[0_0_22px_rgba(124,108,240,0.4)]",
      chip: "bg-[#7c6cf0] text-white",
      wash: "from-[#5b9cf5]/35 via-[#2a2458]/25 to-[#0c0a18]/90",
    };
  }
  return {
    ring: "ring-[#e8b07a]",
    glow: "shadow-[0_0_20px_rgba(232,176,122,0.35)]",
    chip: "bg-[#c4844a] text-white",
    wash: "from-[#f0a05a]/30 via-[#3d2458]/25 to-[#0c0a18]/90",
  };
}

export function podiumToneForGrade(grade: HunterGrade): string {
  switch (grade) {
    case "S":
      return "from-[#3a2a0a] via-[#8a6a18] to-[#f6d860]";
    case "A":
      return "from-[#1a2440] via-[#3d5a9a] to-[#9bb0d9]";
    case "B":
      return "from-[#3a2210] via-[#8a5530] to-[#e8b07a]";
    case "C":
      return "from-[#2a2458] via-[#5b4bb8] to-[#9b8cff]";
    case "D":
      return "from-[#243040] via-[#4a6278] to-[#8aa4bc]";
    case "E":
    default:
      return "from-[#2a2a32] via-[#4a4a58] to-[#7a7a88]";
  }
}
