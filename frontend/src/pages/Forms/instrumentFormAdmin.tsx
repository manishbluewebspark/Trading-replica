
// import { useState, useEffect, useRef,useMemo } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { toast } from "react-toastify";

// // --- AG Grid v31+ (modular) ------------------------------
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]); // ✅ REQUIRED

// import { AgGridReact } from "ag-grid-react";
// import type {
//   ColDef,
//   GridApi,
//   GridReadyEvent,
//   ICellRendererParams,
// } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";
// // ----------------------------------------------------------

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [dataexcel, setDataExcel] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [getPrice, setOnlyPrice] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");

//   const [selectedItem, setSelectedItem] = useState<any | null>(null);
//   const [showForm, setShowForm] = useState(false);

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");

//   const [getTrasectionType, setGetTrasectionType] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//     const [groupName, setGroupName] = useState("");


//     const [strategyList, setStrategyList] = useState([]); // all strategies from backend
// const [selectedStrategyId, setSelectedStrategyId] = useState(""); // dropdown selected id


//   // fetch data (full list)
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(`${apiUrl}/agnelone/instrument`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       console.log(res?.data, "heello");

//       if (res?.data?.status === true) {
//         const allData = res?.data?.data || [];
//         setDataExcel(allData);
//         setData(allData);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);


//     const fetchStrategies = async () => {
//   try {
//     const res = await axios.get(`${apiUrl}/admin/strategies`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         AngelOneToken: localStorage.getItem("angel_token") || "",
//         userid: localStorage.getItem("userID"),
//       },
//     });


//     if (res.data.status === true) {
//       setStrategyList(res.data.data || []);
//     } else {
//       toast.error(res.data.message);
//     }
//   } catch (err:any) {
//     toast.error(err.message);
//   }
// };

//   // Buy
//   const handleBuyClick = async (item: any) => {

//     const payload = {
//       exchange: item.exch_seg,
//       tradingsymbol: item.symbol,
//       symboltoken: item.token,
//     };

//     try {



//       await fetchStrategies()

//       const res = await axios.post(`${apiUrl}/agnelone/instrument/ltp`, payload, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res?.data?.status === true) {
//         item.price = res?.data?.data.data.ltp;
//         item.transactiontype = "BUY";
//         item.totalPrice = item.price * item.lotsize;

//         setGetTrasectionType("Buy");
//         setOnlyPrice(res?.data?.data.data.ltp);
//         setSlotSIze(item.lotsize);
//         setSelectedItem({ ...item });
//         setShowForm(true);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {

//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // Sell
//   const handleSellClick = async (item: any) => {
//     const payload = {
//       exchange: item.exch_seg,
//       tradingsymbol: item.symbol,
//       symboltoken: item.token,
//     };

//     try {


//       await fetchStrategies() 

//       const res = await axios.post(`${apiUrl}/agnelone/instrument/ltp`, payload, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res?.data?.status === true) {
//         item.price = res?.data?.data.data.ltp;
//         item.transactiontype = "SELL";
//         item.totalPrice = item.price * item.lotsize;

//         setGetTrasectionType("Sell");
//         setOnlyPrice(res?.data?.data.data.ltp);
//         setSlotSIze(item.lotsize);
//         setSelectedItem({ ...item });
//         setShowForm(true);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // AG Grid columns
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 60 },
//       // { headerName: "Symbol Num", field: "SyNum", minWidth: 20 },
//       { headerName: "Type", field: "syType", minWidth: 20 },
//       // { headerName: "nameStrickType", field: "nameStrickType", minWidth: 20 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 80 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       {
//         headerName: "Buy",
//         field: "buy",
//         width: 100,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: ICellRendererParams) => (
//           <button
//             onClick={() => handleBuyClick(params.data)}
//             className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
//           >
//             Entry Price
//           </button>
//         ),
//       },
//       {
//         headerName: "Sell",
//         field: "sell",
//         width: 100,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: ICellRendererParams) => (
//           <button
//             onClick={() => handleSellClick(params.data)}
//             className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
//           >
//             Exit Price
//           </button>
//         ),
//       },
//     ],
//     []
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // submit order
//   // const handleSubmit = async (e: React.FormEvent) => {
//   //   e.preventDefault();

//   //   if (!selectedItem) return;

//   //   const formData = {
//   //     token: selectedItem.token,
//   //     symbol: selectedItem.symbol,
//   //     name: selectedItem.name,
//   //     exch_seg: selectedItem.exch_seg,
//   //     price: selectedItem.price,
//   //     quantity: selectedItem.lotsize,
//   //     transactiontype: selectedItem.transactiontype,
//   //     duration,
//   //     orderType,
//   //     variety,
//   //     productType: selectedItem.productType,
//   //     totalPrice: selectedItem.totalPrice,
//   //     actualQuantity:
//   //       Number(selectedItem.lotsize) / Number(getslotSIze || 1), // avoid NaN
//   //       groupName:groupName
//   //   };

//   //   try {
//   //     const res = await axios.post(`${apiUrl}/order/place/order`, formData, {
//   //       headers: {
//   //         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//   //         // AngelOneToken: localStorage.getItem("angel_token") || "",
//   //         // userid: localStorage.getItem("userID"),
//   //       },
//   //     });

//   //     console.log(res);

//   //     if (res?.data?.status === true) {
//   //       alert(res?.data?.message);
//   //       setShowForm(false);
//   //       setVariety("NORMAL");
//   //       setDuration("DAY");
//   //       setOrderType("MARKET");
//   //     } else {
//   //       toast.error(res?.data?.message || "Something went wrong");
//   //     }
//   //   } catch (err: any) {
//   //     toast.error(err.message || "Something went wrong");
//   //   }
//   // };


//    // submit order
//   const handleSubmitMultiple = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!selectedItem) return;

//     const formData = {
//       token: selectedItem.token,
//       symbol: selectedItem.symbol,
//       name: selectedItem.name,
//       exch_seg: selectedItem.exch_seg,
//       instrumenttype: selectedItem.instrumenttype,
//       price: selectedItem.price,
//       quantity: selectedItem.lotsize,
//       transactiontype: selectedItem.transactiontype,
//       duration,
//       orderType,
//       variety,
//       productType: selectedItem.productType,
//       totalPrice: selectedItem.totalPrice,
//       actualQuantity:
//         Number(selectedItem.lotsize) / Number(getslotSIze || 1), // avoid NaN
//         groupName:groupName
//     };

//     try {
//       const res = await axios.post(`${apiUrl}/admin/multiple/place/order`, formData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//       });

//       console.log(res);

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setShowForm(false);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }
//   };


//   // Excel download
//   const handleExcelDownload = () => {
//     const worksheet = XLSX.utils.json_to_sheet(dataexcel);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
//     XLSX.writeFile(workbook, "instrument.xlsx");
//   };

//   // 🔍 Backend search on key up
//   const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const value = e.currentTarget.value;

