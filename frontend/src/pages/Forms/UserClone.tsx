// // src/pages/UserClone.tsx
// import React, { useEffect, useState,useRef } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

// const apiUrl = import.meta.env.VITE_API_URL;

// type Role = "admin" | "user";

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
//   packageDate?: string | null; // ISO
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
//   packageDate: string; // yyyy-mm-dd
// };

// const emptyForm: UserForm = {
//   firstName: "",
//   lastName: "",
//    password :"",
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
// };

// const UserClone: React.FC = () => {
//   const [users, setUsers] = useState<UserRow[]>([]);

//   // 🟢 one object for create form
//   const [createForm, setCreateForm] = useState<UserForm>(emptyForm);

//   // 🟡 one object for edit form
//   const [editForm, setEditForm] = useState<UserForm>(emptyForm);

//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState<UserRow | null>(null);

//   const [excelFile, setExcelFile] = useState<File | null>(null);

//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [uploadingUserId, setUploadingUserId] = useState<number | null>(null);

//   // ---------- helpers ----------
//   const updateCreateForm = (
//     field: keyof UserForm,
//     value: string | boolean
//   ) => {
//     setCreateForm((prev) => ({ ...prev, [field]: value } as UserForm));
//   };

//   const updateEditForm = (field: keyof UserForm, value: string | boolean) => {
//     setEditForm((prev) => ({ ...prev, [field]: value } as UserForm));
//   };

//   // ---------- API ----------
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

//         console.log(res.data.data);
        
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

//   // ---------- CREATE ----------
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

//   // ---------- EDIT ----------
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
//     });

//     setIsEditModalOpen(true);
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

//   // ---------- DELETE ----------
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

//   // ---------- EXCEL ----------
//   const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setExcelFile(e.target.files[0]);
//     }
//   };

