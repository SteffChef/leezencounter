import { LinearChart } from "@/components/linear-chart";

const DashboardPage = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <LinearChart />
      <LinearChart />
      <LinearChart />
    </div>
  );
};

export default DashboardPage;
