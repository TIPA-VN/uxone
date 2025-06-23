import Image from "next/image";

const UserCard = ({
  group,
  customer,
  backlogs,
  inDock,
  inProgress,
}: {
  group: string;
  customer: string[];
  backlogs: number;
  inDock: number;
  inProgress: number;
}) => {
  return (
    <div
      className={`rounded-2xl shadow-md p-5 flex-1 min-w-[200px] max-w-[250px] border border-gray-200 bg-slate-700`}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full shadow-sm">
          Total: {backlogs.toLocaleString()}
        </span>
        <Image src="/images/more.png" alt="menu" width={18} height={18} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm text-slate-100">
          <span>In-Dock</span>
          <span className="font-semibold">{inDock.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-100">
          <span>In-Progress</span>
          <span className="font-semibold">{inProgress.toLocaleString()}</span>
        </div>
      </div>

      <div className="pt-2 border-t text-[13px] text-yellow-200 font-semibold text-center">
        {group}
      </div>

      {(customer?.length ?? 0) > 0 && (
        <div
          className="mt-2 text-[11px] text-center text-gray-300 truncate"
          title={customer.join(", ")}
        >
          {customer.join(", ")}
        </div>
      )}
    </div>
  );
};

export default UserCard;
