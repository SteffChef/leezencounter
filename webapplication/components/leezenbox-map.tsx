// components/LeezenboxMap.tsx
"use client"; // if using App Router

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Leezenbox } from "@/types"; // adjust to your project
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { useState } from "react";
import { Button } from "./ui/button";
import { LinearChart } from "./linear-chart";
import Link from "next/link";
import { Search } from "lucide-react";

// Fix Leaflet's default icon issues in Next.js
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

type Props = {
  data: Leezenbox[];
};

export default function LeezenboxMap({ data }: Props) {
  const [selectedBox, setSelectedBox] = useState<Leezenbox | null>(null);

  return (
    <>
      <MapContainer
        center={[51.9625, 7.6256]}
        zoom={13}
        className="rounded-xl w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((box) => (
          <Marker key={box.id} position={[box.latitude, box.longitude]}>
            <Popup>
              <strong>{box.name}</strong>
              <br />
              {box.address}
              <br />
              {box.postcode} {box.city}
              <br />
              Lockers with power: {box.num_lockers_with_power}
              <br />
              <div className="flex justify-end w-full mt-2">
                <Button
                  className="cursor-pointer h-8"
                  onClick={() => setSelectedBox(box)}
                >
                  Details
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <Sheet open={!!selectedBox} onOpenChange={() => setSelectedBox(null)}>
        <SheetContent className=" sm:max-w-[50vw] max-w-[80vw] md:max-w-[40vw] lg:max-w-[30vw] p-4">
          <SheetHeader>
            <SheetTitle>{selectedBox?.name}</SheetTitle>
            <SheetDescription>
              {selectedBox?.address}, {selectedBox?.postcode}{" "}
              {selectedBox?.city}
              <br />
              Lockers with power: {selectedBox?.num_lockers_with_power}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <LinearChart />
          </div>
          <Link
            href={`/leezenboxes/${selectedBox?.id}`}
            className="flex items-center p-4 bg-accent rounded-lg shadow-md hover:shadow-lg transition ml-auto mt-auto"
          >
            <Search className="mr-2" />
            <span>More details</span>
          </Link>
        </SheetContent>
      </Sheet>
    </>
  );
}
