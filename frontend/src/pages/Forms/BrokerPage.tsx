// // src/pages/AssignStrategy.tsx
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

// type Strategy = {
//   id: number;
//   strategyName: string;   // not really used, but may come from backend
//   strategyDis: string;    // not really used
//   brokerName: string;
//   brokerLink: string;
//   tag:any
// };

// const apiUrl = import.meta.env.VITE_API_URL;

// const BrokerPage: React.FC = () => {
//   const [strategies, setStrategies] = useState<Strategy[]>([]);
//   const [strategyName, setStrategyName] = useState(""); // create: brokerName
//   const [strategyDis, setStrategyDis] = useState("");   // create: brokerLink

//   // edit modal states
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingBroker, setEditingBroker] = useState<Strategy | null>(null);
//   const [editName, setEditName] = useState("");
//   const [editDis, setEditDis] = useState("");
//     const [editTag, setEditTag] = useState("");

//   // 📌 API function: fetch all brokers
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/broker`, {
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

//   useEffect(() => {
//     fetchStrategies();
//   }, []);

//   // ✅ Create Broker (Create modal)
//   const handleCreate = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!strategyName.trim()) {
//       toast.error("Please enter broker name");
//       return;
//     }

//     const newStrategy = {
//       brokerName: strategyName,
//       brokerLink: strategyDis,
//       tag:editTag
//     };

//     try {
//       const res = await axios.post(`${apiUrl}/admin/broker`, newStrategy, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });

//       if (res.data.status === true) {
//         toast.success(res?.data?.message || "Broker created");
//         setStrategyName("");
//         setStrategyDis("");
//         setIsCreateModalOpen(false);
//         fetchStrategies();
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   // ✅ Open Edit Modal
//   const handleEditClick = (strategy: Strategy) => {
//     setEditingBroker(strategy);
//     setEditName(strategy.brokerName || "");
//     setEditDis(strategy.brokerLink || "");
//     setIsEditModalOpen(true);
//     setEditTag(strategy.tag)
//   };

//   // ✅ Save Edit (Edit modal)
//   const handleUpdate = async () => {
//     if (!editName.trim()) {
//       toast.error("Please enter broker name");
//       return;
//     }

//     if (!editingBroker) {
//       toast.error("No broker selected");
//       return;
//     }

//     const payload = {
//       id: editingBroker.id,
//       brokerName: editName,
//       brokerLink: editDis,
//       tag:editTag
//     };

//     try {
//       const res = await axios.put(`${apiUrl}/admin/broker`, payload, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });

//       if (res.data.status === true) {
//         toast.success("Broker updated");
//         setIsEditModalOpen(false);
//         setEditingBroker(null);
//         fetchStrategies();
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   // ✅ Delete
//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this broker?")) return;

//     try {
//       const res = await axios.delete(`${apiUrl}/admin/broker/${id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });

//       if (res.data.status === true) {
//         fetchStrategies();
//         toast.success("Broker deleted");
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   // ✅ Close create modal + clear fields
//   const handleCloseCreateModal = () => {
//     setIsCreateModalOpen(false);
//     setStrategyName("");
//     setStrategyDis("");
//     setEditTag("")
//   };

//   const handleCloseEditModal = () => {
//     setIsEditModalOpen(false);
//     setEditingBroker(null);
//     setEditName("");
//     setEditTag("")
//     setEditDis("");
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       {/* Header row */}
//       <div className="flex items-center justify-between mb-4">
//         <h1 className="text-2xl font-semibold">Broker</h1>
//         <button
//           onClick={() => setIsCreateModalOpen(true)}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
//         >
//           + Create Broker
//         </button>
//       </div>

//       {/* Broker List Table */}
//       <div className="bg-white rounded-lg shadow p-4">
//         <h2 className="text-lg font-semibold mb-3">Broker List</h2>

