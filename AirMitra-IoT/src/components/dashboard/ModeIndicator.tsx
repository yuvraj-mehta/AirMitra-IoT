import { Badge } from "@/components/ui/badge";
import { Zap, Hand, Wifi, WifiOff } from "lucide-react";

interface ModeIndicatorProps {
  mode: "AUTO" | "MANUAL";
  isConnected: boolean;
}

const ModeIndicator = ({ mode, isConnected }: ModeIndicatorProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          mode === "AUTO" ? "bg-secondary/20 text-secondary" : "bg-accent/20 text-accent"
        }`}>
          {mode === "AUTO" ? <Zap className="w-5 h-5" /> : <Hand className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Mode</p>
          <Badge variant={mode === "AUTO" ? "default" : "secondary"} className="mt-1">
            {mode}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="w-5 h-5 text-secondary animate-pulse" />
            <span className="text-sm text-secondary">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Waiting...</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ModeIndicator;
