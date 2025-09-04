"use client";

import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLatestOccupancyByLeezenbox } from "@/actions/get-leezenbox-data";
import { Leezenbox } from "@/types";
import { Cpu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LeezenboxCardProps {
  leezenbox: Leezenbox;
}

const LeezenboxCard: React.FC<LeezenboxCardProps> = ({ leezenbox }) => {
  const [occupancy, setOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        // Use the async function for both demo and real data
        const occupancyData = await getLatestOccupancyByLeezenbox(
          leezenbox.id,
          leezenbox.demo,
          leezenbox.ttn_location_key
        );
        setOccupancy(occupancyData.bikes);
      } catch (error) {
        console.error("Error fetching occupancy:", error);
        setOccupancy(0);
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancy();
  }, [leezenbox.id, leezenbox.demo, leezenbox.ttn_location_key]);

  const progressValue =
    (occupancy / leezenbox.capacity) * 100 < 100
      ? (occupancy / leezenbox.capacity) * 100
      : 100;

  return (
    <Link href={`/leezenboxes/${leezenbox.id}`}>
      <Card className="@container/card hover:shadow-md transition border border-accent dark:shadow-gray-800 hover:bg-sidebar">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{leezenbox.name}</h2>
            {leezenbox.demo && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Demo
              </span>
            )}
          </div>
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
                <p className="text-sm text-gray-500">Nodes: 1</p>
              </div>
            </div>
          </div>
          <p
            className={`${
              occupancy > leezenbox.capacity ? "text-red-500" : ""
            }`}
          >
            {loading ? "Loading..." : `${occupancy} / ${leezenbox.capacity}`}
          </p>
          <Progress value={loading ? 0 : progressValue} className={` w-full`} />
        </CardFooter>
      </Card>
    </Link>
  );
};

export default LeezenboxCard;
