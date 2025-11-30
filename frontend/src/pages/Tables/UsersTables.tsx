


// // src/pages/UsersTables.tsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";

// type Role = "admin" | "user";

// export type AngelCredential = {
//   clientId: string;
//   totpSecret: string;
//   password: string;
// };

// export type User = {
//   id: number;
//   firstName?: string | null;
//   lastName?: string | null;
//   email: string;
//   username: string;
//   phoneNumber?: string | null;
//   role: Role;
//   isChecked: boolean;
//   brokerName?: string | null;
//   brokerImageLink?: string | null;
//   angelLoginUser?: boolean | null;
//   authToken?: string | null;
//   feedToken?: string | null;
//   refreshToken?: string | null;
//   resetCode?: string | null;
//   resetCodeExpire?: string | null;
//   createdAt: string; // ISO
//   updatedAt: string; // ISO
//   angelCredential: AngelCredential;
//   packageName:string;
//   strategyName:string;
//   packageDate:any
// };



// const API_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:5001/api"

// export default function UsersTables() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string>("");
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);


//   const [strategyList, setStrategyList] = useState([]); // all strategies from backend
// const [selectedStrategyId, setSelectedStrategyId] = useState(""); // dropdown selected id


//   // actions menu state
//   const [openMenuId, setOpenMenuId] = useState<number | null>(null);
//   const tableRef = useRef<HTMLDivElement | null>(null);

//   // ==== Create Group Modal state ====
//   const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
//     const [isPackageAssignModalOpen, setIsPackageAssignModalOpen] = useState(false);
//   const [selectedUserForGroup, setSelectedUserForGroup] = useState<User | null>(
//     null
//   );
//   const [groupName, setGroupName] = useState("");
//     const [date, setDate] = useState("");
//     const [packageFromDate, setPackageFromDate] = useState("");

    
//   const [groupDescription, setGroupDescription] = useState("");
//   const [creating, setCreating] = useState(false);

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const res = await axios.get(`${API_URL}/users/get-users`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       const payload = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
//       setUsers(payload);
//     } catch (err: any) {
//       setError(
//         err?.response?.data?.message || err?.message || "Failed to load users"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // Close actions menu when clicking outside the table
//   useEffect(() => {
//     const onDocClick = (e: MouseEvent) => {
//       if (!tableRef.current) return;
//       if (!tableRef.current.contains(e.target as Node)) {
//         setOpenMenuId(null);
//       }
//     };
//     document.addEventListener("click", onDocClick);
//     return () => document.removeEventListener("click", onDocClick);
//   }, []);

//   // Close modal on Escape
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape" && isGroupModalOpen && !creating) {
//         closeGroupModal();
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [isGroupModalOpen, creating]);

//   // Filter (client-side)
//   const filtered = useMemo(() => {
//     if (!search.trim()) return users;
//     const q = search.toLowerCase();
//     return users.filter((u) => {
//       const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
//       return (
//         u.email?.toLowerCase().includes(q) ||
//         u.username?.toLowerCase().includes(q) ||
//         u.phoneNumber?.toLowerCase?.().includes(q) ||
//         fullName.includes(q) ||
//         u.role?.toLowerCase().includes(q) ||
//         (u.brokerName ?? "").toLowerCase().includes(q)
//       );
//     });
//   }, [users, search]);

//   // Pagination (client-side)
//   const total = filtered.length;
//   const totalPages = Math.max(1, Math.ceil(total / pageSize));
//   const currentPage = Math.min(page, totalPages);
//   const start = (currentPage - 1) * pageSize;
//   const pageRows = filtered.slice(start, start + pageSize);

//   const fmtDate = (iso?: string) =>
//     iso ? new Date(iso).toLocaleString("en-IN") : "-";

//   const fullName = (u: User) =>
//     [u.firstName, u.lastName].filter(Boolean).join(" ") || "-";

//   const handleGenerateToken = async (user: User) => {
//     try {
//       const response = await axios.get(`${API_URL}/admin/getuser/profile`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           UserId: user.id,
//         },
//       });

//       const data = response.data;

//       if (data.status === true) {
//         const angel_auth_token = data.data.authToken;
//         const angel_refresh_token = data.data.refreshToken;
//         const angel_feed_token = data.data.feedToken;
//         const userID = data.data.id;

//         // ✅ fixed the storage order
//         localStorage.setItem("angel_token", angel_auth_token || "");
//         localStorage.setItem("angel_feed_token", angel_feed_token || "");
//         localStorage.setItem("angel_refresh_token", angel_refresh_token || "");
//         localStorage.setItem("userID", String(userID));

//         toast.success("Successful: fetched AngelOne tokens!");
//       } else {
//         toast.error(data?.data?.error || "Failed to fetch tokens");
//       }
//     } catch (error: any) {
//       toast.error(error?.message || "Something went wrong");
//     }
//   };

