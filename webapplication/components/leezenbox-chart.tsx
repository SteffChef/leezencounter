"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DataPoint } from "@/types";
import BorderBox from "./border-box";

export const description = "An interactive area chart";

const chartConfig = {
  bicycles: {
    label: "Bicycles",
  },
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface LeezenboxChartProps {
  data: DataPoint[];
  backgroundImageSrc?: string;
}

interface ChartClickEvent {
  activePayload?: Array<{
    payload: {
      timestamp: string;
      bicycles: number;
    };
  }>;
}

export function LeezenboxChart({
  data,
  backgroundImageSrc,
}: LeezenboxChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("3m");
  const [selectedDataPoint, setSelectedDataPoint] =
    React.useState<DataPoint | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  // Handler for datapoint clicks
  const handleDataPointClick = (chartData: ChartClickEvent) => {
    if (chartData && chartData.activePayload && chartData.activePayload[0]) {
      const clickedTimestamp = chartData.activePayload[0].payload.timestamp;

      if (timeRange === "24h") {
        // For 24h view, find the exact data point
        const clickedDataPoint = data.find(
          (dp: DataPoint) => dp.received_at === clickedTimestamp
        );

        if (clickedDataPoint) {
          setSelectedDataPoint(clickedDataPoint);
          setIsModalOpen(true);
        }
      } else {
        // For other time ranges, use the existing interval-based logic
        const clickedTime = new Date(clickedTimestamp);

        // Determine interval length based on time range
        let intervalMinutes: number;
        switch (timeRange) {
          case "7d":
            intervalMinutes = 4 * 60;
            break;
          case "30d":
          case "3m":
            intervalMinutes = 24 * 60;
            break;
          default:
            intervalMinutes = 24 * 60;
        }

        const intervalMs = intervalMinutes * 60 * 1000;
        const intervalEnd = new Date(clickedTime.getTime() + intervalMs);

        // Find all data points within the clicked interval
        const dataPointsInInterval = data.filter((dp: DataPoint) => {
          const dpTime = new Date(dp.received_at);
          return dpTime >= clickedTime && dpTime < intervalEnd;
        });

        // If we have data points in this interval, show the first one or combine them
        if (dataPointsInInterval.length > 0) {
          // For simplicity, show the first data point, but you could aggregate them
          setSelectedDataPoint(dataPointsInInterval[0]);
          setIsModalOpen(true);
        }
      }
    }
  };

  // Generate complete time series data with zeros for missing periods
  const generateCompleteTimeSeries = () => {
    const referenceDate = new Date();
    const startDate = new Date(referenceDate);
    const endDate = new Date(referenceDate);

    let intervalMinutes: number;

    switch (timeRange) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        // For 24h view, show individual data points without aggregation
        const filteredData24h = data.filter((item) => {
          const itemDate = new Date(item.received_at);
          return itemDate >= startDate && itemDate <= endDate;
        });

        return filteredData24h
          .map((item) => ({
            timestamp: item.received_at,
            bicycles: item.predictions.length,
          }))
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        intervalMinutes = 4 * 60; // 4 hour intervals for 7d view
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        intervalMinutes = 24 * 60; // 1 day intervals for 30d view
        break;
      case "3m":
        startDate.setMonth(startDate.getMonth() - 3);
        intervalMinutes = 24 * 60; // 1 day intervals for 3m view
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 3);
        intervalMinutes = 24 * 60;
    }

    // Filter data to the time range first (for non-24h views)
    const filteredData = data.filter((item) => {
      const itemDate = new Date(item.received_at);
      return itemDate >= startDate && itemDate <= endDate;
    });

    // Generate complete time series with regular intervals (for non-24h views)
    const timeSeriesData = [];
    const currentTime = new Date(startDate);
    const intervalMs = intervalMinutes * 60 * 1000;

    while (currentTime <= endDate) {
      const intervalStart = new Date(currentTime);
      const intervalEnd = new Date(currentTime.getTime() + intervalMs);

      // Find all data points that fall within this interval
      const dataPointsInInterval = filteredData.filter((item) => {
        const itemDate = new Date(item.received_at);
        return itemDate >= intervalStart && itemDate < intervalEnd;
      });

      // Calculate average bicycles and saddles per observation in this interval
      let avgBicycles = 0;

      if (dataPointsInInterval.length > 0) {
        const totalBicycles = dataPointsInInterval.reduce((sum, item) => {
          return sum + item.predictions.length;
        }, 0);

        avgBicycles = Math.round(totalBicycles / dataPointsInInterval.length);
      }

      timeSeriesData.push({
        timestamp: intervalStart.toISOString(),
        bicycles: avgBicycles,
      });

      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
    }

    return timeSeriesData;
  };

  const sortedData = generateCompleteTimeSeries();

  // Helper function to format X-axis ticks based on time range
  const formatXAxisTick = (value: string) => {
    const date = new Date(value);

    switch (timeRange) {
      case "24h":
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
      case "7d":
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
        });
      case "30d":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      case "3m":
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      default:
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
    }
  };

  // Helper function to format tooltip labels
  const formatTooltipLabel = (value: string) => {
    const date = new Date(value);

    switch (timeRange) {
      case "24h":
        return date.toLocaleString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        });
      case "7d":
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      case "30d":
      case "3m":
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      default:
        return date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
    }
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the selected time period
          </span>
          <span className="@[540px]/card:hidden">Selected period</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="24h">Last 24 hours</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="3m">Last 3 months</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="24h" className="rounded-lg">
                Last 24 hours
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="3m" className="rounded-lg">
                Last 3 months
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={sortedData} onClick={handleDataPointClick}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={
                timeRange === "24h" ? 120 : timeRange === "7d" ? 60 : 40
              }
              interval="preserveStartEnd"
              tickFormatter={formatXAxisTick}
            />
            <YAxis
              dataKey="bicycles"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={
                timeRange === "24h" ? 80 : timeRange === "7d" ? 60 : 40
              }
              interval="preserveStartEnd"
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={formatTooltipLabel}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="bicycles"
              type="monotone"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
              style={{ cursor: "pointer" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      {/* Modal for displaying image */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Datapoint Details</DialogTitle>
            <DialogDescription>
              {selectedDataPoint && (
                <>
                  Timestamp: {formatTooltipLabel(selectedDataPoint.received_at)}
                  <br />
                  Bicycles detected: {selectedDataPoint.predictions.length}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <BorderBox
              predictions={
                selectedDataPoint ? selectedDataPoint?.predictions : []
              }
              backgroundImageSrc={backgroundImageSrc}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
