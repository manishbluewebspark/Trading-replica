




// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";

// const apiUrl = import.meta.env.VITE_API_URL;

// type Role = "admin" | "user" | "clone-user";
// type UserRow = {
//   id: number;
//   firstName?: string | null;
//   password?: string | null;
//   lastName?: string | null;
//   email: string;
//   username: string;
//   phoneNumber?: string | null;
//   role: Role;
//   isChecked: boolean;
//   brokerName?: string | null;
//   brokerImageLink?: string | null;
//   strategyName?: string | null;
//   strategyDis?: string | null;
//   packageName?: string | null;
//   packageDis?: string | null;
//   packageDate?: string | null;
//   DematFund: any;
// };

// type UserForm = {
//   firstName: string;
//   password?: string | null;
//   lastName: string;
//   email: string;
//   username: string;
//   phoneNumber: string;
//   role: Role;
//   isChecked: boolean;
//   brokerName: string;
//   brokerImageLink: string;
//   strategyName: string;
//   strategyDis: string;
//   packageName: string;
//   packageDis: string;
//   DematFund: any;
//   packageDate: string;
// };

// const emptyForm: UserForm = {
//   firstName: "",
//   lastName: "",
//   password: "",
//   email: "",
//   username: "",
//   phoneNumber: "",
//   role: "user",
//   isChecked: false,
//   brokerName: "",
//   brokerImageLink: "",
//   strategyName: "",
//   strategyDis: "",
//   packageName: "",
//   packageDis: "",
//   packageDate: "",
//   DematFund: 0,
// };

// const UserClone: React.FC = () => {

//   const navigate = useNavigate();

//   const [users, setUsers] = useState<UserRow[]>([]);
//   const [createForm, setCreateForm] = useState<UserForm>(emptyForm);
//   const [editForm, setEditForm] = useState<UserForm>(emptyForm);
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState<UserRow | null>(null);
//   const [excelFile, setExcelFile] = useState<File | null>(null);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [uploadingUserId, setUploadingUserId] = useState<number | null>(null);
//   const [isFileModalOpen, setIsFileModalOpen] = useState(false);
//   const [openActionId, setOpenActionId] = useState<number | null>(null);

//   const updateCreateForm = (field: keyof UserForm, value: string | boolean) => {
//     setCreateForm((prev) => ({ ...prev, [field]: value } as UserForm));
//   };

//   const updateEditForm = (field: keyof UserForm, value: string | boolean) => {
//     setEditForm((prev) => ({ ...prev, [field]: value } as UserForm));
//   };

