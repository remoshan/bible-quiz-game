import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="glass w-full max-w-sm rounded-3xl p-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Verse</h1>
        <p className="mt-2 text-sm text-muted">Step 1 — theming online.</p>
      </div>
      <ThemeToggle />
    </main>
  );
}
