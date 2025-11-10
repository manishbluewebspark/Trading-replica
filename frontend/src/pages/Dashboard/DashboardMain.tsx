// import { useEffect, useState } from "react";
// import axios from "axios";
//  const [loading, setLoading] = useState<boolean>(false);
// import { useOrderCount } from "../../socket/useOrderCount";



// export default function DashboardMain() {


//  const total = useOrderCount();


//    const [data, setData] = useState([]);

  
// useEffect(() => {
//     const fetchData = async () => {
//       try {
        

//         // ✅ Example API endpoint
//         const res = await axios.get("http://localhost:5000/api/users/get/user/fund", {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`, // optional
//           },
//         });

//         console.log(res);
        

        
//       } catch (err: any) {
       
       
//       } 
//     };

//     fetchData();
//   }, []); // runs once on mount



  
  

//   return (
//     <div className="p-6 space-y-6 bg-[#f8f9fb]">
//       {/* Top controls (mode + trading switch) */}
//       {/* <div className="flex items-center gap-4">
//         <div className="inline-flex rounded-md overflow-hidden border">
//           <button
//             className={`px-4 py-1 text-sm font-medium ${
//               mode === "Semi" ? "bg-indigo-600 text-white" : "bg-white"
//             }`}
//             onClick={() => setMode("Semi")}
//           >
//             Semi
//           </button>
//           <button
//             className={`px-4 py-1 text-sm font-medium ${
//               mode === "Auto" ? "bg-indigo-600 text-white" : "bg-white"
//             }`}
//             onClick={() => setMode("Auto")}
//           >
//             Auto
//           </button>
//         </div>

//         <div className="flex items-center gap-3 text-sm">
//           <span className="text-gray-600">
//             Trading is {trading ? "running" : "stopped"}
//           </span>
//           <label className="relative inline-flex cursor-pointer items-center">
//             <input
//               type="checkbox"
//               className="sr-only"
//               checked={trading}
//               onChange={() => setTrading((v) => !v)}
//             />
//             <span className="w-11 h-6 bg-gray-300 rounded-full transition-all peer-checked:bg-green-500"></span>
//             <span className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow transition-all translate-x-0 peer-checked:translate-x-5" />
//           </label>
//         </div>
//       </div> */}

//       {/* Row 1 */}
//       <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
//         {/* Generate Token Card */}
//         <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between col-span-1">
//           <div>
//             <button className="text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-md text-sm font-semibold">
//               Generate Token
//             </button>
//             <div className="text-xs text-gray-500 mt-2">Please generate token</div>
//           </div>
//           <div className="w-20 h-12 bg-gradient-to-tr from-orange-400 to-red-500 rounded-lg opacity-80" />
//         </div>

//         {/* Statistics Card */}
//         <div className="bg-white rounded-xl shadow p-4 col-span-1">
//           <div className="text-sm font-semibold text-gray-700 mb-3">Statistics</div>
//           <div className="grid grid-cols-4 gap-3 text-center">
//             <StatMini label="Trades Today" value="0" />
//             <StatMini label="Open Positions" value="0" />
//             <StatMini label="Win Rate" value="0%" />
//             <StatMini label="Cumulative P/L" value="₹0" />
//           </div>
//         </div>

//         {/* Orders */}
//         <div className="bg-white rounded-xl shadow p-4 col-span-1">
//           <div className="text-sm font-semibold text-gray-700 mb-3">Orders</div>
//           <div className="h-20 flex items-end">
//             <div className="w-8 h-3 bg-indigo-100 rounded" />
//           </div>
//           <div className="text-2xl font-bold mt-2">{total+1}</div>
//         </div>

//         {/* Profit & Loss */}
//         <div className="bg-white rounded-xl shadow p-4 col-span-1">
//           <div className="text-sm font-semibold text-gray-700 mb-3">Total Fund</div>
//           <div className="text-emerald-600 text-2xl font-bold">₹0.00</div>
//           <div className="text-xs text-gray-400 mt-1">Today</div>
//         </div>
//       </div>