//   const handleExcelUpload = async () => {
//     if (!excelFile) {
//       toast.error("Please select an Excel file first");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", excelFile);

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/users/upload-excel`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: localStorage.getItem("userID") || "",
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       if (res.data.status === true) {
//         toast.success(res.data.message || "Excel uploaded");
//         setExcelFile(null);
//         (document.getElementById("excel-input") as HTMLInputElement).value = "";
//         fetchUsers();
//       } else {
//         toast.error(res.data.message || "Failed to process Excel");
//       }
//     } catch (error: any) {
//       toast.error(error.message || "Something went wrong");
//     }
//   };

//   // ---------- MODAL CLOSE ----------
//   const handleCloseCreateModal = () => {
//     setIsCreateModalOpen(false);
//     setCreateForm(emptyForm); // ✅ single reset
//   };

//   const handleCloseEditModal = () => {
//     setIsEditModalOpen(false);
//     setEditingUser(null);
//     setEditForm(emptyForm);
//   };

//   // ---------- RENDER ----------
//   return (
//     <div className="p-6 max-w-6xl mx-auto">
//       {/* Header row */}
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

//       {/* User table */}
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
//                     #
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
//                    <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Phone
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Role
//                   </th>
//                   {/* <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Broker
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Strategy
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Package
//                   </th>
//                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
//                     Package Date
//                   </th> */}
//                   <th className="px-3 py-2 border text-xs text-center font-semibold uppercase">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map((u, i) => (
//                   <tr key={u.id} className="hover:bg-gray-50">
//                     <td className="px-3 py-2 border text-sm">{i + 1}</td>
//                     <td className="px-3 py-2 border text-sm">
//                       {(u.firstName || "") + " " + (u.lastName || "")}
//                     </td>
//                     <td className="px-3 py-2 border text-sm">{u.email}</td>
//                     <td className="px-3 py-2 border text-sm">{u.username}</td>
//                     <td className="px-3 py-2 border text-sm">{u.password}</td>
//                     <td className="px-3 py-2 border text-sm">
//                       {u.phoneNumber || "-"}
//                     </td>
//                     <td className="px-3 py-2 border text-sm">{u.role}</td>
//                     {/* <td className="px-3 py-2 border text-sm">
//                       {u.brokerName || "-"}
//                     </td>
//                     <td className="px-3 py-2 border text-sm">
//                       {u.strategyName || "-"}
//                     </td>
//                     <td className="px-3 py-2 border text-sm">
//                       {u.packageName || "-"}
//                     </td>
//                     <td className="px-3 py-2 border text-sm">
//                       {u.packageDate
//                         ? new Date(u.packageDate).toLocaleDateString()
//                         : "-"}
//                     </td> */}
//                     <td className="px-3 py-2 border text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => handleEditClick(u)}
//                           className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
//                         >
//                           Update
//                         </button>
//                         <button
//                           onClick={() => handleDelete(u.id)}
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
//                         >
//                           Delete
//                         </button>

//                          <button
//                           onClick={() => handleDelete(u.id)}
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
//                         >
//                          File
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
//               {/* Basic */}
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

//                    <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Password
//                   </label>
//                   <input
//                     type="text"
//                     value={createForm.password}
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
//                 {/* <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Username *
//                   </label>
//                   <input
//                     type="text"
//                     value={createForm.username}
//                     onChange={(e) =>
//                       updateCreateForm("username", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                     required
//                   />
//                 </div> */}
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
//                 {/* <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Role
//                   </label>
//                   <select
//                     value={createForm.role}
//                     onChange={(e) =>
//                       updateCreateForm("role", e.target.value as Role)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   >
//                     <option value="user">User</option>
//                     <option value="admin">Admin</option>
//                      <option value="clone-user">Clone-User</option>
//                   </select>
//                 </div> */}
//                 {/* <div className="flex items-center gap-2 mt-2 md:mt-6">
//                   <input
//                     id="create-isChecked"
//                     type="checkbox"
//                     checked={createForm.isChecked}
//                     onChange={(e) =>
//                       updateCreateForm("isChecked", e.target.checked)
//                     }
//                   />
//                   <label
//                     htmlFor="create-isChecked"
//                     className="text-sm font-medium"
//                   >
//                     Is Checked
//                   </label>
//                 </div> */}
//               </div>

//               <hr className="my-2" />

//               {/* Broker & Strategy */}
//               {/* <h3 className="text-sm font-semibold text-gray-700">
//                 Broker & Strategy
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Broker Name
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
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Broker Image Link
//                   </label>
//                   <input
//                     type="text"
//                     value={createForm.brokerImageLink}
//                     onChange={(e) =>
//                       updateCreateForm("brokerImageLink", e.target.value)
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
//                     value={createForm.strategyName}
//                     onChange={(e) =>
//                       updateCreateForm("strategyName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Strategy Description
//                   </label>
//                   <textarea
//                     value={createForm.strategyDis}
//                     onChange={(e) =>
//                       updateCreateForm("strategyDis", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                     rows={2}
//                   />
//                 </div>
//               </div> */}

//               <hr className="my-2" />

//               {/* Package */}
//               {/* <h3 className="text-sm font-semibold text-gray-700">
//                 Package Details
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Package Name
//                   </label>
//                   <input
//                     type="text"
//                     value={createForm.packageName}
//                     onChange={(e) =>
//                       updateCreateForm("packageName", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div> */}
//                 {/* <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Package Description
//                   </label>
//                   <textarea
//                     value={createForm.packageDis}
//                     onChange={(e) =>
//                       updateCreateForm("packageDis", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                     rows={2}
//                   />
//                 </div> */}
//                 {/* <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Package Date
//                   </label>
//                   <input
//                     type="date"
//                     value={createForm.packageDate}
//                     onChange={(e) =>
//                       updateCreateForm("packageDate", e.target.value)
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div> */}
//               {/* </div> */}

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
// };

// export default UserClone;






// src/pages/UserClone.tsx




// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

// const apiUrl = import.meta.env.VITE_API_URL;

// type Role = "admin" | "user";

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
//   packageDate?: string | null; // ISO
//   DematFund:any
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
//   DematFund:any;
//   packageDate: string; // yyyy-mm-dd
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
//   DematFund:0
// };

// const UserClone: React.FC = () => {

//   const [users, setUsers] = useState<UserRow[]>([]);

//   // 🟢 one object for create form
//   const [createForm, setCreateForm] = useState<UserForm>(emptyForm);

//   // 🟡 one object for edit form
//   const [editForm, setEditForm] = useState<UserForm>(emptyForm);

//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState<UserRow | null>(null);

//   // 🔹 Excel upload
//   const [excelFile, setExcelFile] = useState<File | null>(null);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [uploadingUserId, setUploadingUserId] = useState<number | null>(null);
//   const [isFileModalOpen, setIsFileModalOpen] = useState(false);

//   // ---------- helpers ----------
//   const updateCreateForm = (
//     field: keyof UserForm,
//     value: string | boolean
//   ) => {
//     setCreateForm((prev) => ({ ...prev, [field]: value } as UserForm));
//   };

//   const updateEditForm = (field: keyof UserForm, value: string | boolean) => {
//     setEditForm((prev) => ({ ...prev, [field]: value } as UserForm));
//   };

//   // ---------- API ----------
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
//         console.log(res.data.data);
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

//   // ---------- CREATE ----------
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

//   // ---------- EDIT ----------
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

//   // ---------- DELETE ----------
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

//   // ---------- FILE (EXCEL) UPLOAD FLOW ----------

//   // when click File button in row → open modal
//   const handleOpenFileModal = (userId: number) => {
//     setUploadingUserId(userId);
//     setExcelFile(null);
//     setIsFileModalOpen(true);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   const handleCloseFileModal = () => {
//     setIsFileModalOpen(false);
//     setUploadingUserId(null);
//     setExcelFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   // select file in modal
//   const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // ✅ validate Excel (by extension)
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

//   // upload to backend for that specific user
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
//     formData.append("userId", String(uploadingUserId)); // 🔹 send userId also

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/clone-users/upload-excel`, // your existing endpoint
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid:uploadingUserId || "",
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

