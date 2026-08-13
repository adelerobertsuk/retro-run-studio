import { Share2 } from "lucide-react";

type Props = {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
};

export function ShareToSocialButton({
  onClick,
  disabled,
  busy,
  className = "",
}: Props) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled || busy}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-60 ${className}`}
    >
      <Share2 className="size-4" />
      Share
    </button>
  );
}