//       {/* Row 2 */}
//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
//         {/* Trade Report */}
//         <div className="bg-white rounded-xl shadow p-4 xl:col-span-2">
//           <div className="flex items-center justify-between mb-4">
//             <div className="text-sm font-semibold text-gray-700">Trade Report</div>
//             <div className="flex items-center gap-4 text-xs">
//               <LegendDot label="Win Trades" className="bg-indigo-500" />
//               <LegendDot label="Lose Trades" className="bg-orange-400" />
//             </div>
//           </div>

//           {/* Simple bar viz */}
//           <div className="h-48 grid grid-cols-12 gap-2 items-end">
//             {Array.from({ length: 1 }).map((_, i) => {
//               const h = i === 10 ? 140 : i === 8 ? 90 : i % 3 === 0 ? 60 : 30;
//               return (
//                 <div key={i} className="flex flex-col items-center gap-2">
//                   <div className="w-5 bg-indigo-400 rounded-t" style={{ height: 50 }} />
//                   <div className="w-5 bg-orange-300 rounded-t" style={{ height: 50 }} />
//                 </div>
//               );
//             })}
//           </div>

//           <div className="text-xs text-gray-400 mt-3">23 Oct </div>
            
//         </div>

//         {/* Earnings */}
//         <div className="bg-white rounded-xl shadow p-4">
//           <div className="text-sm font-semibold text-gray-700 mb-4">Earnings</div>
//           <div className="space-y-2 text-sm">
//             <Row label="Today" value="₹0 turnover" />
//             <Row label="% profit on turnover" value="0%" />
//             <Row label="Turnover" value="0" />
//           </div>
//         </div>
//       </div>

//       {/* Row 3 */}
//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
//         {/* Orders Summary */}
//         <div className="bg-white rounded-xl shadow p-4">
//           <div className="text-sm font-semibold text-gray-700 mb-4">Orders Summary</div>
//           <div className="grid grid-cols-3 gap-4">
//             <SummaryCard label="Total Orders" value="0" />
//             <SummaryCard label="Filled" value="0" />
//             <SummaryCard label="Pending" value="10" />
//           </div>
//         </div>

//         {/* Recent Orders */}
//         <div className="bg-white rounded-xl shadow p-4">
//           <div className="text-sm font-semibold text-gray-700 mb-4">Recent Orders</div>
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="text-gray-500">
//                 <th className="text-left py-2">Symbol</th>
//                 <th className="text-left py-2">Type</th>
//                 <th className="text-left py-2">Qty</th>
//                 <th className="text-left py-2">Price</th>
//                 <th className="text-left py-2">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {/* empty state row */}
//               <tr className="border-t">
//                 <td colSpan={5} className="py-6 text-center text-gray-400">
//                   No recent orders
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* --- small UI helpers --- */

// function StatMini({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="bg-indigo-50 rounded-lg py-3">
//       <div className="text-xl font-bold">{value}</div>
//       <div className="text-[11px] text-gray-600 mt-1">{label}</div>
//     </div>
//   );
// }

// function LegendDot({ label, className }: { label: string; className: string }) {
//   return (
//     <div className="flex items-center gap-2">
//       <span className={`h-3 w-3 rounded-full ${className}`} />
//       <span className="text-gray-600">{label}</span>
//     </div>
//   );
// }

// function Row({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="flex items-center justify-between">
//       <span className="text-gray-500">{label}</span>
//       <span className="font-medium">{value}</span>
//     </div>
//   );
// }

// function SummaryCard({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="bg-white border rounded-lg p-4">
//       <div className="text-2xl font-bold">{value}</div>
//       <div className="text-xs text-gray-500 mt-1">{label}</div>
//     </div>
//   );
// }


// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useOrderCount } from "../../socket/useOrderCount";
// import { toast } from "react-toastify";
// import TradeReportChart from "./TradeReportChart";



// export default function DashboardMain() {

