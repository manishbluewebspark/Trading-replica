



// // src/pages/UsersTables.tsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";

// // 👉 include 'clone-user' also
// type Role = "admin" | "user" | "clone-user";

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
//   angelCredential?: AngelCredential;
//   packageName?: string | null;
//   strategyName?: string | null;
//   strategyDis?: string | null;
//   packageDis?: string | null;
//   packageDate?: string | null; // ISO date
//   packageFromDate?: string | null; // ISO date

// };

// // ✏️ Form type for editing
// type EditForm = {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   username: string;
//   phoneNumber: string;
//   role: Role;
//   isChecked: boolean;
//   password: string; // empty means don't change
//   brokerName: string;
//   brokerImageLink: string;
//   strategyName: string;
//   strategyDis: string;
//   packageName: string;
//   packageDis: string;
//   packageFromDate:string;
//   packageDate: string; // yyyy-mm-dd
//   updatedAt:string;
// };

// const API_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:5001/api"

// export default function UsersTables() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string>("");
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   const [strategyList, setStrategyList] = useState<any[]>([]); // all strategies from backend
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   // actions menu state
//   const [openMenuId, setOpenMenuId] = useState<number | null>(null);
//   const tableRef = useRef<HTMLDivElement | null>(null);

//   // Modals
//   const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
//   const [isPackageAssignModalOpen, setIsPackageAssignModalOpen] = useState(false);

//   const [selectedUserForGroup, setSelectedUserForGroup] = useState<User | null>(null);
//   const [groupName, setGroupName] = useState("");
//   const [groupDescription, setGroupDescription] = useState("");
//   const [creating, setCreating] = useState(false);
//   const [date, setDate] = useState("");
//   const [packageFromDate, setPackageFromDate] = useState("");

//   // 🔹 Edit modal state
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState<User | null>(null);
//   const [editForm, setEditForm] = useState<EditForm | null>(null);

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

//   // Close group modal on Escape
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

//   const handleRowLogin = async (user: User) => {
//     try {
//       const { data } = await axios.get(
//         `${API_URL}/admin/login/totp/angelone`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             userId: `${user.id}`,
//           },
//         }
//       );

//       if (data.status === true) {
//         let angel_auth_token = data.data.jwtToken;
//         let angel_refresh_token = data.data.refreshToken;
//         let angel_feed_token = data.data.feedToken;

//         localStorage.setItem("angel_token", angel_auth_token);
//         localStorage.setItem("angel_feed_token", angel_refresh_token);
//         localStorage.setItem("angel_refresh_token", angel_feed_token);
//         localStorage.setItem("userID", String(user.id));

//         toast.success("Login Successful in AngelOne!");
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${API_URL}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   };

//   const handleRowCreateGroup = async (user: User) => {
//     setOpenMenuId(null);
//     setSelectedUserForGroup(user);
//     setGroupName("");
//     setGroupDescription("");
//     await fetchStrategies();
//     setIsPackageAssignModalOpen(true);
//   };

//   const submitCreateStrtegy = async () => {
//     if (!selectedUserForGroup) return;

//     const reqData = {
//       strategyName: groupName,
//       strategyDis: groupDescription,
//       id: selectedUserForGroup.id,
//     };

//     try {
//       const createRes = await axios.put(
//         `${API_URL}/users/package/update`,
//         reqData,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (createRes.data.status === true) {
//         toast.success(createRes.data.message);
//         fetchUsers();
//         setIsPackageAssignModalOpen(false);
//       } else {
//         toast.error(createRes?.data?.message);
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Failed to assign strategy");
//     }
//   };

//   const handleAssignPackage = (user: User) => {
//     setOpenMenuId(null);
//     setSelectedUserForGroup(user);
//     setGroupName("");
//     setGroupDescription("");
//     setDate("");
//     setPackageFromDate("");
//     setIsGroupModalOpen(true);
//   };

//   // 🔹 OPEN EDIT MODAL
//   const handleRowUpdateProfile = (user: User) => {
//     setOpenMenuId(null);
//     setEditingUser(user);

//     const isoDate = user.packageDate ? user.packageDate.slice(0, 10) : "";
//      const isoDateFrom = user.packageFromDate ? user.packageFromDate.slice(0, 10) : "";

//     const form: any = {
//       id: user.id,
//       firstName: user.firstName ?? "",
//       lastName: user.lastName ?? "",
//       email: user.email,
//       username: user.username,
//       phoneNumber: user.phoneNumber ?? "",
//       role: user.role,
//       isChecked: user.isChecked,
//       password: "",
//       brokerName: user.brokerName ?? "",
//       brokerImageLink: user.brokerImageLink ?? "",
//       strategyName: user.strategyName ?? "",
//       strategyDis: user.strategyDis ?? "",
//       packageName: user.packageName ?? "",
//       packageDis: user.packageDis ?? "",
//       packageDate: isoDate,
//       packageFromDate:isoDateFrom
//     };

//     setEditForm(form);
//     setIsEditModalOpen(true);
//   };

//   const toggleMenu = (id: number) => {
//     setOpenMenuId((prev) => (prev === id ? null : id));
//   };

//   const closeGroupModal = () => {
//     setIsGroupModalOpen(false);
//     setSelectedUserForGroup(null);
//   };

//   const closePackageModal = () => {
//     setIsPackageAssignModalOpen(false);
//   };

//   const submitCreateGroup = async () => {
//     if (!groupName.trim() || !selectedUserForGroup) {
//       toast.error("Package name is required.");
//       return;
//     }

//     const reqObj = {
//       id: selectedUserForGroup.id,
//       packageName: groupName,
//       packageDis: groupDescription,
//       packageDate: date,
//       packageFromDate: packageFromDate,
//     };

//     try {
//       setCreating(true);

//       const createRes = await axios.put(
//         `${API_URL}/users/package/update`,
//         reqObj,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (createRes.data.status) {
//         toast.success(createRes.data.message || "Package assigned");
//         fetchUsers();
//       } else {
//         toast.error(createRes.data.message || "Failed to assign package");
//       }

//       closeGroupModal();
//     } catch (err: any) {
//       toast.error(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Failed to assign package"
//       );
//     } finally {
//       setCreating(false);
//     }
//   };

//   // 🔹 Edit form helpers
//   const updateEditForm = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
//     setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
//   };

//   const handleCloseEditModal = () => {
//     setIsEditModalOpen(false);
//     setEditingUser(null);
//     setEditForm(null);
//   };

//   // 🔹 CALL BACKEND UPDATE API
//   const handleUpdate = async () => {

//     if (!editForm || !editingUser) return;

//     try {
//       const payload: any = {
//         firstName: editForm.firstName || null,
//         lastName: editForm.lastName || null,
//         email: editForm.email,
//         username: editForm.username,
//         phoneNumber: editForm.phoneNumber || null,
//         role: editForm.role,
//         isChecked: editForm.isChecked,
//         brokerName: editForm.brokerName || null,
//         brokerImageLink: editForm.brokerImageLink || null,
//         strategyName: editForm.strategyName || null,
//         strategyDis: editForm.strategyDis || null,
//         packageName: editForm.packageName || null,
//         packageDis: editForm.packageDis || null,
//         packageDate: editForm.packageDate || null,
//       };

//       // only send password if filled
//       if (editForm.password.trim()) {
//         payload.password = editForm.password.trim();
//       }

//       // 🔥 adjust endpoint as per your backend
//       const res = await axios.put(
//         `${API_URL}/admin/clone-users/${editingUser.id}`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res.data.status) {
//         toast.success(res.data.message || "User updated successfully");
//         handleCloseEditModal();
//         fetchUsers();
//       } else {
//         toast.error(res.data.message || "Failed to update user");
//       }
//     } catch (err: any) {
//       toast.error(
//         err?.response?.data?.message || err?.message || "Failed to update user"
//       );
//     }
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-start gap-3">
//         <h2 className="text-xl font-semibold">Users</h2>

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

//       {loading && <p>Loading…</p>}
//       {!!error && <p className="text-red-600">{error}</p>}
//       {!loading && !error && users.length === 0 && <p>No users found.</p>}

//       {!loading && !error && users.length > 0 && (
//         <div ref={tableRef} className="w-full overflow-auto rounded border">
//           <table className="min-w-[1100px] w-full text-sm">
//             <thead className="bg-gray-50">
//               <tr className="text-left">
               
//                 {/* <th className="px-3 py-2 border-b">#</th> */}
//                 <th className="px-3 py-2 border-b">UniqueId</th>
//                 <th className="px-3 py-2 border-b">Name</th>
//                 <th className="px-3 py-2 border-b">Email</th>
//                 <th className="px-3 py-2 border-b">Username</th>
//                 <th className="px-3 py-2 border-b">Password</th>
//                 <th className="px-3 py-2 border-b">brokerName</th>
//                 <th className="px-3 py-2 border-b"> Broker Login</th>
//                 <th className="px-3 py-2 border-b">Phone</th>
//                 <th className="px-3 py-2 border-b"> Strategy</th>
//                 <th className="px-3 py-2 border-b"> Package</th>
//                 <th className="px-3 py-2 border-b">Package From </th>
//                 <th className="px-3 py-2 border-b">Package To </th>
//                   <th className="px-3 py-2 border-b">UpdatedAt</th>
//                 <th className="px-3 py-2 border-b">CreatedAt</th>
//                   <th className="px-3 py-2 border-b text-center">Actions</th>
                
               
//               </tr>
//             </thead>
//             <tbody>
//               {pageRows.map((u:any, idx) => (
//                 <tr key={u.id} className="odd:bg-white even:bg-gray-50">
                 
//                   {/* <td className="px-3 py-2 border-b">{start + idx + 1}</td> */}
//                   <td className="px-3 py-2 border-b">{u.id}</td>
//                   <td className="px-3 py-2 border-b">{fullName(u)}</td>
//                   <td className="px-3 py-2 border-b">{u.email}</td>
//                   <td className="px-3 py-2 border-b">{u.username}</td>
//                     <td className="px-3 py-2 border-b">{u.password}</td>
//                       <td className="px-3 py-2 border-b">{u.brokerName}</td>
//                          <td
//                     className={`px-3 py-2 border-b font-medium text-center ${
//                       u.angelLoginUser
//                         ? "text-green-700 bg-green-50"
//                         : "text-red-700 bg-red-50"
//                     }`}
//                   >
//                     {u.angelLoginUser ? "Yes" : "No"}
//                   </td>
//                   <td className="px-3 py-2 border-b">{u.phoneNumber ?? "-"}</td>
//                   <td className="px-3 py-2 border-b">{u.strategyName ?? "-"}</td>
//                   <td className="px-3 py-2 border-b">{u.packageName ?? "-"}</td>
//                    <td className="px-3 py-2 border-b">
//                     {u.packageFromDate ? u.packageFromDate.slice(0, 10) : "-"}
//                   </td>
//                   <td className="px-3 py-2 border-b">
//                     {u.packageDate ? u.packageDate.slice(0, 10) : "-"}
//                   </td>
//                     <td className="px-3 py-2 border-b">
//                     {u.updatedAt ? new Date(u.updatedAt).toLocaleString("en-IN") : "-"}
//                   </td>
//                   <td className="px-3 py-2 border-b">
//                     {u.createdAt ? new Date(u.createdAt).toLocaleString("en-IN") : "-"}
//                   </td>
//                  <td className="px-3 py-2 border-b text-center relative">
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
//                         <button
//                           onClick={() =>
//                             (window.location.href =
//                               `${import.meta.env.VITE_API_URL_FORNTEND}/new/deshboard`)
//                           }
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           View Client Dashboard
//                         </button>
//                         <button
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                           onClick={() => handleAssignPackage(u)}
//                         >
//                           Assign Package
//                         </button>
//                       </div>
//                     )}
//                   </td>

                 
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

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

//       {/* ==== Package Modal ==== */}
//       {isGroupModalOpen && (
//         <div
//           className="fixed inset-0 z-40 flex items-center justify-center"
//           aria-modal="true"
//           role="dialog"
//         >
//           <div
//             className="absolute inset-0 bg-black/40"
//             onClick={closeGroupModal}
//           />
//           <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-xl border">
//             <div className="px-5 py-4 border-b">
//               <h3 className="text-lg font-semibold">Package Name</h3>
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

//               <div>
//                 <label className="block text-sm mb-1">
//                   Select Package To Date
//                 </label>
//                 <input
//                   type="date"
//                   value={date}
//                   onChange={(e) => setDate(e.target.value)}
//                   className="w-full border rounded px-3 py-2"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm mb-1">
//                   Select Package From Date
//                 </label>
//                 <input
//                   type="date"
//                   value={packageFromDate}
//                   onChange={(e) => setPackageFromDate(e.target.value)}
//                   className="w-full border rounded px-3 py-2"
//                 />
//               </div>
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