//   const fetchUsers = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/clone-users`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });
//       if (res.data.status === true) {
//         setUsers(res.data.data || []);
//       } else {
//         toast.error(res.data.message || "Failed to fetch users");
//       }
//     } catch (error: any) {
//       toast.error(error.message || "Something went wrong");
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const handleCreate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!createForm.email.trim() || !createForm.phoneNumber.trim()) {
//       toast.error("Email and phoneNumber are required");
//       return;
//     }
//     const payload = {
//       ...createForm,
//       packageDate: createForm.packageDate || null,
//     };
//     try {
//       const res = await axios.post(`${apiUrl}/admin/clone-users`, payload, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });
//       if (res.data.status === true) {
//         toast.success(res.data.message || "User created");
//         handleCloseCreateModal();
//         fetchUsers();
//       } else {
//         toast.error(res.data.message || "Failed to create user");
//       }
//     } catch (error: any) {
//       toast.error(error.message || "Something went wrong");
//     }
//   };

//   const handleEditClick = (user: UserRow) => {
//     setEditingUser(user);
//     setEditForm({
//       firstName: user.firstName || "",
//       lastName: user.lastName || "",
//       email: user.email || "",
//       password: user.password || "",
//       username: user.username || "",
//       phoneNumber: user.phoneNumber || "",
//       role: user.role || "user",
//       isChecked: user.isChecked || false,
//       brokerName: user.brokerName || "",
//       brokerImageLink: user.brokerImageLink || "",
//       strategyName: user.strategyName || "",
//       strategyDis: user.strategyDis || "",
//       packageName: user.packageName || "",
//       packageDis: user.packageDis || "",
//       packageDate: user.packageDate ? user.packageDate.slice(0, 10) : "",
//       DematFund: user.DematFund || 0,
//     });
//     setIsEditModalOpen(true);
//     setOpenActionId(null);
//   };

//   const handleUpdate = async () => {
//     if (!editingUser) {
//       toast.error("No user selected");
//       return;
//     }
//     if (!editForm.email.trim() || !editForm.username.trim()) {
//       toast.error("Email and Username are required");
//       return;
//     }
//     const payload = {
//       ...editForm,
//       packageDate: editForm.packageDate || null,
//     };
//     try {
//       const res = await axios.put(
//         `${apiUrl}/admin/clone-users/${editingUser.id}`,
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
//         toast.success(res.data.message || "User updated");
//         handleCloseEditModal();
//         fetchUsers();
//       } else {
//         toast.error(res.data.message || "Failed to update user");
//       }
//     } catch (error: any) {
//       toast.error(error.message || "Something went wrong");
//     }
//   };

//   const handleDelete = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this user?")) return;
//     try {
//       const res = await axios.delete(`${apiUrl}/admin/clone-users/${id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID") || "",
//         },
//       });
//       if (res.data.status === true) {
//         toast.success(res.data.message || "User deleted");
//         fetchUsers();
//       } else {
//         toast.error(res.data.message || "Failed to delete user");
//       }
//     } catch (error: any) {
//       toast.error(error.message || "Something went wrong");
//     }
//   };

//   const handleCreateOrder = async (userId: number,username:any) => {
//     // Add your custom logic here for creating an order
//     try {

//        navigate(`/order-admin/${userId}/${username}`);
    
//     } catch (error: any) {
//       toast.error(error.message || "Something went wrong");
//     }
//   };

//   const handleOpenFileModal = (userId: number) => {
//     setUploadingUserId(userId);
//     setExcelFile(null);
//     setIsFileModalOpen(true);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//     setOpenActionId(null);
//   };

//   const handleCloseFileModal = () => {
//     setIsFileModalOpen(false);
//     setUploadingUserId(null);
//     setExcelFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const allowedExtensions = [".xls", ".xlsx"];
//     const fileName = file.name.toLowerCase();
//     const isValid = allowedExtensions.some((ext) => fileName.endsWith(ext));
//     if (!isValid) {
//       toast.error("Please select a valid Excel file (.xls or .xlsx)");
//       e.target.value = "";
//       setExcelFile(null);
//       return;
//     }
//     setExcelFile(file);
//   };

//   const handleExcelUpload = async () => {
//     if (!uploadingUserId) {
//       toast.error("User not selected");
//       return;
//     }
//     if (!excelFile) {
//       toast.error("Please select an Excel file first");
//       return;
//     }
//     const formData = new FormData();
//     formData.append("file", excelFile);
//     formData.append("userId", String(uploadingUserId));
//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/clone-users/upload-excel`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: uploadingUserId || "",
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );
//       if (res.data.status === true) {
//         toast.success(res.data.message || "Excel uploaded successfully");
//         handleCloseFileModal();
//         fetchUsers();
//       } else {
//         toast.error(res.data.message || "Failed to process Excel");
//       }
//     } catch (error: any) {
//       toast.error(error.message || "Something went wrong");
//     }
//   };

//   const handleCloseCreateModal = () => {
//     setIsCreateModalOpen(false);
//     setCreateForm(emptyForm);
//   };

//   const handleCloseEditModal = () => {
//     setIsEditModalOpen(false);
//     setEditingUser(null);
//     setEditForm(emptyForm);
//   };

//   const toggleActionMenu = (userId: number, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setOpenActionId(openActionId === userId ? null : userId);
//   };

