// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { DatePicker, Button } from "antd";
// import dayjs from "dayjs";
// import "antd/dist/reset.css";
// import { toast } from "react-toastify";




// type Order = {
//   variety: string;
//   ordertype: string;
//   producttype: string;
//   duration: string;
//   price: number;
//   triggerprice: number;
//   quantity: string;
//   disclosedquantity: string;
//   squareoff: number;
//   stoploss: number;
//   trailingstoploss: number;
//   tradingsymbol: string;
//   transactiontype: string;
//   exchange: string;
//   symboltoken: string;
//   ordertag: string;
//   instrumenttype: string;
//   strikeprice: number;
//   optiontype: string;
//   expirydate: string;
//   lotsize: string;
//   cancelsize: string;
//   averageprice: number;
//   filledshares: string;
//   unfilledshares: string;
//   orderid: string;
//   text: string;
//   status: string;
//   orderstatus: string;
//   updatetime: string;
//   exchtime: string;
//   exchorderupdatetime: string;
//   fillid: string;
//   filltime: string;
//   fillprice: string;
//   fillsize: string;
//   parentorderid: string;
//   uniqueorderid: string;
//   exchangeorderid: string;
//   createdAt: string;
//   tradedValue:any
// };

// export default function TradeAdmin () {

//   const apiUrl = import.meta.env.VITE_API_URL;

//   const { RangePicker } = DatePicker;


//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [searchTerm, setSearchTerm] = useState("");


//   // final applied range
//     const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
//       null
//     );
  
//     // calendar popup state
//     const [pickerOpen, setPickerOpen] = useState(false);
//     // temporary range while user is selecting inside popup
//     const [panelRange, setPanelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
//       null
//     );




//   // Fetch orders
//   const fetchOrders = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data } = await axios.get(`${apiUrl}/admin/get/table/trade`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (data?.status === true) {
//         setOrders(Array.isArray(data.data) ? data.data : []);
//       } else if (data?.status === false && data?.message === "Unauthorized") {
//         toast.error("Unauthorized User");
//         localStorage.clear();
//       } else {
//         toast.error(data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }

   
//   };

//   // Socket for LTP updates
//   useEffect(() => {
   
//     fetchOrders();

    
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Date filter
//   const handleGetDates = async () => {
//     console.log(dateRange,'dateRange');

//     if (!dateRange) {
//       toast.error("Please select a date range",);
//       return;
//     }
//     const [from, to] = dateRange;
//     const payload = [from.toISOString(), to.toISOString()];

//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.post(`${apiUrl}/admin/datefilter/order`, payload, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           // AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });


//       console.log(res.data);
      

//       if (res.data?.status === true) {
//         setOrders(Array.isArray(res.data.data) ? res.data.data : []);
//         toast.success(res.data?.message || "Filtered orders loaded");
//       } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//         localStorage.clear();
//         toast.error("Session expired. Please log in again.");
//       } else {
//         toast.error(res.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//     const handleCancelDate = async function () {

//    setDateRange(null);
//   setPanelRange(null);

//   // close calendar (optional)
//   setPickerOpen(false);
    
//     fetchOrders();
//   }

//   // 🔍 Backend search on key up
//   const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const raw = e.currentTarget.value;
//     const query = raw.trim();

//     if (!query) {
//       // empty → reset to full list
//       fetchOrders();
//       return;
//     }