//   // ─── Row Action handlers ───────────────────────────────────────────
//   const handleRowLogin = async (user: User) => {
    
//       try {
          
//          const {data} = await axios.get(
//           `${API_URL}/admin/login/totp/angelone`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               userId: `${user.id}`,
//             },
//           }
//         );

  
//        if(data.status==true) {
       
//        let angel_auth_token = data.data.jwtToken
//        let angel_refresh_token = data.data.refreshToken
//        let angel_feed_token = data.data.feedToken

//        localStorage.setItem("angel_token", angel_auth_token);
//        localStorage.setItem("angel_feed_token", angel_refresh_token);
//         localStorage.setItem("angel_refresh_token", angel_feed_token);
//          localStorage.setItem("userID", String(user.id));

    
//         toast.success("Login Successful in AngelOne!");
//        }else{
//          toast.error(data.message);
//        }


//       } catch (error:any) {
//         toast.error(error.message);
//       }
    

//   };



//   const fetchStrategies = async () => {
//   try {
//     const res = await axios.get(`${API_URL}/admin/strategies`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         AngelOneToken: localStorage.getItem("angel_token") || "",
//         userid: localStorage.getItem("userID"),
//       },
//     });

//     console.log(res);
    

//     if (res.data.status === true) {
//       setStrategyList(res.data.data || []);
//     } else {
//       toast.error(res.data.message);
//     }
//   } catch (err:any) {
//     toast.error(err.message);
//   }
// };

//   const handleRowCreateGroup = async(user: User) => {

//     setOpenMenuId(null);
//     setSelectedUserForGroup(user);
//     setGroupName("");
//     setGroupDescription("");
    
//    await fetchStrategies(); // ⭐ load all strategies first

//   setIsPackageAssignModalOpen(true);
//   };

//   const submitCreateStrtegy  = async function () {
 
//     let reqData = {
//       strategyName:groupName,
//       strategyDis:groupDescription,
//       id:selectedUserForGroup?.id
      
//     }

//     // 1) Create the group — adjust endpoint if different
//       const createRes = await axios.put(
//         `${API_URL}/users/package/update`,
//         reqData,
//          {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if(createRes.data.status==true) {
//         toast.success(createRes.data.message);
//           fetchUsers()
//       }else{
//          toast.error( createRes?.data?.message);
//       }
      

     


//   }


  

//     const handleAssignPackage = (user: User) => {

//     //  toast.info(`Currently not Working ${user.id}`);
//     setOpenMenuId(null);
//     setSelectedUserForGroup(user);
//     setGroupName("");
//     setGroupDescription("");
//     setIsGroupModalOpen(true);
//   };

//   const handleRowUpdateProfile = (user: User) => {
   
//     toast.info(`Currently not Working ${user.id}`);

//   };

//   const toggleMenu = (id: number) => {
//     setOpenMenuId((prev) => (prev === id ? null : id));
//   };

//   // ==== Create Group Modal handlers ====
//   const closeGroupModal = () => {
   
//     setIsGroupModalOpen(false);
//     setSelectedUserForGroup(null);
//   };


//     // ==== Create Group Modal handlers ====
//   const closePackageModal = () => {

//     setIsPackageAssignModalOpen(false);

//   };

//   const submitCreateGroup = async () => {

//     if (!groupName.trim() || !selectedUserForGroup) {
//       toast.error("Group name is required.");
//       return;
//     }
    
//     let reqObj = {
//       id:selectedUserForGroup.id,
//        packageName:groupName,
//        packageDis:groupDescription,
//        packageDate:date,
//        packageFromDate:packageFromDate

//     }

//     try {

//       setCreating(true);

//       // 1) Create the group — adjust endpoint if different
//       const createRes = await axios.put(
//         `${API_URL}/users/package/update`,
//         reqObj,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       console.log(createRes);
      

//       closeGroupModal();

    
//     } catch (err: any) {
//       toast.error(
//         err?.response?.data?.message || err?.message || "Failed to create group"
//       );
//     } finally {
//       setCreating(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-start gap-3">
//         <h2 className="text-xl font-semibold">Users</h2>

//         {/* Search next to heading */}
//         <div className="flex gap-3 md:ml-4">
//           <input
//             className="border rounded px-3 py-2 w-90"
//             placeholder="Search name, email, username, phone..."
//             value={search}
//             onChange={(e) => {
//               setSearch(e.target.value);
//               setPage(1);
//             }}
//           />
//           <button
//             onClick={fetchUsers}
//             className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
//           >
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Status */}
//       {loading && <p>Loading…</p>}
//       {!!error && <p className="text-red-600">{error}</p>}
//       {!loading && !error && users.length === 0 && <p>No users found.</p>}

