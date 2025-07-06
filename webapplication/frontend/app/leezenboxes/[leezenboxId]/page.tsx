import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import Image from "next/image";
import { getDataPointsByLeezenboxId } from "@/example-data";
import { LeezenboxChart } from "./components/leezenbox-chart";

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
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              $1,250.00
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp />
                +12.5%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Trending up this month <TrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Visitors for the last 6 months
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              Placeholder...
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              Placeholder...
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              Placeholder...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <LeezenboxChart data={data} />
    </div>
  );
};

export default LeezenboxByIdPage;
