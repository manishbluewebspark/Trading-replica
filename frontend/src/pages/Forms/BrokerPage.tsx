// src/pages/AssignStrategy.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

type Strategy = {
  id: number;
  strategyName: string;   // not really used, but may come from backend
  strategyDis: string;    // not really used
  brokerName: string;
  brokerLink: string;
  tag:any
};

const apiUrl = import.meta.env.VITE_API_URL;

const BrokerPage: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategyName, setStrategyName] = useState(""); // create: brokerName
  const [strategyDis, setStrategyDis] = useState("");   // create: brokerLink

  // edit modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Strategy | null>(null);
  const [editName, setEditName] = useState("");
  const [editDis, setEditDis] = useState("");
    const [editTag, setEditTag] = useState("");

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
      tag:editTag
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
        toast.success(res?.data?.message || "Broker created");
        setStrategyName("");
        setStrategyDis("");
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
    setIsEditModalOpen(true);
    setEditTag(strategy.tag)
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
      tag:editTag
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
        toast.success("Broker updated");
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
        toast.success("Broker deleted");
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ✅ Close create modal + clear fields
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setStrategyName("");
    setStrategyDis("");
    setEditTag("")
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBroker(null);
    setEditName("");
    setEditTag("")
    setEditDis("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Broker</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          + Create Broker
        </button>
      </div>

      {/* Broker List Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Broker List</h2>

        {strategies.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No brokers found. Click &quot;Create Broker&quot; to add one.
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
                    Broker Name
                  </th>
                  <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
                    Broker Tag
                  </th>
                  {/* <th className="px-4 py-2 border text-left text-xs font-semibold uppercase tracking-wide">
                    Broker Image Link
                  </th> */}
                  <th className="px-4 py-2 border text-center text-xs font-semibold uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strategy, index) => (
                  <tr key={strategy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-sm">{index + 1}</td>

                    {/* Name cell */}
                    <td className="px-4 py-2 border text-sm">
                      {strategy.brokerName}
                    </td>
                     <td className="px-4 py-2 border text-sm">
                      {strategy.tag}
                    </td>

                    {/* Link cell */}
                    {/* <td className="px-4 py-2 border text-sm">
                      {strategy.brokerLink}
                    </td> */}

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

      {/* Create Broker Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Create Broker</h2>
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
                  Broker Name
                </label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter broker name"
                />
              </div>

               <div>
                <label className="block text-sm font-medium mb-1">
                  Broker Tag
                </label>
                <input
                  type="text"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter broker name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Broker Image Link
                </label>
                <input
                  type="text"
                  value={strategyDis}
                  onChange={(e) => setStrategyDis(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter broker image URL"
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
                  Save Broker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Broker Modal */}
      {isEditModalOpen && editingBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">Update Broker</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Modal body / form */}
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Broker Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter broker name"
                />
              </div>

               <div>
                <label className="block text-sm font-medium mb-1">
                  Broker Tag
                </label>
                <input
                  type="text"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter broker name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Broker Image Link
                </label>
                <input
                  type="text"
                  value={editDis}
                  onChange={(e) => setEditDis(e.target.value)}
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Enter broker image URL"
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
                  type="button"
                  onClick={handleUpdate}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                >
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
