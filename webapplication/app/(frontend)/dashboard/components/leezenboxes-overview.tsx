import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Leezenbox, LeezenboxOccupancies } from "@/types";
import Link from "next/link";

interface LeezenboxesOverviewProps {
  leezenboxes: Leezenbox[];
  leezenboxOccupancies: LeezenboxOccupancies;
}

const LeezenboxesOverview: React.FC<LeezenboxesOverviewProps> = async ({
  leezenboxes,
  leezenboxOccupancies,
}) => {
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
      <CardFooter className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        {leezenboxes.map((leezenbox) => (
          <Link
            href={`/leezenboxes/${leezenbox.id}`}
            key={leezenbox.id}
            className="w-full px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition dark:shadow-gray-800 hover:bg-sidebar border border-accent"
          >
            <h3 className="text-md font-medium">{leezenbox.name}</h3>
            <p className="text-sm text-gray-500">
              {leezenboxOccupancies[leezenbox.id]?.bikes || 0} /{" "}
              {leezenbox.capacity}
            </p>
            <Progress
              value={
                ((leezenboxOccupancies[leezenbox.id]?.bikes || 0) /
                  leezenbox.capacity) *
                  100 <
                100
                  ? ((leezenboxOccupancies[leezenbox.id]?.bikes || 0) /
                      leezenbox.capacity) *
                    100
                  : 100
              }
              className={`w-full`}
            />
          </Link>
        ))}
      </CardFooter>
    </Card>
  );
};

export default LeezenboxesOverview;
