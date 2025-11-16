import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface SensorCardProps {
  icon: ReactNode;
  title: string;
  value: string | ReactNode;
  color: string;
}

const SensorCard = ({ icon, title, value, color }: SensorCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className={`${color}`}>{icon}</div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
};

export default SensorCard;
