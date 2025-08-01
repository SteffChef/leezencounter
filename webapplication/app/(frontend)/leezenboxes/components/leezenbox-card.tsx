import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLatestOccupancyByLeezenboxId } from "@/example-data";
import { Leezenbox } from "@/types";
import { Cpu, Images } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface LeezenboxCardProps {
  leezenbox: Leezenbox;
}

const LeezenboxCard: React.FC<LeezenboxCardProps> = ({ leezenbox }) => {
  const leezenboxData = getLatestOccupancyByLeezenboxId(leezenbox.id);
  const occupancy = leezenboxData?.bikes || 0;
  const progressValue =
    (occupancy / leezenbox.capacity) * 100 < 100
      ? (occupancy / leezenbox.capacity) * 100
      : 100;

  return (
    <Link href={`/leezenboxes/${leezenbox.id}`}>
      <Card className="@container/card hover:shadow-md transition border border-accent dark:shadow-gray-800 hover:bg-sidebar">
        <CardHeader>
          <h2 className="text-lg font-semibold">{leezenbox.name}</h2>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-4">
            <Image
              src="/assets/hiltrup.jpeg"
              alt="Leezenbox Image"
              width={200}
              height={150}
              className="rounded-lg mb-2 w-1/2"
            />
            <div className="flex flex-col justify-around py-2 items-start">
              <div className="flex justify-center gap-1">
                <Cpu className="text-gray-500" />
                <p className="text-sm text-gray-500">Nodes: 2</p>
              </div>
              <div className="flex justify-center gap-1">
                <Images className="text-gray-500" />
                <p className="text-sm text-gray-500">Datapoints: 600</p>
              </div>
            </div>
          </div>
          <p
            className={`${
              occupancy > leezenbox.capacity ? "text-red-500" : ""
            }`}
          >
            {`${occupancy} / ${leezenbox.capacity}`}
          </p>
          <Progress value={progressValue} className={` w-full`} />
        </CardFooter>
      </Card>
    </Link>
  );
};

export default LeezenboxCard;
