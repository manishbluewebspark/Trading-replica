
//   import { useEffect, useMemo, useState } from "react";
//   import axios from "axios";
//   import "antd/dist/reset.css";
//   import { toast } from "react-toastify";
//   import { getSocket } from "../../socket/Socket";
//   import { AgGridReact } from "ag-grid-react";
//   import { ColDef } from "ag-grid-community";
//   import "ag-grid-community/styles/ag-grid.css";
//   import "ag-grid-community/styles/ag-theme-alpine.css";
//   import { useNavigate } from "react-router";

//   type Tick = {
//     mode: 1 | 2 | 3;
//     exchangeType: number;
//     token: string | number; // ⬅ allow both
//     sequenceNumber: number;
//     exchangeTimestamp: string;
//     ltpPaiseOrRaw: number;
//     ltp: number;
//   };
  
//   type Order = {
//     variety: string;
//     ordertype: string;
//     producttype: string;
//     duration: string;
//     price: number | string;
//     triggerprice: number | string;
//     quantity: string | number;
//     disclosedquantity: string | number;
//     squareoff: number | null;
//     stoploss: number | null;
//     trailingstoploss: number | null;
//     tradingsymbol: string;
//     transactiontype: string;
//     exchange: string;
//     symboltoken: string | number;
//     ordertag: string | null;
//     instrumenttype: string;
//     strikeprice: number | null;
//     optiontype: string | null;
//     expirydate: string | null;
//     lotsize: string | number;
//     cancelsize: string | number | null;
//     averageprice: number | string;
//     filledshares: string | number | null;
//     unfilledshares: string | number | null;
//     orderid: string;
//     text: string | null;
//     status: string | null;
//     orderstatus: string | null;
//     updatetime: string | null;
//     exchtime: string | null;
//     exchorderupdatetime: string | null;
//     fillid: string;
//     filltime: string;
//     fillprice: number | string;
//     fillsize: number | string;
//     parentorderid: string | null;
//     uniqueorderid: string;
//     exchangeorderid: string | null;
//     updatedAt: any;
//     createdAt: any;
//     userNameId:any
//   };
  
//   function useDebounced<T>(value: T, delay = 250) {
//     const [v, setV] = useState(value);
//     useEffect(() => {
//       const t = setTimeout(() => setV(value), delay);
//       return () => clearTimeout(t);
//     }, [value, delay]);
//     return v as T;
//   }
  
//   const statusColor = (status: string) => {
//     const s = status?.toLowerCase();
//     if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//     if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
//     if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//     return "#64748b";
//   };
  
//   const StatusBadge = ({ status }: { status: string }) => (
//     <span
//       className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
//       style={{
//         backgroundColor: `${statusColor(status)}20`,
//         color: statusColor(status),
//         border: `1px solid ${statusColor(status)}40`,
//       }}
//     >
//       <span
//         className="w-1.5 h-1.5 rounded-full mr-1.5"
//         style={{ backgroundColor: statusColor(status) }}
//       />
//       {status || "-"}
//     </span>
//   );
  
//   const TransactionBadge = ({ type }: { type: string }) => {
//     const isBuy = type === "BUY";
//     const isSell = type === "SELL";
  
//     const config = isBuy
//       ? {
//           bg: "bg-emerald-50",
//           text: "text-emerald-800",
//           border: "border-emerald-200",
//           dot: "bg-emerald-500",
//         }
//       : isSell
//       ? {
//           bg: "bg-rose-50",
//           text: "text-rose-800",
//           border: "border-rose-200",
//           dot: "bg-rose-500",
//         }
//       : {
//           bg: "bg-gray-100",
//           text: "text-gray-800",
//           border: "border-gray-200",
//           dot: "bg-gray-500",
//         };
  
//     return (
//       <span
//         className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}
//       >
//         <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
//         {type || "-"}
//       </span>
//     );
//   };
  
//   export default function HoldingOrderAdmin () {


//      const navigate = useNavigate();

//     const apiUrl = import.meta.env.VITE_API_URL;
//     const [orders, setOrders] = useState<Order[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [search, setSearch] = useState("");
//     const debouncedSearch = useDebounced(search, 50);
//     const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});
//     const [isMobile, setIsMobile] = useState(false);
  
