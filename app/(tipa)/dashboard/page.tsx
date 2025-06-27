import CountChart from "@/components/CountChart";
import CustomerBacklogTrends from "@/components/PeriodSOBackLogChart";
import CustomerCards from "@/components/CustomerCards";
import FrameGroupChart from "@/components/FrameGroupChart";
import DayFrameGroupChart from "@/components/DayFrameGroupChart";
import Announcements from "@/components/Announcements";
const AdminPage = () => {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full min-w-[300px] lg:w-1/3 h-[450px]">
            <CountChart />
          </div>
          <div className="w-full min-w-[250px] lg:w-2/3 h-[450px]">
            <CustomerBacklogTrends />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="flex gap-4 md:flex-row lg:flex-row">
          <div className="w-full min-w-[250px] lg:w-1/2 h-[300px]">
            <DayFrameGroupChart />
          </div>
          <div className="w-full min-w-[250px] lg:w-1/2 h-[300px]">
            <FrameGroupChart />
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <CustomerCards />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;
