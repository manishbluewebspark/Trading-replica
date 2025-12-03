


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

//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

//   // 🔹 Edit modal state
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
//   const [editName, setEditName] = useState("");
//   const [editDis, setEditDis] = useState("");

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

//     console.log(newStrategy,'newStrategy');
    
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
//         setStrategyName("");
//         setStrategyDis("");
//          fetchStrategies()
//         setIsCreateModalOpen(false); // close modal
       
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   // ✅ Open Edit Modal
//   const handleEditClick = (strategy: Strategy) => {
//     setEditingStrategy(strategy);
//     setEditName(strategy.strategyName);
//     setEditDis(strategy.strategyDis);
//     setIsEditModalOpen(true);
//   };

//   // ✅ Save Edit (Edit modal)
//   const handleUpdate = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!editName.trim()) {
//       toast.error("Please enter strategy name");
//       return;
//     }

//     if (!editingStrategy) {
//       toast.error("No strategy selected");
//       return;
//     }

//     const payload = {
//       strategyName: editName.trim(),
//       strategyDis: editDis.trim(),
//       id:editingStrategy.id
//     };

//     try {
//       // assuming route: PUT /admin/strategies/:id
//       const res = await axios.put(
//         `${apiUrl}/admin/strategies`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: localStorage.getItem("userID") || "",
//           },
//         }
//       );

//       if (res.data.status === true) {
//         toast.success(res.data.message || "Strategy updated");
//         setIsEditModalOpen(false);
//         setEditingStrategy(null);
//         fetchStrategies(); // reload list from backend
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   // ✅ Delete
//   const handleDelete = async(id: number) => {

//     if (!window.confirm("Are you sure you want to delete this strategy?")) return;

//     const res = await axios.delete(`${apiUrl}/admin/strategies/${id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });

//       if (res.data.status === true) {
//         fetchStrategies();
//         toast.success("Strategy deleted");
//       } else {
//         toast.error(res.data.message);
//       }
//   };

//   // ✅ Close Create Modal
//   const handleCloseCreateModal = () => {
//     setIsCreateModalOpen(false);
//     setStrategyName("");
//     setStrategyDis("");
//   };

//   const handleCloseEditModal = () => {
//     setIsEditModalOpen(false);
//     setEditingStrategy(null);
//     setEditName("");
//     setEditDis("");
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

//                     <td className="px-4 py-2 border text-sm">
//                       {strategy.strategyName}
//                     </td>

//                     <td className="px-4 py-2 border text-sm">
//                       {strategy.strategyDis}
//                     </td>

//                     {/* Actions */}
//                     <td className="px-4 py-2 border text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => handleEditClick(strategy)}
//                           className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
//                         >
//                           Update
//                         </button>
//                         <button
//                           onClick={() => handleDelete(strategy.id)}
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
//                         >
//                           Delete
//                         </button>
//                       </div>
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

//       {/* Edit Strategy Modal */}
//       {isEditModalOpen && editingStrategy && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
//             {/* Modal header */}
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <h2 className="text-lg font-semibold">Update Strategy</h2>
//               <button
//                 onClick={handleCloseEditModal}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Modal body / form */}
//             <form className="px-4 py-4 space-y-4" onSubmit={handleUpdate}>
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Strategy Name
//                 </label>
//                 <input
//                   type="text"
//                   value={editName}
//                   onChange={(e) => setEditName(e.target.value)}
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
//                   value={editDis}
//                   onChange={(e) => setEditDis(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter strategy description"
//                 />
//               </div>

//               {/* Modal footer buttons */}
//               <div className="flex justify-end gap-2 pt-2">
//                 <button
//                   type="button"
//                   onClick={handleCloseEditModal}
//                   className="px-4 py-2 rounded border text-sm text-gray-700 hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Update Strategy
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




import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import { Plus, Edit2, Trash2, Search, RefreshCw, X, Save } from "lucide-react";


import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { MdOutlineEditNote } from "react-icons/md";

type Strategy = {
  id: number;
  strategyName: string;
  strategyDis: string;
};

const apiUrl = import.meta.env.VITE_API_URL;