//     const [paginationPageSize, setPaginationPageSize] = useState(10);
  
//     useEffect(() => {
//       const checkMobile = () => setIsMobile(window.innerWidth < 768);
//       checkMobile();
//       window.addEventListener("resize", checkMobile);
//       return () => window.removeEventListener("resize", checkMobile);
//     }, []);
  
//     useEffect(() => {
//       const socket = getSocket();
  
//       const onTick = (tick: Tick) => {
//         setLtpByToken((prev) => {
//           const tokenKey = String(tick.token); // ⬅ normalize key
//           const curr = prev[tokenKey];
//           if (curr === tick.ltp) return prev;
//           const next = { ...prev, [tokenKey]: tick.ltp };
//           // console.log("Updated LTP map:", next);
//           return next;
//         });
//       };
  
//       socket.on("tick", onTick);
  
//       let cancelled = false;


// const handleSellClick = async (item: any) => {
  
//   if (!item || !item.orderid) {
//     alert("Order ID not found");
//     return;
//   }

//   const confirmSell = window.confirm(
//     `Do you want to SELL this order?\nOrder ID: ${item.orderid}`
//   );

//   if (!confirmSell) return;

//   try {
//     // 🔥 Your backend API call
//     const res = await axios.post(
//       `${apiUrl}/admin/single/squareoff`,
//       { orderId: item.orderid },   // 👈 sending this to backend
//       {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       }
//     );

//     if (res.data.status) {

//       toast.success(`Order ${item.orderid} squared off successfully`);

//     } else if(res.data.status==false&&res.data.message=='Unauthorized'){

//        localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             localStorage.removeItem("termsAccepted");
//             localStorage.removeItem("feed_token");
//             localStorage.removeItem("refresh_token");

//             toast.error('Unauthorized User');

//               navigate("/");

//     }else {

//       toast.error(res.data.message || "Failed to square off");

//     }
//   } catch (err: any) {
   
//     toast.error(err?.message || "Something went wrong");
//   }
// };
  
//       async function fetchOrders() {
//         try {
//           const { data } = await axios.get(`${apiUrl}/admin/getall/holdingdata`, {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               AngelOneToken: localStorage.getItem("angel_token") || "",
//             },
//           });
  
//           console.log("RAW holding response:", data);
  
//           if (data.status === true) {
//             const raw = data.data || [];
//             console.log("RAW data.data:", raw);
  
//             // Normalize shape:
//             const normalized: Order[] = (raw as any[]).map((item: any) => {
//               if (item && typeof item === "object" && "0" in item) {
//                 // case: { 0: { ... } }
//                 return item[0];
//               }
//               if (Array.isArray(item)) {
//                 // case: [ { ... } ] -> take first
//                 return item[0];
//               }
//               // already a flat object
//               return item;
//             });
  
//             console.log("NORMALIZED orders:", normalized);
//             setOrders(normalized);
//           } else if (data.status === false && data.message === "Unauthorized") {
//             toast.error("Unauthorized User");
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             localStorage.removeItem("termsAccepted");
//             localStorage.removeItem("feed_token");
//             localStorage.removeItem("refresh_token");
//           } else {
//             setError("Something went wrong");
//             toast.error(data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.log(err);
//           toast.error(err?.message || "Something went wrong");
//         } finally {
//           if (!cancelled) setLoading(false);
//         }
  
//         // const tradeRes = await api.getTodayTrade();
//         // setProfitAndLossData(tradeRes.data.pnl || 0);
//       }
  
//       fetchOrders();
//       setPaginationPageSize(10);
  
//       return () => {
//         cancelled = true;
//         socket.off("tick", onTick);
//       };
//     }, [apiUrl]);
  
//     // Debug: see what goes to the grid
//     useEffect(() => {
//       console.log("ORDERS state (after normalize):", orders);
//     }, [orders]);
  
//     const filtered = useMemo(() => {
//       const q = debouncedSearch.trim().toLowerCase();
//       if (!q) return orders;
  
