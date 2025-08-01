import LeezenboxesOverview from "./components/leezenboxes-overview";
import LeezenboxStatCard from "@/components/leezenbox-stat-card";
import { TrendingUp } from "lucide-react";
import {
  getDataPointsByLeezenboxId,
  getLatestOccupancyForAllLeezenboxes,
} from "@/example-data";
import { LeezenboxChart } from "@/components/leezenbox-chart";
import { getLeezenboxs } from "@/actions/get-leezenboxs";

const DashboardPage = async () => {
  const leezenboxes = await getLeezenboxs();
  const data = getDataPointsByLeezenboxId(1);
  const leezenboxOccupancies = await getLatestOccupancyForAllLeezenboxes();

  const currentOccupancy = Object.values(leezenboxOccupancies).reduce(
    (acc, occupancy) => acc + occupancy.bikes,
    0
  );

  const totalCapacity = Object.values(leezenboxes).reduce(
    (acc, box) => acc + box.capacity,
    0
  );

  const averageOccupancy =
    data.reduce((acc, point) => {
      const bikes = point.predictions.filter((p) => p.category === 1).length;
      return acc + bikes;
    }, 0) / data.length;

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
      <LeezenboxChart data={data} />
    </>
  );
};

export default DashboardPage;
