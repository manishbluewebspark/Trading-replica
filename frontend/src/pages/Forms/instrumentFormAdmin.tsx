
// import { useState, useEffect, useMemo, useRef } from "react";
// import axios from "axios";
// import * as XLSX from 'xlsx';
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

//   // const [fundData, setFundData] = useState<number>(0);

//   const [data, setData] = useState<any[]>([]);
//     const [dataexcel, setDataExcel] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//    const [getPrice, setOnlyPrice] = useState("");
//       const [getslotSIze, setSlotSIze] = useState("");

//   const [selectedItem, setSelectedItem] = useState<any | null>(null);
//   const [showForm, setShowForm] = useState(false);

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedTerm, setDebouncedTerm] = useState("");


//     const [getTrasectionType, setGetTrasectionType] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);



// //     function formatOptionSymbol(symbol:any) {

// //     symbol = String(symbol).toUpperCase().trim();

// //     // Regex patterns
// //     const optionPattern = /^(NIFTY|BANKNIFTY)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
// //     const futurePattern = /^(NIFTY|BANKNIFTY)(\d{2})([A-Z]{3})(\d{2})FUT$/;

// //     // 👉 Option format: NIFTY30DEC2530000PE
// //     const opt = symbol.match(optionPattern);
// //     if (opt) {
// //       const [, underlying, day, month, year, strike, optionType] = opt;
// //       const expiry = `${day}${month}${year}`;
// //       return `${underlying} ${expiry} ${Number(strike)} ${optionType}`;
// //     }

// //     // 👉 Future format: NIFTY25NOV25FUT
// //     const fut = symbol.match(futurePattern);
// //     if (fut) {
// //       const [, underlying, day, month, year] = fut;
// //       const expiry = `${day}${month}${year}`;
// //       return `${underlying} ${expiry} FUT`;
// //     }

// //   // 👉 Fallback (like NIFTY, Nifty 50, etc.)
// //   return symbol;
// // }



//   // debounce search
//   useEffect(() => {




//     const t = setTimeout(() => setDebouncedTerm(searchTerm.trim().toLowerCase()), 300);
//     return () => clearTimeout(t);
//   }, [searchTerm]);

//   // filter client-side (you can rely on quickFilter only if you prefer)
//   const filteredData = useMemo(() => {
//     if (!debouncedTerm || debouncedTerm.length < 3) return data;
//     const q = debouncedTerm;
//     return data.filter((item) => {
//       const symbol = String(item.symbol ?? "").toLowerCase();
//       if (!symbol) return false;
//       if (symbol.includes(q)) return true;
//       return symbol.split(/\s+/g).some((w) => w.startsWith(q) || w.includes(q));
//     });
//   }, [data, debouncedTerm]);

//   // fetch data
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(`${apiUrl}/order/mongodb/instrument`,  {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 "AngelOneToken": localStorage.getItem("angel_token") || "",
//             },
//           });

//            console.log(res?.data,'heello');

//        if(res?.data?.status==true) {

//       let allData = res?.data?.data || [];

//     // allData = allData.filter((item: any) => {
//     //   const name = String(item.name || item.symbol || "").toUpperCase();
//     //   // return name.includes("NIFTY") || name.includes("BANK");

//     //    return name.includes("NIFTY")
//     // });

//       // allData = allData
//       //   // .filter((item:any) => {
//       //   //   const name = String( item.symbol || "").toUpperCase();
//       //   //   return name.startsWith("NIFTY") || name.startsWith("BANKNIFTY");
//       //   // })
//       //   .map((item:any) => {

//       //     const symbol = String(item.symbol || "").toUpperCase();

//       //     const formattedName = formatOptionSymbol(symbol);

//       //     let optionSymbol = "-";

//       //      if (symbol.endsWith("CE")) optionSymbol = "CE";
//       //     else if (symbol.endsWith("PE")) optionSymbol = "PE";
//       //     else if (symbol.endsWith("FUT")) optionSymbol = "FUT";
//       //     else if (symbol.endsWith("-EQ")) optionSymbol = "EQ";


//       //     return { ...item, formattedName,optionSymbol };
//       //   });


       
          

//             setDataExcel(allData)
//             setData(allData);

//        }else{

//          toast.error(res?.data?.message || "Something went wrong");

//        }

 
//     } catch (err: any) {

//        toast.error(err?.message || "Something went wrong");
      
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Buy
//   const handleBuyClick = async (item: any) => {

//     const payload = {
//       exchange: item.exch_seg,
//       tradingsymbol: item.symbol,
//       symboltoken: item.token,
//     };    
//      try{
//           const res = await axios.post(`${apiUrl}/order/get/ltp`, payload, {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 "AngelOneToken": localStorage.getItem("angel_token") || "",
//                   "userid":localStorage.getItem("userID")
//             },
//           });

//            if(res?.data?.status==true) {

//              item.price = res?.data?.data.data.ltp
//              item.transactiontype = 'BUY'
//              item.totalPrice = item.price*item.lotsize
//              setGetTrasectionType("Buy")
//              setOnlyPrice(res?.data?.data.data.ltp)
//              setSlotSIze(item.lotsize)
//              setSelectedItem({ ...item });
//              setShowForm(true);

//            }else{

//              toast.error(res?.data?.message || "Something went wrong");
//            }
//      }catch(err:any) {

//        toast.error(err.message || "Something went wrong");
//      }
    
//   };

//   // Sell (placeholder)
//   const handleSellClick = async(item: any) => {

//       const payload = {
//       exchange: item.exch_seg,
//       tradingsymbol: item.symbol,
//       symboltoken: item.token,
//     };
//      try{
//           const res = await axios.post(`${apiUrl}/order/get/ltp`, payload, {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 "AngelOneToken": localStorage.getItem("angel_token") || "",
//                 "userid":localStorage.getItem("userID")
//             },
//           });

//            if(res?.data?.status==true) {

//              item.price = res?.data?.data.data.ltp
//              item.transactiontype = 'SELL'
//             item.totalPrice = item.price*item.lotsize
//              setGetTrasectionType("Sell")
//              setSelectedItem({ ...item });
//              setOnlyPrice(res?.data?.data.data.ltp)
//              setSlotSIze(item.lotsize)
//              setShowForm(true);

//            }else{

//             toast.error(res?.data?.message || "Something went wrong");
//            }
//      }catch(err:any) {

//       toast.error(err.message || "Something went wrong");
//      }
//   };

//   // AG Grid columns
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 60,  },
//        { headerName: "Symbol Num", field: "SyNum", minWidth: 20,  },
//          { headerName: "Type", field: "syType", minWidth: 20,  },
//           { headerName: "nameStrickType", field: "nameStrickType", minWidth: 20,  },
//       { headerName: "Symbol", field: "symbol", minWidth: 250, filter: "agTextColumnFilter" },
//   // { headerName: "Formate", field: "formattedName", minWidth: 100, },
//       { headerName: "Name", field: "name", minWidth: 80, },
//       // { headerName: "Exchange", field: "exch_seg", width: 140 },
//        { headerName: "Lot-Size", field: "lotsize", width: 110 },
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
//             Buy
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
//             Sell
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

//   // sync quick filter with debouncedTerm
//   useEffect(() => {
//     if (!gridApiRef.current) return;
//     const quick = debouncedTerm && debouncedTerm.length >= 3 ? debouncedTerm : "";
//     gridApiRef.current.setGridOption("quickFilterText", quick);
//   }, [debouncedTerm]);

//   // submit order
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!selectedItem) return;

//     const formData = {
//       token: selectedItem.token,
//       symbol: selectedItem.symbol,
//       name: selectedItem.name,
//       exch_seg: selectedItem.exch_seg,
//       price: selectedItem.price,
//       quantity: selectedItem.lotsize,
//       transactiontype:selectedItem.transactiontype,
//       duration,
//       orderType,
//       variety,
//       productType:selectedItem.productType,
//       totalPrice:selectedItem.totalPrice,
//       actualQuantity: Number(selectedItem.lotsize) / Number(getslotSIze)
      
//     };

//       try{
        
//       const res = await axios.post(
//       `${apiUrl}/order/place/order`,
//       formData,
//       {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               "AngelOneToken": localStorage.getItem("angel_token") || "",
//               "userid":localStorage.getItem("userID")
//             },
//           }
//     );



//     console.log(res);
    
    

//     if(res?.data?.status==true) {

//       alert(res?.data?.message)
//       setShowForm(false);
//       setVariety("");
//       setDuration("");
//       setOrderType("");
   
   
//     }else{

//       toast.error(res?.data?.message || "Something went wrong");
         
//     }
  
//     }catch(err:any) {

//        toast.error(err.message || "Something went wrong");
//     }

//       //  }else{
//       // toast.error("Fund is not available");
//       //  }
//   };
  

//   // Function to handle Excel download
//   const handleExcelDownload = () => {

//     // Convert data to worksheet
//     const worksheet = XLSX.utils.json_to_sheet(dataexcel);
//     // Create a workbook
//     const workbook = XLSX.utils.book_new();
//     // Append the worksheet to the workbook
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
//     // Generate an Excel file
//     XLSX.writeFile(workbook, "instrument.xlsx");
//   };


//    const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {

//     const value = e.currentTarget.value;

//      if(value.length>=3) {
        
//         try {

//           const res = await axios.get(`${apiUrl}/order/mongodb/instrument/search/${value}`,  {
//                 headers: {
//                   Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                     "AngelOneToken": localStorage.getItem("angel_token") || "",
//                 },
//               });


//             if(res?.data?.status==true) {

//             let allData = res?.data?.data || [];

//             setDataExcel(allData)
//             console.log(allData);
            

//             setData(allData);

//        }else{

//          toast.error(res?.data?.message || "Something went wrong");

//        }

 
//     } catch (err: any) {

//        toast.error(err?.message || "Something went wrong");
      
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }

//      }else if(value.length>=0){
//        await fetchData();
         
//      }else{
//        toast.error("Press More Then 2 Keys"); 
//      }

     
   
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       {/* Search box */}
//       {/* <div className="flex justify-end mb-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Search symbol (min 3 chars)"
//             className="border p-2 w-full rounded"
//           />
//         </div>

        

//         <div>
//           excel download
//         </div>

       
//       </div> */}


//       <div className="flex justify-end mb-4 gap-4">
//   <div className="w-full sm:w-80">
//     <input
//       type="text"
//       value={searchTerm}
//       onChange={(e) => setSearchTerm(e.target.value)}
//        onKeyUp={handleKeyUp}         
//       placeholder="Search symbol (min 3 chars)"
//       className="border p-2 w-full rounded"
//     />
//   </div>
//   <div>
//     <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"    onClick={handleExcelDownload}>
//       Excel Download
//     </button>
//   </div>
// </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && data.length === 0 && (
//         <p>No data found for "Nifty Bank"</p>
//       )}

//       {/* AG Grid table */}
//       {data.length > 0 && (
//         <div className="ag-theme-quartz" style={{ height: 540, width: "100%" }}>
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             onGridReady={onGridReady}
//             suppressFieldDotNotation
//           />
//         </div>
//       )}

//       {/* Modal Form */}
//       {showForm && selectedItem && (
//         <div className="fixed inset-0 bg-backdrop-md bg-opacity-50 flex items-center justify-center z-9999">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
//             <h3 className="text-lg font-semibold mb-4 text-center">
//               {getTrasectionType} Order — {selectedItem.name}
//             </h3>

//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                 <label className="block text-sm font-medium">Token</label>
//                 <input
//                   type="text"
//                   value={selectedItem.token}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium">Exchange</label>
//                 <input
//                   type="text"
//                   value={selectedItem.exch_seg}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium">Symbol</label>
//                 <input
//                   type="text"
//                   value={selectedItem.symbol}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//                <div>
//                 <label className="block text-sm font-medium">Require Fund</label>
//                 <input
//                   type="text"
//                   value={Number(selectedItem.totalPrice).toFixed(2)}
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

             