//     // When 3+ chars → hit backend search
//     if (value.length >= 3) {
//       setLoading(true);
//       setError("");

//       try {
//         const res = await axios.get(
//           `${apiUrl}/agnelone/instrument/search/${value}`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               AngelOneToken: localStorage.getItem("angel_token") || "",
//             },
//           }
//         );

//         if (res?.data?.status === true) {
//           const allData = res?.data?.data || [];
//           setDataExcel(allData);
//           console.log(allData);
//           setData(allData);
//         } else {
//           toast.error(res?.data?.message || "Something went wrong");
//         }
//       } catch (err: any) {
//         toast.error(err?.message || "Something went wrong");
//         setError(err?.message || "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     }
//     // When box cleared → reload full data
//     else if (value.length === 0) {
//       fetchData();
//     }
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-end mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             onKeyUp={handleKeyUp}
//             placeholder="Search symbol (min 3 chars)"
//             className="border p-2 w-full rounded"
//           />
//         </div>
//         <div>
//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleExcelDownload}
//           >
//             Excel Download
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && data.length === 0 && (
//         <p>No data found for "Nifty Bank"</p>
//       )}

//       {/* AG Grid table */}
// {data.length > 0 && (
//   <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//     <AgGridReact
//       rowData={data}
//       columnDefs={columnDefs}
//       defaultColDef={defaultColDef}
//       animateRows
//       rowSelection="single"
//       pagination
//       paginationPageSize={10000}
//       rowHeight={34}  // 🔥 Compact professional height
//       suppressFieldDotNotation
//       onGridReady={onGridReady}
//     />
//   </div>
// )}
//       {/* Modal Form */}
//       {showForm && selectedItem && (
//         <div className="fixed inset-0 bg-backdrop-md bg-opacity-50 flex items-center justify-center z-9999">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
//             <h3 className="text-lg font-semibold mb-4 text-center">
//               {getTrasectionType} Order — {selectedItem.name}
//             </h3>

//             {/* <form onSubmit={handleSubmit} className="space-y-4"> */}
//                   <form onSubmit={handleSubmitMultiple} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium">Token</label>
//                   <input
//                     type="text"
//                     value={selectedItem.token}
//                     readOnly
//                     className="border p-2 w-full rounded bg-gray-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Exchange</label>
//                   <input
//                     type="text"
//                     value={selectedItem.exch_seg}
//                     readOnly
//                     className="border p-2 w-full rounded bg-gray-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Symbol</label>
//                   <input
//                     type="text"
//                     value={selectedItem.symbol}
//                     readOnly
//                     className="border p-2 w-full rounded bg-gray-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">
//                     Require Fund
//                   </label>
//                   <input
//                     type="text"
//                     value={Number(selectedItem.totalPrice).toFixed(2)}
//                     className="border p-2 w-full rounded bg-gray-100"
//                     readOnly
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Quantity</label>
//                   <input
//                     type="text"
//                     value={selectedItem.lotsize}
//                     onChange={(e) =>
//                       setSelectedItem({
//                         ...selectedItem,
//                         lotsize: e.target.value,
//                         totalPrice:
//                           Number(e.target.value) * Number(getPrice || 0),
//                         actualQuantity:
//                           Number(e.target.value) / Number(getslotSIze || 1),
//                       })
//                     }
//                     className="border p-2 w-full rounded bg-gray-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Price</label>
//                   <input
//                     type="text"
//                     value={Number(selectedItem.price).toFixed(2)}
//                     className="border p-2 w-full rounded bg-gray-100"
//                     readOnly
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">
//                     Order Type
//                   </label>
//                   <select
//                     value={orderType}
//                     onChange={(e) => setOrderType(e.target.value)}
//                     required
//                     className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Order Type</option>
//                     <option value="MARKET">MARKET</option>
//                     <option value="LIMIT">LIMIT</option>
//                     <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                     <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Duration</label>
//                   <select
//                     value={duration}
//                     onChange={(e) => setDuration(e.target.value)}
//                     required
//                     className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Duration</option>
//                     <option value="DAY">DAY</option>
//                     <option value="IOC">IOC</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Variety</label>
//                   <select
//                     value={variety}
//                     onChange={(e) => setVariety(e.target.value)}
//                     required
//                     className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Variety</option>
//                     <option value="NORMAL">NORMAL</option>
//                     <option value="STOPLOSS">STOPLOSS</option>
//                     <option value="ROBO">ROBO</option>
//                   </select>
//                 </div>

//                 {/* Radio Buttons Section */}
//                 <div className="mt-3">
//                   <label className="block text-sm font-medium mb-1">
//                     Product Type
//                   </label>
//                   <div className="flex items-center gap-4">
//                     <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         name="productType"
//                         value="INTRADAY"
//                         checked={selectedItem.productType === "INTRADAY"}
//                         onChange={(e) =>
//                           setSelectedItem({
//                             ...selectedItem,
//                             productType: e.target.value,
//                           })
//                         }
//                       />
//                       <span>IntraDay MIS</span>
//                     </label>

//                     <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         name="productType"
//                         value="DELIVERY"
//                         checked={selectedItem.productType === "DELIVERY"}
//                         onChange={(e) =>
//                           setSelectedItem({
//                             ...selectedItem,
//                             productType: e.target.value,
//                           })
//                         }
//                       />
//                       <span>Longterm CNC</span>
//                     </label>

//                      {/* 🔽 Strategy Dropdown */}
     

        
//                   </div>
//                 </div>
//                    <div>
//           <label className="block text-sm mb-1">Select Strategy *</label>
//           <select
//             className="w-full border rounded px-3 py-2"
//             value={selectedStrategyId}
//             onChange={(e) => {
//               const strategyId = e.target.value;
//               setSelectedStrategyId(strategyId);

//               // Auto-fill fields
//               const selected:any = strategyList.find((s: any) => s.id == strategyId);
//               if (selected) {
//                 setGroupName(selected.strategyName);
               
//               }
//             }}
//           >
          
//             {strategyList.map((s: any) => (
//               <option value={s.id} key={s.id}>
//                 {/* {s.strategyName} — {s.strategyDis.slice(0, 20)}... */}
//                    {s.strategyName}
//               </option>
//             ))}
//           </select>
//         </div>
//               </div>

//               <div className="flex justify-end mt-6 gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowForm(false)}
//                   className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg"
//                 >
//                   Submit Order
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }









// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// // import * as XLSX from "xlsx";
// import { toast } from "react-toastify";

// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);

// import { AgGridReact } from "ag-grid-react";
// import type {
//   ColDef,
//   GridApi,
//   GridReadyEvent,
//   // ICellRendererParams,
// } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {


//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");


//   const [getslotSIze, setSlotSIze] = useState("");



//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");


//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");



//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");

//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   // ------ Add/Edit Scrip modal state ------
//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">(
//     ""
//   );
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<
//       "" | "INTRADAY" | "DELIVERY"
//     >("");


