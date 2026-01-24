export const categories = [
  {
    id: "vegetables",
    translationKey: "categories.vegetables",
    icon: "🥬",
  },
  {
    id: "fruits",
    translationKey: "categories.fruits",
    icon: "🍎",
  },
  {
    id: "handmade",
    translationKey: "categories.handmade",
    icon: "🎨",
  },
  {
    id: "services",
    translationKey: "categories.services",
    icon: "🤝",
  },
  {
    id: "other",
    translationKey: "categories.other",
    icon: "📦",
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  // Vegetables / Herbs -> Sage Green
  vegetables: "bg-[#879385] text-white",
  herbs: "bg-[#879385] text-white",

  // Fruits / Flowers -> Dusty Rose
  fruits: "bg-[#A88C8F] text-white",
  flowers: "bg-[#A88C8F] text-white",

  // Seeds / Other -> Pale Yellow (needs dark text)
  seeds: "bg-[#EFEAC6] text-[#3E3B34]",
  other: "bg-[#EFEAC6] text-[#3E3B34]",

  // Tools / Services -> Muted Stone/Grey
  tools: "bg-[#9CA3AF] text-white",
  services: "bg-[#9CA3AF] text-white",

  // Handmade -> Dusty Rose (similar to fruits/artistic) or keep separate? 
  // Using Dusty Rose for now as it fits "artisan" better than grey
  handmade: "bg-[#A88C8F] text-white",
};

export const getCategoryColor = (category?: string) => {
  return CATEGORY_COLORS[category?.toLowerCase() || "other"] || CATEGORY_COLORS.other;
};
