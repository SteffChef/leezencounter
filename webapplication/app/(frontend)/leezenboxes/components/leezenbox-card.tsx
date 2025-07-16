import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Leezenbox } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface LeezenboxCardProps {
  leezenbox: Leezenbox;
}

const LeezenboxCard: React.FC<LeezenboxCardProps> = ({ leezenbox }) => {
  const occupancy = 29; // Example occupancy value
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
          <Image
            src="/assets/hiltrup.jpeg"
            alt="Leezenbox Image"
            width={200}
            height={150}
            className="rounded-lg mb-2"
          />
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