//   // ---------- Simple includes-based matcher for main grid ----------
//   const rowMatchesQuery = (row: any, rawQuery: string) => {
//     const q = rawQuery.toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token ?? "");
//     const syType = String(row.syType || "").toUpperCase();

//     return (
//       symbol.includes(q) ||
//       name.includes(q) ||
//       token.includes(q) ||
//       syType.includes(q)
//     );
//   };

//   // ---------- Parse option symbol (NIFTY02DEC2525800PE) ----------
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;
//     const monthMap: Record<string, number> = {
//       JAN: 0,
//       FEB: 1,
//       MAR: 2,
//       APR: 3,
//       MAY: 4,
//       JUN: 5,
//       JUL: 6,
//       AUG: 7,
//       SEP: 8,
//       OCT: 9,
//       NOV: 10,
//       DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${dd}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ---------- Fetch instruments ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(`${apiUrl}/kite/instrument`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const allData = res?.data?.data || [];
       
        
        
//         setData(allData);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies()
//     setSearchTerm("")
//   }, []);

//   // ---------- Strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   };





//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = (row: any) => {
//     // setSelectedScriptRow(row);
//     setSelectedScriptRow({});
//     setScriptModalOpen(true);
//     setScriptSearch(row.symbol || "");
//     setChartSymbolSearch("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 60 },
//       { headerName: "Type", field: "syType", minWidth: 60 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//     ],
//     []
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };



//   // ---------- Excel ----------
  

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: today → today + N months ----------
//   const allExpiryOptions = useMemo(() => {
//     // 🔧 change this to 3 / 4 etc for different ranges
//     const MONTH_RANGE = 6;

//     const now = new Date();
//     const startOfToday = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate()
//     );

//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, Date>();

//     data.forEach((row) => {
//       const meta = parseOptionMeta(row.symbol);
//       if (!meta) return;

//       const d = meta.expiryDate;
//       if (d >= startOfToday && d <= maxDate) {
//         if (!map.has(meta.expiryLabel)) {
//           map.set(meta.expiryLabel, d);
//         }
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].getTime() - b[1].getTime())
//       .map(([label]) => label);
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data;

//     // text search on name/symbol
//     const q = scriptSearch.trim().toUpperCase();
//     if (q) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         return symbol.includes(q) || name.includes(q);
//       });
//     }

//     // strike (ChartSymbol) search
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.strike.toString().includes(strikeQ);
//       });
//     }

//     // expiry filter (already filtered to next N months in allExpiryOptions)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     // option type filter
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [data, scriptSearch, scriptExpiryFilter, scriptOptionFilter, chartSymbolSearch]);




//   const handleScriptSave = async () => {

//   if (!selectedScriptRow) {
//     toast.error("Please select a scrip from the list");
//     return;
//   }

//   const payload = {
//     // From selected row
//     token: selectedScriptRow.token,
//     symbol: selectedScriptRow.symbol,
//     name: selectedScriptRow.name,
//     exch_seg: selectedScriptRow.exch_seg,
//     lotsize: selectedScriptRow.lotsize,
//     instrumenttype: selectedScriptRow.instrumenttype,
//     price: selectedScriptRow.price,
//     quantity: selectedScriptRow.lotsize,
//     transactiontype: scriptTxnType,
//     duration,
//     orderType,
//     variety,
//     productType: scriptProductType,
//     totalPrice:selectedScriptRow.price* selectedScriptRow.lotsize,
//     actualQuantity:
//     Number(selectedScriptRow.lotsize) / Number(getslotSIze || 1),
//     searchText: scriptSearch || "",
//     chartSymbol: chartSymbolSearch || "",
//     optionType: scriptOptionFilter || "",     // CE / PE / ALL
//     expiry: scriptExpiryFilter || "",         // selected expiry
//     strategyId: selectedStrategyId || "",
//     groupName: groupName,
//   };


  
 
//       try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }



  

// };

// const handleSelectionInstrument = async(raw:any) => {
    
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

    
//       await fetchStrategies();

//       const res = await axios.post(
//         `${apiUrl}/agnelone/instrument/ltp`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: localStorage.getItem("userID"),
//           },
//         }
//       );

//       if (res?.data?.status === true) {
        
//        raw.price = res?.data?.data.data.ltp

//        setSlotSIze(raw.lotsize)

//       setSelectedScriptRow({ ...raw })
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//   }


//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

    
//      <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           {/* Search box on left */}
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>
//         </div>
//         <div>
//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//            Add/Edit
//           </button>
//         </div>
//       </div>


//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && (
//         <p>No data found.</p>
//       )}

//       {filteredData.length > 0 && (
//         <div
//           className="ag-theme-quartz compact-grid"
//           style={{ height: 540, width: "100%" }}
//         >
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}

    

//       {/* ADD/EDIT SCRIP MODAL */}
// {scriptModalOpen && (
//   <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//     <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//       {/* Make inner content scrollable so it doesn't overlap header */}
//       <div className="max-h-[90vh] overflow-y-auto p-6">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//           <button
//             onClick={() => setScriptModalOpen(false)}
//             className="text-gray-500 hover:text-black text-xl leading-none"
//           >
//             ×
//           </button>
//         </div>

//         {/* SECTION 1: Selected scrip & search */}
//         <div className="border border-gray-200 rounded-lg p-4 mb-6">
//           <h4 className="text-sm font-semibold text-gray-700 mb-3">
//             Scrip Details & Search
//           </h4>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Terminal Symbol
//               </label>
//               <input
//                 type="text"
//                 value={selectedScriptRow?.symbol || ""}
//                 readOnly
//                 className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Last Traded Price
//               </label>
//               <input
//                 type="text"
//                 value={selectedScriptRow?.price || ""}
//                 readOnly
//                 className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Search Name / Symbol / CE / PE
//               </label>
//               <input
//                 type="text"
//                 value={scriptSearch}
//                 onChange={(e) => setScriptSearch(e.target.value)}
//                 placeholder="e.g. NIFTY 25800 CE"
//                 className="border rounded px-3 py-2 w-full text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Chart Symbol (Strike)
//               </label>
//               <input
//                 type="text"
//                 placeholder="e.g. 25800"
//                 value={chartSymbolSearch}
//                 onChange={(e) => setChartSymbolSearch(e.target.value)}
//                 className="border rounded px-3 py-2 w-full text-sm"
//               />
//             </div>
//           </div>
//         </div>

