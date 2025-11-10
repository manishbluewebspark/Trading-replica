
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "antd/dist/reset.css";
import { getSocket } from "../../socket/Socket";


type LiteTick = { token: string; ltp: number };



/** ====== Trade row type (from API) ====== **/
type Trade = {
  exchange: string;
  producttype: string;
  symboltoken: string;
  tradingsymbol: string;
  instrumenttype: string;
  optiontype: string;
  transactiontype: string; // "BUY" | "SELL"
  orderid: string;
  uniqueorderid: string;
  lotsize:string;
  price:string;
  createdAt:string
  status:string;
  variety:string;
  ordertype:string;
  exchtime:string;
  fillid:string;
  token:string;
  fillsize:string;
  symbolgroup:string;
  expirydate:string;
  filltime:string;
};

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

const PAGE_SIZE_DEFAULT = 100;

const td: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  color: "#0f172a",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 13,
  color: "#475569",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  zIndex: 1,
};

const btn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: disabled ? "#f1f5f9" : "white",
  color: disabled ? "#94a3b8" : "#0f172a",
  cursor: disabled ? "not-allowed" : "pointer",
});

/** Soft row color based on transaction type */
const rowBg = (txn: string): React.CSSProperties => {
  const s = (txn || "").toLowerCase();
  if (s === "buy")
    return { backgroundColor: "rgba(22,163,74,0.08)" }; // soft green
  if (s === "sell")
    return { backgroundColor: "rgba(239,68,68,0.08)" }; // soft red
  return {};
};



export default function TradeTables() {

  const apiUrl = import.meta.env.VITE_API_URL;



  const [trades, setTrades] = useState<Trade[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live ticks: keep a token -> current LTP map
const [ltpByToken, setLtpByToken] = useState<Record<string, LiteTick>>({});

 
      

  // simple UI states
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 250);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_DEFAULT);
  const [page, setPage] = useState<number>(1);



  // Socket: listen to "tick" and update the LTP map
  useEffect(() => {
    const socket = getSocket();

    const onTick = (tick:any) => {

      // console.log(tick);

      setLtpByToken({ token:tick.token, ltp: tick.ltp });
      

    };

    socket.on("tick", onTick);

 
  }, []);

  // Fetch table data
  useEffect(() => {
    let cancelled = false;

    async function fetchTrades() {
      try {
        const res = await axios.get(`${apiUrl}/order/get/table/tradebook`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });
        

        if (!cancelled) {
          if (res.data?.status === true) {
            setTrades(res.data.data || []);
            setLoading(false);
          } else {
            setLoading(false);
            toast.error(res.data?.message || "Something went wrong");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setLoading(false);
          setError(err?.message || "Failed to load trades");
        }
      }
    }

    fetchTrades();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  // reset to page 1 on search or page size change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  // filter by search

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return trades;

    return trades.filter((t) => {
      const haystack =
        [
          t.fillid,
          t.orderid,
          t.tradingsymbol,
          t.transactiontype,
          t.producttype,
          t.exchange,
          t.instrumenttype,
          t.symbolgroup,
          t.optiontype,
          t.expirydate,
          t.filltime,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() 
      return haystack.includes(q);
    });
  }, [trades, debouncedSearch]);




  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

 
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      {/* <h2 style={{ marginBottom: 12 }}>Trades</h2> */}

    
      
      {/* Table */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }} className="max-w-[1080px]">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Order ID",               
                  "Symbol",               
                  "Transaction Type",                 
                  "Fill Price",
                  "Current Price",
                   "Quantity",
                    "PnL",
                   "Time",
                    "Exchange",
                   "Product",
                    "Token",
                   "variety",
                  "ordertype",
                  "Status",
                  "CreateAt",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={13} style={{ padding: 16, textAlign: "center" }}>
                    Loading trades…
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={13} style={{ padding: 16, color: "#ef4444" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && current.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                    No trades found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                current.map((t) => {
                  const live = t.token ? ltpByToken?.token : undefined;
                  return (
                    <tr key={t.fillid} style={{ borderBottom: "1px solid #f1f5f9", ...rowBg(t.transactiontype) }}>
                     

                      
                      <td style={td}>{t.orderid}</td>
                     
                      <td style={td}>{t.tradingsymbol}</td>
                   
                      <td style={td} title={t.transactiontype}>
                        <strong>{t.transactiontype}</strong>
                      </td>
                    
                     
                      <td style={td}>{t.price}</td>
                      <td style={{ ...td, fontWeight: 600 }}>
                        {live}
                      </td>
                       <td style={td}>{t.lotsize}</td>
                         <td style={td}>    {live !== undefined ? live.toFixed(2) : "—"}</td>
                        <td style={td}>
                      {t.exchtime ? t.exchtime.split(" ")[1].slice(0, 5) : ""}
                    </td>
                   
                     <td style={td}>{t.exchange}</td>
                        <td style={td}>{t.producttype}</td>
                         <td style={td}>{t.symboltoken}</td>
                        <td style={td}>{t.variety}</td>
                      <td style={td}>{t.ordertype}</td>
                        <td style={td}>{t.status}</td>
                       
                     
                       <td style={td}>{t.createdAt}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            Showing <strong>{current.length}</strong> of <strong>{filtered.length}</strong> filtered (
            {trades.length} total)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={btn(page === 1)}>
              Prev
            </button>
            <span style={{ fontSize: 13 }}>
              Page <strong>{page}</strong> / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={btn(page >= totalPages)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
       {/* ✅ Modal Form */}
  
    </div>
  );
}
