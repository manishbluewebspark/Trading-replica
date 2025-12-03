

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

// // 🔹 Type + Exchange options (Angel + Zerodha share same codes)
// type ExchangeOption = {
//   code: string;
//   fullForm: string;
// };

// const EXCHANGE_OPTIONS: ExchangeOption[] = [
//   { code: "NSE", fullForm: "National Stock Exchange" },
//   { code: "BSE", fullForm: "Bombay Stock Exchange" },
//   { code: "NFO", fullForm: "NSE Futures & Options Segment" },
//   { code: "BFO", fullForm: "BSE Futures & Options Segment" },
//   { code: "CDS", fullForm: "Currency Derivatives Segment" },
//   { code: "MCX", fullForm: "Multi Commodity Exchange" },
// ];

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [symbolPrefix, setSymbolPrefix] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [activeTab, setActiveTab] = useState('Quick');

//   // AG Grid Quick Filter ke liye state
//   const [quickFilterText, setQuickFilterText] = useState("");

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
//   const [scriptProductType, setScriptProductType] = useState<
//     "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
//   >("INTRADAY");

//   const [useKite, setUseKite] = useState(false);

//   // 🔹 Selected Exchange for filter on top (value contains "code - fullForm")
//   const [selectedExchange, setSelectedExchange] = useState<string>("");

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
//         JAN: 0,
//         FEB: 1,
//         MAR: 2,
//         APR: 3,
//         MAY: 4,
//         JUN: 5,
//         JUL: 6,
//         AUG: 7,
//         SEP: 8,
//         OCT: 9,
//         NOV: 10,
//         DEC: 11,
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
//     const monthNames = [
//       "JAN",
//       "FEB",
//       "MAR",
//       "APR",
//       "MAY",
//       "JUN",
//       "JUL",
//       "AUG",
//       "SEP",
//       "OCT",
//       "NOV",
//       "DEC",
//     ];
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

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ helper that always tries to extract strike / optionType / expiry
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
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
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

//       console.log(res);
      

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
//     setQuickFilterText(""); // Reset quick filter when switching data source
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

//   // ---------- AG Grid Column Definitions ----------
// const columnDefs = useMemo<ColDef[]>(
//   () => [
//     {
//       headerName: "Action",
//       cellRenderer: (params: any) => (
//         <button
//           onClick={() => {
//             setSelectedScriptRow(params.data);
//             setScriptModalOpen(true);
//             setScriptTxnType("BUY");
//           }}
//           className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" // text-xs → text-sm
//         >
//           Buy
//         </button>
//       ),
//       minWidth: 100,
//       sortable: false,
//       filter: false,
//     },
//     {
//       headerName: "Token",
//       field: "token",
//       minWidth: 250,
//       filter: "agTextColumnFilter",
//     },
//     {
//       headerName: "Symbol",
//       field: "symbol",
//       minWidth: 250,
//       filter: "agTextColumnFilter",
//     },
//     {
//       headerName: "Kite Symbol",
//       field: "kite_tradingsymbol",
//       minWidth: 120,
//       filter: "agTextColumnFilter",
//     },
//   ],
//   [useKite]
// );


//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//       flex: 1,
//       minWidth: 100,
//        cellClass: "text-base",     // BODY letter size
//     headerClass: "text-base",   // HEADER letter size
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Quick Filter Handler (AG Grid Built-in) ----------
//   const onFilterTextBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setQuickFilterText(e.target.value);
//   };

//   // 🔹 Main grid data, filtered by exchange
//   const filteredData = useMemo(() => {
//     let rows = data;

//     if (selectedExchange) {
//       const selectedCode = selectedExchange.split(" - ")[0].toUpperCase(); // e.g. "NFO"
//       rows = rows.filter(
//         (row) =>
//           String(row.exch_seg || "")
//             .toUpperCase()
//             .trim() === selectedCode
//       );
//     }

//     return rows;
//   }, [data, selectedExchange]);

//   // ---------- Base rows for modal filters (without expiry) ----------
//   const scriptBaseRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

//     // Search by name/symbol/CE/PE (e.g. "NIFTY")
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

