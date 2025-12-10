
import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { Link,useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function MonthlyTarget() {

  const apiUrl = import.meta.env.VITE_API_URL as string;
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [series, setSeries] = useState<number[]>([0, 0]);
  const [generatedUsers, setGeneratedUsers] = useState<any[]>([]);
  const [notGeneratedUsers, setNotGeneratedUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState<any[]>([]);
  const [activeLabel, setActiveLabel] = useState("");

  // Fetch token stats from backend
  useEffect(() => {
    fetchTokenStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTokenStatus() {
    try {
      const { data } = await axios.get(`${apiUrl}/admin/tokenstatussummary`,
         {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      }

      );

     if(data.status==true) {

      setSeries([data.generatedCount || 0, data.notGeneratedCount || 0]);
      setGeneratedUsers(data.generatedUsers || []);
      setNotGeneratedUsers(data.notGeneratedUsers || []);
      setActiveUsersList(data.generatedUsers || []);
      setActiveLabel("Token Generated Users");

     }else if(data.status==false&&data.message=='Unauthorized'){

       localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");

       navigate("/");

            
     }else{
            toast.error(data.error);    
     }
      
    } catch (err:any) {

      toast.error(err.message);    
    
    }
  }

  const options: ApexOptions = {
    colors: ["#1C64F2", "#E74694"],
    chart: {
      height: 320,
      width: "100%",
      type: "donut",
      events: {
        // IMPORTANT: correct signature (event, chartContext, config)
        dataPointSelection: (_event, _chartContext, config) => {
          const index = config.dataPointIndex;

          if (index === 0) {
            // First slice: "Token Generated"
            setActiveUsersList(generatedUsers);
            setActiveLabel("Token Generated Users");
          } else if (index === 1) {
            // Second slice: "Token Not Generated"
            setActiveUsersList(notGeneratedUsers);
            setActiveLabel("Token Not Generated Users");
          } else {
            return; // clicked somewhere else (e.g., center)
          }

          setShowModal(true);
        },
      },
      fontFamily: "Inter, sans-serif",
    },
    stroke: {
      colors: ["transparent"],
    },
    plotOptions: {
      pie: {
        donut: {
          size: "80%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Tokens",
              formatter: (w) =>
                w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0
                ),
            },
          },
        },
      },
    },
    labels: ["Token Generated", "Token Not Generated"],
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
    },
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Token Status
              </h3>
              <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                Overview of token generation
              </p>
            </div>

            <div className="relative inline-block">
              <button
                className="dropdown-toggle"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
              </button>

              <Dropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                className="w-40 p-2"
              >
                <DropdownItem onItemClick={() => setIsOpen(false)}>
                  <Link to="/token-status" className="w-full h-full block">
                    View More
                  </Link>
                </DropdownItem>
              </Dropdown>
            </div>
          </div>

          <div className="mt-6">
            <Chart options={options} series={series} type="donut" height={320} />
          </div>
        </div>
      </div>

      {/* Modal for showing user list */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-xl w-96 shadow-lg">
            <h2 className="text-xl font-semibold mb-3">{activeLabel}</h2>

            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {activeUsersList.length === 0 && (
                <li className="text-gray-500 text-sm">No users found.</li>
              )}

              {activeUsersList.map((u) => (
                <li
                  key={u._id}
                  className="p-2 border rounded flex justify-between items-center text-sm"
                >
                  <span>{`${u.firstName || ""} ${u.lastName || ""}`}</span>
                  <span className="text-gray-500">{u._id}</span>
                </li>
              ))}
            </ul>

            <button
              className="mt-4 bg-blue-600 text-white p-2 rounded w-full"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
