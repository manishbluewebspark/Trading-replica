import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

import { Select, DatePicker } from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css"; // or "antd/dist/antd.css" for older versions


/** ====== Types ====== **/
type Trade = {
  exchange: string;
  producttype: string;
  tradingsymbol: string;
  instrumenttype: string;
  symbolgroup: string;
  strikeprice: string;
  optiontype: string;
  expirydate: string;
  marketlot: string;
  precision: string;
  multiplier: string;
  tradevalue: string;      // e.g. "175.00"
  transactiontype: string; // BUY / SELL
  fillprice: string;       // e.g. "175.00"
  fillsize: string;        // e.g. "1"
  orderid: string;         // broker order id
  fillid: string;          // unique trade id
  filltime: string;        // e.g. "13:27:53"
};

/** ====== Utils ====== **/
function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

const PAGE_SIZE_DEFAULT = 10;

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

/** ====== Component ====== **/
export default function TradeTables() {


   const apiUrl = import.meta.env.VITE_API_URL;

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 250);

  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_DEFAULT);
  const [page, setPage] = useState<number>(1);

  const [selectedScrip, setSelectedScrip] = useState<string>("All Scrips");
const [selectedStrategy, setSelectedStrategy] = useState<string>("All Strategy");
const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrades() {
      setLoading(true);
      setError(null);
      try {
        // 👇 change URL if your route differs
        const {data}  = await axios.get(`${apiUrl}/order/get/trade/book`,
             {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          }
        );

        console.log(data);
        

        if(data.status==true) {

        setTrades(data.data||[]);

       }else if(data.status==false&&data.message=='Unauthorized'){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");
           
       }else{
          // alert(data?.message)
       }


        

       
        


        // if (!cancelled) {
        //   if (data?.status === true && Array.isArray(data.data)) {
        //     setTrades(data.data as Trade[]);
        //   } else {
        //     setTrades([]);
        //   }
        // }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load trades");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrades();
    return () => {
      cancelled = true;
    };
  }, []);

  // reset to page 1 whenever search or page size changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

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
          .toLowerCase() +
        ` ${t.fillprice ?? ""} ${t.fillsize ?? ""} ${t.tradevalue ?? ""} ${t.strikeprice ?? ""}`;
      return haystack.includes(q);
    });
  }, [trades, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(trades);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trades");
    XLSX.writeFile(workbook, "trades.xlsx");
  };

  const handleScripChange = (value: string) => {
     setSelectedScrip(value);
      console.log(value);
      
  }

    const handleStrategyChange = (value: string) => {
      setSelectedStrategy(value)
      console.log(value);
      
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Trades</h2>

      <div
  style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  }}
>
  <Select
    value={selectedScrip}
    style={{ width: 180 }}
   onChange={handleScripChange} 
    options={[
      { label: "All Scrips", value: "All Scrips" },
      { label: "NIFTY", value: "NIFTY" },
      { label: "BANKNIFTY", value: "BANKNIFTY" },
      { label: "RELIANCE", value: "RELIANCE" },
      { label: "SBIN", value: "SBIN" },
    ]}
  />

  <Select
    value={selectedStrategy}
    style={{ width: 180 }}
    onChange={handleStrategyChange}
    options={[
      { label: "All Strategy", value: "All Strategy" },
      { label: "Scalping", value: "Scalping" },
      { label: "Intraday", value: "Intraday" },
      { label: "Swing", value: "Swing" },
    ]}
  />

  <DatePicker.RangePicker
    style={{ width: 300 }}
    value={dateRange}
    onChange={(val) => setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs])}
    format="DD MMM YYYY hh:mm A"
    showTime={{ format: "hh:mm A" }}
    ranges={{
      Today: [dayjs().startOf("day"), dayjs().endOf("day")],
      Yesterday: [
        dayjs().subtract(1, "day").startOf("day"),
        dayjs().subtract(1, "day").endOf("day"),
      ],
      "Last 7 Days": [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
      "Last 30 Days": [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
      "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
      "Last Month": [
        dayjs().subtract(1, "month").startOf("month"),
        dayjs().subtract(1, "month").endOf("month"),
      ],
    }}
  />
</div>


      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by Fill ID, Order ID, Symbol, Txn, Product, Exchange..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 320px",
            minWidth: 240,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            outline: "none",
          }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#475569" }}>
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb" }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleExcelDownload}
          style={{
            padding: "10px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
        >
          Excel Download
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Fill ID",
                  "Order ID",
                  "Symbol",
                  "Txn Type",
                  "Product",
                  "Exchange",
                  "Fill Price",
                  "Fill Size",
                  "Trade Value",
                  "Trade Time",
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
                  <td colSpan={10} style={{ padding: 16, textAlign: "center" }}>
                    Loading trades…
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={10} style={{ padding: 16, color: "#ef4444" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && current.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                    No trades found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                current.map((t) => (
                  <tr key={t.fillid} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={td}>{t.fillid}</td>
                    <td style={td}>{t.orderid}</td>
                    <td style={td}>{t.tradingsymbol}</td>
                    <td style={td}>{t.transactiontype}</td>
                    <td style={td}>{t.producttype}</td>
                    <td style={td}>{t.exchange}</td>
                    <td style={td}>{t.fillprice}</td>
                    <td style={td}>{t.fillsize}</td>
                    <td style={td}>{t.tradevalue}</td>
                    <td style={td}>{t.filltime}</td>
                  </tr>
                ))}
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
    </div>
  );
}
