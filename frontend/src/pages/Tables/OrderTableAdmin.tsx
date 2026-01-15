
// ===================== last update sl and target fields updated code =====================


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
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

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

  squareoff?: any; // ✅ use as TARGET price in UI
  stoploss?: any;  // ✅ use as SL price in UI
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





const NumInlineInput = ({
  value,
  placeholder,
  disabled,
  onChangeValue,
}: {
  value: any;
  placeholder?: string;
  disabled?: boolean;
  onChangeValue: (val: number | null, rawText: string) => void;
}) => {
  const [v, setV] = useState<string>(
    value === null || value === undefined ? "" : String(value)
  );

  const isTypingRef = useRef(false);

  useEffect(() => {
    if (isTypingRef.current) return;
    setV(value === null || value === undefined ? "" : String(value));
  }, [value]);

  const commit = useCallback(() => {
    const raw = String(v || "").trim();
    const num = raw === "" ? null : Number(raw);

    // invalid number → don't commit
    if (raw !== "" && !Number.isFinite(num)) return;

    onChangeValue(num, raw);
    isTypingRef.current = false;
  }, [v, onChangeValue]);

  return (
    <input
      value={v}
      onFocus={() => {
        isTypingRef.current = true;
      }}
      onChange={(e) => {
        // ✅ ONLY local typing (NO parent update here)
        isTypingRef.current = true;
        setV(e.target.value);
      }}
      onBlur={commit}  // ✅ parent update ONLY here
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLInputElement).blur(); // triggers commit
        }
        if (e.key === "Escape") {
          e.preventDefault();
          isTypingRef.current = false;
          setV(value === null || value === undefined ? "" : String(value));
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      disabled={disabled}
      placeholder={placeholder || "—"}
      className="border border-gray-300 px-2 py-1 rounded w-full text-sm"
      style={{ maxWidth: 110 }}
      inputMode="decimal"
      autoComplete="off"
    />
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

/** Sell button */
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

/** ✅ Target+Stoploss Action Icons */
const OcoActionIcons = ({
  disabled,
  title,
  onOk,
  onCancel,
  okLoading,
}: {
  disabled: boolean;
  title?: string;
  onOk: () => void;
  onCancel: () => void;
  okLoading?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2 justify-center">
      <button
        disabled={disabled || !!okLoading}
        onClick={() => !disabled && !okLoading && onOk()}
        title={title || "Submit Target + Stoploss"}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ lineHeight: 0 }}
      >
        <FaCheckCircle className="w-4 h-4" style={{ color: disabled ? "#9ca3af" : "#16a34a" }} />
      </button>

      <button
        disabled={disabled || !!okLoading}
        onClick={() => !disabled && !okLoading && onCancel()}
        title="Clear (reset)"
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ lineHeight: 0 }}
      >
        <FaTimesCircle className="w-4 h-4" style={{ color: disabled ? "#9ca3af" : "#ef4444" }} />
      </button>

      {okLoading ? (
        <span className="text-xs text-gray-500 ml-1">Saving...</span>
      ) : null}
    </div>
  );
};



/** ---------------- MAIN COMPONENT ---------------- */

export default function OrderTableAdmin() {

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const exitLocksRef = useRef(new Set<string>());

  const gridApiRef = useRef<GridApi | null>(null);

  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rowData, setRowData] = useState<RowItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // token -> ltp
const ltpByTokenRef = useRef<Record<string, number>>({});
const subGridApiRef = useRef<Record<string, GridApi | null>>({});


// orderId -> true (already executed)
const rawOrdersRef = useRef<Order[]>([]);
const autoExitTriggeredRef = useRef<Record<string, boolean>>({});




// ================= PARTIAL SELL MODAL STATE =================
const [showPartialModal, setShowPartialModal] = useState(false);

const [partialData, setPartialData] = useState<{
  quantity: number | null;
  strategyUniqueId: string;
  flag: "MAIN" | "SUB"; // Add flag
  orderId: string;      // Add orderId
} | null>(null);

// open modal
const openPartialModal = (
  strategyUniqueId: string,
  flag: "MAIN" | "SUB", // Add flag
  orderId: string       // Add orderId
) => {
  setPartialData({
    quantity: null,
    strategyUniqueId,
    flag,      // Store flag
    orderId,   // Store orderId
  });
  setShowPartialModal(true);
};

// close modal
const closePartialModal = () => {
  setShowPartialModal(false);
  setPartialData(null);
};

// submit
const handlePartialSell = async () => {
  try {

    if (!partialData?.quantity || !partialData.strategyUniqueId) {
      toast.error("Quantity required");
      return;
    }


     console.log('quantity :',partialData.quantity);
     console.log('strategyUniqueId :',partialData.strategyUniqueId);
     console.log('flag :',partialData.flag);
     console.log('orderId :',partialData.orderId);

    await axios.post(
      `${apiUrl}/admin/group/squareoff`,
      {
        quantity: partialData.quantity,
        strategyUniqueId: partialData.strategyUniqueId,
        flag: partialData.flag,      // Include flag
        orderId: partialData.orderId, // Include orderId
      },
      { headers: authHeader }
    );

    toast.success("Partial Sell Placed");
    closePartialModal();
    fetchOrders();
  } catch (e) {
    console.error(e);
    toast.error("Partial sell failed");
  }
};



const shouldAutoExit = ({
  transactionType,
  cmp,
  target,
  stoploss,
}: {
  transactionType: string;
  cmp: number;
  target?: number | null;
  stoploss?: number | null;
}): false | "TARGET" | "STOPLOSS" => {



  

  if (!Number.isFinite(cmp)) return false;

  const t = Number(target);
  const sl = Number(stoploss);

  const hasTarget = Number.isFinite(t) && t > 0;
  const hasSL = Number.isFinite(sl) && sl > 0;

  // ❌ nothing set
  if (!hasTarget && !hasSL) return false;

  const isBuy = transactionType === "BUY";

  if (isBuy) {
    // 🎯 TARGET HIT
    if (hasTarget && cmp >= t) return "TARGET";

    // 🛑 STOPLOSS HIT
    if (hasSL && cmp <= sl) return "STOPLOSS";
  } else {
    // future SELL logic
    if (hasTarget && cmp <= t) return "TARGET";
    if (hasSL && cmp >= sl) return "STOPLOSS";
  }

  return false;
};


const callAutoExitAPI = async ({
  orderId,
  strategyUniqueId,
  reason,
}: {
  orderId: string;
  strategyUniqueId: string;
  reason: "TARGET" | "STOPLOSS";
}) => {
  try {

     // 🚫 already exiting
  if (exitLocksRef.current.has(strategyUniqueId)) {
    console.log("Auto exit already in progress for", strategyUniqueId);
    return;
  }

     // 🔒 lock this order
     exitLocksRef.current.add(strategyUniqueId);

    await axios.post(
      `${apiUrl}/admin/targetstoplosscheck`, // 👈 tumhara backend endpoint
      { orderId, strategyUniqueId, reason },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      }
    );

    toast.success(`Auto ${reason} executed for Order ${orderId}`);
    fetchOrders()
    //   // ❗ allow retry on failure
    // exitLocksRef.current.delete(strategyUniqueId);
  } catch (err: any) {
    console.error("Auto exit failed", err);
     // ❗ allow retry on failure
    exitLocksRef.current.delete(strategyUniqueId);
  }
};




  // ✅ Draft state for OCO inputs (orderId -> {targetPrice, stoplossPrice, ...payload})
  const [ocoDraft, setOcoDraft] = useState<Record<string, any>>({});
  const [ocoSavingKey, setOcoSavingKey] = useState<string | null>(null);

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      userid: localStorage.getItem("userID") || "",
    }),
    []
  );

  /** ---------------- DETAIL ROW (SUBTABLE) ---------------- */
