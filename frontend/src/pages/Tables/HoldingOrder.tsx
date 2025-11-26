// import React, { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { toast } from "react-toastify";

// type Holding = {
//   tradingsymbol: string;
//   exchange: string;
//   isin: string;
//   t1quantity: number;
//   realisedquantity: number;
//   quantity: number;
//   authorisedquantity: number;
//   product: string;
//   collateralquantity: number | null;
//   collateraltype: string | null;
//   haircut: number;
//   averageprice: number;
//   ltp: number;
//   symboltoken: string;
//   close: number;
//   profitandloss: number;
//   pnlpercentage: number;
// };

// export default function HoldingOrder() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [orders, setOrders] = useState<Holding[]>([]);
//   const [allOrders, setAllOrders] = useState<Holding[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   // Fetch all holdings
//   const fetchOrders = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data } = await axios.get(`${apiUrl}/admin/get/holdingdata`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (data?.status === true) {
//         const holdings = data.data.holdings || [];
//         setOrders(holdings);
//         setAllOrders(holdings);
//       } else {
//         toast.error(data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message);
//       setError(err?.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//   }, []);

//   // Search function
//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setSearchTerm(value);
//     setCurrentPage(1); // Reset to first page when searching

//     if (!value) {
//       setOrders(allOrders);
//       return;
//     }

//     if (value.length < 2) return;

//     const query = value.toLowerCase();
//     const filtered = allOrders.filter((item) =>
//       Object.values(item).some((v) =>
//         String(v).toLowerCase().includes(query)
//       )
//     );
//     setOrders(filtered);
//   };

//   // Pagination
//   const totalPages = Math.ceil(orders.length / itemsPerPage);
//   const currentItems = useMemo(() => {
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     return orders.slice(startIndex, startIndex + itemsPerPage);
//   }, [orders, currentPage, itemsPerPage]);

//   // Excel Download
//   const handleExcelDownload = () => {
//     const ws = XLSX.utils.json_to_sheet(orders);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Holdings");
//     XLSX.writeFile(wb, `holdings_${new Date().toISOString().split('T')[0]}.xlsx`);
//   };

//   // Format currency
//   const formatCurrency = (value: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(value);
//   };

//   // Format percentage
//   const formatPercentage = (value: number) => {
//     return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
//   };

//   return (
//     <div className="min-h-screen bg-gray-50/30 p-4 md:p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div>
//               <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Holdings</h1>
//               <p className="text-gray-600 mt-1">Manage and track your investment portfolio</p>
//             </div>
//           </div>
//         </div>

//         {/* Controls */}
//         <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6 mb-6">
//           <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
//             <div className="flex-1 w-full lg:max-w-md">
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                   </svg>
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search holdings... (min 2 characters)"
//                   className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
//                   value={searchTerm}
//                   onChange={handleSearch}
//                 />
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
//               <select
//                 value={itemsPerPage}
//                 onChange={(e) => setItemsPerPage(Number(e.target.value))}
//                 className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value={5}>5 per page</option>
//                 <option value={10}>10 per page</option>
//                 <option value={20}>20 per page</option>
//                 <option value={50}>50 per page</option>
//               </select>

//               <button
//                 onClick={handleExcelDownload}
//                 className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
//               >
//                 <div className="text-white flex gap-2">
//                   <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                 </svg>
//                 Export Excel
//                 </div>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Table Container */}
//         <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
//           {/* Desktop Table */}
//           <div className="hidden lg:block overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50/80 border-b">
//                 <tr>
//                   {[
//                     { key: "tradingsymbol", label: "Symbol" },
//                     { key: "exchange", label: "Exchange" },
//                     { key: "quantity", label: "Quantity" },
//                     { key: "averageprice", label: "Avg Price" },
//                     { key: "ltp", label: "LTP" },
//                     { key: "close", label: "Close" },
//                     { key: "profitandloss", label: "P&L" },
//                     { key: "pnlpercentage", label: "P&L %" },
//                   ].map(({ key, label }) => (
//                     <th
//                       key={key}
//                       className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
//                     >
//                       {label}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-gray-200">
//                 {loading && (
//                   <tr>
//                     <td colSpan={8} className="px-6 py-12 text-center">
//                       <div className="flex justify-center items-center">
//                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//                       </div>
//                       <p className="mt-2 text-gray-600">Loading your holdings...</p>
//                     </td>
//                   </tr>
//                 )}