//   // ---------- MODAL CLOSE ----------
//   const handleCloseCreateModal = () => {
//     setIsCreateModalOpen(false);
//     setCreateForm(emptyForm); // ✅ single reset
//   };

//   const handleCloseEditModal = () => {
//     setIsEditModalOpen(false);
//     setEditingUser(null);
//     setEditForm(emptyForm);
//   };

//   // ---------- RENDER ----------
//   return (
//     <div className="p-6 max-w-6xl mx-auto">
//       {/* Header row */}
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

//       {/* User table */}
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
//                     <td className="px-3 py-2 border text-sm">{u.role}</td>
                    
//                     <td className="px-3 py-2 border text-sm text-center">
//                       <div className="flex items-center justify-center gap-2">
//                         <button
//                           onClick={() => handleEditClick(u)}
//                           className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
//                         >
//                           Update
//                         </button>
//                         <button
//                           onClick={() => handleDelete(u.id)}
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
//                         >
//                           Delete
//                         </button>

//                         {/* 🔹 File button → open file upload modal */}
//                         <button
//                           onClick={() => handleOpenFileModal(u.id)}
//                           className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
//                         >
//                           File
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
//               {/* Basic */}
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

//                  <div>
//                   <label className="block text-sm font-medium mb-1">
//                   Broker
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

//                      <div>

                 

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

//       {/* 🔹 FILE UPLOAD MODAL (EXCEL) */}
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







// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

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

