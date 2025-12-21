// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// // import dayjs from "dayjs";
// import "antd/dist/reset.css"; // or "antd/dist/antd.css" for older versions
// import { toast } from "react-toastify";
// // import { useNavigate } from "react-router-dom";
// import { getSocket } from "../../socket/Socket";
// import { useNavigate } from "react-router";

// type Tick = {
//   mode: 1 | 2 | 3;
//   exchangeType: number;
//   token: string;              // e.g. "47667"
//   sequenceNumber: number;
//   exchangeTimestamp: string;  // ISO
//   ltpPaiseOrRaw: number;      // e.g. 10225
//   ltp: number;                // e.g. 102.25
// };

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
//   status: string;        // e.g., "rejected"
//   orderstatus: string;   // duplicate in your sample; we’ll show `status`
//   updatetime: string;    // e.g., "24-Oct-2025 13:21:19"
//   exchtime: string;
//   exchorderupdatetime: string;
//   fillid: string;
//   filltime: string;
//   fillprice:string;
//   fillsize:string;
//   parentorderid: string;
//   uniqueorderid: string;
//   exchangeorderid: string;
//    createdAt:string;
//    orderstatuslocaldb:string;
//    updatedAt:any;
//    userNameId:any
// };

// // util: tiny debounce hook so search feels snappy
// function useDebounced<T>(value: T, delay = 250) {
//   const [v, setV] = useState(value);
//   useEffect(() => {
//     const t = setTimeout(() => setV(value), delay);
//     return () => clearTimeout(t);
//   }, [value, delay]);
//   return v as T;
// }

// const PAGE_SIZE_DEFAULT = 10;

// const statusColor = (status: string) => {
//   const s = status?.toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a"; // green
//   if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444"; // red
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b"; // amber
//   return "#64748b"; // slate
// };

// export default function OrderTableAdmin() {

//   const apiUrl = import.meta.env.VITE_API_URL;

//     const navigate = useNavigate();

//   const [orders, setOrders] = useState<Order[]>([]);
   
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [search, setSearch] = useState("");
//   const debouncedSearch = useDebounced(search, 50);

//   const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_DEFAULT);
//   const [page, setPage] = useState<number>(1);

//   const [showForm, setShowForm] = useState(false); // ✅ control modal visibility
//    const [showFormUpdate, setShowFormUpdate] = useState(false)
//   const [selectedItem, setSelectedItem] = useState<any | null>(null); // ✅ store clicked item

//   const [getPrice, setOnlyPrice] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");


//   console.log(getPrice,getslotSIze,'byueee');

//   // Live ticks: keep a token -> current LTP map
//   const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});
  
//   useEffect(() => {


//         const socket = getSocket();
      
//           const onTick = (tick: Tick) => {

//               console.log(tick,'socket');
            
//             setLtpByToken((prev) => {
//               const curr = prev[tick.token];
//               if (curr === tick.ltp) return prev; // avoid useless re-render
//               return { ...prev, [tick.token]: tick.ltp };
//             });
//           };
      
//           socket.on("tick", onTick);

//     let cancelled = false;

//     async function fetchOrders() {
     
//       try {
//         const {data} = await axios.get(`${apiUrl}/admin/get/table/order`, {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               "userid":localStorage.getItem("userID")
             
//             },
//           });


//        if(data.status==true) {

//         setOrders(data.data);

//        }else if(data.status==false&&data.message=='Unauthorized'){

        

//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             localStorage.removeItem("termsAccepted");
//             localStorage.removeItem("feed_token");
//             localStorage.removeItem("refresh_token");

//              toast.error('Unauthorized User');

//               navigate("/");
           
//        }else{

//          toast.error(data?.message||"Something went wrong");
//           // alert(data?.message)
//        }
        
//       } catch (err: any) {
        
//          toast.error(err?.message || "Something went wrong");
         
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//   }

//     fetchOrders();
//     setOnlyPrice("")
//     setSlotSIze("")
//  setError(null)
//   }, []);

//   // reset to page 1 whenever the search or page size changes
//   useEffect(() => {
//     setPageSize(10),
//     setSearch(""),
//     setPage(1);
//   }, [debouncedSearch, pageSize]);

//   const filtered = useMemo(() => {
//     const q = debouncedSearch.trim().toLowerCase();
//     if (!q) return orders;

//     return orders.filter((o) => {
//       // fields to search across
//       const haystack =
//         [
//           o.orderid,
//           o.uniqueorderid,
//           o.tradingsymbol,
//           o.transactiontype,
//           o.instrumenttype,
//           o.ordertype,
//           o.producttype,
//           o.status,
//           o.exchange,
//           o.text,
//           o.updatetime,
//           o.exchangeorderid,
//         ]
//           .filter(Boolean)
//           .join(" ")
//           .toLowerCase() +
//         // also allow searching numbers like price/quantity
//         ` ${o.price ?? ""} ${o.quantity ?? ""} ${o.averageprice ?? ""}`;
//       return haystack.includes(q);
//     });
//   }, [orders, debouncedSearch]);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const current = useMemo(() => {
//     const start = (page - 1) * pageSize;
//     return filtered.slice(start, start + pageSize);
//   }, [filtered, page, pageSize]);



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


//  async function fetchOnlineOrdersDetails() {

//   try {

//        // 🔥 Your backend API call
//     const res = await axios.get(
//       `${apiUrl}/admin/fetchorderdetails`,
//       {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       }
//     );

//     if (res.data.status) {

      

//     } else if(res.data.status==false&&res.data.message=='Unauthorized'){

//        localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         localStorage.removeItem("termsAccepted");
//         localStorage.removeItem("feed_token");
//         localStorage.removeItem("refresh_token");

//         toast.error('Unauthorized User');

//        navigate("/");

//     }else {

//       toast.error(res.data.message || "Failed to square off");

//     }
//   } catch (error) {
    
//   }
     
// }



//       // ✅ Handle Update Form Submit
//     const handleSubmit = async(e: React.FormEvent) => {

//       try {
        
//          e.preventDefault()

//            const ok = window.confirm(
//               "You are updating Data.\nDo you want to continue?"
//             );

//             if (ok) {
             
//         let res = await axios.put(`${apiUrl}/order/modify/order`, selectedItem, {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 "AngelOneToken": localStorage.getItem("angel_token") || "",
//                  "userid":localStorage.getItem("userID")
//             },
//           }) 
 
