import { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { Link } from "react-router-dom";

export default function MonthlyTarget() {
  const [isOpen, setIsOpen] = useState(false);
  const [series] = useState<number[]>([70, 30]);

  const options: ApexOptions = {
    colors: ["#1C64F2", "#E74694"],
    chart: {
      height: 320,
      width: "100%",
      type: "donut",
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
            name: {
              show: true,
              fontFamily: "Inter, sans-serif",
              offsetY: 20,
            },
            total: {
              showAlways: true,
              show: true,
              label: "Total Tokens",
              fontFamily: "Inter, sans-serif",
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return sum.toString();
              },
            },

            value: {
              show: true,
              fontFamily: "Inter, sans-serif",
              offsetY: -20,
              formatter: (value) => value.toString(),
            },
          },
        },
      },
    },
    grid: {
      padding: {
        top: -2,
      },
    },
    labels: ["Token Generated", "Token Not Generated"],
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
    },
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
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
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
<DropdownItem onItemClick={closeDropdown} className="...">
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
  );
}
