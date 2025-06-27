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
      <div className="w-full lg:w-3/4 md:w-3/4 flex flex-col gap-8">
        <div className="flex gap-2 flex-col lg:flex-row">
          <div className="w-full min-w-[300px] lg:w-1/3 max-h-[500px]">
            <CountChart />
          </div>
          <div className="w-full min-w-[250px] lg:w-2/3 max-h-[500px]">
            <CustomerBacklogTrends />
          </div>
        </div>
        <div className="flex gap-2 flex-col lg:flex-row">
          <div className="w-full min-w-[450px] md:w-2/5 lg:w-2/5 max-h-[500px]">
            <DayFrameGroupChart />
          </div>
          <div className="w-full min-w-[450px] md:w-3/5 lg:w-3/5 max-h-[500px]">
            <FrameGroupChart />
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/4 md:w-3/4 flex flex-col gap-8">
        <CustomerCards />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;