//       if(res.data.status==true) {

//          toast.success(res.data.message);

//       }else if(res.data.status==false&&res.data.status=='Unauthorized'){
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             localStorage.removeItem("termsAccepted");
//             localStorage.removeItem("feed_token");
//             localStorage.removeItem("refresh_token"); 
            
//              toast.error("Unauthorized");
//               navigate("/");
//        }
//        else{

//          toast.error(res.data.message || "Something went wrong");
//       }   
               
             
//     } else {

//         toast.error("Cancelled");
//         return;
//     }

//       } catch (error:any) {

//            toast.error(error.message || "Something went wrong");
//       }    
//   }

//      // ✅ Handle Sell Form Submit
//     const handleSubmitUpdate = async(e: React.FormEvent) => {

//          e.preventDefault()

//         let reqData = {
//             userId:selectedItem.userId,    
//             variety: selectedItem.variety,
//             symbol: selectedItem.tradingsymbol,
//             token: selectedItem.symboltoken,
//             transactiontype: "SELL",
//             exch_seg: selectedItem.exchange,
//             orderType: selectedItem.ordertype,
//             producttype: selectedItem.productType || "INTRADAY",
//             productType: selectedItem.productType || "INTRADAY",
//             duration:selectedItem.duration || "DAY",
//             price: selectedItem.price,
//             totalPrice:selectedItem.totalPrice,
//             actualQuantity:selectedItem.actualQuantity,
//             squareoff: "0",
//             stoploss: "0",
//             quantity: selectedItem.quantity,
//         }
         
         
//         let res = await axios.post(`${apiUrl}/order/place/order`, reqData, {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 "AngelOneToken": localStorage.getItem("angel_token") || "",
//                  "userid":localStorage.getItem("userID")
//             },
//           }) 
 
//       if(res.data.status==true) {

//          toast.success(res.data.message);

//       }else if(res.data.status==false&&res.data.status=='Unauthorized'){
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             localStorage.removeItem("termsAccepted");
//             localStorage.removeItem("feed_token");
//             localStorage.removeItem("refresh_token");  

//              navigate("/");
//        }
//        else{

//          toast.error(res.data.message || "Something went wrong");
//       }   
          
//     }

//     const handleSquareButton = async() => {

//       const confirmSquare = window.confirm("Do you want to Square Off this order?");
      
//       if (confirmSquare) {

//            // 2️⃣ Third API: (example)
//          const res = await axios.get(`${apiUrl}/admin/sequareoff`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//       });

//       if(res.data.status==true) {

//          toast.success(res.data.message);

//       }else if(res.data.status==false&&res.data.status=='Unauthorized'){
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             localStorage.removeItem("termsAccepted");
//             localStorage.removeItem("feed_token");
//             localStorage.removeItem("refresh_token");  

//              navigate("/");
//        }
//        else{

//          toast.error(res.data.message || "Something went wrong");
//       }     
//   } 
// };


    
//   useEffect(() => {
//   setPage(1);
// }, [orders]); // 🔑 ensures current page is valid after any new data

// // 6) your existing search reset is fine
// useEffect(() => {
//   setPage(1);
// }, [debouncedSearch, pageSize]);

//   return (
//     <div style={{ padding: 16, fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
//       <h2 style={{ marginBottom: 12 }}>Current Position</h2>

//       <div
//     style={{
//           display: "flex",
//           gap: 12,
//           alignItems: "center",
//           flexWrap: "wrap",
//           marginBottom: 12,
//         }}
//       >

//       <div>
//         <button
//           onClick={handleSquareButton}
//           style={{
//             padding: "10px 16px",
//             backgroundColor: "#3b82f6", // Blue-500
//             color: "white",
//             border: "none",
//             borderRadius: 8,
//             cursor: "pointer",
//             fontSize: 14,
//             transition: "background-color 0.2s",
//           }}
//           onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")} // Blue-600 on hover
//           onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
//         >
//           Square Off
//         </button>
//       </div>

// <div>
//    <button
//     onClick={fetchOnlineOrdersDetails}
//     style={{
//       padding: "10px 16px",
//       backgroundColor: "#3b82f6", // Blue-500
//       color: "white",
//       border: "none",
//       borderRadius: 8,
//       cursor: "pointer",
//       fontSize: 14,
//       transition: "background-color 0.2s",
//     }}
//     onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")} // Blue-600 on hover
//     onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
//   >
//   Refresh
//   </button>
// </div>
 
// </div>
    


//       {/* Table */}
//       <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }} className="max-w-[1080px]">
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse" }}>
//             <thead style={{ background: "#f8fafc" }}>
//               <tr>
//                 {[
//                   "Action",
//                   "UserId",
//                   "SYMBOL",
//                   "instrument",
//                  " Type",
//                   "ordertype",
//                   "ProductType",
//                   "Price",
//                     "LTP",
//                     "PnL",
//                       "OrderQty",
//                   //  "Time",
//                   "TradedQty",
//                   "OrderID",
//                     "TradeID",
//                     "Status",
//                        "Message",
//                        "updatedAt",
//                   "createdAt",
//                   //  "Update",
//                   //  "Cancel"
//                 ].map((h) => (

//                   <th
//                     key={h}
//                     style={{
//                       textAlign: "left",
//                       padding: "10px 12px",
//                       fontSize: 13,
//                       color: "#475569",
//                       borderBottom: "1px solid #e5e7eb",
//                       whiteSpace: "nowrap",
//                       position: "sticky",
//                       top: 0,
//                       background: "#f8fafc",
//                       zIndex: 1,
//                     }}
//                   >
//                    {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {loading && (
//                 <tr>
//                   <td colSpan={11} style={{ padding: 16, textAlign: "center" }}>
//                     Loading orders…
//                   </td>
//                 </tr>
//               )}

//               {error && !loading && (
//                 <tr>
//                   <td colSpan={11} style={{ padding: 16, color: "#ef4444" }}>
//                     {error}
//                   </td>
//                 </tr>
//               )}

//               {!loading && !error && current.length === 0 && (
//                 <tr>
//                   <td colSpan={11} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
//                     No orders found.
//                   </td>
//                 </tr>
//               )}