//       return orders.filter((o) => {
//         const haystack =
//           [
//             o.orderid,
//             o.uniqueorderid,
//             o.tradingsymbol,
//             o.transactiontype,
//             o.instrumenttype,
//             o.ordertype,
//             o.producttype,
//             o.status,
//             o.exchange,
//             o.text,
//             o.updatetime,
//             o.exchangeorderid,
//           ]
//             .filter(Boolean)
//             .join(" ")
//             .toLowerCase() +
//           ` ${o.price ?? ""} ${o.quantity ?? ""} ${o.averageprice ?? ""}`;
//         return haystack.includes(q);
//       });
//     }, [orders, debouncedSearch]);
  
//     const columnDefs: ColDef<Order>[] = useMemo(
//       () => [

//       {
//       headerName: "Sell",
//       field: "userNameId",
//       width: 200,
//       minWidth: 180,
//       cellStyle: { borderRight: "1px solid #3a69a7ff" },

//       cellRenderer: (params: any) => {
//         const order = params.data as Order;

//         return (
//           <div className="py-2 flex items-center justify-between">
            
            
//             {/* SELL BUTTON */}
//             <button
//               onClick={() => handleSellClick(order)}
//               className="ml-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
//             >
//               SELL
//             </button>
//           </div>
//         );
//       },
//     },

//           {
//           headerName: "UserId",
//           field: "userNameId",
//           cellRenderer: (params: any) => {
//             const order = params.data as Order;
//             return (
//               <div className="py-2">
//                 <div className="font-semibold text-gray-900">
//                   {order.userNameId}
//                 </div>
              
//               </div>
//             );
//           },
//           width: 200,
//           minWidth: 180,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "Symbol",
//           field: "tradingsymbol",
//           cellRenderer: (params: any) => {
//             const order = params.data as Order;
//             return (
//               <div className="py-2">
//                 <div className="font-semibold text-gray-900">
//                   {order.tradingsymbol}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-0.5">
//                   {order.exchange}
//                 </div>
//               </div>
//             );
//           },
//           width: 200,
//           minWidth: 180,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "Instrument",
//           field: "instrumenttype",
//           cellRenderer: (params: any) => {
//             return <div className="py-2">{params.value}</div>;
//           },
//           width: 120,
//           minWidth: 120,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "Type",
//           field: "transactiontype",
//           cellRenderer: (params: any) => {
//             return (
//               <div className="py-2">
//                 <TransactionBadge type={params.value} />
//               </div>
//             );
//           },
//           width: 120,
//           minWidth: 100,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "OrderType",
//           field: "ordertype",
//           cellRenderer: (params: any) => {
//             return <div className="py-2">{params.value}</div>;
//           },
//           width: 140,
//           minWidth: 120,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "ProductType",
//           field: "producttype",
//           cellRenderer: (params: any) => {
//             return <div className="py-2">{params.value}</div>;
//           },
//           width: 130,
//           minWidth: 120,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "Price",
//           field: "fillprice",
//           cellRenderer: (params: any) => {
//             return <div className="py-2">{params.value || "—"}</div>;
//           },
//           width: 120,
//           minWidth: 100,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         // {
//         //   headerName: "PnL",
//         //   field: "symboltoken",
//         //   cellRenderer: (params: any) => {
//         //     const order = params.data as Order;
  
//         //     console.log(ltpByToken,'ltpByToken');
            
  
//         //     const live = order.symboltoken
//         //       ? ltpByToken[String(order.symboltoken)] // ⬅ normalize key here
//         //       : undefined;
  
//         //     const fillPrice = Number(order.fillprice ?? 0);
//         //     const fillSize = Number(order.fillsize ?? 0);
  
//         //     const pnl =
//         //       live !== undefined && fillSize
//         //         ? (live - fillPrice) * fillSize
//         //         : null;
  
//         //     if (pnl === null) {
//         //       return <span className="text-gray-400">—</span>;
//         //     }
  
//         //     const pnlFixed = pnl.toFixed(2);
  
//         //     const isPositive = pnl > 0;
//         //     const isNegative = pnl < 0;
  
//         //     const bgClass = isPositive
//         //       ? "bg-green-100"
//         //       : isNegative
//         //       ? "bg-red-100"
//         //       : "bg-gray-200";
  
//         //     const textClass = isPositive
//         //       ? "text-green-800"
//         //       : isNegative
//         //       ? "text-red-800"
//         //       : "text-gray-800";
  
//         //     const borderClass = isPositive
//         //       ? "border border-green-300"
//         //       : isNegative
//         //       ? "border border-red-300"
//         //       : "border border-gray-300";
  
