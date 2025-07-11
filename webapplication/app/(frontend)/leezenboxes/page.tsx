import { getLeezenboxs } from "@/actions/get-leezenboxs";
import { Leezenbox } from "@/types";
import LeezenboxCard from "./components/leezenbox-card";

const LeezenboxPage = async () => {
  const leezenboxdata: Leezenbox[] = await getLeezenboxs();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Leezenbox Locations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leezenboxdata.map((leezenbox) => (
          <LeezenboxCard key={leezenbox.id} leezenbox={leezenbox} />
        ))}
      </div>
    </div>
  );
};

export default LeezenboxPage;
