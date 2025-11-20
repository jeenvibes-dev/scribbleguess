import { type AvatarId } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AVATAR_COLORS = {
  "avatar-1": "bg-gradient-to-br from-pink-400 to-pink-600",
  "avatar-2": "bg-gradient-to-br from-blue-400 to-blue-600",
  "avatar-3": "bg-gradient-to-br from-green-400 to-green-600",
  "avatar-4": "bg-gradient-to-br from-yellow-400 to-yellow-600",
  "avatar-5": "bg-gradient-to-br from-emerald-400 to-emerald-600",
  "avatar-6": "bg-gradient-to-br from-red-400 to-red-600",
  "avatar-7": "bg-gradient-to-br from-sky-400 to-sky-600",
  "avatar-8": "bg-gradient-to-br from-orange-400 to-orange-600",
  "avatar-9": "bg-gradient-to-br from-teal-400 to-teal-600",
  "avatar-10": "bg-gradient-to-br from-cyan-400 to-cyan-600",
  "avatar-11": "bg-gradient-to-br from-lime-400 to-lime-600",
  "avatar-12": "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600",
} as const;

const AVATAR_ICONS = {
  "avatar-1": "🎨",
  "avatar-2": "🌟",
  "avatar-3": "🎯",
  "avatar-4": "🎪",
  "avatar-5": "🎭",
  "avatar-6": "🎸",
  "avatar-7": "🎮",
  "avatar-8": "🎲",
  "avatar-9": "🎹",
  "avatar-10": "🎺",
  "avatar-11": "🎻",
  "avatar-12": "🥁",
} as const;

interface AvatarDisplayProps {
  avatar: AvatarId;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarDisplay({ avatar, size = "md", className = "" }: AvatarDisplayProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-base",
    md: "h-12 w-12 text-2xl",
    lg: "h-16 w-16 text-3xl",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className} ring-2 ring-white/20`}>
      <AvatarFallback className={AVATAR_COLORS[avatar]}>
        <span className="select-none">{AVATAR_ICONS[avatar]}</span>
      </AvatarFallback>
    </Avatar>
  );
}
