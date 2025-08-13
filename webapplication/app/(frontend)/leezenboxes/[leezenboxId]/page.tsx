"use client";

import { RefreshCw, TrendingUp } from "lucide-react";
import Image from "next/image";
import { LeezenboxChart } from "@/components/leezenbox-chart";
import LeezenboxStatCard from "@/components/leezenbox-stat-card";
import { getLeezenboxById } from "@/actions/get-leezenboxs";
import { Separator } from "@/components/ui/separator";
import DeleteLeezenboxButton from "./components/delete-leezenbox-button";
import Link from "next/link";
import { getLeezenboxDataByLeezenbox } from "@/actions/get-leezenbox-data";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { DataPoint, Leezenbox } from "@/types";
import { toast } from "sonner";

interface LeezenboxByIdPageProps {
  params: Promise<{
    leezenboxId: string;
  }>;
}

const LeezenboxByIdPage = ({ params }: LeezenboxByIdPageProps) => {
  const [leezenbox, setLeezenbox] = useState<Leezenbox | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leezenboxId, setLeezenboxId] = useState<number | null>(null);

  // Initialize component and fetch initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const resolvedParams = await params;
        const leezenboxIdNumber = Number(resolvedParams.leezenboxId);
        setLeezenboxId(leezenboxIdNumber);

        const fetchedLeezenbox = await getLeezenboxById(leezenboxIdNumber);
        setLeezenbox(fetchedLeezenbox);

        if (fetchedLeezenbox) {
          const fetchedData = await getLeezenboxDataByLeezenbox(
            fetchedLeezenbox.id,
            fetchedLeezenbox.demo,
            fetchedLeezenbox.ttn_location_key
          );
          setData(fetchedData);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [params]);

  // Refresh data function
  const handleRefresh = async () => {
    if (!leezenbox) return;

    setRefreshing(true);
    try {
      if (!leezenbox.demo) {
        // Only trigger cronjob for real data (non-demo leezenboxes)
        console.log("Triggering cronjob to fetch fresh data...");
        const cronResponse = await fetch("/api/cron", {
          method: "GET",
        });

        if (!cronResponse.ok) {
          console.warn(
            "Cronjob failed, but continuing with database refresh:",
            cronResponse.statusText
          );
        } else {
          console.log("Cronjob completed successfully");
        }
      }

      // Fetch updated data (either from database or mock data)
      console.log("Fetching updated data...");
      const refreshedData = await getLeezenboxDataByLeezenbox(
        leezenbox.id,
        leezenbox.demo,
        leezenbox.ttn_location_key
      );
      setData(refreshedData);

      toast.success("Data refreshed successfully!");

      console.log("Data refresh complete");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Leezenbox not found
  if (!leezenbox) {
    return (
      <div className="flex items-center justify-center h-screen flex-col">
        <h1 className="text-2xl font-bold">Leezenbox not found</h1>
        <Link href="/leezenboxes" className="ml-4 text-blue-500">
          Go back to Leezenboxes
        </Link>
      </div>
    );
  }

  const averageOccupancy =
    data.length > 0
      ? data.reduce((acc, point) => {
          const bikes = point.predictions.length;
          return acc + bikes;
        }, 0) / data.length
      : 0;

  const lowestOccupancy =
    data.length > 0
      ? Math.min(...data.map((point) => point.predictions.length))
      : 0;

  const highestOccupancy =
    data.length > 0
      ? Math.max(...data.map((point) => point.predictions.length))
      : 0;

  // Get current occupancy (most recent data point)
  const currentOccupancy =
    data.length > 0 ? data[data.length - 1].predictions.length : 0;

  // Calculate capacity utilization percentage
  const capacityUtilization =
    leezenbox?.capacity && currentOccupancy
      ? (currentOccupancy / leezenbox.capacity) * 100
      : 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Image
          src="/assets/hiltrup.jpeg"
          alt="Hiltrup"
          width={500}
          height={300}
          className="w-full aspect-[16/5] lg:aspect-[4/1] xl:aspect-[8/1] object-cover rounded-lg shadow-md "
        />
        <h1 className="absolute bottom-4 left-4 text-white text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
          {leezenbox?.name || "Leezenbox"} <br />
          <p className="text-sm sm:text-base md:text-lg drop-shadow-lg">
            {leezenbox?.address || "Address not available"} <br />
            {leezenbox?.postcode ? `${leezenbox.postcode} ` : ""}
            {leezenbox?.city || "City not available"}
          </p>
        </h1>
      </div>
      <div className="flex justify-end w-full">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
      <LeezenboxChart
        data={data}
        aggregateData={false}
        backgroundImageSrc={
          leezenbox.ttn_location_key == "Rudolf-Harbig-Weg"
            ? "/assets/Promenade.jpg"
            : "/assets/blank_image.jpg"
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <LeezenboxStatCard
          description="Current Occupancy"
          title={currentOccupancy + " / " + leezenbox?.capacity}
          change={
            capacityUtilization > 80
              ? "High utilization"
              : capacityUtilization > 50
              ? "Moderate utilization"
              : "Low utilization"
          }
          details={`${capacityUtilization.toFixed(1)}% capacity used`}
        >
          Real-time bike count <RefreshCw size={20} />
        </LeezenboxStatCard>
        <LeezenboxStatCard
          description="Average Occupancy"
          title={`${averageOccupancy.toFixed(1)} / ${leezenbox?.capacity || 0}`}
          details="Trending up this month"
        >
          Visitors for the last 6 months <TrendingUp size={20} />
        </LeezenboxStatCard>
        <LeezenboxStatCard
          description="Lowest Occupancy"
          title={`${lowestOccupancy} / ${leezenbox?.capacity || 0}`}
          details="Trending up this month"
        >
          Visitors for the last 6 months <TrendingUp size={20} />
        </LeezenboxStatCard>
        <LeezenboxStatCard
          description="Highest Occupancy"
          title={`${highestOccupancy} / ${leezenbox?.capacity || 0}`}
          details="Trending up this month"
        >
          Visitors for the last 6 months <TrendingUp size={20} />
        </LeezenboxStatCard>
      </div>
      <Separator className="my-4" />
      <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
      <div>
        {leezenboxId && <DeleteLeezenboxButton leezenboxId={leezenboxId} />}
      </div>
    </div>
  );
};

export default LeezenboxByIdPage;
