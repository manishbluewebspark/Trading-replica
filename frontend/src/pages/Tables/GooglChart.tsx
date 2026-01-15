// // src/pages/GooglChart.tsx
// import { useEffect, useState } from "react";
// import axios from "axios";

// const apiUrl = import.meta.env.VITE_API_URL;

// type PriceMovement = {
//   value: number;
//   percentage: number;
//   movement: "Up" | "Down" | "NoChange" | string;
// };

// type MarketItem = {
//   symbol: string;         // e.g. "NI225:INDEXNIKKEI"
//   name: string;           // e.g. "Nikkei 225"
//   price: number;          // e.g. 50376.53
//   currency?: string;      // e.g. "INR"
//   link: string;           // google finance link
//   price_movement: PriceMovement;
// };

// type ApiResponse = {
//   status: boolean;
//   data: {
//     region: string;
//     markets: MarketItem[];
//   };
// };

// type MarketsType = {
//   asia: MarketItem[];
//   europe: MarketItem[];
//   us: MarketItem[];
// };

// const GooglChart: React.FC = () => {
//   const [markets, setMarkets] = useState<MarketItem[]>([]);
//   const [region, setRegion] = useState<string>("India");
//   const [loading, setLoading] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchMarkets = async () => {
//       try {
//         setLoading(true);

//         const { data } = await axios.get<ApiResponse>(
//           `${apiUrl}/admin/chartadmin`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             },
//           }
//         );

//         console.log("API markets:", data.data.markets);

//         if (data.status) {
//           // ✅ markets is already an array – no `.asia`
//           setMarkets(data.data.markets || []);
//           setRegion(data.data.region || "India");
//         } else {
//           console.error("API error");
//         }
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMarkets();
//   }, []);

//   const renderMovementBadge = (m: PriceMovement) => {
//     const isUp = m.movement === "Up";
//     const isDown = m.movement === "Down";

//     const bg = isUp ? "bg-green-50" : isDown ? "bg-red-50" : "bg-gray-100";
//     const text = isUp ? "text-green-700" : isDown ? "text-red-700" : "text-gray-700";

//     return (
//       <div
//         className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${bg} ${text}`}
//       >
//         <span>{isUp ? "▲" : isDown ? "▼" : "•"}</span>
//         <span>
//           {m.value.toFixed(2)} ({m.percentage.toFixed(2)}%)
//         </span>
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="p-6">
//         <p className="text-gray-500">Loading markets…</p>
//       </div>
//     );
//   }

//   // First few markets for the top strip (like NIFTY 50 / SENSEX cards)


//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Top "markets" nav bar like Google Finance */}
//       <div className="bg-white border-b">
//         <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
//           <div className="flex gap-4 text-sm font-medium">
//             <button className="border-b-2 border-blue-600 pb-1 text-blue-600">
//               Compare markets
//             </button>
//             <button className="pb-1 text-gray-600">US</button>
//             <button className="pb-1 text-gray-600">Europe</button>
//             <button className="pb-1 text-gray-900">{region}</button>
//             <button className="pb-1 text-gray-600">Currencies</button>
//             <button className="pb-1 text-gray-600">Crypto</button>
//             <button className="pb-1 text-gray-600">Futures</button>
//           </div>
//         </div>

//         {/* Second row: small index cards (NIFTY 50 style) */}
//         <div className="max-w-6xl mx-auto px-6 pb-4 flex gap-3 overflow-x-auto">
//           {markets?.asia.map((mkt:any) => {
//             const isUp = mkt.price_movement.movement === "Up";
//             const isDown = mkt.price_movement.movement === "Down";

//             const border =
//               isUp ? "border-green-200" : isDown ? "border-red-200" : "border-gray-200";
//             // const textMain =
//             //   isUp ? "text-green-700" : isDown ? "text-red-700" : "text-gray-900";
//             const textSub =
//               isUp ? "text-green-600" : isDown ? "text-red-600" : "text-gray-600";