//         //     return (
//         //       <div className="py-2">
//         //         <span
//         //           className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${bgClass} ${textClass} ${borderClass}`}
//         //         >
//         //           ₹{isPositive ? "+" + pnlFixed : pnlFixed}
//         //         </span>
//         //       </div>
//         //     );
//         //   },
//         //   width: 120,
//         //   minWidth: 100,
//         //   cellStyle: { borderRight: "1px solid #e2e8f0" },
//         // },
//         {
//           headerName: "OrderQty",
//           field: "quantity",
//           cellRenderer: (params: any) => {
//             return <div className="py-2 text-center">{params.value}</div>;
//           },
//           width: 100,
//           minWidth: 80,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "TradeQty",
//           field: "fillsize",
//           cellRenderer: (params: any) => {
//             return <div className="py-2 text-center">{params.value}</div>;
//           },
//           width: 100,
//           minWidth: 80,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "OrderID",
//           field: "orderid",
//           cellRenderer: (params: any) => {
//             return (
//               <div className="py-2">
//                 <code className="text-xs bg-gray-100 px-2 py-1 rounded border font-mono text-gray-700">
//                   {params.value}
//                 </code>
//               </div>
//             );
//           },
//           width: 200,
//           minWidth: 180,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "TradeID",
//           field: "fillid",
//           cellRenderer: (params: any) => {
//             return (
//               <div className="py-2">
//                 <code className="text-xs bg-gray-100 px-2 py-1 rounded border font-mono text-gray-700">
//                   {params.value}
//                 </code>
//               </div>
//             );
//           },
//           width: 160,
//           minWidth: 140,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "Status",
//           field: "status",
//           cellRenderer: (params: any) => {
//             const status = params.data.status || params.data.orderstatus;
//             return (
//               <div className="py-2">
//                 <StatusBadge status={status} />
//               </div>
//             );
//           },
//           width: 140,
//           minWidth: 120,
//           cellStyle: { borderRight: "1px solid #e2e8f0" },
//         },
//         {
//           headerName: "Message",
//           field: "text",
//           cellRenderer: (params: any) => {
//             return (
//               <div className="py-2">
//                 {params.value ? (
//                   <span
//                     className="text-sm text-gray-600"
//                     title={params.value}
//                   >
//                     {params.value}
//                   </span>
//                 ) : (
//                   <span className="text-gray-400 text-sm">—</span>
//                 )}
//               </div>
//             );
//           },
//           width: 250,
//           minWidth: 200,
//           flex: 1,
//         },
//       ],
//       [ltpByToken]
//     );
  
//     const defaultColDef = useMemo(
//       () => ({
//         resizable: true,
//         sortable: true,
//         filter: true,
//         wrapHeaderText: true,
//         autoHeaderHeight: true,
//         suppressMovable: true,
//         cellStyle: {
//           borderRight: "1px solid #e2e8f0",
//           display: "flex",
//           alignItems: "center",
//         },
//       }),
//       []
//     );
  
//     const getRowStyle = () => {
//       return {
//         height: "70px",
//         display: "flex",
//         alignItems: "center",
//         borderBottom: "1px solid #e2e8f0",
//       };
//     };
  
//     const MobileOrderCard = ({ order }: { order: Order }) => {
//       const live = order.symboltoken
//         ? ltpByToken[String(order.symboltoken)] // ⬅ same normalization here
//         : undefined;
  
//       const fillPrice = Number(order.fillprice ?? 0);
//       const fillSize = Number(order.fillsize ?? 0);
  
//       const pnlValue =
//         live !== undefined && fillSize ? (live - fillPrice) * fillSize : null;
  
//       const pnl =
//         pnlValue !== null ? pnlValue.toFixed(2) : "—";
  
//       const pnlClass =
//         pnlValue === null
//           ? "text-gray-500"
//           : pnlValue >= 0
//           ? "text-emerald-600"
//           : "text-rose-600";
  
//       return (
//         <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
//           <div className="flex justify-between items-start mb-3">
//             <div>
//               <h3 className="font-semibold text-gray-900 text-lg">
//                 {order.tradingsymbol}
//               </h3>
//               <p className="text-sm text-gray-600">{order.instrumenttype}</p>
//             </div>
//             <TransactionBadge type={order.transactiontype} />
//           </div>
  
