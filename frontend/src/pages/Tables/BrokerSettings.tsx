// // src/BrokerSettings.jsx
// import  { useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";


// const BROKERS = [
//   {
//     nameId: "angelone",
//     name: "Angel One",
//     logo: "https://yt3.googleusercontent.com/BUXdWI-gsrRXMa1uTwRW9I_DeRHKUwXYpBW-pd8r7hu2b5eCtXCAEzTL408aeUyrQIsyEIhjKMY=s900-c-k-c0x00ffffff-no-rj",
//     tag: "India · Equity & F&O",
//   },
//   {
//     id: "5paisa",
//     name: "5Paisa",
//     logo: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/65/6a/1d/656a1dae-0081-a61c-0bf4-b79e754950b4/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/1200x630wa.jpg",
//     tag: "Discount Broker",
//   },
//   {
//     id: "aliceblue",
//     name: "Alice Blue",
//     logo: "data:image/png;base64,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",
//     tag: "Equity & Commodities",
//   },
//   {
//     id: "binance",
//     name: "Binance",
//     logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj97fmjaCYgkevu7aFhgWDjXPfuNxt8bWk5w&s",
//     tag: "Global Crypto",
//   },
//   {
//     id: "bitbns",
//     name: "BitBns",
//     logo: "data:image/jpeg;base64,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",
//     tag: "Indian Crypto",
//   },
// ];

// const BrokerSettings = () => {

//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [borkers, setBroker] = useState([]);


//   const makeNameId = (name: string) =>
//   name
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, ""); // remove spaces & special chars

//    // Fetch all orders
//   const fetchOrders = async () => {
   
   
//     try {
//       const { data } = await axios.get(`${apiUrl}/admin/broker`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (data?.status === true) {


//         console.log(data.data);
        


//         setBroker(Array.isArray(data.data) ? data.data : []);
//       } else if (data?.status === false && data?.message === "Unauthorized") {
//         toast.error("Unauthorized User");
//         localStorage.clear();
//       } else {
//         toast.error(data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
     
//       toast.error(err?.message || "Something went wrong");
//     } finally {
     
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//   }, []);


//   return (
//     <div className="min-h-screen bg-slate-50 flex justify-center px-4 py-8">
//       <div className="w-full max-w-4xl">
//         {/* Header */}
//         <div className="mb-6 flex items-center justify-between">
//           <div>
//           <h1 className="text-2xl font-semibold text-slate-800">
//             Supported Brokers
//           </h1>

//           <p className="text-sm text-slate-500 mt-1">
//             Our platform currently supports <span className="font-semibold text-slate-700">{BROKERS.length}</span> major brokers. 
//             You can link your trading account and place orders seamlessly.
//           </p>
//         </div>


//           <div className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
//             Selected: <span className="font-semibold">{selectedBroker}</span>
//           </div>
//         </div>

//         {/* Broker cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {borkers.map((b) => {
//             const isActive = selectedBroker === b.id;

//             return (
//               <button
//                 key={b.id}
//                 type="button"
//                 onClick={() => setSelectedBroker(b.id)}
//                 className={`relative flex items-center gap-4 w-full rounded-xl border px-4 py-3 text-left transition
//                   bg-white shadow-sm hover:shadow-md
//                   ${isActive ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}
//                 `}
//               >
//                 {/* Tick badge when active */}
//                 {isActive && (
//                   <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full shadow">
//                     Selected
//                   </span>
//                 )}

//                 {/* Logo */}
//                 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
//                   {b.logo ? (
//                     <img
//                       src={b.logo}
//                       alt={b.name}
//                       className="w-full h-full object-contain"
//                     />
//                   ) : (
//                     <span className="text-lg font-semibold text-slate-600">
//                       {b.name.charAt(0)}
//                     </span>
//                   )}
//                 </div>

//                 {/* Text */}
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2">
//                     <h2 className="font-semibold text-slate-800">{b.name}</h2>
//                   </div>
//                   <p className="text-xs text-slate-500 mt-0.5">{b.tag}</p>
//                 </div>

//                 {/* Radio indicator */}
//                 <div
//                   className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
//                     ${isActive ? "border-blue-600" : "border-slate-300"}
//                   `}
//                 >
//                   {isActive && (
//                     <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
//                   )}
//                 </div>
//               </button>
//             );
//           })}
//         </div>

      
//       </div>
//     </div>
//   );
// };

// export default BrokerSettings;



// src/BrokerSettings.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BrokerSettings = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [brokers, setBrokers] = useState([]);

  const fetchBrokers = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/admin/broker`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data?.status === true) {
        const list = Array.isArray(data.data) ? data.data : [];
        setBrokers(list);
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err:any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Supported Brokers
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Our platform currently supports{" "}
              <span className="font-semibold text-slate-700">
                {brokers.length}
              </span>{" "}
              broker(s). You can link your trading account and place orders
              seamlessly.
            </p>
          </div>
        </div>

        {/* Broker cards */}
        {brokers.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8 border rounded-lg bg-white">
            No brokers found. Please add brokers from admin or try again later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brokers.map((b:any) => (
              <div
                key={b.id}
                className="relative flex items-center gap-4 w-full rounded-xl border px-4 py-3 text-left
                           bg-white shadow-sm hover:shadow-md border-slate-200 transition"
              >
                {/* Logo */}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  {b.brokerLink ? (
                    <img
                      src={b.brokerLink}
                      alt={b.brokerName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-slate-600">
                      {b.brokerName?.charAt(0) || "B"}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-800">
                      {b.brokerName}
                    </h2>
                  </div>
                  {b.tag && (
                    <p className="text-xs text-slate-500 mt-0.5">{b.tag}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerSettings;


