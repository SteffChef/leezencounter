"use client";

import { Leezenbox } from "@/types";
import LeezenboxCard from "./leezenbox-card";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddLeezenboxSheet from "@/components/add-leezenbox-sheet";

interface LeezenboxOverviewProps {
  // Define any props if needed
  leezenboxData: Leezenbox[];
}

const LeezenboxOverview: React.FC<LeezenboxOverviewProps> = ({
  leezenboxData,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-xl font-bold">Leezenbox Overview</h1>
          <Button className="cursor-pointer" onClick={() => setSheetOpen(true)}>
            Add Leezenbox
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leezenboxData.map((leezenbox) => (
            <LeezenboxCard key={leezenbox.id} leezenbox={leezenbox} />
          ))}
          <Card
            className="@container/card hover:shadow-md transition border border-accent dark:shadow-gray-800 hover:bg-sidebar cursor-pointer"
            onClick={() => setSheetOpen(true)}
          >
            <CardHeader className="w-full justify-center">
              <h2 className="text-lg font-semibold">Add new Leezenbox</h2>
            </CardHeader>
            <CardFooter className="w-full flex justify-center h-full">
              <Plus size={80} />
            </CardFooter>
          </Card>
        </div>
      </div>
      <AddLeezenboxSheet sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} />
    </>
  );
};

export default LeezenboxOverview;
