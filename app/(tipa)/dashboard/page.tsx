import SOBacklogChart from "@/components/SOBacklogChart";
import CountChart from "@/components/CountChart";
import EventCalendar from "@/components/EventCalendar";
import CustomerBacklogTrends from "@/components/PeriodSOBackLogChart";
import CustomerCards from "@/components/CustomerCards";
import { saltAndHashPassword } from "@/lib/hashPassword";
import FrameGroupChart from "@/components/FrameGroupChart";
import DayFrameGroupChart from "@/components/DayFrameGroupChart";

const password = await saltAndHashPassword("Ngoc@n1709");
console.log(password);
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
          {/* ATTENDANCE CHART */}
          <div className="w-full min-w-[250px] lg:w-2/3 h-[450px]">
            {/* <SOBacklogChart /> */}
            <CustomerBacklogTrends />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="w-full h-[500px]">
          
          <FrameGroupChart />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <CustomerCards />
        <DayFrameGroupChart />
      </div>
    </div>
  );
};

export default AdminPage;