//       {/* Table */}
//       {!loading && !error && users.length > 0 && (
//         <div ref={tableRef} className="w-full overflow-auto rounded border">
//           <table className="min-w-[1100px] w-full text-sm">
//             <thead className="bg-gray-50">
//               <tr className="text-left">
//                 <th className="px-3 py-2 border-b">#</th>
//                  <th className="px-3 py-2 border-b">UniqueId</th>
//                 <th className="px-3 py-2 border-b">Name</th>
//                 <th className="px-3 py-2 border-b">Email</th>
//                 <th className="px-3 py-2 border-b">Username</th>
//                  <th className="px-3 py-2 border-b">Phone</th>
//                   <th className="px-3 py-2 border-b">Assign Strategy</th>
//                     <th className="px-3 py-2 border-b">Assign Package</th>
//                      <th className="px-3 py-2 border-b"> Package Date</th>
//                   <th className="px-3 py-2 border-b">createdAt</th>
//                     <th className="px-3 py-2 border-b">Angel Login</th>
                 
//                   {/* <th className="px-3 py-2 border-b">Assign Package</th>
//                    */}
               
//                 {/* <th className="px-3 py-2 border-b">Broker</th> */}
              
//                 {/* <th className="px-3 py-2 border-b">AngelClientId</th> */}
//                 <th className="px-3 py-2 border-b text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {pageRows.map((u, idx) => (
//                 <tr key={u.id} className="odd:bg-white even:bg-gray-50">
//                   <td className="px-3 py-2 border-b">{start + idx + 1}</td>
//                        <td className="px-3 py-2 border-b">{u.id}</td>
//                   <td className="px-3 py-2 border-b">{fullName(u)}</td>
//                   <td className="px-3 py-2 border-b">{u.email}</td>
//                   <td className="px-3 py-2 border-b">{u.username}</td>
//                   <td className="px-3 py-2 border-b">{u.phoneNumber ?? "-"}</td>
//                   {/* <td className="px-3 py-2 border-b">{u.brokerName ?? "-"}</td> */}

//                   {/* <td className="px-3 py-2 border-b">{u.packageName ?? "-"}</td> */}

//                    <td className="px-3 py-2 border-b">{u.strategyName ?? "-"}</td> 
//                     <td className="px-3 py-2 border-b">{u.packageName ?? "-"}</td> 
//                      <td className="px-3 py-2 border-b">{u.packageDate ?? "-"}</td> 
                  
//                    <td className="px-3 py-2 border-b">{u.createdAt ?? "-"}</td>
//                   <td
//                     className={`px-3 py-2 border-b font-medium text-center ${
//                       u.angelLoginUser
//                         ? "text-green-700 bg-green-50"
//                         : "text-red-700 bg-red-50"
//                     }`}
//                   >
//                     {u.angelLoginUser ? "Yes" : "No"}
//                   </td>

//                   {/* <td className="px-3 py-2 border-b">
//                     {u?.angelCredential?.clientId}
//                   </td> */}

//                   {/* Actions menu (3-dots) */}
//                   <td className="px-3 py-2 border-b text-center relative">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         toggleMenu(u.id);
//                       }}
//                       className="p-1 hover:bg-gray-100 rounded inline-flex"
//                       aria-label="Actions"
//                     >
//                       <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
//                     </button>

//                     {openMenuId === u.id && (
//                       <div
//                         onClick={(e) => e.stopPropagation()}
//                         className="absolute right-2 top-8 z-20 bg-white shadow-lg border rounded-md w-44 text-sm overflow-hidden"
//                       >
//                         <button
//                           onClick={() => handleGenerateToken(u)}
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           Get Token
//                         </button>
//                         <button
//                           onClick={() => handleRowLogin(u)}
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           Login User
//                         </button>
//                         <button
//                           onClick={() => handleRowCreateGroup(u)}
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           Assign Group
//                         </button>
//                         <button
//                           onClick={() => handleRowUpdateProfile(u)}
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           Update Profile
//                         </button>
//                         {/* <button
//                             onClick={() => window.open(`${import.meta.env.VITE_API_URL_FORNTEND}/new/deshboard`, "_blank")}
//                           >
//                             View Client Dashboard
//                           </button> */}

//                           <button
//                             onClick={() =>
//                               window.location.href = `${import.meta.env.VITE_API_URL_FORNTEND}/new/deshboard`
//                             }
//                              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                           >
//                             View Client Dashboard
//                           </button>

//                            <button
//                             className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                              onClick={() => handleAssignPackage(u)}
                            
//                           >
//                            Assign Package
//                           </button>
                         
//                       </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Pagination */}
//       {!loading && !error && total > 0 && (
//         <div className="mt-4 flex items-center gap-3 flex-wrap">
//           <span className="text-sm text-gray-600">
//             Showing {start + 1}-{Math.min(start + pageSize, total)} of {total}
//           </span>

//           <select
//             value={pageSize}
//             onChange={(e) => {
//               setPageSize(Number(e.target.value));
//               setPage(1);
//             }}
//             className="border rounded px-2 py-1"
//           >
//             {[10, 25, 50, 100].map((n) => (
//               <option key={n} value={n}>
//                 {n} / page
//               </option>
//             ))}
//           </select>

//           <div className="ml-auto flex gap-2">
//             <button
//               disabled={currentPage <= 1}
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               className={`px-3 py-1 rounded border ${
//                 currentPage <= 1
//                   ? "text-gray-400 border-gray-200"
//                   : "hover:bg-gray-100"
//               }`}
//             >
//               Prev
//             </button>
//           </div>

//           <span className="px-2 py-1 text-sm">
//             Page {currentPage} / {totalPages}
//           </span>

//           <div className="flex gap-2">
//             <button
//               disabled={currentPage >= totalPages}
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               className={`px-3 py-1 rounded border ${
//                 currentPage >= totalPages
//                   ? "text-gray-400 border-gray-200"
//                   : "hover:bg-gray-100"
//               }`}
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ==== this is Create Package Form ==== */}
//       {isGroupModalOpen && (
//         <div
//           className="fixed inset-0 z-40 flex items-center justify-center"
//           aria-modal="true"
//           role="dialog"
//         >
//           {/* Backdrop */}
//           <div
//             className="absolute inset-0 bg-black/40"
//             onClick={closeGroupModal}
//           />

//           {/* Modal Card */}
//           <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-xl border">
//             <div className="px-5 py-4 border-b">
//               <h3 className="text-lg font-semibold">Package Name</h3>
//               {/* <p className="text-sm text-gray-600 mt-1">
//                 Package Name{" "}
//                 <span className="font-medium">
//                   {selectedUserForGroup ? selectedUserForGroup.username : "-"}
//                 </span>{" "}
//                 to a new group.
//               </p> */}
//             </div>

//             <div className="px-5 py-4 space-y-3">
//               <div>
//                 <label className="block text-sm mb-1">Package Name *</label>
//                 <input
//                   value={groupName}
//                   onChange={(e) => setGroupName(e.target.value)}
//                   className="w-full border rounded px-3 py-2"
//                   placeholder="Package Name"
//                   autoFocus
//                 />
//               </div>

//                <div>
//               <label className="block text-sm mb-1">Select Package To Date</label>
//               <input
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//               />
//             </div>

            

//               <div>
//               <label className="block text-sm mb-1">Select Package From Date</label>
//               <input
//                 type="date"
//                 value={packageFromDate}
//                 onChange={(e) => setPackageFromDate(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//               />
//             </div>


//               {/* <div>
//                 <label className="block text-sm mb-1">Description</label>
//                 <textarea
//                   value={groupDescription}
//                   onChange={(e) => setGroupDescription(e.target.value)}
//                   className="w-full border rounded px-3 py-2"
//                   placeholder="Optional notes…"
//                   rows={3}
//                 />
//               </div> */}
//             </div>

//             <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
//               <button
//                 onClick={closeGroupModal}
//                 disabled={creating}
//                 className="px-4 py-2 rounded border hover:bg-gray-50 disabled:opacity-60"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={submitCreateGroup}
//                 disabled={creating}
//                 className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
//               >
//                 {creating ? "Creating…" : "Create & Assign"}
//               </button>

//             </div>
//           </div>
//         </div>
//       )}


//       {/*  this is Assign Group Form  */}

//       {isPackageAssignModalOpen && (
//   <div className="fixed inset-0 z-40 flex items-center justify-center">
//     <div className="absolute inset-0 bg-black/40" onClick={closePackageModal} />

//     <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-xl border">
//       <div className="px-5 py-4 border-b">
//         <h3 className="text-lg font-semibold">Assign Strategy</h3>
//       </div>

//       <div className="px-5 py-4 space-y-3">

//         {/* 🔽 Strategy Dropdown */}
//         <div>
//           <label className="block text-sm mb-1">Select Strategy *</label>
//           <select
//             className="w-full border rounded px-3 py-2"
//             value={selectedStrategyId}
//             onChange={(e) => {
//               const strategyId = e.target.value;
//               setSelectedStrategyId(strategyId);

//               // Auto-fill fields
//               const selected = strategyList.find((s: any) => s.id == strategyId);
//               if (selected) {
//                 setGroupName(selected.strategyName);
//                 setGroupDescription(selected.strategyDis);
//               }
//             }}
//           >
          
//             {strategyList.map((s: any) => (
//               <option value={s.id} key={s.id}>
//                 {/* {s.strategyName} — {s.strategyDis.slice(0, 20)}... */}
//                    {s.strategyName}
//               </option>
//             ))}
//           </select>
//         </div>

        

//         {/* Description */}
//         {/* <div>
//           <label className="block text-sm mb-1">Description</label>
//           <textarea
//             value={groupDescription}
//             onChange={(e) => setGroupDescription(e.target.value)}
//             className="w-full border rounded px-3 py-2"
//             rows={3}
//             placeholder="Optional notes..."
//           />
//         </div> */}
//       </div>

//       <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
//         <button
//           onClick={closePackageModal}
//           className="px-4 py-2 rounded border hover:bg-gray-50"
//         >
//           Cancel
//         </button>

//         <button
//           onClick={submitCreateStrtegy}
//           className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
//         >
//           Create & Assign
//         </button>
//       </div>
//     </div>
//   </div>
// )}

//  {/* EDIT MODAL */}
//       {isEditModalOpen && editingUser && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <h2 className="text-lg font-semibold">Update User</h2>
//               <button
//                 onClick={handleCloseEditModal}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="px-4 py-4 space-y-4">
//               {/* Basic */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     First Name
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.firstName}
//                     onChange={(e) =>
//                       updateEditForm("firstName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Last Name
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.lastName}
//                     onChange={(e) =>
//                       updateEditForm("lastName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                  <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Password
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.password}
//                     onChange={(e) =>
//                       updateCreateForm("lastName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Email *
//                   </label>
//                   <input
//                     type="email"
//                     value={editForm.email}
//                     onChange={(e) => updateEditForm("email", e.target.value)}
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Username *
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.username}
//                     onChange={(e) =>
//                       updateEditForm("username", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Phone Number
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.phoneNumber}
//                     onChange={(e) =>
//                       updateEditForm("phoneNumber", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Role
//                   </label>
//                   <select
//                     value={editForm.role}
//                     onChange={(e) =>
//                       updateEditForm("role", e.target.value as Role)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   >
//                     <option value="user">User</option>
//                     <option value="admin">Admin</option>
//                       <option value="clone-user">CLONE-USER</option>
//                   </select>
//                 </div>
//                 <div className="flex items-center gap-2 mt-2 md:mt-6">
//                   <input
//                     id="edit-isChecked"
//                     type="checkbox"
//                     checked={editForm.isChecked}
//                     onChange={(e) =>
//                       updateEditForm("isChecked", e.target.checked)
//                     }
//                   />
//                   <label
//                     htmlFor="edit-isChecked"
//                     className="text-sm font-medium"
//                   >
//                     Is Checked
//                   </label>
//                 </div>
//               </div>

//               <hr className="my-2" />

//               {/* Broker & Strategy */}
//               <h3 className="text-sm font-semibold text-gray-700">
//                 Broker & Strategy
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Broker Name
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.brokerName}
//                     onChange={(e) =>
//                       updateEditForm("brokerName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Broker Image Link
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.brokerImageLink}
//                     onChange={(e) =>
//                       updateEditForm("brokerImageLink", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Strategy Name
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.strategyName}
//                     onChange={(e) =>
//                       updateEditForm("strategyName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Strategy Description
//                   </label>
//                   <textarea
//                     value={editForm.strategyDis}
//                     onChange={(e) =>
//                       updateEditForm("strategyDis", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                     rows={2}
//                   />
//                 </div>
//               </div>

//               <hr className="my-2" />

//               {/* Package */}
//               <h3 className="text-sm font-semibold text-gray-700">
//                 Package Details
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Package Name
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.packageName}
//                     onChange={(e) =>
//                       updateEditForm("packageName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Package Description
//                   </label>
//                   <textarea
//                     value={editForm.packageDis}
//                     onChange={(e) =>
//                       updateEditForm("packageDis", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                     rows={2}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Package Date
//                   </label>
//                   <input
//                     type="date"
//                     value={editForm.packageDate}
//                     onChange={(e) =>
//                       updateEditForm("packageDate", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//               </div>

//               <div className="flex justify-end gap-2 pt-3">
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
//                   Update User
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}




      



//     </div>
//   );
// }




// src/pages/UsersTables.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";

// 👉 include 'clone-user' also
type Role = "admin" | "user" | "clone-user";

export type AngelCredential = {
  clientId: string;
  totpSecret: string;
  password: string;
};

export type User = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  username: string;
  phoneNumber?: string | null;
  role: Role;
  isChecked: boolean;
  brokerName?: string | null;
  brokerImageLink?: string | null;
  angelLoginUser?: boolean | null;
  authToken?: string | null;
  feedToken?: string | null;
  refreshToken?: string | null;
  resetCode?: string | null;
  resetCodeExpire?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  angelCredential?: AngelCredential;
  packageName?: string | null;
  strategyName?: string | null;
  strategyDis?: string | null;
  packageDis?: string | null;
  packageDate?: string | null; // ISO date
  packageFromDate?: string | null; // ISO date
};

// ✏️ Form type for editing
type EditForm = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: Role;
  isChecked: boolean;
  password: string; // empty means don't change
  brokerName: string;
  brokerImageLink: string;
  strategyName: string;
  strategyDis: string;
  packageName: string;
  packageDis: string;
  packageFromDate:string;
  packageDate: string; // yyyy-mm-dd
  updatedAt:any
};

const API_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:5001/api"

export default function UsersTables() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [strategyList, setStrategyList] = useState<any[]>([]); // all strategies from backend
  const [selectedStrategyId, setSelectedStrategyId] = useState("");

  // actions menu state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isPackageAssignModalOpen, setIsPackageAssignModalOpen] = useState(false);

  const [selectedUserForGroup, setSelectedUserForGroup] = useState<User | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [date, setDate] = useState("");
  const [packageFromDate, setPackageFromDate] = useState("");

  // 🔹 Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_URL}/users/get-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      const payload = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setUsers(payload);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close actions menu when clicking outside the table
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!tableRef.current) return;
      if (!tableRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Close group modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isGroupModalOpen && !creating) {
        closeGroupModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isGroupModalOpen, creating]);

  // Filter (client-side)
  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      return (
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase?.().includes(q) ||
        fullName.includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        (u.brokerName ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  // Pagination (client-side)
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const fullName = (u: User) =>
    [u.firstName, u.lastName].filter(Boolean).join(" ") || "-";

  const handleGenerateToken = async (user: User) => {
    try {
      const response = await axios.get(`${API_URL}/admin/getuser/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          UserId: user.id,
        },
      });

      const data = response.data;

      if (data.status === true) {
        const angel_auth_token = data.data.authToken;
        const angel_refresh_token = data.data.refreshToken;
        const angel_feed_token = data.data.feedToken;
        const userID = data.data.id;

        localStorage.setItem("angel_token", angel_auth_token || "");
        localStorage.setItem("angel_feed_token", angel_feed_token || "");
        localStorage.setItem("angel_refresh_token", angel_refresh_token || "");
        localStorage.setItem("userID", String(userID));

        toast.success("Successful: fetched AngelOne tokens!");
      } else {
        toast.error(data?.data?.error || "Failed to fetch tokens");
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  const handleRowLogin = async (user: User) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/admin/login/totp/angelone`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            userId: `${user.id}`,
          },
        }
      );

      if (data.status === true) {
        let angel_auth_token = data.data.jwtToken;
        let angel_refresh_token = data.data.refreshToken;
        let angel_feed_token = data.data.feedToken;

        localStorage.setItem("angel_token", angel_auth_token);
        localStorage.setItem("angel_feed_token", angel_refresh_token);
        localStorage.setItem("angel_refresh_token", angel_feed_token);
        localStorage.setItem("userID", String(user.id));

        toast.success("Login Successful in AngelOne!");
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/strategies`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      });

      if (res.data.status === true) {
        setStrategyList(res.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRowCreateGroup = async (user: User) => {
    setOpenMenuId(null);
    setSelectedUserForGroup(user);
    setGroupName("");
    setGroupDescription("");
    await fetchStrategies();
    setIsPackageAssignModalOpen(true);
  };

  const submitCreateStrtegy = async () => {
    if (!selectedUserForGroup) return;

    const reqData = {
      strategyName: groupName,
      strategyDis: groupDescription,
      id: selectedUserForGroup.id,
    };

    try {
      const createRes = await axios.put(
        `${API_URL}/users/package/update`,
        reqData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (createRes.data.status === true) {
        toast.success(createRes.data.message);
        fetchUsers();
        setIsPackageAssignModalOpen(false);
      } else {
        toast.error(createRes?.data?.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign strategy");
    }
  };

  const handleAssignPackage = (user: User) => {
    setOpenMenuId(null);
    setSelectedUserForGroup(user);
    setGroupName("");
    setGroupDescription("");
    setDate("");
    setPackageFromDate("");
    setIsGroupModalOpen(true);
  };

  // 🔹 OPEN EDIT MODAL
  const handleRowUpdateProfile = (user: User) => {
    setOpenMenuId(null);
    setEditingUser(user);

    const isoDate = user.packageDate ? user.packageDate.slice(0, 10) : "";
     const isoDateFrom = user.packageFromDate ? user.packageFromDate.slice(0, 10) : "";

    const form: EditForm = {
      id: user.id,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber ?? "",
      role: user.role,
      isChecked: user.isChecked,
      password: "",
      brokerName: user.brokerName ?? "",
      brokerImageLink: user.brokerImageLink ?? "",
      strategyName: user.strategyName ?? "",
      strategyDis: user.strategyDis ?? "",
      packageName: user.packageName ?? "",
      packageDis: user.packageDis ?? "",
      packageDate: isoDate,
      packageFromDate:isoDateFrom
    };

    setEditForm(form);
    setIsEditModalOpen(true);
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const closeGroupModal = () => {
    setIsGroupModalOpen(false);
    setSelectedUserForGroup(null);
  };

  const closePackageModal = () => {
    setIsPackageAssignModalOpen(false);
  };

  const submitCreateGroup = async () => {
    if (!groupName.trim() || !selectedUserForGroup) {
      toast.error("Package name is required.");
      return;
    }

    const reqObj = {
      id: selectedUserForGroup.id,
      packageName: groupName,
      packageDis: groupDescription,
      packageDate: date,
      packageFromDate: packageFromDate,
    };

    try {
      setCreating(true);

      const createRes = await axios.put(
        `${API_URL}/users/package/update`,
        reqObj,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (createRes.data.status) {
        toast.success(createRes.data.message || "Package assigned");
        fetchUsers();
      } else {
        toast.error(createRes.data.message || "Failed to assign package");
      }

      closeGroupModal();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign package"
      );
    } finally {
      setCreating(false);
    }
  };

  // 🔹 Edit form helpers
  const updateEditForm = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditForm(null);
  };

  // 🔹 CALL BACKEND UPDATE API
  const handleUpdate = async () => {

    if (!editForm || !editingUser) return;

    try {
      const payload: any = {
        firstName: editForm.firstName || null,
        lastName: editForm.lastName || null,
        email: editForm.email,
        username: editForm.username,
        phoneNumber: editForm.phoneNumber || null,
        role: editForm.role,
        isChecked: editForm.isChecked,
        brokerName: editForm.brokerName || null,
        brokerImageLink: editForm.brokerImageLink || null,
        strategyName: editForm.strategyName || null,
        strategyDis: editForm.strategyDis || null,
        packageName: editForm.packageName || null,
        packageDis: editForm.packageDis || null,
        packageDate: editForm.packageDate || null,
      };

      // only send password if filled
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      // 🔥 adjust endpoint as per your backend
      const res = await axios.put(
        `${API_URL}/admin/clone-users/${editingUser.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (res.data.status) {
        toast.success(res.data.message || "User updated successfully");
        handleCloseEditModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to update user");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to update user"
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-start gap-3">
        <h2 className="text-xl font-semibold">Users</h2>

        <div className="flex gap-3 md:ml-4">
          <input
            className="border rounded px-3 py-2 w-90"
            placeholder="Search name, email, username, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <button
            onClick={fetchUsers}
            className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {!!error && <p className="text-red-600">{error}</p>}
      {!loading && !error && users.length === 0 && <p>No users found.</p>}

      {!loading && !error && users.length > 0 && (
        <div ref={tableRef} className="w-full overflow-auto rounded border">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2 border-b">#</th>
                <th className="px-3 py-2 border-b">UniqueId</th>
                <th className="px-3 py-2 border-b">Name</th>
                <th className="px-3 py-2 border-b">Email</th>
                <th className="px-3 py-2 border-b">Username</th>
                <th className="px-3 py-2 border-b">Password</th>
                 <th className="px-3 py-2 border-b">brokerName</th>
                
                <th className="px-3 py-2 border-b">Phone</th>
                <th className="px-3 py-2 border-b"> Strategy</th>
                <th className="px-3 py-2 border-b"> Package</th>
                <th className="px-3 py-2 border-b">Package From </th>
                <th className="px-3 py-2 border-b">Package To </th>
                  <th className="px-3 py-2 border-b">UpdatedAt</th>
                <th className="px-3 py-2 border-b">CreatedAt</th>
                <th className="px-3 py-2 border-b"> Login</th>
                <th className="px-3 py-2 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u:any, idx) => (
                <tr key={u.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 border-b">{start + idx + 1}</td>
                  <td className="px-3 py-2 border-b">{u.id}</td>
                  <td className="px-3 py-2 border-b">{fullName(u)}</td>
                  <td className="px-3 py-2 border-b">{u.email}</td>
                  <td className="px-3 py-2 border-b">{u.username}</td>
                    <td className="px-3 py-2 border-b">{u.password}</td>
                      <td className="px-3 py-2 border-b">{u.brokerName}</td>
                  <td className="px-3 py-2 border-b">{u.phoneNumber ?? "-"}</td>
                  <td className="px-3 py-2 border-b">{u.strategyName ?? "-"}</td>
                  <td className="px-3 py-2 border-b">{u.packageName ?? "-"}</td>
                   <td className="px-3 py-2 border-b">
                    {u.packageFromDate ? u.packageFromDate.slice(0, 10) : "-"}
                  </td>
                  <td className="px-3 py-2 border-b">
                    {u.packageDate ? u.packageDate.slice(0, 10) : "-"}
                  </td>
                    <td className="px-3 py-2 border-b">
                    {u.updatedAt ? new Date(u.updatedAt).toLocaleString("en-IN") : "-"}
                  </td>
                  <td className="px-3 py-2 border-b">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString("en-IN") : "-"}
                  </td>
                  <td
                    className={`px-3 py-2 border-b font-medium text-center ${
                      u.angelLoginUser
                        ? "text-green-700 bg-green-50"
                        : "text-red-700 bg-red-50"
                    }`}
                  >
                    {u.angelLoginUser ? "Yes" : "No"}
                  </td>

                  <td className="px-3 py-2 border-b text-center relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(u.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded inline-flex"
                      aria-label="Actions"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
                    </button>

                    {openMenuId === u.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-2 top-8 z-20 bg-white shadow-lg border rounded-md w-44 text-sm overflow-hidden"
                      >
                        <button
                          onClick={() => handleGenerateToken(u)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Get Token
                        </button>
                        <button
                          onClick={() => handleRowLogin(u)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Login User
                        </button>
                        <button
                          onClick={() => handleRowCreateGroup(u)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Assign Group
                        </button>
                        <button
                          onClick={() => handleRowUpdateProfile(u)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Update Profile
                        </button>
                        <button
                          onClick={() =>
                            (window.location.href =
                              `${import.meta.env.VITE_API_URL_FORNTEND}/new/deshboard`)
                          }
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          View Client Dashboard
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          onClick={() => handleAssignPackage(u)}
                        >
                          Assign Package
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600">
            Showing {start + 1}-{Math.min(start + pageSize, total)} of {total}
          </span>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded border ${
                currentPage <= 1
                  ? "text-gray-400 border-gray-200"
                  : "hover:bg-gray-100"
              }`}
            >
              Prev
            </button>
          </div>

          <span className="px-2 py-1 text-sm">
            Page {currentPage} / {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1 rounded border ${
                currentPage >= totalPages
                  ? "text-gray-400 border-gray-200"
                  : "hover:bg-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ==== Package Modal ==== */}
      {isGroupModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeGroupModal}
          />
          <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-xl border">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Package Name</h3>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm mb-1">Package Name *</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Package Name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm mb-1">
                  Select Package To Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">
                  Select Package From Date
                </label>
                <input
                  type="date"
                  value={packageFromDate}
                  onChange={(e) => setPackageFromDate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={closeGroupModal}
                disabled={creating}
                className="px-4 py-2 rounded border hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={submitCreateGroup}
                disabled={creating}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create & Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==== Strategy Assign Modal ==== */}
      {isPackageAssignModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closePackageModal}
          />

          <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-xl border">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Assign Strategy</h3>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm mb-1">Select Strategy *</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={selectedStrategyId}
                  onChange={(e) => {
                    const strategyId = e.target.value;
                    setSelectedStrategyId(strategyId);

                    const selected = strategyList.find(
                      (s: any) => s.id == strategyId
                    );
                    if (selected) {
                      setGroupName(selected.strategyName);
                      setGroupDescription(selected.strategyDis);
                    }
                  }}
                >
                  <option value="">Select Strategy</option>
                  {strategyList.map((s: any) => (
                    <option value={s.id} key={s.id}>
                      {s.strategyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={closePackageModal}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={submitCreateStrtegy}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Create & Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==== EDIT MODAL ==== */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Update User</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) =>
                      updateEditForm("firstName", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => updateEditForm("lastName", e.target.value)}
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password (leave blank to keep same)
                  </label>
                  <input
                    type="text"
                    value={editForm.password}
                    onChange={(e) =>
                      updateEditForm("password", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => updateEditForm("email", e.target.value)}
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      updateEditForm("username", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      updateEditForm("phoneNumber", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      updateEditForm("role", e.target.value as Role)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="clone-user">CLONE-USER</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-6">
                  <input
                    id="edit-isChecked"
                    type="checkbox"
                    checked={editForm.isChecked}
                    onChange={(e) =>
                      updateEditForm("isChecked", e.target.checked)
                    }
                  />
                  <label
                    htmlFor="edit-isChecked"
                    className="text-sm font-medium"
                  >
                    Is Checked
                  </label>
                </div>
              </div>

              <hr className="my-2" />

              {/* Broker & Strategy */}
              <h3 className="text-sm font-semibold text-gray-700">
                Broker & Strategy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Broker Name
                  </label>
                  <input
                    type="text"
                    value={editForm.brokerName}
                    onChange={(e) =>
                      updateEditForm("brokerName", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Broker Image Link
                  </label>
                  <input
                    type="text"
                    value={editForm.brokerImageLink}
                    onChange={(e) =>
                      updateEditForm("brokerImageLink", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Strategy Name
                  </label>
                  <input
                    type="text"
                    value={editForm.strategyName}
                    onChange={(e) =>
                      updateEditForm("strategyName", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Strategy Description
                  </label>
                  <textarea
                    value={editForm.strategyDis}
                    onChange={(e) =>
                      updateEditForm("strategyDis", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                    rows={2}
                  />
                </div>
              </div>

              <hr className="my-2" />

              {/* Package */}
              <h3 className="text-sm font-semibold text-gray-700">
                Package Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Package Name
                  </label>
                  <input
                    type="text"
                    value={editForm.packageName}
                    onChange={(e) =>
                      updateEditForm("packageName", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Package Description
                  </label>
                  <textarea
                    value={editForm.packageDis}
                    onChange={(e) =>
                      updateEditForm("packageDis", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Package Date
                  </label>
                  <input
                    type="date"
                    value={editForm.packageDate}
                    onChange={(e) =>
                      updateEditForm("packageDate", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 rounded border text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
