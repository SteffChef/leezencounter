import LeezenboxesOverview from "./components/leezenboxes-overview";
import LeezenboxStatCard from "@/components/leezenbox-stat-card";
import { TrendingUp } from "lucide-react";
import { generateExampleDataForLeezenboxes } from "@/example-data";
import {
  getLatestOccupancyForAllLeezenboxes,
  getLeezenboxDataForMultiple,
} from "@/actions/get-leezenbox-data";
import { LeezenboxChart } from "@/components/leezenbox-chart";
import { getLeezenboxs } from "@/actions/get-leezenboxs";
import { DataPoint } from "@/types";

const DashboardPage = async () => {
  const leezenboxes = await getLeezenboxs();

  // Get occupancy data using the new function that respects demo flags
  const leezenboxOccupancies = await getLatestOccupancyForAllLeezenboxes(
    leezenboxes.map((lb) => ({
      id: lb.id,
      demo: lb.demo,
      ttn_location_key: lb.ttn_location_key,
    }))
  );

  // Get chart data - for now, let's use the first leezenbox or demo data
  const firstLeezenbox = leezenboxes[0];
  let chartData: DataPoint[] = [];

  if (firstLeezenbox) {
    if (firstLeezenbox.demo) {
      // Generate mock data for this specific demo leezenbox
      chartData = generateExampleDataForLeezenboxes([firstLeezenbox.id]);
    } else {
      // Get real data for non-demo leezenbox
      const allData = await getLeezenboxDataForMultiple([
        {
          id: firstLeezenbox.id,
          demo: firstLeezenbox.demo,
          ttn_location_key: firstLeezenbox.ttn_location_key,
        },
      ]);
      chartData = allData;
    }
  }

  const currentOccupancy = Object.values(leezenboxOccupancies).reduce(
    (acc, occupancy) => acc + occupancy.bikes,
    0
  );

  const totalCapacity = Object.values(leezenboxes).reduce(
    (acc, box) => acc + box.capacity,
    0
  );

  const averageOccupancy =
    chartData.length > 0
      ? chartData.reduce((acc, point) => {
          const bikes = point.predictions.length;
          return acc + bikes;
        }, 0) / chartData.length
      : 0;

  return (
    <>
      <h1 className="text-xl font-bold">Leezenbox Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4 justify-between h-full ">
          <LeezenboxStatCard
            description="Total current visitors"
            title={`${currentOccupancy} / ${totalCapacity}`}
            change="+12.5%"
            changeIcon={<TrendingUp />}
            details="Trending up this month"
          >
            Visitors for the last 6 months <TrendingUp size={20} />
          </LeezenboxStatCard>
          <LeezenboxStatCard
            description="Average Occupancy per Leezenbox"
            title={`${averageOccupancy.toFixed(1)}`}
            change="+12.5%"
            changeIcon={<TrendingUp />}
            details="Trending up this month"
          >
            Visitors for the last 6 months <TrendingUp size={20} />
          </LeezenboxStatCard>
        </div>
        <LeezenboxesOverview
          leezenboxes={leezenboxes}
          leezenboxOccupancies={leezenboxOccupancies}
        />
      </div>
      <LeezenboxChart data={chartData} />
    </>
  );
};

export default DashboardPage;
