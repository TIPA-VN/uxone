import { BsCart4 } from "react-icons/bs";
import { GiCargoShip } from "react-icons/gi";
import { GoPeople } from "react-icons/go";
import { HiOutlineShieldCheck, HiOutlineUserGroup } from "react-icons/hi";
import { ImBooks, ImCalendar } from "react-icons/im";
import { IoHome } from "react-icons/io5";
import { LiaPencilRulerSolid, LiaToolsSolid } from "react-icons/lia";
import { MdEngineering } from "react-icons/md";
import { VscSettingsGear } from "react-icons/vsc";

export const SidebarLinks = [
  {
    title: "MENU",
    items: [
      {
        imgURL: "/assets/home.svg",
        route: "/lvm",
        label: "Home",
        icon: <IoHome />,
      },
      {
        route: "/projects/dashboard",
        label: "Projects",
        icon: <ImBooks />,
      },
      {
        route: "/lvm/planning",
        label: "Planning",
        icon: <ImCalendar />,
      },
      {
        imgURL: "/assets/heart.svg",
        route: "/lvm/logistics",
        label: "Logistics",
        icon: <GiCargoShip />,
      },
      {
        imgURL: "/assets/heart.svg",
        route: "/lvm/purchasing",
        label: "Purchasing",
        icon: <BsCart4 />,
      },
      {
        imgURL: "/assets/heart.svg",
        route: "/lvm/qa",
        label: "QA",
        icon: <LiaPencilRulerSolid />,
      },
      {
        imgURL: "/assets/create.svg",
        route: "/lvm/qc",
        label: "QC",
        icon: <HiOutlineShieldCheck />,
      },
      {
        imgURL: "/assets/search.svg",
        route: "/lvm/pm",
        label: "PM",
        icon: <MdEngineering />,
      },
      {
        imgURL: "/assets/search.svg",
        route: "/lvm/fm",
        label: "FM",
        icon: <LiaToolsSolid />,
      },
      {
        imgURL: "/assets/community.svg",
        route: "/lvm/hra",
        label: "HRA",
        icon: <HiOutlineUserGroup />,
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        imgURL: "/assets/other.svg",
        route: "/lvm/other",
        label: "Profile",
        icon: <GoPeople />,
      },
      {
        imgURL: "/assets/other.svg",
        route: "/lvm/other",
        label: "Settings",
        icon: <VscSettingsGear />,
      }
    ],
  },
];
