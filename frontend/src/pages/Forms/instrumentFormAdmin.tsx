




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
  const [ltp, setLtp] = useState(0);
  const [orderType, setOrderType] = useState("MARKET");
  const [activeTab, setActiveTab] = useState<"Quick" | "Regular" | "Iceberg">("Quick");

  // AG Grid Quick Filter ke liye state
  const [quickFilterText, setQuickFilterText] = useState("");
  const gridApiRef = useRef<GridApi | null>(null);
  const [groupName, setGroupName] = useState("");
  const [strategyList, setStrategyList] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
  const [targetPrice, setTargetPrice] = useState(0);
  const [stoploss, setStopLoss] = useState(0);
   const [trasectionType, setTrasectionType] = useState("BUY");
  const [squareoff, setSquareOff] = useState(0);
  const [scriptProductType, setScriptProductType] = useState<
    "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
  >("INTRADAY");


  const [varietyType, setvarietyTypeType] = useState< "" | "NORMAL" | "STOPLOSS" | "ROBO" >("NORMAL");

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



  const handleSell = async (row: any) => {

    const LtlPayload = {
      exchange: row.exch_seg,
      tradingsymbol: row.symbol,
      symboltoken: row.token,
    };

    const res = await axios.post(
      `${apiUrl}/agnelone/instrument/ltp`,
      LtlPayload,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      }
    );

    console.log(res.data.data);


    if (res.data.status === true) {

      console.log(res.data.data);

      setLtp(res.data.data.data.ltp || 0)

    } else {

      //  toast.error("Something went wrong.");
      setLtp(0)
    }
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
      const res = await axios.get(`${apiUrl}/agnelone/instrumentnew`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      console.log(res?.data?.data);
      

      if (res?.data?.status === true) {
        const rawData = res?.data?.data || [];

        console.log('==============rawData=======',rawData);
        
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
    setDuration("")
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
              handleSell(params.data); // example
            }}
            className="
    inline-flex items-center gap-1.5
    px-4 py-1.5
    text-xs font-semibold
    rounded-md
    text-white!
    shadow-sm
    bg-gradient-to-r from-green-500 to-green-700
    hover:from-green-600 hover:to-green-800
    transition-all duration-200
  "
            title="Click to Buy"
          >
            <span className="text-sm leading-none">⬆</span>
            BUY
          </button>

        ),
        minWidth: 100,
        sortable: false,
        filter: false,
      },
     
      {
        headerName: " Angelone Symbol",
        field: "symbol",
         minWidth: 300,
        filter: "agTextColumnFilter",
        cellStyle: { fontSize: '18px' }
      },
      {
        headerName: "Kite Symbol",
        field: "kiteSymbol",
         minWidth: 300,
        filter: "agTextColumnFilter",
        cellStyle: { fontSize: '20px' }
      },
      {
        headerName: "Finavasia Symbol",
        field: "finvasiaSymbol",
        minWidth: 300,
        filter: "agTextColumnFilter",
        cellStyle: { fontSize: '20px' }
      },
       {
        headerName: "upStox Symbol",
        field: "upstoxSymbol",
        minWidth: 300,
        filter: "agTextColumnFilter",
        cellStyle: { fontSize: '20px' }
      },
       {
        headerName: "Fyers Symbol",
        field: "fyersSymbol",
        minWidth: 300,
        filter: "agTextColumnFilter",
        cellStyle: { fontSize: '20px' }
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

    console.log(selectedScriptRow,'=================selectedScriptRow===============');
    

    if (!selectedScriptRow) {
      toast.error("No scrip selected!");
      return;
    }


     if (!groupName) {
      toast.error("Please Select Strategy !");
      return;
    }


    console.log('==============groupName===============',groupName);
    
    

    const payload = {
      token: selectedScriptRow.token,
      symbol: selectedScriptRow.symbol,
      name: selectedScriptRow.name,
      instrumenttype: selectedScriptRow.instrumenttype,
      exch_seg: selectedScriptRow.exch_seg,
      lotsize: selectedScriptRow.lotsize,
      quantity: Number(selectedScriptRow.lotsize),
      // transactiontype: "BUY",

      transactiontype: trasectionType,
      duration,
      orderType,
      variety:varietyType,
      price:ltp,
      triggerprice:targetPrice,
      stoploss:stoploss,
      squareoff:squareoff,
      productType: scriptProductType,
      strategyId: selectedStrategyId,
      groupName,
      angelOneToken: selectedScriptRow.angelToken,
      angelOneSymbol: selectedScriptRow.angelSymbol,
      kiteToken: selectedScriptRow.token,
      kiteSymbol: selectedScriptRow.kiteSymbol,

      // update cde
      finavasiaToken: selectedScriptRow.finvasiaToken,
      finavasiaSymbol: selectedScriptRow.finvasiaSymbol,
      fyersToken: selectedScriptRow.fyersToken,
      fyersSymbol: selectedScriptRow.fyersSymbol,
      upstoxToken: selectedScriptRow.upstoxToken,
      upstoxSymbol: selectedScriptRow.upstoxSymbol,
      growToken: "",
      growSymbol: "",


    };

    try {

      console.log(payload,'==================payload================');
      
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
            rowHeight={45}
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
                <MdOutlineCancel className="w-8 h-8 hover:text-gray-600" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  className={`flex-1 py-3 text-center font-medium ${activeTab === "Quick"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                    }`}
                  onClick={() => setActiveTab("Quick")}
                >
                  Quick
                </button>
                <button
                  className={`flex-1 py-3 text-center font-medium ${activeTab === "Regular"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                    }`}
                  onClick={() => setActiveTab("Regular")}
                >
                  Regular
                </button>
                <button
                  className={`flex-1 py-3 text-center font-medium ${activeTab === "Iceberg"
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

                {/* Vereity Type */}
              <div className="flex gap-6 mb-5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="varietyType"
                    checked={varietyType === "ROBO"}
                    onChange={() => setvarietyTypeType("ROBO")}
                    className="h-4 w-4"
                  />
                  ROBO 
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                   name="varietyType"
                    checked={varietyType === "STOPLOSS"}
                    onChange={() => setvarietyTypeType("STOPLOSS")}
                    className="h-4 w-4"
                  />
                  STOPLOSS 
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                      name="varietyType"
                    checked={varietyType === "NORMAL"}
                    onChange={() => setvarietyTypeType("NORMAL")}
                    className="h-4 w-4"
                  />
                  NORMAL 
                </label>


              </div>

              
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

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="productType"
                    checked={scriptProductType === "CARRYFORWARD"}
                    onChange={() => setScriptProductType("CARRYFORWARD")}
                    className="h-4 w-4"
                  />
                  NORMAL <span className="text-xs text-gray-500">NMRL</span>
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
                    value={ltp || 0}
                     onChange={(e) => {
                      const val = Number(e.target.value);
                      setLtp(val);
                    }}
                    className="border rounded px-3 py-2 w-full text-center bg-gray-100 h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry price
                  </label>
                  <input
                    type="number"
                     value={targetPrice || 0}
                     onChange={(e) => {
                      const val = Number(e.target.value);
                      setTargetPrice(val);
                    }}
                    className="border rounded px-3 py-2 w-full text-center bg-gray-100 h-10"
                  />
                </div>
              </div>

                {/* Stoploss and Squareoff  */}
              <div className="grid grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stoploss Price
                  </label>
                  <input
                    type="number"
                    value={stoploss || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStopLoss(val);
                    }}
                    className="border rounded px-3 py-2 w-full text-center h-10"
                  />
                </div>

                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Price
                  </label>
                  <input
                    type="number"
                    value={squareoff || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSquareOff(val);
                    }}
                    className="border rounded px-3 py-2 w-full text-center h-10"
                  />
                </div>
             
              
              </div>

              {/*  Type */}
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

                 {/* Trasection Type */}
              <div className="flex gap-6 mb-5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="trasectiontype"
                    checked={trasectionType === "BUY"}
                    onChange={() => setTrasectionType("BUY")}
                    className="h-4 w-4"
                  />
                  BUY <span className="text-xs text-gray-500">BUY</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                   name="trasectiontype"
                    checked={trasectionType === "SELL"}
                    onChange={() => setTrasectionType("SELL")}
                    className="h-4 w-4"
                  />
                  SELl <span className="text-xs text-gray-500">SELL</span>
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
                Required Fund ₹{(ltp * selectedScriptRow.lotsize).toFixed(2)}
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