//   return (
//     <div className="p-6 max-w-6xl mx-auto">
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
//         <h1 className="text-2xl font-semibold">User Clone</h1>
//         <div className="flex flex-wrap gap-3">
//           <button
//             onClick={() => setIsCreateModalOpen(true)}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
//           >
//             + Create User
//           </button>
//         </div>
//       </div>
//       <div className="bg-white rounded-lg shadow p-4">
//         <h2 className="text-lg font-semibold mb-3">User List</h2>
//         {users.length === 0 ? (
//           <p className="text-gray-500 text-sm">
//             No users found. Create a user or upload Excel.
//           </p>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full border border-gray-200">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Id
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Name
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Email
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Username
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Password
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Phone
//                   </th>
//                    <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Fund
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Role
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-center font-semibold uppercase">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map((u) => (
//                   <tr key={u.id} className="hover:bg-gray-50">
//                     <td className="px-3 py-2 border text-sm">{u.id}</td>
//                     <td className="px-3 py-2 border text-sm">
//                       {(u.firstName || "") + " " + (u.lastName || "")}
//                     </td>
//                     <td className="px-3 py-2 border text-sm">{u.email}</td>
//                     <td className="px-3 py-2 border text-sm">{u.username}</td>
//                     <td className="px-3 py-2 border text-sm">{u.password}</td>
//                     <td className="px-3 py-2 border text-sm">
//                       {u.phoneNumber || "-"}
//                     </td>
//                       <td className="px-3 py-2 border text-sm">{u.DematFund}</td>
//                     <td className="px-3 py-2 border text-sm">{u.role}</td>
//                     <td className="px-3 py-2 border text-sm text-center relative">
//                       <button
//                         onClick={(e) => toggleActionMenu(u.id, e)}
//                         className="text-gray-600 hover:text-gray-800 focus:outline-none"
//                       >
//                         ⋮
//                       </button>
//                       {openActionId === u.id && (
//                         <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-10">
//                           <button
//                             onClick={() => handleEditClick(u)}
//                             className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           >
//                             Update
//                           </button>
//                           <button
//                             onClick={() => handleDelete(u.id)}
//                             className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           >
//                             Delete
//                           </button>
//                           <button
//                             onClick={() => handleOpenFileModal(u.id)}
//                             className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           >
//                             File
//                           </button>
//                           <button
//                             onClick={() => handleCreateOrder(u.id,u.username)}
//                             className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                           >
//                             Create Order
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

//       {/* CREATE MODAL */}
//       {isCreateModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <h2 className="text-lg font-semibold">Create User</h2>
//               <button
//                 onClick={handleCloseCreateModal}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>
//             <form className="px-4 py-4 space-y-4" onSubmit={handleCreate}>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     First Name
//                   </label>
//                   <input
//                     type="text"
//                     value={createForm.firstName}
//                     onChange={(e) =>
//                       updateCreateForm("firstName", e.target.value)
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
//                     value={createForm.lastName}
//                     onChange={(e) =>
//                       updateCreateForm("lastName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Password
//                   </label>
//                   <input
//                     type="text"
//                     value={createForm.password || ""}
//                     onChange={(e) =>
//                       updateCreateForm("password", e.target.value)
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
//                     value={createForm.email}
//                     onChange={(e) => updateCreateForm("email", e.target.value)}
//                     className="border rounded px-3 py-2 w-full text-sm"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Phone Number
//                   </label>
//                   <input
//                     type="text"
//                     value={createForm.phoneNumber}
//                     onChange={(e) =>
//                       updateCreateForm("phoneNumber", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Broker
//                   </label>
//                   <input
//                     type="text"
//                     value={createForm.brokerName}
//                     onChange={(e) =>
//                       updateCreateForm("brokerName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end gap-2 pt-3">
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
//                   Save User
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* EDIT MODAL */}
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
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Password
//                   </label>
//                   <input
//                     type="text"
//                     value={editForm.password || ""}
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
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     DematFund
//                   </label>
//                   <input
//                     type="number"
//                     value={editForm.DematFund}
//                     onChange={(e) =>
//                       updateEditForm("DematFund", e.target.value)
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