//         {/* SECTION 2: Filters & basic order settings */}
//         <div className="border border-gray-200 rounded-lg p-4 mb-6">
//           <h4 className="text-sm font-semibold text-gray-700 mb-3">
//             Filters & Order Settings
//           </h4>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Option Type
//               </label>
//               <select
//                 value={scriptOptionFilter}
//                 onChange={(e) =>
//                   setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                 }
//                 className="border rounded px-3 py-2 w-full text-sm"
//               >
//                 <option value="">ALL</option>
//                 <option value="CE">CE (Call)</option>
//                 <option value="PE">PE (Put)</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Expiry (next 6 months)
//               </label>
//               <select
//                 value={scriptExpiryFilter}
//                 onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                 className="border rounded px-3 py-2 w-full text-sm"
//               >
//                 <option value="">All Expiries</option>
//                 {allExpiryOptions.map((exp) => (
//                   <option key={exp} value={exp}>
//                     {exp}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Transaction Type
//               </label>
//               <select
//                 value={scriptTxnType}
//                 onChange={(e) =>
//                   setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                 }
//                 className="border rounded px-3 py-2 w-full text-sm"
//               >
//                 <option value="BUY">BUY</option>
//                 <option value="SELL">SELL</option>
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Order Type
//               </label>
//               <select
//                 value={orderType}
//                 onChange={(e) => setOrderType(e.target.value)}
//                 required
//                 className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Order Type</option>
//                 <option value="MARKET">MARKET</option>
//                 <option value="LIMIT">LIMIT</option>
//                 <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                 <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Duration
//               </label>
//               <select
//                 value={duration}
//                 onChange={(e) => setDuration(e.target.value)}
//                 required
//                 className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Duration</option>
//                 <option value="DAY">DAY</option>
//                 <option value="IOC">IOC</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Variety
//               </label>
//               <select
//                 value={variety}
//                 onChange={(e) => setVariety(e.target.value)}
//                 required
//                 className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Variety</option>
//                 <option value="NORMAL">NORMAL</option>
//                 <option value="STOPLOSS">STOPLOSS</option>
//                 <option value="ROBO">ROBO</option>
//               </select>
//             </div>
//           </div>
//         </div>

//       <div className="border border-gray-200 rounded-lg p-4 mb-6">
//   <h4 className="text-sm font-semibold text-gray-700 mb-3">
//     Product & Strategy
//   </h4>

//   {/* 1 column on mobile, 3 columns from md+ */}
//   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//     <div>
//       <label className="block text-xs font-medium text-gray-600 mb-1">
//         Product Type
//       </label>
//       <select
//         value={scriptProductType}
//         onChange={(e) =>
//           setScriptProductType(
//             e.target.value as "" | "INTRADAY" | "DELIVERY"
//           )
//         }
//         className="border rounded px-3 py-2 w-full text-sm"
//       >
//         <option value="">Select</option>
//         <option value="INTRADAY">IntraDay MIS</option>
//         <option value="DELIVERY">Longterm CNC</option>
//       </select>
//     </div>

//   <div>
//   <label className="block text-xs font-medium text-gray-600 mb-1">
//     Quantity in Lot
//   </label>
//   <input
//     type="number"
//     placeholder="Enter Quantity in Lot"
//     value={selectedScriptRow?.lotsize || ""}
//     onChange={(e) =>
//       setSelectedScriptRow((prev:any) => ({
//         ...prev,
//         lotsize: e.target.value
//       }))
//     }
//     className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//   />
// </div>
//     <div>
//       <label className="block text-xs font-medium text-gray-600 mb-1">
//         Select Strategy *
//       </label>
//       <select
//         className="w-full border rounded px-3 py-2 text-sm"
//         value={selectedStrategyId}
//         onChange={(e) => {
//           const strategyId = e.target.value;
//           setSelectedStrategyId(strategyId);
//           const selected: any = strategyList.find(
//             (s: any) => s.id == strategyId
//           );
//           if (selected) {
//             setGroupName(selected.strategyName);
//           } else {
//             setGroupName("");
//           }
//         }}
//       >
//         <option value="">Select Strategy</option>
//         {strategyList.map((s: any) => (
//           <option value={s.id} key={s.id}>
//             {s.strategyName}
//           </option>
//         ))}
//       </select>
//     </div>
//   </div>
// </div>

