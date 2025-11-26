
// import { useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

// export default function OrderAdminPage() {
//   const defaultValues = {
//     userId: 5,
//     variety: "NORMAL",
//     ordertype: "MARKET",
//     producttype: "INTRADAY",
//     tradingsymbol: "",
//     transactiontype: "",
//     exchange: "",
//     symboltoken: "",
//     instrumentname: "",
//     instrumenttype: "",
//     duration: "DAY",
//     price: 269.85,
//     totalPrice: 271.2,
//     lotSize: "",
//     triggerprice: 0,
//     squareoff: "0",
//     stoploss: "0",
//     trailingstoploss: "0",
//     expiry: "",
//     orderstatuslocaldb: "",
//   };
  

//   const [formData, setFormData] = useState(defaultValues);
//   const [loadingSubmit, setLoadingSubmit] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const apiUrl = import.meta.env.VITE_API_URL;

//   // 🔍 SEARCH ON KEY UP
//   const handleKeyUp = async (e: any) => {
//     const value = e.target.value;
//     setSearchTerm(value);

//     if (value.length < 3) return setSearchResults([]);

//     setLoading(true);
//     try {
//       const res = await axios.get(
//         `${apiUrl}/order/mongodb/instrument/search/${value}`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//           },
//         }
//       );

//       if (res?.data?.status) {
//         setSearchResults(res.data.data);
//       } else {
//         toast.error(res?.data?.message);
//       }
//     } catch (err) {
//       toast.error("Search failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 👉 AUTO FILL WHEN SELECT ITEM
//   const handleItemSelect = (item: any) => {
//     setFormData({
//       ...formData,
//       tradingsymbol: item.symbol,
//       instrumentname: item.name,
//       exchange: item.exch_seg,
//       symboltoken: item.token,
//       instrumenttype: item.SyNumSyType,
//       expiry: item.expiry,
//       lotSize: item.lotsize,
//       totalPrice: Number(item.lotsize) * Number(formData.price),
//     });

//     setSearchTerm(item.symbol);
//     setSearchResults([]);
//   };

//   // 📝 FORM CHANGE + AUTO TOTAL PRICE
//   const handleChange = (e: any) => {
//     const { name, value } = e.target;
//     let updated: any = { ...formData, [name]: value };

//     // 🧮 AUTO CALCULATE totalPrice = lotSize * price
//     if (name === "lotSize") {
//       const total = Number(value) * Number(formData.price);
//       updated.totalPrice = Number(total.toFixed(2));
//     }

//     setFormData(updated);
//   };

//   // 🚀 SUBMIT FORM
//   const handleSubmit = async (e: any) => {
//     e.preventDefault();

//     // Basic Validation
//     if (!formData.tradingsymbol) return toast.error("Please select a symbol");
//     if (!formData.transactiontype)
//       return toast.error("Select transaction type");
//     if (!formData.exchange) return toast.error("Select exchange");

//     setLoadingSubmit(true);

//     console.log("Final Form:", formData);

//     try {
//       const res = await axios.post(`${apiUrl}/admin/manual/create`, formData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//       });

//       if (res?.data?.status) {
//         toast.success("Order created successfully!");
//         setFormData(defaultValues);
//         setSearchTerm("");
//       } else {
//         toast.error(res?.data?.message || "Order failed");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoadingSubmit(false);
//     }
//   };

//   return (
//     <div className="p-6 mt-16">
//       {/* 🔍 SEARCH BOX */}
//       <div className="relative w-full sm:w-80 mb-6">
//         <input
//           type="text"
//           value={searchTerm}
//           onKeyUp={handleKeyUp}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           placeholder="Search symbol (min 3 chars)"
//           className="border p-2 w-full rounded"
//         />

//         {searchResults.length > 0 && (
//           <div className="absolute top-12 left-0 right-0 bg-white border rounded shadow-lg max-h-64 overflow-y-auto z-50">
//             {searchResults.map((item:any) => (
//               <div
//                 key={item.id}
//                 onClick={() => handleItemSelect(item)}
//                 className="p-2 hover:bg-gray-100 cursor-pointer"
//               >
//                 <p className="font-semibold">{item.symbol}</p>
//                 <p className="text-xs text-gray-500">{item.name}</p>
//               </div>
//             ))}
//           </div>
//         )}