//       {/* ==== Strategy Assign Modal ==== */}
//       {isPackageAssignModalOpen && (
//         <div className="fixed inset-0 z-40 flex items-center justify-center">
//           <div
//             className="absolute inset-0 bg-black/40"
//             onClick={closePackageModal}
//           />

//           <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-xl border">
//             <div className="px-5 py-4 border-b">
//               <h3 className="text-lg font-semibold">Assign Strategy</h3>
//             </div>

//             <div className="px-5 py-4 space-y-3">
//               <div>
//                 <label className="block text-sm mb-1">Select Strategy *</label>
//                 <select
//                   className="w-full border rounded px-3 py-2"
//                   value={selectedStrategyId}
//                   onChange={(e) => {
//                     const strategyId = e.target.value;
//                     setSelectedStrategyId(strategyId);

//                     const selected = strategyList.find(
//                       (s: any) => s.id == strategyId
//                     );
//                     if (selected) {
//                       setGroupName(selected.strategyName);
//                       setGroupDescription(selected.strategyDis);
//                     }
//                   }}
//                 >
//                   <option value="">Select Strategy</option>
//                   {strategyList.map((s: any) => (
//                     <option value={s.id} key={s.id}>
//                       {s.strategyName}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
//               <button
//                 onClick={closePackageModal}
//                 className="px-4 py-2 rounded border hover:bg-gray-50"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={submitCreateStrtegy}
//                 className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
//               >
//                 Create & Assign
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ==== EDIT MODAL ==== */}
//       {isEditModalOpen && editForm && (
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
//                     onChange={(e) => updateEditForm("lastName", e.target.value)}
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Password (leave blank to keep same)
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.password}
//                     onChange={(e) =>
//                       updateEditForm("password", e.target.value)
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
//                     <option value="clone-user">CLONE-USER</option>
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



import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  FiSearch,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiTrendingUp,
  FiUsers,
  FiKey,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiPackage,
  FiHome,
  FiDatabase,
} from "react-icons/fi";
import { HiDotsHorizontal } from "react-icons/hi";

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
  createdAt: string;
  updatedAt: string;
  angelCredential?: AngelCredential;
  packageName?: string | null;
  strategyName?: string | null;
  strategyDis?: string | null;
  packageDis?: string | null;
  packageDate?: string | null;
  packageFromDate?: string | null;
};