//         {/* SECTION 4: Result list */}
//         <div className="border border-gray-200 rounded-lg mb-6">
//           <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//             <span className="text-xs font-semibold text-gray-600">
//               Search Results (click to select)
//             </span>
//           </div>
//           <div className="max-h-64 overflow-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-100 sticky top-0">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                     Symbol
//                   </th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                     Name
//                   </th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                     Token
//                   </th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                     Lot
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {scriptFilteredRows.map((row) => (
//                   <tr
//                     key={`${row.token}-${row.symbol}`}
//                     className={`cursor-pointer transition-colors ${
//                       selectedScriptRow?.token === row.token
//                         ? "bg-purple-100"
//                         : "hover:bg-purple-50"
//                     }`}
//                     onClick={() => handleSelectionInstrument(row)}
//                   >
//                     <td className="px-3 py-1">{row.symbol}</td>
//                     <td className="px-3 py-1">{row.name}</td>
//                     <td className="px-3 py-1">{row.token}</td>
//                     <td className="px-3 py-1">{row.lotsize}</td>
//                   </tr>
//                 ))}

//                 {scriptFilteredRows.length === 0 && (
//                   <tr>
//                     <td className="px-3 py-3 text-center text-gray-500" colSpan={4}>
//                       No matching scrips found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Footer buttons */}
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={() => {
//               setScriptSearch("");
//               setScriptExpiryFilter("");
//               setScriptOptionFilter("");
//               setChartSymbolSearch("");
//               setSelectedScriptRow(null);
//               setScriptTxnType("BUY");
//               setScriptProductType("");
//               setSelectedStrategyId("");
//               setGroupName("");
//             }}
//             className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//           >
//             Reset
//           </button>

//           <button
//             onClick={() => setScriptModalOpen(false)}
//             className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//           >
//             Close
//           </button>

//           <button
//             onClick={handleScriptSave}
//             className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//           >
//             Save changes
//           </button>
//         </div>
//       </div>
//     </div>
//   </div>
// )}


//     </div>
//   );
// }






//  Final Code

// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");
//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const gridApiRef = useRef<GridApi | null>(null);
//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");
//   // ------ Add/Edit Scrip modal state ------
//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY">("");

//   // ---------- Simple includes-based matcher for main grid ----------
//   const rowMatchesQuery = (row: any, rawQuery: string) => {
//     const q = rawQuery.toUpperCase();
//     if (!q) return true;
//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token ?? "");
//     const syType = String(row.syType || "").toUpperCase();
//     return (
//       symbol.includes(q) ||
//       name.includes(q) ||
//       token.includes(q) ||
//       syType.includes(q)
//     );
//   };

//   // ---------- Parse option symbol (NIFTY02DEC2525800PE) ----------
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;
//     const [, underlying, dd, monStr, yy, strike, optType] = m;
//     const monthMap: Record<string, number> = {
//       JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//       JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;
//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);
//     const expiryLabel = `${dd}-${monStr}-${year}`;
//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ---------- Fetch instruments ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(`${apiUrl}/agnelone/instrument`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });
//       if (res?.data?.status === true) {
//         const allData = res?.data?.data || [];
//         setData(allData);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });
//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, []);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 60 },
//       { headerName: "Type", field: "syType", minWidth: 60 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//     ],
//     []
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: today → today + N months ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 6;
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );
//     const map = new Map<string, Date>();
//     data.forEach((row) => {
//       const meta = parseOptionMeta(row.symbol);
//       if (!meta) return;
//       const d = meta.expiryDate;
//       if (d >= startOfToday && d <= maxDate) {
//         if (!map.has(meta.expiryLabel)) {
//           map.set(meta.expiryLabel, d);
//         }
//       }
//     });
//     return Array.from(map.entries())
//       .sort((a, b) => a[1].getTime() - b[1].getTime())
//       .map(([label]) => label);
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data.filter((row) => !!parseOptionMeta(row.symbol));
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);
//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.strike.toString().includes(strikeQ);
//       });
//     }
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.expiryLabel === scriptExpiryFilter;
//       });
//     }
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.optionType === scriptOptionFilter;
//       });
//     }
//     return rows.slice(0, 300);
//   }, [
//     data,
//     scriptSearch,
//     scriptExpiryFilter,
//     scriptOptionFilter,
//     chartSymbolSearch,
//   ]);

//   // ---------- Save and Selection Handlers ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }
//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);
//     const payload = {
//       token: selectedScriptRow.token,
//       symbol: selectedScriptRow.symbol,
//       name: selectedScriptRow.name,
//       exch_seg: selectedScriptRow.exch_seg,
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype,
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: scriptExpiryFilter || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//     };
//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );
//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   const handleSelectionInstrument = async (raw: any) => {
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };
//     try {
//       await fetchStrategies();
//       const res = await axios.post(
//         `${apiUrl}/agnelone/instrument/ltp`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: localStorage.getItem("userID"),
//           },
//         }
//       );
//       if (res?.data?.status === true) {
//         raw.price = res?.data?.data.data.ltp;
//         setSlotSIze(raw.lotsize);
//         setSelectedScriptRow({ ...raw });
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>
//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>
//         <div>
//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>
//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}
//       {filteredData.length > 0 && (
//         <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}
//       {/* ADD/EDIT SCRIP MODAL */}
//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>
//               {/* SECTION 1: Selected scrip & search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Scrip Details & Search</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Terminal Symbol</label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.symbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Last Traded Price</label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.price || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Search Name / Symbol / CE / PE</label>
//                     <input
//                       type="text"
//                       value={scriptSearch}
//                       onChange={(e) => setScriptSearch(e.target.value)}
//                       placeholder="e.g. NIFTY 26150 CE"
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Chart Symbol (Strike)</label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>
//               {/* SECTION 2: Filters & basic order settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Filters & Order Settings</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Option Type</label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) => setScriptOptionFilter(e.target.value as "" | "CE" | "PE")}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Expiry (next 6 months)</label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp} value={exp}>{exp}</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Type</label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) => setScriptTxnType(e.target.value as "" | "BUY" | "SELL")}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Order Type</label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Variety</label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Product & Strategy</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Product Type</label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) => setScriptProductType(e.target.value as "" | "INTRADAY" | "DELIVERY")}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Quantity in Lot</label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) => setSelectedScriptRow((prev: any) => ({ ...(prev || {}), lotsize: e.target.value }))}
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Select Strategy *</label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);
//                         const selected: any = strategyList.find((s: any) => s.id == strategyId);
//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>{s.strategyName}</option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>
//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">Search Results (click to select)</span>
//                 </div>
//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Symbol</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Name</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Token</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Lot</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ? "bg-purple-100" : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}
//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td className="px-3 py-3 text-center text-gray-500" colSpan={4}>No matching scrips found.</td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>
//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
















//  get both kite and angelone ltp code 


// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY">("");

//   const [useKite, setUseKite] = useState(false);

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//         JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//       JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ NEW: helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";
//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }

//     return {
//       ...row,
//       token: String(row.instrument_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.instrument_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, [useKite]);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 80 },
//       { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       ...(useKite
//         ? [
//             { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//             { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//           ]
//         : [
//             { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//             { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//           ]),
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const rowMatchesQuery = (row: any, query: string) => {
//     const q = query.trim().toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token || "").toUpperCase();
//     const full = `${symbol} ${name} ${token}`;

//     return full.includes(q);
//   };

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: based on expiry or parsed from symbol (today → +6 months) ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 6;
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, { label: string; date: Date }>();

//     data.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // ⭐ NEW: fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;
//       if (d < startOfToday || d > maxDate) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

//     // Search by name/symbol/CE/PE
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     // ⭐ UPDATED: Chart Symbol (Strike) filter using getOptionMeta
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         const strikeStr = String(meta?.strike ?? row.strike ?? "");
//         return strikeStr.includes(strikeQ);
//       });
//     }

//     // ⭐ UPDATED: Expiry filter uses expiryLabel (from field or parsed)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     // ⭐ UPDATED: Option Type filter using getOptionMeta (works for Kite + AngelOne)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [data, scriptSearch, scriptExpiryFilter, scriptOptionFilter, chartSymbolSearch, useKite]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelToken: selectedScriptRow.angelToken || "",
//       angelSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
    
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     try {
//       await fetchStrategies();

//       if (useKite) {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/kite/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp =
//               res?.data?.data?.ltp ||
//               res?.data?.data?.last_price ||
//               raw.last_price ||
//               raw.price ||
//               0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               kiteToken: raw.kiteToken || raw.token,
//               kiteSymbol: raw.kiteSymbol || raw.symbol,
//               angelToken: prev?.angelToken || "",
//               angelSymbol: prev?.angelSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

//       {filteredData.length > 0 && (
//         <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Last Traded Price
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.price || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>
//                     <input
//                       type="text"
//                       value={scriptSearch}
//                       onChange={(e) => setScriptSearch(e.target.value)}
//                       placeholder="e.g. NIFTY 26150 CE"
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (next 6 months)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as "" | "INTRADAY" | "DELIVERY"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export default function InstrumentFormAdmin() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [getslotSIze, setSlotSIze] = useState("");

  const [duration, setDuration] = useState("DAY");
  const [orderType, setOrderType] = useState("MARKET");
  const [variety, setVariety] = useState("NORMAL");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const gridApiRef = useRef<GridApi | null>(null);

  const [groupName, setGroupName] = useState("");
  const [strategyList, setStrategyList] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");

  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [scriptSearch, setScriptSearch] = useState("");
  const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
  const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
  const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
  const [chartSymbolSearch, setChartSymbolSearch] = useState("");
  const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
  const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY">("INTRADAY");

  const [useKite, setUseKite] = useState(false);

  // ---------- Common expiry normalizer ----------
  const buildExpiryMeta = (rawExpiry: any) => {
    if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

    const s = String(rawExpiry).trim();
    if (!s) return { expiryDateObj: null, expiryLabel: "" };

    let d: Date | null = null;

    // 1) YYYY-MM-DD  (Kite)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      d = new Date(s + "T00:00:00");
    }
    // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
    else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
      const [ddStr, monStrRaw, yyStr] = s.split("-");
      const dd = Number(ddStr);
      const monStr = monStrRaw.toUpperCase();
      const monthMap: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
      };
      const monthIndex = monthMap[monStr];
      if (monthIndex !== undefined) {
        let yearNum = Number(yyStr);
        if (yyStr.length === 2) {
          yearNum = 2000 + yearNum;
        }
        d = new Date(yearNum, monthIndex, dd);
      }
    }
    // 3) Fallback: native Date parse
    else {
      const t = new Date(s);
      if (!isNaN(t.getTime())) d = t;
    }

    if (!d) return { expiryDateObj: null, expiryLabel: "" };

    const day = d.getDate().toString().padStart(2, "0");
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

    return { expiryDateObj: d, expiryLabel: label };
  };

  // ---------- Parse option symbol (only for strike & CE/PE) ----------
  // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
  const parseOptionMeta = (symbolRaw: any) => {
    const symbol = String(symbolRaw || "").toUpperCase();

    // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
    const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
    const m = symbol.match(re);
    if (!m) return null;

    const [, underlying, dd, monStr, yy, strike, optType] = m;

    const monthMap: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };
    const monthIndex = monthMap[monStr];
    if (monthIndex === undefined) return null;

    const year = 2000 + Number(yy);
    const day = Number(dd);
    const dateObj = new Date(year, monthIndex, day);

    const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

    return {
      underlying,
      expiryLabel,
      expiryDate: dateObj,
      strike: Number(strike),
      optionType: optType as "CE" | "PE",
    };
  };

  // ⭐ NEW: helper that always tries to extract strike / optionType / expiry
  const getOptionMeta = (row: any) => {
    const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";
    const fromSymbol = parseOptionMeta(mainSymbol);
    if (fromSymbol) return fromSymbol;

    const name = String(row.name || "").toUpperCase();
    const optMatch = name.match(/\b(CE|PE)\b/);
    const strikeMatches = name.match(/(\d+)/g);

    return {
      underlying: "",
      expiryLabel: row.expiryLabel || "",
      expiryDate: row.expiryDateObj || null,
      strike: strikeMatches
        ? Number(strikeMatches[strikeMatches.length - 1])
        : row.strike || 0,
      optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
    };
  };

  // ---------- NORMALIZERS (AngelOne & Kite) ----------
  const mapAngelToCommon = (row: any) => {
    const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

    return {
      ...row,
      token: String(row.token ?? ""),
      symbol: String(row.symbol ?? ""),
      name: row.name ?? "",
      expiry: row.expiry ?? "",
      strike: row.strike !== undefined ? Number(row.strike) : -1,
      lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
      instrumenttype: row.instrumenttype ?? "",
      exch_seg: row.exch_seg ?? "",
      tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
      syType: row.instrumenttype ?? row.syType ?? "",
      angelToken: String(row.token ?? ""),
      angelSymbol: String(row.symbol ?? ""),
      kiteToken: row.kiteToken ?? "",
      kiteSymbol: row.kiteSymbol ?? "",
      expiryDateObj,
      expiryLabel,
    };
  };

  const mapKiteToCommon = (row: any) => {
    const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

    // Try to derive strike if missing
    let strike = row.strike;
    if (!strike) {
      const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
      if (metaFromSymbol) {
        strike = metaFromSymbol.strike;
      } else {
        const m = String(row.name || "").match(/\d+/);
        strike = m ? Number(m[0]) : 0;
      }
    }

    return {
      ...row,
      token: String(row.instrument_token ?? ""),
      symbol: String(row.tradingsymbol ?? ""),
      name: row.name ?? "",
      expiry: row.expiry ?? "",
      strike: Number(strike),
      lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
      instrumenttype: row.instrument_type ?? "",
      exch_seg: row.segment ?? row.exchange ?? "",
      tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
      syType: row.instrument_type ?? "",
      kiteToken: String(row.instrument_token ?? ""),
      kiteSymbol: String(row.tradingsymbol ?? ""),
      angelToken: row.angelToken ?? "",
      angelSymbol: row.angelSymbol ?? "",
      expiryDateObj,
      expiryLabel,
    };
  };

  // ---------- Fetch instruments (AngelOne or Kite) ----------
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
      const res = await axios.get(`${apiUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (res?.data?.status === true) {
        const rawData = res?.data?.data || [];

        const normalized = useKite
          ? rawData.map((row: any) => mapKiteToCommon(row))
          : rawData.map((row: any) => mapAngelToCommon(row));

        setData(normalized);
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong");
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Fetch strategies ----------
  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/strategies`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      });

      if (res.data.status === true) {
        setStrategyList(res.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStrategies();
    setSearchTerm("");
  }, [useKite]);

  // ---------- Open Add/Edit Scrip modal ----------
  const handleOpenScriptModal = () => {
    setSelectedScriptRow(null);
    setScriptModalOpen(true);
    setScriptSearch("");
    setChartSymbolSearch("");
    setScriptExpiryFilter("");
    setScriptOptionFilter("");
    setScriptTxnType("BUY");
    setScriptProductType("");
    setSelectedStrategyId("");
    setGroupName("");
  };

  // ---------- AG Grid ----------
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: "Token", field: "token", minWidth: 80 },
      { headerName: "Type", field: "syType", minWidth: 80 },
      {
        headerName: "Symbol",
        field: "symbol",
        minWidth: 250,
        filter: "agTextColumnFilter",
      },
      { headerName: "Name", field: "name", minWidth: 120 },
      { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
      { headerName: "Lot-Size", field: "lotsize", width: 110 },
      ...(useKite
        ? [
            { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
            { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
          ]
        : [
            { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
            { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
          ]),
      { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
    ],
    [useKite]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
    }),
    []
  );

  const onGridReady = (e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    e.api.sizeColumnsToFit();
  };

  // ---------- Debounced search (main grid) ----------
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const rowMatchesQuery = (row: any, query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) return true;

    const symbol = String(row.symbol || "").toUpperCase();
    const name = String(row.name || "").toUpperCase();
    const token = String(row.token || "").toUpperCase();
    const full = `${symbol} ${name} ${token}`;

    return full.includes(q);
  };

  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return data;
    return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
  }, [data, debouncedSearch]);

  // ---------- Expiry dropdown: based on expiry or parsed from symbol (today → +6 months) ----------
  const allExpiryOptions = useMemo(() => {
    const MONTH_RANGE = 6;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const maxDate = new Date(
      startOfToday.getFullYear(),
      startOfToday.getMonth() + MONTH_RANGE,
      startOfToday.getDate()
    );

    const map = new Map<string, { label: string; date: Date }>();

    data.forEach((row) => {
      let d: Date | null = row.expiryDateObj || null;
      let label: string = row.expiryLabel || "";

      // ⭐ NEW: fallback to parse from symbol if expiry field was empty
      if (!d || !label) {
        const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
        if (meta) {
          d = meta.expiryDate;
          label = meta.expiryLabel;
        }
      }

      if (!d || !label) return;
      if (d < startOfToday || d > maxDate) return;

      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { label, date: d });
      }
    });

    return Array.from(map.entries())
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([key, value]) => ({
        key,
        label: value.label,
      }));
  }, [data]);

  // ---------- Filter rows in Add/Edit Scrip modal ----------
  const scriptFilteredRows = useMemo(() => {
    let rows = data.filter((row) => {
      if (useKite) {
        return row.kiteSymbol && row.kiteToken;
      } else {
        return row.angelSymbol && row.angelToken;
      }
    });

    // Search by name/symbol/CE/PE
    const qRaw = scriptSearch.trim().toUpperCase();
    const tokens = qRaw.split(/\s+/).filter(Boolean);

    if (tokens.length > 0) {
      rows = rows.filter((row) => {
        const symbol = String(row.symbol || "").toUpperCase();
        const name = String(row.name || "").toUpperCase();
        const haystack = `${symbol} ${name}`;
        return tokens.every((t) => haystack.includes(t));
      });
    }

    // ⭐ UPDATED: Chart Symbol (Strike) filter using getOptionMeta
    const strikeQ = chartSymbolSearch.trim();
    if (strikeQ) {
      rows = rows.filter((row) => {
        const meta = getOptionMeta(row);
        const strikeStr = String(meta?.strike ?? row.strike ?? "");
        return strikeStr.includes(strikeQ);
      });
    }

    // ⭐ UPDATED: Expiry filter uses expiryLabel (from field or parsed)
    if (scriptExpiryFilter) {
      rows = rows.filter((row) => {
        if (row.expiryLabel === scriptExpiryFilter) return true;
        const meta = getOptionMeta(row);
        return meta?.expiryLabel === scriptExpiryFilter;
      });
    }

    // ⭐ UPDATED: Option Type filter using getOptionMeta (works for Kite + AngelOne)
    if (scriptOptionFilter) {
      rows = rows.filter((row) => {
        const meta = getOptionMeta(row);
        return meta && meta.optionType === scriptOptionFilter;
      });
    }

    return rows.slice(0, 300);
  }, [data, scriptSearch, scriptExpiryFilter, scriptOptionFilter, chartSymbolSearch, useKite]);

  // ---------- Save ----------
  const handleScriptSave = async () => {
    
    if (!selectedScriptRow) {
      toast.error("Please select a scrip from the list");
      return;
    }

    const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
    const priceNum = Number(selectedScriptRow.price || 0);
    const slotSizeNum = Number(getslotSIze || 1);

    //  REQUIRED FIELD CHECKS
  // -------------------------
  const requiredFields = [
    { label: "Token", value: selectedScriptRow.token },
    { label: "Symbol", value: selectedScriptRow.symbol },
    { label: "Name", value: selectedScriptRow.name },
    { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
    { label: "AngelOne Token", value: selectedScriptRow.angelToken },
    { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
    { label: "Kite Token", value: selectedScriptRow.kiteToken },
    { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
    { label: "Group Name", value: groupName },
    { label: "Quantity (Lot Size)", value: lotSizeNum },
    { label: "Product Type)", value: scriptProductType },

    
  ];

  console.log(selectedScriptRow.kiteToken,selectedScriptRow.kiteSymbol, groupName,lotSizeNum);
  
  for (let item of requiredFields) {
    if (!item.value || item.value === ""|| item.value === " ") {
      toast.error(`${item.label} is required.`);
      return;
    }
  }



    const payload = {
      token: selectedScriptRow.token || "",
      symbol: selectedScriptRow.symbol || "",
      name: selectedScriptRow.name || "",
      exch_seg: selectedScriptRow.exch_seg || "",
      lotsize: lotSizeNum,
      instrumenttype: selectedScriptRow.instrumenttype || "",
      price: priceNum,
      quantity: lotSizeNum,
      transactiontype: scriptTxnType,
      duration,
      orderType,
      variety,
      productType: scriptProductType,
      totalPrice: priceNum * lotSizeNum,
      actualQuantity: lotSizeNum / slotSizeNum,
      searchText: scriptSearch || "",
      chartSymbol: chartSymbolSearch || "",
      optionType: scriptOptionFilter || "",
      expiry: selectedScriptRow.expiry || "",
      expiryLabel: selectedScriptRow.expiryLabel || "",
      strategyId: selectedStrategyId || "",
      groupName: groupName,
      angelOneToken: selectedScriptRow.angelToken || "",
      angelOneSymbol: selectedScriptRow.angelSymbol || "",
      kiteToken: selectedScriptRow.kiteToken || "",
      kiteSymbol: selectedScriptRow.kiteSymbol || "",
    };

    try {
      const res = await axios.post(
        `${apiUrl}/admin/multiple/place/order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (res?.data?.status === true) {
        alert(res?.data?.message);
        setVariety("NORMAL");
        setDuration("DAY");
        setOrderType("MARKET");
        setScriptModalOpen(false);
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    }
  };

  // ---------- Selection Handler ----------
  const handleSelectionInstrument = async (raw: any) => {
    
    const payload = {
      exchange: raw.exch_seg,
      tradingsymbol: raw.symbol,
      symboltoken: raw.token,
    };

    console.log(raw,' instrument',useKite);
    

    try {
      await fetchStrategies();

      if (useKite) {
          
          setSelectedScriptRow((prev: any) => ({
              ...(prev || {}),
              kiteToken: raw.exchange_token ,
              kiteSymbol: raw.kiteSymbol ,
              angelToken: prev?.angelToken || "",
              angelSymbol: prev?.angelSymbol || "",
              kiteName: raw.name,
              exch_seg: raw.exchange,
              lotsize: raw.lotsize,
              // instrumenttype: raw.instrumenttype,
              price: 0,
              expiry: raw.expiry,
              expiryLabel: raw.expiryLabel,
              expiryDateObj: raw.expiryDateObj,
            }));

            setSlotSIze(raw.lotsize);

      } else {
        try {
          const res = await axios.post(
            `${apiUrl}/agnelone/instrument/ltp`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                AngelOneToken: localStorage.getItem("angel_token") || "",
                userid: localStorage.getItem("userID"),
              },
            }
          );

          if (res?.data?.status === true) {
            const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

            setSelectedScriptRow((prev: any) => ({
              ...(prev || {}),
              angelToken: raw.angelToken || raw.token,
              angelSymbol: raw.angelSymbol || raw.symbol,
              kiteToken: prev?.kiteToken || "",
              kiteSymbol: prev?.kiteSymbol || "",
              token: raw.token,
              symbol: raw.symbol,
              name: raw.name,
              exch_seg: raw.exch_seg,
              lotsize: raw.lotsize,
              instrumenttype: raw.instrumenttype,
              price: ltp,
              expiry: raw.expiry,
              expiryLabel: raw.expiryLabel,
              expiryDateObj: raw.expiryDateObj,
            }));

            setSlotSIze(raw.lotsize);
          } else {
            toast.error(res?.data?.message || "Something went wrong");
          }
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Something went wrong");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    }
  };

  // ---------- JSX ----------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
            className="border p-2 w-full rounded"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useKite}
              onChange={(e) => setUseKite(e.target.checked)}
              className="h-4 w-4"
            />
            Use Kite Instruments
          </label>

          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleOpenScriptModal}
          >
            Add/Edit
          </button>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

      {filteredData.length > 0 && (
        <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
          <AgGridReact
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows
            rowSelection="single"
            pagination
            paginationPageSize={10000}
            rowHeight={34}
            suppressFieldDotNotation
            onGridReady={onGridReady}
          />
        </div>
      )}

      {scriptModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
            <div className="max-h-[90vh] overflow-y-auto p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
                <button
                  onClick={() => setScriptModalOpen(false)}
                  className="text-gray-500 hover:text-black text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* SECTION 1: Scrip Details & Search */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Scrip Details & Search
                  </h4>

                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={useKite}
                      onChange={(e) => setUseKite(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Search in Kite Instruments (unchecked = AngelOne)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Terminal Symbol (AngelOne)
                    </label>
                    <input
                      type="text"
                      value={selectedScriptRow?.angelSymbol || ""}
                      readOnly
                      className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Terminal Symbol (Kite)
                    </label>
                    <input
                      type="text"
                      value={selectedScriptRow?.kiteSymbol || ""}
                      readOnly
                      className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Token (AngelOne)
                    </label>
                    <input
                      type="text"
                      value={selectedScriptRow?.angelToken || ""}
                      readOnly
                      className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Token (Kite)
                    </label>
                    <input
                      type="text"
                      value={selectedScriptRow?.kiteToken || ""}
                      readOnly
                      className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Last Traded Price
                    </label>
                    <input
                      type="text"
                      value={selectedScriptRow?.price || ""}
                      readOnly
                      className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Search Name / Symbol / CE / PE
                    </label>
                    <input
                      type="text"
                      value={scriptSearch}
                      onChange={(e) => setScriptSearch(e.target.value)}
                      placeholder="e.g. NIFTY 26150 CE"
                      className="border rounded px-3 py-2 w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Chart Symbol (Strike)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 26150"
                      value={chartSymbolSearch}
                      onChange={(e) => setChartSymbolSearch(e.target.value)}
                      className="border rounded px-3 py-2 w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Filters & Order Settings */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Filters & Order Settings
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Option Type
                    </label>
                    <select
                      value={scriptOptionFilter}
                      onChange={(e) =>
                        setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
                      }
                      className="border rounded px-3 py-2 w-full text-sm"
                    >
                      <option value="">ALL</option>
                      <option value="CE">CE (Call)</option>
                      <option value="PE">PE (Put)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Expiry (next 6 months)
                    </label>
                    <select
                      value={scriptExpiryFilter}
                      onChange={(e) => setScriptExpiryFilter(e.target.value)}
                      className="border rounded px-3 py-2 w-full text-sm"
                    >
                      <option value="">All Expiries</option>
                      {allExpiryOptions.map((exp) => (
                        <option key={exp.key} value={exp.label}>
                          {exp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Transaction Type
                    </label>
                    <select
                      value={scriptTxnType}
                      onChange={(e) =>
                        setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
                      }
                      className="border rounded px-3 py-2 w-full text-sm"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Order Type
                    </label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      required
                      className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Order Type</option>
                      <option value="MARKET">MARKET</option>
                      <option value="LIMIT">LIMIT</option>
                      <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
                      <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                      className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Duration</option>
                      <option value="DAY">DAY</option>
                      <option value="IOC">IOC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Variety
                    </label>
                    <select
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      required
                      className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Variety</option>
                      <option value="NORMAL">NORMAL</option>
                      <option value="STOPLOSS">STOPLOSS</option>
                      <option value="ROBO">ROBO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Product & Strategy */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Product & Strategy
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Product Type
                    </label>
                    <select
                      value={scriptProductType}
                      onChange={(e) =>
                        setScriptProductType(
                          e.target.value as "" | "INTRADAY" | "DELIVERY"
                        )
                      }
                      className="border rounded px-3 py-2 w-full text-sm"
                    >
                      <option value="">Select</option>
                      <option value="INTRADAY">IntraDay MIS</option>
                      <option value="DELIVERY">Longterm CNC</option>
                      <option value="CARRYFORWARD">CARRYFORWARD</option>
                      <option value="BO">Bracket Order </option>
                      <option value="MARGIN">Margin Delivery</option>

                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Quantity in Lot
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Quantity in Lot"
                      value={selectedScriptRow?.lotsize || ""}
                      onChange={(e) =>
                        setSelectedScriptRow((prev: any) => ({
                          ...(prev || {}),
                          lotsize: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Select Strategy *
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={selectedStrategyId}
                      onChange={(e) => {
                        const strategyId = e.target.value;
                        setSelectedStrategyId(strategyId);

                        const selected: any = strategyList.find(
                          (s: any) => s.id == strategyId
                        );

                        if (selected) {
                          setGroupName(selected.strategyName);
                        } else {
                          setGroupName("");
                        }
                      }}
                    >
                      <option value="">Select Strategy</option>
                      {strategyList.map((s: any) => (
                        <option value={s.id} key={s.id}>
                          {s.strategyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Result list */}
              <div className="border border-gray-200 rounded-lg mb-6">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">
                    Search Results (click to select)
                  </span>
                </div>

                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Symbol
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Token
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Lot
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {scriptFilteredRows.map((row) => (
                        <tr
                          key={`${row.token}-${row.symbol}`}
                          className={`cursor-pointer transition-colors ${
                            selectedScriptRow?.token === row.token ||
                            selectedScriptRow?.kiteToken === row.token ||
                            selectedScriptRow?.angelToken === row.token
                              ? "bg-purple-100"
                              : "hover:bg-purple-50"
                          }`}
                          onClick={() => handleSelectionInstrument(row)}
                        >
                          <td className="px-3 py-1">{row.symbol}</td>
                          <td className="px-3 py-1">{row.name}</td>
                          <td className="px-3 py-1">{row.token}</td>
                          <td className="px-3 py-1">{row.lotsize}</td>
                        </tr>
                      ))}

                      {scriptFilteredRows.length === 0 && (
                        <tr>
                          <td
                            className="px-3 py-3 text-center text-gray-500"
                            colSpan={4}
                          >
                            No matching scrips found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setScriptSearch("");
                    setScriptExpiryFilter("");
                    setScriptOptionFilter("");
                    setChartSymbolSearch("");
                    setSelectedScriptRow(null);
                    setScriptTxnType("BUY");
                    setScriptProductType("");
                    setSelectedStrategyId("");
                    setGroupName("");
                  }}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
                >
                  Reset
                </button>

                <button
                  onClick={() => setScriptModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
                >
                  Close
                </button>

                <button
                  onClick={handleScriptSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
