"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Leezenbox } from "@/types";

const LeezenboxMap = dynamic(() => import("./leezenbox-map"), { ssr: false });

const DynamicLeezenboxMap = ({ data }: { data: Leezenbox[] }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <p>Loading map...</p>;

  return <LeezenboxMap data={data} />;
};

export default DynamicLeezenboxMap;
