import { getLeezenboxs } from "@/actions/get-leezenboxs";
import { Leezenbox } from "@/types";
import LeezenboxOverview from "./components/leezenbox-overview";

const LeezenboxPage = async () => {
  const leezenboxdata: Leezenbox[] = await getLeezenboxs();

  return <LeezenboxOverview leezenboxData={leezenboxdata} />;
};

export default LeezenboxPage;