//     if (query.length < 3) {
//       // optional guard
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const res = await axios.get(`${apiUrl}/admin/search/order`, {
//         params: { search: query }, // use the typed value directly
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       console.log("search result", res.data.data);

//       if (res.data?.status === true && Array.isArray(res.data.data)) {
//         setOrders(res.data.data);
//       } else {
//         setOrders([]);
//         toast.error(res.data?.message || "No matching orders found");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//       setOrders([]);
//     } finally {
//       // ✅ important: allow table rows to render again
//       setLoading(false);
//     }
//   };

//   // Excel download
//   const handleExcelDownload = () => {
//     const ws = XLSX.utils.json_to_sheet(orders);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
//     XLSX.writeFile(wb, "orders.xlsx");
//   };

//   return (
//     <div
//       style={{
//         padding: 16,
//         fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
//       }}
//     >
//       <h2 style={{ marginBottom: 12 }}>Orders</h2>

//       {/* Date filter + Excel + PnL */}
//       <div
//         style={{
//           display: "flex",
//           gap: 12,
//           alignItems: "center",
//           flexWrap: "wrap",
//           marginBottom: 12,
//         }}
//       >
        
//         <RangePicker
//                  style={{ width: 300 }}
//                  open={pickerOpen}
//                  // important: only react when opening; ignore close from AntD
//                  onOpenChange={(open) => {
//                    if (open) {
//                      setPickerOpen(true);
//                      setPanelRange(dateRange); // initialize with applied range
//                    }
//                  }}
//                  value={panelRange ?? dateRange ?? null}
//                  onCalendarChange={(val) =>
//                    setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//                  }
//                  onChange={(val) =>
//                    setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//                  }
//                  allowClear={false}
//                  ranges={{
//                    Today: [dayjs().startOf("day"), dayjs().endOf("day")],
//                    Yesterday: [
//                      dayjs().subtract(1, "day").startOf("day"),
//                      dayjs().subtract(1, "day").endOf("day"),
//                    ],
//                    "Last 7 Days": [
//                      dayjs().subtract(6, "day").startOf("day"),
//                      dayjs().endOf("day"),
//                    ],
//                    "Last 30 Days": [
//                      dayjs().subtract(29, "day").startOf("day"),
//                      dayjs().endOf("day"),
//                    ],
//                    "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
//                    "Last Month": [
//                      dayjs().subtract(1, "month").startOf("month"),
//                      dayjs().subtract(1, "month").endOf("month"),
//                    ],
//                  }}
//                  renderExtraFooter={() => (
//                    <div
//                      style={{
//                        display: "flex",
//                        justifyContent: "flex-end",
//                        gap: 8,
//                        padding: "8px 12px",
//                      }}
//                    >
//                      <Button
//                        size="small"
//                        onClick={() => {
//                          // discard temp selection and close
//                          setPanelRange(dateRange);
//                          setPickerOpen(false);
//                           handleCancelDate();
//                        }}
//                      >
//                        Cancel
//                      </Button>
       
       
//                      <Button
//                        size="small"
//                        type="primary"
//                        disabled={!panelRange || !panelRange[0] || !panelRange[1]}
//                        onClick={() => {
//                          if (!panelRange) return;
//                          // apply final range
//                          setDateRange(panelRange);
//                          setPickerOpen(false);
//                          // call filter API with selected range
//                          handleGetDates(panelRange);
//                        }}
//                      >
//                        Apply
//                      </Button>
//                    </div>
//                  )}
//                />
       

//         <Button
//           onClick={handleExcelDownload}
//           style={{ backgroundColor: "#3b82f6", color: "white" }}
//         >
//           Excel Download
//         </Button>

//         {/* <div className="flex items-center gap-3 mt-4">
//           <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-center">
//             <div className="text-xs text-gray-500 font-medium">PNL</div>
//             <div
//               className={`text-lg font-semibold mt-0.5 ${
//                 profitAndLossData >= 0 ? "text-emerald-600" : "text-red-600"
//               }`}
//             >
//               ₹{profitAndLossData.toFixed(2)}
//             </div>
//           </div>
//         </div> */}
//       </div>

//       {/* Search box */}
//       <div className="flex justify-start mb-4 gap-4">
//         <div className="w-full sm:w-64 md:w-120">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             onKeyUp={handleKeyUp}
//             placeholder="Search (min 3 chars)"
//             className="border p-2 w-full rounded"
//           />
//         </div>
//       </div>

//    <div
//   style={{
//     border: "1px solid #e5e7eb",
//     borderRadius: 12,
//     overflow: "hidden",
//     background: "#ffffff",
//     boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
//   }}
//   className="max-w-[1080px]"
// >
//   <div style={{ overflowX: "auto" }}>
//     <table style={{ width: "100%", borderCollapse: "collapse" }}>
//       <thead style={{ background: "#f8fafc" }}>
//         <tr>
//           {[
//             "Symbol",
//             "instrumenttype",
//             "Transaction Type",
//             "ordertype",
//             "Product Type",
//               "Price",
//                "Order Qty",
//                  "Traded Qty",
//             "Order ID",
//             "Traded ID",
//            "Status",
//              "Message",
//             "Updated At",
//           ].map((h) => (
//             <th
//               key={h}
//               style={{
//                 textAlign: "left",
//                 padding: "10px 12px",
//                 fontSize: 12,
//                 fontWeight: 600,
//                 color: "#475569",
//                 borderBottom: "1px solid #e5e7eb",
//                 whiteSpace: "nowrap",
//                 position: "sticky",
//                 top: 0,
//                 background: "#f8fafc",
//                 zIndex: 1,
//                 textTransform: "uppercase",
//                 letterSpacing: "0.04em",
//               }}
//             >
//               {h}
//             </th>
//           ))}
//         </tr>
//       </thead>

//       <tbody>
//         {loading && (
//           <tr>
//             <td colSpan={20} style={{ padding: 16, textAlign: "center" }}>
//               Loading orders…
//             </td>
//           </tr>
//         )}

//         {error && !loading && (
//           <tr>
//             <td colSpan={20} style={{ padding: 16, color: "#ef4444" }}>
//               {error}
//             </td>
//           </tr>
//         )}

//         {!loading && !error && orders.length === 0 && (
//           <tr>
//             <td
//               colSpan={20}
//               style={{
//                 padding: 16,
//                 textAlign: "center",
//                 color: "#64748b",
//               }}
//             >
//               No orders found.
//             </td>
//           </tr>
//         )}

//         {!loading &&
//           !error &&
//           orders.map((o, index) => {
            

//             const rowKey =
//               o.orderid ||
//               o.uniqueorderid ||
//               o.exchangeorderid ||
//               `${o.symboltoken || "tok"}-${index}`;

//             // colors for transaction type
//             const isBuy = o.transactiontype === "BUY";
//             const isSell = o.transactiontype === "SELL";

//             const txnBg = isBuy
//               ? "#dcfce7"
//               : isSell
//               ? "#fee2e2"
//               : "#e5e7eb";
//             const txnColor = isBuy
//               ? "#166534"
//               : isSell
//               ? "#991b1b"
//               : "#374151";

//             return (
//               <tr
//                 key={rowKey}
//                 style={{ borderBottom: "1px solid #f1f5f9" }}
//                 className="hover:bg-slate-50 transition-colors"
//               >
//                 {/* Symbol */}
//                 <td style={td} title={o.tradingsymbol}>
//                   <strong>{o.tradingsymbol}</strong>
//                 </td>

//                 {/* instrumenttype */}
//                 <td style={td} title={o.instrumenttype}>
//                   {o.instrumenttype}
//                 </td>
//                 {/* Transaction Type with color pill */}
//                 <td style={td}>
//                   <span
//                     style={{
//                       display: "inline-block",
//                       padding: "2px 10px",
//                       borderRadius: 999,
//                       fontSize: 12,
//                       fontWeight: 600,
//                       backgroundColor: txnBg,
//                       color: txnColor,
//                       textTransform: "uppercase",
//                     }}
//                   >
//                     {o.transactiontype || "-"}
//                   </span>
//                 </td>

//               <td style={td}>{o.ordertype}</td>
//                 <td style={td}>{o.producttype}</td>
//                  <td style={td}>{o.fillprice}</td>
//                   <td
//                   style={td}
//                   title={`Filled: ${o.filledshares} / Unfilled: ${o.unfilledshares}`}
//                 >
//                   {o.quantity}
//                 </td>
//                   <td style={td}>{o.quantity}</td>
//                 <td style={td}>{o.orderid}</td>
//                    <td style={td}>{o.fillid}</td>
//   <td style={td}>
//                   <span
//                     style={{
//                       display: "inline-block",
//                       padding: "2px 10px",
//                       borderRadius: 999,
//                       fontSize: 12,
//                       fontWeight: 500,
//                       color: "#ffffff",
//                       background: statusColor(o.status || o.orderstatus),
//                       textTransform: "capitalize",
//                     }}
//                     title={o.orderstatus}
//                   >
//                     {o.status || o.orderstatus || "-"}
//                   </span>
//                 </td>
//                  <td style={{ ...td, maxWidth: 380 }}>
//                   <span
//                     title={o.text}
//                     style={{
//                       display: "inline-block",
//                       overflow: "hidden",
//                       textOverflow: "ellipsis",
//                       whiteSpace: "nowrap",
//                       maxWidth: 360,
//                     }}
//                   >
//                     {o.text || "—"}
//                   </span>
//                 </td>
//                 <td style={td}>{o.createdAt}</td>
//               </tr>
//             );
//           })}
//       </tbody>
//     </table>
//   </div>
// </div>
//     </div>
//   );
// }

// const td: React.CSSProperties = {
//   padding: "10px 12px",
//   fontSize: 14,
//   color: "#0f172a",
//   whiteSpace: "nowrap",
//   verticalAlign: "top",
// };

// const statusColor = (status: string) => {
//   const s = status?.toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//   if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//   return "#64748b";
// };







// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { DatePicker, Button } from "antd";
// import dayjs, { Dayjs } from "dayjs";
// import "antd/dist/reset.css";
// import { toast } from "react-toastify";

// type Order = {
//   variety: string;
//   ordertype: string;
//   producttype: string;
//   duration: string;
//   price: number;
//   triggerprice: number;
//   quantity: string;
//   disclosedquantity: string;
//   squareoff: number;
//   stoploss: number;
//   trailingstoploss: number;
//   tradingsymbol: string;
//   transactiontype: string;
//   exchange: string;
//   symboltoken: string;
//   ordertag: string;
//   instrumenttype: string;
//   strikeprice: number;
//   optiontype: string;
//   expirydate: string;
//   lotsize: string;
//   cancelsize: string;
//   averageprice: number;
//   filledshares: string;
//   unfilledshares: string;
//   orderid: string;
//   text: string;
//   status: string;
//   orderstatus: string;
//   updatetime: string;
//   exchtime: string;
//   exchorderupdatetime: string;
//   fillid: string;
//   filltime: string;
//   fillprice: string;
//   fillsize: string;
//   parentorderid: string;
//   uniqueorderid: string;
//   exchangeorderid: string;
//   createdAt: string;
//   tradedValue: any;
//   pnl:any;
//   buyvalue: any;
//   buyprice: any;
//   buysize: any;
//   updatedAt:any 
//   userNameId:any
// };

// const { RangePicker } = DatePicker;

// export default function TradeAdmin() {
  
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//       const [totalTradedData, setTotalTradedData] = useState<number>(0);

//   const [searchTerm, setSearchTerm] = useState("");

//   // final applied range
//   const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
//    dayjs().startOf("day"),
//    dayjs().endOf("day"),
//  ]);

//   // calendar popup state
//   const [pickerOpen, setPickerOpen] = useState(false);
  
//   // temporary range while user is selecting inside popup
//     const [panelRange, setPanelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
//     dayjs().startOf("day"),
//     dayjs().endOf("day"),
//   ]);

//   // Fetch all orders
//   const fetchOrders = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data } = await axios.get(`${apiUrl}/admin/get/table/trade`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (data?.status === true) {
//         setOrders(Array.isArray(data.data) ? data.data : []);
//         setTotalTradedData(data.buydata||0)
//       } else if (data?.status === false && data?.message === "Unauthorized") {
//         toast.error("Unauthorized User");
//         localStorage.clear();
//       } else {
//         toast.error(data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Date filter – now accepts rangeParam from Apply
//   const handleGetDates = async (
//     rangeParam?: [Dayjs, Dayjs] | null
//   ): Promise<void> => {
//     const activeRange = rangeParam ?? dateRange;

   

//     if (!activeRange) {
//       toast.error("Please select a date range");
//       return;
//     }

//     const [from, to] = activeRange;
//     const payload = [from.toISOString(), to.toISOString()];

//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/datefilter/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             // AngelOneToken: localStorage.getItem("angel_token") || "",
//           },
//         }
//       );

//       console.log("date filter response:", res.data.buydata);

//       if (res.data?.status === true) {
//         setOrders(Array.isArray(res.data.data) ? res.data.data : []);
//         setTotalTradedData(res?.data?.buydata||0)
//         toast.success(res.data?.message || "Filtered orders loaded");
//       } else if (
//         res.data?.status === false &&
//         res.data?.message === "Unauthorized"
//       ) {
//         localStorage.clear();
//         toast.error("Session expired. Please log in again.");
//       } else {
//         toast.error(res.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Cancel → clear date selection & reload full orders
//   const handleCancelDate = async (): Promise<void> => {
//     setDateRange(null);
//     setPanelRange(null);
//     setPickerOpen(false);
//     await fetchOrders();
//   };

//   // 🔍 Backend search on key up
//   const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {

//     const raw = e.currentTarget.value;
//     const query = raw.trim();

//     if (!query) {
//       // empty → reset to full list
//       fetchOrders();
//       return;
//     }

//     if (query.length < 3) {
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {

//       console.log(query,'query search');
      
//       const res = await axios.post(
//           `${apiUrl}/admin/search/order`,
//           { search: query },
//           {
//              params: { search: query },
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               AngelOneToken: localStorage.getItem("angel_token") || "",
//             },
//           }
//         );

//       console.log("search result", res.data.data);

//       if (res.data?.status === true && Array.isArray(res.data.data)) {
//         setOrders(res.data.data);
//       } else {
//         setOrders([]);
//         toast.error(res.data?.message || "No matching orders found");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//       setOrders([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Excel download
//   const handleExcelDownload = () => {
//     const ws = XLSX.utils.json_to_sheet(orders);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
//     XLSX.writeFile(wb, "orders.xlsx");
//   };

//   return (
//     <div
//       style={{
//         padding: 16,
//         fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
//       }}
//     >
//       <h2 style={{ marginBottom: 12 }}>Orders History</h2>

//       {/* Date filter + Excel */}
//       {/* <div
//         style={{
//           display: "flex",
//           gap: 12,
//           alignItems: "center",
//           flexWrap: "wrap",
//           marginBottom: 12,
//         }}
//       >
//         <RangePicker
//           style={{ width: 300 }}
//           open={pickerOpen}
//           // only react when opening; ignore auto-close by AntD
//           onOpenChange={(open) => {
//             if (open) {
//               setPickerOpen(true);
//               setPanelRange(dateRange); // start from applied range
//             }
//           }}
//           value={panelRange ?? dateRange ?? null}
//           onCalendarChange={(val) =>
//             setPanelRange(val as [Dayjs, Dayjs] | null)
//           }
//           onChange={(val) => setPanelRange(val as [Dayjs, Dayjs] | null)}
//           allowClear={false}
//           ranges={{
//             Today: [dayjs().startOf("day"), dayjs().endOf("day")],
//             Yesterday: [
//               dayjs().subtract(1, "day").startOf("day"),
//               dayjs().subtract(1, "day").endOf("day"),
//             ],
//             "Last 7 Days": [
//               dayjs().subtract(6, "day").startOf("day"),
//               dayjs().endOf("day"),
//             ],
//             "Last 30 Days": [
//               dayjs().subtract(29, "day").startOf("day"),
//               dayjs().endOf("day"),
//             ],
//             "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
//             "Last Month": [
//               dayjs().subtract(1, "month").startOf("month"),
//               dayjs().subtract(1, "month").endOf("month"),
//             ],
//           }}
//           renderExtraFooter={() => (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "flex-end",
//                 gap: 8,
//                 padding: "8px 12px",
//               }}
//             >
//               <Button size="small" onClick={handleCancelDate}>
//                 Cancel
//               </Button>

//               <Button
//                 size="small"
//                 type="primary"
//                 disabled={!panelRange || !panelRange[0] || !panelRange[1]}
//                 onClick={() => {
//                   if (!panelRange) return;
//                   // apply final range to state
//                   setDateRange(panelRange);
//                   setPickerOpen(false);
//                   // call filter API with selected range directly
//                   handleGetDates(panelRange);
//                 }}
//               >
//                 Apply
//               </Button>
//             </div>
//           )}
//         />

//         <Button
//           onClick={handleExcelDownload}
//           style={{ backgroundColor: "#3b82f6", color: "white" }}
//         >
//           Excel Download
//         </Button>
//       </div> */}

//       {/* Date filter + Excel + Total Traded */}
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//           flexWrap: "nowrap", // prevent wrapping to next line
//           marginBottom: 12,
//         }}
//       >
//         {/* Date Range Picker */}
//         <RangePicker
//           style={{ width: 300 }}
//           open={pickerOpen}
//           // important: only react when opening; ignore close from AntD
//           onOpenChange={(open) => {
//             if (open) {
//               setPickerOpen(true);
//               setPanelRange(dateRange); // initialize with applied range
//             }
//           }}
//           value={panelRange ?? dateRange ?? null}
//           onCalendarChange={(val) =>
//             setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//           }
//           onChange={(val) =>
//             setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//           }
//           allowClear={false}
//           ranges={{
//             Today: [dayjs().startOf("day"), dayjs().endOf("day")],
//             Yesterday: [
//               dayjs().subtract(1, "day").startOf("day"),
//               dayjs().subtract(1, "day").endOf("day"),
//             ],
//             "Last 7 Days": [
//               dayjs().subtract(6, "day").startOf("day"),
//               dayjs().endOf("day"),
//             ],
//             "Last 30 Days": [
//               dayjs().subtract(29, "day").startOf("day"),
//               dayjs().endOf("day"),
//             ],
//             "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
//             "Last Month": [
//               dayjs().subtract(1, "month").startOf("month"),
//               dayjs().subtract(1, "month").endOf("month"),
//             ],
//           }}
//           renderExtraFooter={() => (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "flex-end",
//                 gap: 8,
//                 padding: "8px 12px",
//               }}
//             >
//               <Button
//                 size="small"
//                 onClick={() => {
//                   // discard temp selection and close
//                   setPanelRange(dateRange);
//                   setPickerOpen(false);
//                   handleCancelDate();
//                 }}
//               >
//                 Cancel
//               </Button>
      
//               <Button
//                 size="small"
//                 type="primary"
//                 disabled={!panelRange || !panelRange[0] || !panelRange[1]}
//                 onClick={() => {
//                   if (!panelRange) return;
//                   // apply final range
//                   setDateRange(panelRange);
//                   setPickerOpen(false);
//                   // call filter API with selected range
//                   handleGetDates(panelRange);
//                 }}
//               >
//                 Apply
//               </Button>
//             </div>
//           )}
//         />
      
//         {/* Excel Download Button */}
//         <Button
//           onClick={handleExcelDownload}
//           style={{ backgroundColor: "#3b82f6", color: "white" }}
//         >
//           Excel Download
//         </Button>
      
//         {/* Total Traded Badge */}
//         <div
//           style={{
//             padding: "6px 12px",
//             background: "#eef2ff",
//             color: "#1e40af",
//             borderRadius: 6,
//             fontWeight: 600,
//             fontSize: 14,
//             border: "1px solid #c7d2fe",
//             whiteSpace: "nowrap", // prevent inner text from wrapping
//           }}
//         >
//           Total Traded:&nbsp; {totalTradedData}
//         </div>
//       </div>

//       {/* Search box */}
//       <div className="flex justify-start mb-4 gap-4">
//         <div className="w-full sm:w-64 md:w-120">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             onKeyUp={handleKeyUp}
//             placeholder="Search (min 3 chars)"
//             className="border p-2 w-full rounded"
//           />
//         </div>
//       </div>

//       {/* Table */}
//       <div
//         style={{
//           border: "1px solid #e5e7eb",
//           borderRadius: 12,
//           overflow: "hidden",
//           background: "#ffffff",
//           boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
//         }}
//         className="max-w-[1080px]"
//       >
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead style={{ background: "#f8fafc" }}>
//               <tr>
//                 {[
//                   "UserId",
//                   "Symbol",
//                   "instrument",
//                   "Type",
//                   "ordertype",
//                   "ProductType",
//                   "Buy Price",
//                   "Sell Price",
//                   "Quantity",
//                    "PNL Value",
//                   "Order ID",
//                   "Traded ID",
//                   "Status",
//                   "Message",
//                   "Updated At",
//                   "Create At",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     style={{
//                       textAlign: "left",
//                       padding: "10px 12px",
//                       fontSize: 12,
//                       fontWeight: 600,
//                       color: "#475569",
//                       borderBottom: "1px solid #e5e7eb",
//                       whiteSpace: "nowrap",
//                       position: "sticky",
//                       top: 0,
//                       background: "#f8fafc",
//                       zIndex: 1,
//                       // textTransform: "uppercase",
//                       letterSpacing: "0.04em",
//                     }}
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>

//             <tbody>
//               {loading && (
//                 <tr>
//                   <td colSpan={20} style={{ padding: 16, textAlign: "center" }}>
//                     Loading orders…
//                   </td>
//                 </tr>
//               )}

//               {error && !loading && (
//                 <tr>
//                   <td colSpan={20} style={{ padding: 16, color: "#ef4444" }}>
//                     {error}
//                   </td>
//                 </tr>
//               )}

//               {!loading && !error && orders.length === 0 && (
//                 <tr>
//                   <td
//                     colSpan={20}
//                     style={{
//                       padding: 16,
//                       textAlign: "center",
//                       color: "#64748b",
//                     }}
//                   >
//                     No orders found.
//                   </td>
//                 </tr>
//               )}

//               {!loading &&
//                 !error &&
//                 orders.map((o, index) => {
//                   const rowKey =
//                     o.orderid ||
//                     o.uniqueorderid ||
//                     o.exchangeorderid ||
//                     `${o.symboltoken || "tok"}-${index}`;

//                   const isBuy = o.transactiontype === "BUY";
//                   const isSell = o.transactiontype === "SELL";

//                   const txnBg = isBuy
//                     ? "#dcfce7"
//                     : isSell
//                     ? "#fee2e2"
//                     : "#e5e7eb";
//                   const txnColor = isBuy
//                     ? "#166534"
//                     : isSell
//                     ? "#991b1b"
//                     : "#374151";

//                   return (
//                     <tr
//                       key={rowKey}
//                       style={{ borderBottom: "1px solid #f1f5f9" }}
//                       className="hover:bg-slate-50 transition-colors"
//                     >

//                         <td style={td} title={o.userNameId}>
//                         <strong>{o.userNameId}</strong>
//                       </td>

//                       {/* Symbol */}
//                       <td style={td} title={o.tradingsymbol}>
//                         <strong>{o.tradingsymbol}</strong>
//                       </td>

//                       {/* instrumenttype */}
//                       <td style={td} title={o.instrumenttype}>
//                         {o.instrumenttype}
//                       </td>

//                       {/* Transaction Type */}
//                       <td style={td}>
//                         <span
//                           style={{
//                             display: "inline-block",
//                             padding: "2px 10px",
//                             borderRadius: 999,
//                             fontSize: 12,
//                             fontWeight: 600,
//                             backgroundColor: txnBg,
//                             color: txnColor,
//                             textTransform: "uppercase",
//                           }}
//                         >
//                           {/* {o.transactiontype || "-"} */}
//                           BUY
//                         </span>
//                       </td>

//                       <td style={td}>{o.ordertype}</td>
//                       <td style={td}>{o.producttype}</td>

//                         <td style={td}>{o.buyprice}</td>
//                           <td style={td}>{o.fillprice}</td>
//                         <td style={td}>{o.quantity}</td>
//                       <td style={td}>{Number(o.pnl).toFixed(2)}</td>
//                       <td style={td}>{o.orderid}</td>
//                       <td style={td}>{o.fillid}</td>

//                       {/* Status */}
//                       <td style={td}>
//                         <span
//                           style={{
//                             display: "inline-block",
//                             padding: "2px 10px",
//                             borderRadius: 999,
//                             fontSize: 12,
//                             fontWeight: 500,
//                             color: "#ffffff",
//                             background: statusColor(
//                               o.status || o.orderstatus
//                             ),
//                             textTransform: "capitalize",
//                           }}
//                           title={o.orderstatus}
//                         >
//                           {o.status || o.orderstatus || "-"}
//                         </span>
//                       </td>

//                       {/* Message */}
//                       <td style={{ ...td, maxWidth: 380 }}>
//                         <span
//                           title={o.text}
//                           style={{
//                             display: "inline-block",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             whiteSpace: "nowrap",
//                             maxWidth: 360,
//                           }}
//                         >
//                           {o.text || "—"}
//                         </span>
//                       </td>

//                       <td style={td}>{o.updatedAt}</td>
//                       <td style={td}>{o.createdAt}</td>
                      
//                     </tr>
//                   );
//                 })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// const td: React.CSSProperties = {
//   padding: "10px 12px",
//   fontSize: 14,
//   color: "#0f172a",
//   whiteSpace: "nowrap",
//   verticalAlign: "top",
// };

// const statusColor = (status: string) => {
//   const s = status?.toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//   if (s === "rejected" || s === "cancelled" || s === "canceled")
//     return "#ef4444";
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//   return "#64748b";
// };






import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DatePicker, Button } from "antd";
import dayjs, { Dayjs } from "dayjs";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

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
  createdAt: string;
  tradedValue: any;
  pnl: any;
  buyvalue: any;
  buyprice: any;
  buysize: any;
  updatedAt: any;
  userNameId: any;
};

const { RangePicker } = DatePicker;

export default function TradeAdmin() {
  
  const apiUrl = import.meta.env.VITE_API_URL;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTradedData, setTotalTradedData] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");

  // final applied range
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);

  // calendar popup state
  const [pickerOpen, setPickerOpen] = useState(false);

  // temporary range while user is selecting inside popup
  const [panelRange, setPanelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);


    const pnlCellRenderer = (params: any) => {
  const pnl = params.value;
  const numericPnl = Number(pnl);
  const isPositive = numericPnl > 0;
  const isNegative = numericPnl < 0;

  // Text color logic
  const colorClass = isPositive
    ? "text-green-700"
    : isNegative
    ? "text-red-700"
    : "text-gray-800";

  // Background color logic
  const bgClass = isPositive
    ? "bg-green-100"
    : isNegative
    ? "bg-red-100"
    : "bg-gray-200";

  return (
    <span
      className={`px-2.5 py-1 rounded-full font-medium ${colorClass} ${bgClass}`}
    >
      {numericPnl > 0 ? +`${numericPnl.toFixed(2)}` : numericPnl.toFixed(2)}
    </span>
  );
};

  // AG Grid column definitions
  const columnDefs = useMemo(
    () =>
      [
        {
          headerName: "User ID",
          field: "userNameId",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Symbol",
          field: "tradingsymbol",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Instrument",
          field: "instrumenttype",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Type",
          field: "transactiontype",
          cellRenderer: (params: any) => {
            const isBuy = params.value === "BUY";
            const isSell = params.value === "SELL";
            const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
            const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";

            return (
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
                {params.value || "BUY"}
              </span>
            );
          },
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Order Type",
          field: "ordertype",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Product Type",
          field: "producttype",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Buy Price",
          field: "buyprice",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Sell Price",
          field: "fillprice",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Quantity",
          field: "quantity",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "PNL Value",
          field: "pnl",
          cellRenderer: pnlCellRenderer,
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Order ID",
          field: "orderid",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Traded ID",
          field: "fillid",
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Status",
          field: "status",
          cellRenderer: (params: any) => {
            const status = params.value || params.data.orderstatus;
            const s = status?.toLowerCase();
            let color = "#64748b";

            if (s === "complete" || s === "filled" || s === "success") color = "#16a34a";
            else if (s === "rejected" || s === "cancelled" || s === "canceled") color = "#ef4444";
            else if (s === "pending" || s === "open" || s === "queued") color = "#f59e0b";

            return (
              <span
                className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
                style={{ backgroundColor: color }}
                title={params.data.orderstatus}
              >
                {status || params.data.orderstatus || "-"}
              </span>
            );
          },
          filter: true,
          sortable: true,
          width: 200,
          minWidth: 180,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
         {
          headerName: "Buy Time",
          field: "buyTime",
          filter: true,
          sortable: true,
          width: 300,
          minWidth: 250,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Sell Time",
          field: "filltime",
          filter: true,
          sortable: true,
          width: 300,
          minWidth: 250,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
        },
        {
          headerName: "Message",
          field: "text",
          tooltipField: "text",
          filter: true,
          sortable: true,
          width: 450,
          minWidth: 300,
          cellStyle: {
            // whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            borderRight: '1px solid #e2e8f0'
          }
        },
       
      ] as ColDef<Order>[],
    []
  );

  // Default column definition
  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
    sortable: true,
    flex: 1,
    minWidth: 100,
  }), []);




  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${apiUrl}/admin/get/table/trade`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data?.status === true) {
        setOrders(Array.isArray(data.data) ? data.data : []);
        setTotalTradedData(data.buydata || 0);
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Date filter – now accepts rangeParam from Apply
  const handleGetDates = async (
    rangeParam?: [Dayjs, Dayjs] | null
  ): Promise<void> => {
    const activeRange = rangeParam ?? dateRange;

    if (!activeRange) {
      toast.error("Please select a date range");
      return;
    }

    const [from, to] = activeRange;
    const payload = [from.toISOString(), to.toISOString()];

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${apiUrl}/admin/datefilter/order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      console.log("date filter response:", res.data.buydata);

      if (res.data?.status === true) {
        setOrders(Array.isArray(res.data.data) ? res.data.data : []);
        setTotalTradedData(res?.data?.buydata || 0);
        toast.success(res.data?.message || "Filtered orders loaded");
      } else if (
        res.data?.status === false &&
        res.data?.message === "Unauthorized"
      ) {
        localStorage.clear();
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(res.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Cancel → clear date selection & reload full orders
  const handleCancelDate = async (): Promise<void> => {
    setDateRange(null);
    setPanelRange(null);
    setPickerOpen(false);
    await fetchOrders();
  };

  // 🔍 Backend search on key up
  const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    const query = raw.trim();

    if (!query) {
      // empty → reset to full list
      fetchOrders();
      return;
    }

    if (query.length < 3) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(query, "query search");

      const res = await axios.post(
        `${apiUrl}/admin/search/order`,
        { search: query },
        {
          params: { search: query },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        }
      );

      console.log("search result", res.data.data);

      if (res.data?.status === true && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        setOrders([]);
        toast.error(res.data?.message || "No matching orders found");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Excel download
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "orders.xlsx");
  };


  const getRowStyle = () => {
    return {
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #e2e8f0'
    };
  };


  return (
    <div className="p-4 font-sans">
      <h2 className="mb-3 text-xl font-semibold">Orders History</h2>


      <div className="flex justify-between items-center gap-6 mb-3">
        <RangePicker
        format="DD-MMMM-YYYY"
          className="h-11 w-140 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          open={pickerOpen}
          onOpenChange={(open) => {
            if (open) {
              setPickerOpen(true);
              setPanelRange(dateRange);
            }
          }}
          value={panelRange ?? dateRange ?? null}
          onCalendarChange={(val) =>
            setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
          }
          onChange={(val) =>
            setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
          }
          allowClear={false}
          ranges={{
            Today: [dayjs().startOf("day"), dayjs().endOf("day")],
            Yesterday: [
              dayjs().subtract(1, "day").startOf("day"),
              dayjs().subtract(1, "day").endOf("day"),
            ],
            "Last 7 Days": [
              dayjs().subtract(6, "day").startOf("day"),
              dayjs().endOf("day"),
            ],
            "Last 30 Days": [
              dayjs().subtract(29, "day").startOf("day"),
              dayjs().endOf("day"),
            ],
            "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
            "Last Month": [
              dayjs().subtract(1, "month").startOf("month"),
              dayjs().subtract(1, "month").endOf("month"),
            ],
          }}
          renderExtraFooter={() => (
            <div className="flex justify-end gap-2 p-2">
              <Button
                size="small"
                onClick={() => {
                  setPanelRange(dateRange);
                  setPickerOpen(false);
                  handleCancelDate();
                }}
              >
                Cancel
              </Button>

              <Button
                size="small"
                type="primary"
                disabled={!panelRange || !panelRange[0] || !panelRange[1]}
                onClick={() => {
                  if (!panelRange) return;
                  setDateRange(panelRange);
                  setPickerOpen(false);
                  handleGetDates(panelRange);
                }}
              >
                Apply
              </Button>
            </div>
          )}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExcelDownload}
            className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
          >
            <span className="text-white">Excel Download</span>
          </button>
          <div className="px-5 py-3 bg-blue-50 text-blue-800 rounded-lg font-semibold text-sm border border-blue-200 whitespace-nowrap">
            Total Traded: {totalTradedData}
          </div>
        </div>
      </div>

      {/* Search box */}
      <div className="flex justify-start mb-4 gap-4">
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={handleKeyUp}
            placeholder="Search (min 3 chars)"
            className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-32 bg-white rounded-lg border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error</div>
          <p className="text-red-700">{error}</p>
          <Button
            onClick={fetchOrders}
            className="mt-3 bg-red-500 text-white hover:bg-red-600"
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="ag-theme-alpine custom-ag-grid" style={{ height: '600px', width: '100%' }}>
          <AgGridReact
            rowData={orders}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={20}
            suppressCellFocus={true}
            animateRows={true}
            rowSelection="single"
            enableCellTextSelection={true}
            ensureDomOrder={true}
            getRowStyle={getRowStyle}
            rowHeight={40}
            headerHeight={40}


            rowClass="ag-row-custom"
            suppressRowHoverHighlight={false}
            enableBrowserTooltips={true}
            enableRangeSelection={true}
            enableRangeHandle={true}
            enableCharts={true}
            enableFillHandle={true}


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
  );
}