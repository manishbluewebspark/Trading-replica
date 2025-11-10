
// src/pages/UsersTables.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type Role = "admin" | "user";

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
};

const API_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:5001/api"

export default function UsersTables() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      // Adjust endpoint to match your backend: /users or /users/list
      const res = await axios.get(`${API_URL}/users/get-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      // Accept either direct array or { data: [...] }
      const payload = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setUsers(payload);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

   (iso?: string) =>
    iso ? new Date(iso).toLocaleString("en-IN") : "-";

    // const fmtDate = (iso?: string) =>
    // iso ? new Date(iso).toLocaleString("en-IN") : "-";

  const fullName = (u: User) =>
    [u.firstName, u.lastName].filter(Boolean).join(" ") || "-";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">Users</h2>

        <div className="flex gap-3">
          <input
            className="border rounded px-3 py-2 w-64"
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

      {/* Status */}
      {loading && <p>Loading…</p>}
      {!!error && <p className="text-red-600">{error}</p>}
      {!loading && !error && users.length === 0 && (
        <p>No users found.</p>
      )}

      {/* Table */}
      {!loading && !error && users.length > 0 && (
        <div className="w-full overflow-auto rounded border">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2 border-b">#</th>
                <th className="px-3 py-2 border-b">Name</th>
                <th className="px-3 py-2 border-b">Email</th>
                <th className="px-3 py-2 border-b">Username</th>
                <th className="px-3 py-2 border-b">Phone</th>
                <th className="px-3 py-2 border-b">Role</th>
                <th className="px-3 py-2 border-b">Checked</th>
                <th className="px-3 py-2 border-b">Broker</th>
                <th className="px-3 py-2 border-b">Angel Login</th>
                {/* <th className="px-3 py-2 border-b">Created</th> */}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((u, idx) => (
                <tr key={u.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 border-b">
                    {start + idx + 1}
                  </td>
                  <td className="px-3 py-2 border-b">{fullName(u)}</td>
                  <td className="px-3 py-2 border-b">{u.email}</td>
                  <td className="px-3 py-2 border-b">{u.username}</td>
                  <td className="px-3 py-2 border-b">{u.phoneNumber ?? "-"}</td>
                  <td className="px-3 py-2 border-b capitalize">{u.role}</td>
                  <td className="px-3 py-2 border-b">
                    {u.isChecked ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b">{u.brokerName ?? "-"}</td>
                 <td
  className={`px-3 py-2 border-b font-medium text-center ${
    u.angelLoginUser
      ? "text-green-700 bg-green-50" // ✅ green for Yes
      : "text-red-700 bg-red-50"     // ❌ red for No
  }`}
>
  {u.angelLoginUser ? "Yes" : "No"}
</td>
                  {/* <td className="px-3 py-2 border-b">{fmtDate(u.createdAt)}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
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
            <span className="px-2 py-1 text-sm">
              Page {currentPage} / {totalPages}
            </span>
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
    </div>
  );
}
