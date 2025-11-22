


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
// };

// export default function OrderTables() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [profitAndLossData, setProfitAndLossData] = useState<number>(0);
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
//   const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});
//   const [searchTerm, setSearchTerm] = useState("");

//   // Fetch orders
//   const fetchOrders = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data } = await axios.get(`${apiUrl}/order/get/table/order`, {
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


//   useEffect(() => {

//     fetchOrders();


//   }, []);

//   // Date filter
//   const handleGetDates = async () => {
//     if (!dateRange) {
//       toast.error("Please select a date range");
//       return;
//     }
//     const [from, to] = dateRange;
//     const payload = [from.toISOString(), to.toISOString()];

//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.post(`${apiUrl}/order/datefilter/order`, payload, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

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
//       const res = await axios.get(`${apiUrl}/order/search`, {
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

//      const td: React.CSSProperties = {
//   padding: "8px 12px",
//   fontSize: 13,
//   color: "#0f172a",
//   borderBottom: "1px solid #e5e7eb",
//   whiteSpace: "nowrap",
// };

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
//         <DatePicker.RangePicker
//           style={{ width: 300 }}
//           value={dateRange ?? undefined}
//           onChange={(val) =>
//             setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//           }
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
//         />
//         <Button onClick={handleGetDates}>Get Dates</Button>

//         <Button
//           onClick={handleExcelDownload}
//           style={{ backgroundColor: "#3b82f6", color: "white" }}
//         >
//           Excel Download
//         </Button>

       
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

// <div
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



// const statusColor = (status: string) => {
//   const s = status?.toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//   if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//   return "#64748b";
// };


import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DatePicker, Button } from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css";
import { toast } from "react-toastify";

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
  tradedValue:any;
  buyprice:any;
  pnl:any
  updatedAt:any
};

const { RangePicker } = DatePicker;

export default function OrderTables() {

  const apiUrl = import.meta.env.VITE_API_URL;

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalTradedData, setTotalTradedData] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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


  const [searchTerm, setSearchTerm] = useState("");

  

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${apiUrl}/order/get/table/order`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data?.status === true) {
        setOrders(Array.isArray(data.data) ? data.data : []);
        setTotalTradedData(data.buydata||0)
        
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
  }, []);

  // Date filter – used by Apply button
  const handleGetDates = async (
    
    rangeParam?: [dayjs.Dayjs, dayjs.Dayjs] | null
  ) => {
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
        `${apiUrl}/order/datefilter/order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        }
      );

      if (res.data?.status === true) {

        console.log(res?.data?.buydata,'res?.data?.buydata');
        
        setOrders(Array.isArray(res.data.data) ? res.data.data : []);
         setTotalTradedData(res?.data?.buydata||0)
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

  // 🔍 Backend search on key up
  const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    const query = raw.trim();

    if (!query) {
      fetchOrders();
      return;
    }

    if (query.length < 3) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${apiUrl}/order/search`, {
        params: { search: query },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

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



const convertHeaders = (data:any, mapping:any) => {
  return data.map((item:any) => {
    const newItem:any = {};

    Object.keys(mapping).forEach(oldKey => {
      let value = item[oldKey];

      

      newItem[mapping[oldKey]] = value ?? "";
    });

    return newItem;
  });
};



// const convertHeaders = (data:any, mapping:any) => {
//   return data.map((item:any) => {
//     const newItem:any = {};

//     Object.keys(mapping).forEach(oldKey => {
//       newItem[mapping[oldKey]] = item[oldKey] ?? ""; // copy only mapped headers
//     });

//     return newItem;
//   });
// };

  // Excel download
 
  const handleExcelDownload = () => {

    const headerMapping = {
      userId: "Username",
      transactiontype: "SignalType",
      exchange: "Exchange",
      instrumenttype: "Instrument",
      orderid: "OrderID",
        tradingsymbol: "Symbol",
        optiontype: "OrderType",
        producttype: "ProductType",
        buyprice: "Buy Price",
        price: "Sell Price",
        pnl: "PnL",
        quantity: "OrderQty",
        fillsize: "TradedQty",
        status: "Status",
        text: "Message",
        createdAt: "DateCreated",
        updatedAt: "DateUpdated",
       

    };




    const formattedOrders = convertHeaders(orders, headerMapping);

    const ws = XLSX.utils.json_to_sheet(formattedOrders);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    XLSX.writeFile(wb, "orders.xlsx");
  };

  const handleCancelDate = async function () {

   setDateRange(null);
  setPanelRange(null);

  // close calendar (optional)
  setPickerOpen(false);
    
    fetchOrders();
  }

  const td: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 13,
    color: "#0f172a",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };



  return (
    <div
      style={{
        padding: 16,
        fontFamily:
          "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 12 }}>Orders History</h2>

  
{/* Date filter + Excel + Total Traded */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "nowrap", // prevent wrapping to next line
    marginBottom: 12,
  }}
>
  {/* Date Range Picker */}
  <RangePicker
    style={{ width: 300 }}
    open={pickerOpen}
    // important: only react when opening; ignore close from AntD
    onOpenChange={(open) => {
      if (open) {
        setPickerOpen(true);
        setPanelRange(dateRange); // initialize with applied range
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
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          padding: "8px 12px",
        }}
      >
        <Button
          size="small"
          onClick={() => {
            // discard temp selection and close
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
            // apply final range
            setDateRange(panelRange);
            setPickerOpen(false);
            // call filter API with selected range
            handleGetDates(panelRange);
          }}
        >
          Apply
        </Button>
      </div>
    )}
  />

  {/* Excel Download Button */}
  <Button
    onClick={handleExcelDownload}
    style={{ backgroundColor: "#3b82f6", color: "white" }}
  >
    Excel Download
  </Button>

  {/* Total Traded Badge */}
  <div
    style={{
      padding: "6px 12px",
      background: "#eef2ff",
      color: "#1e40af",
      borderRadius: 6,
      fontWeight: 600,
      fontSize: 14,
      border: "1px solid #c7d2fe",
      whiteSpace: "nowrap", // prevent inner text from wrapping
    }}
  >
    Total Traded:&nbsp; {totalTradedData}
  </div>
</div>


       <div className="w-full sm:w-64 md:w-120">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={handleKeyUp}
            placeholder="Search (min 3 chars)"
            className="border p-2 w-full rounded"
          />
        </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
        }}
        className="max-w-[1080px]"
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Symbol",
                  "instrument",
                  " Type",
                  "ordertype",
                  "Product Type",
                  "Buy Price",
                  "Sell Price",
                  "Traded Qty",
                  "PNL",
                  "Order ID",
                  "Traded ID",
                  "Status",
                  "Message",
                  "Updated At",
                  "Created At",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                      position: "sticky",
                      top: 0,
                      background: "#f8fafc",
                      zIndex: 1,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={20}
                    style={{ padding: 16, textAlign: "center" }}
                  >
                    Loading orders…
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={20} style={{ padding: 16, color: "#ef4444" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && orders.length === 0 && (
                <tr>
                  <td
                    colSpan={20}
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No orders found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                orders.map((o, index) => {
                  const rowKey =
                    o.orderid ||
                    o.uniqueorderid ||
                    o.exchangeorderid ||
                    `${o.symboltoken || "tok"}-${index}`;

                  const isBuy = o.transactiontype === "BUY";
                  const isSell = o.transactiontype === "SELL";

                  const txnBg = isBuy
                    ? "#dcfce7"
                    : isSell
                    ? "#fee2e2"
                    : "#e5e7eb";
                  const txnColor = isBuy
                    ? "#166534"
                    : isSell
                    ? "#991b1b"
                    : "#374151";

                  return (
                    <tr
                      key={rowKey}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Symbol */}
                      <td style={td} title={o.tradingsymbol}>
                        <strong>{o.tradingsymbol}</strong>
                      </td>

                      {/* instrumenttype */}
                      <td style={td} title={o.instrumenttype}>
                        {o.instrumenttype}
                      </td>

                      {/* Transaction Type */}
                      <td style={td}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: txnBg,
                            color: txnColor,
                            textTransform: "uppercase",
                          }}
                        >
                          {o.transactiontype || "-"}
                        </span>
                      </td>

                      <td style={td}>{o.ordertype}</td>
                      <td style={td}>{o.producttype}</td>
                        <td style={td}>{o.buyprice}</td>
                      <td style={td}>{o.fillprice}</td>
                      <td
                        style={td}
                        title={`Filled: ${o.filledshares} / Unfilled: ${o.unfilledshares}`}
                      >
                        {o.quantity}
                      </td>
                     <td style={td}>{Number(o.pnl).toFixed(2)}</td>
                      <td style={td}>{o.orderid}</td>
                      <td style={td}>{o.fillid}</td>

                      {/* Status */}
                      <td style={td}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#ffffff",
                            background: statusColor(
                              o.status || o.orderstatus
                            ),
                            textTransform: "capitalize",
                          }}
                          title={o.orderstatus}
                        >
                          {o.status || o.orderstatus || "-"}
                        </span>
                      </td>

                      {/* Message */}
                      <td style={{ ...td, maxWidth: 380 }}>
                        <span
                          title={o.text}
                          style={{
                            display: "inline-block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 360,
                          }}
                        >
                          {o.text || "—"}
                        </span>
                      </td>
                      <td style={td}>{o.updatedAt}</td>
                      <td style={td}>{o.createdAt}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const statusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
  if (s === "rejected" || s === "cancelled" || s === "canceled")
    return "#ef4444";
  if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
  return "#64748b";
};

