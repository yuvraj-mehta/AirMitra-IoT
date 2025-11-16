import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subHours } from "date-fns";
import { cn } from "@/lib/utils";

const Analytics = () => {
  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeFrame, setTimeFrame] = useState<string>("24h");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const { toast } = useToast();

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    if (timeFrame === "custom") {
      if (!customStartDate || !customEndDate) return null;
      return { startDate: customStartDate, endDate: customEndDate };
    }

    switch (timeFrame) {
      case "1h":
        startDate = subHours(now, 1);
        break;
      case "24h":
        startDate = subDays(now, 1);
        break;
      case "7d":
        startDate = subDays(now, 7);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      default:
        startDate = subDays(now, 1);
    }

    return { startDate, endDate };
  };

  const runAnalysis = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query",
        variant: "destructive",
      });
      return;
    }

    const dateRange = getDateRange();
    if (!dateRange) {
      toast({
        title: "Error",
        description: "Please select valid custom dates",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-data", {
        body: { 
          query,
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "AI analysis has been generated",
      });
    } catch (error) {
      console.error("Error running analysis:", error);
      toast({
        title: "Error",
        description: "Failed to generate analysis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickAnalyses = [
    "Analyze temperature patterns over the last 24 hours",
    "Find unusual humidity spikes",
    "Suggest optimal fan temperature threshold",
    "Identify peak motion detection times"
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold">AI-Powered Analytics</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Frame:</label>
            <div className="flex gap-2">
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select time frame" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="1h">Last 1 Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {timeFrame === "custom" && (
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "PPP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "PPP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ask a question about your data:</label>
            <Textarea
              placeholder="e.g., What were the temperature trends yesterday?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Quick analyses:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickAnalyses.map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(q)}
                  className="justify-start text-left h-auto py-2 px-3"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={runAnalysis}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Run Analysis"
            )}
          </Button>
        </div>
      </Card>

      {analysis && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-foreground">{analysis}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
