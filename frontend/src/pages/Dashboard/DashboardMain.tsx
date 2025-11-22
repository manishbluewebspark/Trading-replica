
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useBrokerApi } from "../../api/brokers/brokerSelector";
import TradeReportChart from "../Charts/TradeReportChart";
import { useLocation, useNavigate } from "react-router-dom";

const rupee = (n: number) =>
  (Number(n) || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

type Summary = { totalOrder: number; orderData: any[] };

type Row = { label: string; value: number; dot: string };

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
    { label: "Buy", value: buy, dot: "bg-green-500" },
    { label: "Sell", value: sell, dot: "bg-rose-500" },
    { label: "Cancelled", value: cancelled, dot: "bg-sky-500" },
    { label: "Rejected", value: rejected, dot: "bg-yellow-500" },
  ];
}

export default function DashboardPretty() {

   const { api, image } = useBrokerApi();  // Auto-select AngelOne or Kite

    const location = useLocation();
  const navigate = useNavigate();

   const [loading, setLoading] = useState(false);
  const [fundData, setFundData] = useState(0);
  const [totalTradedData, setTotalTradedData] = useState(0);
  const [totalOpenOrderData, setTotalOpenOrderData] = useState(0);
  const [profitAndLossData, setProfitAndLossData] = useState(0);
  const [chartData, setChartData] = useState([]);

  console.log(loading);
  


  const [summary, setSummary] = useState<Summary>({
    totalOrder: 0,
    orderData: [],
  });



  const [rows, setRows] = useState<Row[]>([
    { label: "Buy", value: 0, dot: "bg-green-500" },
    { label: "Sell", value: 0, dot: "bg-rose-500" },
    { label: "Cancelled", value: 0, dot: "bg-sky-500" },
    { label: "Rejected", value: 0, dot: "bg-violet-500" },
  ]);    


   const loadDashboard = async () => {
    try {
      setLoading(true);

      // ⭐ 1. Get Funds
      const fundRes = await api.getFund();

      console.log(fundRes,'fundRes');
      

      let orderStatusData = await buildRows(fundRes?.data?.totalOrders||[])

       setRows(orderStatusData) 
      
       setSummary({
         totalOrder:fundRes?.data?.totalOrders?.length||0,
         orderData:fundRes?.data?.totalOrders||[] })

      setFundData(fundRes.data.data?.availablecash || 0);


      // ⭐ 2. Trade Data
      const tradeRes = await api.getTodayTrade();

      console.log(tradeRes.data.data,'orderStatusData');

     
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

 useEffect(() => {

  const params = new URLSearchParams(location.search);
    const token = params.get("access_token");

    if (token) {
      
      // Save token
      localStorage.setItem("angel_token", token);
    
      // Remove token from URL after saving
      navigate("/dashboard", { replace: true });
    }

    loadDashboard();
  }, []);
  

  const pnlColor =
    profitAndLossData >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* TOP ROW */}
      <section className="grid grid-cols-12 gap-4">
        {/* GENERATE TOKEN */}
        <div className="col-span-6 sm:col-span-4 lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center">
            <button
              className="text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1.5 rounded-md text-xs font-semibold"
              onClick={handleGenerateToken}
            >
              Generate Token
            </button>
          </div>
        </div>

        {/* LOGO */}
        <div className="col-span-6 sm:col-span-4 lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center">
            <img src={image} className="h-10" />
          </div>
        </div>

        {/* Total Traded */}
        <div className="col-span-6 sm:col-span-4 lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="text-sm font-semibold">Total Traded</div>
            <div className="text-lg font-bold">{totalTradedData}</div>
          </div>
        </div>

        {/* Total Open */}
        <div className="col-span-6 sm:col-span-4 lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="text-sm font-semibold">Total Open</div>
            <div className="text-lg font-bold">{totalOpenOrderData}</div>
          </div>
        </div>

        {/* PNL */}
        <div className="col-span-6 sm:col-span-4 lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="text-sm font-semibold">Profit & Loss</div>
            <div className={`${pnlColor} text-xl font-bold`}>
              {rupee(profitAndLossData)}
            </div>
          </div>
        </div>

        {/* FUND */}
        <div className="col-span-6 sm:col-span-4 lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="text-sm font-semibold">Total Fund</div>
            <div className="text-emerald-600 text-xl font-bold">
              {rupee(fundData)}
            </div>
          </div>
        </div>
      </section>

      {/* ORDERS + CHART */}
      <section className="grid grid-cols-12 gap-4">


        {/* Orders Summary */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h3 className="text-xl font-semibold text-gray-700">Orders Summary</h3>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-600">Orders Today</div>
                <div className="text-5xl font-extrabold text-gray-800 mt-2">
                  {Number(summary.totalOrder)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${r.dot}`} />
                    <span className="text-gray-500">{r.label}</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <TradeReportChart data={chartData} />
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-gray-700">Recent Orders</div>
        </div>

        <div className="overflow-x-auto">
         
          <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="text-left py-2 pr-4">Symbol</th>
            <th className="text-left py-2 pr-4">Order Id</th>
            <th className="text-left py-2 pr-4">Type</th>
            <th className="text-left py-2 pr-4">Qty</th>
            <th className="text-left py-2 pr-4">Price</th>
            <th className="text-left py-2 pr-4">Option Type</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {summary?.orderData?.slice(0, 5).map((item:any, index:any) => (
            <tr key={index}>
              <td className="py-2 pr-4">{item.tradingsymbol}</td>
                <td className="py-2 pr-4">{item.orderid}</td>

              <td
                className={`py-2 pr-4 font-medium ${
                  item.transactiontype === "BUY" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {item.transactiontype}
              </td>

              <td className="py-2 pr-4">{item.lotsize}</td>
              <td className="py-2 pr-4">{rupee(item.averageprice)}</td>

                  <td className="py-2 pr-4">{item.orderstatus}</td>
            </tr>
          ))}

          {summary?.orderData?.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-400">
                No recent orders
              </td>
            </tr>
          )}
        </tbody>
      </table>
        </div>
      </section>
    </div>
  );
}