//               {!loading &&
//                 !error &&
//                 current.map((o) => {
//                    const live = o.symboltoken ? ltpByToken[o.symboltoken] : undefined;
//                   return(
//                   <tr key={o.orderid} style={{ borderBottom: "1px solid #f1f5f9" }}>
//                     {/* <td style={td}>
//                       <button
//                         onClick={() => handleSellClick(o)}
//                         disabled={o.transactiontype === "SELL"} // 👈 disable when SELL
//                         style={{
//                           display: "inline-block",
//                           padding: "2px 8px",
//                           borderRadius: 999,
//                           fontSize: 12,
//                           color: "white",
//                           background: statusColor("complete"),
//                           textTransform: "capitalize",
//                           opacity: o.transactiontype === "SELL" ? 0.5 : 1, // 👈 visual dim when disabled
//                           cursor: o.transactiontype === "SELL" ? "not-allowed" : "pointer",
//                         }}
//                       >
//                         Sell
//                       </button>
//                     </td> */}

//                     <td style={td}>
//   <button
//   onClick={() => handleSellClick(o)}
//   disabled={o.transactiontype === "SELL"}
//   onMouseEnter={(e) => {
//     if (o.transactiontype !== "SELL") {
//       e.currentTarget.style.background =
//         "linear-gradient(to right, #b91c1c, #7f1d1d)";
//     }
//   }}
//   onMouseLeave={(e) => {
//     if (o.transactiontype !== "SELL") {
//       e.currentTarget.style.background =
//         "linear-gradient(to right, #ef4444, #dc2626)";
//     }
//   }}
//   style={{
//     display: "inline-flex",
//     alignItems: "center",
//     gap: "6px",
//     padding: "4px 14px",
//     borderRadius: "16px",
//     fontSize: "12px",
//     fontWeight: 600,
//     letterSpacing: "0.5px",
//     border: "none",
//     color: "#fff",
//     background:
//       o.transactiontype === "SELL"
//         ? "#9ca3af"
//         : "linear-gradient(to right, #ef4444, #dc2626)", // 🔴 gradient
//     cursor:
//       o.transactiontype === "SELL"
//         ? "not-allowed"
//         : "pointer",
//     opacity: o.transactiontype === "SELL" ? 0.6 : 1,
//     transition: "all 0.2s ease-in-out",
//   }}
//   title={
//     o.transactiontype === "SELL"
//       ? "Already Sold"
//       : "Click to Sell"
//   }
// >
//   <span style={{ fontSize: "13px", lineHeight: 1 }}>⬇</span>
//   SELL
// </button>

// </td>

                    
                     
//                       <td style={td} title={o.userNameId}><strong>{o.userNameId}</strong></td>  
//                     <td style={td} title={o.tradingsymbol}><strong>{o.tradingsymbol}</strong></td>
//                     <td style={td} title={o.instrumenttype}>  {o.instrumenttype}</td>
//                      <td style={td}>{o.transactiontype}</td>
//                      <td style={td}>{o.ordertype}</td>
//                       <td style={td}>{o.producttype}</td>
//                        <td style={td}>{o.price}</td>
//                          <td style={td}>{live}</td>

                       
                      
//                        <td style={td}> {live !== undefined? ((  live-Number(o.price)) * Number(o.quantity)).toFixed(2) : "—"} </td>
//                    {/* <td style={{ ...td, fontWeight: 600 }}> {Number(live)*Number(o.quantity)} </td> */}
//                     <td style={td} title={`Filled: ${o.filledshares} / Unfilled: ${o.unfilledshares}`}> {o.quantity} </td>
//                      <td style={td} title={`Filled: ${o.filledshares} / Unfilled: ${o.unfilledshares}`}> {o.quantity} </td>
//                       <td style={td}>{o.orderid}</td>
//                         <td style={td}>{o.fillid}</td>
                
//                    <td style={td}>
//                       <span
//                         style={{
//                           display: "inline-block",
//                           padding: "2px 8px",
//                           borderRadius: 999,
//                           fontSize: 12,
//                           color: "white",
//                           background: statusColor(o.status),
//                           textTransform: "capitalize",
//                         }}
//                         title={o.status}
//                       >
//                         {o.status ||  "-"}
//                       </span>
//                     </td>

//                     <td style={{ ...td, maxWidth: 380 }}>
//                       <span title={o.text} style={{ display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
//                         {o.text || "—"}
//                       </span>
//                     </td>
                    

//                     <td style={td}>{o.updatedAt}</td>
//                     <td style={td}>{o.createdAt}</td>

//                     {/* <td style={td}>
//                       <button
//                         onClick={() => handleUpdateClick(o)}
//                         style={{
//                           display: "inline-block",
//                           padding: "2px 8px",
//                           borderRadius: 999,
//                           fontSize: 12,
//                           color: "white",
//                           background: statusColor(o.status),
//                           textTransform: "capitalize",
//                         }}
                     
//                       >
//                         Update
//                       </button>
//                     </td>
//                      <td style={td}>
//                       <button
//                         onClick={() => handleCancelClick(o)}
//                         style={{
//                           display: "inline-block",
//                           padding: "2px 8px",
//                           borderRadius: 999,
//                           fontSize: 12,
//                           color: "white",
//                           background: statusColor(o.status),
//                           textTransform: "capitalize",
//                         }}
                     
//                       >
//                         Cancel
//                       </button>
//                     </td> */}

//                   </tr>
//               )})}
//             </tbody>
//           </table>
//         </div>

//         {/* Footer / pagination */}
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
//           <div style={{ fontSize: 13, color: "#475569" }}>
//             Showing <strong>{current.length}</strong> of <strong>{filtered.length}</strong> filtered (
//             {orders.length} total)
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <button
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page === 1}
//               style={btn(page === 1)}
//             >
//               Prev
//             </button>
//             <span style={{ fontSize: 13 }}>
//               Page <strong>{page}</strong> / {totalPages}
//             </span>
//             <button
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               disabled={page >= totalPages}
//               style={btn(page >= totalPages)}
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>


//  {/* ✅ Modal Form */}
//       {showForm && selectedItem && (

// <div
//   style={{
//     position: "fixed",
//     inset: 0,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     paddingTop: "80px"      // 👈 add this
//   }}
//   className="flex items-start justify-center z-[1000]"
// >
//   <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
//     <h3 className="text-xl font-semibold mb-4 text-center">
//       Update Order
//     </h3>

