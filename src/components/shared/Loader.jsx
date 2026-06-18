import { Loader2 } from "lucide-react";

export default function Loader({ size = "default", text = "" }) {
  const sizeClasses = {
    small: "w-5 h-5",
    default: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2
        className={`${sizeClasses[size]} text-sage-500 animate-spin`}
      />
      {text && (
        <p className="text-sm text-earth-400 animate-pulse-soft">{text}</p>
      )}
    </div>
  );
}
