import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Solo Leveling",
  description: "Maintain hunters, activity, and system health.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#f3f0ff] via-[#faf8ff] to-[#efeafc]">
      {children}
    </div>
  );
}
