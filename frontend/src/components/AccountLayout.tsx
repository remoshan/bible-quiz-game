import { BackButton } from "@/components/BackButton";

export function AccountLayout({
  onBack,
  title,
  children,
}: {
  onBack: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-5 sm:max-w-lg">
      <header className="flex shrink-0 items-center">
        <BackButton onClick={onBack} />
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <p className="label">Your account</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}