//             return (
//               <div
//                 key={mkt.name}
//                 className={`min-w-[180px] bg-white border ${border} rounded-xl px-4 py-3 shadow-sm flex flex-col justify-between`}
//               >
//                 <div className="text-xs font-semibold text-gray-500">
//                   {mkt.name.split(":")[0]}
//                 </div>
//                 <div className="text-sm font-semibold text-gray-900 truncate">
//                   {mkt.name}
//                 </div>
//                 <div className="mt-1 text-base font-semibold ${textMain}">
//                   {mkt.currency === "INR" ? "₹" : ""}
//                   {mkt.price}
//                 </div>
//                 <div className={`text-xs font-medium ${textSub}`}>
//                   {mkt.price_movement.value.toFixed(2)} (
//                   {mkt.price_movement.percentage.toFixed(2)}%)
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Search bar */}
//       <div className="bg-white border-b">
//         <div className="max-w-6xl mx-auto px-6 py-6">
//           <div className="relative">
//             <input
//               type="text"
//               placeholder="Search for stocks, ETFs & more"
//               className="w-full rounded-full border border-gray-200 py-3 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
//             />
//             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
//               🔍
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Main content */}
//       <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left side – “You may be interested in” list */}
//         <div className="lg:col-span-2">
//           <h2 className="text-lg font-semibold mb-3">You may be interested in</h2>

//           <div className="bg-white rounded-xl shadow-sm border">
//             {markets.length === 0 ? (
//               <p className="p-4 text-sm text-gray-500">No market data found.</p>
//             ) : (
//               <ul className="divide-y">
//                 {markets.asia.map((mkt:any) => (
//                   <li
//                     key={mkt.name}
//                     className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
//                   >
//                     {/* Left: badge + name */}
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-white font-semibold">
//                           {mkt.name.split(":")[0]}
//                         </span>
//                         <a
//                           href={mkt.link}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="text-sm font-medium text-gray-900 hover:underline"
//                         >
//                           {mkt.name}
//                         </a>
//                       </div>
//                     </div>

//                     {/* Right: price + change + + button */}
//                     <div className="flex items-center gap-4">
//                       <div className="text-right">
//                         <div className="text-sm font-medium text-gray-900">
//                           {mkt.currency === "INR" ? "₹" : ""}
//                           {mkt.price}
//                         </div>
//                       </div>
//                       {renderMovementBadge(mkt.price_movement)}
//                       <button
//                         className="text-gray-400 hover:text-gray-600"
//                         title="Add to watchlist"
//                       >
//                         +
//                       </button>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </div>

//         {/* Right side – you can add “Market trends / Earnings calendar” later */}
//         <div className="hidden lg:block">
//           {/* placeholder card for future widgets */}
//           <div className="bg-white rounded-xl shadow-sm border p-4 text-sm text-gray-500">
//             Right-side widgets (Market trends, Earnings calendar, etc.) can go here.
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GooglChart;


// src/pages/GooglChart.tsx
import { useEffect, useState } from "react";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

type PriceMovement = {
  value: number;
  percentage: number;
  movement: "Up" | "Down" | "NoChange" | string;
};

type MarketItem = {
  symbol: string;
  name: string;
  price: number;
  currency?: string;
  link: string;
  price_movement: PriceMovement;
};



// grouped by region
type MarketsByRegion = {
  asia: MarketItem[];
  europe: MarketItem[];
  us: MarketItem[];
};