// import { useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useLocation, useNavigate } from "react-router-dom";
// import TradeReportChart from "../Charts/TradeReportChart";



// import { useBrokerApi } from "../../api/brokers/brokerSelector";

// const api = useBrokerApi();   // auto-selected API file


// type Summary = { totalOrder: number; orderData: any[] };


// const rupee = (n: number) =>
//   (Number(n) || 0).toLocaleString("en-IN", {
//     style: "currency",
//     currency: "INR",
//     minimumFractionDigits: 2,
//   });



// type Row = { label: string; value: number; dot: string };

// function buildRows(orderList: any[] = []): Row[] {

//   let buy = 0, sell = 0, cancelled = 0, open = 0;

//   for (const o of orderList) {
//     const tt = String(o?.transactiontype ?? "").toUpperCase();  // BUY | SELL
//     const st = String(o?.orderstatus ?? o?.status ?? "").toLowerCase(); // complete | cancelled | open | rejected

//     if (tt === "BUY" && st === "complete") {
//       buy++;
//     } 
//     else if (tt === "SELL" && st === "complete") {
//       sell++;
//     } 
//     else if (st === "cancelled") {
//       cancelled++;
//     } 
//     else if (st === "rejected") {
//       open++;
//     }
//   }

//   return [
//     { label: "Buy", value: buy, dot: "bg-green-500" },
//     { label: "Sell", value: sell, dot: "bg-rose-500" },
//     { label: "Cancelled", value: cancelled, dot: "bg-sky-500" },
//     { label: "Rejected", value: open, dot: "bg-yellow-500" },
//   ];
// }



// export default function DashboardPretty() {

//     const apiUrl = import.meta.env.VITE_API_URL;

//   const location = useLocation();
//   const navigate = useNavigate();
   
//   // === React states (you can wire these to your APIs) ===
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [profitAndLossData, setProfitAndLossData] = useState<number>(0);
//   const [totalTradedData, setTotalTradedData] = useState<number>(0);
//   const [totalOpenOrderData, setTotalOpenOrderData] = useState<number>(0);
//   const [fundData, setFundData] = useState<number>(0);
//   const [summary, setSummary] = useState<Summary>({
//       totalOrder: 0,
//       orderData: [],
//     });

//   const [imageUrl, setImageUrl] = useState("");

//   const [rows, setRows] = useState<Row[]>([
//     { label: "Buy", value: 0, dot: "bg-green-500" },
//     { label: "Sell", value: 0, dot: "bg-rose-500" },
//     { label: "Cancelled", value: 0, dot: "bg-sky-500" },
//     { label: "Rejected", value: 0, dot: "bg-violet-500" },
//   ]);

//   const [chartData, setChartData] = useState<Array<{ label: string; win: number; loss: number }>>([
//     { label: "1", win: 0, loss: 0 },
//     { label: "2", win: 0, loss: 0 },
//     { label: "3", win: 0, loss: 0 },
//     { label: "4", win: 0, loss: 0 },
//     { label: "5", win: 0, loss: 0 },
//      { label: "6", win: 0, loss: 0 },
//     { label: "7", win: 0, loss: 0 },
//     { label: "8", win: 0, loss: 0 },
//      { label: "9", win: 0, loss: 0 },
//     { label: "10", win: 0, loss: 0 },
//      { label: "11", win: 0, loss: 0 },
//      { label: "12", win: 0, loss: 0 },
//     { label: "13", win: 0, loss: 0 },
//     { label: "14", win: 0, loss: 0 },
//      { label: "15", win: 0, loss: 0 },
//     { label: "16", win: 0, loss: 0 },
//   ]);



   


//   // Example: replace with your real fetch
//   useEffect(() => {

//     const params = new URLSearchParams(location.search);
//     const accessToken = params.get("access_token");

//     if (accessToken) {
//       // Store in localStorage
//        localStorage.setItem("angel_token", accessToken);

//       // Remove token from URL for cleanliness
//       navigate("/dashboard", { replace: true });
//     }

//     (async () => {
//       try {

//       const storedUser:any = localStorage.getItem("user");

//       const parsedUser = JSON.parse(storedUser);

//       setImageUrl(parsedUser.brokerImageLink)
       
//    const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError("");

//          // 1️⃣ First API: user fund
//         const res = await axios.get(
//           `${apiUrl}/users/get/user/fund`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               "AngelOneToken": localStorage.getItem("angel_token") || "",
//             },
//           }
//         );
        
//        let data = res?.data?.data
//        setFundData(data?.availablecash||0);

//       setSummary({
//         totalOrder:res?.data?.totalOrders?.length||0,
//         orderData:res?.data?.totalOrders||[]

//       })

//       let orderStatusData = buildRows(res?.data?.totalOrders||[])

//       setRows(orderStatusData) 
      
      
//        // 2️⃣ Third API: (example)
//          const getAllTodayTrade = await axios.get(`${apiUrl}/order/dummydatatrade`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });
      
//       setTotalTradedData(getAllTodayTrade?.data?.totalTraded||0)
//       setTotalOpenOrderData(getAllTodayTrade?.data?.totalOpen||0)
//       setProfitAndLossData(getAllTodayTrade?.data?.pnl)
//       setChartData(getAllTodayTrade?.data?.data)


//       } catch (err: any) {
//         console.error("fetch error:", err);
//         setError(err?.response?.data?.message || "Failed to load data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
      
//       } catch (e: any) {
//         setError(e?.message || "Failed to load");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const pnl = Number(profitAndLossData || 0);
//   const pnlColor = pnl >= 0 ? "text-emerald-600" : "text-rose-600";

//   const handleGenerateToken = async() => {

//     try{

//         let  stored = localStorage.getItem("user");

//         const users = stored ? JSON.parse(stored) : "";

//         const brokerName  = users.brokerName
 

//       if (brokerName === "Angelone") {

//           const {data} = await axios.get(
//           `${apiUrl}/users/login/totp/angelone`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             },
//           }
//         );

  
//        if(data.status==true) {
       
//        let angel_auth_token = data.data.jwtToken
//        let angel_refresh_token = data.data.refreshToken
//        let angel_feed_token = data.data.feedToken

