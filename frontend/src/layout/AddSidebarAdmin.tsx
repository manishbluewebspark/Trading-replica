


import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart2,
  LineChart,
  // Layers,
  Workflow,
  History,
  Building2,
  Users as UsersIcon,
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
    path: "/admin/deshboard",
    roles: ["admin", "user"],
  },
  {
    icon: <ClipboardList size={20} />,
   name: "Current Position",
    path: "/admin/order",
    roles: ["admin", "user"],
  },

 
    {
    icon: <LineChart size={20} />,
    name: "Holding",
    path: "/admin/holding/order",
    roles: ["admin", "user"],
  },
  {
    icon: <BarChart2 size={20} />,
    name: "Instrument",
    path: "/admin/instrument",
    roles: ["admin", "user"],
  },
  {
    icon: <History size={20} />,
   name: "Orders History",
    path: "/admin/trades",
    roles: ["admin", "user"],
  },
    {
    icon: <History size={20} />,
   name: "Rejected History",
    path: "/admin/rejected/history",
    roles: ["admin", "user"],
  },
  {
    icon: <UsersIcon size={20} />,
    name: "Users",
    roles: ["admin", "user"],
    subItems: [
      {
        name: "All Users",
        path: "/admin/usertable",
        roles: ["admin", "user"],
      },
      {
        name: "User Report",
        path: "/admin/user-report",
        roles: ["admin"],
      },
       {
        name: "User Clone",
        path: "/admin/user-clone",
        roles: ["admin"],
      },
       {
        name: "User Pnl Report",
        path: "/admin/check/userpnl",
        roles: ["admin"],
      },
      //   {
      //   name: "Order",
      //   path: "/admin/insert/order",
      //   roles: ["admin"],
      // },
    ],
  },
  {
    icon: <Building2 size={20} />,
    name: "Broker",
    path: "/admin/broker",
    roles: ["admin", "user"],
  },
  {
    icon: <Workflow size={20} />,
    name: "Assign Strategy",
    path: "/admin/strategy",
    roles: ["admin", "user"],
  },
];

const othersItems: NavItem[] = [];

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

const AddAppSidebarAdmin: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const [userRole, setUserRole] = useState<Role>("user");

  // which submenu is open
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.role === "admin" || parsedUser?.role === "user") {
          setUserRole(parsedUser.role);
        }
      } catch {
        console.error("Invalid user data in localStorage");
      }
    }
  }, []);

  const filteredNavItems = filterNavItems(navItems, userRole);
  const filteredOthersItems = filterNavItems(othersItems, userRole);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // 🔹 Toggle submenu open/close when clicking parent
  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const isOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <>
                {/* Parent button (Users) – wrapper button is clickable, inner div has styling */}
                <button
                  type="button"
                  onClick={() => handleSubmenuToggle(index, menuType)}
                  className="w-full text-left"
                >
                  <div
                    className={`menu-item group ${
                      isOpen ? "menu-item-active" : "menu-item-inactive"
                    } cursor-pointer ${
                      !isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "lg:justify-start"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size ${
                        isOpen
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <ChevronDownIcon
                        className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-brand-500" : ""
                        }`}
                      />
                    )}
                  </div>
                </button>

                {/* Submenu */}
                {(isExpanded || isHovered || isMobileOpen) && isOpen && (
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          onClick={() => {
                            // 🔹 Close submenu after clicking a child
                            setOpenSubmenu(null);
                          }}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
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
                )}
              </>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
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
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
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
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
       <Link to="/admin/deshboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden items-center justify-center"
                // src="/images/logo/logo.png"
                   src="/logo.svg"
                alt="Logo"
                width={200}
                height={20}
              />
              <img
                className="hidden dark:block"
                // src="/images/logo/logo-dark.svg"
                   src="/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              // src="/images/logo/logo-icon.svg"
               src="/logo.svg"
              alt="Logo"
              width={30}
              height={30}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>

            {filteredOthersItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Others"
                  ) : (
                    <HorizontaLDots />
                  )}
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

export default AddAppSidebarAdmin;