const GooglChart: React.FC = () => {
  const [markets, setMarkets] = useState<MarketsByRegion>({
    asia: [],
    europe: [],
    us: [],
  });

  const [region, setRegion] = useState("India");
  const [loading, setLoading] = useState(true);

  // Group market items based on region keyword
// const groupMarkets = (items: any): MarketsByRegion => {
//   const grouped: MarketsByRegion = { asia: [], europe: [], us: [] };

//   const flatItems = Object.values(items).flat(); // <-- yaha se array ban gaya

//   flatItems.forEach((item: any) => {
//     const n = (item.name || "").toLowerCase();
//     console.log(n,'nnnnnnnn');
    

//     if (n.includes("nikkei") || n.includes("asia") || n.includes("nifty"))
//       grouped.asia.push(item);
//     else if (n.includes("ftse") || n.includes("europe"))
//       grouped.europe.push(item);
//     else grouped.us.push(item);
//   });

//   return grouped;
// };

const groupMarkets = (items: any): MarketsByRegion => {
  const grouped: MarketsByRegion = { asia: [], europe: [], us: [] };

  const flatItems = Object.values(items).flat();

  flatItems.forEach((item: any) => {
    console.log("-------------");
    console.log("FULL ITEM:", item);

    Object.keys(item).forEach((key) => {
      console.log(`${key} => ${item[key]}`);
    });
    console.log("-------------");

    const n = (item.name || "").toLowerCase();

    if (n.includes("nikkei") || n.includes("asia") || n.includes("nifty"))
      grouped.asia.push(item);
    else if (n.includes("ftse") || n.includes("europe"))
      grouped.europe.push(item);
    else grouped.us.push(item);
  });

  return grouped;
};


  // Fetch API data
  useEffect(() => {
    const fetchMarkets = async () => {
      try {

        
        setLoading(true);

        const { data } = await axios.get(
          `${apiUrl}/admin/chartadmin`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

        console.log("API markets:", data.data);

        if (data.status) {
          const grouped = groupMarkets(data.data.markets);

          setMarkets(grouped);
          setRegion(data.data.markets[0].asia || "India");
          // setRegion(data.data.region || "India");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  // Price badge
  const renderMovementBadge = (m: PriceMovement) => {
    const isUp = m.movement === "Up";
    const isDown = m.movement === "Down";

    const bg = isUp ? "bg-green-50" : isDown ? "bg-red-50" : "bg-gray-100";
    const text = isUp ? "text-green-700" : isDown ? "text-red-700" : "text-gray-700";

    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${bg} ${text}`}
      >
        <span>{isUp ? "▲" : isDown ? "▼" : "•"}</span>
        <span>
          {m.value.toFixed(2)} ({m.percentage.toFixed(2)}%)
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading markets…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex gap-4 text-sm font-medium">
            <button className="border-b-2 border-blue-600 pb-1 text-blue-600">
              Compare markets
            </button>
            <button className="pb-1 text-gray-600">US</button>
            <button className="pb-1 text-gray-600">Europe</button>
            <button className="pb-1 text-gray-900">{region}</button>
            <button className="pb-1 text-gray-600">Currencies</button>
            <button className="pb-1 text-gray-600">Crypto</button>
            <button className="pb-1 text-gray-600">Futures</button>
          </div>
        </div>

        {/* NIFTY / SENSEX cards */}
        <div className="max-w-6xl mx-auto px-6 pb-4 flex gap-3 overflow-x-auto">
          {markets.asia.map((mkt) => {
            const isUp = mkt.price_movement.movement === "Up";
            const isDown = mkt.price_movement.movement === "Down";

            const border =
              isUp ? "border-green-200" : isDown ? "border-red-200" : "border-gray-200";

            const textSub =
              isUp ? "text-green-600" : isDown ? "text-red-600" : "text-gray-600";

            return (
              <div
                key={mkt.name}
                className={`min-w-[180px] bg-white border ${border} rounded-xl px-4 py-3 shadow-sm flex flex-col justify-between`}
              >
                <div className="text-xs font-semibold text-gray-500">
                  {mkt.name.split(":")[0]}
                </div>
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {mkt.name}
                </div>
                <div className="mt-1 text-base font-semibold">
                  {mkt.currency === "INR" ? "₹" : ""}
                  {mkt.price}
                </div>
                <div className={`text-xs font-medium ${textSub}`}>
                  {mkt.price_movement.value.toFixed(2)} (
                  {mkt.price_movement.percentage.toFixed(2)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <input
            type="text"
            placeholder="Search for stocks, ETFs & more"
            className="w-full rounded-full border border-gray-200 py-3 pl-12 pr-4 bg-gray-50 shadow-sm"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">You may be interested in</h2>

          <div className="bg-white rounded-xl shadow-sm border">
            {markets.asia.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No market data found.</p>
            ) : (
              <ul className="divide-y">
                {markets.asia.map((mkt) => (
                  <li
                    key={mkt.name}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-white font-semibold">
                        {mkt.name.split(":")[0]}
                      </span>
                      <a
                        href={mkt.link}
                        target="_blank"
                        className="text-sm font-medium text-gray-900 hover:underline"
                      >
                        {mkt.name}
                      </a>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium text-gray-900">
                        {mkt.currency === "INR" ? "₹" : ""}
                        {mkt.price}
                      </div>

                      {renderMovementBadge(mkt.price_movement)}

                      <button className="text-gray-400 hover:text-gray-600">+</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-xl shadow-sm border p-4 text-sm text-gray-500">
            Right-side widgets will go here.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GooglChart;