const AssignStrategy: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Create Modal States
  const [strategyName, setStrategyName] = useState("");
  const [strategyDis, setStrategyDis] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [editName, setEditName] = useState("");
  const [editDis, setEditDis] = useState("");
  
  // AG Grid Ref
  const gridRef = useRef<AgGridReact>(null);
  
  // Filtered strategies for search
  const filteredStrategies = strategies.filter(strategy =>
    strategy.strategyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strategy.strategyDis.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Table Columns - EXACTLY AS BEFORE
  const columnDefs = [
    { 
      headerName: "No.", 
      valueGetter: "node.rowIndex + 1", 
      width: 80, 
      filter: true,
    },
    { 
      headerName: "Strategy Name", 
      field: "strategyName", 
      flex: 1, 
      filter: true,
    },
    { 
      headerName: "Strategy Description", 
      field: "strategyDis", 
      flex: 1, 
      filter: true,
    },
    {
      headerName: "Actions",
      width: 200,
      filter: true,
      cellRenderer: (params: any) => {
        return (
          <div className="flex gap-2">
            <button
              className=" text-white px-3 py-1 rounded text-xs"
              onClick={() => handleEditClick(params.data)}
            >
              <MdOutlineEditNote size={25}/>
            </button>

            <div className="h-5 w-[1px] bg-gray-300 mt-2"></div>

            <button
              className=" text-white px-3 py-1 rounded text-xs"
              onClick={() => handleDelete(params.data.id)}
            >
              <RiDeleteBin6Fill size={18}/>
            </button>
          </div>
        );
      },
    },
  ];
  
  // Fetch Strategies
  const fetchStrategies = async () => {
    setLoading(true);
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
      toast.error(error.message || "Failed to fetch strategies");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStrategies();
  }, []);
  
  // CREATE Strategy
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!strategyName.trim()) {
      return toast.error("Please enter a strategy name");
    }
    
    const newStrategy = {
      strategyName: strategyName.trim(),
      strategyDis: strategyDis.trim(),
    };
    
    try {
      const res = await axios.post(`${apiUrl}/admin/strategies`, newStrategy, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      
      if (res.data.status === true) {
        toast.success("Strategy created successfully!");
        setStrategyName("");
        setStrategyDis("");
        setIsCreateModalOpen(false);
        fetchStrategies();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create strategy");
    }
  };
  
  // OPEN Edit Modal
  const handleEditClick = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setEditName(strategy.strategyName);
    setEditDis(strategy.strategyDis);
    setIsEditModalOpen(true);
  };
  
  // UPDATE Strategy
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingStrategy) return;
    if (!editName.trim()) {
      return toast.error("Please enter a strategy name");
    }
    
    const payload = {
      strategyName: editName.trim(),
      strategyDis: editDis.trim(),
      id: editingStrategy.id,
    };
    
    try {
      const res = await axios.put(`${apiUrl}/admin/strategies`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      
      if (res.data.status === true) {
        toast.success("Strategy updated successfully!");
        setIsEditModalOpen(false);
        setEditingStrategy(null);
        fetchStrategies();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update strategy");
    }
  };
  
  // DELETE Strategy
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this strategy? This action cannot be undone.")) return;
    
    try {
      const res = await axios.delete(`${apiUrl}/admin/strategies/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      
      if (res.data.status === true) {
        toast.success("Strategy deleted successfully!");
        fetchStrategies();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete strategy");
    }
  };
  
  // Close Modals
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


    const defaultColDef = useMemo(() => ({
      resizable: true,
      sortable: true,
      filter: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      suppressMovable: true,
      cellStyle: { 
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      },
    }), []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Assign Strategy
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and assign trading strategies
              </p>
            </div>
            
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white! px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Create Strategy
            </button>
          </div>
          
          {/* Stats and Search Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">

            </div>
          </div>
        </div>
        
        {/* AG Grid Table - EXACTLY AS BEFORE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Strategy List
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({filteredStrategies.length} items)
              </span>
            </h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading strategies...</p>
              </div>
            </div>
          ) : (
            <div className="ag-theme-alpine custom-ag-grid" style={{ height: 500, width: "100%" }}>
              <AgGridReact
                ref={gridRef}
                rowData={filteredStrategies}
                columnDefs={columnDefs}
                pagination={true}
                paginationPageSize={10}
                domLayout="autoHeight"
                defaultColDef={defaultColDef}
                                rowHeight={50}
                headerHeight={50}


                                // Enhanced Grid Features
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressCellFocus={true}
                animateRows={true}
                enableRangeSelection={true}
                enableRangeHandle={true}
                enableCharts={true}
                enableFillHandle={true}


                                // Enhanced Styling
                rowClass="ag-row-custom"
                suppressRowHoverHighlight={false}
                enableBrowserTooltips={true}
                
                overlayLoadingTemplate={
                  '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading orders...</span></div>'
                }
                overlayNoRowsTemplate={
                  '<div class="flex flex-col items-center justify-center h-full text-gray-500"><svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No orders match your search criteria</div>'
                }
              />
            </div>
          )}
        </div>
      </div>
      
      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Strategy</h2>
              <button 
                onClick={handleCloseCreateModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form className="p-6" onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy Name *
                  </label>
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter strategy name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy Description
                  </label>
                  <textarea
                    value={strategyDis}
                    onChange={(e) => setStrategyDis(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Enter strategy description"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save size={18} />
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-999999 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Update Strategy</h2>
              <button 
                onClick={handleCloseEditModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form className="p-6" onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy Name *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter strategy name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy Description
                  </label>
                  <textarea
                    value={editDis}
                    onChange={(e) => setEditDis(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Enter strategy description"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white! rounded-lg transition-colors"
                >
                  Update
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