//     // Chart Symbol (Strike) filter – matches whatever you type (e.g. 26150)
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row: any) => {
//         return (
//           (row.symbol &&
//             row.symbol.toUpperCase().includes(strikeQ.toUpperCase())) ||
//           (row.tradingsymbol &&
//             row.tradingsymbol.toUpperCase().includes(strikeQ.toUpperCase()))
//         );
//       });
//     }

//     // Option Type filter (CE/PE)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows;
//   }, [data, scriptSearch, chartSymbolSearch, scriptOptionFilter, useKite]);

//   // ---------- Expiry dropdown: based on filtered rows (today → +3 months) ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 3; // ⭐ only next 3 months
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, { label: string; date: Date }>();

//     scriptBaseRows.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // fallback to parse from symbol if expiry field was empty
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
//   }, [scriptBaseRows]);

//   // ---------- Final filtered rows in Add/Edit Scrip modal (with expiry) ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = [...scriptBaseRows];

//     // Expiry filter (dropdown)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [scriptBaseRows, scriptExpiryFilter]);



//   const handleScriptSave = async () => {
 
//     if (!selectedScriptRow) {
//     toast.error("No scrip selected!");
//     return;
//   }


//   console.log(selectedScriptRow);

//   const payload = {
//     token: selectedScriptRow.token,
//     symbol: selectedScriptRow.symbol,
//     name: selectedScriptRow.name,
//     exch_seg: selectedScriptRow.exch_seg,
//     lotsize: selectedScriptRow.lotsize,
//     quantity: Number(selectedScriptRow.lotsize),
//     transactiontype: 'BUY',
//     duration,
//     orderType,
//     variety,
//     productType: scriptProductType,
//     strategyId: selectedStrategyId,
//     groupName,
//     angelOneToken: selectedScriptRow.angelToken,
//     angelOneSymbol: selectedScriptRow.angelSymbol,
//     kiteToken: selectedScriptRow.token,
//     kiteSymbol: selectedScriptRow.kite_tradingsymbol,
//   };

//   console.log(payload,'payload');
  

//   try {
//     // const res = await axios.post(
//     //   `${apiUrl}/admin/multiple/place/order`,
//     //   payload,
//     //   {
//     //     headers: {
//     //       Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//     //     },
//     //   }
//     // );

//     // if (res?.data?.status) {
//     //   toast.success("Order placed successfully!");
//     //   setScriptModalOpen(false);
//     // } else {
//     //   toast.error(res?.data?.message || "Failed to place order.");
//     // }
//   } catch (err) {
//     toast.error("Something went wrong.");
//   }
// };


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
//         setSelectedScriptRow((prev: any) => ({
//           ...(prev || {}),
//           kiteToken: raw.exchange_token || raw.kiteToken || raw.token,
//           kiteSymbol: raw.kiteSymbol || raw.symbol,
//           angelToken: prev?.angelToken || "",
//           angelSymbol: prev?.angelSymbol || "",
//           kiteName: raw.name,
//           exch_seg: raw.exch_seg || raw.exchange,
//           lotsize: raw.lotsize,
//           price: 0,
//           expiry: raw.expiry,
//           expiryLabel: raw.expiryLabel,
//           expiryDateObj: raw.expiryDateObj,
//         }));

//         setSlotSIze(raw.lotsize);
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
//         {/* AG Grid Quick Filter */}
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={quickFilterText}
//             onChange={onFilterTextBoxChange}
//             placeholder='AG Grid Quick Filter (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//           <p className="text-xs text-gray-500 mt-1">
//             Type to filter across all columns. Each column also has individual filters.
//           </p>
//         </div>

//         <div className="flex items-center gap-4">
//           {/* 🔹 Exchange Filter Dropdown */}
//           <div>
//             <label className="block text-xs font-medium text-gray-600 mb-1">
//               Exchange Filter
//             </label>
//             <select
//               value={selectedExchange}
//               onChange={(e) => setSelectedExchange(e.target.value)}
//               className="border rounded px-3 py-2 text-sm bg-white"
//             >
//               <option value="">All Exchanges</option>
//               {EXCHANGE_OPTIONS.map((ex) => {
//                 const value = `${ex.code} - ${ex.fullForm}`;
//                 return (
//                   <option key={ex.code} value={value}>
//                     {ex.code} - {ex.fullForm}
//                   </option>
//                 );
//               })}
//             </select>
//           </div>

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
//             quickFilterText={quickFilterText} // AG Grid quick filter prop
//           />
//         </div>
//       )}

// {scriptModalOpen && selectedScriptRow && (
//   <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]">
//     <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-3 border border-gray-200">
//       {/* Blue Header: Symbol and Exchange */}
//       <div className="bg-blue-600 text-white rounded-t-lg p-4 flex justify-between items-center">
//         <div>
//           <h3 className="text-lg font-semibold">{selectedScriptRow.symbol}</h3>
//           {/* <div className="flex gap-4 text-sm mt-1">
//             <span className="flex items-center gap-1">
//               <input
//                 type="radio"
//                 name="exchange"
//                 checked={selectedScriptRow.exch_seg === "BSE"}
//                 onChange={() => {}}
//                 className="h-3 w-3"
//               />
//               BSE ₹{selectedScriptRow.price || "0.00"}
//             </span>
//             <span className="flex items-center gap-1">
//               <input
//                 type="radio"
//                 name="exchange"
//                 checked={selectedScriptRow.exch_seg === "NSE"}
//                 onChange={() => {}}
//                 className="h-3 w-3"
//               />
//               NSE ₹{selectedScriptRow.price || "0.00"}
//             </span>
//           </div> */}
//         </div>
//         <button
//           onClick={() => setScriptModalOpen(false)}
//           className="text-white text-2xl leading-none font-bold pb-1"
//         >
//           ×
//         </button>
//       </div>

//       {/* Tabs for Order Type (Quick/Regular/Iceberg) with Toggle */}
//       <div className="border-b border-gray-200">
//         <div className="flex">
//           <button
//             className={`flex-1 py-3 text-center font-medium ${activeTab === 'Quick' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
//             onClick={() => setActiveTab('Quick')}
//           >
//             Quick
//           </button>
//           <button
//             className={`flex-1 py-3 text-center font-medium ${activeTab === 'Regular' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
//             onClick={() => setActiveTab('Regular')}
//           >
//             Regular
//           </button>
//           <button
//             className={`flex-1 py-3 text-center font-medium ${activeTab === 'Iceberg' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
//             onClick={() => setActiveTab('Iceberg')}
//           >
//             Iceberg
//           </button>
//         </div>
//       </div>

//       {/* Product Type (Intraday/Longterm) */}
//       <div className="p-5">
//         <div className="flex gap-6 mb-5">
//           <label className="flex items-center gap-2">
//             <input
//               type="radio"
//               name="productType"
//               checked={scriptProductType === "INTRADAY"}
//               onChange={() => setScriptProductType("INTRADAY")}
//               className="h-4 w-4"
//             />
//             Intraday <span className="text-xs text-gray-500">MIS</span>
//           </label>
//           <label className="flex items-center gap-2">
//             <input
//               type="radio"
//               name="productType"
//               checked={scriptProductType === "DELIVERY"}
//               onChange={() => setScriptProductType("DELIVERY")}
//               className="h-4 w-4"
//             />
//             Longterm <span className="text-xs text-gray-500">CNC</span>
//           </label>
//         </div>

//         {/* Quantity and Price Inputs with Increased Height and Spacing */}
//         <div className="grid grid-cols-3 gap-5 mb-5">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Qty.</label>
//             <input
//               type="number"
//               value={selectedScriptRow.lotsize || 1}
//               onChange={(e) => {
//             const val = Number(e.target.value);
//             // update selectedScriptRow object also
//             setSelectedScriptRow((prev: any) => ({
//               ...prev,
//               lotsize: val,
//             }));
//           }}
//               className="border rounded px-3 py-2 w-full text-center h-10"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Market price</label>
//             <input
//               type="number"
//               value={0}
//               readOnly
//               className="border rounded px-3 py-2 w-full text-center bg-gray-100 h-10"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Trigger price</label>
//             <input
//               type="number"
//               value={0}
//               readOnly
//               className="border rounded px-3 py-2 w-full text-center bg-gray-100 h-10"
//             />
//           </div>
//         </div>

//         {/* Order Type (Market/Limit/SL/SL-M) */}
//         <div className="flex gap-5 mb-5">
//           <label className="flex items-center gap-2">
//             <input
//               type="radio"
//               name="orderType"
//               checked={orderType === "MARKET"}
//               onChange={() => setOrderType("MARKET")}
//               className="h-4 w-4"
//             />
//             Market
//           </label>
//           <label className="flex items-center gap-2">
//             <input
//               type="radio"
//               name="orderType"
//               checked={orderType === "LIMIT"}
//               onChange={() => setOrderType("LIMIT")}
//               className="h-4 w-4"
//             />
//             Limit
//           </label>
//           <label className="flex items-center gap-2">
//             <input
//               type="radio"
//               name="orderType"
//               checked={orderType === "STOPLOSS_LIMIT"}
//               onChange={() => setOrderType("STOPLOSS_LIMIT")}
//               className="h-4 w-4"
//             />
//             SL
//           </label>
//           <label className="flex items-center gap-2">
//             <input
//               type="radio"
//               name="orderType"
//               checked={orderType === "STOPLOSS_MARKET"}
//               onChange={() => setOrderType("STOPLOSS_MARKET")}
//               className="h-4 w-4"
//             />
//             SL-M
//           </label>
//         </div>

//         {/* Strategy Dropdown */}
// <div className="mb-5">
//   <label className="block text-sm font-medium text-gray-700 mb-2">
//     Select Strategy
//   </label>
//   <select
//     className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//     value={selectedStrategyId}
//     onChange={(e) => {
//       const strategyId = e.target.value;
//       setSelectedStrategyId(strategyId);

//       const selected = strategyList.find((s: any) => String(s.id) === strategyId);
//       if (selected) {
//         setGroupName(selected.strategyName);   // 🔥 yahan groupName update hoga
//       } else {
//         setGroupName("");
//       }
//     }}
//   >
//     <option value="">No Strategy</option>
//     {strategyList.map((s: any) => (
//       <option key={s.id} value={s.id}>
//         {s.strategyName}
//       </option>
//     ))}
//   </select>

//   {groupName && (
//     <p className="mt-1 text-xs text-gray-500">
//       Selected group: <span className="font-semibold">{groupName}</span>
//     </p>
//   )}
// </div>


      
//         {/* Margin Info */}
//         <div className="text-sm text-gray-600 mb-6">
//           Required Fund ₹{(0).toFixed(2)} 
//         </div>

//         {/* Action Buttons */}
//         <div className="flex justify-end gap-4">
//           <button
//             onClick={() => setScriptModalOpen(false)}
//             className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded text-sm font-medium h-10"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleScriptSave}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium h-10"
//           >
//             Buy
//           </button>
//         </div>
//       </div>
//     </div>
//   </div>
// )}





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
import { MdOutlineCancel } from "react-icons/md";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

// 🔹 Type + Exchange options (Angel share same codes)
type ExchangeOption = {
  code: string;
  fullForm: string;
};

const EXCHANGE_OPTIONS: ExchangeOption[] = [
  { code: "NSE", fullForm: "National Stock Exchange" },
  { code: "BSE", fullForm: "Bombay Stock Exchange" },
  { code: "NFO", fullForm: "NSE Futures & Options Segment" },
  { code: "BFO", fullForm: "BSE Futures & Options Segment" },
  { code: "CDS", fullForm: "Currency Derivatives Segment" },
  { code: "MCX", fullForm: "Multi Commodity Exchange" },
];

export default function InstrumentFormAdmin() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [duration, setDuration] = useState("DAY");
  const [orderType, setOrderType] = useState("MARKET");
  const [variety, setVariety] = useState("NORMAL");

  const [activeTab, setActiveTab] = useState<"Quick" | "Regular" | "Iceberg">(
    "Quick"
  );

  // AG Grid Quick Filter ke liye state
  const [quickFilterText, setQuickFilterText] = useState("");

  const gridApiRef = useRef<GridApi | null>(null);

  const [groupName, setGroupName] = useState("");
  const [strategyList, setStrategyList] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");

  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);

  const [scriptProductType, setScriptProductType] = useState<
    "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
  >("INTRADAY");

  // 🔹 Selected Exchange for filter on top
  const [selectedExchange, setSelectedExchange] = useState<string>("");

  // ---------- Common expiry normalizer ----------
  const buildExpiryMeta = (rawExpiry: any) => {
    if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

    const s = String(rawExpiry).trim();
    if (!s) return { expiryDateObj: null, expiryLabel: "" };

    let d: Date | null = null;

    // 1) YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      d = new Date(s + "T00:00:00");
    }
    // 2) DD-MMM-YYYY / DD-MMM-YY
    else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
      const [ddStr, monStrRaw, yyStr] = s.split("-");
      const dd = Number(ddStr);
      const monStr = monStrRaw.toUpperCase();
      const monthMap: Record<string, number> = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MAY: 4,
        JUN: 5,
        JUL: 6,
        AUG: 7,
        SEP: 8,
        OCT: 9,
        NOV: 10,
        DEC: 11,
      };
      const monthIndex = monthMap[monStr];
      if (monthIndex !== undefined) {
        let yearNum = Number(yyStr);
        if (yyStr.length === 2) {
          yearNum = 2000 + yearNum;
        }
        d = new Date(yearNum, monthIndex, dd);
      }
    } else {
      const t = new Date(s);
      if (!isNaN(t.getTime())) d = t;
    }

    if (!d) return { expiryDateObj: null, expiryLabel: "" };

    const day = d.getDate().toString().padStart(2, "0");
    const monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

    return { expiryDateObj: d, expiryLabel: label };
  };





  // ---------- AngelOne Normalizer ----------
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
      expiryDateObj,
      expiryLabel,
    };
  };

  // ---------- Fetch instruments (ONLY AngelOne) ----------
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${apiUrl}/agnelone/instrument`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (res?.data?.status === true) {
        const rawData = res?.data?.data || [];
        const normalized = rawData.map((row: any) => mapAngelToCommon(row));
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
    setQuickFilterText("");
  }, []);



  // ---------- AG Grid Column Definitions ----------
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Action",
        cellRenderer: (params: any) => (
          <button
            onClick={() => {
              setSelectedScriptRow(params.data);
              setScriptModalOpen(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Buy
          </button>
        ),
        minWidth: 100,
        sortable: false,
        filter: false,
      },
      {
        headerName: "Token",
        field: "token",
        minWidth: 250,
        filter: "agTextColumnFilter",
        cellStyle: {fontSize: '15px'}
      },
  
       { headerName: "Symbol",
         field: "symbol",
          minWidth: 250,
           filter: "agTextColumnFilter",
            cellStyle: {fontSize: '20px'}
        },
         {
           headerName: "Kite Symbol",
           field: "kite_tradingsymbol",
            minWidth: 120,
             filter: "agTextColumnFilter",
               cellStyle: {fontSize: '20px'}
          },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
      cellClass: "text-base",
      headerClass: "text-base",
    }),
    []
  );

  const onGridReady = (e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    e.api.sizeColumnsToFit();
  };

  // ---------- Quick Filter Handler ----------
  const onFilterTextBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilterText(e.target.value);
  };

  // 🔹 Main grid data, filtered by exchange
  const filteredData = useMemo(() => {
    let rows = data;

    if (selectedExchange) {
      const selectedCode = selectedExchange.split(" - ")[0].toUpperCase();
      rows = rows.filter(
        (row) =>
          String(row.exch_seg || "")
            .toUpperCase()
            .trim() === selectedCode
      );
    }

    return rows;
  }, [data, selectedExchange]);



  // ---------- Save / Place Order ----------
  const handleScriptSave = async () => {
    if (!selectedScriptRow) {
      toast.error("No scrip selected!");
      return;
    }

    console.log(selectedScriptRow,'selectedScriptRow');


    

    const payload = {
      token: selectedScriptRow.token,
      symbol: selectedScriptRow.symbol,
      name: selectedScriptRow.name,
      instrumenttype: selectedScriptRow.instrumenttype,
      exch_seg: selectedScriptRow.exch_seg,
      lotsize: selectedScriptRow.lotsize,
      quantity: Number(selectedScriptRow.lotsize),
      transactiontype: "BUY",
      duration,
      orderType,
      variety,
      productType: scriptProductType,
      strategyId: selectedStrategyId,
      groupName,
      angelOneToken: selectedScriptRow.angelToken,
      angelOneSymbol: selectedScriptRow.angelSymbol,
      kiteToken: selectedScriptRow.token,
      kiteSymbol: selectedScriptRow.kite_tradingsymbol,

    };

    console.log("payload", payload);

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

      if (res?.data?.status) {
        toast.success("Order placed successfully!");
        setScriptModalOpen(false);
      } else {
        toast.error(res?.data?.message || "Failed to place order.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  // ---------- JSX ----------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        {/* AG Grid Quick Filter */}
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={quickFilterText}
            onChange={onFilterTextBoxChange}
            placeholder='AG Grid Quick Filter ( "NIFTY02DEC2525800PE" or "NIFTY")'
            className="border p-2 w-full rounded"
          />
         
        </div>

        <div className="flex items-center gap-4">
          {/* 🔹 Exchange Filter Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Exchange Filter
            </label>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="">All Exchanges</option>
              {EXCHANGE_OPTIONS.map((ex) => {
                const value = `${ex.code} - ${ex.fullForm}`;
                return (
                  <option key={ex.code} value={value}>
                    {ex.code} - {ex.fullForm}
                  </option>
                );
              })}
            </select>
          </div>

          
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

      {filteredData.length > 0 && (
        <div
          className="ag-theme-quartz compact-grid"
          style={{ height: 540, width: "100%" }}
        >
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
            quickFilterText={quickFilterText}
          />
        </div>
      )}

      {scriptModalOpen && selectedScriptRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-3 border border-gray-200">
            {/* Header */}
            <div className="bg-blue-600 text-white rounded-t-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedScriptRow.symbol}
                </h3>
              </div>
              <button
                onClick={() => setScriptModalOpen(false)}
                className="text-white text-2xl leading-none font-bold pb-1"
              >
                <MdOutlineCancel  className="w-8 h-8 hover:text-gray-600"/>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  className={`flex-1 py-3 text-center font-medium ${
                    activeTab === "Quick"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("Quick")}
                >
                  Quick
                </button>
                <button
                  className={`flex-1 py-3 text-center font-medium ${
                    activeTab === "Regular"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("Regular")}
                >
                  Regular
                </button>
                <button
                  className={`flex-1 py-3 text-center font-medium ${
                    activeTab === "Iceberg"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("Iceberg")}
                >
                  Iceberg
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Product Type */}
              <div className="flex gap-6 mb-5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="productType"
                    checked={scriptProductType === "INTRADAY"}
                    onChange={() => setScriptProductType("INTRADAY")}
                    className="h-4 w-4"
                  />
                  Intraday <span className="text-xs text-gray-500">MIS</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="productType"
                    checked={scriptProductType === "DELIVERY"}
                    onChange={() => setScriptProductType("DELIVERY")}
                    className="h-4 w-4"
                  />
                  Longterm <span className="text-xs text-gray-500">CNC</span>
                </label>
              </div>

              {/* Qty / Prices */}
              <div className="grid grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qty.
                  </label>
                  <input
                    type="number"
                    value={selectedScriptRow.lotsize || 1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSelectedScriptRow((prev: any) => ({
                        ...prev,
                        lotsize: val,
                      }));
                    }}
                    className="border rounded px-3 py-2 w-full text-center h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Market price
                  </label>
                  <input
                    type="number"
                    value={selectedScriptRow.price || 0}
                    readOnly
                    className="border rounded px-3 py-2 w-full text-center bg-gray-100 h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trigger price
                  </label>
                  <input
                    type="number"
                    value={0}
                    readOnly
                    className="border rounded px-3 py-2 w-full text-center bg-gray-100 h-10"
                  />
                </div>
              </div>

              {/* Order Type */}
              <div className="flex gap-5 mb-5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === "MARKET"}
                    onChange={() => setOrderType("MARKET")}
                    className="h-4 w-4"
                  />
                  Market
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === "LIMIT"}
                    onChange={() => setOrderType("LIMIT")}
                    className="h-4 w-4"
                  />
                  Limit
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === "STOPLOSS_LIMIT"}
                    onChange={() => setOrderType("STOPLOSS_LIMIT")}
                    className="h-4 w-4"
                  />
                  SL
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="orderType"
                    checked={orderType === "STOPLOSS_MARKET"}
                    onChange={() => setOrderType("STOPLOSS_MARKET")}
                    className="h-4 w-4"
                  />
                  SL-M
                </label>
              </div>

              {/* Strategy Dropdown */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Strategy
                </label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStrategyId}
                  onChange={(e) => {
                    const strategyId = e.target.value;
                    setSelectedStrategyId(strategyId);

                    const selected = strategyList.find(
                      (s: any) => String(s.id) === strategyId
                    );
                    if (selected) {
                      setGroupName(selected.strategyName);
                    } else {
                      setGroupName("");
                    }
                  }}
                >
                  <option value="">No Strategy</option>
                  {strategyList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.strategyName}
                    </option>
                  ))}
                </select>

                {groupName && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selected group:{" "}
                    <span className="font-semibold">{groupName}</span>
                  </p>
                )}
              </div>

              {/* Margin Info */}
              <div className="text-sm text-gray-600 mb-6">
                Required Fund ₹{(0).toFixed(2)}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setScriptModalOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded text-sm font-medium h-10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScriptSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white! px-5 py-2 rounded text-sm font-medium h-10"
                >
                  Buy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


