import Image from "next/image";

const Navbar = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-indigo-100 shadow-md text-slate-600 rounded-lg">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 text-xs rounded-full ring-[1.5px] ring-gray-400 px-2">
        <Image src="/images/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        <div className=" rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/images/message.png" alt="" width={20} height={20} />
        </div>
        <div className=" rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image src="/images/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-rose-600 text-white rounded-full text-xs">
            1
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">Eric Nguyen</span>
          <span className="text-[10px] text-gray-500 text-right">Admin</span>
        </div>
        <Image
          src="/images/avatar.png"
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        />
      </div>
    </div>
  );
};

export default Navbar;