//        localStorage.setItem("angel_token", angel_auth_token);
//        localStorage.setItem("angel_feed_token", angel_refresh_token);
//         localStorage.setItem("angel_refresh_token", angel_feed_token);

    
//         toast.success("Login Successful in AngelOne!");
        
//         const res = await axios.get(
//           `${apiUrl}/users/get/user/fund`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               "AngelOneToken": localStorage.getItem("angel_token") || "",
//             },
//           }
//         );

       
//        let fundData = res?.data?.data

       

//        setFundData(fundData?.availablecash||0);


//         setSummary({
//         totalOrder:res?.data?.totalOrders?.length||0,
//         orderData:res?.data?.totalOrders||[]

//       })

//       let orderStatusData = buildRows(res?.data?.totalOrders||[])

//       setRows(orderStatusData) 

//        // 2️⃣ Third API: (example)
//          const getAllTodayTrade = await axios.get(`${apiUrl}/order/dummydatatrade`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       console.log(getAllTodayTrade,'getAllTodayTrade');
//        setTotalTradedData(getAllTodayTrade?.data?.totalTraded||0)
//        setTotalOpenOrderData(getAllTodayTrade?.data?.totalOpen||0)
//       setProfitAndLossData(getAllTodayTrade?.data?.pnl)
//       setChartData(getAllTodayTrade?.data?.data)
//        setChartData(getAllTodayTrade?.data?.data)

      


//   }else{
//         toast.error(data.message);
//   }
     
//     } else if (brokerName === "kite") {
 
      
//       try {
//     const response = await axios.get(
//       `${apiUrl}/auth/kite`,
//       {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//       }
//     );

//     if (response.data.status) {
//       // Get the login URL from response
//       const loginUrl = response.data.data.loginUrl;

//       console.log(loginUrl,'loginUrl');
      
      
//       // Redirect user to Kite login page
//       window.location.href = loginUrl;
//     } else {
//       console.error('Failed to get login URL:', response.data.message);
//     }
//   } catch (error : any) {
//     console.error('Kite login initiation error:', error);
    
//     // Check if it's a redirect error
//     if (error.response && error.response.status === 302) {
//       console.log('Server is redirecting directly. Check backend controller.');
//     }
//   }
       
              
//     } else {
//       toast.error("Unsupported broker selected");
//     }


//   }catch(err:any) {

//         toast.error(err.message);
//   }
        
//   };

//   return (
//     <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">


//       {/* Row 1 — Stat cards */}
//  <section className="grid grid-cols-12 gap-4">
//   {/* Generate Token */}
//   <div className="col-span-6 sm:col-span-4 lg:col-span-2">
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-4 flex items-center justify-center">
//       <div className="flex flex-col items-center text-center">
//         <button
//           className="text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1.5 rounded-md text-xs font-semibold transition hover:bg-rose-100 hover:text-rose-700 active:scale-95"
//           onClick={handleGenerateToken}
//         >
//           Generate Token
//         </button>
//         <div className="text-xs text-gray-500 mt-1">Please generate token</div>
//       </div>
//     </div>
//   </div>

 

//   {/* AngelOne Logo */}
//   <div className="col-span-6 sm:col-span-4 lg:col-span-2">
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-4 flex items-center justify-center">
//       <img
//         src={imageUrl || "https://upload.wikimedia.org/wikipedia/commons/2/28/AngelOne_logo.png"}
//         alt="AngelOne Logo"
//         className="h-10 object-contain"
//       />
//     </div>
//   </div>

//    {/* Total Traded */}
//   <div className="col-span-6 sm:col-span-4 lg:col-span-2">
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-4 flex flex-col items-center justify-center">
//       <div className="text-sm font-semibold text-gray-700">Total Traded</div>
//       <div className="text-lg font-bold text-gray-800 mt-1">
//          {Number(totalTradedData)}
//       </div>
//     </div>
//   </div>

//   {/* Total Open */}
//   <div className="col-span-6 sm:col-span-4 lg:col-span-2">
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-4 flex flex-col items-center justify-center">
//       <div className="text-sm font-semibold text-gray-700">Total Open</div>
//       <div className="text-lg font-bold text-gray-800 mt-1">
//         {totalOpenOrderData}
//       </div>
//     </div>
//   </div>

