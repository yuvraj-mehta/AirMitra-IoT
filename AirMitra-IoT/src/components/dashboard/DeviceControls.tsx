import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Fan, Palette, Zap } from "lucide-react";

interface DeviceControlsProps {
  currentState: {
    bulb_state: "ON" | "OFF";
    fan_state: "ON" | "OFF";
    fan_speed: number;
    rgb_color: string;
    mode: "AUTO" | "MANUAL";
  };
  onBulbChange: (state: "ON" | "OFF") => void;
  onFanChange: (state: "ON" | "OFF") => void;
  onFanSpeedChange: (speed: number) => void;
  onColorChange: (color: string) => void;
  onModeToggle: () => void;
}

const DeviceControls = ({ 
  currentState, 
  onBulbChange, 
  onFanChange, 
  onFanSpeedChange, 
  onColorChange,
  onModeToggle 
}: DeviceControlsProps) => {
  const [color, setColor] = useState(currentState.rgb_color);
  const [fanSpeed, setFanSpeed] = useState(currentState.fan_speed);
  const { toast } = useToast();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Bulb Control</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="bulb-switch">Bulb Power</Label>
            <Switch
              id="bulb-switch"
              checked={currentState.bulb_state === "ON"}
              onCheckedChange={(checked) => {
                onBulbChange(checked ? "ON" : "OFF");
                toast({
                  title: "Bulb Control",
                  description: `Bulb turned ${checked ? "ON" : "OFF"}`,
                });
              }}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border">
        <div className="flex items-center gap-3 mb-6">
          <Fan className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Fan Control</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="fan-switch">Fan Power</Label>
            <Switch
              id="fan-switch"
              checked={currentState.fan_state === "ON"}
              onCheckedChange={(checked) => {
                onFanChange(checked ? "ON" : "OFF");
                toast({
                  title: "Fan Control",
                  description: `Fan turned ${checked ? "ON" : "OFF"}`,
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Fan Speed: {fanSpeed}%</Label>
            <Slider
              value={[fanSpeed]}
              onValueChange={(value) => setFanSpeed(value[0])}
              max={100}
              step={10}
              className="w-full"
            />
            <Button
              size="sm"
              onClick={() => {
                onFanSpeedChange(fanSpeed);
                toast({
                  title: "Fan Speed",
                  description: `Speed set to ${fanSpeed}%`,
                });
              }}
              className="w-full"
            >
              Apply Speed
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold">RGB Color</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border"
            />
            <div className="flex-1">
              <Label className="text-muted-foreground">Selected Color</Label>
              <p className="font-mono text-sm">{color}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              onColorChange(color);
              toast({
                title: "RGB Color",
                description: `Color set to ${color}`,
              });
            }}
            className="w-full"
          >
            Apply Color
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Mode Control</h3>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Toggle between automatic and manual control mode
          </p>
          <Button
            onClick={() => {
              onModeToggle();
              toast({
                title: "Mode Toggle",
                description: "Switching between AUTO/MANUAL mode",
              });
            }}
            variant="secondary"
            className="w-full"
          >
            Toggle Mode
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DeviceControls;