//                 {!loading && currentItems.length === 0 && (
//                   <tr>
//                     <td colSpan={8} className="px-6 py-12 text-center">
//                       <div className="text-gray-500">
//                         <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                         </svg>
//                         <p className="text-lg font-medium">No holdings found</p>
//                         <p className="mt-1">Try adjusting your search criteria</p>
//                       </div>
//                     </td>
//                   </tr>
//                 )}

//                 {!loading && currentItems.map((holding, index) => (
//                   <tr 
//                     key={`${holding.tradingsymbol}-${index}`} 
//                     className="hover:bg-gray-50/80 transition-colors group"
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div>
//                         <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
//                           {holding.tradingsymbol}
//                         </div>
//                         <div className="text-xs text-gray-500">{holding.isin}</div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                         {holding.exchange}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {holding.quantity}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {formatCurrency(holding.averageprice)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {formatCurrency(holding.ltp)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {formatCurrency(holding.close)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className={`text-sm font-semibold ${
//                         holding.profitandloss >= 0 ? 'text-green-600' : 'text-red-600'
//                       }`}>
//                         {formatCurrency(holding.profitandloss)}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                         holding.pnlpercentage >= 0 
//                           ? 'bg-green-100 text-green-800' 
//                           : 'bg-red-100 text-red-800'
//                       }`}>
//                         {formatPercentage(holding.pnlpercentage)}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Mobile Cards */}
//           <div className="lg:hidden">
//             {loading && (
//               <div className="p-8 text-center">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//                 <p className="mt-2 text-gray-600">Loading your holdings...</p>
//               </div>
//             )}

//             {!loading && currentItems.length === 0 && (
//               <div className="p-8 text-center">
//                 <div className="text-gray-500">
//                   <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <p className="text-lg font-medium">No holdings found</p>
//                   <p className="mt-1">Try adjusting your search criteria</p>
//                 </div>
//               </div>
//             )}

//             <div className="divide-y divide-gray-200">
//               {!loading && currentItems.map((holding, index) => (
//                 <div key={`mobile-${holding.tradingsymbol}-${index}`} className="p-4">
//                   <div className="flex justify-between items-start mb-3">
//                     <div>
//                       <h3 className="font-semibold text-gray-900">{holding.tradingsymbol}</h3>
//                       <p className="text-sm text-gray-500">{holding.exchange}</p>
//                     </div>
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                       {holding.product}
//                     </span>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <p className="text-gray-600">Quantity</p>
//                       <p className="font-medium">{holding.quantity}</p>
//                     </div>
//                     <div>
//                       <p className="text-gray-600">Avg Price</p>
//                       <p className="font-medium">{formatCurrency(holding.averageprice)}</p>
//                     </div>
//                     <div>
//                       <p className="text-gray-600">LTP</p>
//                       <p className="font-medium">{formatCurrency(holding.ltp)}</p>
//                     </div>
//                     <div>
//                       <p className="text-gray-600">Close</p>
//                       <p className="font-medium">{formatCurrency(holding.close)}</p>
//                     </div>
//                   </div>

//                   <div className="mt-3 pt-3 border-t border-gray-200">
//                     <div className="flex justify-between items-center">
//                       <div>
//                         <p className="text-sm text-gray-600">P&L</p>
//                         <p className={`font-semibold ${
//                           holding.profitandloss >= 0 ? 'text-green-600' : 'text-red-600'
//                         }`}>
//                           {formatCurrency(holding.profitandloss)}
//                         </p>
//                       </div>
//                       <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
//                         holding.pnlpercentage >= 0 
//                           ? 'bg-green-100 text-green-800' 
//                           : 'bg-red-100 text-red-800'
//                       }`}>
//                         {formatPercentage(holding.pnlpercentage)}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Pagination */}
//           {!loading && totalPages > 1 && (
//             <div className="px-6 py-4 border-t border-gray-200">
//               <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
//                 <div className="text-sm text-gray-700">
//                   Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
//                   <span className="font-medium">
//                     {Math.min(currentPage * itemsPerPage, orders.length)}
//                   </span>{" "}
//                   of <span className="font-medium">{orders.length}</span> results
//                 </div>
                
//                 <div className="flex items-center space-x-2">
//                   <button
//                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                     disabled={currentPage === 1}
//                     className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
//                   >
//                     Previous
//                   </button>
                  