//   const apiUrl = import.meta.env.VITE_API_URL;

 


//   // ✅ all hooks go inside the component, at the top level
//   const total = useOrderCount();

//   const chartData = [
//     { label: "1", win: 2, loss: 1 },
//     { label: "2", win: 0, loss: 2 },
//     { label: "3", win: 3, loss: 1 },
//     { label: "4", win: 1, loss: 0 },
//     { label: "5", win: 4, loss: 2 },
//   ];


//    const [summary, setSummary] = useState({
//     todayTotal: 0,
//     buy: 0,
//     sell: 0,
//     short: 0,
//     cover: 0,
//   });


//    const rows = [
//     { label: "Buy", value: summary.buy, dot: "bg-green-500" },
//     { label: "Sell", value: summary.sell, dot: "bg-rose-500" },
//     { label: "Pending", value: summary.short, dot: "bg-sky-500" },
//     { label: "Rejected", value: summary.cover, dot: "bg-violet-500" },
//   ];


//   console.log(total);
  

//     const [totalOrder, setTotalOrder] = useState("");
//   const [fundData, setData] = useState("");
//     const [profitAndLossData, setProfitAndLossData] = useState("");
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string>("");
// const [reload, setReload] = useState(false);

//   useEffect(() => {
    
//     const fetchData = async () => {
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
//         setTotalOrder(res?.data?.totalOrders||0)
//        setData(data?.availablecash||0);
        

//          // 2️⃣ Second API: (example)
//          const getProfitAndLoss = await axios.get(`${apiUrl}/order/get/profitandloss`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

   
     
//       setProfitAndLossData(getProfitAndLoss.data.data||0)

//       } catch (err: any) {
//         console.error("fetch error:", err);
//         setError(err?.response?.data?.message || "Failed to load data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
    
//   }, [reload]);


//   // Function runs when button is clicked
//   const handleGenerateToken =  async () => {

//        try{
          
//          const {data} = await axios.get(
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

//         //  // 🔘 This function can be called from anywhere (button, etc.)
//           setReload(prev => !prev);  
          
//            toast.success("Login Successful in AngelOne!");

//       // window.location.href = `${apiUrl}/auth/angelone`;

//   }else{
//         toast.error(data.message);
//   }

//        }catch(err:any) {
//         toast.error(err.message);
//   }

        

// }


//   return (
//     <div className="p-6 space-y-6 bg-[#f8f9fb]">
//       {/* Row 1 */}
//       <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
//        <div className="bg-white rounded-xl shadow p-4 flex items-center justify-center col-span-1">
//   <div className="flex flex-col items-center">
//     <button
//       className="text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-md text-sm font-semibold transition hover:bg-red-100 hover:text-red-700 active:scale-95"
//       onClick={handleGenerateToken}
//     >
//       Generate Token
//     </button>
//     <div className="text-xs text-gray-500 mt-2">Please generate token</div>
//   </div>
// </div>

        

//          <div className="bg-white rounded-xl shadow p-4 col-span-1">
//           <div className="text-sm font-semibold text-gray-700 mb-3">Profit & Loss</div>
//           <div className="text-emerald-600 text-2xl font-bold">
//             {loading ? "Loading..." : error ? "—" : `₹${Number(profitAndLossData || 0).toFixed(2)}`}
//           </div>
//           <div className="text-xs text-gray-400 mt-1">
//             {error ? <span className="text-red-500">{error}</span> : "Today"}
//           </div>
//         </div>
      


//         {/* Orders */}
//         <div className="bg-white rounded-xl shadow p-4 col-span-1">
//           <div className="text-sm font-semibold text-gray-700 mb-3">Total Orders</div>
//           {/* <div className="h-20 flex items-end">
//             <div className="w-8 h-3 bg-indigo-100 rounded" />
//           </div> */}

//           {/* <div className="text-2xl font-bold mt-2">{total + 1}</div> */}

//            <div className="text-2xl font-bold mt-2">{totalOrder}</div>

