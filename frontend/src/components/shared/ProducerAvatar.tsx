import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProducerAvatarProps {
  avatarUrl?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-28 h-28",
  xl: "w-32 h-32",
};

const fallbackTextSize = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export const ProducerAvatar = ({ 
  avatarUrl, 
  name, 
  size = "md",
  className 
}: ProducerAvatarProps) => {
  // Convert empty string to undefined to ensure fallback displays properly
  const avatarSrc = avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : undefined;
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarSrc} alt={name} className="object-cover" />
      <AvatarFallback 
        className={cn(
          "bg-gradient-to-br from-emerald-400 to-green-500 text-white font-bold",
          fallbackTextSize[size]
        )}
      >
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
