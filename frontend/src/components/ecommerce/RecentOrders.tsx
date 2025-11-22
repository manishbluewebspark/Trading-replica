

import { useEffect, useState } from "react";
import axios from "axios";



type Summary = { totalOrder: number; orderData: any[] };

// ✔ Replace with your API URL
const apiUrl = import.meta.env.VITE_API_URL;

export default function RecentOrders() {

  const [openOrder, setOpenOrders] = useState<number>(0);
  const [trade, setTrade] = useState<number>(0);
  const [summary, setSummary] = useState<Summary>({
    totalOrder: 0,
    orderData: [],
  });

  console.log(openOrder,trade);
  

  // ⬇️ API CALL INSIDE useEffect
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${apiUrl}/admin/get/recent/order`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

       

  
        setOpenOrders(res?.data?.totalOpenPositions)
         setTrade(res?.data?.totalSellTrades)
        setSummary({
          totalOrder: res?.data?.todayOrderCount || 0,
          orderData: res?.data?.recentOrders || [],
        });
      } catch (err) {
        console.log("Error fetching orders:", err);
      }
    };

    fetchOrders();
  }, []); // <-- runs once



   console.log(summary);
  

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-700">Recent Orders</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="text-left py-2 pr-4">Symbol</th>
              <th className="text-left py-2 pr-4">Order Id</th>
              <th className="text-left py-2 pr-4">Type</th>
              <th className="text-left py-2 pr-4">Qty</th>
              <th className="text-left py-2 pr-4">Price</th>
              <th className="text-left py-2 pr-4">Order Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {summary?.orderData?.slice(0, 5).map((item: any, index: any) => (
              <tr key={index}>
                <td className="py-2 pr-4">{item.tradingsymbol}</td>
                <td className="py-2 pr-4">{item.orderid}</td>

                <td
                  className={`py-2 pr-4 font-medium ${
                    item.transactiontype === "BUY"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {item.transactiontype}
                </td>

                <td className="py-2 pr-4">{item.lotsize}</td>
                <td className="py-2 pr-4">{item.averageprice}</td>

                <td className="py-2 pr-4">{item.orderstatus}</td>
              </tr>
            ))}

            {summary?.orderData?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400">
                  No recent orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
