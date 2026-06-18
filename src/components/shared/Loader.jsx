import { Loader2 } from "lucide-react";

export default function Loader({ size = "medium", text = "Loading..." }) {
  const sizeClasses = {
    small: "w-5 h-5",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-fk-blue`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