//   const handleCreateOrder = async (userId: number) => {
//     // Add your custom logic here for creating an order
//     // Example: Call your backend API
//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/clone-users/${userId}/create-order`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: localStorage.getItem("userID") || "",
//           },
//         }
//       );
//       if (res.data.status === true) {
//         toast.success(res.data.message || "Order created successfully");
//         setOpenActionId(null);
//         fetchUsers();
//       } else {
//         toast.error(res.data.message || "Failed to create order");
//       }
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
//                     <td className="px-3 py-2 border text-sm">{u.role}</td>
//                     <td className="px-3 py-2 border text-sm text-center relative">
//                       <button
//                         onClick={(e) => toggleActionMenu(u.id, e)}
//                         className="text-gray-600 hover:text-gray-800 focus:outline-none"
//                       >
//                         ⋮
//                       </button>
//                       {openActionId === u.id && (
//                         <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
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
//                             onClick={() => handleCreateOrder(u.id)}
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

  const [users, setUsers] = useState<UserRow[]>([]);
  const [createForm, setCreateForm] = useState<UserForm>(emptyForm);
  const [editForm, setEditForm] = useState<UserForm>(emptyForm);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingUserId, setUploadingUserId] = useState<number | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const updateCreateForm = (field: keyof UserForm, value: string | boolean) => {
    setCreateForm((prev) => ({ ...prev, [field]: value } as UserForm));
  };

  const updateEditForm = (field: keyof UserForm, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value } as UserForm));
  };

  const fetchUsers = async () => {
    try {
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
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim() || !createForm.phoneNumber.trim()) {
      toast.error("Email and phoneNumber are required");
      return;
    }
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
        toast.success(res.data.message || "User created");
        handleCloseCreateModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to create user");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
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
    setOpenActionId(null);
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
        toast.success(res.data.message || "User updated");
        handleCloseEditModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to update user");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await axios.delete(`${apiUrl}/admin/clone-users/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      if (res.data.status === true) {
        toast.success(res.data.message || "User deleted");
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to delete user");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleCreateOrder = async (userId: number) => {
    // Add your custom logic here for creating an order
    try {

       navigate(`/order-admin/${userId}`);
    
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
    setOpenActionId(null);
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
      toast.error(error.message || "Something went wrong");
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm(emptyForm);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditForm(emptyForm);
  };

  const toggleActionMenu = (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenActionId(openActionId === userId ? null : userId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">User Clone</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            + Create User
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">User List</h2>
        {users.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No users found. Create a user or upload Excel.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
                    Id
                  </th>
                  <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
                    Name
                  </th>
                  <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
                    Email
                  </th>
                  <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
                    Username
                  </th>
                  <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
                    Password
                  </th>
                  <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
                    Phone
                  </th>
                   <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
                    Fund
                  </th>
                  <th className="px-3 py-2 border text-xs text-left font-semibold uppercase">
                    Role
                  </th>
                  <th className="px-3 py-2 border text-xs text-center font-semibold uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border text-sm">{u.id}</td>
                    <td className="px-3 py-2 border text-sm">
                      {(u.firstName || "") + " " + (u.lastName || "")}
                    </td>
                    <td className="px-3 py-2 border text-sm">{u.email}</td>
                    <td className="px-3 py-2 border text-sm">{u.username}</td>
                    <td className="px-3 py-2 border text-sm">{u.password}</td>
                    <td className="px-3 py-2 border text-sm">
                      {u.phoneNumber || "-"}
                    </td>
                      <td className="px-3 py-2 border text-sm">{u.DematFund}</td>
                    <td className="px-3 py-2 border text-sm">{u.role}</td>
                    <td className="px-3 py-2 border text-sm text-center relative">
                      <button
                        onClick={(e) => toggleActionMenu(u.id, e)}
                        className="text-gray-600 hover:text-gray-800 focus:outline-none"
                      >
                        ⋮
                      </button>
                      {openActionId === u.id && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-10">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleOpenFileModal(u.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            File
                          </button>
                          <button
                            onClick={() => handleCreateOrder(u.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Create Order
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
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Create User</h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form className="px-4 py-4 space-y-4" onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) =>
                      updateCreateForm("firstName", e.target.value)
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
                    value={createForm.lastName}
                    onChange={(e) =>
                      updateCreateForm("lastName", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    value={createForm.password || ""}
                    onChange={(e) =>
                      updateCreateForm("password", e.target.value)
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
                    value={createForm.email}
                    onChange={(e) => updateCreateForm("email", e.target.value)}
                    className="border rounded px-3 py-2 w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={createForm.phoneNumber}
                    onChange={(e) =>
                      updateCreateForm("phoneNumber", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Broker
                  </label>
                  <input
                    type="text"
                    value={createForm.brokerName}
                    onChange={(e) =>
                      updateCreateForm("brokerName", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingUser && (
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
                    onChange={(e) =>
                      updateEditForm("lastName", e.target.value)
                    }
                    className="border rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    value={editForm.password || ""}
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
                <div>
                  <label className="block text-sm font-medium mb-1">
                    DematFund
                  </label>
                  <input
                    type="number"
                    value={editForm.DematFund}
                    onChange={(e) =>
                      updateEditForm("DematFund", e.target.value)
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

      {/* FILE UPLOAD MODAL */}
      {isFileModalOpen && uploadingUserId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">
                Upload Excel for User #{uploadingUserId}
              </h2>
              <button
                onClick={handleCloseFileModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Excel File (.xls / .xlsx)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleExcelChange}
                  className="border rounded px-3 py-2 w-full text-sm"
                />
              </div>
              {excelFile && (
                <p className="text-xs text-gray-600">
                  Selected: <span className="font-medium">{excelFile.name}</span>
                </p>
              )}
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseFileModal}
                className="px-4 py-2 rounded border text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExcelUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserClone;



