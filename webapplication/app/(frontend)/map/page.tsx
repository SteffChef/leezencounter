import { getLeezenboxs } from "@/actions/get-leezenboxs";
import DynamicLeezenboxMap from "@/components/dynamic-leezenbox-map";
import { Leezenbox } from "@/types";
import AddLeezenboxButton from "./components/AddLeezenboxButton";

const MapPage = async () => {
  const leezenboxdata: Leezenbox[] = await getLeezenboxs();

  return (
    <div className=" h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Leezenbox Locations</h1>
        <AddLeezenboxButton />
      </div>
      <div className="flex-1 flex-col">
        <DynamicLeezenboxMap data={leezenboxdata} />
      </div>
    </div>
  );
};

export default MapPage;
