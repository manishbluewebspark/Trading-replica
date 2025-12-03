// import { useState } from "react";
// import Chart from "react-apexcharts";
// import { ApexOptions } from "apexcharts";
// import { Dropdown } from "../ui/dropdown/Dropdown";
// import { DropdownItem } from "../ui/dropdown/DropdownItem";
// import { MoreDotIcon } from "../../icons";
// import { Link } from "react-router-dom";

// export default function MonthlyTarget() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [series] = useState<number[]>([70, 30]);

//   const options: ApexOptions = {
//     colors: ["#1C64F2", "#E74694"],
//     chart: {
//       height: 320,
//       width: "100%",
//       type: "donut",
//       fontFamily: "Inter, sans-serif",
//     },
//     stroke: {
//       colors: ["transparent"],
//     },
//     plotOptions: {
//       pie: {
//         donut: {
//           size: "80%",
//           labels: {
//             show: true,
//             name: {
//               show: true,
//               fontFamily: "Inter, sans-serif",
//               offsetY: 20,
//             },
//             total: {
//               showAlways: true,
//               show: true,
//               label: "Total Tokens",
//               fontFamily: "Inter, sans-serif",
//               formatter: (w) => {
//                 const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
//                 return sum.toString();
//               },
//             },

//             value: {
//               show: true,
//               fontFamily: "Inter, sans-serif",
//               offsetY: -20,
//               formatter: (value) => value.toString(),
//             },
//           },
//         },
//       },
//     },
//     grid: {
//       padding: {
//         top: -2,
//       },
//     },
//     labels: ["Token Generated", "Token Not Generated"],
//     dataLabels: {
//       enabled: false,
//     },
//     legend: {
//       position: "bottom",
//       fontFamily: "Inter, sans-serif",
//     },
//   };

//   function toggleDropdown() {
//     setIsOpen(!isOpen);
//   }

//   function closeDropdown() {
//     setIsOpen(false);
//   }

//   return (
//     <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
//       <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
//         <div className="flex justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
//               Token Status
//             </h3>
//             <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
//               Overview of token generation
//             </p>
//           </div>
//           <div className="relative inline-block">
//             <button className="dropdown-toggle" onClick={toggleDropdown}>
//               <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
//             </button>
//             <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
// <DropdownItem onItemClick={closeDropdown} className="...">
//   <Link to="/token-status" className="w-full h-full block">
//     View More
//   </Link>
// </DropdownItem>
//             </Dropdown>
//           </div>
//         </div>
//         <div className="mt-6">
//           <Chart options={options} series={series} type="donut" height={320} />
//         </div>
//       </div>
//     </div>
//   );
// }




import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { Link } from "react-router-dom";
import axios from "axios";

export default function MonthlyTarget() {

    const apiUrl = import.meta.env.VITE_API_URL;

  const [isOpen, setIsOpen] = useState(false);
  const [series, setSeries] = useState<number[]>([0, 0]);
  const [generatedUsers, setGeneratedUsers] = useState<any[]>([]);
  const [notGeneratedUsers, setNotGeneratedUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState<any[]>([]);
  const [activeLabel, setActiveLabel] = useState("");

  console.log(notGeneratedUsers);
  

  // Fetch token stats from backend
  useEffect(() => {
    fetchTokenStatus();
  }, []);

  async function fetchTokenStatus() {
    try {

      const {data} = await axios.get(`${apiUrl}/admin/tokenstatussummary`);

      console.log(data);
      

      setActiveUsersList(data.generatedUsers)
      setSeries([data.generatedCount, data.notGeneratedCount]);
      setGeneratedUsers(data.generatedUsers);
      setNotGeneratedUsers(data.notGeneratedUsers);
    } catch (err) {
      console.error("Error fetching token status:", err);
    }
  }

  const options: ApexOptions = {
    colors: ["#1C64F2", "#E74694"],
    chart: {
      height: 320,
      width: "100%",
      type: "donut",
      events: {
        dataPointSelection: ( config) => {
          const index = config.dataPointIndex;

          if (index === 0) {
            setActiveUsersList(generatedUsers);
            setActiveLabel("Token Generated Users");
          } else {
            // setActiveUsersList(notGeneratedUsers);
              setActiveUsersList(generatedUsers);
            setActiveLabel("Token Not Generated Users");
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
                w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
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
              <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
              </button>

              <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
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
              {activeUsersList.map((u) => (
                <li key={u._id} className="p-2 border rounded flex justify-between">
                  <span>{u.firstName+" "+u.lastName}</span>
                  <span className="text-gray-500 text-sm">{u._id}</span>
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