//           <div className="grid grid-cols-2 gap-3 text-sm mb-3">
//             <div>
//               <span className="text-gray-500">Order Type</span>
//               <p className="font-medium">{order.ordertype}</p>
//             </div>
//             <div>
//               <span className="text-gray-500">Product</span>
//               <p className="font-medium">{order.producttype}</p>
//             </div>
//             <div>
//               <span className="text-gray-500">Price</span>
//               <p className="font-medium">{order.fillprice || "—"}</p>
//             </div>
//             <div>
//               <span className="text-gray-500">PnL</span>
//               <p className={`font-medium ${pnlClass}`}>
//                 {pnl !== "—" ? `₹${pnl}` : pnl}
//               </p>
//             </div>
//             <div>
//               <span className="text-gray-500">Quantity</span>
//               <p className="font-medium">{order.quantity}</p>
//             </div>
//             <div>
//               <span className="text-gray-500">Filled</span>
//               <p className="font-medium">{order.fillsize}</p>
//             </div>
//           </div>
  
//           <div className="border-t border-gray-100 pt-3 space-y-2">
//             <div className="flex justify-between items-center">
//               <span className="text-gray-500 text-sm">Order ID</span>
//               <span className="font-mono text-sm">{order.orderid}</span>
//             </div>
//             <div className="flex justify-between items-center">
//               <span className="text-gray-500 text-sm">Status</span>
//               <StatusBadge status={order.status || order.orderstatus || ""} />
//             </div>
//             {order.text && (
//               <div>
//                 <span className="text-gray-500 text-sm">Message</span>
//                 <p className="text-sm mt-1 text-gray-700 line-clamp-2">
//                   {order.text}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       );
//     };
  
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 font-sans">
//         <div className="max-w-7xl mx-auto">
//           <div className="mb-8">
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">
//               Holding Positions
//             </h1>
//             <p className="text-gray-600">Monitor your current holding history</p>
//           </div>
  
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
//             <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
//               <div className="flex-1 w-full lg:max-w-lg">
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <svg
//                       className="h-5 w-5 text-gray-400"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                       />
//                     </svg>
//                   </div>
//                   <input
//                     type="text"
//                     placeholder="Search orders by ID, symbol, type, status..."
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     className="block w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
//                   />
//                 </div>
//               </div>
  
//               <div className="flex items-stretch sm:items-center gap-4 w-full lg:w-auto">
//                 {/* P&L & other controls can go here */}
//               </div>
//             </div>
//           </div>
  
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//             {isMobile ? (
//               <div className="p-4">
//                 {loading && (
//                   <div className="flex justify-center items-center py-12">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                   </div>
//                 )}
  
//                 {error && !loading && (
//                   <div className="text-center py-8 text-rose-500 bg-rose-50 rounded-lg">
//                     {error}
//                   </div>
//                 )}
  
//                 {!loading && !error && filtered.length === 0 && (
//                   <div className="text-center py-12">
//                     <svg
//                       className="mx-auto h-12 w-12 text-gray-400"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={1}
//                         d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                       />
//                     </svg>
//                     <h3 className="mt-4 text-lg font-medium text-gray-900">
//                       No orders found
//                     </h3>
//                     <p className="mt-2 text-gray-500">
//                       Try adjusting your search criteria
//                     </p>
//                   </div>
//                 )}
  
//                 {!loading &&
//                   !error &&
//                   filtered.map((order) => (
//                     <MobileOrderCard key={order.orderid} order={order} />
//                   ))}
//               </div>
//             ) : (
//               <div
//                 className="ag-theme-alpine custom-ag-grid"
//                 style={{ height: "600px", width: "100%" }}
//               >
//                 <AgGridReact
//                   rowData={filtered}
//                   columnDefs={columnDefs}
//                   defaultColDef={defaultColDef}
//                   loading={loading}
//                   getRowStyle={getRowStyle}
//                   rowHeight={50}
//                   headerHeight={50}
//                   pagination={true}
//                   paginationPageSize={paginationPageSize}
//                   paginationPageSizeSelector={[10, 25, 50, 100]}
//                   enableCellTextSelection={true}
//                   ensureDomOrder={true}
//                   suppressCellFocus={true}
//                   animateRows={true}
//                   enableRangeSelection={true}
//                   enableRangeHandle={true}
//                   enableCharts={true}
//                   enableFillHandle={true}
//                   rowClass="ag-row-custom"
//                   suppressRowHoverHighlight={false}
//                   enableBrowserTooltips={true}
//                   overlayLoadingTemplate={
//                     '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
//                   }
//                   overlayNoRowsTemplate={
//                     '<div class="flex flex-col items-center justify-center h-full text-gray-500"><svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No orders match your search criteria</div>'
//                   }
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }





import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { getSocket } from "../../socket/Socket";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useNavigate } from "react-router";

type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string | number;
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
  price: number | string;
  triggerprice: number | string;
  quantity: string | number;
  disclosedquantity: string | number;
  squareoff: number | null;
  stoploss: number | null;
  trailingstoploss: number | null;
  tradingsymbol: string;
  transactiontype: string;
  exchange: string;
  symboltoken: string | number;
  ordertag: string | null;
  instrumenttype: string;
  strikeprice: number | null;
  optiontype: string | null;
  expirydate: string | null;
  lotsize: string | number;
  cancelsize: string | number | null;
  averageprice: number | string;
  filledshares: string | number | null;
  unfilledshares: string | number | null;
  orderid: string;
  text: string | null;
  status: string | null;
  orderstatus: string | null;
  updatetime: string | null;
  exchtime: string | null;
  exchorderupdatetime: string | null;
  fillid: string;
  filltime: string;
  fillprice: number | string;
  fillsize: number | string;
  parentorderid: string | null;
  uniqueorderid: string;
  exchangeorderid: string | null;
  updatedAt: any;
  createdAt: any;
  userNameId: any;
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
      border: `1px solid ${statusColor(status)}40`,
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

  const config = isBuy
    ? {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      }
    : isSell
    ? {
        bg: "bg-rose-50",
        text: "text-rose-800",
        border: "border-rose-200",
        dot: "bg-rose-500",
      }
    : {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
        dot: "bg-gray-500",
      };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      {type || "-"}
    </span>
  );
};


const pnlPill = (val: number | null | undefined) => {
  const n = Number(val);
  const isPositive = n > 0;
  const isNegative = n < 0;

  const colorClass = isPositive
    ? "text-green-700"
    : isNegative
    ? "text-red-700"
    : "text-gray-800";

  const bgClass = isPositive
    ? "bg-green-100"
    : isNegative
    ? "bg-red-100"
    : "bg-gray-200";

  return (
    <span className={`px-2.5 py-1 rounded-full font-medium ${colorClass} ${bgClass}`}>
      {Number.isFinite(n) ? n.toFixed(2) : "—"}
    </span>
  );
};

