import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom"; // ✅ FIXED
import {
  BoxCubeIcon,
  ChevronDownIcon,
  HorizontaLDots,
  // ListIcon,
  PieChartIcon,
  TableIcon,
  // UserCircleIcon,
} from "../icons";
// import UsersIcon from "../icons/users.svg"
// import BrokerIcon from "../icons/broker.svg";
// import { RiBroadcastFill } from "react-icons/ri";
// import { TbLogs } from "react-icons/tb";


import {
  LayoutDashboard,
  ClipboardList,
  BarChart2,
  // FileText,
  // Settings,
  // Activity,
  // PieChart,
  // Radio,
  // HelpCircle,
  // Briefcase,
  LineChart,
  // Layers,
  // ChartCandlestick,
} from "lucide-react";



import { useSidebar } from "../context/SidebarContext";




type Role = "admin" | "user";

type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  roles?: Role[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: Role[];
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
 {
    icon: <LayoutDashboard size={20} />,
    name: "Dashboard",
    path: "/new/deshboard",
    roles: ["admin", "user"],
  },

  // {
  //   icon: <ChartCandlestick size={20} />,
  //   name: "Watch List",
  //   path: "/new-watch",
  //   roles: ["admin", "user"],
  // },

  {
    icon: <ClipboardList size={20} />,
    name: "Orders",
    path: "/order",
    roles: ["admin", "user"],
  },
  {
    icon: <BarChart2 size={20} />,
    name: "Instrument",
    path: "/instrument",
    roles: ["admin", "user"],
  },
  // {
  //   icon: <Layers size={20} />,
  //   name: "Nifty-Bank Instrument",
  //   path: "/instrument/niftyandbanknifty",
  //   roles: ["admin", "user"],
  // },
  {
    icon: <LineChart size={20} />,
    name: "Trades",
    path: "/trades",
    roles: ["admin", "user"],
  },
  
  // {
  //   icon: <Briefcase size={20} />,
  //   name: "Management",
  //   path: "/management",
  //   roles: ["admin", "user"],
  // },
  // {
  //   icon: <FileText size={20} />,
  //   name: "Order Logs",
  //   path: "/order-logs",
  //   roles: ["admin", "user"],
  // },
  // {
  //   icon: <Activity size={20} />,
  //   name: "Activity Logs",
  //   path: "/activity-logs",
  //   roles: ["admin", "user"],
  // },
  // {
  //   icon: <Settings size={20} />,
  //   name: "Trade Setting",
  //   path: "/trade-setting",
  //   roles: ["admin", "user"],
  // },
  // {
  //   icon: <PieChart size={20} />,
  //   name: "Option Analytics",
  //   path: "/option-analytics",
  //   roles: ["admin", "user"],
  // },
  // {
  //   icon: <Radio size={20} />,
  //   name: "Broadcast Messages",
  //   path: "/broadcast-analytics",
  //   roles: ["admin", "user"],
  // },
  // {
  //   icon: <HelpCircle size={20} />,
  //   name: "Support",
  //   path: "/support",
  //   roles: ["admin", "user"],
  // },

 
  // {
  //   icon: <img src={BrokerIcon} alt="Users" className="w-5 h-5" />,
  //   name: "User Position",
  //   path: "",
  //   roles: ["admin", "user"],
  // },
  // {
  //   icon: <UserCircleIcon />,
  //   name: "Users",
  //   subItems: [
  //     { name: "All Users", path: "/all-users", roles: ["admin"] },
  //     { name: "Users Report", path: "/user-reports", roles: ["admin", "user"] },
  //   ],
  //   roles: ["admin"],
  // },
  // {
  //   icon: <img src={UsersIcon} alt="Users" className="w-5 h-5" />,
  //   name: "Brokers",
  //   path: "/brokers",
  //   roles: ["admin"],
  // },
  //   {
  //   icon: <RiBroadcastFill />,
  //   name: "Broadcast",
  //   path: "/broadcast",
  //   roles: ["admin"],
  // },
  //   {
  //   icon: <TbLogs />,
  //   name: "Activity Logs",
  //   path: "/activity-logs",
  //   roles: ["admin"],
  // },  
  //   {
  //   name: "Reports",
  //   icon: <ListIcon />,
  //   subItems: [
  //     { name: "License Report", path: "/license-report", roles: ["admin"] },
  //     { name: "PPO Report", path: "/error-404", roles: ["admin"] },
  //   ],
  //   roles: ["admin"],
  // },
  // {
  //   name: "Forms",
  //   icon: <ListIcon />,
  //   subItems: [
  //     { name: "Form Elements", path: "/form-elements", roles: ["admin"] },],
  //   roles: ["admin"],
  // },
  {
    name: "Tables",
    icon: <TableIcon />,
    subItems: [{ name: "Basic Tables", path: "/basic-tables", roles: ["admin"] }],
    roles: ["admin"],
  },
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank", roles: ["admin"] },
  //     { name: "404 Error", path: "/error-404", roles: ["admin", "user"] },
  //   ],
  //   roles: ["admin", "user"],
  // },
];



const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", roles: ["admin"] },
      { name: "Bar Chart", path: "/bar-chart", roles: ["admin"] },
    ],
    roles: ["admin"],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", roles: ["admin"] },
      { name: "Avatar", path: "/avatars", roles: ["admin"] },
      { name: "Badge", path: "/badge", roles: ["admin"] },
      { name: "Buttons", path: "/buttons", roles: ["admin"] },
      { name: "Images", path: "/images", roles: ["admin"] },
      { name: "Videos", path: "/videos", roles: ["admin"] },
    ],
    roles: ["admin"],
  },
  // {
  //   icon: <PlugInIcon />,
  //   name: "Authentication",
  //   subItems: [
  //     { name: "Sign In", path: "/signin", roles: ["admin", "user"] },
  //     { name: "Sign Up", path: "/signup", roles: ["admin", "user"] },
  //   ],
  //   roles: ["admin", "user"],
  // },
];

const filterNavItems = (items: NavItem[], role: Role): NavItem[] => {
  return items
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => {
      const subItems = item.subItems?.filter(
        (sub) => !sub.roles || sub.roles.includes(role)
      );
      return { ...item, subItems };
    })
    .filter((item) => item.path || (item.subItems && item.subItems.length > 0));
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const [userRole, setUserRole] = useState<Role>("user");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.role === "admin" || parsedUser?.role === "user") {
          setUserRole(parsedUser.role);
        }
      } catch (err) {
        console.error("Invalid user data in localStorage");
      }
    }
  }, []);

  const filteredNavItems = filterNavItems(navItems, userRole);
  const filteredOthersItems = filterNavItems(othersItems, userRole);

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let matched = false;
    ["main", "others"].forEach((type) => {
      const items = type === "main" ? filteredNavItems : filteredOthersItems;
      items.forEach((item, index) => {
        item.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: type as "main" | "others", index });
            matched = true;
          }
        });
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [location.pathname]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: el.scrollHeight,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev.index === index ? null : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const key = `${menuType}-${index}`;
        const isOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${isOpen ? "menu-item-active" : "menu-item-inactive"
                  } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : ""
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {subMenuRefs.current && nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[key] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{ height: isOpen ? `${subMenuHeight[key] || 0}px` : "0px" }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden items-center justify-center ml-15"
                src="/images/logo/logo.png"
                alt="Logo"
                width={100}
                height={20}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
            {filteredOthersItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontaLDots />}
                </h2>
                {renderMenuItems(filteredOthersItems, "others")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