const DetailRowRenderer = (props: any) => {
  const row = props.data as DetailRow;
  const { onSellFromSub, ocoDraft, setOcoDraft, submitOcoDraft, clearOcoDraft, ocoSavingKey } =
    props.context || {};

  const subColumnDefs: ColDef<ClientOrder>[] = [
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

{
  headerName: "Partial Sell",
  width: 120,
  sortable: false,
  filter: false,
  cellRenderer: (params: any) => {
    const r: Order = params.data;
    const disabled = String(r.transactiontype) === "SELL";

    return (
      <button
        disabled={disabled}
        onClick={() => openPartialModal(r.strategyUniqueId!, "SUB", r.orderid!)}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #1d4ed8, #3b82f6)";
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #3b82f6, #2563eb)";
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
          background: disabled ? "#9ca3af" : "linear-gradient(to right, #3b82f6, #2563eb)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "all 0.2s ease-in-out",
        }}
        title={disabled ? "Already Sold" : "Click to Partial Sell"}
      >
        <span style={{ fontSize: "13px", lineHeight: 1 }}>⬇</span>
        PARTIAL
      </button>
    );
  },
},




    { headerName: "UserId", field: "userNameId", width: 120 },
    { headerName: "Broker", field: "broker", width: 130 },

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

    // ✅ Target input (draft only)
    {
      headerName: "Target",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const r: ClientOrder = params.data;
        if (!r?.orderid) return null;

        const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
        const key = String(r.orderid);

        const draft = ocoDraft?.[key] || {};
        const value = draft.targetPrice ?? r.squareoff ?? "";

        return (
          <NumInlineInput
            value={value}
            placeholder="Target"
            disabled={!isBuy}
            onChangeValue={(val) => {
              if (!isBuy) return;
              setOcoDraft?.((prev: any) => ({
                ...(prev || {}),
                [key]: {
                  ...(prev?.[key] || {}),
                  targetPrice: val,
                  stoplossPrice: prev?.[key]?.stoplossPrice ?? (r.stoploss ?? null),
                  orderId: r.orderid,
                  strategyUniqueId: row.parentStrategyUniqueId || r.strategyUniqueId || "",
                  userId: r.userNameId,
                  broker: r.broker,
                },
              }));
            }}
          />
        );
      },
    },

    // ✅ Stoploss input (draft only)
    {
      headerName: "Stoploss",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const r: ClientOrder = params.data;
        if (!r?.orderid) return null;

        const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
        const key = String(r.orderid);

        const draft = ocoDraft?.[key] || {};
        const value = draft.stoplossPrice ?? r.stoploss ?? "";

        return (
          <NumInlineInput
            value={value}
            placeholder="SL"
            disabled={!isBuy}
            onChangeValue={(val) => {
              if (!isBuy) return;
              setOcoDraft?.((prev: any) => ({
                ...(prev || {}),
                [key]: {
                  ...(prev?.[key] || {}),
                  stoplossPrice: val,
                  targetPrice: prev?.[key]?.targetPrice ?? (r.squareoff ?? null),
                  orderId: r.orderid,
                  strategyUniqueId: row.parentStrategyUniqueId || r.strategyUniqueId || "",
                  userId: r.userNameId,
                  broker: r.broker,
                },
              }));
            }}
          />
        );
      },
    },

    // ✅ ✅/❌ column (submit both together)
    {
      headerName: "OCO",
      width: 90,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const r: ClientOrder = params.data;
        if (!r?.orderid) return null;

        const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
        const key = String(r.orderid);

        const draft = ocoDraft?.[key] || {};
        const t = draft.targetPrice ?? null;
        const sl = draft.stoplossPrice ?? null;

        const canSubmit =
          isBuy &&
          Number.isFinite(Number(t)) &&
          Number.isFinite(Number(sl)) &&
          Number(t) > 0 &&
          Number(sl) > 0;

        const saving = ocoSavingKey === key;

        return (
          <OcoActionIcons
            disabled={!canSubmit}
            okLoading={saving}
            title={!canSubmit ? "Fill both Target and Stoploss first" : "Submit Target+Stoploss"}
            onOk={() => submitOcoDraft?.(key)}
            onCancel={() => clearOcoDraft?.(key)}
          />
        );
      },
    },

    {
      headerName: "CMP",
      colId: "cmp",   // ✅ ADD THIS
      width: 110,
      sortable: false,
      filter: false,
      valueGetter: (p:any) => {
        const t = p.data?.angelOneToken;
        return t ? ltpByTokenRef.current[t] : undefined;
      },
      cellRenderer: (p: any) => (p.value !== undefined ? p.value : "—"),
    },

    {
      headerName: "PnL",
       colId: "pnl",   // ✅ ADD THIS
      width: 140,
      sortable: false,
      filter: false,
      valueGetter: (p:any) => {
  const token = p.data?.angelOneToken;
  const live = token ? ltpByTokenRef.current[token] : undefined;

  const price = Number(p.data?.price ?? 0);
  const qty = Number(p.data?.fillsize ?? p.data?.quantity ?? 0);

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
          onGridReady={(params) => {
    subGridApiRef.current[row.id] = params.api;
  }}
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

  // ---------------- SOCKET ----------------
 useEffect(() => {

  const socket = getSocket();

  const onTick = (tick: Tick) => {

    // if (prev === tick.ltp) return;

    ltpByTokenRef.current[tick.token] = tick.ltp;

    // 🔥 Only refresh required columns
    gridApiRef.current?.refreshCells({
      columns: ["cmp", "pnl"], // ✅ colId, NOT headerName
  force: true,
    });

    // refresh subgrids
  Object.values(subGridApiRef.current).forEach((api) => {
    api?.refreshCells({
      columns: ["cmp", "pnl"],
      force: true,
    });
  });


  

  //  sl and target code
  // 🔥 AUTO TARGET / SL CHECK
  rawOrdersRef.current.forEach((master) => {
 
    const ordersToCheck = master.client_data?.length
      ? master.client_data
      : [master];

    ordersToCheck.forEach((o: any) => {
      const token = o?.angelOneToken;
      if (!token || token !== tick.token) return;

      

      const orderId = String(o.orderid);
      if (!orderId) return;

      // // ❌ already executed
      // if (autoExitTriggeredRef.current[orderId]){

      //   console.log('already done this');
        
      //    return;
      // }

      const cmp = tick.ltp;
      const result = shouldAutoExit({
        transactionType: o.transactiontype,
        cmp,
        target: o.squareoff,
        stoploss: o.stoploss,
      });

      if (!result) return;

      // ✅ mark executed FIRST (important)
      autoExitTriggeredRef.current[orderId] = true;

      callAutoExitAPI({
        orderId,
        strategyUniqueId: o.strategyUniqueId,
        reason: result,
      });
    });
  });

  };


const handlerTargetAndStoploss = (payload: any) => {

  // 🔁 Simply re-fetch latest orders
  fetchOrders();   // 👈 tumhari existing API call function


  console.log(payload,'========handlerTargetAndStoploss payload============');
  

};



  //  test code start 
  // ltpByTokenRef.current["40446"] = 238;

  //  callAutoExitAPI({
  //       orderId:"2005856046572380160",
  //       strategyUniqueId: "193fe21d_jetha12",
  //       reason: "STOPLOSS",
  //     });

  //  test end 
    
  socket.on("tick", onTick);
  socket.on("order:oco:update", handlerTargetAndStoploss);
  // return () => socket.off("tick", onTick);
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
        rawOrdersRef.current = list;
        // keep drafts (optional) OR clear drafts:
        // setOcoDraft({});
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

  /** ✅ API: Submit Target+SL together (only on ✅ click) */
  const submitOcoDraft = useCallback(

    async (orderIdKey: string) => {
      const d = ocoDraft?.[orderIdKey];
      if (!d?.orderId) return;

      const targetPrice = d?.targetPrice;
      const stoplossPrice = d?.stoplossPrice;

      if (!Number.isFinite(Number(targetPrice)) || !Number.isFinite(Number(stoplossPrice))) {
        toast.error("Fill valid Target & Stoploss");
        return;
      }

      const payload = {
        orderId: String(d.orderId),
        strategyUniqueId: String(d.strategyUniqueId || ""),
        targetPrice: Number(targetPrice),
        stoplossPrice: Number(stoplossPrice),
        userId: d.userId,
        broker: d.broker,
      };  


      console.log('=================payload target and stoploss update !',payload);
      

      try {

        setOcoSavingKey(orderIdKey);

        const res = await axios.post(`${apiUrl}/admin/multiple/targetstoploss/order`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        });

        if (res.data?.status === true) {
          toast.success(res.data?.message || "OCO updated");
          // clear draft for this orderId
          setOcoDraft((prev) => {
            const next = { ...(prev || {}) };
            delete next[orderIdKey];
            return next;
          });
          fetchOrders();
        } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
          handleUnauthorized();
        } else {
          toast.error(res.data?.message || "Failed to update OCO");
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to update OCO");
      } finally {
        setOcoSavingKey(null);
      }
    },
    [apiUrl, fetchOrders, handleUnauthorized, ocoDraft]
  );

  /** ❌ Clear draft for an orderId */
  const clearOcoDraft = useCallback((orderIdKey: string) => {
    setOcoDraft((prev) => {
      const next = { ...(prev || {}) };
      delete next[orderIdKey];
      return next;
    });
  }, []);

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
        fetchOrders();
      } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
        handleUnauthorized();
      }
    } catch (err: any) {}
  }, [apiUrl, fetchOrders, handleUnauthorized]);

  /** ✅ MAIN SELL */
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
          { orderId: row.orderid, strategyUniqueId },
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

  /** ✅ SUB SELL */
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

      {
        headerName: "Action",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;

          const disabled = String(row.transactiontype || "").toUpperCase() === "SELL";
          return <SellButton  disabled={disabled} onClick={() => handleSellMain(row)}  />;
        },
      },

      {
        headerName: "Partial Sell",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: Order = params.data;
          const disabled = String(r.transactiontype) === "SELL";

          return (
            <button
              disabled={disabled}
              onClick={() => openPartialModal(r.strategyUniqueId!, "MAIN", r.orderid!)}
              onMouseEnter={(e) => {
                if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #1d4ed8, #3b82f6)";
              }}
              onMouseLeave={(e) => {
                if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #3b82f6, #2563eb)";
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
                background: disabled ? "#9ca3af" : "linear-gradient(to right, #3b82f6, #2563eb)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                transition: "all 0.2s ease-in-out",
              }}
              title={disabled ? "Already Sold" : "Click to Partial Sell"}
            >
              <span style={{ fontSize: "13px", lineHeight: 1 }}>⬇</span>
              PARTIAL
            </button>
          );
        },
      },

      { headerName: "SYMBOL", field: "tradingsymbol", width: 200 },
      
      { headerName: "Price", field: "price", width: 110 },

      // ✅ Target (draft only) + API only on ✅
      {
        headerName: "Target",
        width: 90,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;
          if (!row?.orderid) return null;

          const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
          const key = String(row.orderid);

          const draft = ocoDraft?.[key] || {};
          const value = draft.targetPrice ?? row.squareoff ?? "";

          return (
            <NumInlineInput
              value={value}
              placeholder="Target"
              disabled={!isBuy}
              onChangeValue={(val) => {
                if (!isBuy) return;
                setOcoDraft((prev) => ({
                  ...(prev || {}),
                  [key]: {
                    ...(prev?.[key] || {}),
                    targetPrice: val,
                    stoplossPrice: prev?.[key]?.stoplossPrice ?? (row.stoploss ?? null),
                    orderId: row.orderid,
                    strategyUniqueId: row.strategyUniqueId || "",
                    userId: row.userId,
                    broker: row.broker,
                  },
                }));
              }}
            />
          );
        },
      },

      // ✅ Stoploss (draft only)
      {
        headerName: "Stoploss",
       width: 90,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;
          if (!row?.orderid) return null;

          const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
          const key = String(row.orderid);

          const draft = ocoDraft?.[key] || {};
          const value = draft.stoplossPrice ?? row.stoploss ?? "";

          return (
            <NumInlineInput
              value={value}
              placeholder="SL"
              disabled={!isBuy}
              onChangeValue={(val) => {
                if (!isBuy) return;
                setOcoDraft((prev) => ({
                  ...(prev || {}),
                  [key]: {
                    ...(prev?.[key] || {}),
                    stoplossPrice: val,
                    targetPrice: prev?.[key]?.targetPrice ?? (row.squareoff ?? null),
                    orderId: row.orderid,
                    strategyUniqueId: row.strategyUniqueId || "",
                    userId: row.userId,
                    broker: row.broker,
                  },
                }));
              }}
            />
          );
        },
      },

      // ✅ ✅/❌ icons column for MAIN row also
      {
        headerName: "OCO",
        width: 90,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;
          if (!row?.orderid) return null;

    
          const key = String(row.orderid);

          const draft = ocoDraft?.[key] || {};
          const t = draft.targetPrice ?? null;
          const sl = draft.stoplossPrice ?? null;

          

          const hasTarget = Number.isFinite(Number(t)) && Number(t) > 0;
          const hasSL = Number.isFinite(Number(sl)) && Number(sl) > 0;
          const canSubmit =  (hasTarget || hasSL);

          const saving = ocoSavingKey === key;

          return (
            <OcoActionIcons
              disabled={!canSubmit}
              okLoading={saving}
              title={!canSubmit ? "Fill both Target and Stoploss first" : "Submit Target+Stoploss"}
              onOk={() => submitOcoDraft(key)}
              onCancel={() => clearOcoDraft(key)}
            />
          );
        },
      },

      {
  headerName: "CMP",
   colId: "cmp",   // ✅ ADD THIS
  width: 90,
  sortable: false,
  filter: false,
  valueGetter: (p) => {
    const d: any = p.data;
    if (d?.__rowType === "DETAIL") return undefined;
    const t = d?.angelOneToken;
    return t ? ltpByTokenRef.current[t] : undefined;
  },
  cellRenderer: (p: any) => (p.value !== undefined ? p.value : "—"),
},

   {
  headerName: "PnL",
  colId: "pnl",   // ✅ ADD THIS
  width: 120,
  sortable: false,
  filter: false,
  valueGetter: (p) => {
    const d: any = p.data;

   
    
    if (d?.__rowType === "DETAIL") return null;

    const token = d?.angelOneToken;
    const live = token ? ltpByTokenRef.current[token] : undefined;
    const price = Number(d?.price ?? 0);
    const qty = Number(d?.quantity ?? 0);

    if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
    return (live - price) * qty;
  },
  cellRenderer: (p: any) => pnlPill(p.value),
},
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
   [handleSellMain, ocoDraft, ocoSavingKey, submitOcoDraft, clearOcoDraft]
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
    //   const d: any = props.data;
    // if (d?.__rowType === "DETAIL") return 330;
    // return 50;

  }, []);

  const getRowHeight = useCallback((params: RowHeightParams) => {
    const d: any = params.data;
    if (d?.__rowType === "DETAIL") return 330;
    return 50;
  }, []);

  return (
    <div className="p-4 font-sans">
      <h2 className="mb-3 text-xl font-semibold">Current Position</h2>

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
            ltpByToken: ltpByTokenRef.current,
            ocoDraft,
            setOcoDraft,
            submitOcoDraft,
            clearOcoDraft,
            ocoSavingKey,
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

{showPartialModal && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "flex-start", // Modal ko upar le jaane ke liye
      justifyContent: "center",
      zIndex: 9999,
      paddingTop: "140px", // Top se 80px padding dega
    }}
  >
    <div
      style={{
        width: 360,
        background: "white",
        padding: 20,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 15,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Partial Sell</h3>

      <div>
        <label className="font-medium text-sm">Strategy ID</label>
        <input
          value={partialData?.strategyUniqueId || ""}
          disabled
          className="border px-2 py-1 w-full rounded bg-gray-100 text-gray-700"
        />
      </div>

      <div>
        <label className="font-medium text-sm">Quantity</label>
        <input
          type="number"
          value={partialData?.quantity || ""}
          onChange={(e) =>
            setPartialData((prev) =>
              prev ? { ...prev, quantity: Number(e.target.value) } : prev
            )
          }
          className="border px-2 py-1 w-full rounded"
          placeholder="Enter Quantity"
        />
      </div>

      <div className="flex gap-4 justify-end">
        <button
          onClick={closePartialModal}
          className="px-4 py-1 rounded bg-gray-300 text-sm"
        >
          Cancel
        </button>

        <button
          onClick={handlePartialSell}
          className="px-4 py-1 rounded bg-blue-600 text-white text-sm"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}




































//  ==================== final Working code ===========================



// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import axios from "axios";
// import "antd/dist/reset.css";
// import { Button } from "antd";
// import { toast } from "react-toastify";
// import { getSocket } from "../../socket/Socket";
// import { useNavigate } from "react-router";

// import { AgGridReact } from "ag-grid-react";
// import type {
//   ColDef,
//   GridApi,
//   GridReadyEvent,
//   ICellRendererParams,
//   RowHeightParams,
// } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";

// import { FaChevronDown, FaChevronRight } from "react-icons/fa";
// import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

// /** ---------------- TYPES ---------------- */

// type Tick = {
//   mode: 1 | 2 | 3;
//   exchangeType: number;
//   token: string;
//   sequenceNumber: number;
//   exchangeTimestamp: string;
//   ltpPaiseOrRaw: number;
//   ltp: number;
// };

// type ClientOrder = {
//   id?: number;
//   userId?: number;
//   userNameId?: any;
//   broker?: string;

//   variety?: string;
//   ordertype?: string;
//   producttype?: string;
//   duration?: any;

//   price?: number;
//   triggerprice?: any;

//   quantity?: any;
//   disclosedquantity?: any;

//   squareoff?: any; // ✅ use as TARGET price in UI
//   stoploss?: any;  // ✅ use as SL price in UI
//   trailingstoploss?: any;

//   tradingsymbol?: string;
//   transactiontype?: string;
//   exchange?: string;
//   symboltoken?: string;

//   ordertag?: any;
//   instrumenttype?: string;

//   strikeprice?: any;
//   optiontype?: any;
//   expirydate?: any;
//   lotsize?: any;

//   cancelsize?: any;

//   averageprice?: any;
//   filledshares?: any;
//   unfilledshares?: any;

//   orderid?: string;
//   uniqueorderid?: string;
//   parentorderid?: any;

//   exchangeorderid?: any;

//   text?: any;
//   status?: string;
//   orderstatus?: any;
//   orderstatuslocaldb?: any;

//   updatetime?: any;
//   exchtime?: any;
//   exchorderupdatetime?: any;

//   fillid?: any;
//   filltime?: any;
//   fillprice?: any;
//   fillsize?: any;

//   createdAt?: any;
//   updatedAt?: any;

//   totalPrice?: any;
//   actualQuantity?: any;

//   strategyUniqueId?: string;
//   strategyName?: string;
// };

// type Order = ClientOrder & {
//   client_data?: ClientOrder[];
//   __rowType?: "MASTER" | "DETAIL";
//   __isExpanded?: boolean;
// };

// type DetailRow = {
//   __rowType: "DETAIL";
//   id: string;
//   parentId: number | string;
//   parentStrategyUniqueId?: string;
//   client_data: ClientOrder[];
// };

// type RowItem = (Order & { __rowType?: "MASTER" }) | DetailRow;

// /** ---------------- HELPERS ---------------- */

// const statusColor = (status: string) => {
//   const s = String(status || "").toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//   if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//   return "#64748b";
// };

// const pnlPill = (val: number | null | undefined) => {
//   const n = Number(val);
//   const isPositive = n > 0;
//   const isNegative = n < 0;

//   const colorClass = isPositive
//     ? "text-green-700"
//     : isNegative
//     ? "text-red-700"
//     : "text-gray-800";

//   const bgClass = isPositive
//     ? "bg-green-100"
//     : isNegative
//     ? "bg-red-100"
//     : "bg-gray-200";

//   return (
//     <span className={`px-2.5 py-1 rounded-full font-medium ${colorClass} ${bgClass}`}>
//       {Number.isFinite(n) ? n.toFixed(2) : "—"}
//     </span>
//   );
// };





// const NumInlineInput = ({
//   value,
//   placeholder,
//   disabled,
//   onChangeValue,
// }: {
//   value: any;
//   placeholder?: string;
//   disabled?: boolean;
//   onChangeValue: (val: number | null, rawText: string) => void;
// }) => {
//   const [v, setV] = useState<string>(
//     value === null || value === undefined ? "" : String(value)
//   );

//   const isTypingRef = useRef(false);

//   useEffect(() => {
//     if (isTypingRef.current) return;
//     setV(value === null || value === undefined ? "" : String(value));
//   }, [value]);

//   const commit = useCallback(() => {
//     const raw = String(v || "").trim();
//     const num = raw === "" ? null : Number(raw);

//     // invalid number → don't commit
//     if (raw !== "" && !Number.isFinite(num)) return;

//     onChangeValue(num, raw);
//     isTypingRef.current = false;
//   }, [v, onChangeValue]);

//   return (
//     <input
//       value={v}
//       onFocus={() => {
//         isTypingRef.current = true;
//       }}
//       onChange={(e) => {
//         // ✅ ONLY local typing (NO parent update here)
//         isTypingRef.current = true;
//         setV(e.target.value);
//       }}
//       onBlur={commit}  // ✅ parent update ONLY here
//       onKeyDown={(e) => {
//         if (e.key === "Enter") {
//           e.preventDefault();
//           (e.currentTarget as HTMLInputElement).blur(); // triggers commit
//         }
//         if (e.key === "Escape") {
//           e.preventDefault();
//           isTypingRef.current = false;
//           setV(value === null || value === undefined ? "" : String(value));
//           (e.currentTarget as HTMLInputElement).blur();
//         }
//       }}
//       disabled={disabled}
//       placeholder={placeholder || "—"}
//       className="border border-gray-300 px-2 py-1 rounded w-full text-sm"
//       style={{ maxWidth: 110 }}
//       inputMode="decimal"
//       autoComplete="off"
//     />
//   );
// };


// /** Expand icon cell (only for MASTER rows) */
// const ExpandCellRenderer = (props: ICellRendererParams) => {
//   const data = props.data as any;
//   if (data?.__rowType === "DETAIL") return null;

//   const isExpanded = !!data?.__isExpanded;
//   const toggleRow = props.context?.toggleRow;

//   return (
//     <div className="flex items-center h-full">
//       <button
//         onClick={() => toggleRow?.(data)}
//         className="p-1 rounded hover:bg-gray-100 transition-colors"
//         title={isExpanded ? "Collapse" : "Expand"}
//       >
//         {isExpanded ? (
//           <FaChevronDown className="w-3 h-3 text-gray-600" />
//         ) : (
//           <FaChevronRight className="w-3 h-3 text-gray-600" />
//         )}
//       </button>
//     </div>
//   );
// };

// /** Sell button */
// const SellButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => {
//   return (
//     <button
//       onClick={() => !disabled && onClick()}
//       disabled={disabled}
//       onMouseEnter={(e) => {
//         if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #b91c1c, #7f1d1d)";
//       }}
//       onMouseLeave={(e) => {
//         if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #ef4444, #dc2626)";
//       }}
//       style={{
//         display: "inline-flex",
//         alignItems: "center",
//         gap: "6px",
//         padding: "4px 14px",
//         borderRadius: "16px",
//         fontSize: "12px",
//         fontWeight: 600,
//         letterSpacing: "0.5px",
//         border: "none",
//         color: "#fff",
//         background: disabled ? "#9ca3af" : "linear-gradient(to right, #ef4444, #dc2626)",
//         cursor: disabled ? "not-allowed" : "pointer",
//         opacity: disabled ? 0.6 : 1,
//         transition: "all 0.2s ease-in-out",
//       }}
//       title={disabled ? "Already Sold" : "Click to Sell"}
//     >
//       <span style={{ fontSize: "13px", lineHeight: 1 }}>⬇</span>
//       SELL
//     </button>
//   );
// };

// /** ✅ Target+Stoploss Action Icons */
// const OcoActionIcons = ({
//   disabled,
//   title,
//   onOk,
//   onCancel,
//   okLoading,
// }: {
//   disabled: boolean;
//   title?: string;
//   onOk: () => void;
//   onCancel: () => void;
//   okLoading?: boolean;
// }) => {
//   return (
//     <div className="flex items-center gap-2 justify-center">
//       <button
//         disabled={disabled || !!okLoading}
//         onClick={() => !disabled && !okLoading && onOk()}
//         title={title || "Submit Target + Stoploss"}
//         className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
//         style={{ lineHeight: 0 }}
//       >
//         <FaCheckCircle className="w-4 h-4" style={{ color: disabled ? "#9ca3af" : "#16a34a" }} />
//       </button>

//       <button
//         disabled={disabled || !!okLoading}
//         onClick={() => !disabled && !okLoading && onCancel()}
//         title="Clear (reset)"
//         className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
//         style={{ lineHeight: 0 }}
//       >
//         <FaTimesCircle className="w-4 h-4" style={{ color: disabled ? "#9ca3af" : "#ef4444" }} />
//       </button>

//       {okLoading ? (
//         <span className="text-xs text-gray-500 ml-1">Saving...</span>
//       ) : null}
//     </div>
//   );
// };



// /** ---------------- MAIN COMPONENT ---------------- */

// export default function OrderTableAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const navigate = useNavigate();

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [rawOrders, setRawOrders] = useState<Order[]>([]);
//   const [rowData, setRowData] = useState<RowItem[]>([]);
//   const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [searchTerm, setSearchTerm] = useState("");

//   // token -> ltp
// const ltpByTokenRef = useRef<Record<string, number>>({});
// const subGridApiRef = useRef<Record<string, GridApi | null>>({});

//   // ✅ Draft state for OCO inputs (orderId -> {targetPrice, stoplossPrice, ...payload})
//   const [ocoDraft, setOcoDraft] = useState<Record<string, any>>({});
//   const [ocoSavingKey, setOcoSavingKey] = useState<string | null>(null);

//   const authHeader = useMemo(
//     () => ({
//       Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//       userid: localStorage.getItem("userID") || "",
//     }),
//     []
//   );

//   /** ---------------- DETAIL ROW (SUBTABLE) ---------------- */
// const DetailRowRenderer = (props: any) => {
//   const row = props.data as DetailRow;
//   const { onSellFromSub, ocoDraft, setOcoDraft, submitOcoDraft, clearOcoDraft, ocoSavingKey } =
//     props.context || {};

//   const subColumnDefs: ColDef<ClientOrder>[] = [
//     {
//       headerName: "Action",
//       width: 120,
//       sortable: false,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const r: ClientOrder = params.data;
//         if (!r) return null;

//         const disabled = String(r.transactiontype || "").toUpperCase() === "SELL";
//         return <SellButton disabled={disabled} onClick={() => onSellFromSub?.(r, row.parentStrategyUniqueId)} />;
//       },
//     },

//     { headerName: "UserId", field: "userNameId", width: 120 },
//     { headerName: "Broker", field: "broker", width: 130 },

//     { headerName: "StrategyUniqueId", field: "strategyUniqueId", width: 220, minWidth: 200 },
//     { headerName: "SYMBOL", field: "tradingsymbol", width: 160 },
//     { headerName: "Instrument", field: "instrumenttype", width: 140 },

//     {
//       headerName: "Type",
//       field: "transactiontype",
//       width: 110,
//       cellRenderer: (params: any) => {
//         const isBuy = params.value === "BUY";
//         const isSell = params.value === "SELL";
//         const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
//         const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";

//         return (
//           <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
//             {params.value || "-"}
//           </span>
//         );
//       },
//     },

//     { headerName: "OrderType", field: "ordertype", width: 130 },
//     { headerName: "ProductType", field: "producttype", width: 130 },
//     { headerName: "Price", field: "price", width: 110 },

//     // ✅ Target input (draft only)
//     {
//       headerName: "Target",
//       width: 120,
//       sortable: false,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const r: ClientOrder = params.data;
//         if (!r?.orderid) return null;

//         const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
//         const key = String(r.orderid);

//         const draft = ocoDraft?.[key] || {};
//         const value = draft.targetPrice ?? r.squareoff ?? "";

//         return (
//           <NumInlineInput
//             value={value}
//             placeholder="Target"
//             disabled={!isBuy}
//             onChangeValue={(val) => {
//               if (!isBuy) return;
//               setOcoDraft?.((prev: any) => ({
//                 ...(prev || {}),
//                 [key]: {
//                   ...(prev?.[key] || {}),
//                   targetPrice: val,
//                   stoplossPrice: prev?.[key]?.stoplossPrice ?? (r.stoploss ?? null),
//                   orderId: r.orderid,
//                   strategyUniqueId: row.parentStrategyUniqueId || r.strategyUniqueId || "",
//                   userId: r.userNameId,
//                   broker: r.broker,
//                 },
//               }));
//             }}
//           />
//         );
//       },
//     },

//     // ✅ Stoploss input (draft only)
//     {
//       headerName: "Stoploss",
//       width: 120,
//       sortable: false,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const r: ClientOrder = params.data;
//         if (!r?.orderid) return null;

//         const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
//         const key = String(r.orderid);

//         const draft = ocoDraft?.[key] || {};
//         const value = draft.stoplossPrice ?? r.stoploss ?? "";

//         return (
//           <NumInlineInput
//             value={value}
//             placeholder="SL"
//             disabled={!isBuy}
//             onChangeValue={(val) => {
//               if (!isBuy) return;
//               setOcoDraft?.((prev: any) => ({
//                 ...(prev || {}),
//                 [key]: {
//                   ...(prev?.[key] || {}),
//                   stoplossPrice: val,
//                   targetPrice: prev?.[key]?.targetPrice ?? (r.squareoff ?? null),
//                   orderId: r.orderid,
//                   strategyUniqueId: row.parentStrategyUniqueId || r.strategyUniqueId || "",
//                   userId: r.userNameId,
//                   broker: r.broker,
//                 },
//               }));
//             }}
//           />
//         );
//       },
//     },

//     // ✅ ✅/❌ column (submit both together)
//     {
//       headerName: "OCO",
//       width: 90,
//       sortable: false,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const r: ClientOrder = params.data;
//         if (!r?.orderid) return null;

//         const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
//         const key = String(r.orderid);

//         const draft = ocoDraft?.[key] || {};
//         const t = draft.targetPrice ?? null;
//         const sl = draft.stoplossPrice ?? null;

//         const canSubmit =
//           isBuy &&
//           Number.isFinite(Number(t)) &&
//           Number.isFinite(Number(sl)) &&
//           Number(t) > 0 &&
//           Number(sl) > 0;

//         const saving = ocoSavingKey === key;

//         return (
//           <OcoActionIcons
//             disabled={!canSubmit}
//             okLoading={saving}
//             title={!canSubmit ? "Fill both Target and Stoploss first" : "Submit Target+Stoploss"}
//             onOk={() => submitOcoDraft?.(key)}
//             onCancel={() => clearOcoDraft?.(key)}
//           />
//         );
//       },
//     },

//     {
//       headerName: "CMP",
//       colId: "cmp",   // ✅ ADD THIS
//       width: 110,
//       sortable: false,
//       filter: false,
//       valueGetter: (p:any) => {
//         const t = p.data?.angelOneToken;
//         return t ? ltpByTokenRef.current[t] : undefined;
//       },
//       cellRenderer: (p: any) => (p.value !== undefined ? p.value : "—"),
//     },

//     {
//       headerName: "PnL",
//        colId: "pnl",   // ✅ ADD THIS
//       width: 140,
//       sortable: false,
//       filter: false,
//       valueGetter: (p:any) => {
//   const token = p.data?.angelOneToken;
//   const live = token ? ltpByTokenRef.current[token] : undefined;

//   const price = Number(p.data?.price ?? 0);
//   const qty = Number(p.data?.fillsize ?? p.data?.quantity ?? 0);

//   if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;

//   return (live - price) * qty;
// },
//       cellRenderer: (p: any) => pnlPill(p.value),
//     },

//     { headerName: "OrderQty", field: "quantity", width: 120 },
//     { headerName: "TradedQty", field: "fillsize", width: 120 },
//     { headerName: "OrderID", field: "orderid", width: 190 },
//     { headerName: "TradeID", field: "fillid", width: 140 },

//     {
//       headerName: "Status",
//       field: "status",
//       width: 140,
//       cellRenderer: (params: any) => {
//         const status = params.value || params.data?.orderstatus || params.data?.orderstatuslocaldb;
//         const color = statusColor(status);
//         return (
//           <span
//             className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
//             style={{ backgroundColor: color }}
//             title={status}
//           >
//             {status || "-"}
//           </span>
//         );
//       },
//     },

//     {
//       headerName: "Message",
//       field: "text",
//       width: 470,
//       minWidth: 350,
//       wrapText: true,
//       autoHeight: true,
//       cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
//     },

//     { headerName: "Updated Time", field: "updatedAt", width: 290 },
//     { headerName: "Created Time", field: "createdAt", width: 290 },
//   ];

//   const subDefaultColDef = useMemo(
//     () => ({
//       resizable: true,
//       sortable: true,
//       filter: true,
//     }),
//     []
//   );

//   return (
//     <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mx-2 my-2">
//       <div className="text-sm font-semibold text-gray-700 mb-2">
//         Client Orders ({row.client_data?.length || 0})
//       </div>

//       <div className="ag-theme-alpine" style={{ width: "100%", height: "280px" }}>
//         <AgGridReact<ClientOrder>
//           onGridReady={(params) => {
//     subGridApiRef.current[row.id] = params.api;
//   }}
//           rowData={row.client_data || []}
//           columnDefs={subColumnDefs}
//           defaultColDef={subDefaultColDef}
//           pagination={true}
//           paginationPageSize={10}
//           rowHeight={50}
//           headerHeight={40}
//           suppressCellFocus={true}
//           animateRows={true}
//           enableCellTextSelection={true}
//           ensureDomOrder={true}
//           overlayLoadingTemplate={
//             '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
//           }
//           overlayNoRowsTemplate={
//             '<div class="flex flex-col items-center justify-center h-full text-gray-500">No orders match your search criteria</div>'
//           }
//         />
//       </div>
//     </div>
//   );
// };

//   // ---------------- SOCKET ----------------
//  useEffect(() => {
//   const socket = getSocket();

//   const onTick = (tick: Tick) => {

   

    

    
    
    
//     // const prev = ltpByTokenRef.current[tick.token];

//     // console.log('=============prev===========',prev);
    
//     // if (prev === tick.ltp) return;

//     ltpByTokenRef.current[tick.token] = tick.ltp;

//     // 🔥 Only refresh required columns
//     gridApiRef.current?.refreshCells({
//       columns: ["cmp", "pnl"], // ✅ colId, NOT headerName
//   force: true,
//     });

//     // refresh subgrids
//   Object.values(subGridApiRef.current).forEach((api) => {
//     api?.refreshCells({
//       columns: ["cmp", "pnl"],
//       force: true,
//     });
//   });
//   };

//   socket.on("tick", onTick);
//   return () => socket.off("tick", onTick);
// }, []);


//   // ---------------- AUTH FAIL ----------------
//   const handleUnauthorized = useCallback(() => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     localStorage.removeItem("termsAccepted");
//     localStorage.removeItem("feed_token");
//     localStorage.removeItem("refresh_token");
//     toast.error("Unauthorized User");
//     navigate("/");
//   }, [navigate]);

//   // ---------------- FETCH ORDERS ----------------
//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const { data } = await axios.get(`${apiUrl}/admin/get/table/order`, {
//         headers: authHeader,
//       });

//       if (data?.status === true) {


//         console.log('==================data=========',data);
        
//         const list = Array.isArray(data.data) ? data.data : [];
//         setRawOrders(list);
//         setExpandedIds(new Set());
//         // keep drafts (optional) OR clear drafts:
//         // setOcoDraft({});
//       } else if (data?.status === false && data?.message === "Unauthorized") {
//         handleUnauthorized();
//       } else {
//         toast.error(data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   }, [apiUrl, authHeader, handleUnauthorized]);

//   useEffect(() => {
//     fetchOrders();
//   }, [fetchOrders]);

//   /** ✅ API: Submit Target+SL together (only on ✅ click) */
//   const submitOcoDraft = useCallback(
//     async (orderIdKey: string) => {
//       const d = ocoDraft?.[orderIdKey];
//       if (!d?.orderId) return;

//       const targetPrice = d?.targetPrice;
//       const stoplossPrice = d?.stoplossPrice;

//       if (!Number.isFinite(Number(targetPrice)) || !Number.isFinite(Number(stoplossPrice))) {
//         toast.error("Fill valid Target & Stoploss");
//         return;
//       }

//       const payload = {
//         orderId: String(d.orderId),
//         strategyUniqueId: String(d.strategyUniqueId || ""),
//         targetPrice: Number(targetPrice),
//         stoplossPrice: Number(stoplossPrice),
//         userId: d.userId,
//         broker: d.broker,
//       };  

//       try {

//         setOcoSavingKey(orderIdKey);

//         const res = await axios.post(`${apiUrl}/admin/multiple/targetstoploss/order`, payload, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
//         });

//         if (res.data?.status === true) {
//           toast.success(res.data?.message || "OCO updated");
//           // clear draft for this orderId
//           setOcoDraft((prev) => {
//             const next = { ...(prev || {}) };
//             delete next[orderIdKey];
//             return next;
//           });
//           fetchOrders();
//         } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//           handleUnauthorized();
//         } else {
//           toast.error(res.data?.message || "Failed to update OCO");
//         }
//       } catch (err: any) {
//         toast.error(err?.message || "Failed to update OCO");
//       } finally {
//         setOcoSavingKey(null);
//       }
//     },
//     [apiUrl, fetchOrders, handleUnauthorized, ocoDraft]
//   );

//   /** ❌ Clear draft for an orderId */
//   const clearOcoDraft = useCallback((orderIdKey: string) => {
//     setOcoDraft((prev) => {
//       const next = { ...(prev || {}) };
//       delete next[orderIdKey];
//       return next;
//     });
//   }, []);

//   /** build rows with DETAIL row after expanded master */
//   const buildRows = useCallback((orders: Order[], expanded: Set<number | string>) => {
//     const rows: RowItem[] = [];

//     for (const o of orders) {
//       const masterId = (o.id ?? o.uniqueorderid ?? o.orderid) as any;
//       const isExpanded = expanded.has(masterId);

//       rows.push({
//         ...o,
//         __rowType: "MASTER",
//         __isExpanded: isExpanded,
//       });

//       if (isExpanded) {
//         rows.push({
//           __rowType: "DETAIL",
//           id: `detail-${String(masterId)}`,
//           parentId: masterId,
//           parentStrategyUniqueId: o.strategyUniqueId,
//           client_data: Array.isArray(o.client_data) ? o.client_data : [],
//         });
//       }
//     }

//     return rows;
//   }, []);

//   useEffect(() => {
//     setRowData(buildRows(rawOrders, expandedIds));
//   }, [rawOrders, expandedIds, buildRows]);

//   const toggleRow = useCallback((masterRow: Order) => {
//     const masterId = (masterRow.id ?? masterRow.uniqueorderid ?? masterRow.orderid) as any;

//     setExpandedIds((prev) => {
//       const next = new Set(prev);
//       if (next.has(masterId)) next.delete(masterId);
//       else next.add(masterId);
//       return next;
//     });
//   }, []);

//   // ---------------- ACTIONS ----------------
//   const handleSquareButton = useCallback(async () => {
//     const ok = window.confirm("Do you want to Square Off this order?");
//     if (!ok) return;

//     try {
//       const res = await axios.get(`${apiUrl}/admin/sequareoff`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
//       });

//       if (res.data?.status === true) {
//         toast.success(res.data?.message || "Square off done");
//         fetchOrders();
//       } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//         handleUnauthorized();
//       } else {
//         toast.error(res.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//     }
//   }, [apiUrl, fetchOrders, handleUnauthorized]);

//   const fetchOnlineOrdersDetails = useCallback(async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/fetchorderdetails`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
//       });

//       if (res.data?.status === true) {
//         fetchOrders();
//       } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//         handleUnauthorized();
//       }
//     } catch (err: any) {}
//   }, [apiUrl, fetchOrders, handleUnauthorized]);

//   /** ✅ MAIN SELL */
//   const handleSellMain = useCallback(
//     async (row: Order) => {
//       if (!row?.orderid) {
//         toast.error("Order ID not found");
//         return;
//       }

//       const strategyUniqueId = row?.strategyUniqueId || "";

//       const ok = window.confirm(
//         `Do you want to SELL this order?\nOrder ID: ${row.orderid}\nStrategy: ${strategyUniqueId || "-"}`
//       );
//       if (!ok) return;

//       try {
//         const res = await axios.post(
//           `${apiUrl}/admin/group/squareoff`,
//           { orderId: row.orderid, strategyUniqueId },
//           { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
//         );

//         if (res.data?.status === true) {
//           toast.success(`Order ${row.orderid} squared off successfully`);
//           fetchOrders();
//         } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//           handleUnauthorized();
//         } else {
//           toast.error(res.data?.message || "Failed to square off");
//         }
//       } catch (err: any) {
//         toast.error(err?.message || "Something went wrong");
//       }
//     },
//     [apiUrl, fetchOrders, handleUnauthorized]
//   );

//   /** ✅ SUB SELL */
//   const handleSellFromSub = useCallback(
//     async (clientRow: ClientOrder, parentStrategyUniqueId?: string) => {
//       if (!clientRow?.orderid) {
//         toast.error("Order ID not found");
//         return;
//       }

//       const strategyUniqueId = parentStrategyUniqueId || clientRow.strategyUniqueId || "";

//       const ok = window.confirm(
//         `Do you want to SELL this order?\nOrder ID: ${clientRow.orderid}\nStrategy: ${strategyUniqueId || "-"}`
//       );
//       if (!ok) return;

//       try {
//         const res = await axios.post(
//           `${apiUrl}/admin/single/squareoff`,
//           { orderId: clientRow.orderid, strategyUniqueId },
//           { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
//         );

//         if (res.data?.status === true) {
//           toast.success(`Order ${clientRow.orderid} squared off successfully`);
//           fetchOrders();
//         } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//           handleUnauthorized();
//         } else {
//           toast.error(res.data?.message || "Failed to square off");
//         }
//       } catch (err: any) {
//         toast.error(err?.message || "Something went wrong");
//       }
//     },
//     [apiUrl, fetchOrders, handleUnauthorized]
//   );

//   // ---------------- GRID ----------------
//   const defaultColDef = useMemo<ColDef<RowItem>>(
//     () => ({
//       resizable: true,
//       sortable: true,
//       filter: true,
//     }),
//     []
//   );

//   const columnDefs = useMemo<ColDef<RowItem>[]>(
//     () => [
//       {
//         headerName: "",
//         width: 55,
//         minWidth: 55,
//         maxWidth: 55,
//         cellRenderer: ExpandCellRenderer,
//         sortable: false,
//         filter: false,
//         resizable: false,
//       },

//       {
//         headerName: "Action",
//         width: 120,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (!row || row.__rowType === "DETAIL") return null;

//           const disabled = String(row.transactiontype || "").toUpperCase() === "SELL";
//           return <SellButton  disabled={disabled} onClick={() => handleSellMain(row)}  />;
//         },
//       },

//       { headerName: "SYMBOL", field: "tradingsymbol", width: 200 },

     

//       { headerName: "Price", field: "price", width: 110 },

//       // ✅ Target (draft only) + API only on ✅
//       {
//         headerName: "Target",
//         width: 120,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (!row || row.__rowType === "DETAIL") return null;
//           if (!row?.orderid) return null;

//           const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
//           const key = String(row.orderid);

//           const draft = ocoDraft?.[key] || {};
//           const value = draft.targetPrice ?? row.squareoff ?? "";

//           return (
//             <NumInlineInput
//               value={value}
//               placeholder="Target"
//               disabled={!isBuy}
//               onChangeValue={(val) => {
//                 if (!isBuy) return;
//                 setOcoDraft((prev) => ({
//                   ...(prev || {}),
//                   [key]: {
//                     ...(prev?.[key] || {}),
//                     targetPrice: val,
//                     stoplossPrice: prev?.[key]?.stoplossPrice ?? (row.stoploss ?? null),
//                     orderId: row.orderid,
//                     strategyUniqueId: row.strategyUniqueId || "",
//                     userId: row.userId,
//                     broker: row.broker,
//                   },
//                 }));
//               }}
//             />
//           );
//         },
//       },

//       // ✅ Stoploss (draft only)
//       {
//         headerName: "Stoploss",
//         width: 120,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (!row || row.__rowType === "DETAIL") return null;
//           if (!row?.orderid) return null;

//           const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
//           const key = String(row.orderid);

//           const draft = ocoDraft?.[key] || {};
//           const value = draft.stoplossPrice ?? row.stoploss ?? "";

//           return (
//             <NumInlineInput
//               value={value}
//               placeholder="SL"
//               disabled={!isBuy}
//               onChangeValue={(val) => {
//                 if (!isBuy) return;
//                 setOcoDraft((prev) => ({
//                   ...(prev || {}),
//                   [key]: {
//                     ...(prev?.[key] || {}),
//                     stoplossPrice: val,
//                     targetPrice: prev?.[key]?.targetPrice ?? (row.squareoff ?? null),
//                     orderId: row.orderid,
//                     strategyUniqueId: row.strategyUniqueId || "",
//                     userId: row.userId,
//                     broker: row.broker,
//                   },
//                 }));
//               }}
//             />
//           );
//         },
//       },

//       // ✅ ✅/❌ icons column for MAIN row also
//       {
//         headerName: "OCO",
//         width: 90,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (!row || row.__rowType === "DETAIL") return null;
//           if (!row?.orderid) return null;

//           const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
//           const key = String(row.orderid);

//           const draft = ocoDraft?.[key] || {};
//           const t = draft.targetPrice ?? null;
//           const sl = draft.stoplossPrice ?? null;

//           const canSubmit =
//             isBuy &&
//             Number.isFinite(Number(t)) &&
//             Number.isFinite(Number(sl)) &&
//             Number(t) > 0 &&
//             Number(sl) > 0;

//           const saving = ocoSavingKey === key;

//           return (
//             <OcoActionIcons
//               disabled={!canSubmit}
//               okLoading={saving}
//               title={!canSubmit ? "Fill both Target and Stoploss first" : "Submit Target+Stoploss"}
//               onOk={() => submitOcoDraft(key)}
//               onCancel={() => clearOcoDraft(key)}
//             />
//           );
//         },
//       },

//       {
//   headerName: "CMP",
//    colId: "cmp",   // ✅ ADD THIS
//   width: 110,
//   sortable: false,
//   filter: false,
//   valueGetter: (p) => {
//     const d: any = p.data;
//     if (d?.__rowType === "DETAIL") return undefined;
//     const t = d?.angelOneToken;
//     return t ? ltpByTokenRef.current[t] : undefined;
//   },
//   cellRenderer: (p: any) => (p.value !== undefined ? p.value : "—"),
// },

//    {
//   headerName: "PnL",
//   colId: "pnl",   // ✅ ADD THIS
//   width: 140,
//   sortable: false,
//   filter: false,
//   valueGetter: (p) => {
//     const d: any = p.data;

   
    
//     if (d?.__rowType === "DETAIL") return null;

//     const token = d?.angelOneToken;
//     const live = token ? ltpByTokenRef.current[token] : undefined;
//     const price = Number(d?.price ?? 0);
//     const qty = Number(d?.quantity ?? 0);

//     if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
//     return (live - price) * qty;
//   },
//   cellRenderer: (p: any) => pnlPill(p.value),
// },
//        {
//         headerName: "Type",
//         field: "transactiontype",
//         width: 110,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (row?.__rowType === "DETAIL") return null;

//           const isBuy = params.value === "BUY";
//           const isSell = params.value === "SELL";
//           const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
//           const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";

//           return (
//             <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
//               {params.value || "-"}
//             </span>
//           );
//         },
//       },

//       { headerName: "StrategyUniqueId", field: "strategyUniqueId", width: 220, minWidth: 200 },
//       { headerName: "Instrument", field: "instrumenttype", width: 140 },

//       { headerName: "OrderQty", field: "quantity", width: 120 },
//       { headerName: "TradedQty", field: "fillsize", width: 120 },
//       { headerName: "OrderID", field: "orderid", width: 190 },

//       {
//         headerName: "Status",
//         field: "status",
//         width: 140,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (row?.__rowType === "DETAIL") return null;

//           const status = params.value || row?.orderstatus || row?.orderstatuslocaldb;
//           const color = statusColor(status);
//           return (
//             <span
//               className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
//               style={{ backgroundColor: color }}
//               title={status}
//             >
//               {status || "-"}
//             </span>
//           );
//         },
//       },

//       { headerName: "OrderType", field: "ordertype", width: 130 },
//       { headerName: "ProductType", field: "producttype", width: 130 },
//       { headerName: "TradeID", field: "fillid", width: 140 },

//       {
//         headerName: "Message",
//         field: "text",
//         width: 170,
//         minWidth: 150,
//         wrapText: true,
//         autoHeight: true,
//         cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
//       },

//       { headerName: "Updated Time", field: "updatedAt", width: 290 },
//       { headerName: "Created Time", field: "createdAt", width: 290 },
//     ],
//    [handleSellMain, ocoDraft, ocoSavingKey, submitOcoDraft, clearOcoDraft]
//   );

//   const onGridReady = useCallback((params: GridReadyEvent) => {
//     gridApiRef.current = params.api;
//   }, []);

//   // ✅ Search: min 3 chars -> quick filter
//   const onSearchKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
//     const q = e.currentTarget.value.trim();
//     if (!gridApiRef.current) return;

//     if (!q) {
//       (gridApiRef.current as any)?.setQuickFilter("");
//       return;
//     }
//     if (q.length < 3) return;

//     (gridApiRef.current as any).setQuickFilter(q);
//   }, []);

//   const getRowId = useCallback((params: any) => {
//     const d: any = params.data;
//     if (d?.__rowType === "DETAIL") return d.id;
//     return String(d?.id ?? d?.uniqueorderid ?? d?.orderid);
//   }, []);

//   const isFullWidthRow = useCallback((params: any) => {
//     return params?.rowNode?.data?.__rowType === "DETAIL";
//   }, []);

//   const fullWidthCellRenderer = useCallback((props: any) => {
//     return <DetailRowRenderer {...props} />;
//     //   const d: any = props.data;
//     // if (d?.__rowType === "DETAIL") return 330;
//     // return 50;

//   }, []);

//   const getRowHeight = useCallback((params: RowHeightParams) => {
//     const d: any = params.data;
//     if (d?.__rowType === "DETAIL") return 330;
//     return 50;
//   }, []);

//   return (
//     <div className="p-4 font-sans">
//       <h2 className="mb-3 text-xl font-semibold">Current Position</h2>

//       <div className="flex justify-between items-center gap-6 mb-3">
//         <div className="flex flex-wrap items-center gap-3">
//           <button
//             onClick={handleSquareButton}
//             className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
//           >
//             Square Off
//           </button>

//           <button
//             onClick={fetchOnlineOrdersDetails}
//             className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
//           >
//             Refresh
//           </button>
//         </div>

//         <div className="flex justify-end gap-3 items-center">
//           <div className="w-full sm:w-72">
//             <input
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               onKeyUp={onSearchKeyUp}
//               placeholder="Search (min 3 chars)"
//               className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <button
//             onClick={fetchOrders}
//             className="px-5 py-3 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md border"
//           >
//             Reload
//           </button>
//         </div>
//       </div>

//       {loading && (
//         <div className="flex justify-center items-center h-32 bg-white rounded-lg border">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
//             <p className="text-gray-600">Loading orders...</p>
//           </div>
//         </div>
//       )}

//       {error && !loading && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
//           <div className="text-red-500 text-lg font-medium mb-2">Error</div>
//           <p className="text-red-700">{error}</p>
//           <Button onClick={fetchOrders} className="mt-3 bg-red-500 text-white hover:bg-red-600">
//             Try Again
//           </Button>
//         </div>
//       )}

//       {!loading && !error && (
//         <div className="ag-theme-alpine custom-ag-grid" style={{ height: "650px", width: "100%" }}>
//           <AgGridReact<RowItem>
//             onGridReady={onGridReady}
//             rowData={rowData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             context={{
//             toggleRow,
//             onSellFromSub: handleSellFromSub,
//             ltpByToken: ltpByTokenRef.current,
//             ocoDraft,
//             setOcoDraft,
//             submitOcoDraft,
//             clearOcoDraft,
//             ocoSavingKey,
//           }}
//             getRowId={getRowId}
//             isFullWidthRow={isFullWidthRow}
//             fullWidthCellRenderer={fullWidthCellRenderer}
//             getRowHeight={getRowHeight}
//             pagination={true}
//             paginationPageSize={20}
//             suppressCellFocus={true}
//             animateRows={true}
//             rowSelection="single"
//             enableCellTextSelection={true}
//             ensureDomOrder={true}
//             headerHeight={40}
//             overlayLoadingTemplate={
//               '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
//             }
//             overlayNoRowsTemplate={
//               '<div class="flex flex-col items-center justify-center h-full text-gray-500">No orders match your search criteria</div>'
//             }
//           />
//         </div>
//       )}
//     </div>
//   );
// }



//  end 











// ====================== working code================




// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import axios from "axios";
// import "antd/dist/reset.css";
// import { Button } from "antd";
// import { toast } from "react-toastify";
// import { getSocket } from "../../socket/Socket";
// import { useNavigate } from "react-router";

// import { AgGridReact } from "ag-grid-react";
// import type {
//   ColDef,
//   GridApi,
//   GridReadyEvent,
//   ICellRendererParams,
//   RowHeightParams,
// } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";

// import { FaChevronDown, FaChevronRight } from "react-icons/fa";
// import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

// /** ---------------- TYPES ---------------- */

// type Tick = {
//   mode: 1 | 2 | 3;
//   exchangeType: number;
//   token: string;
//   sequenceNumber: number;
//   exchangeTimestamp: string;
//   ltpPaiseOrRaw: number;
//   ltp: number;
// };

// type ClientOrder = {
//   id?: number;
//   userId?: number;
//   userNameId?: any;
//   broker?: string;

//   variety?: string;
//   ordertype?: string;
//   producttype?: string;
//   duration?: any;

//   price?: number;
//   triggerprice?: any;

//   quantity?: any;
//   disclosedquantity?: any;

//   squareoff?: any; // ✅ use as TARGET price in UI
//   stoploss?: any;  // ✅ use as SL price in UI
//   trailingstoploss?: any;

//   tradingsymbol?: string;
//   transactiontype?: string;
//   exchange?: string;
//   symboltoken?: string;

//   ordertag?: any;
//   instrumenttype?: string;

//   strikeprice?: any;
//   optiontype?: any;
//   expirydate?: any;
//   lotsize?: any;

//   cancelsize?: any;

//   averageprice?: any;
//   filledshares?: any;
//   unfilledshares?: any;

//   orderid?: string;
//   uniqueorderid?: string;
//   parentorderid?: any;

//   exchangeorderid?: any;

//   text?: any;
//   status?: string;
//   orderstatus?: any;
//   orderstatuslocaldb?: any;

//   updatetime?: any;
//   exchtime?: any;
//   exchorderupdatetime?: any;

//   fillid?: any;
//   filltime?: any;
//   fillprice?: any;
//   fillsize?: any;

//   createdAt?: any;
//   updatedAt?: any;

//   totalPrice?: any;
//   actualQuantity?: any;

//   strategyUniqueId?: string;
//   strategyName?: string;
// };

// type Order = ClientOrder & {
//   client_data?: ClientOrder[];
//   __rowType?: "MASTER" | "DETAIL";
//   __isExpanded?: boolean;
// };

// type DetailRow = {
//   __rowType: "DETAIL";
//   id: string;
//   parentId: number | string;
//   parentStrategyUniqueId?: string;
//   client_data: ClientOrder[];
// };

// type RowItem = (Order & { __rowType?: "MASTER" }) | DetailRow;

// /** ---------------- HELPERS ---------------- */

// const statusColor = (status: string) => {
//   const s = String(status || "").toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//   if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//   return "#64748b";
// };

// const pnlPill = (val: number | null | undefined) => {
//   const n = Number(val);
//   const isPositive = n > 0;
//   const isNegative = n < 0;

//   const colorClass = isPositive
//     ? "text-green-700"
//     : isNegative
//     ? "text-red-700"
//     : "text-gray-800";

//   const bgClass = isPositive
//     ? "bg-green-100"
//     : isNegative
//     ? "bg-red-100"
//     : "bg-gray-200";

//   return (
//     <span className={`px-2.5 py-1 rounded-full font-medium ${colorClass} ${bgClass}`}>
//       {Number.isFinite(n) ? n.toFixed(2) : "—"}
//     </span>
//   );
// };

// /** ✅ Inline number input (NO API HIT on blur now) */
// // const NumInlineInput = ({
// //   value,
// //   placeholder,
// //   disabled,
// //   onChangeValue,
// // }: {
// //   value: any;
// //   placeholder?: string;
// //   disabled?: boolean;
// //   onChangeValue: (val: number | null, rawText: string) => void;
// // }) => {
// //   const [v, setV] = useState<string>(value === null || value === undefined ? "" : String(value));

// //   useEffect(() => {
// //     setV(value === null || value === undefined ? "" : String(value));
// //   }, [value]);

// //   return (
// //     <input
// //       value={v}
// //       onChange={(e) => {
// //         const next = e.target.value;
// //         setV(next);

// //         const raw = String(next || "").trim();
// //         const num = raw === "" ? null : Number(raw);

// //         // Do not toast on each keypress
// //         if (raw !== "" && !Number.isFinite(num)) {
// //           onChangeValue(null, next);
// //           return;
// //         }
// //         onChangeValue(num, next);
// //       }}
// //       disabled={disabled}
// //       placeholder={placeholder || "—"}
// //       className="border border-gray-300 px-2 py-1 rounded w-full text-sm"
// //       style={{ maxWidth: 110 }}
// //     />
// //   );
// // };



// const NumInlineInput = ({
//   value,
//   placeholder,
//   disabled,
//   onChangeValue,
// }: {
//   value: any;
//   placeholder?: string;
//   disabled?: boolean;
//   onChangeValue: (val: number | null, rawText: string) => void;
// }) => {
//   const [v, setV] = useState<string>(
//     value === null || value === undefined ? "" : String(value)
//   );

//   const isTypingRef = useRef(false);

//   useEffect(() => {
//     if (isTypingRef.current) return;
//     setV(value === null || value === undefined ? "" : String(value));
//   }, [value]);

//   const commit = useCallback(() => {
//     const raw = String(v || "").trim();
//     const num = raw === "" ? null : Number(raw);

//     // invalid number → don't commit
//     if (raw !== "" && !Number.isFinite(num)) return;

//     onChangeValue(num, raw);
//     isTypingRef.current = false;
//   }, [v, onChangeValue]);

//   return (
//     <input
//       value={v}
//       onFocus={() => {
//         isTypingRef.current = true;
//       }}
//       onChange={(e) => {
//         // ✅ ONLY local typing (NO parent update here)
//         isTypingRef.current = true;
//         setV(e.target.value);
//       }}
//       onBlur={commit}  // ✅ parent update ONLY here
//       onKeyDown={(e) => {
//         if (e.key === "Enter") {
//           e.preventDefault();
//           (e.currentTarget as HTMLInputElement).blur(); // triggers commit
//         }
//         if (e.key === "Escape") {
//           e.preventDefault();
//           isTypingRef.current = false;
//           setV(value === null || value === undefined ? "" : String(value));
//           (e.currentTarget as HTMLInputElement).blur();
//         }
//       }}
//       disabled={disabled}
//       placeholder={placeholder || "—"}
//       className="border border-gray-300 px-2 py-1 rounded w-full text-sm"
//       style={{ maxWidth: 110 }}
//       inputMode="decimal"
//       autoComplete="off"
//     />
//   );
// };


// /** Expand icon cell (only for MASTER rows) */
// const ExpandCellRenderer = (props: ICellRendererParams) => {
//   const data = props.data as any;
//   if (data?.__rowType === "DETAIL") return null;

//   const isExpanded = !!data?.__isExpanded;
//   const toggleRow = props.context?.toggleRow;

//   return (
//     <div className="flex items-center h-full">
//       <button
//         onClick={() => toggleRow?.(data)}
//         className="p-1 rounded hover:bg-gray-100 transition-colors"
//         title={isExpanded ? "Collapse" : "Expand"}
//       >
//         {isExpanded ? (
//           <FaChevronDown className="w-3 h-3 text-gray-600" />
//         ) : (
//           <FaChevronRight className="w-3 h-3 text-gray-600" />
//         )}
//       </button>
//     </div>
//   );
// };

// /** Sell button */
// const SellButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => {
//   return (
//     <button
//       onClick={() => !disabled && onClick()}
//       disabled={disabled}
//       onMouseEnter={(e) => {
//         if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #b91c1c, #7f1d1d)";
//       }}
//       onMouseLeave={(e) => {
//         if (!disabled) e.currentTarget.style.background = "linear-gradient(to right, #ef4444, #dc2626)";
//       }}
//       style={{
//         display: "inline-flex",
//         alignItems: "center",
//         gap: "6px",
//         padding: "4px 14px",
//         borderRadius: "16px",
//         fontSize: "12px",
//         fontWeight: 600,
//         letterSpacing: "0.5px",
//         border: "none",
//         color: "#fff",
//         background: disabled ? "#9ca3af" : "linear-gradient(to right, #ef4444, #dc2626)",
//         cursor: disabled ? "not-allowed" : "pointer",
//         opacity: disabled ? 0.6 : 1,
//         transition: "all 0.2s ease-in-out",
//       }}
//       title={disabled ? "Already Sold" : "Click to Sell"}
//     >
//       <span style={{ fontSize: "13px", lineHeight: 1 }}>⬇</span>
//       SELL
//     </button>
//   );
// };

// /** ✅ Target+Stoploss Action Icons */
// const OcoActionIcons = ({
//   disabled,
//   title,
//   onOk,
//   onCancel,
//   okLoading,
// }: {
//   disabled: boolean;
//   title?: string;
//   onOk: () => void;
//   onCancel: () => void;
//   okLoading?: boolean;
// }) => {
//   return (
//     <div className="flex items-center gap-2 justify-center">
//       <button
//         disabled={disabled || !!okLoading}
//         onClick={() => !disabled && !okLoading && onOk()}
//         title={title || "Submit Target + Stoploss"}
//         className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
//         style={{ lineHeight: 0 }}
//       >
//         <FaCheckCircle className="w-4 h-4" style={{ color: disabled ? "#9ca3af" : "#16a34a" }} />
//       </button>

//       <button
//         disabled={disabled || !!okLoading}
//         onClick={() => !disabled && !okLoading && onCancel()}
//         title="Clear (reset)"
//         className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
//         style={{ lineHeight: 0 }}
//       >
//         <FaTimesCircle className="w-4 h-4" style={{ color: disabled ? "#9ca3af" : "#ef4444" }} />
//       </button>

//       {okLoading ? (
//         <span className="text-xs text-gray-500 ml-1">Saving...</span>
//       ) : null}
//     </div>
//   );
// };

// /** ---------------- DETAIL ROW (SUBTABLE) ---------------- */
// const DetailRowRenderer = (props: any) => {
//   const row = props.data as DetailRow;
//   const { onSellFromSub, ltpByToken, ocoDraft, setOcoDraft, submitOcoDraft, clearOcoDraft, ocoSavingKey } =
//     props.context || {};

//   const subColumnDefs: ColDef<ClientOrder>[] = [
//     {
//       headerName: "Action",
//       width: 120,
//       sortable: false,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const r: ClientOrder = params.data;
//         if (!r) return null;

//         const disabled = String(r.transactiontype || "").toUpperCase() === "SELL";
//         return <SellButton disabled={disabled} onClick={() => onSellFromSub?.(r, row.parentStrategyUniqueId)} />;
//       },
//     },

//     { headerName: "UserId", field: "userNameId", width: 120 },
//     { headerName: "Broker", field: "broker", width: 130 },

//     { headerName: "StrategyUniqueId", field: "strategyUniqueId", width: 220, minWidth: 200 },
//     { headerName: "SYMBOL", field: "tradingsymbol", width: 160 },
//     { headerName: "Instrument", field: "instrumenttype", width: 140 },

//     {
//       headerName: "Type",
//       field: "transactiontype",
//       width: 110,
//       cellRenderer: (params: any) => {
//         const isBuy = params.value === "BUY";
//         const isSell = params.value === "SELL";
//         const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
//         const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";

//         return (
//           <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
//             {params.value || "-"}
//           </span>
//         );
//       },
//     },

//     { headerName: "OrderType", field: "ordertype", width: 130 },
//     { headerName: "ProductType", field: "producttype", width: 130 },
//     { headerName: "Price", field: "price", width: 110 },

//     // ✅ Target input (draft only)
//     {
//       headerName: "Target",
//       width: 120,
//       sortable: false,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const r: ClientOrder = params.data;
//         if (!r?.orderid) return null;

//         const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
//         const key = String(r.orderid);

//         const draft = ocoDraft?.[key] || {};
//         const value = draft.targetPrice ?? r.squareoff ?? "";

//         return (
//           <NumInlineInput
//             value={value}
//             placeholder="Target"
//             disabled={!isBuy}
//             onChangeValue={(val) => {
//               if (!isBuy) return;
//               setOcoDraft?.((prev: any) => ({
//                 ...(prev || {}),
//                 [key]: {
//                   ...(prev?.[key] || {}),
//                   targetPrice: val,
//                   stoplossPrice: prev?.[key]?.stoplossPrice ?? (r.stoploss ?? null),
//                   orderId: r.orderid,
//                   strategyUniqueId: row.parentStrategyUniqueId || r.strategyUniqueId || "",
//                   userId: r.userNameId,
//                   broker: r.broker,
//                 },
//               }));
//             }}
//           />
//         );
//       },
//     },

//     // ✅ Stoploss input (draft only)
//     {
//       headerName: "Stoploss",
//       width: 120,
//       sortable: false,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const r: ClientOrder = params.data;
//         if (!r?.orderid) return null;

//         const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
//         const key = String(r.orderid);

//         const draft = ocoDraft?.[key] || {};
//         const value = draft.stoplossPrice ?? r.stoploss ?? "";

//         return (
//           <NumInlineInput
//             value={value}
//             placeholder="SL"
//             disabled={!isBuy}
//             onChangeValue={(val) => {
//               if (!isBuy) return;
//               setOcoDraft?.((prev: any) => ({
//                 ...(prev || {}),
//                 [key]: {
//                   ...(prev?.[key] || {}),
//                   stoplossPrice: val,
//                   targetPrice: prev?.[key]?.targetPrice ?? (r.squareoff ?? null),
//                   orderId: r.orderid,
//                   strategyUniqueId: row.parentStrategyUniqueId || r.strategyUniqueId || "",
//                   userId: r.userNameId,
//                   broker: r.broker,
//                 },
//               }));
//             }}
//           />
//         );
//       },
//     },

//     // ✅ ✅/❌ column (submit both together)
//     {
//       headerName: "OCO",
//       width: 90,
//       sortable: false,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const r: ClientOrder = params.data;
//         if (!r?.orderid) return null;

//         const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
//         const key = String(r.orderid);

//         const draft = ocoDraft?.[key] || {};
//         const t = draft.targetPrice ?? null;
//         const sl = draft.stoplossPrice ?? null;

//         const canSubmit =
//           isBuy &&
//           Number.isFinite(Number(t)) &&
//           Number.isFinite(Number(sl)) &&
//           Number(t) > 0 &&
//           Number(sl) > 0;

//         const saving = ocoSavingKey === key;

//         return (
//           <OcoActionIcons
//             disabled={!canSubmit}
//             okLoading={saving}
//             title={!canSubmit ? "Fill both Target and Stoploss first" : "Submit Target+Stoploss"}
//             onOk={() => submitOcoDraft?.(key)}
//             onCancel={() => clearOcoDraft?.(key)}
//           />
//         );
//       },
//     },

//     {
//       headerName: "LTP",
//       width: 110,
//       sortable: false,
//       filter: false,
//       valueGetter: (p) => {
//         const t = p.data?.symboltoken;
//         return t ? ltpByToken?.[t] : undefined;
//       },
//       cellRenderer: (p: any) => (p.value !== undefined ? p.value : "—"),
//     },

//     {
//       headerName: "PnL",
//       width: 140,
//       sortable: false,
//       filter: false,
//       valueGetter: (p) => {
//         const token = p.data?.symboltoken;
//         const live = token ? ltpByToken?.[token] : undefined;
//         const price = Number(p.data?.price ?? 0);
//         const qty = Number(p.data?.quantity ?? 0);
//         if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
//         return (live - price) * qty;
//       },
//       cellRenderer: (p: any) => pnlPill(p.value),
//     },

//     { headerName: "OrderQty", field: "quantity", width: 120 },
//     { headerName: "TradedQty", field: "fillsize", width: 120 },
//     { headerName: "OrderID", field: "orderid", width: 190 },
//     { headerName: "TradeID", field: "fillid", width: 140 },

//     {
//       headerName: "Status",
//       field: "status",
//       width: 140,
//       cellRenderer: (params: any) => {
//         const status = params.value || params.data?.orderstatus || params.data?.orderstatuslocaldb;
//         const color = statusColor(status);
//         return (
//           <span
//             className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
//             style={{ backgroundColor: color }}
//             title={status}
//           >
//             {status || "-"}
//           </span>
//         );
//       },
//     },

//     {
//       headerName: "Message",
//       field: "text",
//       width: 470,
//       minWidth: 350,
//       wrapText: true,
//       autoHeight: true,
//       cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
//     },

//     { headerName: "Updated Time", field: "updatedAt", width: 290 },
//     { headerName: "Created Time", field: "createdAt", width: 290 },
//   ];

//   const subDefaultColDef = useMemo(
//     () => ({
//       resizable: true,
//       sortable: true,
//       filter: true,
//     }),
//     []
//   );

//   return (
//     <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mx-2 my-2">
//       <div className="text-sm font-semibold text-gray-700 mb-2">
//         Client Orders ({row.client_data?.length || 0})
//       </div>

//       <div className="ag-theme-alpine" style={{ width: "100%", height: "280px" }}>
//         <AgGridReact<ClientOrder>
//           rowData={row.client_data || []}
//           columnDefs={subColumnDefs}
//           defaultColDef={subDefaultColDef}
//           pagination={true}
//           paginationPageSize={10}
//           rowHeight={50}
//           headerHeight={40}
//           suppressCellFocus={true}
//           animateRows={true}
//           enableCellTextSelection={true}
//           ensureDomOrder={true}
//           overlayLoadingTemplate={
//             '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
//           }
//           overlayNoRowsTemplate={
//             '<div class="flex flex-col items-center justify-center h-full text-gray-500">No orders match your search criteria</div>'
//           }
//         />
//       </div>
//     </div>
//   );
// };

// /** ---------------- MAIN COMPONENT ---------------- */

// export default function OrderTableAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const navigate = useNavigate();

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [rawOrders, setRawOrders] = useState<Order[]>([]);
//   const [rowData, setRowData] = useState<RowItem[]>([]);
//   const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [searchTerm, setSearchTerm] = useState("");

//   // token -> ltp
//   const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});

//   // ✅ Draft state for OCO inputs (orderId -> {targetPrice, stoplossPrice, ...payload})
//   const [ocoDraft, setOcoDraft] = useState<Record<string, any>>({});
//   const [ocoSavingKey, setOcoSavingKey] = useState<string | null>(null);

//   const authHeader = useMemo(
//     () => ({
//       Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//       userid: localStorage.getItem("userID") || "",
//     }),
//     []
//   );

//   // ---------------- SOCKET ----------------
//   useEffect(() => {
//     const socket = getSocket();

//     const onTick = (tick: Tick) => {
//       setLtpByToken((prev) => {
//         const curr = prev[tick.token];
//         if (curr === tick.ltp) return prev;
//         return { ...prev, [tick.token]: tick.ltp };
//       });
//     };

//     socket.on("tick", onTick);
//     return () => {
//       socket.off("tick", onTick);
//     };
//   }, []);

//   // ---------------- AUTH FAIL ----------------
//   const handleUnauthorized = useCallback(() => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     localStorage.removeItem("termsAccepted");
//     localStorage.removeItem("feed_token");
//     localStorage.removeItem("refresh_token");
//     toast.error("Unauthorized User");
//     navigate("/");
//   }, [navigate]);

//   // ---------------- FETCH ORDERS ----------------
//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const { data } = await axios.get(`${apiUrl}/admin/get/table/order`, {
//         headers: authHeader,
//       });

//       if (data?.status === true) {
//         const list = Array.isArray(data.data) ? data.data : [];
//         setRawOrders(list);
//         setExpandedIds(new Set());
//         // keep drafts (optional) OR clear drafts:
//         // setOcoDraft({});
//       } else if (data?.status === false && data?.message === "Unauthorized") {
//         handleUnauthorized();
//       } else {
//         toast.error(data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   }, [apiUrl, authHeader, handleUnauthorized]);

//   useEffect(() => {
//     fetchOrders();
//   }, [fetchOrders]);

//   /** ✅ API: Submit Target+SL together (only on ✅ click) */
//   const submitOcoDraft = useCallback(
//     async (orderIdKey: string) => {
//       const d = ocoDraft?.[orderIdKey];
//       if (!d?.orderId) return;

//       const targetPrice = d?.targetPrice;
//       const stoplossPrice = d?.stoplossPrice;

//       if (!Number.isFinite(Number(targetPrice)) || !Number.isFinite(Number(stoplossPrice))) {
//         toast.error("Fill valid Target & Stoploss");
//         return;
//       }

//       const payload = {
//         orderId: String(d.orderId),
//         strategyUniqueId: String(d.strategyUniqueId || ""),
//         targetPrice: Number(targetPrice),
//         stoplossPrice: Number(stoplossPrice),
//         userId: d.userId,
//         broker: d.broker,
//       };  

//       try {
//         setOcoSavingKey(orderIdKey);

//         const res = await axios.post(`${apiUrl}/admin/multiple/targetstoploss/order`, payload, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
//         });

//         if (res.data?.status === true) {
//           toast.success(res.data?.message || "OCO updated");
//           // clear draft for this orderId
//           setOcoDraft((prev) => {
//             const next = { ...(prev || {}) };
//             delete next[orderIdKey];
//             return next;
//           });
//           fetchOrders();
//         } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//           handleUnauthorized();
//         } else {
//           toast.error(res.data?.message || "Failed to update OCO");
//         }
//       } catch (err: any) {
//         toast.error(err?.message || "Failed to update OCO");
//       } finally {
//         setOcoSavingKey(null);
//       }
//     },
//     [apiUrl, fetchOrders, handleUnauthorized, ocoDraft]
//   );

//   /** ❌ Clear draft for an orderId */
//   const clearOcoDraft = useCallback((orderIdKey: string) => {
//     setOcoDraft((prev) => {
//       const next = { ...(prev || {}) };
//       delete next[orderIdKey];
//       return next;
//     });
//   }, []);

//   /** build rows with DETAIL row after expanded master */
//   const buildRows = useCallback((orders: Order[], expanded: Set<number | string>) => {
//     const rows: RowItem[] = [];

//     for (const o of orders) {
//       const masterId = (o.id ?? o.uniqueorderid ?? o.orderid) as any;
//       const isExpanded = expanded.has(masterId);

//       rows.push({
//         ...o,
//         __rowType: "MASTER",
//         __isExpanded: isExpanded,
//       });

//       if (isExpanded) {
//         rows.push({
//           __rowType: "DETAIL",
//           id: `detail-${String(masterId)}`,
//           parentId: masterId,
//           parentStrategyUniqueId: o.strategyUniqueId,
//           client_data: Array.isArray(o.client_data) ? o.client_data : [],
//         });
//       }
//     }

//     return rows;
//   }, []);

//   useEffect(() => {
//     setRowData(buildRows(rawOrders, expandedIds));
//   }, [rawOrders, expandedIds, buildRows]);

//   const toggleRow = useCallback((masterRow: Order) => {
//     const masterId = (masterRow.id ?? masterRow.uniqueorderid ?? masterRow.orderid) as any;

//     setExpandedIds((prev) => {
//       const next = new Set(prev);
//       if (next.has(masterId)) next.delete(masterId);
//       else next.add(masterId);
//       return next;
//     });
//   }, []);

//   // ---------------- ACTIONS ----------------
//   const handleSquareButton = useCallback(async () => {
//     const ok = window.confirm("Do you want to Square Off this order?");
//     if (!ok) return;

//     try {
//       const res = await axios.get(`${apiUrl}/admin/sequareoff`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
//       });

//       if (res.data?.status === true) {
//         toast.success(res.data?.message || "Square off done");
//         fetchOrders();
//       } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//         handleUnauthorized();
//       } else {
//         toast.error(res.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//     }
//   }, [apiUrl, fetchOrders, handleUnauthorized]);

//   const fetchOnlineOrdersDetails = useCallback(async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/fetchorderdetails`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
//       });

//       if (res.data?.status === true) {
//         fetchOrders();
//       } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//         handleUnauthorized();
//       }
//     } catch (err: any) {}
//   }, [apiUrl, fetchOrders, handleUnauthorized]);

//   /** ✅ MAIN SELL */
//   const handleSellMain = useCallback(
//     async (row: Order) => {
//       if (!row?.orderid) {
//         toast.error("Order ID not found");
//         return;
//       }

//       const strategyUniqueId = row?.strategyUniqueId || "";

//       const ok = window.confirm(
//         `Do you want to SELL this order?\nOrder ID: ${row.orderid}\nStrategy: ${strategyUniqueId || "-"}`
//       );
//       if (!ok) return;

//       try {
//         const res = await axios.post(
//           `${apiUrl}/admin/group/squareoff`,
//           { orderId: row.orderid, strategyUniqueId },
//           { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
//         );

//         if (res.data?.status === true) {
//           toast.success(`Order ${row.orderid} squared off successfully`);
//           fetchOrders();
//         } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//           handleUnauthorized();
//         } else {
//           toast.error(res.data?.message || "Failed to square off");
//         }
//       } catch (err: any) {
//         toast.error(err?.message || "Something went wrong");
//       }
//     },
//     [apiUrl, fetchOrders, handleUnauthorized]
//   );

//   /** ✅ SUB SELL */
//   const handleSellFromSub = useCallback(
//     async (clientRow: ClientOrder, parentStrategyUniqueId?: string) => {
//       if (!clientRow?.orderid) {
//         toast.error("Order ID not found");
//         return;
//       }

//       const strategyUniqueId = parentStrategyUniqueId || clientRow.strategyUniqueId || "";

//       const ok = window.confirm(
//         `Do you want to SELL this order?\nOrder ID: ${clientRow.orderid}\nStrategy: ${strategyUniqueId || "-"}`
//       );
//       if (!ok) return;

//       try {
//         const res = await axios.post(
//           `${apiUrl}/admin/single/squareoff`,
//           { orderId: clientRow.orderid, strategyUniqueId },
//           { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
//         );

//         if (res.data?.status === true) {
//           toast.success(`Order ${clientRow.orderid} squared off successfully`);
//           fetchOrders();
//         } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
//           handleUnauthorized();
//         } else {
//           toast.error(res.data?.message || "Failed to square off");
//         }
//       } catch (err: any) {
//         toast.error(err?.message || "Something went wrong");
//       }
//     },
//     [apiUrl, fetchOrders, handleUnauthorized]
//   );

//   // ---------------- GRID ----------------
//   const defaultColDef = useMemo<ColDef<RowItem>>(
//     () => ({
//       resizable: true,
//       sortable: true,
//       filter: true,
//     }),
//     []
//   );

//   const columnDefs = useMemo<ColDef<RowItem>[]>(
//     () => [
//       {
//         headerName: "",
//         width: 55,
//         minWidth: 55,
//         maxWidth: 55,
//         cellRenderer: ExpandCellRenderer,
//         sortable: false,
//         filter: false,
//         resizable: false,
//       },

//       {
//         headerName: "Action",
//         width: 120,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (!row || row.__rowType === "DETAIL") return null;

//           const disabled = String(row.transactiontype || "").toUpperCase() === "SELL";
//           return <SellButton  disabled={disabled} onClick={() => handleSellMain(row)}  />;
//         },
//       },

//       { headerName: "SYMBOL", field: "tradingsymbol", width: 200 },

     

//       { headerName: "Price", field: "price", width: 110 },

//       // ✅ Target (draft only) + API only on ✅
//       {
//         headerName: "Target",
//         width: 120,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (!row || row.__rowType === "DETAIL") return null;
//           if (!row?.orderid) return null;

//           const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
//           const key = String(row.orderid);

//           const draft = ocoDraft?.[key] || {};
//           const value = draft.targetPrice ?? row.squareoff ?? "";

//           return (
//             <NumInlineInput
//               value={value}
//               placeholder="Target"
//               disabled={!isBuy}
//               onChangeValue={(val) => {
//                 if (!isBuy) return;
//                 setOcoDraft((prev) => ({
//                   ...(prev || {}),
//                   [key]: {
//                     ...(prev?.[key] || {}),
//                     targetPrice: val,
//                     stoplossPrice: prev?.[key]?.stoplossPrice ?? (row.stoploss ?? null),
//                     orderId: row.orderid,
//                     strategyUniqueId: row.strategyUniqueId || "",
//                     userId: row.userId,
//                     broker: row.broker,
//                   },
//                 }));
//               }}
//             />
//           );
//         },
//       },

//       // ✅ Stoploss (draft only)
//       {
//         headerName: "Stoploss",
//         width: 120,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (!row || row.__rowType === "DETAIL") return null;
//           if (!row?.orderid) return null;

//           const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
//           const key = String(row.orderid);

//           const draft = ocoDraft?.[key] || {};
//           const value = draft.stoplossPrice ?? row.stoploss ?? "";

//           return (
//             <NumInlineInput
//               value={value}
//               placeholder="SL"
//               disabled={!isBuy}
//               onChangeValue={(val) => {
//                 if (!isBuy) return;
//                 setOcoDraft((prev) => ({
//                   ...(prev || {}),
//                   [key]: {
//                     ...(prev?.[key] || {}),
//                     stoplossPrice: val,
//                     targetPrice: prev?.[key]?.targetPrice ?? (row.squareoff ?? null),
//                     orderId: row.orderid,
//                     strategyUniqueId: row.strategyUniqueId || "",
//                     userId: row.userId,
//                     broker: row.broker,
//                   },
//                 }));
//               }}
//             />
//           );
//         },
//       },

//       // ✅ ✅/❌ icons column for MAIN row also
//       {
//         headerName: "OCO",
//         width: 90,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (!row || row.__rowType === "DETAIL") return null;
//           if (!row?.orderid) return null;

//           const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
//           const key = String(row.orderid);

//           const draft = ocoDraft?.[key] || {};
//           const t = draft.targetPrice ?? null;
//           const sl = draft.stoplossPrice ?? null;

//           const canSubmit =
//             isBuy &&
//             Number.isFinite(Number(t)) &&
//             Number.isFinite(Number(sl)) &&
//             Number(t) > 0 &&
//             Number(sl) > 0;

//           const saving = ocoSavingKey === key;

//           return (
//             <OcoActionIcons
//               disabled={!canSubmit}
//               okLoading={saving}
//               title={!canSubmit ? "Fill both Target and Stoploss first" : "Submit Target+Stoploss"}
//               onOk={() => submitOcoDraft(key)}
//               onCancel={() => clearOcoDraft(key)}
//             />
//           );
//         },
//       },

//       {
//         headerName: "CMP",
//         width: 110,
//         sortable: false,
//         filter: false,
//         valueGetter: (p) => {
//           const d: any = p.data;
//           if (d?.__rowType === "DETAIL") return undefined;
//           const t = d?.symboltoken;
//           return t ? ltpByToken[t] : undefined;
//         },
//         cellRenderer: (p: any) => (p.value !== undefined ? p.value : "—"),
//       },

//       {
//         headerName: "PnL",
//         width: 140,
//         sortable: false,
//         filter: false,
//         valueGetter: (p) => {
//           const d: any = p.data;
//           if (d?.__rowType === "DETAIL") return null;

//           const token = d?.symboltoken;
//           const live = token ? ltpByToken[token] : undefined;
//           const price = Number(d?.price ?? 0);
//           const qty = Number(d?.quantity ?? 0);
//           if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
//           return (live - price) * qty;
//         },
//         cellRenderer: (p: any) => pnlPill(p.value),
//       },
//        {
//         headerName: "Type",
//         field: "transactiontype",
//         width: 110,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (row?.__rowType === "DETAIL") return null;

//           const isBuy = params.value === "BUY";
//           const isSell = params.value === "SELL";
//           const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
//           const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";

//           return (
//             <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
//               {params.value || "-"}
//             </span>
//           );
//         },
//       },

//       { headerName: "StrategyUniqueId", field: "strategyUniqueId", width: 220, minWidth: 200 },
//       { headerName: "Instrument", field: "instrumenttype", width: 140 },

//       { headerName: "OrderQty", field: "quantity", width: 120 },
//       { headerName: "TradedQty", field: "fillsize", width: 120 },
//       { headerName: "OrderID", field: "orderid", width: 190 },

//       {
//         headerName: "Status",
//         field: "status",
//         width: 140,
//         cellRenderer: (params: any) => {
//           const row: any = params.data;
//           if (row?.__rowType === "DETAIL") return null;

//           const status = params.value || row?.orderstatus || row?.orderstatuslocaldb;
//           const color = statusColor(status);
//           return (
//             <span
//               className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
//               style={{ backgroundColor: color }}
//               title={status}
//             >
//               {status || "-"}
//             </span>
//           );
//         },
//       },

//       { headerName: "OrderType", field: "ordertype", width: 130 },
//       { headerName: "ProductType", field: "producttype", width: 130 },
//       { headerName: "TradeID", field: "fillid", width: 140 },

//       {
//         headerName: "Message",
//         field: "text",
//         width: 170,
//         minWidth: 150,
//         wrapText: true,
//         autoHeight: true,
//         cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
//       },

//       { headerName: "Updated Time", field: "updatedAt", width: 290 },
//       { headerName: "Created Time", field: "createdAt", width: 290 },
//     ],
//     [handleSellMain, ltpByToken, ocoDraft, ocoSavingKey, submitOcoDraft, clearOcoDraft]
//   );

//   const onGridReady = useCallback((params: GridReadyEvent) => {
//     gridApiRef.current = params.api;
//   }, []);

//   // ✅ Search: min 3 chars -> quick filter
//   const onSearchKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
//     const q = e.currentTarget.value.trim();
//     if (!gridApiRef.current) return;

//     if (!q) {
//       (gridApiRef.current as any)?.setQuickFilter("");
//       return;
//     }
//     if (q.length < 3) return;

//     (gridApiRef.current as any).setQuickFilter(q);
//   }, []);

//   const getRowId = useCallback((params: any) => {
//     const d: any = params.data;
//     if (d?.__rowType === "DETAIL") return d.id;
//     return String(d?.id ?? d?.uniqueorderid ?? d?.orderid);
//   }, []);

//   const isFullWidthRow = useCallback((params: any) => {
//     return params?.rowNode?.data?.__rowType === "DETAIL";
//   }, []);

//   const fullWidthCellRenderer = useCallback((props: any) => {
//     return <DetailRowRenderer {...props} />;
//   }, []);

//   const getRowHeight = useCallback((params: RowHeightParams) => {
//     const d: any = params.data;
//     if (d?.__rowType === "DETAIL") return 330;
//     return 50;
//   }, []);

//   return (
//     <div className="p-4 font-sans">
//       <h2 className="mb-3 text-xl font-semibold">Current Position</h2>

//       <div className="flex justify-between items-center gap-6 mb-3">
//         <div className="flex flex-wrap items-center gap-3">
//           <button
//             onClick={handleSquareButton}
//             className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
//           >
//             Square Off
//           </button>

//           <button
//             onClick={fetchOnlineOrdersDetails}
//             className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
//           >
//             Refresh
//           </button>
//         </div>

//         <div className="flex justify-end gap-3 items-center">
//           <div className="w-full sm:w-72">
//             <input
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               onKeyUp={onSearchKeyUp}
//               placeholder="Search (min 3 chars)"
//               className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <button
//             onClick={fetchOrders}
//             className="px-5 py-3 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md border"
//           >
//             Reload
//           </button>
//         </div>
//       </div>

//       {loading && (
//         <div className="flex justify-center items-center h-32 bg-white rounded-lg border">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
//             <p className="text-gray-600">Loading orders...</p>
//           </div>
//         </div>
//       )}

//       {error && !loading && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
//           <div className="text-red-500 text-lg font-medium mb-2">Error</div>
//           <p className="text-red-700">{error}</p>
//           <Button onClick={fetchOrders} className="mt-3 bg-red-500 text-white hover:bg-red-600">
//             Try Again
//           </Button>
//         </div>
//       )}

//       {!loading && !error && (
//         <div className="ag-theme-alpine custom-ag-grid" style={{ height: "650px", width: "100%" }}>
//           <AgGridReact<RowItem>
//             onGridReady={onGridReady}
//             rowData={rowData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             context={{
//               toggleRow,
//               onSellFromSub: handleSellFromSub,
//               ltpByToken,

//               // ✅ OCO draft + actions available for subtable renderer
//               ocoDraft,
//               setOcoDraft,
//               submitOcoDraft,
//               clearOcoDraft,
//               ocoSavingKey,
//             }}
//             getRowId={getRowId}
//             isFullWidthRow={isFullWidthRow}
//             fullWidthCellRenderer={fullWidthCellRenderer}
//             getRowHeight={getRowHeight}
//             pagination={true}
//             paginationPageSize={20}
//             suppressCellFocus={true}
//             animateRows={true}
//             rowSelection="single"
//             enableCellTextSelection={true}
//             ensureDomOrder={true}
//             headerHeight={40}
//             overlayLoadingTemplate={
//               '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
//             }
//             overlayNoRowsTemplate={
//               '<div class="flex flex-col items-center justify-center h-full text-gray-500">No orders match your search criteria</div>'
//             }
//           />
//         </div>
//       )}
//     </div>
//   );
// }