//     <form onSubmit={handleSubmit} className="space-y-6">
//       {/* ===== SECTION: Basic / IDs ===== */}
//       <div>
//         <h4 className="text-sm font-semibold text-gray-700 mb-2">
//           Basic Info
//         </h4>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium">User ID</label>
//             <input
//               type="number"
//               value={selectedItem.userId ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Order ID</label>
//             <input
//               type="text"
//               value={selectedItem.orderid ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Unique Order ID</label>
//             <input
//               type="text"
//               value={selectedItem.uniqueorderid ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Parent Order ID</label>
//             <input
//               type="text"
//               value={selectedItem.parentorderid ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   parentorderid: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ===== SECTION: Instrument ===== */}
//       <div>
//         <h4 className="text-sm font-semibold text-gray-700 mb-2">
//           Instrument
//         </h4>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium">Symbol</label>
//             <input
//               type="text"
//               value={selectedItem.tradingsymbol ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Token</label>
//             <input
//               type="text"
//               value={selectedItem.symboltoken ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Exchange</label>
//             <input
//               type="text"
//               value={selectedItem.exchange ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Product Type</label>
//             <input
//               type="text"
//               value={selectedItem.producttype ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Instrument Type</label>
//             <input
//               type="text"
//               value={selectedItem.instrumenttype ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Option Type</label>
//             <input
//               type="text"
//               value={selectedItem.optiontype ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Strike Price</label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.strikeprice ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Expiry Date</label>
//             <input
//               type="text"
//               value={selectedItem.expirydate ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ===== SECTION: Order Parameters ===== */}
//       <div>
//         <h4 className="text-sm font-semibold text-gray-700 mb-2">
//           Order Parameters
//         </h4>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium">Variety</label>
//             <input
//               type="text"
//               value={selectedItem.variety ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({ ...selectedItem, variety: e.target.value })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Product Type</label>
//             <input
//               type="text"
//               value={selectedItem.producttype ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   producttype: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Transaction Type</label>
//             <select
//               value={selectedItem.transactiontype ?? "BUY"}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   transactiontype: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             >
//               <option value="BUY">BUY</option>
//               <option value="SELL">SELL</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Duration</label>
//             <input
//               type="text"
//               value={selectedItem.duration ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({ ...selectedItem, duration: e.target.value })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Order Type</label>
//             <select
//               value={selectedItem.ordertype ?? "MARKET"}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   ordertype: e.target.value,
//                   ...(e.target.value === "MARKET" ? { price: "" } : {}),
//                 })
//               }
//               className="border p-2 w-full rounded"
//             >
//               <option value="MARKET">MARKET</option>
//               <option value="LIMIT">LIMIT</option>
//               <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//               <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Trigger Price</label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.triggerprice ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   triggerprice: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ===== SECTION: Quantity & Pricing ===== */}
//       <div>
//         <h4 className="text-sm font-semibold text-gray-700 mb-2">
//           Quantity & Pricing
//         </h4>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium">Quantity</label>
//             <input
//               type="number"
//               min={1}
//               value={selectedItem.quantity ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   quantity: e.target.value,
//                   totalPrice:
//                     Number(e.target.value || 0) *
//                     Number(selectedItem.price || 0),
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Actual Quantity</label>
//             <input
//               type="number"
//               value={selectedItem.actualQuantity ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   actualQuantity: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">
//               Price{" "}
//               {selectedItem.ordertype === "MARKET" ? "(auto / LTP)" : ""}
//             </label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.price ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   price: e.target.value,
//                   totalPrice:
//                     Number(selectedItem.quantity || 0) *
//                     Number(e.target.value || 0),
//                 })
//               }
//               readOnly={selectedItem.ordertype === "MARKET"}
//               className={`border p-2 w-full rounded ${
//                 selectedItem.ordertype === "MARKET"
//                   ? "bg-gray-100 cursor-not-allowed"
//                   : "bg-white"
//               }`}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Total Price</label>
//             <input
//               type="text"
//               value={
//                 selectedItem.totalPrice != null
//                   ? Number(selectedItem.totalPrice).toFixed(2)
//                   : ""
//               }
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Disclosed Quantity</label>
//             <input
//               type="number"
//               value={selectedItem.disclosedquantity ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   disclosedquantity: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Lot Size</label>
//             <input
//               type="number"
//               value={selectedItem.lotsize ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   lotsize: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ===== SECTION: Risk / SL / Square-off ===== */}
//       <div>
//         <h4 className="text-sm font-semibold text-gray-700 mb-2">
//           Risk Management
//         </h4>
//         <div className="grid grid-cols-3 gap-4">
//           <div>
//             <label className="block text-sm font-medium">Square-off</label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.squareoff ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   squareoff: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Stop Loss</label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.stoploss ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   stoploss: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium">
//               Trailing Stop Loss
//             </label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.trailingstoploss ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   trailingstoploss: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ===== SECTION: Status & Time ===== */}
//       <div>
//         <h4 className="text-sm font-semibold text-gray-700 mb-2">
//           Status & Time
//         </h4>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium">Status</label>
//             <input
//               type="text"
//               value={selectedItem.status ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   status: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium">Order Status</label>
//             <input
//               type="text"
//               value={selectedItem.orderstatus ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   orderstatus: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Update Time</label>
//             <input
//               type="text"
//               value={selectedItem.updatetime ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Exchange Time</label>
//             <input
//               type="text"
//               value={selectedItem.exchtime ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">
//               Exch. Order Update Time
//             </label>
//             <input
//               type="text"
//               value={selectedItem.exchorderupdatetime ?? ""}
//               readOnly
//               className="border p-2 w-full rounded bg-gray-100"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Cancel Size</label>
//             <input
//               type="number"
//               value={selectedItem.cancelsize ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   cancelsize: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ===== SECTION: Trade Fill Info ===== */}
//       <div>
//         <h4 className="text-sm font-semibold text-gray-700 mb-2">
//           Trade / Fill Info
//         </h4>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium">Traded Value</label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.tradedValue ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   tradedValue: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Fill Price</label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.fillprice ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   fillprice: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Fill Size</label>
//             <input
//               type="number"
//               value={selectedItem.fillsize ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   fillsize: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Fill ID</label>
//             <input
//               type="text"
//               value={selectedItem.fillid ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   fillid: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Fill Time</label>
//             <input
//               type="text"
//               value={selectedItem.filltime ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   filltime: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Average Price</label>
//             <input
//               type="number"
//               step="0.01"
//               value={selectedItem.averageprice ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   averageprice: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Filled Shares</label>
//             <input
//               type="number"
//               value={selectedItem.filledshares ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   filledshares: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Unfilled Shares</label>
//             <input
//               type="number"
//               value={selectedItem.unfilledshares ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   unfilledshares: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ===== SECTION: Meta / Tag / Remarks ===== */}
//       <div>
//         <h4 className="text-sm font-semibold text-gray-700 mb-2">
//           Meta / Remarks
//         </h4>
//         <div className="grid grid-cols-2 gap-4">
//           <div className="col-span-2">
//             <label className="block text-sm font-medium">Order Tag</label>
//             <input
//               type="text"
//               value={selectedItem.ordertag ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   ordertag: e.target.value,
//                 })
//               }
//               className="border p-2 w-full rounded"
//             />
//           </div>