type EditForm = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: Role;
  isChecked: boolean;
  password: string;
  brokerName: string;
  brokerImageLink: string;
  strategyName: string;
  strategyDis: string;
  packageName: string;
  packageDis: string;
  packageFromDate: string;
  packageDate: string;
  updatedAt: any;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function UsersTables() {
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");

  const [strategyList, setStrategyList] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menuDirection, setMenuDirection] = useState<"bottom" | "top">("bottom");

  console.log(menuDirection);
  
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isPackageAssignModalOpen, setIsPackageAssignModalOpen] = useState(false);

  const [selectedUserForGroup, setSelectedUserForGroup] = useState<User | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [date, setDate] = useState("");
  const [packageFromDate, setPackageFromDate] = useState("");

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

  // Close menu on scroll
  useEffect(() => {
    const onScroll = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [openMenuId]);

  // Close on click outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!openMenuId) return;
      if (!buttonRef.current || !buttonRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openMenuId]);

  // Close modals on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isGroupModalOpen && !creating) {
          closeGroupModal();
        } else if (isPackageAssignModalOpen) {
          closePackageModal();
        } else if (isEditModalOpen) {
          handleCloseEditModal();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isGroupModalOpen, isPackageAssignModalOpen, isEditModalOpen, creating]);

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
      packageFromDate: isoDateFrom,
      updatedAt: user.updatedAt
    };

    setEditForm(form);
    setIsEditModalOpen(true);
  };

  const toggleMenu = (id: number, buttonElement: HTMLButtonElement) => {
    buttonRef.current = buttonElement;
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

  const updateEditForm = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditForm(null);
  };

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

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

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

  // Calculate position and direction (top/bottom)
  useEffect(() => {
    if (!buttonRef.current || !openMenuId) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuHeight = 230;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    const direction = spaceBelow >= menuHeight || spaceBelow >= spaceAbove ? "bottom" : "top";
    setMenuDirection(direction);

    const x = buttonRect.right - 176;
    const y = direction === "bottom" ? buttonRect.bottom + 4 : buttonRect.top - menuHeight - 4;

    setMenuPosition({ x, y });
  }, [openMenuId]);

  const ActionsMenu = ({ user }: { user: User }) => (
    <div
      className="fixed z-[9999] bg-white shadow-2xl border border-gray-200 rounded-xl w-48 text-sm overflow-hidden backdrop-blur-sm "
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      <button
        onClick={() => {
          handleGenerateToken(user);
          setOpenMenuId(null);
        }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600"
      >
        <FiKey className="h-4 w-4" />
        <span>Get Token</span>
      </button>
      <button
        onClick={() => {
          handleRowLogin(user);
          setOpenMenuId(null);
        }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-green-50 transition-colors text-gray-700 hover:text-green-600"
      >
        <FiUser className="h-4 w-4" />
        <span>Login User</span>
      </button>
      <button
        onClick={() => {
          handleRowCreateGroup(user);
          setOpenMenuId(null);
        }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600"
      >
        <FiTrendingUp className="h-4 w-4" />
        <span>Assign Strategy</span>
      </button>
      <button
        onClick={() => {
          handleRowUpdateProfile(user);
          setOpenMenuId(null);
        }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors text-gray-700 hover:text-amber-600"
      >
        <FiEdit className="h-4 w-4" />
        <span>Update Profile</span>
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button
        onClick={() => {
          handleAssignPackage(user);
          setOpenMenuId(null);
        }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors text-gray-700 hover:text-indigo-600"
      >
        <FiPackage className="h-4 w-4" />
        <span>Assign Package</span>
      </button>
      <button
        onClick={() => {
          window.location.href = `${import.meta.env.VITE_API_URL_FORNTEND}/new/deshboard`;
          setOpenMenuId(null);
        }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
      >
        <FiHome className="h-4 w-4" />
        <span>View Dashboard</span>
      </button>
    </div>
  );



  const columnDefs: ColDef<any>[] = useMemo(() => [
    {
      field: undefined, // No field for row index
      headerName: '#',
      width: 70,
      cellClass: 'font-medium',
      cellRenderer: (params: any) => {
        const rowIndex = params.node.rowIndex;
        return (
          <div className="flex items-center justify-center h-full">
            <span className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {rowIndex + 1}
            </span>
          </div>
        );
      }
    },
    {
      field: 'id',
      headerName: 'ID',
      width: 90,
      cellClass: 'font-mono text-xs',
      cellRenderer: (params: any) => (
        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
          #{params.value}
        </span>
      )
    },
    {
      field: 'firstName',
      headerName: 'User',
      width: 180,
      cellClass: 'font-medium',
      cellRenderer: (params: any) => {
        const user = params.data as User;
        return (
          <div className="flex items-center gap-3">

            <div className="font-medium text-gray-900">
              {fullName(user)}
            </div>
          </div>
        );
      }
    },

    // 👉 NEW EMAIL COLUMN
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
      cellRenderer: (params: any) => {
        return (
          <div className="text-sm text-gray-700 flex items-center gap-2">
            {params.data.email}
          </div>
        );
      }
    },

    {
      field: 'username',
      headerName: 'Username',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm">
          {params.value}
        </span>
      )
    },
     {
      field: 'password',
      headerName: 'Password',
      width: 170,
      cellRenderer: (params: any) => (
        <span className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm">
          {params.value}
        </span>
      )
    },
    {
      field: 'brokerName',
      headerName: 'Broker',
      width: 140,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <span>{params.value || '-'}</span>
        </div>
      )
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 140,
      cellRenderer: (params: any) => params.value ? (
        <div className="flex items-center gap-2 text-gray-700">
          <span>{params.value}</span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      field: 'strategyName',
      headerName: 'Strategy',
      width: 160,
      cellRenderer: (params: any) => params.value ? (
        <span className="bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium">
          {params.value}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      field: 'packageName',
      headerName: 'Package',
      width: 160,
      cellRenderer: (params: any) => params.value ? (
        <span className="bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium">
          {params.value}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      field: undefined,
      headerName: 'Package Period',
      width: 200,
      cellRenderer: (params: any) => {
        const from = params.data.packageFromDate ? params.data.packageFromDate.slice(0, 10) : null;
        const to = params.data.packageDate ? params.data.packageDate.slice(0, 10) : null;

        if (!from && !to) return <span className="text-gray-400">-</span>;

        return (
          <div className="flex items-center gap-2 text-xs">
            <FiCalendar className="h-3 w-3 text-gray-400" />
            <div>
              {from && <div className="text-green-600">{from}</div>}
              {to && <div className="text-gray-500">to {to}</div>}
            </div>
          </div>
        );
      }
    },
    {
      field: 'updatedAt',
      headerName: 'Last Updated',
      width: 160,
      cellRenderer: (params: any) => params.value ? (
        <div className="text-xs text-gray-600">
          {new Date(params.value).toLocaleDateString("en-IN")}
          <div className="text-gray-400">
            {new Date(params.value).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ) : '-'
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      cellRenderer: (params: any) => {
        const role = params.value as Role;
        const colors: Record<Role, string> = {
          admin: 'bg-red-100 text-red-800',
          user: 'bg-green-100 text-green-800',
          'clone-user': 'bg-blue-100 text-blue-800'
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[role]}`}>
            {role.toUpperCase()}
          </span>
        );
      }
    },
    {
      field: undefined,
      headerName: 'Login',
      width: 100,
      cellRenderer: (params: any) => {
        const isLoggedIn = params.data.angelLoginUser;
        return (
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <span className="text-gray-800  bg-green-100 px-3 py-1 rounded-full text-xs font-medium uppercase">Yes</span>
              </>
            ) : (
              <>
                <span className="text-gray-800  bg-red-100 px-3 py-1 rounded-full text-xs font-medium uppercase">No</span>
              </>
            )}
          </div>
        );
      }
    },
    {
      field: undefined,
      headerName: 'Actions',
      width: 80,
      cellRenderer: (params: any) => {
        const user = params.data as User;
        return (
          <button
            ref={buttonRef as any}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              toggleMenu(user.id, e.currentTarget as HTMLButtonElement);
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none "
            aria-label="Actions"
          >
            <HiDotsHorizontal className="h-5 w-5 text-gray-500" />
          </button>
        );
      }
    }
  ], []);

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
  const onGridReady = useCallback((params: any) => {
    gridRef.current = params;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <FiUsers className="h-8 w-8 text-white" />
                </div>
                <span>User Management</span>
              </h1>
              <p className="text-gray-600 mt-2">Manage all users, their packages, and strategies</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white! px-5 py-2.5 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FiRefreshCw className="h-5 w-5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <FiUser className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Logins</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {users.filter(u => u.angelLoginUser).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <FiCheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Packages</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {users.filter(u => u.packageName).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <FiPackage className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Strategies</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {users.filter(u => u.strategyName).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50">
                  <FiTrendingUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Search users by name, email, phone, or username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Showing {filtered.length} of {users.length} users
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-96 bg-white/50 backdrop-blur-sm rounded-2xl">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        )}

        {/* Error State */}
        {!!error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-5 py-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <FiXCircle className="h-6 w-6" />
              <div>
                <p className="font-medium">Error Loading Users</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiUser className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first user</p>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FiRefreshCw className="h-5 w-5" />
              Refresh to Load Users
            </button>
          </div>
        )}

        {/* AG Grid */}
        {!loading && !error && users.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="ag-theme-alpine custom-ag-grid" style={{ height: '600px', width: '100%' }}>
              <AgGridReact<User>
                ref={gridRef}
                rowData={filtered}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                animateRows={true}
                rowSelection="single"
                suppressRowClickSelection={true}
                pagination={true}
                paginationPageSize={100}
                domLayout="normal"
                suppressPaginationPanel={false}
                suppressScrollOnNewData={true}

                rowHeight={50}
                headerHeight={50}

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
          </div>
        )}

        {/* Portal: dropdown always visible, opens above if near bottom */}
        {openMenuId && filtered.find((u: any) => u.id === openMenuId) && (
          createPortal(
            <ActionsMenu user={filtered.find((u: any) => u.id === openMenuId)! as User} />,
            document.body
          )
        )}

        {/* Package Modal */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeGroupModal}
            />
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FiPackage className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Assign Package</h3>
                    <p className="text-indigo-100 text-sm">Assign a package to {selectedUserForGroup?.firstName}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter package name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Description
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter package description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={packageFromDate}
                        onChange={(e) => setPackageFromDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={closeGroupModal}
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCreateGroup}
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <FiRefreshCw className="h-4 w-4 animate-spin" />
                      Assigning...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FiPackage className="h-4 w-4" />
                      Assign Package
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Assign Modal */}
        {isPackageAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closePackageModal}
            />
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FiTrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Assign Strategy</h3>
                    <p className="text-purple-100 text-sm">Choose a strategy for {selectedUserForGroup?.firstName}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Strategy <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
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
                    <option value="" className="text-gray-400">Choose a strategy</option>
                    {strategyList.map((s: any) => (
                      <option value={s.id} key={s.id} className="text-gray-900">
                        {s.strategyName}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStrategyId && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                    <h4 className="font-medium text-purple-900 mb-1">Selected Strategy</h4>
                    <p className="text-sm text-purple-700">{groupDescription}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={closePackageModal}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCreateStrtegy}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <span className="flex items-center gap-2">
                    <FiTrendingUp className="h-4 w-4" />
                    Assign Strategy
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseEditModal}
            />
            <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FiEdit className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Update User Profile</h3>
                      <p className="text-amber-100 text-sm">Editing {editingUser?.firstName}'s information</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseEditModal}
                    className="text-white hover:text-amber-100 transition-colors p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiUser className="h-5 w-5 text-blue-500" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => updateEditForm("firstName", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => updateEditForm("lastName", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => updateEditForm("email", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username *
                        </label>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => updateEditForm("username", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={editForm.phoneNumber}
                          onChange={(e) => updateEditForm("phoneNumber", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password (optional)
                        </label>
                        <div className="relative">
                          <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={editForm.password}
                            onChange={(e) => updateEditForm("password", e.target.value)}
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Leave blank to keep current"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <select
                          value={editForm.role}
                          onChange={(e) => updateEditForm("role", e.target.value as Role)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="clone-user">Clone User</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                        <input
                          id="edit-isChecked"
                          type="checkbox"
                          checked={editForm.isChecked}
                          onChange={(e) => updateEditForm("isChecked", e.target.checked)}
                          className="rounded focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300"
                        />
                        <label
                          htmlFor="edit-isChecked"
                          className="text-sm font-medium text-gray-700"
                        >
                          Account Verified
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Broker & Strategy */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiDatabase className="h-5 w-5 text-purple-500" />
                      Broker & Strategy Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Broker Name
                        </label>
                        <input
                          type="text"
                          value={editForm.brokerName}
                          onChange={(e) => updateEditForm("brokerName", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter broker name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Broker Image URL
                        </label>
                        <input
                          type="text"
                          value={editForm.brokerImageLink}
                          onChange={(e) => updateEditForm("brokerImageLink", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter image URL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Strategy Name
                        </label>
                        <input
                          type="text"
                          value={editForm.strategyName}
                          onChange={(e) => updateEditForm("strategyName", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter strategy name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Strategy Description
                        </label>
                        <textarea
                          value={editForm.strategyDis}
                          onChange={(e) => updateEditForm("strategyDis", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          rows={3}
                          placeholder="Enter strategy description"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiPackage className="h-5 w-5 text-indigo-500" />
                      Package Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Package Name
                        </label>
                        <input
                          type="text"
                          value={editForm.packageName}
                          onChange={(e) => updateEditForm("packageName", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter package name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Package Description
                        </label>
                        <textarea
                          value={editForm.packageDis}
                          onChange={(e) => updateEditForm("packageDis", e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          rows={3}
                          placeholder="Enter package description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Package Start Date
                        </label>
                        <div className="relative">
                          <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="date"
                            value={editForm.packageFromDate}
                            onChange={(e) => updateEditForm("packageFromDate", e.target.value)}
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Package End Date
                        </label>
                        <div className="relative">
                          <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="date"
                            value={editForm.packageDate}
                            onChange={(e) => updateEditForm("packageDate", e.target.value)}
                            className="w-full border border-gray-300 rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  <span className="flex items-center gap-2">
                    <FiEdit className="h-4 w-4" />
                    Update User
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}