//         {loading && <p className="text-blue-500 text-sm mt-1">Searching...</p>}
//       </div>

//       {/* 📝 FORM */}
//       <form onSubmit={handleSubmit}>
//         <div className="p-6 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//           {Object.keys(formData).map((field) => (
//             <div key={field} className="flex flex-col">
//               <label className="text-sm font-semibold text-gray-700 mb-1">
//                 {field}
//               </label>

//               {/* Dropdown for transactiontype */}
//               {field === "transactiontype" ? (
//                 <select
//                   name="transactiontype"
//                   value={formData.transactiontype}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 >
//                   <option value="">Select Transaction</option>
//                   <option value="BUY">BUY</option>
//                   <option value="SELL">SELL</option>
//                 </select>

//               // Dropdown for exchange
//               ) : field === "exchange" ? (
//                 <select
//                   name="exchange"
//                   value={formData.exchange}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 >
//                   <option value="">Select Exchange</option>
//                   <option value="BSE">BSE</option>
//                   <option value="NSE">NSE</option>
//                   <option value="NFO">NFO</option>
//                   <option value="MCX">MCX</option>
//                   <option value="BFO">BFO</option>
//                   <option value="CDS">CDS</option>
//                 </select>

//               // Dropdown for orderstatuslocaldb
//               ) : field === "orderstatuslocaldb" ? (
//                 <select
//                   name="orderstatuslocaldb"
//                   value={formData.orderstatuslocaldb}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 >
//                   <option value="">Select Status</option>
//                   <option value="OPEN">OPEN</option>
//                   <option value="COMPLETE">COMPLETE</option>
//                 </select>

//               // All other fields as input
//               ) : (
//                 <input
//                   type="text"
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 />
//               )}
//             </div>
//           ))}
//         </div>

//         {/* SUBMIT BUTTON */}
//         <div className="mt-6 flex justify-center">
//           <button
//             type="submit"
//             disabled={loadingSubmit}
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
//           >
//             {loadingSubmit ? "Submitting..." : "Submit Order"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }
















// import { useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

// export default function OrderAdminPage() {
//   const defaultValues = {
//     userId: 5,
//     variety: "NORMAL",
//     ordertype: "MARKET",
//     producttype: "INTRADAY",
//     tradingsymbol: "",
//     transactiontype: "",
//     exchange: "",
//     symboltoken: "",
//     instrumentname: "",
//     instrumenttype: "",
//     duration: "DAY",
//     price: 269.85,
//     totalPrice: 271.2,
//     lotSize: "",
//     triggerprice: 0,
//     squareoff: "0",
//     stoploss: "0",
//     trailingstoploss: "0",
//     expiry: "",
//     orderstatuslocaldb: "",
//   };

//   // 👇 IMPORTANT TYPE FIX
//   type FormDataType = typeof defaultValues;

//   const [formData, setFormData] = useState<FormDataType>(defaultValues);
//   const [loadingSubmit, setLoadingSubmit] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const apiUrl = import.meta.env.VITE_API_URL;

//   // 🔍 SEARCH ON KEYUP
//   const handleKeyUp = async (e: any) => {
//     const value = e.target.value;
//     setSearchTerm(value);

//     if (value.length < 3) return setSearchResults([]);

//     setLoading(true);

//     try {
//       const res = await axios.get(
//         `${apiUrl}/order/mongodb/instrument/search/${value}`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//           },
//         }
//       );

//       if (res?.data?.status) {
//         setSearchResults(res.data.data);
//       } else {
//         toast.error(res?.data?.message);
//       }
//     } catch (err) {
//       toast.error("Search failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 👉 WHEN USER SELECTS ITEM FROM SEARCH LIST
//   const handleItemSelect = (item: any) => {
//     setFormData({
//       ...formData,
//       tradingsymbol: item.symbol,
//       instrumentname: item.name,
//       exchange: item.exch_seg,
//       symboltoken: item.token,
//       instrumenttype: item.SyNumSyType,
//       expiry: item.expiry,
//       lotSize: item.lotsize,
//       totalPrice: Number(item.lotsize) * Number(formData.price),
//     });

//     setSearchTerm(item.symbol);
//     setSearchResults([]);
//   };

//   // 📝 FORM CHANGE + AUTO-PRICE CALCULATION
//   const handleChange = (e: any) => {
//     const { name, value } = e.target;

//     let updated = { ...formData, [name]: value } as FormDataType;

//     if (name === "lotSize") {
//       const total = Number(value) * Number(formData.price);
//       updated.totalPrice = Number(total.toFixed(2));
//     }

//     setFormData(updated);
//   };

//   // 🚀 SUBMIT ORDER
//   const handleSubmit = async (e: any) => {
//     e.preventDefault();

//     if (!formData.tradingsymbol) return toast.error("Please select a symbol");
//     if (!formData.transactiontype) return toast.error("Select transaction type");
//     if (!formData.exchange) return toast.error("Select exchange");

//     setLoadingSubmit(true);

//     try {
//       const res = await axios.post(`${apiUrl}/admin/manual/create`, formData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//       });

//       if (res?.data?.status) {
//         toast.success("Order created successfully!");
//         setFormData(defaultValues);
//         setSearchTerm("");
//       } else {
//         toast.error(res?.data?.message || "Order failed");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoadingSubmit(false);
//     }
//   };

//   return (
//     <div className="p-6 mt-16">
//       {/* 🔍 SEARCH BOX */}
//       <div className="relative w-full sm:w-80 mb-6">
//         <input
//           type="text"
//           value={searchTerm}
//           onKeyUp={handleKeyUp}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           placeholder="Search symbol (min 3 chars)"
//           className="border p-2 w-full rounded"
//         />

//         {searchResults.length > 0 && (
//           <div className="absolute top-12 left-0 right-0 bg-white border rounded shadow-lg max-h-64 overflow-y-auto z-50">
//             {searchResults.map((item: any) => (
//               <div
//                 key={item.id}
//                 onClick={() => handleItemSelect(item)}
//                 className="p-2 hover:bg-gray-100 cursor-pointer"
//               >
//                 <p className="font-semibold">{item.symbol}</p>
//                 <p className="text-xs text-gray-500">{item.name}</p>
//               </div>
//             ))}
//           </div>
//         )}

//         {loading && <p className="text-blue-500 text-sm mt-1">Searching...</p>}
//       </div>

//       {/* 📝 FORM */}
//       <form onSubmit={handleSubmit}>
//         <div className="p-6 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//           {(Object.keys(formData) as (keyof FormDataType)[]).map((field) => (
//             <div key={field} className="flex flex-col">
//               <label className="text-sm font-semibold text-gray-700 mb-1">
//                 {field}
//               </label>

//               {field === "transactiontype" ? (
//                 <select
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 >
//                   <option value="">Select Transaction</option>
//                   <option value="BUY">BUY</option>
//                   <option value="SELL">SELL</option>
//                 </select>
//               ) : field === "exchange" ? (
//                 <select
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 >
//                   <option value="">Select Exchange</option>
//                   <option value="BSE">BSE</option>
//                   <option value="NSE">NSE</option>
//                   <option value="NFO">NFO</option>
//                   <option value="MCX">MCX</option>
//                   <option value="BFO">BFO</option>
//                   <option value="CDS">CDS</option>
//                 </select>
//               ) : field === "orderstatuslocaldb" ? (
//                 <select
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 >
//                   <option value="">Select Status</option>
//                   <option value="OPEN">OPEN</option>
//                   <option value="COMPLETE">COMPLETE</option>
//                 </select>
//               ) : (
//                 <input
//                   type="text"
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 />
//               )}
//             </div>
//           ))}
//         </div>

//         {/* SUBMIT */}
//         <div className="mt-6 flex justify-center">
//           <button
//             type="submit"
//             disabled={loadingSubmit}
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
//           >
//             {loadingSubmit ? "Submitting..." : "Submit Order"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }








import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function OrderAdminPage() {

  const navigate = useNavigate();

 const { userId } = useParams();

  const defaultValues = {
    userId: userId,
    variety: "NORMAL",
    ordertype: "MARKET",
    producttype: "INTRADAY",
    tradingsymbol: "",
    transactiontype: "",
    exchange: "",
    symboltoken: "",
    instrumentname: "",
    instrumenttype: "",
    duration: "DAY",
    price: 0,
    totalPrice: 0,
    lotSize: "",
    triggerprice: 0,
    squareoff: "0",
    stoploss: "0",
    trailingstoploss: "0",
    // expiry: "",
    // orderstatuslocaldb: "",
  };

  type FormDataType = typeof defaultValues;

  const [formData, setFormData] = useState<FormDataType>(defaultValues);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  // 🔍 SEARCH ON KEYUP
  const handleKeyUp = async (e: any) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length < 3) return setSearchResults([]);

    setLoading(true);

    try {
      const res = await axios.get(
        `${apiUrl}/agnelone/instrument/search/${value}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        }
      );

      if (res?.data?.status) {
        setSearchResults(res.data.data);
      } else {
        toast.error(res?.data?.message);
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ FETCH LTP FUNCTION
  const getLTP = async (item: any): Promise<number | null> => {
    try {
      const payload = {
        exchange: item.exch_seg,
        tradingsymbol: item.symbol,
        symboltoken: item.token,
      };

      const res = await axios.post(`${apiUrl}/agnelone/instrument/ltp`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      });

      if (res?.data?.status === true) {
        return res?.data?.data?.data?.ltp || 0;
      }

      toast.error("Unable to fetch LTP");
      return null;
    } catch (err) {
      toast.error("LTP fetch failed");
      return null;
    }
  };

  // 👉 WHEN USER SELECTS ITEM (NOW WITH LTP UPDATE)
  const handleItemSelect = async (item: any) => {
    const ltp = await getLTP(item);

    const price = ltp ?? 0;
    const lot = Number(item.lotsize);
    const total = Number(price) * lot;

    setFormData({
      ...formData,
      tradingsymbol: item.symbol,
      instrumentname: item.name,
      exchange: item.exch_seg,
      symboltoken: item.token,
      instrumenttype: item.instrumenttype,
      // expiry: item.expiry,
      lotSize: item.lotsize,
      price: Number(price),
      totalPrice: Number(total.toFixed(2)),
    });

    setSearchTerm(item.symbol);
    setSearchResults([]);
  };

  // 📝 FORM CHANGE + AUTO TOTAL CALC
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    let updated = { ...formData, [name]: value } as FormDataType;

    if (name === "lotSize") {
      const total = Number(value) * Number(formData.price);
      updated.totalPrice = Number(total.toFixed(2));
    }

    setFormData(updated);
  };

  // 🚀 SUBMIT ORDER
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!formData.tradingsymbol) return toast.error("Please select a symbol");
    if (!formData.transactiontype) return toast.error("Select transaction type");
    if (!formData.exchange) return toast.error("Select exchange");

    setLoadingSubmit(true);

    try {
      const res = await axios.post(`${apiUrl}/admin/manual/create`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res?.data?.status) {
        toast.success("Order created successfully!");
        setFormData(defaultValues);
        setSearchTerm("");
        navigate(`/admin/user-clone`);
      } else {
        toast.error(res?.data?.message || "Order failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="p-6 mt-16">
      {/* SEARCH BOX */}
      <div className="relative w-full sm:w-80 mb-6">
        <input
          type="text"
          value={searchTerm}
          onKeyUp={handleKeyUp}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search symbol (min 3 chars)"
          className="border p-2 w-full rounded"
        />

        {searchResults.length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-white border rounded shadow-lg max-h-64 overflow-y-auto z-50">
            {searchResults.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-semibold">{item.symbol}</p>
                <p className="text-xs text-gray-500">{item.name}</p>
              </div>
            ))}
          </div>
        )}

        {loading && <p className="text-blue-500 text-sm mt-1">Searching...</p>}
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(formData) as (keyof FormDataType)[]).map((field) => (
            <div key={field} className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                {field}
              </label>

              {field === "transactiontype" ? (
                <select
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="border p-2 rounded"
                >
                  <option value="">Select Transaction</option>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              ) : field === "exchange" ? (
                <select
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="border p-2 rounded"
                >
                  <option value="">Select Exchange</option>
                  <option value="BSE">BSE</option>
                  <option value="NSE">NSE</option>
                  <option value="NFO">NFO</option>
                  <option value="MCX">MCX</option>
                  <option value="BFO">BFO</option>
                  <option value="CDS">CDS</option>
                </select>
              )  : (
                <input
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              )}
            </div>
          ))}
        </div>

        {/* SUBMIT */}
        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={loadingSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loadingSubmit ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </form>
    </div>
  );
}


