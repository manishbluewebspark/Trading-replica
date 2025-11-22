// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";


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



// export default function HoldingOrder() {

//   const apiUrl = import.meta.env.VITE_API_URL;
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);




//   const [searchTerm, setSearchTerm] = useState("");



//   // Fetch all orders
//   const fetchOrders = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data } = await axios.get(`${apiUrl}/order/get/holdingdata`, {
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



//   // 🔍 Backend search on key up
//   const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const raw = e.currentTarget.value;
//     const query = raw.trim();

//     if (!query) {
//       fetchOrders();
//       return;
//     }

//     if (query.length < 3) return;

//     setLoading(true);
//     setError(null);

//     try {
//       const res = await axios.get(`${apiUrl}/order/search`, {
//         params: { search: query },
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

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



//   const td: React.CSSProperties = {
//     padding: "8px 12px",
//     fontSize: 13,
//     color: "#0f172a",
//     borderBottom: "1px solid #e5e7eb",
//     whiteSpace: "nowrap",
//   };



//   return (
//     <div
//       style={{
//         padding: 16,
//         fontFamily:
//           "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
//       }}
//     >
//       <h2 style={{ marginBottom: 12 }}>HoldingOrders</h2>

//       {/* Date filter + Excel */}
    

     

//         <div
//         style={{
//           display: "flex",
//           gap: 12,
//           alignItems: "center",
//           flexWrap: "wrap",
//           marginBottom: 12,
//         }}
//       >

//  {/* Search box */}
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
        

//         {/* <Button
//           onClick={handleExcelDownload}
//           style={{ backgroundColor: "#3b82f6", color: "white" }}
//         >
//           Excel Download
//         </Button> */}


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
//                   "Symbol",
//                   "instrumenttype",
//                   "Transaction Type",
//                   "ordertype",
//                   "Product Type",
//                   "Price",
//                   "Order Qty",
//                   "Traded Qty",
//                   "Order ID",
//                   "Traded ID",
//                   "Status",
//                   "Message",
//                   "Updated At",
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
//                       textTransform: "uppercase",
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
//                   <td
//                     colSpan={20}
//                     style={{ padding: 16, textAlign: "center" }}
//                   >
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
//                           {o.transactiontype || "-"}
//                         </span>
//                       </td>

//                       <td style={td}>{o.ordertype}</td>
//                       <td style={td}>{o.producttype}</td>
//                       <td style={td}>{o.fillprice}</td>
//                       <td
//                         style={td}
//                         title={`Filled: ${o.filledshares} / Unfilled: ${o.unfilledshares}`}
//                       >
//                         {o.quantity}
//                       </td>
//                       <td style={td}>{o.quantity}</td>
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

// const statusColor = (status: string) => {
//   const s = status?.toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//   if (s === "rejected" || s === "cancelled" || s === "canceled")
//     return "#ef4444";
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//   return "#64748b";
// };



import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

type Holding = {
  tradingsymbol: string;
  exchange: string;
  isin: string;
  t1quantity: number;
  realisedquantity: number;
  quantity: number;
  authorisedquantity: number;
  product: string;
  collateralquantity: number | null;
  collateraltype: string | null;
  haircut: number;
  averageprice: number;
  ltp: number;
  symboltoken: string;
  close: number;
  profitandloss: number;
  pnlpercentage: number;
};

export default function HoldingOrder() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [orders, setOrders] = useState<Holding[]>([]);
  const [allOrders, setAllOrders] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  console.log(error);
  

  // Fetch all holdings
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${apiUrl}/order/get/holdingdata`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data?.status === true) {
        const holdings = data.data.holdings || [];
        setOrders(holdings);
        setAllOrders(holdings); // backup list
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err: any) {
      toast.error(err?.message);
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Search function
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value) {
      // Reset to all orders if empty
      setOrders(allOrders);
      return;
    }

    if (value.length < 3) return; // optional: min 3 chars

    const query = value.toLowerCase();

    const filtered = allOrders.filter((item) =>
      Object.values(item).some((v) =>
        String(v).toLowerCase().includes(query)
      )
    );

    setOrders(filtered);
  };

  // Excel Download
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Holdings");
    XLSX.writeFile(wb, "holdings.xlsx");
  };

  const td: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 13,
    color: "#0f172a",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Holdings</h2>

      {/* Search + Excel */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <input
          type="text"
          placeholder="Search (min 3 chars)"
          className="border p-2 rounded"
          style={{ minWidth: 300 }} // wider input
          value={searchTerm}
          onChange={handleSearch}
        />

        <button
          onClick={handleExcelDownload}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Download Excel
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Symbol",
                  "Exchange",
                  "ISIN",
                  "T1 Qty",
                  "Realised Qty",
                  "Qty",
                  "Authorised Qty",
                  "Product",
                  "Avg Price",
                  "LTP",
                  "Close Price",
                  "P&L",
                  "P&L%",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#475569",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
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
                  <td colSpan={20} style={{ padding: 16, textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={20} style={{ padding: 16, textAlign: "center" }}>
                    No holdings found.
                  </td>
                </tr>
              )}

              {!loading &&
                orders.map((o, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={td}>{o.tradingsymbol}</td>
                    <td style={td}>{o.exchange}</td>
                    <td style={td}>{o.isin}</td>
                    <td style={td}>{o.t1quantity}</td>
                    <td style={td}>{o.realisedquantity}</td>
                    <td style={td}>{o.quantity}</td>
                    <td style={td}>{o.authorisedquantity}</td>
                    <td style={td}>{o.product}</td>
                    <td style={td}>{o.averageprice}</td>
                    <td style={td}>{o.ltp}</td>
                    <td style={td}>{o.close}</td>
                    <td
                      style={{
                        ...td,
                        color: o.profitandloss >= 0 ? "#16a34a" : "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      ₹{o.profitandloss}
                    </td>
                    <td
                      style={{
                        ...td,
                        color: o.pnlpercentage >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {o.pnlpercentage}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