//               <div>
//                 <label className="block text-sm font-medium">Quantity</label>
//                 <input
//                   type="text"
//                   value={selectedItem.lotsize}
//                   onChange={(e) =>
//                   setSelectedItem({ 
//                    ...selectedItem, // keep existing fields (token, name, etc.)
//                    lotsize: e.target.value,
//                    totalPrice : (Number(e.target.value)) * Number(getPrice),
//                    actualQuantity:(Number(e.target.value)) / Number(getslotSIze)
//                    })
//                 }
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//                <div>
//                 <label className="block text-sm font-medium">Price</label>
//                 <input
//                   type="text"
//                   value={Number(selectedItem.price).toFixed(2)}
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium">Order Type</label>
//                 <select
//                   value={orderType}
//                   onChange={(e) => setOrderType(e.target.value)}
//                   required
//                   className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Select Order Type</option>
//                   <option value="MARKET">MARKET</option>
//                   <option value="LIMIT">LIMIT</option>
//                   <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                   <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium">Duration</label>
//                 <select
//                   value={duration}
//                   onChange={(e) => setDuration(e.target.value)}
//                   required
//                   className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Select Duration</option>
//                   <option value="DAY">DAY</option>
//                   <option value="IOC">IOC</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium">Variety</label>
//                 <select
//                   value={variety}
//                   onChange={(e) => setVariety(e.target.value)}
//                   required
//                   className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Select Variety</option>
//                   <option value="NORMAL">NORMAL</option>
//                   <option value="STOPLOSS">STOPLOSS</option>
//                   <option value="ROBO">ROBO</option>
//                 </select>
//               </div>

//                {/* Radio Buttons Section */}
//   <div className="mt-3">
//     <label className="block text-sm font-medium mb-1">Product Type</label>
//     <div className="flex items-center gap-4">
//       <label className="flex items-center gap-2">
//         <input
//           type="radio"
//           name="productType"
//           value="INTRADAY"
//           checked={selectedItem.productType === "INTRADAY"}
//           onChange={(e) =>
//             setSelectedItem({ ...selectedItem, productType: e.target.value })
//           }
//         />
//         <span>IntraDay MIS</span>
//       </label>

//       <label className="flex items-center gap-2">
//         <input
//           type="radio"
//           name="productType"
//           value="DELIVERY"
//           checked={selectedItem.productType === "DELIVERY"}
//           onChange={(e) =>
//             setSelectedItem({ ...selectedItem, productType: e.target.value })
//           }
//         />
//         <span>Longterm CNC</span>
//       </label>
//     </div>
//   </div>

  


              
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




import { useState, useEffect, useRef,useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

// --- AG Grid v31+ (modular) ------------------------------
import { ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]); // ✅ REQUIRED

import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
// ----------------------------------------------------------

export default function InstrumentFormAdmin() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [data, setData] = useState<any[]>([]);
  const [dataexcel, setDataExcel] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [getPrice, setOnlyPrice] = useState("");
  const [getslotSIze, setSlotSIze] = useState("");

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [duration, setDuration] = useState("DAY");
  const [orderType, setOrderType] = useState("MARKET");
  const [variety, setVariety] = useState("NORMAL");

  const [searchTerm, setSearchTerm] = useState("");

  const [getTrasectionType, setGetTrasectionType] = useState("");

  const gridApiRef = useRef<GridApi | null>(null);

    const [groupName, setGroupName] = useState("");


    const [strategyList, setStrategyList] = useState([]); // all strategies from backend
const [selectedStrategyId, setSelectedStrategyId] = useState(""); // dropdown selected id


  // fetch data (full list)
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${apiUrl}/order/mongodb/instrument`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      console.log(res?.data, "heello");

      if (res?.data?.status === true) {
        const allData = res?.data?.data || [];
        setDataExcel(allData);
        setData(allData);
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


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
  } catch (err:any) {
    toast.error(err.message);
  }
};

  // Buy
  const handleBuyClick = async (item: any) => {

    const payload = {
      exchange: item.exch_seg,
      tradingsymbol: item.symbol,
      symboltoken: item.token,
    };

    try {



      await fetchStrategies()

      const res = await axios.post(`${apiUrl}/order/get/ltp`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      });

      if (res?.data?.status === true) {
        item.price = res?.data?.data.data.ltp;
        item.transactiontype = "BUY";
        item.totalPrice = item.price * item.lotsize;

        setGetTrasectionType("Buy");
        setOnlyPrice(res?.data?.data.data.ltp);
        setSlotSIze(item.lotsize);
        setSelectedItem({ ...item });
        setShowForm(true);
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {

      toast.error(err.message || "Something went wrong");
    }
  };

  // Sell
  const handleSellClick = async (item: any) => {
    const payload = {
      exchange: item.exch_seg,
      tradingsymbol: item.symbol,
      symboltoken: item.token,
    };

    try {


      await fetchStrategies() 

      const res = await axios.post(`${apiUrl}/order/get/ltp`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      });

      if (res?.data?.status === true) {
        item.price = res?.data?.data.data.ltp;
        item.transactiontype = "SELL";
        item.totalPrice = item.price * item.lotsize;

        setGetTrasectionType("Sell");
        setOnlyPrice(res?.data?.data.data.ltp);
        setSlotSIze(item.lotsize);
        setSelectedItem({ ...item });
        setShowForm(true);
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };

  // AG Grid columns
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: "Token", field: "token", minWidth: 60 },
      // { headerName: "Symbol Num", field: "SyNum", minWidth: 20 },
      { headerName: "Type", field: "syType", minWidth: 20 },
      // { headerName: "nameStrickType", field: "nameStrickType", minWidth: 20 },
      {
        headerName: "Symbol",
        field: "symbol",
        minWidth: 250,
        filter: "agTextColumnFilter",
      },
      { headerName: "Name", field: "name", minWidth: 80 },
      { headerName: "Lot-Size", field: "lotsize", width: 110 },
      {
        headerName: "Buy",
        field: "buy",
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => (
          <button
            onClick={() => handleBuyClick(params.data)}
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
          >
            Entry Price
          </button>
        ),
      },
      {
        headerName: "Sell",
        field: "sell",
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => (
          <button
            onClick={() => handleSellClick(params.data)}
            className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
          >
            Exit Price
          </button>
        ),
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
    }),
    []
  );

  const onGridReady = (e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    e.api.sizeColumnsToFit();
  };

  // submit order
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!selectedItem) return;

  //   const formData = {
  //     token: selectedItem.token,
  //     symbol: selectedItem.symbol,
  //     name: selectedItem.name,
  //     exch_seg: selectedItem.exch_seg,
  //     price: selectedItem.price,
  //     quantity: selectedItem.lotsize,
  //     transactiontype: selectedItem.transactiontype,
  //     duration,
  //     orderType,
  //     variety,
  //     productType: selectedItem.productType,
  //     totalPrice: selectedItem.totalPrice,
  //     actualQuantity:
  //       Number(selectedItem.lotsize) / Number(getslotSIze || 1), // avoid NaN
  //       groupName:groupName
  //   };

  //   try {
  //     const res = await axios.post(`${apiUrl}/order/place/order`, formData, {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  //         // AngelOneToken: localStorage.getItem("angel_token") || "",
  //         // userid: localStorage.getItem("userID"),
  //       },
  //     });

  //     console.log(res);

  //     if (res?.data?.status === true) {
  //       alert(res?.data?.message);
  //       setShowForm(false);
  //       setVariety("NORMAL");
  //       setDuration("DAY");
  //       setOrderType("MARKET");
  //     } else {
  //       toast.error(res?.data?.message || "Something went wrong");
  //     }
  //   } catch (err: any) {
  //     toast.error(err.message || "Something went wrong");
  //   }
  // };


   // submit order
  const handleSubmitMultiple = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) return;

    const formData = {
      token: selectedItem.token,
      symbol: selectedItem.symbol,
      name: selectedItem.name,
      exch_seg: selectedItem.exch_seg,
      price: selectedItem.price,
      quantity: selectedItem.lotsize,
      transactiontype: selectedItem.transactiontype,
      duration,
      orderType,
      variety,
      productType: selectedItem.productType,
      totalPrice: selectedItem.totalPrice,
      actualQuantity:
        Number(selectedItem.lotsize) / Number(getslotSIze || 1), // avoid NaN
        groupName:groupName
    };

    try {
      const res = await axios.post(`${apiUrl}/admin/multiple/place/order`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      console.log(res);

      if (res?.data?.status === true) {
        alert(res?.data?.message);
        setShowForm(false);
        setVariety("NORMAL");
        setDuration("DAY");
        setOrderType("MARKET");
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };


  // Excel download
  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataexcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "instrument.xlsx");
  };

  // 🔍 Backend search on key up
  const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;

    // When 3+ chars → hit backend search
    if (value.length >= 3) {
      setLoading(true);
      setError("");

      try {
        const res = await axios.get(
          `${apiUrl}/order/mongodb/instrument/search/${value}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              AngelOneToken: localStorage.getItem("angel_token") || "",
            },
          }
        );

        if (res?.data?.status === true) {
          const allData = res?.data?.data || [];
          setDataExcel(allData);
          console.log(allData);
          setData(allData);
        } else {
          toast.error(res?.data?.message || "Something went wrong");
        }
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    // When box cleared → reload full data
    else if (value.length === 0) {
      fetchData();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

      <div className="flex justify-end mb-4 gap-4">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={handleKeyUp}
            placeholder="Search symbol (min 3 chars)"
            className="border p-2 w-full rounded"
          />
        </div>
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleExcelDownload}
          >
            Excel Download
          </button>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p>No data found for "Nifty Bank"</p>
      )}

      {/* AG Grid table */}
{data.length > 0 && (
  <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
    <AgGridReact
      rowData={data}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      animateRows
      rowSelection="single"
      pagination
      paginationPageSize={10000}
      rowHeight={34}  // 🔥 Compact professional height
      suppressFieldDotNotation
      onGridReady={onGridReady}
    />
  </div>
)}
      {/* Modal Form */}
      {showForm && selectedItem && (
        <div className="fixed inset-0 bg-backdrop-md bg-opacity-50 flex items-center justify-center z-9999">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4 text-center">
              {getTrasectionType} Order — {selectedItem.name}
            </h3>

            {/* <form onSubmit={handleSubmit} className="space-y-4"> */}
                  <form onSubmit={handleSubmitMultiple} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Token</label>
                  <input
                    type="text"
                    value={selectedItem.token}
                    readOnly
                    className="border p-2 w-full rounded bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Exchange</label>
                  <input
                    type="text"
                    value={selectedItem.exch_seg}
                    readOnly
                    className="border p-2 w-full rounded bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Symbol</label>
                  <input
                    type="text"
                    value={selectedItem.symbol}
                    readOnly
                    className="border p-2 w-full rounded bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Require Fund
                  </label>
                  <input
                    type="text"
                    value={Number(selectedItem.totalPrice).toFixed(2)}
                    className="border p-2 w-full rounded bg-gray-100"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Quantity</label>
                  <input
                    type="text"
                    value={selectedItem.lotsize}
                    onChange={(e) =>
                      setSelectedItem({
                        ...selectedItem,
                        lotsize: e.target.value,
                        totalPrice:
                          Number(e.target.value) * Number(getPrice || 0),
                        actualQuantity:
                          Number(e.target.value) / Number(getslotSIze || 1),
                      })
                    }
                    className="border p-2 w-full rounded bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Price</label>
                  <input
                    type="text"
                    value={Number(selectedItem.price).toFixed(2)}
                    className="border p-2 w-full rounded bg-gray-100"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Order Type
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    required
                    className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Order Type</option>
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                    <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
                    <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Duration</option>
                    <option value="DAY">DAY</option>
                    <option value="IOC">IOC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Variety</label>
                  <select
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    required
                    className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Variety</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="STOPLOSS">STOPLOSS</option>
                    <option value="ROBO">ROBO</option>
                  </select>
                </div>

                {/* Radio Buttons Section */}
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    Product Type
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="productType"
                        value="INTRADAY"
                        checked={selectedItem.productType === "INTRADAY"}
                        onChange={(e) =>
                          setSelectedItem({
                            ...selectedItem,
                            productType: e.target.value,
                          })
                        }
                      />
                      <span>IntraDay MIS</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="productType"
                        value="DELIVERY"
                        checked={selectedItem.productType === "DELIVERY"}
                        onChange={(e) =>
                          setSelectedItem({
                            ...selectedItem,
                            productType: e.target.value,
                          })
                        }
                      />
                      <span>Longterm CNC</span>
                    </label>

                     {/* 🔽 Strategy Dropdown */}
     

        
                  </div>
                </div>
                   <div>
          <label className="block text-sm mb-1">Select Strategy *</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedStrategyId}
            onChange={(e) => {
              const strategyId = e.target.value;
              setSelectedStrategyId(strategyId);

              // Auto-fill fields
              const selected:any = strategyList.find((s: any) => s.id == strategyId);
              if (selected) {
                setGroupName(selected.strategyName);
               
              }
            }}
          >
          
            {strategyList.map((s: any) => (
              <option value={s.id} key={s.id}>
                {/* {s.strategyName} — {s.strategyDis.slice(0, 20)}... */}
                   {s.strategyName}
              </option>
            ))}
          </select>
        </div>
              </div>

              <div className="flex justify-end mt-6 gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}






