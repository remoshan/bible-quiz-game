import { BackIcon } from "@/components/icons";

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-2 flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      <BackIcon className="h-4 w-4" />
      Back
    </button>
  );
}
