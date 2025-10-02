import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  iconColor?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  iconColor = "text-gray-400 dark:text-gray-600"
}: EmptyStateProps) {
  return (
    <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-dashed border-2 shadow-lg">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 bg-green-200 dark:bg-green-800 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <Icon className={`w-20 h-20 ${iconColor} relative z-10`} />
        </div>
        <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </Card>
  );
}