//   {/* Profit & Loss */}
//   <div className="col-span-6 sm:col-span-4 lg:col-span-2">
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-4">
//       <div className="text-sm font-semibold text-gray-700 text-center">Profit &amp; Loss</div>
//       <div className={`${pnlColor} text-xl font-bold mt-1 text-center`}>
//         {loading ? "Loading..." : error ? "—" : rupee(pnl)}
//       </div>
//       <div className="text-xs text-gray-400 mt-1 text-center">
//         {error ? <span className="text-rose-500">{error}</span> : "Today"}
//       </div>
//     </div>
//   </div>

//   {/* Total Fund */}
//   <div className="col-span-6 sm:col-span-4 lg:col-span-2">
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-4">
//       <div className="text-sm font-semibold text-gray-700 text-center">Total Fund</div>
//       <div className="text-emerald-600 text-xl font-bold mt-1 text-center">
//         {loading ? "Loading..." : error ? "—" : rupee(Number(fundData || 0))}
//       </div>
//       <div className="text-xs text-gray-400 mt-1 text-center">
//         {error ? <span className="text-rose-500">{error}</span> : "Today"}
//       </div>
//     </div>
//   </div>
// </section>


//       {/* Row 2 — Orders Summary + Trade Report */}
//       <section className="grid grid-cols-12 gap-4">
//         {/* Orders Summary */}
//         <div className="col-span-12 lg:col-span-4">
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
//             <h3 className="text-xl font-semibold text-gray-700">Orders Summary</h3>
//             <div className="flex items-center justify-center py-8">
//               <div className="text-center">
//                 <div className="text-sm font-semibold text-gray-600">Orders Today</div>
//                 <div className="text-5xl font-extrabold text-gray-800 mt-2">
//                   {Number(summary.totalOrder)}
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               {rows.map((r) => (
//                 <div key={r.label} className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <span className={`inline-block w-3 h-3 rounded-full ${r.dot}`} />
//                     <span className="text-gray-500">{r.label}</span>
//                   </div>
//                   <span className="text-gray-900 font-semibold">{r.value}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Trade Report Chart */}
//         <div className="col-span-12 lg:col-span-8">
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
//             <TradeReportChart data={chartData} />
//           </div>
//         </div>
//       </section>

//       {/* Row 3 — Recent Orders Table (sample rows) */}
//       <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <div className="text-lg font-semibold text-gray-700">Recent Orders</div>
//         </div>

//         <div className="overflow-x-auto">
         
//           <table className="w-full text-sm">
//         <thead>
//           <tr className="text-gray-500 border-b">
//             <th className="text-left py-2 pr-4">Symbol</th>
//             <th className="text-left py-2 pr-4">Order Id</th>
//             <th className="text-left py-2 pr-4">Type</th>
//             <th className="text-left py-2 pr-4">Qty</th>
//             <th className="text-left py-2 pr-4">Price</th>
//             <th className="text-left py-2 pr-4">Option Type</th>
//           </tr>
//         </thead>

//         <tbody className="divide-y divide-gray-100">
//           {summary?.orderData?.slice(0, 5).map((item:any, index:any) => (
//             <tr key={index}>
//               <td className="py-2 pr-4">{item.tradingsymbol}</td>
//                 <td className="py-2 pr-4">{item.orderid}</td>

//               <td
//                 className={`py-2 pr-4 font-medium ${
//                   item.transactiontype === "BUY" ? "text-emerald-600" : "text-rose-600"
//                 }`}
//               >
//                 {item.transactiontype}
//               </td>

//               <td className="py-2 pr-4">{item.lotsize}</td>
//               <td className="py-2 pr-4">{rupee(item.averageprice)}</td>

//                   <td className="py-2 pr-4">{item.orderstatus}</td>
//             </tr>
//           ))}

//           {summary?.orderData?.length === 0 && (
//             <tr>
//               <td colSpan={5} className="py-6 text-center text-gray-400">
//                 No recent orders
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//         </div>
//       </section>
//     </div>
//   );
// }