//           <div className="col-span-2">
//             <label className="block text-sm font-medium">Text / Remarks</label>
//             <textarea
//               value={selectedItem.text ?? ""}
//               onChange={(e) =>
//                 setSelectedItem({
//                   ...selectedItem,
//                   text: e.target.value,
//                 })
//               }
//               rows={3}
//               className="border p-2 w-full rounded"
//             />
//           </div>

//            <div className="col-span-2">
//           <label className="block text-sm font-medium"> Sync Order Changes with Angel One</label>
//           <select
//             value={selectedItem.flag ?? ""} 
//             onChange={(e) =>
//               setSelectedItem({
//                 ...selectedItem,
//                 flag: e.target.value === "true" ? true : false, // convert string → boolean
//               })
//             }
//             className="border p-2 w-full rounded bg-white"
//           >
//             <option value="">Select Flag</option>
//             <option value="true">True</option>
//             <option value="false">False</option>
//           </select>
//         </div>


//         </div>
//       </div>

//       {/* ===== Actions ===== */}
//       <div className="flex justify-between pt-4 border-t">
//         <button
//           type="button"
//           onClick={() => setShowForm(false)}
//           className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
//         >
//           Cancel
//         </button>

//         <button
//           type="submit"
//           className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg"
//         >
//           Submit Order
//         </button>
//       </div>
//     </form>
//   </div>
// </div>


//       )}

//   {showFormUpdate && selectedItem && (
//      <div
//   style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
//   className="flex items-center justify-center z-[1000]"
// >
//   <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
//     <h3 className="text-lg font-semibold mb-4 text-center">Sell Order</h3>

//     <form onSubmit={handleSubmitUpdate} className="space-y-4">
//       {/* Row 1: Order Id + Symbol */}
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium">Order Id</label>
//           <input
//             type="text"
//             value={selectedItem.orderid}
//             readOnly
//             className="border p-2 w-full rounded bg-gray-100"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium">Symbol</label>
//           <input
//             type="text"
//             value={selectedItem.tradingsymbol}
//             readOnly
//             className="border p-2 w-full rounded bg-gray-100"
//           />
//         </div>
//       </div>


//        <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium">Token</label>
//           <input
//             type="text"
//             value={selectedItem.symboltoken}
//             readOnly
//             className="border p-2 w-full rounded bg-gray-100"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium">Variety</label>
//           <input
//             type="text"
//             value={selectedItem.variety}
//             readOnly
//             className="border p-2 w-full rounded bg-gray-100"
//           />
//         </div>
//       </div>

//        <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium">Exchange</label>
//           <input
//             type="text"
//             value={selectedItem.exchange}
//             readOnly
//             className="border p-2 w-full rounded bg-gray-100"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium">Product Type</label>
//           <input
//             type="text"
//             value={selectedItem.producttype}
//             readOnly
//             className="border p-2 w-full rounded bg-gray-100"
//           />
//         </div>
//       </div>

      
// {/* Row 3: Order Type (full width) */}
//         <div className="grid grid-cols-2 gap-4">
//       <div>
//         <label className="block text-sm font-medium">Order Type</label>
//         <select
//           value={selectedItem.ordertype}
//           onChange={(e) =>
//             setSelectedItem({
//               ...selectedItem,
//               ordertype: e.target.value,
//               ...(e.target.value === "MARKET" ? { price: "" } : {}),
//             })
//           }
//           className="border p-2 w-full rounded bg-gray-100"
//         >
//           <option value="MARKET">MARKET</option>
//           <option value="LIMIT">LIMIT</option>
//           <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//           <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//         </select>
//       </div>

//        <div>
//                 <label className="block text-sm font-medium">Require Fund</label>
//                 <input
//                   type="text"
//                   value={Number(selectedItem.totalPrice).toFixed(2)}
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//       </div>

    
//       {/* Row 2: Quantity + Price */}
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium">Quantity</label>
//           <input
//             type="number"
//             min={1}
//             value={selectedItem.quantity}
//             onChange={(e) =>
//               setSelectedItem({ 
//                 ...selectedItem,
//                  quantity: e.target.value,
//                  totalPrice : (Number(e.target.value)) * Number(getPrice)
//                  })
//             }
//             className="border p-2 w-full rounded bg-gray-100"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium">
//             Price
//           </label>
//           <input
//             type="number"
//             step="0.01"
//             value={Number(selectedItem.price).toFixed(2)}
//              className="border p-2 w-full rounded bg-gray-100"
            
//           />
//         </div>
//       </div>

      

//       {/* Actions */}
//       <div className="flex justify-between mt-6">
//         <button
//           type="button"
//           onClick={() => setShowFormUpdate(false)}
//           className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
//         >
//           Cancel
//         </button>

//         <button
//           type="submit"
//           className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg"
//         >
//           Submit Order
//         </button>
//       </div>
//     </form>
//   </div>
// </div>
//  )}

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

// const btn = (disabled: boolean): React.CSSProperties => ({
//   padding: "8px 12px",
//   borderRadius: 8,
//   border: "1px solid #e5e7eb",
//   background: disabled ? "#f1f5f9" : "white",
//   color: disabled ? "#94a3b8" : "#0f172a",
//   cursor: disabled ? "not-allowed" : "pointer",
// });