//                   <div className="flex items-center space-x-1">
//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                       let pageNum;
//                       if (totalPages <= 5) {
//                         pageNum = i + 1;
//                       } else if (currentPage <= 3) {
//                         pageNum = i + 1;
//                       } else if (currentPage >= totalPages - 2) {
//                         pageNum = totalPages - 4 + i;
//                       } else {
//                         pageNum = currentPage - 2 + i;
//                       }

//                       return (
//                         <button
//                           key={pageNum}
//                           onClick={() => setCurrentPage(pageNum)}
//                           className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
//                             currentPage === pageNum
//                               ? 'bg-blue-600 text-white'
//                               : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
//                           }`}
//                         >
//                           {pageNum}
//                         </button>
//                       );
//                     })}
//                   </div>

//                   <button
//                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                     disabled={currentPage === totalPages}
//                     className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
//                   >
//                     Next
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import  { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { getSocket } from "../../socket/Socket";
import { useBrokerApi } from "../../api/brokers/brokerSelector";
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string;
  sequenceNumber: number;
  exchangeTimestamp: string;
  ltpPaiseOrRaw: number;
  ltp: number;
};

type Order = {
  variety: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: number;
  triggerprice: number;
  quantity: string;
  disclosedquantity: string;
  squareoff: number;
  stoploss: number;
  trailingstoploss: number;
  tradingsymbol: string;
  transactiontype: string;
  exchange: string;
  symboltoken: string;
  ordertag: string;
  instrumenttype: string;
  strikeprice: number;
  optiontype: string;
  expirydate: string;
  lotsize: string;
  cancelsize: string;
  averageprice: number;
  filledshares: string;
  unfilledshares: string;
  orderid: string;
  text: string;
  status: string;
  orderstatus: string;
  updatetime: string;
  exchtime: string;
  exchorderupdatetime: string;
  fillid: string;
  filltime: string;
  fillprice: string;
  fillsize: string;
  parentorderid: string;
  uniqueorderid: string;
  exchangeorderid: string;
  updatedAt: any;
  createdAt: any;
};

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

const statusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
  if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
  if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
  return "#64748b";
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
    style={{
      backgroundColor: `${statusColor(status)}20`,
      color: statusColor(status),
      border: `1px solid ${statusColor(status)}40`
    }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full mr-1.5"
      style={{ backgroundColor: statusColor(status) }}
    />
    {status || "-"}
  </span>
);

const TransactionBadge = ({ type }: { type: string }) => {
  const isBuy = type === "BUY";
  const isSell = type === "SELL";

  const config = isBuy ? {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500"
  } : isSell ? {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500"
  } : {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-200",
    dot: "bg-gray-500"
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      {type || "-"}
    </span>
  );
};