//         </div>

//         {/* Total Fund */}
//         <div className="bg-white rounded-xl shadow p-4 col-span-1">
//           <div className="text-sm font-semibold text-gray-700 mb-3">Total Fund</div>
//           <div className="text-emerald-600 text-2xl font-bold">
//             {loading ? "Loading..." : error ? "—" : `₹${Number(fundData || 0).toFixed(2)}`}
//           </div>
//           <div className="text-xs text-gray-400 mt-1">
//             {error ? <span className="text-red-500">{error}</span> : "Today"}
//           </div>
//         </div>
//       </div>

     
//      <div className="bg-white rounded-2xl shadow p-6 md:p-8 w-full md:w-96">
//       <h3 className="text-xl font-semibold text-gray-600">Orders Summary</h3>

//       <div className="flex items-center justify-center py-10">
//         <div className="text-center">
//           <div className="text-lg font-semibold text-gray-600">Orders Today</div>
//           <div className="text-4xl md:text-5xl font-bold text-gray-700 mt-2">
//             {summary.todayTotal}
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
//         {rows.map((r) => (
//           <div key={r.label} className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <span className={`inline-block w-3 h-3 rounded-full ${r.dot}`} />
//               <span className="text-gray-500">{r.label}</span>
//             </div>
//             <span className="text-gray-800 font-medium">{r.value}</span>
//           </div>
//         ))}
//       </div>
//     </div>

//        <div><TradeReportChart data={chartData} />;</div>


//        {/* Recent Orders start  */}
//         <div className="bg-white rounded-xl shadow p-4">
//   <div className="text-sm font-semibold text-gray-700 mb-4">Recent Orders</div>
//   <table className="w-full text-sm">
//     <thead>
//       <tr className="text-gray-500 border-b">
//         <th className="text-left py-2">Symbol</th>
//         <th className="text-left py-2">Type</th>
//         <th className="text-left py-2">Qty</th>
//         <th className="text-left py-2">Price</th>
//         <th className="text-left py-2">Status</th>
//       </tr>
//     </thead>
//     <tbody>
//       <tr className="border-t">
//         <td className="py-2">SBIN-EQ</td>
//         <td className="py-2 text-green-600 font-medium">BUY</td>
//         <td className="py-2">50</td>
//         <td className="py-2">₹612.50</td>
//         <td className="py-2 text-green-600">Completed</td>
//       </tr>

//       <tr className="border-t">
//         <td className="py-2">INFY-EQ</td>
//         <td className="py-2 text-red-600 font-medium">SELL</td>
//         <td className="py-2">25</td>
//         <td className="py-2">₹1,452.30</td>
//         <td className="py-2 text-green-600">Completed</td>
//       </tr>

//       <tr className="border-t">
//         <td className="py-2">TCS-EQ</td>
//         <td className="py-2 text-green-600 font-medium">BUY</td>
//         <td className="py-2">10</td>
//         <td className="py-2">₹3,455.00</td>
//         <td className="py-2 text-yellow-500">Pending</td>
//       </tr>

//       <tr className="border-t">
//         <td className="py-2">HDFC-EQ</td>
//         <td className="py-2 text-red-600 font-medium">SELL</td>
//         <td className="py-2">15</td>
//         <td className="py-2">₹1,620.75</td>
//         <td className="py-2 text-red-500">Cancelled</td>
//       </tr>

//       <tr className="border-t">
//         <td className="py-2">BANKNIFTY25NOV2539000CE</td>
//         <td className="py-2 text-green-600 font-medium">BUY</td>
//         <td className="py-2">75</td>
//         <td className="py-2">₹245.60</td>
//         <td className="py-2 text-green-600">Reject</td>
//       </tr>
//     </tbody>
//   </table>
// </div>

//  {/* Recent Orders end   */}

     
//     </div>
//   );
// }




import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
// import { useOrderCount } from "../../socket/useOrderCount";


type Summary = { totalOrder: number; orderData: any[] };

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";



