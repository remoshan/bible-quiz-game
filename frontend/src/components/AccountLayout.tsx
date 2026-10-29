import { BackButton } from "@/components/BackButton";

export function Messages({ error, notice }: { error?: string | null; notice?: string | null }) {
  return (
    <>
      {error ? <p className="text-center text-xs text-wrong">{error}</p> : null}
      {notice ? <p className="text-center text-xs text-accent">{notice}</p> : null}
    </>
  );
}

export function AccountLayout({
  onBack,
  title,
  intro,
  children,
}: {
  onBack: () => void;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="subscreen">
      <header className="flex shrink-0 items-center">
        <BackButton onClick={onBack} />
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <p className="label">Your account</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight">{title}</h1>
        {intro ? <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">{intro}</p> : null}
        {children}
      </div>
    </main>
  );
}
