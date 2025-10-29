import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

type User = {
  name: string;
  username: string;
  brokerBalance: number;
  strategyMultiplier: string[];
};

const sampleData: User[] = [
  {
    name: "Dr. Bhumi Manoj Aravind",
    username: "M92915",
    brokerBalance: 500000.8,
    strategyMultiplier: [
      "OB-Multi1(1x)",
      "OB-Multi2(1x)",
      "OB-Multi3(1x)",
      "OB-Multi4(1x)",
      "OB-BU-LC(1x)",
      "OB-BU-SP(1x)",
      "OB-BU-BSP(1x)",
    ],
  },
];

type SortKey = keyof User;

const UserReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const usersPerPage = 5;

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const filteredUsers = useMemo(() => {
    return sampleData.filter((user) =>
      Object.values(user)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      return sortOrder === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredUsers, sortKey, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return sortedUsers.slice(startIndex, startIndex + usersPerPage);
  }, [sortedUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div><h2>User Reports</h2></div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-4xl focus:outline-none  text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="w-full table-auto text-left border-collapse">
          <thead className="bg-gray-100 text-sm text-gray-700">
            <tr>
              {["name", "username", "brokerBalance", "strategyMultiplier"].map(
                (key) => (
                  <th
                    key={key}
                    className="px-4 py-2 border border-gray-300 cursor-pointer whitespace-nowrap"
                    onClick={() => handleSort(key as SortKey)}
                  >
                    <span className="capitalize">{key}</span>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 border border-gray-300">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border border-gray-300">{user.name}</td>
                  <td className="px-4 py-2 border border-gray-300">{user.username}</td>
                  <td className="px-4 py-2 border border-gray-300">
                    {user.brokerBalance.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 whitespace-pre-wrap">
                    {user.strategyMultiplier.join(", ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end items-center gap-2 mt-4">
        <button
          className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 text-sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 text-sm"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserReport;
