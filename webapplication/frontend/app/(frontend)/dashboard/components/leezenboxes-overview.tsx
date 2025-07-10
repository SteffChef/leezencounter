import { getLeezenboxs } from "@/actions/get-leezenboxs";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const LeezenboxesOverview = async () => {
  const leezenboxes = await getLeezenboxs();
  const occupancy = 29; // Example occupancy value
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Leezenboxes Overview</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Current visitors in all leezenboxes
          </span>
          <span className="@[540px]/card:hidden">Selected period</span>
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {leezenboxes.map((leezenbox) => (
          <Link
            href={`/leezenboxes/${leezenbox.id}`}
            key={leezenbox.id}
            className="w-full mb-2 bg-accent px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h3 className="text-md font-medium">{leezenbox.name}</h3>
            <p className="text-sm text-gray-500">
              {occupancy} / {leezenbox.capacity}
            </p>
            <Progress
              value={
                (occupancy / leezenbox.capacity) * 100 < 100
                  ? (occupancy / leezenbox.capacity) * 100
                  : 100
              }
              className={` w-full`}
            />
          </Link>
        ))}
      </CardFooter>
    </Card>
  );
};

export default LeezenboxesOverview;