//       {/* FILE UPLOAD MODAL */}
//       {isFileModalOpen && uploadingUserId && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
//             <div className="flex items-center justify-between px-4 py-3 border-b">
//               <h2 className="text-lg font-semibold">
//                 Upload Excel for User #{uploadingUserId}
//               </h2>
//               <button
//                 onClick={handleCloseFileModal}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>
//             <div className="px-4 py-4 space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Select Excel File (.xls / .xlsx)
//                 </label>
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept=".xls,.xlsx"
//                   onChange={handleExcelChange}
//                   className="border rounded px-3 py-2 w-full text-sm"
//                 />
//               </div>
//               {excelFile && (
//                 <p className="text-xs text-gray-600">
//                   Selected: <span className="font-medium">{excelFile.name}</span>
//                 </p>
//               )}
//             </div>
//             <div className="px-4 py-3 border-t flex justify-end gap-2">
//               <button
//                 type="button"
//                 onClick={handleCloseFileModal}
//                 className="px-4 py-2 rounded border text-sm text-gray-700 hover:bg-gray-100"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={handleExcelUpload}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
//               >
//                 Upload
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UserClone;








import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { SiRclone } from "react-icons/si";
import { FaUserEdit } from "react-icons/fa";
import { RiDeleteBin5Fill } from "react-icons/ri";
import { FaUpload } from "react-icons/fa6";
import { IoCreateSharp } from "react-icons/io5";
import {
  HiDotsHorizontal,
  HiPlus,
  HiOutlinePencilAlt,
  HiOutlineDocumentAdd,
  HiOutlineUserAdd,
  HiX,
  HiOutlineCalendar,
  HiOutlineCreditCard,
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineKey,
  HiOutlineIdentification,
  HiOutlineCheckCircle,
  HiOutlineCloudUpload,
  HiOutlineExclamationCircle,
  HiOutlineTrash
} from "react-icons/hi";

const apiUrl = import.meta.env.VITE_API_URL;

type Role = "admin" | "user" | "clone-user";
type UserRow = {
  id: number;
  firstName?: string | null;
  password?: string | null;
  lastName?: string | null;
  email: string;
  username: string;
  phoneNumber?: string | null;
  role: Role;
  isChecked: boolean;
  brokerName?: string | null;
  brokerImageLink?: string | null;
  strategyName?: string | null;
  strategyDis?: string | null;
  packageName?: string | null;
  packageDis?: string | null;
  packageDate?: string | null;
  DematFund: any;
};

type UserForm = {
  firstName: string;
  password?: string | null;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: Role;
  isChecked: boolean;
  brokerName: string;
  brokerImageLink: string;
  strategyName: string;
  strategyDis: string;
  packageName: string;
  packageDis: string;
  DematFund: any;
  packageDate: string;
};

const emptyForm: UserForm = {
  firstName: "",
  lastName: "",
  password: "",
  email: "",
  username: "",
  phoneNumber: "",
  role: "user",
  isChecked: false,
  brokerName: "",
  brokerImageLink: "",
  strategyName: "",
  strategyDis: "",
  packageName: "",
  packageDis: "",
  packageDate: "",
  DematFund: 0,
};