import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "antd/dist/reset.css";
import { Button } from "antd";
import { toast } from "react-toastify";
import { getSocket } from "../../socket/Socket";
import { useNavigate } from "react-router";

import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  RowHeightParams,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { FaChevronDown, FaChevronRight } from "react-icons/fa";

/** ---------------- TYPES ---------------- */

type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string;
  sequenceNumber: number;
  exchangeTimestamp: string;
  ltpPaiseOrRaw: number;
  ltp: number;
};

type ClientOrder = {
  id?: number;
  userId?: number;
  userNameId?: any;
  broker?: string;

  variety?: string;
  ordertype?: string;
  producttype?: string;
  duration?: any;

  price?: number;
  triggerprice?: any;

  quantity?: any;
  disclosedquantity?: any;

  squareoff?: any;
  stoploss?: any;
  trailingstoploss?: any;

  tradingsymbol?: string;
  transactiontype?: string;
  exchange?: string;
  symboltoken?: string;

  ordertag?: any;
  instrumenttype?: string;

  strikeprice?: any;
  optiontype?: any;
  expirydate?: any;
  lotsize?: any;

  cancelsize?: any;

  averageprice?: any;
  filledshares?: any;
  unfilledshares?: any;

  orderid?: string;
  uniqueorderid?: string;
  parentorderid?: any;

  exchangeorderid?: any;

  text?: any;
  status?: string;
  orderstatus?: any;
  orderstatuslocaldb?: any;

  updatetime?: any;
  exchtime?: any;
  exchorderupdatetime?: any;

  fillid?: any;
  filltime?: any;
  fillprice?: any;
  fillsize?: any;

  createdAt?: any;
  updatedAt?: any;

  totalPrice?: any;
  actualQuantity?: any;

  strategyUniqueId?: string;
  strategyName?: string;
};

type Order = ClientOrder & {
  client_data?: ClientOrder[];

  // internal expand fields
  __rowType?: "MASTER" | "DETAIL";
  __isExpanded?: boolean;
};

type DetailRow = {
  __rowType: "DETAIL";
  id: string;
  parentId: number | string;
  parentStrategyUniqueId?: string;
  client_data: ClientOrder[];
};

type RowItem = (Order & { __rowType?: "MASTER" }) | DetailRow;

/** ---------------- HELPERS ---------------- */

const statusColor = (status: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
  if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
  if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
  return "#64748b";
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

/** Expand icon cell (only for MASTER rows) */
const ExpandCellRenderer = (props: ICellRendererParams) => {
  const data = props.data as any;
  if (data?.__rowType === "DETAIL") return null;

  const isExpanded = !!data?.__isExpanded;
  const toggleRow = props.context?.toggleRow;

  return (
    <div className="flex items-center h-full">
      <button
        onClick={() => toggleRow?.(data)}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
        title={isExpanded ? "Collapse" : "Expand"}
      >
        {isExpanded ? (
          <FaChevronDown className="w-3 h-3 text-gray-600" />
        ) : (
          <FaChevronRight className="w-3 h-3 text-gray-600" />
        )}
      </button>
    </div>
  );
};

/** Sell button (same design) */
const SellButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #b91c1c, #7f1d1d)";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #ef4444, #dc2626)";
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 14px",
        borderRadius: "16px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.5px",
        border: "none",
        color: "#fff",
        background: disabled ? "#9ca3af" : "linear-gradient(to right, #ef4444, #dc2626)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s ease-in-out",
      }}
      title={disabled ? "Already Sold" : "Click to Sell"}
    >
      <span style={{ fontSize: "13px", lineHeight: 1 }}>⬇</span>
      SELL
    </button>
  );
};

/** ---------------- DETAIL ROW (SUBTABLE) ---------------- */
/**
 * ✅ Subtable = SAME columns as main + extra 2 columns: broker, userNameId
 * ✅ Same design (pills, message wrap, etc.)
 */
const DetailRowRenderer = (props: any) => {
  const row = props.data as DetailRow;
  const { onSellFromSub, ltpByToken } = props.context || {};

  const subColumnDefs: ColDef<ClientOrder>[] = [
    // ✅ SAME as main: expand not needed in subtable

    // ✅ SAME as main: Action (Sell)
    {
      headerName: "Action",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const r: ClientOrder = params.data;
        if (!r) return null;

        const disabled = String(r.transactiontype || "").toUpperCase() === "SELL";
        return <SellButton disabled={disabled} onClick={() => onSellFromSub?.(r, row.parentStrategyUniqueId)} />;
      },
    },

    // ✅ EXTRA 2 columns (your request)
    { headerName: "UserId", field: "userNameId", width: 120 },
    { headerName: "Broker", field: "broker", width: 130 },

    // ✅ SAME fields as main (below)
    { headerName: "StrategyUniqueId", field: "strategyUniqueId", width: 220, minWidth: 200 },
    { headerName: "SYMBOL", field: "tradingsymbol", width: 160 },
    { headerName: "Instrument", field: "instrumenttype", width: 140 },

    {
      headerName: "Type",
      field: "transactiontype",
      width: 110,
      cellRenderer: (params: any) => {
        const isBuy = params.value === "BUY";
        const isSell = params.value === "SELL";
        const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
        const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";

        return (
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
            {params.value || "-"}
          </span>
        );
      },
    },

    { headerName: "OrderType", field: "ordertype", width: 130 },
    { headerName: "ProductType", field: "producttype", width: 130 },
    { headerName: "Price", field: "price", width: 110 },

    {
      headerName: "LTP",
      width: 110,
      sortable: false,
      filter: false,
      valueGetter: (p) => {
        const t = p.data?.symboltoken;
        return t ? ltpByToken?.[t] : undefined;
      },
      cellRenderer: (p: any) => (p.value !== undefined ? p.value : "—"),
    },

    {
      headerName: "PnL",
      width: 140,
      sortable: false,
      filter: false,
      valueGetter: (p) => {
        const token = p.data?.symboltoken;
        const live = token ? ltpByToken?.[token] : undefined;
        const price = Number(p.data?.price ?? 0);
        const qty = Number(p.data?.quantity ?? 0);
        if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
        return (live - price) * qty;
      },
      cellRenderer: (p: any) => pnlPill(p.value),
    },

    { headerName: "OrderQty", field: "quantity", width: 120 },
    { headerName: "TradedQty", field: "fillsize", width: 120 },
    { headerName: "OrderID", field: "orderid", width: 190 },
    { headerName: "TradeID", field: "fillid", width: 140 },

    {
      headerName: "Status",
      field: "status",
      width: 140,
      cellRenderer: (params: any) => {
        const status = params.value || params.data?.orderstatus || params.data?.orderstatuslocaldb;
        const color = statusColor(status);
        return (
          <span
            className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
            style={{ backgroundColor: color }}
            title={status}
          >
            {status || "-"}
          </span>
        );
      },
    },

    {
      headerName: "Message",
      field: "text",
      width: 470,
      minWidth: 350,
      wrapText: true,
      autoHeight: true,
      cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
    },

    { headerName: "Updated Time", field: "updatedAt", width: 290 },
    { headerName: "Created Time", field: "createdAt", width: 290 },
  ];

  const subDefaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mx-2 my-2">
      <div className="text-sm font-semibold text-gray-700 mb-2">
        Client Orders ({row.client_data?.length || 0})
      </div>

      <div className="ag-theme-alpine" style={{ width: "100%", height: "280px" }}>
        <AgGridReact<ClientOrder>
          rowData={row.client_data || []}
          columnDefs={subColumnDefs}
          defaultColDef={subDefaultColDef}
          pagination={true}
          paginationPageSize={10}
          rowHeight={50}
          headerHeight={40}
          suppressCellFocus={true}
          animateRows={true}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          overlayLoadingTemplate={
            '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
          }
          overlayNoRowsTemplate={
            '<div class="flex flex-col items-center justify-center h-full text-gray-500">No orders match your search criteria</div>'
          }
        />
      </div>
    </div>
  );
};

/** ---------------- MAIN COMPONENT ---------------- */

export default function OrderTableAdmin() {

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const gridApiRef = useRef<GridApi | null>(null);

  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rowData, setRowData] = useState<RowItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // token -> ltp
  const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      userid: localStorage.getItem("userID") || "",
    }),
    []
  );

  // ---------------- SOCKET ----------------
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
    return () => {
      socket.off("tick", onTick);
    };
  }, []);

  // ---------------- AUTH FAIL ----------------
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("termsAccepted");
    localStorage.removeItem("feed_token");
    localStorage.removeItem("refresh_token");
    toast.error("Unauthorized User");
    navigate("/");
  }, [navigate]);

  // ---------------- FETCH ORDERS ----------------
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(`${apiUrl}/admin/get/table/order`, {
        headers: authHeader,
      });

      if (data?.status === true) {
        const list = Array.isArray(data.data) ? data.data : [];
        setRawOrders(list);
        setExpandedIds(new Set());
      } else if (data?.status === false && data?.message === "Unauthorized") {
        handleUnauthorized();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, authHeader, handleUnauthorized]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /** build rows with DETAIL row after expanded master */
  const buildRows = useCallback((orders: Order[], expanded: Set<number | string>) => {
    const rows: RowItem[] = [];

    for (const o of orders) {
      const masterId = (o.id ?? o.uniqueorderid ?? o.orderid) as any;
      const isExpanded = expanded.has(masterId);

      rows.push({
        ...o,
        __rowType: "MASTER",
        __isExpanded: isExpanded,
      });

      if (isExpanded) {
        rows.push({
          __rowType: "DETAIL",
          id: `detail-${String(masterId)}`,
          parentId: masterId,
          parentStrategyUniqueId: o.strategyUniqueId,
          client_data: Array.isArray(o.client_data) ? o.client_data : [],
        });
      }
    }

    return rows;
  }, []);

  useEffect(() => {
    setRowData(buildRows(rawOrders, expandedIds));
  }, [rawOrders, expandedIds, buildRows]);

  const toggleRow = useCallback((masterRow: Order) => {
    const masterId = (masterRow.id ?? masterRow.uniqueorderid ?? masterRow.orderid) as any;

    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(masterId)) next.delete(masterId);
      else next.add(masterId);
      return next;
    });
  }, []);

  // ---------------- ACTIONS ----------------
  const handleSquareButton = useCallback(async () => {
    const ok = window.confirm("Do you want to Square Off this order?");
    if (!ok) return;

    try {
      const res = await axios.get(`${apiUrl}/admin/sequareoff`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (res.data?.status === true) {
        toast.success(res.data?.message || "Square off done");
        fetchOrders();
      } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
        handleUnauthorized();
      } else {
        toast.error(res.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    }
  }, [apiUrl, fetchOrders, handleUnauthorized]);

  const fetchOnlineOrdersDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/fetchorderdetails`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (res.data?.status === true) {
        // toast.success(res.data?.message || "Refreshed");
        fetchOrders();
      } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
        handleUnauthorized();
      } else {
        // toast.error(res.data?.message || "Failed to refresh");
      }
    } catch (err: any) {
      // toast.error(err?.message || "Something went wrong");
    }
  }, [apiUrl, fetchOrders, handleUnauthorized]);

  /** ✅ MAIN SELL: send orderId + strategyUniqueId */
  const handleSellMain = useCallback(
    async (row: Order) => {
      if (!row?.orderid) {
        toast.error("Order ID not found");
        return;
      }

      const strategyUniqueId = row?.strategyUniqueId || "";

      const ok = window.confirm(
        `Do you want to SELL this order?\nOrder ID: ${row.orderid}\nStrategy: ${strategyUniqueId || "-"}`
      );
      if (!ok) return;

      try {
        const res = await axios.post(
          `${apiUrl}/admin/group/squareoff`,
          { orderId: row.orderid, strategyUniqueId }, // ✅ as you asked
          { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
        );

        if (res.data?.status === true) {
          toast.success(`Order ${row.orderid} squared off successfully`);
          fetchOrders();
        } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
          handleUnauthorized();
        } else {
          toast.error(res.data?.message || "Failed to square off");
        }
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    },
    [apiUrl, fetchOrders, handleUnauthorized]
  );

  /** ✅ SUB SELL: same API */
  const handleSellFromSub = useCallback(
    async (clientRow: ClientOrder, parentStrategyUniqueId?: string) => {
      if (!clientRow?.orderid) {
        toast.error("Order ID not found");
        return;
      }

      const strategyUniqueId = parentStrategyUniqueId || clientRow.strategyUniqueId || "";

      const ok = window.confirm(
        `Do you want to SELL this order?\nOrder ID: ${clientRow.orderid}\nStrategy: ${strategyUniqueId || "-"}`
      );
      if (!ok) return;

      try {
        const res = await axios.post(
          `${apiUrl}/admin/single/squareoff`,
          { orderId: clientRow.orderid, strategyUniqueId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
        );

        if (res.data?.status === true) {
          toast.success(`Order ${clientRow.orderid} squared off successfully`);
          fetchOrders();
        } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
          handleUnauthorized();
        } else {
          toast.error(res.data?.message || "Failed to square off");
        }
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    },
    [apiUrl, fetchOrders, handleUnauthorized]
  );

  // ---------------- GRID ----------------
  const defaultColDef = useMemo<ColDef<RowItem>>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const columnDefs = useMemo<ColDef<RowItem>[]>(
    () => [
      // ✅ Expand (NO pinned)
      {
        headerName: "",
        width: 55,
        minWidth: 55,
        maxWidth: 55,
        cellRenderer: ExpandCellRenderer,
        sortable: false,
        filter: false,
        resizable: false,
      },

      // ✅ Action (NO pinned)
      {
        headerName: "Action",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;

          const disabled = String(row.transactiontype || "").toUpperCase() === "SELL";
          return <SellButton disabled={disabled} onClick={() => handleSellMain(row)} />;
        },
      },



      { headerName: "SYMBOL", field: "tradingsymbol", width: 160 },
     

      {
        headerName: "Type",
        field: "transactiontype",
        width: 110,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (row?.__rowType === "DETAIL") return null;

          const isBuy = params.value === "BUY";
          const isSell = params.value === "SELL";
          const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
          const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";

          return (
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
              {params.value || "-"}
            </span>
          );
        },
      },

   
      { headerName: "Price", field: "price", width: 110 },

      {
        headerName: "LTP",
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

        // ✅ MAIN: remove userId column ✅ add StrategyUniqueId
      { headerName: "StrategyUniqueId", field: "strategyUniqueId", width: 220, minWidth: 200 },

       { headerName: "Instrument", field: "instrumenttype", width: 140 },

      { headerName: "OrderQty", field: "quantity", width: 120 },
      { headerName: "TradedQty", field: "fillsize", width: 120 },
      { headerName: "OrderID", field: "orderid", width: 190 },
     
    
      {
        headerName: "Status",
        field: "status",
        width: 140,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (row?.__rowType === "DETAIL") return null;

          const status = params.value || row?.orderstatus || row?.orderstatuslocaldb;
          const color = statusColor(status);
          return (
            <span
              className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
              style={{ backgroundColor: color }}
              title={status}
            >
              {status || "-"}
            </span>
          );
        },
      },

         { headerName: "OrderType", field: "ordertype", width: 130 },
      { headerName: "ProductType", field: "producttype", width: 130 },
       { headerName: "TradeID", field: "fillid", width: 140 },

      // ✅ FULL WRAP Message
      {
        headerName: "Message",
        field: "text",
        width: 170,
        minWidth: 150,
        wrapText: true,
        autoHeight: true,
        cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
      },

      { headerName: "Updated Time", field: "updatedAt", width: 290 },
      { headerName: "Created Time", field: "createdAt", width: 290 },
    ],
    [handleSellMain, ltpByToken]
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  // ✅ Search: min 3 chars -> quick filter
  const onSearchKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const q = e.currentTarget.value.trim();
    if (!gridApiRef.current) return;

    if (!q) {
      (gridApiRef.current as any)?.setQuickFilter("");
      return;
    }
    if (q.length < 3) return;

    (gridApiRef.current as any).setQuickFilter(q);
  }, []);

  const getRowId = useCallback((params: any) => {
    const d: any = params.data;
    if (d?.__rowType === "DETAIL") return d.id;
    return String(d?.id ?? d?.uniqueorderid ?? d?.orderid);
  }, []);

  const isFullWidthRow = useCallback((params: any) => {
    return params?.rowNode?.data?.__rowType === "DETAIL";
  }, []);

  const fullWidthCellRenderer = useCallback((props: any) => {
    return <DetailRowRenderer {...props} />;
  }, []);

  const getRowHeight = useCallback((params: RowHeightParams) => {
    const d: any = params.data;
    if (d?.__rowType === "DETAIL") return 330;
    return 50;
  }, []);

  return (
    <div className="p-4 font-sans">
      <h2 className="mb-3 text-xl font-semibold">Current Position</h2>

      {/* ✅ same header design */}
      <div className="flex justify-between items-center gap-6 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSquareButton}
            className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
          >
            Square Off
          </button>

          <button
            onClick={fetchOnlineOrdersDetails}
            className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
          >
            Refresh
          </button>
        </div>

        <div className="flex justify-end gap-3 items-center">
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyUp={onSearchKeyUp}
              placeholder="Search (min 3 chars)"
              className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={fetchOrders}
            className="px-5 py-3 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md border"
          >
            Reload
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-32 bg-white rounded-lg border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error</div>
          <p className="text-red-700">{error}</p>
          <Button onClick={fetchOrders} className="mt-3 bg-red-500 text-white hover:bg-red-600">
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="ag-theme-alpine custom-ag-grid" style={{ height: "650px", width: "100%" }}>
          <AgGridReact<RowItem>
            onGridReady={onGridReady}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            context={{
              toggleRow,
              onSellFromSub: handleSellFromSub,
              ltpByToken,
            }}
            getRowId={getRowId}
            isFullWidthRow={isFullWidthRow}
            fullWidthCellRenderer={fullWidthCellRenderer}
            getRowHeight={getRowHeight}
            pagination={true}
            paginationPageSize={20}
            suppressCellFocus={true}
            animateRows={true}
            rowSelection="single"
            enableCellTextSelection={true}
            ensureDomOrder={true}
            headerHeight={40}
            overlayLoadingTemplate={
              '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
            }
            overlayNoRowsTemplate={
              '<div class="flex flex-col items-center justify-center h-full text-gray-500">No orders match your search criteria</div>'
            }
          />
        </div>
      )}
    </div>
  );
}
