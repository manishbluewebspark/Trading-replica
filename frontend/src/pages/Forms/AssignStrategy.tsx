// // // src/pages/AssignStrategy.tsx
// // import { useEffect, useState } from "react";
// // import axios from "axios";
// // import { toast } from "react-toastify";

// // type Strategy = {
// //   id: number;
// //   strategyName: string;
// //   strategyDis: string;
// // };

// //   const apiUrl = import.meta.env.VITE_API_URL;

// // const AssignStrategy: React.FC = () => {

// //   const [strategies, setStrategies] = useState<Strategy[]>([]);
// //   const [strategyName, setStrategyName] = useState("");
// //   const [strategyDis, setStrategyDis] = useState("");
// //   const [editingId, setEditingId] = useState<number | null>(null);
// //   const [editName, setEditName] = useState("");
// //   const [editDis, setEditDis] = useState("");



// //    // 📌 API function
// //   const fetchStrategies = async () => {
// //     try {
// //       const res = await axios.get(`${apiUrl}/admin/strategies`, {
// //         headers: {
// //           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
// //           AngelOneToken: localStorage.getItem("angel_token") || "",
// //           userid: localStorage.getItem("userID"),
// //         },
// //       });

// //       if (res.data.status === true) {
// //         toast.success(res.data.message);

// //         // save the list of strategies
// //         setStrategies(res.data.data || []);
// //       } else {
// //         toast.error(res.data.message);
// //       }
// //     } catch (error: any) {
// //       toast.error(error.message);
// //     }
// //   };

// //   // 📌 useEffect → automatically call API when component loads
// //   useEffect(() => {
// //     fetchStrategies();
// //   }, []); // empty array = run only once on mount


// //   // ✅ Create Strategy
// //   const handleCreate = async (e: React.FormEvent) => {
// //     try {
        
// //      e.preventDefault();    
// //    if (!strategyName.trim()) return alert("Please enter strategy name");

// //     const newStrategy = {
// //       strategyName: strategyName.trim(),
// //       strategyDis: strategyDis.trim(),
// //     };

// //      const res = await axios.post(`${apiUrl}/admin/strategies`, newStrategy, {
// //         headers: {
// //           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
// //           AngelOneToken: localStorage.getItem("angel_token") || "",
// //           userid: localStorage.getItem("userID"),
// //         },
// //       });

// //      if(res.data.status==true) {
// //          toast.success(res?.data?.message);
// //          setStrategies(res.data.data)
// //         setStrategyName("");
// //         setStrategyDis("");
// //      }else{

// //             toast.error(res.data.message);
// //      }

// //     } catch (error:any) {

// //          toast.error(error.message);
// //     }

// // };

// //   // ✅ Start Edit
// //   const handleEditClick = (strategy: Strategy) => {
// //     setEditingId(strategy.id);
// //     setEditName(strategy.strategyName);
// //     setEditDis(strategy.strategyDis);
// //   };

// //   // ✅ Save Edit
// //   const handleUpdate = (id: number) => {
// //     if (!editName.trim()) return alert("Please enter strategy name");

// //     // TODO: Call your API here (PUT/PATCH)
// //     // await axios.put(`/api/strategy/${id}`, { strategyName: editName, strategyDis: editDis });

// //     setStrategies((prev) =>
// //       prev.map((s) =>
// //         s.id === id
// //           ? { ...s, strategyName: editName.trim(), strategyDis: editDis.trim() }
// //           : s
// //       )
// //     );
// //     setEditingId(null);
// //   };

// //   // ✅ Delete
// //   const handleDelete = (id: number) => {
// //     if (!window.confirm("Are you sure you want to delete this strategy?")) return;

// //     // TODO: Call your API here (DELETE)
// //     // await axios.delete(`/api/strategy/${id}`);

// //     setStrategies((prev) => prev.filter((s) => s.id !== id));
// //   };

// //   return (
// //     <div className="p-6 max-w-5xl mx-auto">
// //       <h1 className="text-2xl font-semibold mb-4">Assign Strategy</h1>

// //       {/* Create Strategy Card */}
// //       <div className="bg-white rounded-lg shadow p-4 mb-6">
// //         <h2 className="text-lg font-semibold mb-3">Create Strategy</h2>
// //         <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
// //           <div className="md:col-span-1">
// //             <label className="block text-sm font-medium mb-1">
// //               Strategy Name
// //             </label>
// //             <input
// //               type="text"
// //               value={strategyName}
// //               onChange={(e) => setStrategyName(e.target.value)}
// //               className="border rounded px-3 py-2 w-full"
// //               placeholder="Enter strategy name"
// //             />
// //           </div>

// //           <div className="md:col-span-1">
// //             <label className="block text-sm font-medium mb-1">
// //               Strategy Description
// //             </label>
// //             <input
// //               type="text"
// //               value={strategyDis}
// //               onChange={(e) => setStrategyDis(e.target.value)}
// //               className="border rounded px-3 py-2 w-full"
// //               placeholder="Enter strategy description"
// //             />
// //           </div>

// //           <div className="md:col-span-2 flex justify-end">
// //             <button
// //               type="submit"
// //               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
// //             >
// //               Create Strategy
// //             </button>
// //           </div>
// //         </form>
// //       </div>

// //       {/* Strategy Table */}
// //       <div className="bg-white rounded-lg shadow p-4">
// //         <h2 className="text-lg font-semibold mb-3">Strategy List</h2>

// //         {strategies.length === 0 ? (
// //           <p className="text-gray-500 text-sm">No strategies found. Create one above.</p>
// //         ) : (
// //           <div className="overflow-x-auto">
// //             <table className="min-w-full border border-gray-200">
// //               <thead className="bg-gray-100">
// //                 <tr>
// //                   <th className="px-4 py-2 border text-left text-sm font-medium">
// //                     #
// //                   </th>
// //                   <th className="px-4 py-2 border text-left text-sm font-medium">
// //                     Strategy Name
// //                   </th>
// //                   <th className="px-4 py-2 border text-left text-sm font-medium">
// //                     Strategy Description
// //                   </th>
// //                   <th className="px-4 py-2 border text-center text-sm font-medium">
// //                     Actions
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {strategies.map((strategy, index) => (
// //                   <tr key={strategy.id} className="hover:bg-gray-50">
// //                     <td className="px-4 py-2 border text-sm">{index + 1}</td>

// //                     {/* Name cell */}
// //                     <td className="px-4 py-2 border text-sm">
// //                       {editingId === strategy.id ? (
// //                         <input
// //                           type="text"
// //                           value={editName}
// //                           onChange={(e) => setEditName(e.target.value)}
// //                           className="border rounded px-2 py-1 w-full text-sm"
// //                         />
// //                       ) : (
// //                         strategy.strategyName
// //                       )}
// //                     </td>

// //                     {/* Description cell */}
// //                     <td className="px-4 py-2 border text-sm">
// //                       {editingId === strategy.id ? (
// //                         <input
// //                           type="text"
// //                           value={editDis}
// //                           onChange={(e) => setEditDis(e.target.value)}
// //                           className="border rounded px-2 py-1 w-full text-sm"
// //                         />
// //                       ) : (
// //                         strategy.strategyDis
// //                       )}
// //                     </td>

// //                     {/* Actions */}
// //                     <td className="px-4 py-2 border text-sm text-center">
// //                       {editingId === strategy.id ? (
// //                         <div className="flex items-center justify-center gap-2">
// //                           <button
// //                             onClick={() => handleUpdate(strategy.id)}
// //                             className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
// //                           >
// //                             Save
// //                           </button>
// //                           <button
// //                             onClick={() => setEditingId(null)}
// //                             className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs"
// //                           >
// //                             Cancel
// //                           </button>
// //                         </div>
// //                       ) : (
// //                         <div className="flex items-center justify-center gap-2">
// //                           <button
// //                             onClick={() => handleEditClick(strategy)}
// //                             className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
// //                           >
// //                             Update
// //                           </button>
// //                           <button
// //                             onClick={() => handleDelete(strategy.id)}
// //                             className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
// //                           >
// //                             Delete
// //                           </button>
// //                         </div>
// //                       )}
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default AssignStrategy;


// // src/pages/AssignStrategy.tsx
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

// type Strategy = {
//   id: number;
//   strategyName: string;
//   strategyDis: string;
// };

// const apiUrl = import.meta.env.VITE_API_URL;

// const AssignStrategy: React.FC = () => {
//   const [strategies, setStrategies] = useState<Strategy[]>([]);
//   const [strategyName, setStrategyName] = useState("");
//   const [strategyDis, setStrategyDis] = useState("");
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [editName, setEditName] = useState("");
//   const [editDis, setEditDis] = useState("");

//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

//   // 📌 API function
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });

//       if (res.data.status === true) {
//         setStrategies(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   // 📌 useEffect → automatically call API when component loads
//   useEffect(() => {
//     fetchStrategies();
//   }, []);

//   // ✅ Create Strategy (via modal)
//   const handleCreate = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!strategyName.trim()) {
//       toast.error("Please enter strategy name");
//       return;
//     }

//     const newStrategy = {
//       strategyName: strategyName.trim(),
//       strategyDis: strategyDis.trim(),
//     };

//     try {
//       const res = await axios.post(`${apiUrl}/admin/strategies`, newStrategy, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });

//       if (res.data.status === true) {
//         toast.success(res?.data?.message || "Strategy created");
//         setStrategies(res.data.data || []);
//         setStrategyName("");
//         setStrategyDis("");
//         setIsCreateModalOpen(false); // close modal
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   // ✅ Start Edit
//   const handleEditClick = (strategy: Strategy) => {
//     setEditingId(strategy.id);
//     setEditName(strategy.strategyName);
//     setEditDis(strategy.strategyDis);
//   };

//   // ✅ Save Edit
//   const handleUpdate = (id: number) => {
//     if (!editName.trim()) {
//       toast.error("Please enter strategy name");
//       return;
//     }

//     // TODO: Call your API here (PUT/PATCH) if backend supports update

//     setStrategies((prev) =>
//       prev.map((s) =>
//         s.id === id
//           ? { ...s, strategyName: editName.trim(), strategyDis: editDis.trim() }
//           : s
//       )
//     );
//     setEditingId(null);
//     toast.success("Strategy updated");
//   };

//   // ✅ Delete
//   const handleDelete = (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this strategy?")) return;

//     // TODO: Call your API here (DELETE) if backend supports delete

//     setStrategies((prev) => prev.filter((s) => s.id !== id));
//     toast.success("Strategy deleted");
//   };

//   // ✅ Close Create Modal
//   const handleCloseCreateModal = () => {
//     setIsCreateModalOpen(false);
//     setStrategyName("");
//     setStrategyDis("");
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       {/* Header row with title + button */}
//       <div className="flex items-center justify-between mb-4">
//         <h1 className="text-2xl font-semibold">Assign Strategy</h1>
//         <button
//           onClick={() => setIsCreateModalOpen(true)}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
//         >
//           + Create Strategy
//         </button>
//       </div>

//       {/* Strategy Table */}
//       <div className="bg-white rounded-lg shadow p-4">
//         <h2 className="text-lg font-semibold mb-3">Strategy List</h2>

//         {strategies.length === 0 ? (
//           <p className="text-gray-500 text-sm">
//             No strategies found. Click &quot;Create Strategy&quot; to add one.
//           </p>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full border border-gray-200">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
//                     #
//                   </th>
//                   <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
//                     Strategy Name
//                   </th>
//                   <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
//                     Strategy Description
//                   </th>
//                   <th className="px-4 py-2 border text-center text-xs font-semibold uppercase tracking-wide">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {strategies.map((strategy, index) => (
//                   <tr key={strategy.id} className="hover:bg-gray-50">
//                     <td className="px-4 py-2 border text-sm">{index + 1}</td>

//                     {/* Name cell */}
//                     <td className="px-4 py-2 border text-sm">
//                       {editingId === strategy.id ? (
//                         <input
//                           type="text"
//                           value={editName}
//                           onChange={(e) => setEditName(e.target.value)}
//                           className="border rounded px-2 py-1 w-full text-sm"
//                         />
//                       ) : (
//                         strategy.strategyName
//                       )}
//                     </td>

//                     {/* Description cell */}
//                     <td className="px-4 py-2 border text-sm">
//                       {editingId === strategy.id ? (
//                         <input
//                           type="text"
//                           value={editDis}
//                           onChange={(e) => setEditDis(e.target.value)}
//                           className="border rounded px-2 py-1 w-full text-sm"
//                         />
//                       ) : (
//                         strategy.strategyDis
//                       )}
//                     </td>

//                     {/* Actions */}
//                     <td className="px-4 py-2 border text-sm text-center">
//                       {editingId === strategy.id ? (
//                         <div className="flex items-center justify-center gap-2">
//                           <button
//                             onClick={() => handleUpdate(strategy.id)}
//                             className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
//                           >
//                             Save
//                           </button>
//                           <button
//                             onClick={() => setEditingId(null)}
//                             className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs"
//                           >
//                             Cancel
//                           </button>
//                         </div>
//                       ) : (
//                         <div className="flex items-center justify-center gap-2">
//                           <button
//                             onClick={() => handleEditClick(strategy)}
//                             className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
//                           >
//                             Update
//                           </button>
//                           <button
//                             onClick={() => handleDelete(strategy.id)}
//                             className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Create Strategy Modal */}
//       {isCreateModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
//             {/* Modal header */}
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <h2 className="text-lg font-semibold">Create Strategy</h2>
//               <button
//                 onClick={handleCloseCreateModal}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Modal body / form */}
//             <form className="px-4 py-4 space-y-4" onSubmit={handleCreate}>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Strategy Name
//                 </label>
//                 <input
//                   type="text"
//                   value={strategyName}
//                   onChange={(e) => setStrategyName(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter strategy name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Strategy Description
//                 </label>
//                 <input
//                   type="text"
//                   value={strategyDis}
//                   onChange={(e) => setStrategyDis(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter strategy description"
//                 />
//               </div>

//               {/* Modal footer buttons */}
//               <div className="flex justify-end gap-2 pt-2">
//                 <button
//                   type="button"
//                   onClick={handleCloseCreateModal}
//                   className="px-4 py-2 rounded border text-sm text-gray-700 hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Save Strategy
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AssignStrategy;


// src/pages/AssignStrategy.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

type Strategy = {
  id: number;
  strategyName: string;
  strategyDis: string;
};

const apiUrl = import.meta.env.VITE_API_URL;

const AssignStrategy: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategyName, setStrategyName] = useState("");
  const [strategyDis, setStrategyDis] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 🔹 Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [editName, setEditName] = useState("");
  const [editDis, setEditDis] = useState("");

  // 📌 API function
  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/strategies`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        setStrategies(res.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // 📌 useEffect → automatically call API when component loads
  useEffect(() => {
    fetchStrategies();
  }, []);

  // ✅ Create Strategy (via modal)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strategyName.trim()) {
      toast.error("Please enter strategy name");
      return;
    }

    const newStrategy = {
      strategyName: strategyName.trim(),
      strategyDis: strategyDis.trim(),
    };

    console.log(newStrategy,'newStrategy');
    
    try {
      const res = await axios.post(`${apiUrl}/admin/strategies`, newStrategy, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        toast.success(res?.data?.message || "Strategy created");
        setStrategyName("");
        setStrategyDis("");
         fetchStrategies()
        setIsCreateModalOpen(false); // close modal
       
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ Open Edit Modal
  const handleEditClick = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setEditName(strategy.strategyName);
    setEditDis(strategy.strategyDis);
    setIsEditModalOpen(true);
  };

  // ✅ Save Edit (Edit modal)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim()) {
      toast.error("Please enter strategy name");
      return;
    }

    if (!editingStrategy) {
      toast.error("No strategy selected");
      return;
    }

    const payload = {
      strategyName: editName.trim(),
      strategyDis: editDis.trim(),
      id:editingStrategy.id
    };

    try {
      // assuming route: PUT /admin/strategies/:id
      const res = await axios.put(
        `${apiUrl}/admin/strategies`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
            userid: localStorage.getItem("userID") || "",
          },
        }
      );

      if (res.data.status === true) {
        toast.success(res.data.message || "Strategy updated");
        setIsEditModalOpen(false);
        setEditingStrategy(null);
        fetchStrategies(); // reload list from backend
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ Delete
  const handleDelete = async(id: number) => {

    if (!window.confirm("Are you sure you want to delete this strategy?")) return;

    const res = await axios.delete(`${apiUrl}/admin/strategies/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        fetchStrategies();
        toast.success("Strategy deleted");
      } else {
        toast.error(res.data.message);
      }
  };

  // ✅ Close Create Modal
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setStrategyName("");
    setStrategyDis("");
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStrategy(null);
    setEditName("");
    setEditDis("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header row with title + button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Assign Strategy</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          + Create Strategy
        </button>
      </div>

      {/* Strategy Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Strategy List</h2>

        {strategies.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No strategies found. Click &quot;Create Strategy&quot; to add one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
                    #
                  </th>
                  <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
                    Strategy Name
                  </th>
                  <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
                    Strategy Description
                  </th>
                  <th className="px-4 py-2 border text-center text-xs font-semibold uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strategy, index) => (
                  <tr key={strategy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-sm">{index + 1}</td>

                    <td className="px-4 py-2 border text-sm">
                      {strategy.strategyName}
                    </td>

                    <td className="px-4 py-2 border text-sm">
                      {strategy.strategyDis}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 border text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(strategy)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDelete(strategy.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Strategy Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Create Strategy</h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Modal body / form */}
            <form className="px-4 py-4 space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Strategy Name
                </label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter strategy name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Strategy Description
                </label>
                <input
                  type="text"
                  value={strategyDis}
                  onChange={(e) => setStrategyDis(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter strategy description"
                />
              </div>

              {/* Modal footer buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 rounded border text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Save Strategy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Strategy Modal */}
      {isEditModalOpen && editingStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Update Strategy</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Modal body / form */}
            <form className="px-4 py-4 space-y-4" onSubmit={handleUpdate}>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Strategy Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter strategy name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Strategy Description
                </label>
                <input
                  type="text"
                  value={editDis}
                  onChange={(e) => setEditDis(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter strategy description"
                />
              </div>

              {/* Modal footer buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 rounded border text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                >
                  Update Strategy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignStrategy;


