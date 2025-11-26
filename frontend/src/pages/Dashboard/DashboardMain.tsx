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
  FiDollarSign as FiDollar,
  FiList
} from "react-icons/fi";
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
    { label: "Buy", value: buy, dot: "bg-linear-to-r from-green-400 to-emerald-500", icon: <FiArrowUp className="text-white" /> },
    { label: "Sell", value: sell, dot: "bg-linear-to-r from-red-400 to-red-500", icon: <FiArrowDown className="text-white" /> },
    { label: "Cancelled", value: cancelled, dot: "bg-linear-to-r from-blue-400 to-cyan-500", icon: <FiXCircle className="text-white" /> },
    { label: "Rejected", value: rejected, dot: "bg-linear-to-r from-amber-400 to-orange-500", icon: <FiAlertTriangle className="text-white" /> },
  ];
}

export default function DashboardPretty() {

    const apiUrl = import.meta.env.VITE_API_URL;

  const { api, image } = useBrokerApi();
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
    { label: "Buy", value: 0, dot: "bg-linear-to-r from-green-400 to-emerald-500", icon: <FiArrowUp className="text-white" /> },
    { label: "Sell", value: 0, dot: "bg-linear-to-r from-red-400 to-red-500", icon: <FiArrowDown className="text-white" /> },
    { label: "Cancelled", value: 0, dot: "bg-linear-to-r from-blue-400 to-cyan-500", icon: <FiXCircle className="text-white" /> },
    { label: "Rejected", value: 0, dot: "bg-linear-to-r from-amber-400 to-orange-500", icon: <FiAlertTriangle className="text-white" /> },
  ]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const fundRes = await api.getFund();

      let orderStatusData = await buildRows(fundRes?.data?.totalOrders || []);
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

  const sendLoginTokenToBackend = async (token:any, userId:any) => {
  try {
    console.log('dfvdfvdf fyers');
    
    const res = await axios.post(
      `${apiUrl}/fyers/updatefyerstoken`,  // <--- your endpoint
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

      // post token + userId to backend
     if(user.brokerName=='fyers') {

           sendLoginTokenToBackend(token, userId);
     }

      navigate("/dashboard", { replace: true });
    }
    loadDashboard();
  }, []);



  const pnlIcon = profitAndLossData >= 0 ?
    <FiTrendingUp className="text-emerald-600" /> :
    <FiTrendingDown className="text-red-600" />;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 md:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Trading Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time market insights and portfolio overview</p>
        </div>
        <div className="flex items-center gap-3">
<button
  className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl text-white transition-all duration-200 transform hover:-translate-y-0.5"
  onClick={handleGenerateToken}
>
  <FiRefreshCw className={`${loading ? 'animate-spin' : ''} text-white`} />
  <span className="text-white">Generate Token</span>
</button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
            <img src={image} className="w-28 h-10 object-contain" alt="Broker Logo" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Traded */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Total Traded</p>
              <p className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{totalTradedData}</p>
            </div>
            <div className="p-4 bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl ">
              <RiExchangeDollarLine className="text-blue-500 text-2xl" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <FiShoppingCart className="text-blue-500" />
            <span>Trading volume</span>
          </div>
        </div>

        {/* Total Open */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Total Open</p>
              <p className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{totalOpenOrderData}</p>
            </div>
            <div className="p-4 bg-linear-to-br from-amber-50 to-amber-100 rounded-2xl ">
              <RiArrowUpDownLine className="text-amber-500 text-2xl" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <FiList className="text-amber-500" />
            <span>Active orders</span>
          </div>
        </div>

        {/* Total Fund */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Available Funds</p>
              <p className="text-2xl font-bold bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mr-2">
                {rupee(fundData)}
              </p>
            </div>
            <div className="p-4 bg-linear-to-br from-emerald-50 to-green-100 rounded-2xl">
              <RiWallet3Line className="text-emerald-500 text-2xl" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <FiDollar className="text-emerald-500" />
            <span>Liquid balance</span>
          </div>
        </div>

        {/* PnL */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">Profit & Loss</p>
              <p className={`text-2xl font-bold ${profitAndLossData >= 0 ? 'bg-linear-to-r from-emerald-600 to-green-600' : 'bg-linear-to-r from-red-600 to-red-600'} bg-clip-text text-transparent`}>
                {rupee(profitAndLossData)}
              </p>
            </div>
            <div className={`p-4 rounded-2xl  ${profitAndLossData >= 0 ? 'bg-linear-to-br from-emerald-50 to-green-100' : 'bg-linear-to-br from-red-50 to-red-100'}`}>
              {pnlIcon}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            {profitAndLossData >= 0 ? <FiTrendingUp className="text-emerald-500" /> : <FiTrendingDown className="text-red-500" />}
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
              <h3 className="text-xl font-semibold text-gray-800">Orders Summary</h3>
            </div>

            {/* Donut Chart */}
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
                  <span className="text-2xl font-bold text-gray-800">{Number(summary.totalOrder)}</span>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
              </div>
            </div>

            <div className="text-center py-3">
              <div className="inline-flex flex-col items-center">
                <div className="text-lg font-medium text-gray-500 mt-2">Total Orders Today</div>
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
              <h3 className="text-xl font-semibold text-gray-800">Trading Performance</h3>
            </div>
            <TradeReportChart data={chartData} />
          </div>
        </div>
      </section>

      {/* Recent Orders Table */}
      <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
            <FiList className="text-white text-lg" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Recent Orders</h3>
        </div>

        <div className="flex flex-col gap-4">
          {summary?.orderData?.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-5 bg-white/50 rounded-2xl border border-white/20 hover:bg-white/80 hover:shadow-lg transition-all duration-200 group"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                item.transactiontype === "BUY" 
                  ? "bg-linear-to-br from-green-500 to-emerald-600" 
                  : "bg-linear-to-br from-red-500 to-red-600"
              }`}>
                <span className="text-white font-bold text-lg">
                  {item.transactiontype === "BUY" ? "B" : "S"}
                </span>
              </div>

              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900">
                  {item.tradingsymbol}
                </p>
                <p className="text-sm text-gray-500 leading-6">
                  Order sent to Finvasia. OrderID : {item.orderid} : S-1 : (
                  {item.formulaText})
                </p>
                <p className="text-xs text-gray-400 mt-1">1 Hours Ago</p>
              </div>
            </div>
          ))}

          {summary?.orderData?.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <div className="flex flex-col items-center justify-center">
                <FiList className="text-3xl text-gray-300 mb-2" />
                <p>No recent orders found</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}