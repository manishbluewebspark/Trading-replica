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


import { useEffect, useState } from "react";
import axios from "axios";
import { useOrderCount } from "../../socket/useOrderCount";


export default function DashboardMain() {

    const apiUrl = import.meta.env.VITE_API_URL;

  // ✅ all hooks go inside the component, at the top level
  const total = useOrderCount();
  const [fundData, setData] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
const [reload, setReload] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          "http://localhost:5000/api/users/get/user/fund",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          }
        );

       let data = res.data.data

       console.log(data);
       
        

        // adjust based on your API shape
        setData(data.availablecash);
      } catch (err: any) {
        console.error("fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reload]);


  // Function runs when button is clicked
  const handleGenerateToken =  async () => {

         const {data} = await axios.get(
          "http://localhost:5000/api/users/login/totp/angelone",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

       console.log('hello 1');
       

       if(data.status==true) {

        console.log('hello 2');
         
       let angel_auth_token = data.data.jwtToken
       let angel_refresh_token = data.data.refreshToken
       let angel_feed_token = data.data.feedToken

       console.log('hello 3');

       localStorage.setItem("angel_token", angel_auth_token);
       localStorage.setItem("angel_feed_token", angel_refresh_token);
        localStorage.setItem("angel_refresh_token", angel_feed_token);

        console.log('hello 4');
        
        //  // 🔘 This function can be called from anywhere (button, etc.)
          setReload(prev => !prev);   

          alert('save')


        
    
      // window.location.href = `${apiUrl}/auth/angelone`;

  };

}


  return (
    <div className="p-6 space-y-6 bg-[#f8f9fb]">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
       <div className="bg-white rounded-xl shadow p-4 flex items-center justify-center col-span-1">
  <div className="flex flex-col items-center">
    <button
      className="text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-md text-sm font-semibold transition hover:bg-red-100 hover:text-red-700 active:scale-95"
      onClick={handleGenerateToken}
    >
      Generate Token
    </button>
    <div className="text-xs text-gray-500 mt-2">Please generate token</div>
  </div>
</div>

        {/* Statistics Card */}
        <div className="bg-white rounded-xl shadow p-4 col-span-1">
          <div className="text-sm font-semibold text-gray-700 mb-3">Statistics</div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <StatMini label="Trades Today" value="0" />
            <StatMini label="Open Positions" value="0" />
            <StatMini label="Win Rate" value="0%" />
            <StatMini label="Cumulative P/L" value="₹0" />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-xl shadow p-4 col-span-1">
          <div className="text-sm font-semibold text-gray-700 mb-3">Orders</div>
          <div className="h-20 flex items-end">
            <div className="w-8 h-3 bg-indigo-100 rounded" />
          </div>
          <div className="text-2xl font-bold mt-2">{total + 1}</div>
        </div>

        {/* Total Fund */}
        <div className="bg-white rounded-xl shadow p-4 col-span-1">
          <div className="text-sm font-semibold text-gray-700 mb-3">Total Fund</div>
          <div className="text-emerald-600 text-2xl font-bold">
            {loading ? "Loading..." : error ? "—" : `₹${Number(fundData || 0).toFixed(2)}`}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {error ? <span className="text-red-500">{error}</span> : "Today"}
          </div>
        </div>
      </div>


     
    </div>
  );
}

/* --- small UI helpers --- */
function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-indigo-50 rounded-lg py-3">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[11px] text-gray-600 mt-1">{label}</div>
    </div>
  );
}