export default function HoldingOrder() {

  const apiUrl = import.meta.env.VITE_API_URL;
  const { api } = useBrokerApi();
  const [profitAndLossData, setProfitAndLossData] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 50);
  const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);


  console.log(profitAndLossData);
  

  // AG Grid pagination state
  const [paginationPageSize, setPaginationPageSize] = useState(10);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onTick = (tick: Tick) => {
      setLtpByToken((prev) => {
        const curr = prev[tick.token];
        if (curr === tick.ltp) return prev;
        return { ...prev, [tick.token]: tick.ltp };
      });
    };

    socket.on("tick", onTick);

    let cancelled = false;

    async function fetchOrders() {
      try {
        const { data } = await axios.get(`${apiUrl}/admin/get/holdingdata`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "AngelOneToken": localStorage.getItem("angel_token") || "",
          },
        });

        console.log(data);

        if (data.status == true) {
          setOrders(data.data);
        } else if (data.status == false && data.message == 'Unauthorized') {
          toast.error('Unauthorized User');
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("termsAccepted");
          localStorage.removeItem("feed_token");
          localStorage.removeItem("refresh_token");
        } else {
          setError("Something went wrong")
          toast.error(data?.message || "Something went wrong");
        }
      } catch (err: any) {
        console.log(err);
        toast.error(err?.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }

      let tradeRes = await api.getTodayTrade()
      setProfitAndLossData(tradeRes.data.pnl || 0);
    }

    fetchOrders();
    setPaginationPageSize(10)
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      const haystack =
        [
          o.orderid,
          o.uniqueorderid,
          o.tradingsymbol,
          o.transactiontype,
          o.instrumenttype,
          o.ordertype,
          o.producttype,
          o.status,
          o.exchange,
          o.text,
          o.updatetime,
          o.exchangeorderid,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() +
        ` ${o.price ?? ""} ${o.quantity ?? ""} ${o.averageprice ?? ""}`;
      return haystack.includes(q);
    });
  }, [orders, debouncedSearch]);

 

  // AG Grid column definitions with proper TypeScript typing
  const columnDefs: ColDef<Order>[] = useMemo(() => [
    { 
      headerName: "Symbol", 
      field: "tradingsymbol",
      cellRenderer: (params: any) => {
        const order = params.data as Order;
        return (
          <div className="py-2">
            <div className="font-semibold text-gray-900">
              {order.tradingsymbol}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {order.exchange}
            </div>
          </div>
        );
      },
      width: 200,
      minWidth: 180,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "Instrument", 
      field: "instrumenttype",
      cellRenderer: (params: any) => {
        return <div className="py-2">{params.value}</div>;
      },
      width: 120,
      minWidth: 120,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "Type", 
      field: "transactiontype",
      cellRenderer: (params: any) => {
        return (
          <div className="py-2">
            <TransactionBadge type={params.value} />
          </div>
        );
      },
      width: 120,
      minWidth: 100,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "OrderType", 
      field: "ordertype",
      cellRenderer: (params: any) => {
        return <div className="py-2">{params.value}</div>;
      },
      width: 140,
      minWidth: 120,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "ProductType", 
      field: "producttype",
      cellRenderer: (params: any) => {
        return <div className="py-2">{params.value}</div>;
      },
      width: 130,
      minWidth: 120,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "Price", 
      field: "fillprice",
      cellRenderer: (params: any) => {
        return <div className="py-2">{params.value || "—"}</div>;
      },
      width: 120,
      minWidth: 100,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
   {
  headerName: "PnL",
  field: "symboltoken",
  cellRenderer: (params: any) => {
    const order = params.data as Order;

    const live = order.symboltoken
      ? ltpByToken[order.symboltoken]
      : undefined;

    const pnl =
      live !== undefined
        ? ((live - Number(order.fillprice)) * Number(order.fillsize))
        : null;

    // Handle empty
    if (pnl === null) {
      return <span className="text-gray-400">—</span>;
    }

    const pnlFixed = pnl.toFixed(2);

    // Dynamic color classes
    const isPositive = pnl > 0;
    const isNegative = pnl < 0;

    const bgClass = isPositive
      ? "bg-green-100"
      : isNegative
      ? "bg-red-100"
      : "bg-gray-200";

    const textClass = isPositive
      ? "text-green-800"
      : isNegative
      ? "text-red-800"
      : "text-gray-800";

    const borderClass = isPositive
      ? "border border-green-300"
      : isNegative
      ? "border border-red-300"
      : "border border-gray-300";

    return (
      <div className="py-2">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${bgClass} ${textClass} ${borderClass}`}
        >
          ₹{isPositive ? "+" + pnlFixed : pnlFixed}
        </span>
      </div>
    );
  },
  width: 120,
  minWidth: 100,
  cellStyle: { borderRight: '1px solid #e2e8f0' }
},

    { 
      headerName: "OrderQty", 
      field: "quantity",
      cellRenderer: (params: any) => {
        return <div className="py-2 text-center">{params.value}</div>;
      },
      width: 100,
      minWidth: 80,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "TradeQty", 
      field: "fillsize",
      cellRenderer: (params: any) => {
        return <div className="py-2 text-center">{params.value}</div>;
      },
      width: 100,
      minWidth: 80,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "OrderID", 
      field: "orderid",
      cellRenderer: (params: any) => {
        return (
          <div className="py-2">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded border font-mono text-gray-700">
              {params.value}
            </code>
          </div>
        );
      },
      width: 200,
      minWidth: 180,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "TradeID", 
      field: "fillid",
      cellRenderer: (params: any) => {
        return (
          <div className="py-2">
            <code className="text-xs bg-gray-100 px-2 py-1 rounded border font-mono text-gray-700">
              {params.value}
            </code>
          </div>
        );
      },
      width: 160,
      minWidth: 140,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "Status", 
      field: "status",
      cellRenderer: (params: any) => {
        const status = params.data.status || params.data.orderstatus;
        return (
          <div className="py-2">
            <StatusBadge status={status} />
          </div>
        );
      },
      width: 140,
      minWidth: 120,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    { 
      headerName: "Message", 
      field: "text",
      cellRenderer: (params: any) => {
        return (
          <div className="py-2">
            {params.value ? (
              <span className="text-sm text-gray-600" title={params.value}>
                {params.value}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">—</span>
            )}
          </div>
        );
      },
      width: 250,
      minWidth: 200,
      flex: 1
    }
  ], [ltpByToken]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    suppressMovable: true,
    cellStyle: { 
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center'
    },
  }), []);

  // Custom row style to increase height with borders
  const getRowStyle = () => {
    return {
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #e2e8f0'
    };
  };

  const MobileOrderCard = ({ order }: { order: Order }) => {
    const live = order.symboltoken ? ltpByToken[order.symboltoken] : undefined;
    const pnl = live !== undefined
      ? ((live - Number(order.fillprice)) * Number(order.fillsize)).toFixed(2)
      : "—";

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{order.tradingsymbol}</h3>
            <p className="text-sm text-gray-600">{order.instrumenttype}</p>
          </div>
          <TransactionBadge type={order.transactiontype} />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-gray-500">Order Type</span>
            <p className="font-medium">{order.ordertype}</p>
          </div>
          <div>
            <span className="text-gray-500">Product</span>
            <p className="font-medium">{order.producttype}</p>
          </div>
          <div>
            <span className="text-gray-500">Price</span>
            <p className="font-medium">{order.fillprice || "—"}</p>
          </div>
          <div>
            <span className="text-gray-500">PnL</span>
            <p className={`font-medium ${Number(pnl) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {pnl !== "—" ? `₹${pnl}` : pnl}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Quantity</span>
            <p className="font-medium">{order.quantity}</p>
          </div>
          <div>
            <span className="text-gray-500">Filled</span>
            <p className="font-medium">{order.fillsize}</p>
          </div>
        </div>

        {/* Order Info */}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Order ID</span>
            <span className="font-mono text-sm">{order.orderid}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Status</span>
            <StatusBadge status={order.status || order.orderstatus} />
          </div>
          {order.text && (
            <div>
              <span className="text-gray-500 text-sm">Message</span>
              <p className="text-sm mt-1 text-gray-700 line-clamp-2">{order.text}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Holding Positions</h1>
          <p className="text-gray-600">Monitor your current holding history</p>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full lg:max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search orders by ID, symbol, type, status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Stats and Controls */}
            <div className="flex items-stretch sm:items-center gap-4 w-full lg:w-auto">
              {/* PnL Card */}
              {/* <div className="bg-white rounded-xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-lg font-medium opacity-90 uppercase tracking-wide ">
                    <span className="text-black">P&L:</span>
                  </span>
                  <span className={`text-2xl font-bold whitespace-nowrap ${profitAndLossData >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{profitAndLossData?.toFixed(2)}
                  </span>
                </div>
              </div> */}

              {/* Page Size Selector for Desktop */}
              {/* {!isMobile && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">
                    Page Size:
                  </label>
                  <select
                    value={paginationPageSize}
                    onChange={(e) => setPaginationPageSize(Number(e.target.value))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              )} */}
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {isMobile ? (
            /* Mobile View */
            <div className="p-4">
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}

              {error && !loading && (
                <div className="text-center py-8 text-rose-500 bg-rose-50 rounded-lg">
                  {error}
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
                </div>
              )}

              {!loading && !error && filtered.map((order) => (
                <MobileOrderCard key={order.orderid} order={order} />
              ))}
            </div>
          ) : (
            /* Desktop AG Grid with Latest Features */
            <div className="ag-theme-alpine custom-ag-grid" style={{ height: '600px', width: '100%' }}>
              <AgGridReact
                rowData={filtered}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                loading={loading}
                getRowStyle={getRowStyle}
                rowHeight={50}
                headerHeight={50}
                
                // Latest AG Grid Pagination Features
                pagination={true}
                paginationPageSize={paginationPageSize}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                
                // Enhanced Grid Features
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressCellFocus={true}
                animateRows={true}
                enableRangeSelection={true}
                enableRangeHandle={true}
                enableCharts={true}
                enableFillHandle={true}
                
                // Enhanced Styling
                rowClass="ag-row-custom"
                suppressRowHoverHighlight={false}
                enableBrowserTooltips={true}
                
                overlayLoadingTemplate={
                  '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
                }
                overlayNoRowsTemplate={
                  '<div class="flex flex-col items-center justify-center h-full text-gray-500"><svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No orders match your search criteria</div>'
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}