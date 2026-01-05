import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
// import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { toast } from "react-toastify";
import axios from "axios";

type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string;
  sequenceNumber: number;
  exchangeTimestamp: string;
  ltpPaiseOrRaw: number;
  ltp: number;
};


import { getSocket } from ".././socket/Socket";

const AppHeader: React.FC = () => {

    const API_URL = import.meta.env.VITE_API_URL;

  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();



  const lastTickTime = useRef<number>(Date.now());


  const [userPackageName, setUserPackageName] = useState("");
  const [userUserPackageDate, setUserPackageDate] = useState("");
    const [userRole, setUserRole] = useState("");


    const [nifty, setNifty] = useState<number | null>(
  localStorage.getItem("NIFTY_PRICE")
    ? Number(localStorage.getItem("NIFTY_PRICE"))
    : null
);

const [bankNifty, setBankNifty] = useState<number | null>(
  localStorage.getItem("BANKNIFTY_PRICE")
    ? Number(localStorage.getItem("BANKNIFTY_PRICE"))
    : null
);



  // Example: Replace with real API or WebSocket later
  useEffect(() => {


     // Simulated values for demo
      const socket = getSocket();
      
          const onTick = (tick: Tick) => {

            // console.log(tick,'app header');

             lastTickTime.current = Date.now();

            let nifty_50_token = '99926000'
            let bank_nifty_token = '99926009'
            
           // Match tokens & update only the correct state
            if (tick.token === nifty_50_token) {
              setNifty(tick.ltp);
                localStorage.setItem("NIFTY_PRICE", tick.ltp.toString());

            } else if (tick.token === bank_nifty_token) {

              setBankNifty(tick.ltp);
             localStorage.setItem("BANKNIFTY_PRICE", tick.ltp.toString());
            }
            
            
          };
      
          socket.on("tick", onTick);


              // ✅ Call API after fetching local data
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/getuser/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // optional
          },
        });

         let resData = response.data

         console.log(resData,'resData');

         
         
         if(resData.status==true){

           setUserPackageName(resData.data.packageName)
           setUserPackageDate(resData.data.packageDate)
             setUserRole(resData.data.role)
          

         }else{
           toast.error("Something went wrong");
         }
        
      } catch (error) {
         toast.error("Something went wrong");
       
      }
    };

    fetchUserData(); // call function
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          <Link to="/" className="lg:hidden">
            <img
              className="dark:hidden"
              src="./images/logo/logo.svg"
              alt="Logo"
            />
            <img
              className="hidden dark:block"
              src="./images/logo/logo-dark.svg"
              alt="Logo"
            />
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

       {/* Left side */}
<div className="flex items-center gap-20 pl-20">
 

      {/* Nifty 50 */}
      <a
        href="https://www.tradingview.com/chart/UEWMwVlE/?symbol=NSE%3ANIFTY"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-start hover:text-blue-600 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900">Nifty 50</span>
        <span className="text-[13px] font-medium text-gray-600">
          {nifty ? nifty.toFixed(2) : "--"}
        </span>
      </a>

      {/* Bank Nifty */}
      <a
        href="https://www.tradingview.com/chart/?symbol=NSE%3ABANKNIFTY"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-start hover:text-blue-600 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900">Bank Nifty</span>
        <span className="text-[13px] font-medium text-gray-600">
          {bankNifty ? bankNifty.toFixed(2) : "--"}
        </span>
      </a>
    </div>


          {/* <div className="hidden lg:block">
              <div>{userPackageName}</div> 
                <div>{userUserPackageDate}</div> 
          </div> */}
{userRole === 'user' && userPackageName && userUserPackageDate && (
  <div className="hidden lg:block flex justify-center ml-12">
    <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-3 w-fit">
      <div className="text-green-800 font-semibold text-lg flex items-center gap-2">
        <span className="font-extrabold">{userPackageName}</span> : is ACTIVE
      </div>

      <div className="text-green-800 font-medium whitespace-nowrap">
        Valid till: {userUserPackageDate}
      </div>
    </div>
  </div>
)}
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            {/* <!-- Dark Mode Toggler --> */}
            {/* <ThemeToggleButton /> */}
            
            {/* <!-- Dark Mode Toggler --> */}
            {/* <NotificationDropdown /> */}
            {/* <!-- Notification Menu Area --> */}
          </div>
          {/* <!-- User Area --> */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