export default function HoldingOrderAdmin() {
  
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 50);
  const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [paginationPageSize, setPaginationPageSize] = useState(10);

  
  // ✅ SELL handler – top-level, not inside useEffect
  const handleSellClick = useCallback(
    async (item: Order) => {
     
      if (!item || !item.orderid) {
        alert("Order ID not found");
        return;
      }

      const confirmSell = window.confirm(
        `Do you want to SELL this order?\nOrder ID: ${item.orderid}`
      );

      if (!confirmSell) return;

      try {
        const res = await axios.post(
          `${apiUrl}/admin/single/squareoff`,
          { orderId: item.orderid },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (res.data.status) {
          toast.success(`Order ${item.orderid} squared off successfully`);
        } else if (
          res.data.status === false &&
          res.data.message === "Unauthorized"
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("termsAccepted");
          localStorage.removeItem("feed_token");
          localStorage.removeItem("refresh_token");

          toast.error("Unauthorized User");
          navigate("/");
        } else {
          toast.error(res.data.message || "Failed to square off");
        }
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    },
    [apiUrl, navigate]
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
        const { data } = await axios.get(
          `${apiUrl}/admin/getall/holdingdata`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              AngelOneToken: localStorage.getItem("angel_token") || "",
            },
          }
        );

       

        if (data.status === true) {
          const raw = data.data || [];
         

          const normalized: Order[] = (raw as any[]).map((item: any) => {
            if (item && typeof item === "object" && "0" in item) {
              return item[0];
            }
            if (Array.isArray(item)) {
              return item[0];
            }
            return item;
          });

          console.log("NORMALIZED orders:", normalized);
          setOrders(normalized);
        } else if (data.status === false && data.message === "Unauthorized") {
          toast.error("Unauthorized User");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("termsAccepted");
          localStorage.removeItem("feed_token");
          localStorage.removeItem("refresh_token");
        } else {
          setError("Something went wrong");
          // toast.error(data?.message || "Something went wrong");
        }
      } catch (err: any) {
        console.log(err);
        toast.error(err?.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();
    setPaginationPageSize(10);

    return () => {
      cancelled = true;
      // socket.off("tick", onTick);
    };
  }, [apiUrl]);

  useEffect(() => {
    console.log("ORDERS state (after normalize):", orders);
  }, [orders]);

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

  const columnDefs: ColDef<Order>[] = useMemo(
    () => [
      // {
      //   headerName: "Sell",
      //   field: "userNameId",
      //   width: 200,
      //   minWidth: 180,
      //   cellStyle: { borderRight: "1px solid #e2e8f0" },
      //   cellRenderer: (params: any) => {
      //     const order = params.data as Order;
      //     return (
      //       <div className="py-2 flex items-center justify-center">
      //         <button
      //           onClick={() => handleSellClick(order)}
      //           className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
      //         >
      //           SELL
      //         </button>
      //       </div>
      //     );
      //   },
      // },

{
  headerName: "Sell",
  field: "userNameId",
  width: 120,
  minWidth: 90,
  cellStyle: { borderRight: "1px solid #e2e8f0" },
  cellRenderer: (params: any) => {
    const order = params.data as Order;
    return (
//       <div className="py-2 flex items-center justify-center">
//         <button
//           onClick={() => handleSellClick(order)}
//          className="px-4 py-1.5 text-xs font-semibold rounded-md
// text-white shadow-sm
// bg-gradient-to-r from-green-500 to-green-700
// hover:from-green-600 hover:to-green-800
// transition-all duration-200"
//         >
//           SELL
//         </button>
//       </div>

<div className="py-2 flex items-center justify-center">
  <button
    onClick={() => handleSellClick(order)}
    disabled={order.transactiontype === "SELL"}
    title={order.transactiontype === "SELL" ? "Already Sold" : "Click to Sell"}
    className={`
      inline-flex items-center gap-[6px]
      px-[14px] py-[4px]
      rounded-[16px]
      text-[12px] font-semibold
      tracking-[0.5px]
      text-white!
      border-0
      transition-all duration-200 ease-in-out
      ${
        order.transactiontype === "SELL"
          ? "bg-gray-400 cursor-not-allowed opacity-60"
          : "bg-[#dc2626] hover:bg-red-700 cursor-pointer"
      }
    `}
  >
    <span className="text-[13px] leading-none">⬇</span>
    SELL
  </button>
</div>




    );
  },
}
,
      {
        headerName: "UserId",
        field: "userNameId",
        cellRenderer: (params: any) => {
          const order = params.data as Order;
          return (
            <div className="py-2">
              <div className="font-semibold text-gray-900">
                {order.userNameId}
              </div>
            </div>
          );
        },
        width: 120,
        minWidth: 80,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
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
        width: 250,
        minWidth: 200,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
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
        width: 100,
        minWidth: 80,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
    
      {
        headerName: "Price",
        field: "fillprice",
        cellRenderer: (params: any) => {
          return <div className="py-2">{params.value || "—"}</div>;
        },
        width: 80,
        minWidth: 50,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },

{
        headerName: "CMP",
        width: 110,
        sortable: false,
        filter: false,
        valueGetter: (p) => {
          const d: any = p.data;
          if (d?.__rowType === "DETAIL") return undefined;
          const t = d?.symboltoken;
          return t ? ltpByToken[t] : undefined;
        },
        cellRenderer: (p: any) => (p.value !== undefined ? p.value : "—"),
      },

      {
        headerName: "PnL",
        width: 140,
        sortable: false,
        filter: false,
        valueGetter: (p) => {
          const d: any = p.data;
          if (d?.__rowType === "DETAIL") return null;

          const token = d?.symboltoken;
          const live = token ? ltpByToken[token] : undefined;
          const price = Number(d?.price ?? 0);
          const qty = Number(d?.quantity ?? 0);
          if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
          return (live - price) * qty;
        },
        cellRenderer: (p: any) => pnlPill(p.value),
      },
 

      {
        headerName: "OrderQty",
        field: "quantity",
        cellRenderer: (params: any) => {
          return <div className="py-2 text-center">{params.value}</div>;
        },
         width: 80,
        minWidth: 50,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "TradeQty",
        field: "fillsize",
        cellRenderer: (params: any) => {
          return <div className="py-2 text-center">{params.value}</div>;
        },
         width: 80,
        minWidth: 50,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
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
        cellStyle: { borderRight: "1px solid #e2e8f0" },
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
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Instrument",
        field: "instrumenttype",
        cellRenderer: (params: any) => {
          return <div className="py-2">{params.value}</div>;
        },
        width: 120,
        minWidth: 120,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
        {
        headerName: "OrderType",
        field: "ordertype",
        cellRenderer: (params: any) => {
          return <div className="py-2">{params.value}</div>;
        },
        width: 140,
        minWidth: 120,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "ProductType",
        field: "producttype",
        cellRenderer: (params: any) => {
          return <div className="py-2">{params.value}</div>;
        },
        width: 130,
        minWidth: 120,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
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
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Message",
        field: "text",
        cellRenderer: (params: any) => {
          return (
            <div className="py-2">
              {params.value ? (
                <span
                  className="text-sm text-gray-600"
                  title={params.value}
                >
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
        flex: 1,
      },
    ],
    [ltpByToken, handleSellClick]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      suppressMovable: true,
      cellStyle: {
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
      },
    }),
    []
  );

  const getRowStyle = () => {
    return {
      height: "70px",
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid #e2e8f0",
    };
  };

  const MobileOrderCard = ({ order }: { order: Order }) => {
    const live = order.symboltoken
      ? ltpByToken[String(order.symboltoken)]
      : undefined;

    const fillPrice = Number(order.fillprice ?? 0);
    const fillSize = Number(order.fillsize ?? 0);

    const pnlValue =
      live !== undefined && fillSize ? (live - fillPrice) * fillSize : null;

    const pnl = pnlValue !== null ? pnlValue.toFixed(2) : "—";

    const pnlClass =
      pnlValue === null
        ? "text-gray-500"
        : pnlValue >= 0
        ? "text-emerald-600"
        : "text-rose-600";

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {order.tradingsymbol}
            </h3>
            <p className="text-sm text-gray-600">{order.instrumenttype}</p>
          </div>
          <TransactionBadge type={order.transactiontype} />
        </div>

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
            <p className={`font-medium ${pnlClass}`}>
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

        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Order ID</span>
            <span className="font-mono text-sm">{order.orderid}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Status</span>
            <StatusBadge status={order.status || order.orderstatus || ""} />
          </div>
          {order.text && (
            <div>
              <span className="text-gray-500 text-sm">Message</span>
              <p className="text-sm mt-1 text-gray-700 line-clamp-2">
                {order.text}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Holding Positions
          </h1>
          <p className="text-gray-600">
            Monitor your current holding history
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
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

            <div className="flex items-stretch sm:items-center gap-4 w-full lg:w-auto">
              {/* Extra controls here */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {isMobile ? (
            <div className="p-4">
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              )}

              {error && !loading && (
                <div className="text-center py-8 text-rose-500 bg-rose-50 rounded-lg">
                  {error}
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No orders found
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Try adjusting your search criteria
                  </p>
                </div>
              )}

              {!loading &&
                !error &&
                filtered.map((order) => (
                  <MobileOrderCard key={order.orderid} order={order} />
                ))}
            </div>
          ) : (
            <div
              className="ag-theme-alpine custom-ag-grid"
              style={{ height: "600px", width: "100%" }}
            >
              <AgGridReact
                rowData={filtered}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                loading={loading}
                getRowStyle={getRowStyle}
                rowHeight={50}
                headerHeight={50}
                pagination={true}
                paginationPageSize={paginationPageSize}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressCellFocus={true}
                animateRows={true}
                enableRangeSelection={true}
                enableRangeHandle={true}
                enableCharts={true}
                enableFillHandle={true}
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

  