const rupee = (n: number) =>
  (Number(n) || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

// Inline chart component
function TradeReportChart({
  data,
  title = "Trade Report",
}: {
  data: Array<{ label: string; win: number; loss: number }>;
  title?: string;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-gray-700">{title}</h3>
        <div className="hidden sm:flex items-center gap-6">
          <span className="flex items-center gap-2 text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#6D5DF6" }} />
            Buy Trades
          </span>
          <span className="flex items-center gap-2 text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#F4A340" }} />
            Sell Trades
          </span>
        </div>
      </div>

      <div style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="label" tick={{ fill: "#6b7280" }} />
            <YAxis allowDecimals={false} tick={{ fill: "#6b7280" }} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }} />
            <Legend />
            <Bar dataKey="win" name="Buy Trades" fill="#6D5DF6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="loss" name="Sell Trades" fill="#F4A340" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


// type Row = { label: string; value: number; dot: string };

// // Helper: build rows from an order list
// function buildRows(orderList: any[] = []): Row[] {
//   let buy = 0, sell = 0, pending = 0, rejected = 0;

//   for (const o of orderList) {
//     const tt = String(o?.transactiontype || '').toLowerCase();       // 'buy' | 'sell'
//     const st = String(o?.orderstatus || o?.status || '').toLowerCase(); // 'complete' | 'rejected' | 'open' | etc.
//     const unfilled = Number(o?.unfilledshares ?? 0);

//     // Normalize status → rejected / pending / complete
//     const isRejected = st.includes('reject');
//     const isComplete = st.includes('complete') || (unfilled === 0 && (st === '' || st === 'done'));
//     const isPending = !isRejected && !isComplete; // everything else

//     if (isRejected) {
//       rejected++;
//     } else if (isPending) {
//       pending++;
//     } else {
//       if (tt === 'buy') buy++;
//       else if (tt === 'sell') sell++;
//       // if neither, ignore silently
//     }
//   }

//   return [
//     { label: 'Buy',      value: buy,      dot: 'bg-green-500' },
//     { label: 'Sell',     value: sell,     dot: 'bg-rose-500' },
//     { label: 'Cancelled',  value: pending,  dot: 'bg-sky-500' },
//     { label: 'Rejected', value: rejected, dot: 'bg-violet-500' },
//   ];
// }

type Row = { label: string; value: number; dot: string };

function buildRows(orderList: any[] = []): Row[] {
  let buy = 0, sell = 0, cancelled = 0, open = 0;

  for (const o of orderList) {
    const tt = String(o?.transactiontype ?? "").toUpperCase();  // BUY | SELL
    const st = String(o?.orderstatus ?? o?.status ?? "").toLowerCase(); // complete | cancelled | open | rejected

    if (tt === "BUY" && st === "complete") {
      buy++;
    } 
    else if (tt === "SELL" && st === "complete") {
      sell++;
    } 
    else if (st === "cancelled") {
      cancelled++;
    } 
    else if (st === "rejected") {
      open++;
    }
  }

  return [
    { label: "Buy", value: buy, dot: "bg-green-500" },
    { label: "Sell", value: sell, dot: "bg-rose-500" },
    { label: "Cancelled", value: cancelled, dot: "bg-sky-500" },
    { label: "Rejected", value: open, dot: "bg-yellow-500" },
  ];
}



