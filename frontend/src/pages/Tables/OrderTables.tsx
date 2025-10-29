import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from 'xlsx';
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css"; // or "antd/dist/antd.css" for older versions

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
  status: string;        // e.g., "rejected"
  orderstatus: string;   // duplicate in your sample; we’ll show `status`
  updatetime: string;    // e.g., "24-Oct-2025 13:21:19"
  exchtime: string;
  exchorderupdatetime: string;
  fillid: string;
  filltime: string;
  parentorderid: string;
  uniqueorderid: string;
  exchangeorderid: string;
};

// util: tiny debounce hook so search feels snappy
function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

const PAGE_SIZE_DEFAULT = 10;

const statusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "complete" || s === "filled" || s === "success") return "#16a34a"; // green
  if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444"; // red
  if (s === "pending" || s === "open" || s === "queued") return "#f59e0b"; // amber
  return "#64748b"; // slate
};

export default function OrderTables() {
  const [orders, setOrders] = useState<Order[]>([]);
   
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 250);

  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_DEFAULT);
  const [page, setPage] = useState<number>(1);

  const [showForm, setShowForm] = useState(false); // ✅ control modal visibility
  const [selectedItem, setSelectedItem] = useState<any | null>(null); // ✅ store clicked item


  const [selectedScrip, setSelectedScrip] = useState<string>("All Scrips");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("All Strategy");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
     
      try {
        const {data} = await axios.get("http://localhost:5000/api/order/get/order", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "AngelOneToken": localStorage.getItem("angel_token") || "",
             
            },
          });

       if(data.status==true) {

        setOrders(data.data);

       }else if(data.status==false&&data.message=='Unauthorized'){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");
           
       }else{
          // alert(data?.message)
       }
        
      } catch (err: any) {
           alert(err?.message)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();
 
  }, []);

  // reset to page 1 whenever the search or page size changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      // fields to search across
      const haystack =
        [
          o.orderid,
          o.uniqueorderid,
          o.tradingsymbol,
          o.transactiontype,
          o.instrumenttype,
          o.ordertype,
          o.producttype,
          o.status,
          o.exchange,
          o.text,
          o.updatetime,
          o.exchangeorderid,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() +
        // also allow searching numbers like price/quantity
        ` ${o.price ?? ""} ${o.quantity ?? ""} ${o.averageprice ?? ""}`;
      return haystack.includes(q);
    });
  }, [orders, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);


    const handleBuyClick = async(item: any) => {

        setSelectedItem(item);
        setShowForm(true);
        
    }

    const handleCancelClick = async (item: any) => {

    try {
         let res = await axios.post("http://localhost:5000/api/order/cancel/order", item, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          })

      if(res.data.status==true) {

        alert(res.data.message)

      }else if(res.data.status==false&&res.data.status=='Unauthorized'){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");
           
       }
       else{

           alert(res.data.message)
      }   
    } catch (error:any) {

       alert(error.message)
    }

      }

      // ✅ Handle Form Submit
    const handleSubmit = async(e: React.FormEvent) => {

         e.preventDefault();

        let res = await axios.post("http://localhost:5000/api/order/modify/order", selectedItem, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          }) 


          console.log(res,'hello update');
          
          
          
      if(res.data.status==true) {

        alert(res.data.message)

      }else if(res.data.status==false&&res.data.status=='Unauthorized'){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");  
       }
       else{

           alert(res.data.message)
      }   
          
    }

     const handleExcelDownload = () => {
        // Convert data to worksheet
        const worksheet = XLSX.utils.json_to_sheet(orders);
        // Create a workbook
        const workbook = XLSX.utils.book_new();
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        // Generate an Excel file
        XLSX.writeFile(workbook, "orders.xlsx");
      };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Orders</h2>

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
    onChange={setSelectedScrip}
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
    onChange={setSelectedStrategy}
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


 

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
  <input
    type="text"
    placeholder="Search by Order ID, Symbol, Type, Status, Exchange, Message..."
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
  {/* Excel Download Button */}
  <button
    onClick={handleExcelDownload}
    style={{
      padding: "10px 16px",
      backgroundColor: "#3b82f6", // Blue-500
      color: "white",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 14,
      transition: "background-color 0.2s",
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")} // Blue-600 on hover
    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
  >
    Excel Download
  </button>
</div>


      {/* Table */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }} className="max-w-[1080px]">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Order ID",
                  "variety",
                  "Symbol",
                  "Transaction Type",
                  "Type",
                  "Product Type",
                  "Qty",
                  "Price",
                  "Status",
                  "Message",

                  // "Exchange",
                  // "Variety",
                  "Updated At",
                   "Update",
                   "Cancel"
                ].map((h) => (
                  <th
                    key={h}
                    style={{
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
                  <td colSpan={11} style={{ padding: 16, textAlign: "center" }}>
                    Loading orders…
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={11} style={{ padding: 16, color: "#ef4444" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && current.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                    No orders found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                current.map((o) => (
                  <tr key={o.orderid} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={td}>{o.orderid}</td>
                       <td style={td}>{o.variety}</td>
                    <td style={td} title={o.tradingsymbol}>
                      <strong>{o.tradingsymbol}</strong>
                    </td>
                    <td style={td}>{o.transactiontype}</td>
                    <td style={td}>{o.ordertype}</td>
                    <td style={td}>{o.producttype}</td>
                    <td style={td} title={`Filled: ${o.filledshares} / Unfilled: ${o.unfilledshares}`}>
                      {o.quantity}
                    </td>
                    <td style={td}>{o.price}</td>
                    <td style={td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          color: "white",
                          background: statusColor(o.status),
                          textTransform: "capitalize",
                        }}
                        title={o.orderstatus}
                      >
                        {o.status || o.orderstatus || "-"}
                      </span>
                    </td>
                    <td style={{ ...td, maxWidth: 380 }}>
                      <span title={o.text} style={{ display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
                        {o.text || "—"}
                      </span>
                    </td>
                    {/* <td style={td}>{o.exchange}</td>
                    <td style={td}>{o.variety}</td> */}
                    <td style={td}>{o.updatetime}</td>
                    <td style={td}>
                      <button
                        onClick={() => handleBuyClick(o)}
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          color: "white",
                          background: statusColor(o.status),
                          textTransform: "capitalize",
                        }}
                     
                      >
                        Update
                      </button>
                    </td>
                     <td style={td}>
                      <button
                        onClick={() => handleCancelClick(o)}
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          color: "white",
                          background: statusColor(o.status),
                          textTransform: "capitalize",
                        }}
                     
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            Showing <strong>{current.length}</strong> of <strong>{filtered.length}</strong> filtered (
            {orders.length} total)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={btn(page === 1)}
            >
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
      {showForm && selectedItem && (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Buy Order
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                <label className="block text-sm font-medium">Order Id</label>
                <input
                  type="text"
                  value={selectedItem.orderid}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

                 <div>
                <label className="block text-sm font-medium">Symbol </label>
                <input
                  type="text"
                  value={selectedItem.tradingsymbol}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>
             
                 <div>
                <label className="block text-sm font-medium">Quantity </label>
                <input
                  type="text"
                  value={selectedItem.quantity}
                  onChange={(e) =>
                setSelectedItem({ ...selectedItem, quantity: e.target.value })
    }
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>
            
              <div>
  <label className="block text-sm font-medium">Price</label>
  <input
    type="text"
    value={selectedItem.price}
    onChange={(e) =>
      setSelectedItem({ ...selectedItem, price: e.target.value })
    }
    className="border p-2 w-full rounded bg-gray-100"
  />
</div>
              <div>
  <label className="block text-sm font-medium">Status</label>
  <select
    value={selectedItem.status}
    onChange={(e) =>
      setSelectedItem({ ...selectedItem, status: e.target.value })
    }
    className="border p-2 w-full rounded bg-gray-100"
  >
    <option value="open">Open</option>
    <option value="cancelled">Cancelled</option>
  </select>
</div>

              <div className="flex justify-between mt-6">
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

const td: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  color: "#0f172a",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const btn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: disabled ? "#f1f5f9" : "white",
  color: disabled ? "#94a3b8" : "#0f172a",
  cursor: disabled ? "not-allowed" : "pointer",
});
