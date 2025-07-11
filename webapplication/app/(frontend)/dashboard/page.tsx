import LeezenboxesOverview from "./components/leezenboxes-overview";
import LeezenboxStatCard from "@/components/leezenbox-stat-card";
import { TrendingUp } from "lucide-react";
import { getDataPointsByLeezenboxId } from "@/example-data";
import { LeezenboxChart } from "@/components/leezenbox-chart";

const DashboardPage = async () => {
  const data = await getDataPointsByLeezenboxId(101);
  return (
    <>
      <h1 className="text-xl font-bold">Leezenbox Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col justify-between h-full ">
          <LeezenboxStatCard
            description="Total current visitors"
            title="145 / 200"
            change="+12.5%"
            changeIcon={<TrendingUp />}
            details="Trending up this month"
          >
            Visitors for the last 6 months <TrendingUp size={20} />
          </LeezenboxStatCard>
          <LeezenboxStatCard title="Placeholder..." />
          <LeezenboxStatCard title="Placeholder..." />
        </div>
        <LeezenboxesOverview />
      </div>
      <LeezenboxChart data={data} />
    </>
  );
};

export default DashboardPage;