export default function DashboardPretty() {


  //  const { total, status, socketId } = useOrderCount();


  //  console.log(total,status,socketId);
   


  // === React states (you can wire these to your APIs) ===
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [profitAndLossData, setProfitAndLossData] = useState<number>(0);
  const [fundData, setFundData] = useState<number>(0);
  const [summary, setSummary] = useState<Summary>({
      totalOrder: 0,
      orderData: [],
    });


    const [imageUrl, setImageUrl] = useState("");



   

  const [rows, setRows] = useState<Row[]>([
    { label: "Buy", value: 0, dot: "bg-green-500" },
    { label: "Sell", value: 0, dot: "bg-rose-500" },
    { label: "Cancelled", value: 0, dot: "bg-sky-500" },
    { label: "Rejected", value: 0, dot: "bg-violet-500" },
  ]);

  const [chartData, setChartData] = useState<Array<{ label: string; win: number; loss: number }>>([
    { label: "1", win: 0, loss: 0 },
    { label: "2", win: 0, loss: 0 },
    { label: "3", win: 0, loss: 0 },
    { label: "4", win: 0, loss: 0 },
    { label: "5", win: 0, loss: 0 },
     { label: "6", win: 0, loss: 0 },
    { label: "7", win: 0, loss: 0 },
    { label: "8", win: 0, loss: 0 },
     { label: "9", win: 0, loss: 0 },
    { label: "10", win: 0, loss: 0 },
     { label: "11", win: 0, loss: 0 },
     { label: "12", win: 0, loss: 0 },
    { label: "13", win: 0, loss: 0 },
    { label: "14", win: 0, loss: 0 },
     { label: "15", win: 0, loss: 0 },
    { label: "16", win: 0, loss: 0 },
  ]);



    const apiUrl = import.meta.env.VITE_API_URL;


  // Example: replace with your real fetch
  useEffect(() => {
    (async () => {
      try {

       const storedUser:any = localStorage.getItem("user");

         const parsedUser = JSON.parse(storedUser);

        setImageUrl(parsedUser.brokerImageLink)
       
   const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

         // 1️⃣ First API: user fund
        const res = await axios.get(
          `${apiUrl}/users/get/user/fund`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          }
        );
        
       let data = res?.data?.data
       setFundData(data?.availablecash||0);


       console.log(res?.data?.totalOrders);
       

    
      setSummary({
        totalOrder:res?.data?.totalOrders?.length||0,
        orderData:res?.data?.totalOrders||[]

      })

      let orderStatusData = buildRows(res?.data?.totalOrders||[])

      setRows(orderStatusData) 
      
      
       // 2️⃣ Third API: (example)
         const getAllTodayTrade = await axios.get(`${apiUrl}/order/dummydatatrade`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });


     
      setProfitAndLossData(getAllTodayTrade?.data?.pnl)
      setChartData(getAllTodayTrade?.data?.data)


      } catch (err: any) {
        console.error("fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
      
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pnl = Number(profitAndLossData || 0);
  const pnlColor = pnl >= 0 ? "text-emerald-600" : "text-rose-600";

  const handleGenerateToken = async() => {

           try{
          
         const {data} = await axios.get(
          `${apiUrl}/users/login/totp/angelone`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

  
       if(data.status==true) {
       
       let angel_auth_token = data.data.jwtToken
       let angel_refresh_token = data.data.refreshToken
       let angel_feed_token = data.data.feedToken

       localStorage.setItem("angel_token", angel_auth_token);
       localStorage.setItem("angel_feed_token", angel_refresh_token);
        localStorage.setItem("angel_refresh_token", angel_feed_token);

    
        toast.success("Login Successful in AngelOne!");
        

                 // 1️⃣ First API: user fund



        const res = await axios.get(
          `${apiUrl}/users/get/user/fund`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          }
        );

      
        


       let fundData = res?.data?.data

         console.log(res?.data,fundData?.availablecash,'hhhy');

       setFundData(fundData?.availablecash||0);


        setSummary({
        totalOrder:res?.data?.totalOrders?.length||0,
        orderData:res?.data?.totalOrders||[]

      })

      let orderStatusData = buildRows(res?.data?.totalOrders||[])

      setRows(orderStatusData) 

      
    
    
      
      
       // 2️⃣ Third API: (example)
         const getAllTodayTrade = await axios.get(`${apiUrl}/order/dummydatatrade`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });


     
      setProfitAndLossData(getAllTodayTrade?.data?.pnl)
      setChartData(getAllTodayTrade?.data?.data)




  
  }else{
        toast.error(data.message);
  }

       }catch(err:any) {
        toast.error(err.message);
  }
        
  };


  console.log(summary,'summary');
  

  


  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">


      {/* Row 1 — Stat cards */}
      <section className="grid grid-cols-12 gap-4">
        {/* Generate Token */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-5 flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <button
                className="text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-md text-sm font-semibold transition hover:bg-rose-100 hover:text-rose-700 active:scale-95"
                onClick={handleGenerateToken}
              >
                Generate Token
              </button>
              <div className="text-xs text-gray-500 mt-2">Please generate token</div>
            </div>
          </div>
        </div>

         {/* AngelOne Logo Only */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-5 flex items-center justify-center">
              <img
                // src="https://upload.wikimedia.org/wikipedia/commons/2/28/AngelOne_logo.png"
                 src={imageUrl||"https://upload.wikimedia.org/wikipedia/commons/2/28/AngelOne_logo.png"}
                alt="AngelOne Logo"
                className="h-12 object-contain"
              />
            </div>
          </div>


        {/* Profit & Loss */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-5">
            <div className="text-sm font-semibold text-gray-700">Profit &amp; Loss</div>
            <div className={`${pnlColor} text-3xl font-bold mt-2`}>
              {loading ? "Loading..." : error ? "—" : rupee(pnl)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{error ? <span className="text-rose-500">{error}</span> : "Today"}</div>
          </div>
        </div>
       
        {/* Total Fund */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full p-5">
            <div className="text-sm font-semibold text-gray-700">Total Fund</div>
            <div className="text-emerald-600 text-3xl font-bold mt-2">
              {loading ? "Loading..." : error ? "—" : rupee(Number(fundData || 0))}
            </div>
            <div className="text-xs text-gray-400 mt-1">{error ? <span className="text-rose-500">{error}</span> : "Today"}</div>
          </div>
        </div>
      </section>

      {/* Row 2 — Orders Summary + Trade Report */}
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

        {/* Trade Report Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <TradeReportChart data={chartData} />
          </div>
        </div>
      </section>

      {/* Row 3 — Recent Orders Table (sample rows) */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-gray-700">Recent Orders</div>
        </div>

        <div className="overflow-x-auto">
          {/* <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left py-2 pr-4">Symbol</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Qty</th>
                <th className="text-left py-2 pr-4">Price</th>
                <th className="text-left py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4">SBIN-EQ</td>
                <td className="py-2 pr-4 font-medium text-emerald-600">BUY</td>
                <td className="py-2 pr-4">50</td>
                <td className="py-2 pr-4">{rupee(612.5)}</td>
                <td className="py-2 pr-4 text-emerald-600">Completed</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">INFY-EQ</td>
                <td className="py-2 pr-4 font-medium text-rose-600">SELL</td>
                <td className="py-2 pr-4">25</td>
                <td className="py-2 pr-4">{rupee(1452.3)}</td>
                <td className="py-2 pr-4 text-emerald-600">Completed</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">TCS-EQ</td>
                <td className="py-2 pr-4 font-medium text-emerald-600">BUY</td>
                <td className="py-2 pr-4">10</td>
                <td className="py-2 pr-4">{rupee(3455)}</td>
                <td className="py-2 pr-4 text-amber-500">Pending</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">HDFC-EQ</td>
                <td className="py-2 pr-4 font-medium text-rose-600">SELL</td>
                <td className="py-2 pr-4">15</td>
                <td className="py-2 pr-4">{rupee(1620.75)}</td>
                <td className="py-2 pr-4 text-rose-500">Cancelled</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">BANKNIFTY25NOV2539000CE</td>
                <td className="py-2 pr-4 font-medium text-emerald-600">BUY</td>
                <td className="py-2 pr-4">75</td>
                <td className="py-2 pr-4">{rupee(245.6)}</td>
                <td className="py-2 pr-4 text-rose-500">Rejected</td>
              </tr>
            </tbody>
          </table> */}
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
              <td className="py-2 pr-4">{rupee(item.price)}</td>

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