const UserClone: React.FC = () => {
  const navigate = useNavigate();
  const gridRef = useRef<AgGridReact>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [createForm, setCreateForm] = useState<UserForm>(emptyForm);
  const [editForm, setEditForm] = useState<UserForm>(emptyForm);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingUserId, setUploadingUserId] = useState<number | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [actionButtonRect, setActionButtonRect] = useState<DOMRect | null>(null);
  const [actionButtonNode, setActionButtonNode] = useState<HTMLElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionMenuRef = useRef<HTMLDivElement>(null);

  const updateCreateForm = (field: keyof UserForm, value: string | boolean) => {
    setCreateForm((prev) => ({ ...prev, [field]: value } as UserForm));
  };

  const updateEditForm = (field: keyof UserForm, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value } as UserForm));
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/admin/clone-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      if (res.data.status === true) {
        setUsers(res.data.data || []);
      } else {
        toast.error(res.data.message || "Failed to fetch users");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node) &&
        actionButtonNode &&
        !actionButtonNode.contains(event.target as Node)
      ) {
        setOpenActionId(null);
        setActionButtonRect(null);
        setActionButtonNode(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionButtonNode]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCreateModalOpen) handleCloseCreateModal();
        if (isEditModalOpen) handleCloseEditModal();
        if (isDeleteModalOpen) handleCloseDeleteModal();
        if (isFileModalOpen) handleCloseFileModal();
        setOpenActionId(null);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isCreateModalOpen, isEditModalOpen, isDeleteModalOpen, isFileModalOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim() || !createForm.phoneNumber.trim()) {
      toast.error("Email and phoneNumber are required");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...createForm,
      packageDate: createForm.packageDate || null,
    };

    try {
      const res = await axios.post(`${apiUrl}/admin/clone-users`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      if (res.data.status === true) {
        toast.success(res.data.message || "User created successfully");
        handleCloseCreateModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to create user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (user: UserRow) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: user.password || "",
      username: user.username || "",
      phoneNumber: user.phoneNumber || "",
      role: user.role || "user",
      isChecked: user.isChecked || false,
      brokerName: user.brokerName || "",
      brokerImageLink: user.brokerImageLink || "",
      strategyName: user.strategyName || "",
      strategyDis: user.strategyDis || "",
      packageName: user.packageName || "",
      packageDis: user.packageDis || "",
      packageDate: user.packageDate ? user.packageDate.slice(0, 10) : "",
      DematFund: user.DematFund || 0,
    });
    setIsEditModalOpen(true);
    closeActionMenu();
  };

  const handleDeleteClick = (user: UserRow) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
    closeActionMenu();
  };

  const handleUpdate = async () => {
    if (!editingUser) {
      toast.error("No user selected");
      return;
    }
    if (!editForm.email.trim() || !editForm.username.trim()) {
      toast.error("Email and Username are required");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...editForm,
      packageDate: editForm.packageDate || null,
    };

    try {
      const res = await axios.put(
        `${apiUrl}/admin/clone-users/${editingUser.id}`,
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
        toast.success(res.data.message || "User updated successfully");
        handleCloseEditModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to update user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    setIsSubmitting(true);
    try {
      const res = await axios.delete(`${apiUrl}/admin/clone-users/${deletingUser.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      if (res.data.status === true) {
        toast.success(res.data.message || "User deleted successfully");
        handleCloseDeleteModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to delete user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrder = (userId: number, username: any) => {
    try {
      navigate(`/order-admin/${userId}/${username}`);
      closeActionMenu();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleOpenFileModal = (userId: number) => {
    setUploadingUserId(userId);
    setExcelFile(null);
    setIsFileModalOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    closeActionMenu();
  };

  const handleCloseFileModal = () => {
    setIsFileModalOpen(false);
    setUploadingUserId(null);
    setExcelFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedExtensions = [".xls", ".xlsx"];
    const fileName = file.name.toLowerCase();
    const isValid = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!isValid) {
      toast.error("Please select a valid Excel file (.xls or .xlsx)");
      e.target.value = "";
      setExcelFile(null);
      return;
    }
    setExcelFile(file);
  };

  const handleExcelUpload = async () => {
    if (!uploadingUserId) {
      toast.error("User not selected");
      return;
    }
    if (!excelFile) {
      toast.error("Please select an Excel file first");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", excelFile);
    formData.append("userId", String(uploadingUserId));

    try {
      const res = await axios.post(
        `${apiUrl}/admin/clone-users/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
            userid: uploadingUserId || "",
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.data.status === true) {
        toast.success(res.data.message || "Excel uploaded successfully");
        handleCloseFileModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to process Excel");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCreateModal = () => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
    setCreateForm(emptyForm);
  };

  const handleCloseEditModal = () => {
    if (isSubmitting) return;
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditForm(emptyForm);
  };

  const handleCloseDeleteModal = () => {
    if (isSubmitting) return;
    setIsDeleteModalOpen(false);
    setDeletingUser(null);
  };

  const toggleActionMenu = (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();

    if (openActionId === userId) {
      setOpenActionId(null);
      setActionButtonRect(null);
      setActionButtonNode(null);
    } else {
      setActionButtonRect(rect);
      setActionButtonNode(button);
      setOpenActionId(userId);
    }
  };

  const closeActionMenu = () => {
    setOpenActionId(null);
    setActionButtonRect(null);
    setActionButtonNode(null);
  };

  // Calculate dropdown position
  const getDropdownStyle = (): React.CSSProperties => {
    if (!actionButtonRect) return { display: "none" };

    return {
      position: "fixed",
      top: actionButtonRect.bottom + 5,
      left: Math.min(actionButtonRect.left - 100, window.innerWidth - 200),
      zIndex: 9999,
    };
  };

  // AG Grid column definitions
  const columnDefs: any[] = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      minWidth: 80,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "name",
      headerName: "Name",
      valueGetter: (params: any) => {
        const firstName = params.data.firstName || "";
        const lastName = params.data.lastName || "";
        return `${firstName} ${lastName}`.trim();
      },
      width: 180,
      minWidth: 150,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "email",
      headerName: "Email",
      width: 220,
      minWidth: 180,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "username",
      headerName: "Username",
      width: 150,
      minWidth: 130,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "password",
      headerName: "Password",
      width: 150,
      minWidth: 130,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "phoneNumber",
      headerName: "Phone",
      width: 140,
      minWidth: 120,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "DematFund",
      headerName: "Fund",
      width: 120,
      minWidth: 100,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      },
      valueFormatter: (params: any) => {
        return params.value ? `₹${Number(params.value).toLocaleString('en-IN')}` : '₹0';
      }
    },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      minWidth: 110,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      },
      cellRenderer: (params: any) => {
        const roleColors: Record<string, string> = {
          admin: "bg-purple-100 text-purple-800",
          user: "bg-blue-100 text-blue-800",
          "clone-user": "bg-green-100 text-green-800"
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[params.value] || 'bg-gray-100 text-gray-800'}`}>
            {params.value}
          </span>
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      minWidth: 80,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      cellRenderer: (params: any) => {
        return (
          <div className="h-full flex items-center justify-center">
            <button
              onClick={(e) => toggleActionMenu(params.data.id, e)}
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none p-2 rounded-full transition-colors"
            >
              <HiDotsHorizontal className="w-5 h-5" />
            </button>
          </div>
        );
      },
      sortable: false,
      filter: false,
      resizable: false,
    },
  ];

  // Default column definitions
  const defaultColDef = {
    sortable: true,
    filter: true,
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

  const getRowStyle = () => {
    return {
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #e2e8f0'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <SiRclone className="w-8 h-8 text-blue-600" />
                User Clone Management
              </h1>
              <p className="text-gray-600 mt-2">Manage and clone user accounts with ease</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white! px-5 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <HiPlus className="w-5 h-5" />
                Create New User
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <HiOutlineUser className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <HiOutlineIdentification className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clone Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {users.filter(u => u.role === 'clone-user').length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <HiOutlineUserAdd className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Funds</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{users.reduce((sum, user) => sum + (Number(user.DematFund) || 0), 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <HiOutlineCreditCard className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">All Users</h2>
                <p className="text-gray-600 text-sm mt-1">Manage your user accounts and permissions</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchUsers}
                  className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                >
                  <HiOutlineCalendar className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <HiOutlineUser className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600 max-w-md mb-6">
                  Get started by creating your first user account or upload an Excel file.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2"
                >
                  <HiPlus className="w-5 h-5" />
                  Create First User
                </button>
              </div>
            ) : (
              <div className="ag-theme-alpine custom-ag-grid rounded-lg overflow-hidden border border-gray-200" style={{ height: 600, width: "100%" }}>
                <AgGridReact
                  ref={gridRef}
                  rowData={users}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  pagination={true}
                  getRowStyle={getRowStyle}
                  paginationPageSize={20}
                  domLayout="normal"
                  rowHeight={60}
                  headerHeight={50}
                  suppressCellFocus={true}
                  suppressRowClickSelection={true}
                  onGridReady={(params) => {
                    params.api.sizeColumnsToFit();
                  }}
                  rowClass="ag-row-custom hover:bg-gray-50"
                  suppressRowHoverHighlight={false}
                  enableBrowserTooltips={true}
                  overlayLoadingTemplate={
                    '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span class="ml-3 text-gray-600">Loading users...</span></div>'
                  }
                  overlayNoRowsTemplate={
                    '<div class="flex flex-col items-center justify-center h-full text-gray-500"><div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><p class="text-gray-900 font-medium">No users found</p><p class="text-gray-600 text-sm mt-1">Try adjusting your search or create a new user</p></div>'
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {openActionId !== null && actionButtonRect && (
        <div
          ref={actionMenuRef}
          style={getDropdownStyle()}
          className="w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden animate-in slide-in-from-top-1 duration-200"
        >
          <div className="p-2 space-y-1">
            <button
              onClick={() => {
                const user = users.find(u => u.id === openActionId);
                if (user) handleEditClick(user);
              }}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-150"
            >
              <FaUserEdit className="w-4 h-4" />
              <span>Update User</span>
            </button>
            <button
              onClick={() => {
                const user = users.find(u => u.id === openActionId);
                if (user) handleDeleteClick(user);
              }}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-150"
            >
              <RiDeleteBin5Fill className="w-4 h-4" />
              <span>Delete User</span>
            </button>
            <button
              onClick={() => {
                handleOpenFileModal(openActionId);
              }}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors duration-150"
            >
              <FaUpload className="w-4 h-4 " />
              <span>Upload Excel</span>
            </button>
            <button
              onClick={() => {
                const user = users.find(u => u.id === openActionId);
                if (user) {
                  handleCreateOrder(user.id, user.username);
                }
              }}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors duration-150"
            >
              <IoCreateSharp className="w-4 h-4" />
              <span>Create Order</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-999999 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HiOutlineUserAdd className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                  <p className="text-gray-600 text-sm">Add a new user to your system</p>
                </div>
              </div>
              <button
                onClick={handleCloseCreateModal}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <form className="flex-1 overflow-y-auto px-6 py-4 space-y-6" onSubmit={handleCreate}>
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineUser className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={createForm.firstName}
                        onChange={(e) => updateCreateForm("firstName", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter first name"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={createForm.lastName}
                      onChange={(e) => updateCreateForm("lastName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter last name"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineMail className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => updateCreateForm("email", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="user@example.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      value={createForm.phoneNumber}
                      onChange={(e) => updateCreateForm("phoneNumber", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="+91 9876543210"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineKey className="w-5 h-5 text-blue-600" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      value={createForm.username}
                      onChange={(e) => updateCreateForm("username", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter username"
                      disabled={isSubmitting}
                    />
                  </div> */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="text"
                      value={createForm.password || ""}
                      onChange={(e) => updateCreateForm("password", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter password"
                      disabled={isSubmitting}
                    />
                  </div>

                    <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Broker Name
  </label>
  <select
    value={createForm.brokerName}
    onChange={(e) => updateCreateForm("brokerName", e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
    disabled={isSubmitting}
  >
    <option value="">Select a broker</option>
    <option value="angelone">Angel One</option>
    <option value="kite">Kite</option>
    <option value="fyers">Fyers</option>
    <option value="groww">Groww</option>
    <option value="5paisa">5Paisa</option>
  </select>
</div>
                </div>
              </div>

         

              <div className="flex justify-end gap-3 pt-6 pb-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white! px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <HiOutlinePencilAlt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Update User</h2>
                  <p className="text-gray-600 text-sm">Edit user details and permissions</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineUser className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => updateEditForm("firstName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => updateEditForm("lastName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineMail className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => updateEditForm("email", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.phoneNumber}
                      onChange={(e) => updateEditForm("phoneNumber", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineKey className="w-5 h-5 text-blue-600" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => updateEditForm("username", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="text"
                      value={editForm.password || ""}
                      onChange={(e) => updateEditForm("password", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => updateEditForm("role", e.target.value as Role)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="clone-user">Clone User</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Demat Fund
                    </label>
                    <input
                      type="number"
                      value={editForm.DematFund}
                      onChange={(e) => updateEditForm("DematFund", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    id="edit-isChecked"
                    type="checkbox"
                    checked={editForm.isChecked}
                    onChange={(e) => updateEditForm("isChecked", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="edit-isChecked"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    Active Account
                  </label>
                </div>
              </div>

              {/* Broker & Strategy */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineChartBar className="w-5 h-5 text-blue-600" />
                  Broker & Strategy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Broker Name
                    </label>
                    <input
                      type="text"
                      value={editForm.brokerName}
                      onChange={(e) => updateEditForm("brokerName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Broker Image Link
                    </label>
                    <input
                      type="text"
                      value={editForm.brokerImageLink}
                      onChange={(e) => updateEditForm("brokerImageLink", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Strategy Name
                    </label>
                    <input
                      type="text"
                      value={editForm.strategyName}
                      onChange={(e) => updateEditForm("strategyName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Strategy Description
                    </label>
                    <textarea
                      value={editForm.strategyDis}
                      onChange={(e) => updateEditForm("strategyDis", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HiOutlineBriefcase className="w-5 h-5 text-blue-600" />
                  Package Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Package Name
                    </label>
                    <input
                      type="text"
                      value={editForm.packageName}
                      onChange={(e) => updateEditForm("packageName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Package Date
                    </label>
                    <input
                      type="date"
                      value={editForm.packageDate}
                      onChange={(e) => updateEditForm("packageDate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Package Description
                    </label>
                    <textarea
                      value={editForm.packageDis}
                      onChange={(e) => updateEditForm("packageDis", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 pb-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 z-9999999 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white rounded-t-2xl">

              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <HiOutlineExclamationCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <HiOutlineExclamationCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">Warning: This action is permanent</p>
                    <p className="text-sm text-red-700 mt-1">
                      Are you sure you want to delete user <span className="font-semibold">{deletingUser.firstName} {deletingUser.lastName}</span>?
                      All associated data will be permanently removed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-gray-700 min-w-[100px]">Name:</span>
                  <span className="text-gray-900">{deletingUser.firstName} {deletingUser.lastName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-gray-700 min-w-[100px]">Email:</span>
                  <span className="text-gray-900">{deletingUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-gray-700 min-w-[100px]">Role:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${deletingUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      deletingUser.role === 'user' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                    {deletingUser.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white! px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <HiOutlineTrash className="w-4 h-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {isFileModalOpen && uploadingUserId && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white rounded-t-2xl">

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <HiOutlineCloudUpload className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upload Excel File</h2>
                  <p className="text-gray-600 text-sm">For User #{uploadingUserId}</p>
                </div>
              </div>
              <button
                onClick={handleCloseFileModal}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Excel File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-gray-50/50">
                    <div className="flex flex-col items-center">
                      <HiOutlineDocumentAdd className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag & drop or click to browse
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Supports .xls, .xlsx files
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={handleExcelChange}
                        className="hidden"
                        id="excel-file-input"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="excel-file-input"
                        className={`${isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                          } text-white px-5 py-2.5 rounded-lg font-medium transition-colors`}
                      >
                        {isSubmitting ? 'Processing...' : 'Browse Files'}
                      </label>
                    </div>
                  </div>
                </div>

                {excelFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <HiOutlineDocumentAdd className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-800">File Selected</p>
                          <p className="text-sm text-green-700 truncate max-w-[200px]">{excelFile.name}</p>
                          <p className="text-xs text-green-600 mt-1">
                            {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {!isSubmitting && (
                        <button
                          onClick={() => {
                            setExcelFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-colors"
                        >
                          <HiX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseFileModal}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExcelUpload}
                disabled={!excelFile || isSubmitting}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${excelFile && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserClone;