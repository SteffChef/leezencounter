import { TrendingUp } from "lucide-react";
import Image from "next/image";
import { getDataPointsByLeezenboxId } from "@/example-data";
import { LeezenboxChart } from "@/components/leezenbox-chart";
import LeezenboxStatCard from "@/components/leezenbox-stat-card";

interface LeezenboxByIdPageProps {
  params: {
    leezenboxId: number;
  };
}

const LeezenboxByIdPage = async ({ params }: LeezenboxByIdPageProps) => {
  const { leezenboxId } = await params;
  const data = await getDataPointsByLeezenboxId(101);
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Image
          src="/assets/hiltrup.jpeg"
          alt="Hiltrup"
          width={500}
          height={300}
          className="w-full aspect-[16/3] lg:aspect-[8/1] object-cover rounded-lg shadow-md "
        />
        <h1 className="absolute bottom-4 left-4 text-white text-3xl font-bold drop-shadow-lg">
          Leezenbox: Münster Hiltrup
        </h1>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <LeezenboxStatCard
          description="Average Occupancy"
          title="29.9 / 40"
          change="+12.5%"
          changeIcon={<TrendingUp />}
          details="Trending up this month"
        >
          Visitors for the last 6 months <TrendingUp size={20} />
        </LeezenboxStatCard>
        <LeezenboxStatCard title="Placeholder..."></LeezenboxStatCard>
        <LeezenboxStatCard title="Placeholder..."></LeezenboxStatCard>
        <LeezenboxStatCard title="Placeholder..."></LeezenboxStatCard>
      </div>
      <LeezenboxChart data={data} />
    </div>
  );
};

export default LeezenboxByIdPage;