//         {strategies.length === 0 ? (
//           <p className="text-gray-500 text-sm">
//             No brokers found. Click &quot;Create Broker&quot; to add one.
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
//                     Broker Name
//                   </th>
//                   <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
//                     Broker Tag
//                   </th>
//                   {/* <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
//                     Broker Image Link
//                   </th> */}
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
//                       {strategy.brokerName}
//                     </td>
//                      <td className="px-4 py-2 border text-sm">
//                       {strategy.tag}
//                     </td>

//                     {/* Link cell */}
//                     {/* <td className="px-4 py-2 border text-sm">
//                       {strategy.brokerLink}
//                     </td> */}

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

//       {/* Create Broker Modal */}
//       {isCreateModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
//             {/* Modal header */}
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <h2 className="text-lg font-semibold">Create Broker</h2>
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
//                   Broker Name
//                 </label>
//                 <input
//                   type="text"
//                   value={strategyName}
//                   onChange={(e) => setStrategyName(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter broker name"
//                 />
//               </div>

//                <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Broker Tag
//                 </label>
//                 <input
//                   type="text"
//                   value={editTag}
//                   onChange={(e) => setEditTag(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter broker name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Broker Image Link
//                 </label>
//                 <input
//                   type="text"
//                   value={strategyDis}
//                   onChange={(e) => setStrategyDis(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter broker image URL"
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
//                   Save Broker
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Edit Broker Modal */}
//       {isEditModalOpen && editingBroker && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
//             {/* Modal header */}
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <h2 className="text-lg font-semibold">Update Broker</h2>
//               <button
//                 onClick={handleCloseEditModal}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Modal body / form */}
//             <div className="px-4 py-4 space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Broker Name
//                 </label>
//                 <input
//                   type="text"
//                   value={editName}
//                   onChange={(e) => setEditName(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter broker name"
//                 />
//               </div>

//                <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Broker Tag
//                 </label>
//                 <input
//                   type="text"
//                   value={editTag}
//                   onChange={(e) => setEditTag(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter broker name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Broker Image Link
//                 </label>
//                 <input
//                   type="text"
//                   value={editDis}
//                   onChange={(e) => setEditDis(e.target.value)}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                   placeholder="Enter broker image URL"
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
//                   type="button"
//                   onClick={handleUpdate}
//                   className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Update Broker
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BrokerPage;



import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { FiEdit2, FiTrash2, FiPlus, FiBriefcase, FiImage, FiTag, FiSearch, FiFilter, FiDownload, FiEye, FiEyeOff } from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { TbListDetails } from "react-icons/tb";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { MdOutlineEditNote } from "react-icons/md";

type Strategy = {
  id: number;
  strategyName: string;  
  strategyDis: string;    
  brokerName: string;
  brokerLink: string;
  tag: any;
};

const apiUrl = import.meta.env.VITE_API_URL;

const BrokerPage: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategyName, setStrategyName] = useState(""); 
  const [strategyDis, setStrategyDis] = useState("");   
  const [searchText, setSearchText] = useState("");
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);

  // edit modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Strategy | null>(null);
  const [editName, setEditName] = useState("");
  const [editDis, setEditDis] = useState("");
  const [editTag, setEditTag] = useState("");

  // Stats
  const totalBrokers = strategies.length;
  const brokersWithImages = strategies.filter(s => s.brokerLink?.trim()).length;
  const uniqueTags = new Set(strategies.map(s => s.tag).filter(Boolean)).size;

  // AG Grid column definitions
  const [columnDefs] = useState<any>([
    {
      headerName: "No.",
      field: "index",
      width: 70,
      valueGetter: (params: any) => params.node.rowIndex + 1,
      sortable: false,
      filter: true,
      cellStyle: { 
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
    },
    {
      headerName: "BROKER NAME",
      field: "brokerName",
      flex: 1.2,
      minWidth: 180,
      sortable: true,
      filter: true,
      floatingFilter: false,
      cellStyle: { 
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
    },
    {
      headerName: "TAG",
      field: "tag",
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      floatingFilter: false,
      cellStyle: { 
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
    },
    {
      headerName: "ACTIONS",
      field: "actions",
      width: 120,
      sortable: false,
      filter: true,
      cellStyle: { 
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-2 h-full">
          <button
            onClick={() => handleEditClick(params.data)}
            className=" text-white px-3 py-1 rounded text-xs"
            title="Edit broker"
          >
            <MdOutlineEditNote size={25}/>
          </button>

          <div className="h-5 w-[1px] bg-gray-300"></div>

          <button
            onClick={() => handleDelete(params.data.id)}
            className=" text-white px-3 py-1 rounded text-xs"
            title="Delete broker"
          >
            <RiDeleteBin6Fill size={18}/>
          </button>
        </div>
      ),
    }
  ]);

  // Default column definitions
  const defaultColDef = {
    sortable: true,
    filter: false, 
    resizable: true,
    flex: 1,
    minWidth: 100,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px'
    },
    headerClass: 'font-semibold text-gray-700'
  };




  // 📌 API function: fetch all brokers
  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/broker`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        setStrategies(res.data.data || []);
        setFilteredStrategies(res.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredStrategies(strategies);
    } else {
      const filtered = strategies.filter(broker =>
        broker.brokerName?.toLowerCase().includes(searchText.toLowerCase()) ||
        broker.tag?.toLowerCase().includes(searchText.toLowerCase()) ||
        broker.brokerLink?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStrategies(filtered);
    }
  }, [searchText, strategies]);

  // ✅ Create Broker (Create modal)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strategyName.trim()) {
      toast.error("Please enter broker name");
      return;
    }

    const newStrategy = {
      brokerName: strategyName,
      brokerLink: strategyDis,
      tag: editTag
    };

    try {
      const res = await axios.post(`${apiUrl}/admin/broker`, newStrategy, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        toast.success(res?.data?.message || "Broker created successfully!");
        setStrategyName("");
        setStrategyDis("");
        setEditTag("");
        setIsCreateModalOpen(false);
        fetchStrategies();
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ Open Edit Modal
  const handleEditClick = (strategy: Strategy) => {
    setEditingBroker(strategy);
    setEditName(strategy.brokerName || "");
    setEditDis(strategy.brokerLink || "");
    setEditTag(strategy.tag || "");
    setIsEditModalOpen(true);
  };

  // ✅ Save Edit (Edit modal)
  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("Please enter broker name");
      return;
    }

    if (!editingBroker) {
      toast.error("No broker selected");
      return;
    }

    const payload = {
      id: editingBroker.id,
      brokerName: editName,
      brokerLink: editDis,
      tag: editTag
    };

    try {
      const res = await axios.put(`${apiUrl}/admin/broker`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        toast.success("Broker updated successfully!");
        setIsEditModalOpen(false);
        setEditingBroker(null);
        fetchStrategies();
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this broker?")) return;

    try {
      const res = await axios.delete(`${apiUrl}/admin/broker/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        fetchStrategies();
        toast.success("Broker deleted successfully!");
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ Close modals
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setStrategyName("");
    setStrategyDis("");
    setEditTag("");
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBroker(null);
    setEditName("");
    setEditTag("");
    setEditDis("");
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Broker Name,Tag,Image Link"].join(",") + "\n"
      + strategies.map(s => 
          `${s.id},"${s.brokerName}","${s.tag || ''}","${s.brokerLink || ''}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `brokers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Data exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                <FiBriefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Broker Management</h1>
                <p className="text-gray-600 mt-1">Manage and organize all your brokers in one place</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
            >
              <FiDownload className="w-4 h-4" />
              Export CSV
            </button> */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white! px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <FiPlus className="w-5 h-5" />
              Create Broker
            </button>
          </div>
        </div>

        {/* Search Bar */}


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Total Brokers</p>
                <p className="text-4xl font-bold text-gray-900">{totalBrokers}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl">
                <HiOutlineBuildingOffice2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <span className="flex-1">Active brokers in system</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">With Image Links</p>
                <p className="text-4xl font-bold text-gray-900">{brokersWithImages}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl">
                <FiImage className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <span className="flex-1">Brokers with image URLs</span>
                <span className="font-semibold">{totalBrokers > 0 ? Math.round((brokersWithImages / totalBrokers) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-2">Unique Tags</p>
                <p className="text-4xl font-bold text-gray-900">{uniqueTags}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl">
                <FiTag className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <span className="flex-1">Different tags used</span>
              </div>
            </div>
          </div>
        </div>

        {/* AG Grid Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2.5 rounded-lg">
                  <TbListDetails className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Brokers List</h2>
                  <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                    <FiFilter className="w-3 h-3" />
                    Click column headers to sort, use search to filter
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  <span className="font-semibold text-blue-700">{filteredStrategies.length}</span> brokers found
                </div>
                {searchText && (
                  <button
                    onClick={() => setSearchText("")}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredStrategies.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiBriefcase className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">
                {searchText ? "No brokers found" : "No brokers yet"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                {searchText 
                  ? `No brokers match "${searchText}". Try a different search term.`
                  : "Get started by creating your first broker. Add brokers to manage them here."}
              </p>
              {!searchText && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Your First Broker
                </button>
              )}
            </div>
          ) : (
            <div className="ag-theme-alpine custom-ag-grid" style={{ height: 550, width: '100%' }}>
              <AgGridReact
                rowData={filteredStrategies}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={10}
                animateRows={true}
                rowSelection="single"
                suppressCellFocus={true}
                domLayout="normal"
                onGridReady={(params) => params.api.sizeColumnsToFit()}
                onFirstDataRendered={(params) => params.api.sizeColumnsToFit()}

                                // getRowStyle={getRowStyle}
                rowHeight={40}
                headerHeight={40}

                                // Enhanced Grid Features
                enableCellTextSelection={true}
                ensureDomOrder={true}
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

      {/* Create Broker Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                  <FiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create New Broker</h2>
                  <p className="text-blue-100 mt-1">Add a new broker to your system</p>
                </div>
              </div>
              <button
                onClick={handleCloseCreateModal}
                className="absolute top-5 right-6 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body / form */}
            <form className="px-6 py-6 space-y-5" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <HiOutlineBuildingOffice2 className="w-4 h-4 text-blue-600" />
                  Broker Name *
                </label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50"
                  placeholder="Enter broker name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiTag className="w-4 h-4 text-purple-600" />
                  Broker Tag
                </label>
                <input
                  type="text"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50"
                  placeholder="e.g., premium, standard, basic"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiImage className="w-4 h-4 text-green-600" />
                  Broker Image Link
                </label>
                <input
                  type="text"
                  value={strategyDis}
                  onChange={(e) => setStrategyDis(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50"
                  placeholder="https://example.com/image.png"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  Provide a direct link to the broker's logo/image
                </p>
              </div>

              {/* Modal footer buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-all hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white! px-6 py-3 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all"
                >
                  <FiPlus className="w-4 h-4" />
                  Create Broker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Broker Modal */}
      {isEditModalOpen && editingBroker && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-green-600 to-green-700">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                  <FiEdit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Update Broker</h2>
                  <p className="text-green-100 mt-1">Editing: {editingBroker.brokerName}</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="absolute top-5 right-6 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body / form */}
            <div className="px-6 py-6 space-y-5">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <HiOutlineBuildingOffice2 className="w-4 h-4 text-blue-600" />
                  Broker Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50"
                  placeholder="Enter broker name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiTag className="w-4 h-4 text-purple-600" />
                  Broker Tag
                </label>
                <input
                  type="text"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50"
                  placeholder="e.g., premium, standard, basic"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiImage className="w-4 h-4 text-green-600" />
                  Broker Image Link
                </label>
                <input
                  type="text"
                  value={editDis}
                  onChange={(e) => setEditDis(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50"
                  placeholder="https://example.com/image.png"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  Provide a direct link to the broker's logo/image
                </p>
              </div>

              {/* Modal footer buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-all hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white! px-6 py-3 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Update Broker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerPage;