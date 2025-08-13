import LeezenboxesOverview from "./components/leezenboxes-overview";
import LeezenboxStatCard from "@/components/leezenbox-stat-card";
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Users,
  BarChart3,
  Activity,
} from "lucide-react";
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

  // Get chart data - aggregate data from all leezenboxes
  let chartData: DataPoint[] = [];
  const allLeezenboxData = await Promise.all(
    leezenboxes.map(async (leezenbox) => {
      if (leezenbox.demo) {
        // Generate mock data for demo leezenbox
        return generateExampleDataForLeezenboxes([leezenbox.id]);
      } else {
        // Get real data for non-demo leezenbox
        return await getLeezenboxDataForMultiple([
          {
            id: leezenbox.id,
            demo: leezenbox.demo,
            ttn_location_key: leezenbox.ttn_location_key,
          },
        ]);
      }
    })
  );

  // Flatten and combine all data
  chartData = allLeezenboxData.flat();

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

  // Calculate additional statistics
  const totalLocations = leezenboxes.length;
  const activeLocations = Object.values(leezenboxOccupancies).filter(
    (occupancy) => occupancy.bikes > 0
  ).length;

  // Calculate occupancy rate as percentage
  const occupancyRate =
    totalCapacity > 0 ? (currentOccupancy / totalCapacity) * 100 : 0;

  // Calculate peak occupancy from last 24 hours of chart data
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const recent24hData = chartData.filter(
    (point) => new Date(point.received_at) >= last24Hours
  );

  const peakOccupancy =
    recent24hData.length > 0
      ? Math.max(...recent24hData.map((point) => point.predictions.length))
      : 0;

  // Calculate change percentage (mock calculation - you could enhance this with historical data)
  const mockChangePercentage = Math.random() * 20 - 10; // Random between -10% and +10%
  const isPositiveChange = mockChangePercentage >= 0;

  return (
    <>
      <h1 className="text-xl font-bold">Leezenbox Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ">
        <LeezenboxStatCard
          description="Current Occupancy"
          title={`${currentOccupancy} / ${totalCapacity}`}
          change={`${occupancyRate.toFixed(1)}%`}
          changeIcon={occupancyRate > 50 ? <TrendingUp /> : <BarChart3 />}
          details={`${occupancyRate.toFixed(1)}% capacity used`}
        >
          Total Capacity <Users size={20} />
        </LeezenboxStatCard>

        <LeezenboxStatCard
          description="Active Locations"
          title={`${activeLocations} / ${totalLocations}`}
          change={`${((activeLocations / totalLocations) * 100).toFixed(0)}%`}
          changeIcon={<MapPin />}
          details={`${totalLocations - activeLocations} locations empty`}
        >
          Locations Status <MapPin size={20} />
        </LeezenboxStatCard>

        <LeezenboxStatCard
          description="Average Occupancy"
          title={`${averageOccupancy.toFixed(1)}`}
          change={`${isPositiveChange ? "+" : ""}${mockChangePercentage.toFixed(
            1
          )}%`}
          changeIcon={isPositiveChange ? <TrendingUp /> : <TrendingDown />}
          details="Per observation period"
        >
          Avg. Bikes/Period <BarChart3 size={20} />
        </LeezenboxStatCard>

        <LeezenboxStatCard
          description="24h Peak"
          title={`${peakOccupancy}`}
          change="Last 24h"
          changeIcon={<Activity />}
          details="Maximum concurrent bikes"
        >
          Peak Activity <Activity size={20} />
        </LeezenboxStatCard>
      </div>

      <div className="">
        <LeezenboxesOverview
          leezenboxes={leezenboxes}
          leezenboxOccupancies={leezenboxOccupancies}
        />
      </div>

      <LeezenboxChart data={chartData} aggregateData={true} />
    </>
  );
};

export default DashboardPage;
