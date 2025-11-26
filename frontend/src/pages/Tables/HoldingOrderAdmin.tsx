
 
 
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

export default function HoldingOrderAdmin () {

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
      const { data } = await axios.get(`${apiUrl}/admin/get/holdingdata`, {
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
