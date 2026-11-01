import Image from "next/image";

/** Same Sung Jinwoo art as the midnight warning — dark stage so the black plate blends */
export function HunterMascot() {
  return (
    <div className="relative mx-auto h-56 w-48 animate-float sm:h-64 sm:w-52" aria-hidden>
      <div className="absolute inset-x-6 bottom-4 top-12 rounded-[40%] bg-lilac-400/35 blur-2xl" />
      <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] shadow-soft">
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#241e4a] via-[#17132f] to-[#0c0a18]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-lilac-500/35 to-transparent"
          aria-hidden
        />
        <Image
          src="/characters/jinwoo-hero.png"
          alt="Sung Jinwoo"
          fill
          priority
          unoptimized
          sizes="208px"
          className="object-contain object-bottom"
        />
      </div>
    </div>
  );
}
