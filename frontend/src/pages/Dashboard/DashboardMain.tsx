
import { JSX, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useBrokerApi } from "../../api/brokers/brokerSelector";
import TradeReportChart from "../Charts/TradeReportChart";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiXCircle,
  FiAlertTriangle,
  FiPieChart,
  FiBarChart2,
  // FiDollarSign as FiDollar,
  FiList
} from "react-icons/fi";

import { IndianRupee } from "lucide-react";
import {
  RiExchangeDollarLine,
  RiWallet3Line,
  RiArrowUpDownLine
} from "react-icons/ri";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const rupee = (n: number) =>
  (Number(n) || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

type Summary = { totalOrder: number; orderData: any[] };

type Row = { label: string; value: number; dot: string; icon: JSX.Element };

function buildRows(orderList: any[] = []): Row[] {
  let buy = 0,
    sell = 0,
    cancelled = 0,
    rejected = 0;

  for (const o of orderList) {
    const tt = String(o?.transactiontype ?? "").toUpperCase();
    const st = String(o?.orderstatus ?? "").toLowerCase();

    if (tt === "BUY" && st === "complete") buy++;
    else if (tt === "SELL" && st === "complete") sell++;
    else if (st === "cancelled") cancelled++;
    else if (st === "rejected") rejected++;
  }

  return [
    {
      label: "Buy",
      value: buy,
      dot: "bg-linear-to-r from-green-400 to-emerald-500",
      icon: <FiArrowUp className="text-white" />
    },
    {
      label: "Sell",
      value: sell,
      dot: "bg-linear-to-r from-red-400 to-red-500",
      icon: <FiArrowDown className="text-white" />
    },
    {
      label: "Cancelled",
      value: cancelled,
      dot: "bg-linear-to-r from-blue-400 to-cyan-500",
      icon: <FiXCircle className="text-white" />
    },
    {
      label: "Rejected",
      value: rejected,
      dot: "bg-linear-to-r from-amber-400 to-orange-500",
      icon: <FiAlertTriangle className="text-white" />
    },
  ];
}

export default function DashboardPretty() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { api, image, brokerName,role } = useBrokerApi();

  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fundData, setFundData] = useState(0);
  const [totalTradedData, setTotalTradedData] = useState(0);
  const [totalOpenOrderData, setTotalOpenOrderData] = useState(0);
  const [profitAndLossData, setProfitAndLossData] = useState(0);
  const [chartData, setChartData] = useState([]);

  const [summary, setSummary] = useState<Summary>({
    totalOrder: 0,
    orderData: [],
  });

  const [rows, setRows] = useState<Row[]>([
    {
      label: "Buy",
      value: 0,
      dot: "bg-linear-to-r from-green-400 to-emerald-500",
      icon: <FiArrowUp className="text-white" />
    },
    {
      label: "Sell",
      value: 0,
      dot: "bg-linear-to-r from-red-400 to-red-500",
      icon: <FiArrowDown className="text-white" />
    },
    {
      label: "Cancelled",
      value: 0,
      dot: "bg-linear-to-r from-blue-400 to-cyan-500",
      icon: <FiXCircle className="text-white" />
    },
    {
      label: "Rejected",
      value: 0,
      dot: "bg-linear-to-r from-amber-400 to-orange-500",
      icon: <FiAlertTriangle className="text-white" />
    },
  ]);

  // ⭐ Helper for "x min ago"
  function timeAgo(timestamp: any) {
    if (!timestamp) return "";

    const now: any = new Date();
    const past: any = new Date(timestamp);
    const diffMs = now - past;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const fundRes = await api.getFund();


      console.log(fundRes,'fundData');
      

      const orderStatusData = buildRows(fundRes?.data?.totalOrders || []);
      setRows(orderStatusData);

      setSummary({
        totalOrder: fundRes?.data?.totalOrders?.length || 0,
        orderData: fundRes?.data?.totalOrders || []
      });

      setFundData(fundRes.data.data?.availablecash || 0);

      const tradeRes = await api.getTodayTrade();
      setTotalTradedData(tradeRes.data.totalTraded || 0);
      setTotalOpenOrderData(tradeRes.data.totalOpen || 0);
      setProfitAndLossData(tradeRes.data.pnl || 0);
      setChartData(tradeRes.data.data || []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    try {

      const res = await api.generateToken();



      

      if (res?.brokerName == "upstox"&&role=='user') {
        window.open(res.authUrl, "_blank");
        return;
      }

      if(res.brokerName=='finvasia'&&role=='user') {
        
        localStorage.setItem("angel_token", res.token);

      }

      if (res?.status) {
        toast.success("Token generated successfully!");
        loadDashboard();
      } else {
        toast.error(res?.message || "Failed to generate token");
      }
    } catch (err: any) {
      toast.error(err?.message || "Token generation failed");
    }
  };

  const sendLoginTokenToBackend = async (token: any, userId: any) => {
    try {
      const res = await axios.post(
        `${apiUrl}/fyers/updatefyerstoken`,
        {
          angelToken: token,
          userId: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      console.log("Token saved response:", res.data);
    } catch (err) {
      console.error("Error sending token:", err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("access_token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id;

    if (token) {
      localStorage.setItem("angel_token", token);

      if (user.brokerName == "fyers") {
        sendLoginTokenToBackend(token, userId);
      }

      navigate("/dashboard", { replace: true });
    }
    loadDashboard();
  }, []);

  const pnlIcon =
    profitAndLossData >= 0 ? (
      <FiTrendingUp className="text-emerald-600" />
    ) : (
      <FiTrendingDown className="text-red-600" />
    );

  // ⭐ New: fund color logic (same style idea as P&L)
  const isFundPositive = fundData >= 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 md:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Trading Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time market insights and portfolio overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl text-white transition-all duration-200 transform hover:-translate-y-0.5"
            onClick={handleGenerateToken}
          >
            <FiRefreshCw
              className={`${loading ? "animate-spin" : ""} text-white`}
            />
            <span className="text-white">Generate Token</span>
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
            <img
              src={image}
              className="w-28 h-10 object-contain"
              alt="Broker Logo"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Traded */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">
                Total Traded
              </p>
              <p className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {totalTradedData}
              </p>
            </div>
            <div className="p-4 bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl ">
              <RiExchangeDollarLine size={25} className="text-blue-500 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <FiShoppingCart className="text-blue-500 text-sm" />
            <span>Trading volume</span>
          </div>
        </div>

        {/* Total Open */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">
                Total Open
              </p>
              <p className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {totalOpenOrderData}
              </p>
            </div>
            <div className="p-4 bg-linear-to-br from-amber-50 to-amber-100 rounded-2xl ">
              <RiArrowUpDownLine size={20} className="text-amber-500 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <FiList  size={20} className="text-amber-500 "  />
            <span>Active orders</span>
          </div>
        </div>

        {/* Available Funds – 🔥 updated logic */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">
                Available Funds
              </p>
              <p
                className={`text-2xl font-bold bg-clip-text text-transparent mr-2 max-w-[180px] truncate ${
                  isFundPositive
                    ? "bg-linear-to-r from-emerald-600 to-green-600"
                    : "bg-linear-to-r from-red-600 to-red-600"
                }`}
              >
                {rupee(fundData)}
              </p>
            </div>
            <div
              className={`p-4 rounded-2xl ${
                isFundPositive
                  ? "bg-linear-to-br from-emerald-50 to-green-100"
                  : "bg-linear-to-br from-red-50 to-red-100"
              }`}
            >
              <RiWallet3Line size={20}  className="text-emerald-500 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <IndianRupee 
              className={isFundPositive ? "text-emerald-500" : "text-red-500"}
            />
            <span>Liquid balance</span>
          </div>
        </div>

        {/* PnL */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">
                Profit & Loss
              </p>
              <p
                className={`text-2xl font-bold ${
                  profitAndLossData >= 0
                    ? "bg-linear-to-r from-emerald-600 to-green-600"
                    : "bg-linear-to-r from-red-600 to-red-600"
                } bg-clip-text text-transparent`}
              >
                {rupee(profitAndLossData)}
              </p>
            </div>
            <div
              className={`p-4 rounded-2xl  ${
                profitAndLossData >= 0
                  ? "bg-linear-to-br from-emerald-50 to-green-100"
                  : "bg-linear-to-br from-red-50 to-red-100"
              }`}
            >
              {pnlIcon}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            {profitAndLossData >= 0 ? (
              <FiTrendingUp  size={20} className="text-emerald-500" />
            ) : (
              <FiTrendingDown size={20} className="text-red-500" />
            )}
            <span>Today's P&L</span>
          </div>
        </div>
      </section>

      {/* Charts and Orders Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-linear-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                <FiPieChart className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Orders Summary
              </h3>
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 relative">
                <Doughnut
                  data={{
                    labels: rows.map((r) => r.label),
                    datasets: [
                      {
                        data: rows.map((r) => r.value),
                        backgroundColor: [
                          "#10b981",
                          "#ef4444",
                          "#3b82f6",
                          "#f59e0b"
                        ],
                        borderWidth: 3,
                        borderColor: "white",
                        hoverOffset: 15,
                      },
                    ],
                  }}
                  options={{
                    cutout: "70%",
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-800">
                    {Number(summary.totalOrder)}
                  </span>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
              </div>
            </div>

            <div className="text-center py-3">
              <div className="inline-flex flex-col items-center">
                <div className="text-lg font-medium text-gray-500 mt-2">
                  Total Orders Today
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-linear-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                <FiBarChart2 className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Trading Performance
              </h3>
            </div>
            <TradeReportChart data={chartData} />
          </div>
        </div>
      </section>

      {/* Recent Orders - Compact Cards */}
      <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/40 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
            <FiList className="text-white text-base" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Recent Orders
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {summary?.orderData?.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-150 group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md text-base font-bold ${
                  item.transactiontype === "BUY"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {item.transactiontype === "BUY" ? "B" : "S"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {item.tradingsymbol}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  Order placed successfully on {brokerName}: {item.orderid}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {timeAgo(item.ordertime)}
                </p>
              </div>
            </div>
          ))}

          {(!summary?.orderData || summary?.orderData?.length === 0) && (
            <div className="py-4 text-center text-gray-500">
              <div className="flex flex-col items-center justify-center gap-1">
                <FiList className="text-2xl text-gray-300" />
                <p className="text-sm">No recent orders found</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}





// import { JSX, useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import { useBrokerApi } from "../../api/brokers/brokerSelector";
// import TradeReportChart from "../Charts/TradeReportChart";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import {
//   FiTrendingUp,
//   FiTrendingDown,
//   FiShoppingCart,
//   FiRefreshCw,
//   FiArrowUp,
//   FiArrowDown,
//   FiXCircle,
//   FiAlertTriangle,
//   FiPieChart,
//   FiBarChart2,
//   FiList,
// } from "react-icons/fi";

// import { IndianRupee } from "lucide-react";
// import {
//   RiExchangeDollarLine,
//   RiWallet3Line,
//   RiArrowUpDownLine,
// } from "react-icons/ri";

// import { Doughnut } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// ChartJS.register(ArcElement, Tooltip, Legend);

// const rupee = (n: number) =>
//   (Number(n) || 0).toLocaleString("en-IN", {
//     style: "currency",
//     currency: "INR",
//     minimumFractionDigits: 2,
//   });

// type Summary = { totalOrder: number; orderData: any[] };

// type Row = { label: string; value: number; dot: string; icon: JSX.Element };

// function buildRows(orderList: any[] = []): Row[] {
//   let buy = 0,
//     sell = 0,
//     cancelled = 0,
//     rejected = 0;

//   for (const o of orderList) {
//     const tt = String(o?.transactiontype ?? "").toUpperCase();
//     const st = String(o?.orderstatus ?? "").toLowerCase();

//     if (tt === "BUY" && st === "complete") buy++;
//     else if (tt === "SELL" && st === "complete") sell++;
//     else if (st === "cancelled") cancelled++;
//     else if (st === "rejected") rejected++;
//   }

//   return [
//     {
//       label: "Buy",
//       value: buy,
//       dot: "bg-linear-to-r from-green-400 to-emerald-500",
//       icon: <FiArrowUp className="text-white" />,
//     },
//     {
//       label: "Sell",
//       value: sell,
//       dot: "bg-linear-to-r from-red-400 to-red-500",
//       icon: <FiArrowDown className="text-white" />,
//     },
//     {
//       label: "Cancelled",
//       value: cancelled,
//       dot: "bg-linear-to-r from-blue-400 to-cyan-500",
//       icon: <FiXCircle className="text-white" />,
//     },
//     {
//       label: "Rejected",
//       value: rejected,
//       dot: "bg-linear-to-r from-amber-400 to-orange-500",
//       icon: <FiAlertTriangle className="text-white" />,
//     },
//   ];
// }

// export default function DashboardPretty() {
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const { api, image, brokerName, role } = useBrokerApi();

//   const location = useLocation();
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(false);
//   const [fundData, setFundData] = useState(0);
//   const [totalTradedData, setTotalTradedData] = useState(0);
//   const [totalOpenOrderData, setTotalOpenOrderData] = useState(0);
//   const [profitAndLossData, setProfitAndLossData] = useState(0);
//   const [chartData, setChartData] = useState([]);

//   const [summary, setSummary] = useState<Summary>({
//     totalOrder: 0,
//     orderData: [],
//   });

//   const [rows, setRows] = useState<Row[]>([
//     {
//       label: "Buy",
//       value: 0,
//       dot: "bg-linear-to-r from-green-400 to-emerald-500",
//       icon: <FiArrowUp className="text-white" />,
//     },
//     {
//       label: "Sell",
//       value: 0,
//       dot: "bg-linear-to-r from-red-400 to-red-500",
//       icon: <FiArrowDown className="text-white" />,
//     },
//     {
//       label: "Cancelled",
//       value: 0,
//       dot: "bg-linear-to-r from-blue-400 to-cyan-500",
//       icon: <FiXCircle className="text-white" />,
//     },
//     {
//       label: "Rejected",
//       value: 0,
//       dot: "bg-linear-to-r from-amber-400 to-orange-500",
//       icon: <FiAlertTriangle className="text-white" />,
//     },
//   ]);

//   // ⭐ NEW: Finvasia form state
//   const [showFinvasiaForm, setShowFinvasiaForm] = useState(false);
//   const [finvasiaForm, setFinvasiaForm] = useState({
//     userid: "",
//     otp: "",
//     password: "",
//   });

//   // ⭐ Helper for "x min ago"
//   function timeAgo(timestamp: any) {
//     if (!timestamp) return "";

//     const now: any = new Date();
//     const past: any = new Date(timestamp);
//     const diffMs = now - past;

//     const seconds = Math.floor(diffMs / 1000);
//     const minutes = Math.floor(seconds / 60);
//     const hours = Math.floor(minutes / 60);
//     const days = Math.floor(hours / 24);

//     if (seconds < 60) return "Just now";
//     if (minutes < 60) return `${minutes} min ago`;
//     if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

//     return `${days} day${days > 1 ? "s" : ""} ago`;
//   }

//   const loadDashboard = async () => {
//     try {
//       setLoading(true);

//       const fundRes = await api.getFund();

//       const orderStatusData = buildRows(fundRes?.data?.totalOrders || []);
//       setRows(orderStatusData);

//       setSummary({
//         totalOrder: fundRes?.data?.totalOrders?.length || 0,
//         orderData: fundRes?.data?.totalOrders || [],
//       });

//       setFundData(fundRes.data.data?.availablecash || 0);

//       const tradeRes = await api.getTodayTrade();
//       setTotalTradedData(tradeRes.data.totalTraded || 0);
//       setTotalOpenOrderData(tradeRes.data.totalOpen || 0);
//       setProfitAndLossData(tradeRes.data.pnl || 0);
//       setChartData(tradeRes.data.data || []);
//     } catch (error: any) {
//       toast.error(error?.message || "Failed to load dashboard");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ⭐ NEW: Finvasia form input handler
//   const handleFinvasiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFinvasiaForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   // ⭐ NEW: Finvasia form submit handler
//   const handleFinvasiaFormSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       setLoading(true);

//       const payload = {
//         brokerName: brokerName,
//         uid: finvasiaForm.userid,
//         otp: finvasiaForm.otp,
//         password: finvasiaForm.password,
//       };

//         console.log(payload,'payload');

        
//     } catch (err: any) {
//       toast.error(err?.message || "Finvasia token generation failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGenerateToken = async () => {
//     try {
//       // 1) Special case: finvasia + user → open form, don't call API yet
//       if (role === "user" && brokerName?.toLowerCase() === "finvasia") {
//         setShowFinvasiaForm(true);
//         return;
//       }

//       setLoading(true);

//       const res = await api.generateToken();

//       if (res?.brokerName === "upstox") {
//         window.open(res.authUrl, "_blank");
//         return;
//       }

//       if (res?.status) {
//         toast.success("Token generated successfully!");
//         loadDashboard();
//       } else {
//         toast.error(res?.message || "Failed to generate token");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Token generation failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const sendLoginTokenToBackend = async (token: any, userId: any) => {
//     try {
//       const res = await axios.post(
//         `${apiUrl}/fyers/updatefyerstoken`,
//         {
//           angelToken: token,
//           userId: userId,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       console.log("Token saved response:", res.data);
//     } catch (err) {
//       console.error("Error sending token:", err);
//     }
//   };

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const token = params.get("access_token");
//     const user = JSON.parse(localStorage.getItem("user") || "{}");
//     const userId = user?.id;

//     if (token) {
//       localStorage.setItem("angel_token", token);

//       if (user.brokerName == "fyers") {
//         sendLoginTokenToBackend(token, userId);
//       }

//       navigate("/dashboard", { replace: true });
//     }
//     loadDashboard();
//   }, []);

//   const pnlIcon =
//     profitAndLossData >= 0 ? (
//       <FiTrendingUp className="text-emerald-600" />
//     ) : (
//       <FiTrendingDown className="text-red-600" />
//     );

//   // ⭐ New: fund color logic (same style idea as P&L)
//   const isFundPositive = fundData >= 0;

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 md:px-6 lg:px-8 py-8 space-y-8">
//       {/* Header Section */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
//         <div>
//           <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
//             Trading Dashboard
//           </h1>
//           <p className="text-gray-600 mt-2">
//             Real-time market insights and portfolio overview
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           <button
//             className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl text-white transition-all duration-200 transform hover:-translate-y-0.5"
//             onClick={handleGenerateToken}
//             disabled={loading}
//           >
//             <FiRefreshCw
//               className={`${loading ? "animate-spin" : ""} text-white`}
//             />
//             <span className="text-white">
//               {loading ? "Processing..." : "Generate Token"}
//             </span>
//           </button>

//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
//             <img
//               src={image}
//               className="w-28 h-10 object-contain"
//               alt="Broker Logo"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ⭐ NEW: Finvasia (Shoonya) login form */}
//       {showFinvasiaForm && (
//         <div className="max-w-lg w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 mx-auto -mt-2 mb-4">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Finvasia (Shoonya) Login Details
//               </h3>
//               <p className="text-xs text-gray-500 mt-1">
//                 Enter your Shoonya credentials to generate API token.
//               </p>
//             </div>
//             <button
//               type="button"
//               onClick={() => setShowFinvasiaForm(false)}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <FiXCircle />
//             </button>
//           </div>

//           <form onSubmit={handleFinvasiaFormSubmit} className="space-y-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 User ID
//               </label>
//               <input
//                 type="text"
//                 name="userid"
//                 value={finvasiaForm.userid}
//                 onChange={handleFinvasiaChange}
//                 className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 placeholder="FN169676"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 OTP / TOTP
//               </label>
//               <input
//                 type="text"
//                 name="otp"
//                 value={finvasiaForm.otp}
//                 onChange={handleFinvasiaChange}
//                 className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 placeholder="6-digit OTP"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 name="password"
//                 value={finvasiaForm.password}
//                 onChange={handleFinvasiaChange}
//                 className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 placeholder="Account password"
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 disabled:opacity-60"
//             >
//               {loading && <FiRefreshCw className="animate-spin" />}
//               <span>
//                 {loading ? "Generating..." : "Generate Finvasia Token"}
//               </span>
//             </button>
//           </form>
//         </div>
//       )}

//       {/* Stats Grid */}
//       <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {/* Total Traded */}
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-sm font-medium mb-2">
//                 Total Traded
//               </p>
//               <p className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
//                 {totalTradedData}
//               </p>
//             </div>
//             <div className="p-4 bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl ">
//               <RiExchangeDollarLine
//                 size={25}
//                 className="text-blue-500 text-sm"
//               />
//             </div>
//           </div>
//           <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
//             <FiShoppingCart className="text-blue-500 text-sm" />
//             <span>Trading volume</span>
//           </div>
//         </div>

//         {/* Total Open */}
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-sm font-medium mb-2">
//                 Total Open
//               </p>
//               <p className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
//                 {totalOpenOrderData}
//               </p>
//             </div>
//             <div className="p-4 bg-linear-to-br from-amber-50 to-amber-100 rounded-2xl ">
//               <RiArrowUpDownLine
//                 size={20}
//                 className="text-amber-500 text-sm"
//               />
//             </div>
//           </div>
//           <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
//             <FiList size={20} className="text-amber-500 " />
//             <span>Active orders</span>
//           </div>
//         </div>

//         {/* Available Funds */}
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-sm font-medium mb-2">
//                 Available Funds
//               </p>
//               <p
//                 className={`text-2xl font-bold bg-clip-text text-transparent mr-2 max-w-[180px] truncate ${
//                   isFundPositive
//                     ? "bg-linear-to-r from-emerald-600 to-green-600"
//                     : "bg-linear-to-r from-red-600 to-red-600"
//                 }`}
//               >
//                 {rupee(fundData)}
//               </p>
//             </div>
//             <div
//               className={`p-4 rounded-2xl ${
//                 isFundPositive
//                   ? "bg-linear-to-br from-emerald-50 to-green-100"
//                   : "bg-linear-to-br from-red-50 to-red-100"
//               }`}
//             >
//               <RiWallet3Line size={20} className="text-emerald-500 text-sm" />
//             </div>
//           </div>
//           <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
//             <IndianRupee
//               className={isFundPositive ? "text-emerald-500" : "text-red-500"}
//             />
//             <span>Liquid balance</span>
//           </div>
//         </div>

//         {/* PnL */}
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-sm font-medium mb-2">
//                 Profit & Loss
//               </p>
//               <p
//                 className={`text-2xl font-bold ${
//                   profitAndLossData >= 0
//                     ? "bg-linear-to-r from-emerald-600 to-green-600"
//                     : "bg-linear-to-r from-red-600 to-red-600"
//                 } bg-clip-text text-transparent`}
//               >
//                 {rupee(profitAndLossData)}
//               </p>
//             </div>
//             <div
//               className={`p-4 rounded-2xl  ${
//                 profitAndLossData >= 0
//                   ? "bg-linear-to-br from-emerald-50 to-green-100"
//                   : "bg-linear-to-br from-red-50 to-red-100"
//               }`}
//             >
//               {pnlIcon}
//             </div>
//           </div>
//           <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
//             {profitAndLossData >= 0 ? (
//               <FiTrendingUp size={20} className="text-emerald-500" />
//             ) : (
//               <FiTrendingDown size={20} className="text-red-500" />
//             )}
//             <span>Today's P&L</span>
//           </div>
//         </div>
//       </section>

//       {/* Charts and Orders Summary */}
//       <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Orders Summary */}
//         <div className="lg:col-span-1">
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="p-3 bg-linear-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
//                 <FiPieChart className="text-white text-lg" />
//               </div>
//               <h3 className="text-xl font-semibold text-gray-800">
//                 Orders Summary
//               </h3>
//             </div>

//             <div className="flex justify-center mb-6">
//               <div className="w-48 h-48 relative">
//                 <Doughnut
//                   data={{
//                     labels: rows.map((r) => r.label),
//                     datasets: [
//                       {
//                         data: rows.map((r) => r.value),
//                         backgroundColor: [
//                           "#10b981",
//                           "#ef4444",
//                           "#3b82f6",
//                           "#f59e0b",
//                         ],
//                         borderWidth: 3,
//                         borderColor: "white",
//                         hoverOffset: 15,
//                       },
//                     ],
//                   }}
//                   options={{
//                     cutout: "70%",
//                     plugins: {
//                       legend: { display: false },
//                     },
//                   }}
//                 />
//                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//                   <span className="text-2xl font-bold text-gray-800">
//                     {Number(summary.totalOrder)}
//                   </span>
//                   <span className="text-sm text-gray-500">Total</span>
//                 </div>
//               </div>
//             </div>

//             <div className="text-center py-3">
//               <div className="inline-flex flex-col items-center">
//                 <div className="text-lg font-medium text-gray-500 mt-2">
//                   Total Orders Today
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Chart */}
//         <div className="lg:col-span-2">
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="p-3 bg-linear-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
//                 <FiBarChart2 className="text-white text-lg" />
//               </div>
//               <h3 className="text-xl font-semibold text-gray-800">
//                 Trading Performance
//               </h3>
//             </div>
//             <TradeReportChart data={chartData} />
//           </div>
//         </div>
//       </section>

//       {/* Recent Orders - Compact Cards */}
//       <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/40 p-4">
//         <div className="flex items-center gap-2 mb-4">
//           <div className="p-2 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
//             <FiList className="text-white text-base" />
//           </div>
//           <h3 className="text-lg font-semibold text-gray-800">
//             Recent Orders
//           </h3>
//         </div>

//         <div className="flex flex-col gap-3">
//           {summary?.orderData?.slice(0, 5).map((item, index) => (
//             <div
//               key={index}
//               className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-150 group"
//             >
//               <div
//                 className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md text-base font-bold ${
//                   item.transactiontype === "BUY"
//                     ? "bg-green-500 text-white"
//                     : "bg-red-500 text-white"
//                 }`}
//               >
//                 {item.transactiontype === "BUY" ? "B" : "S"}
//               </div>

//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-semibold text-gray-900 truncate">
//                   {item.tradingsymbol}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-0.5 truncate">
//                   Order placed successfully on {brokerName}: {item.orderid}
//                 </p>
//                 <p className="text-[11px] text-gray-400 mt-0.5">
//                   {timeAgo(item.ordertime)}
//                 </p>
//               </div>
//             </div>
//           ))}

//           {(!summary?.orderData || summary?.orderData?.length === 0) && (
//             <div className="py-4 text-center text-gray-500">
//               <div className="flex flex-col items-center justify-center gap-1">
//                 <FiList className="text-2xl text-gray-300" />
//                 <p className="text-sm">No recent orders found</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </section>
//     </div>
//   );
// }

