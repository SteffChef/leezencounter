import { TrendingUp } from "lucide-react";
import Image from "next/image";
import { getDataPointsByLeezenboxId } from "@/example-data";
import { LeezenboxChart } from "@/components/leezenbox-chart";
import LeezenboxStatCard from "@/components/leezenbox-stat-card";
import { getLeezenboxById } from "@/actions/get-leezenboxs";
import { Separator } from "@/components/ui/separator";
import DeleteLeezenboxButton from "./components/delete-leezenbox-button";

interface LeezenboxByIdPageProps {
  params: Promise<{
    leezenboxId: string;
  }>;
}

const LeezenboxByIdPage = async ({ params }: LeezenboxByIdPageProps) => {
  const { leezenboxId } = await params;
  const leezenboxIdNumber = Number(leezenboxId);
  const leezenbox = await getLeezenboxById(leezenboxIdNumber);
  const data = getDataPointsByLeezenboxId(leezenboxIdNumber);

  const averageOccupancy =
    data.reduce((acc, point) => {
      const bikes = point.predictions.filter((p) => p.category === 1).length;
      return acc + bikes;
    }, 0) / data.length;

  const lowestOccupancy = Math.min(
    ...data.map(
      (point) => point.predictions.filter((p) => p.category === 1).length
    )
  );
  const highestOccupancy = Math.max(
    ...data.map(
      (point) => point.predictions.filter((p) => p.category === 1).length
    )
  );
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
        <h1 className="absolute bottom-4 left-4 text-white text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
          {leezenbox?.name || "Leezenbox"} <br />
          <p className="text-sm sm:text-base md:text-lg drop-shadow-lg">
            {leezenbox?.address || "Address not available"} <br />
            {leezenbox?.postcode ? `${leezenbox.postcode} ` : ""}
            {leezenbox?.city || "City not available"}
          </p>
        </h1>
      </div>
      <LeezenboxChart data={data} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <LeezenboxStatCard
          description="Average Occupancy"
          title={averageOccupancy.toFixed(2) + " / " + leezenbox?.capacity}
          change="+12.5%"
          changeIcon={<TrendingUp />}
          details="Trending up this month"
        >
          Visitors for the last 6 months <TrendingUp size={20} />
        </LeezenboxStatCard>
        <LeezenboxStatCard
          description="Lowest Occupancy"
          title={lowestOccupancy.toFixed(2) + " / " + leezenbox?.capacity}
          change="+12.5%"
          changeIcon={<TrendingUp />}
          details="Trending up this month"
        >
          Visitors for the last 6 months <TrendingUp size={20} />
        </LeezenboxStatCard>
        <LeezenboxStatCard
          description="Highest Occupancy"
          title={highestOccupancy.toFixed(2) + " / " + leezenbox?.capacity}
          change="+12.5%"
          changeIcon={<TrendingUp />}
          details="Trending up this month"
        >
          Visitors for the last 6 months <TrendingUp size={20} />
        </LeezenboxStatCard>
        <LeezenboxStatCard title="Placeholder..."></LeezenboxStatCard>
      </div>
      <Separator className="my-4" />
      <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
      <div>
        <DeleteLeezenboxButton leezenboxId={leezenboxIdNumber} />
      </div>
    </div>
  );
};

export default LeezenboxByIdPage;
