// import  { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { DatePicker, Button } from "antd";
// import dayjs, { Dayjs } from "dayjs";
// import "antd/dist/reset.css";
// import { toast } from "react-toastify";
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef } from "ag-grid-community";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";

// type UserPnl = {
//   userId: number;
//   firstname: string;
//   lastname: string;
//   date: string;
//   totalPnl: number;
// };

// const { RangePicker } = DatePicker;

// export default function UserPnlAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const [userPnls, setUserPnls] = useState<UserPnl[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Date range state
//   const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
//     dayjs().startOf("day"),
//     dayjs().endOf("day"),
//   ]);
//   const [pickerOpen, setPickerOpen] = useState(false);
//   const [panelRange, setPanelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
//     dayjs().startOf("day"),
//     dayjs().endOf("day"),
//   ]);

//   // PnL cell renderer
//   const pnlCellRenderer = (params: any) => {
//     const pnl = params.value;
//     const numericPnl = Number(pnl);
//     const isPositive = numericPnl > 0;
//     const isNegative = numericPnl < 0;

//     const colorClass = isPositive
//       ? "text-green-700"
//       : isNegative
//       ? "text-red-700"
//       : "text-gray-800";
//     const bgClass = isPositive
//       ? "bg-green-100"
//       : isNegative
//       ? "bg-red-100"
//       : "bg-gray-200";

//     return (
//       <span className={`px-2.5 py-1 rounded-full font-medium ${colorClass} ${bgClass}`}>
//         {numericPnl > 0 ? `+${numericPnl.toFixed(2)}` : numericPnl.toFixed(2)}
//       </span>
//     );
//   };

//   // AG Grid column definitions
//   const columnDefs = useMemo(
//     () => [
//       {
//         headerName: "User ID",
//         field: "userId",
//         filter: true,
//         sortable: true,
//         width: 150,
//         minWidth: 120,
//         cellStyle: { borderRight: '1px solid #e2e8f0' }
//       },
//       {
//         headerName: "First Name",
//         field: "firstname",
//         filter: true,
//         sortable: true,
//         width: 200,
//         minWidth: 180,
//         cellStyle: { borderRight: '1px solid #e2e8f0' }
//       },
//       {
//         headerName: "Last Name",
//         field: "lastname",
//         filter: true,
//         sortable: true,
//         width: 200,
//         minWidth: 180,
//         cellStyle: { borderRight: '1px solid #e2e8f0' }
//       },
//       {
//         headerName: "Date",
//         field: "date",
//         filter: true,
//         sortable: true,
//         width: 200,
//         minWidth: 180,
//         cellStyle: { borderRight: '1px solid #e2e8f0' }
//       },
//       {
//         headerName: "Total PnL",
//         field: "totalPnl",
//         cellRenderer: pnlCellRenderer,
//         filter: true,
//         sortable: true,
//         width: 200,
//         minWidth: 180,
//         cellStyle: { borderRight: '1px solid #e2e8f0' }
//       },
//     ] as ColDef<UserPnl>[],
//     []
//   );

//   // Default column definition
//   const defaultColDef = useMemo(() => ({
//     resizable: true,
//     filter: true,
//     sortable: true,
//     flex: 1,
//     minWidth: 100,
//   }), []);

//   // Fetch user PnL data
//   const fetchUserPnls = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data } = await axios.post(
//         `${apiUrl}/admin/getusers/pnldata`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (data?.status === true) {
//         setUserPnls(Array.isArray(data.data) ? data.data : []);
//       } else if (data?.status === false && data?.message === "Unauthorized") {
//         toast.error("Unauthorized User");
//         localStorage.clear();
//       } else {
//         // Don't show a toast for empty data, just set empty array
//         setUserPnls([]);
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Date filter
//   const handleGetDates = async (
//     rangeParam?: [Dayjs, Dayjs] | null
//   ): Promise<void> => {
//     const activeRange = rangeParam ?? dateRange;

//     if (!activeRange) {
//       toast.error("Please select a date range");
//       return;
//     }

//     const [from, to] = activeRange;
//     const payload = [from.toISOString(), to.toISOString()];

//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/getusers/pnldata`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res.data?.status === true) {
//         setUserPnls(Array.isArray(res.data.data) ? res.data.data : []);
//         toast.success(res.data?.message || "Filtered PnL data loaded");
//       } else if (
//         res.data?.status === false &&
//         res.data?.message === "Unauthorized"
//       ) {
//         localStorage.clear();
//         toast.error("Session expired. Please log in again.");
//       } else {
//         // Don't show a toast for empty data, just set empty array
//         setUserPnls([]);
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Cancel date filter
//   const handleCancelDate = async (): Promise<void> => {
//     setDateRange(null);
//     setPanelRange(null);
//     setPickerOpen(false);
//     await fetchUserPnls();
//   };

//   // Excel download
//   const handleExcelDownload = () => {
//     const ws = XLSX.utils.json_to_sheet(userPnls);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "User PnL");
//     XLSX.writeFile(wb, "user_pnl.xlsx");
//   };

//   // Row style
//   const getRowStyle = () => {
//     return {
//       height: '70px',
//       display: 'flex',
//       alignItems: 'center',
//       borderBottom: '1px solid #e2e8f0'
//     };
//   };

//   // Fetch data on component mount
//   useEffect(() => {
//     fetchUserPnls();
//   }, []);

//   return (
//     <div className="p-4 font-sans">
//       <h2 className="mb-3 text-xl font-semibold">User PnL Report</h2>

//       {/* Date picker and buttons */}
//       <div className="flex justify-between items-center gap-6 mb-3">
//         <RangePicker
//           format="DD-MMMM-YYYY"
//           className="h-11 w-140 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           open={pickerOpen}
//           onOpenChange={(open) => {
//             if (open) {
//               setPickerOpen(true);
//               setPanelRange(dateRange);
//             }
//           }}
//           value={panelRange ?? dateRange ?? null}
//           onCalendarChange={(val) =>
//             setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//           }
//           onChange={(val) =>
//             setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//           }
//           allowClear={false}
//           ranges={{
//             Today: [dayjs().startOf("day"), dayjs().endOf("day")],
//             Yesterday: [
//               dayjs().subtract(1, "day").startOf("day"),
//               dayjs().subtract(1, "day").endOf("day"),
//             ],
//             "Last 7 Days": [
//               dayjs().subtract(6, "day").startOf("day"),
//               dayjs().endOf("day"),
//             ],
//             "Last 30 Days": [
//               dayjs().subtract(29, "day").startOf("day"),
//               dayjs().endOf("day"),
//             ],
//             "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
//             "Last Month": [
//               dayjs().subtract(1, "month").startOf("month"),
//               dayjs().subtract(1, "month").endOf("month"),
//             ],
//           }}
//           renderExtraFooter={() => (
//             <div className="flex justify-end gap-2 p-2">
//               <Button
//                 size="small"
//                 onClick={() => {
//                   setPanelRange(dateRange);
//                   setPickerOpen(false);
//                   handleCancelDate();
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 size="small"
//                 type="primary"
//                 disabled={!panelRange || !panelRange[0] || !panelRange[1]}
//                 onClick={() => {
//                   if (!panelRange) return;
//                   setDateRange(panelRange);
//                   setPickerOpen(false);
//                   handleGetDates(panelRange);
//                 }}
//               >
//                 Apply
//               </Button>
//             </div>
//           )}
//         />

//         <div className="flex flex-wrap items-center gap-3">
//           <button
//             onClick={handleExcelDownload}
//             className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
//           >
//             <span className="text-white">Excel Download</span>
//           </button>
//         </div>
//       </div>

//       {/* Loading State */}
//       {loading && (
//         <div className="flex justify-center items-center h-32 bg-white rounded-lg border">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
//             <p className="text-gray-600">Loading PnL data...</p>
//           </div>
//         </div>
//       )}

//       {/* Error State */}
//       {error && !loading && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
//           <div className="text-red-500 text-lg font-medium mb-2">Error</div>
//           <p className="text-red-700">{error}</p>
//           <Button
//             onClick={fetchUserPnls}
//             className="mt-3 bg-red-500 text-white hover:bg-red-600"
//           >
//             Try Again
//           </Button>
//         </div>
//       )}

//       {/* AG Grid Table */}
//       {!loading && (
//         <div className="ag-theme-alpine custom-ag-grid" style={{ height: '600px', width: '100%' }}>
//           <AgGridReact
//             rowData={userPnls}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             pagination={true}
//             paginationPageSize={20}
//             suppressCellFocus={true}
//             animateRows={true}
//             rowSelection="single"
//             enableCellTextSelection={true}
//             ensureDomOrder={true}
//             getRowStyle={getRowStyle}
//             rowHeight={40}
//             headerHeight={40}
//             rowClass="ag-row-custom"
//             suppressRowHoverHighlight={false}
//             enableBrowserTooltips={true}
//             enableRangeSelection={true}
//             enableRangeHandle={true}
//             enableCharts={true}
//             enableFillHandle={true}
//             overlayLoadingTemplate={
//               '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading PnL data...</span></div>'
//             }
//             overlayNoRowsTemplate={
//               '<div class="flex flex-col items-center justify-center h-full text-gray-500"><svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No PnL data found for the selected date range</div>'
//             }
//           />
//         </div>
//       )}
//     </div>
//   );
// }




import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DatePicker, Button, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

type UserPnl = {
  userId: number;
  firstname: string;
  lastname: string;
  date: string;
  totalPnl: number;
};

const { RangePicker } = DatePicker;

export default function UserPnlAdmin() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [userPnls, setUserPnls] = useState<UserPnl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Default Today Range (UI)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [panelRange, setPanelRange] = useState<[Dayjs, Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);

  // ✅ Selected User (unique by userId)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // ---------------- PnL cell renderer ----------------
  const pnlCellRenderer = (params: any) => {
    const pnl = params.value;
    const n = Number(pnl);
    const isPositive = n > 0;
    const isNegative = n < 0;

    const colorClass = isPositive
      ? "text-green-700"
      : isNegative
      ? "text-red-700"
      : "text-gray-800";
    const bgClass = isPositive
      ? "bg-green-100"
      : isNegative
      ? "bg-red-100"
      : "bg-gray-200";

    return (
      <span className={`px-2.5 py-1 rounded-full font-medium ${colorClass} ${bgClass}`}>
        {Number.isFinite(n) ? (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2)) : "0.00"}
      </span>
    );
  };

  // ---------------- Grid columns ----------------
  const columnDefs = useMemo<ColDef<UserPnl>[]>(
    () => [
      { headerName: "User ID", field: "userId", width: 140, minWidth: 120 },
      { headerName: "First Name", field: "firstname", width: 200, minWidth: 160 },
      { headerName: "Last Name", field: "lastname", width: 200, minWidth: 160 },
      { headerName: "Date", field: "date", width: 220, minWidth: 180 },
      {
        headerName: "Total PnL",
        field: "totalPnl",
        width: 200,
        minWidth: 160,
        cellRenderer: pnlCellRenderer,
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      filter: true,
      sortable: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  // ---------------- Fetch (default today from API) ----------------
  const fetchUserPnls = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(
        `${apiUrl}/admin/getusers/pnldata`,
        {}, // ✅ your API already returns today by default
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (data?.status === true) {
        const rows = Array.isArray(data.data) ? data.data : [];
        setUserPnls(rows);
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      } else {
        setUserPnls([]);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Date filter Apply ----------------
  const handleGetDates = async (rangeParam?: [Dayjs, Dayjs] | null) => {
    const activeRange = rangeParam ?? dateRange;

    if (!activeRange || !activeRange[0] || !activeRange[1]) {
      toast.error("Please select a date range");
      return;
    }

    const [from, to] = activeRange;
    const payload = [from.toISOString(), to.toISOString()];

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${apiUrl}/admin/getusers/pnldata`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (res.data?.status === true) {
        const rows = Array.isArray(res.data.data) ? res.data.data : [];
        setUserPnls(rows);

        // ✅ if selected user not present in new range, reset it
        const exists = selectedUserId != null && rows.some((r: UserPnl) => r.userId === selectedUserId);
        if (!exists) setSelectedUserId(null);
      } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
        localStorage.clear();
        toast.error("Session expired. Please log in again.");
      } else {
        setUserPnls([]);
        setSelectedUserId(null);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Cancel filter (back to default today) ----------------
  const handleCancelDate = async () => {
    setDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    setPanelRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    setPickerOpen(false);
    setSelectedUserId(null);
    await fetchUserPnls();
  };

  // ---------------- Excel ----------------
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(userPnls);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User PnL");
    XLSX.writeFile(wb, "user_pnl.xlsx");
  };

  // ✅ Unique users list (NO duplicates by userId)
  const userOptions = useMemo(() => {
    const map = new Map<number, { userId: number; firstname: string; lastname: string }>();
    for (const r of userPnls) {
      if (!map.has(r.userId)) {
        map.set(r.userId, {
          userId: r.userId,
          firstname: r.firstname || "",
          lastname: r.lastname || "",
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`))
      .map((u) => ({
        value: u.userId,
        label: `${u.firstname} ${u.lastname}`.trim() || `User ${u.userId}`,
      }));
  }, [userPnls]);

  // ✅ Filter rows by selected user
  const filteredRows = useMemo(() => {
    if (!selectedUserId) return userPnls;
    return userPnls.filter((r) => r.userId === selectedUserId);
  }, [userPnls, selectedUserId]);

  // ✅ SUM: selected user total pnl (in selected date range)
  const selectedUserTotalPnl = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + Number(r.totalPnl || 0), 0);
  }, [filteredRows]);

  // ✅ SUM: all users total pnl (in selected date range)
  const allUsersTotalPnl = useMemo(() => {
    return userPnls.reduce((sum, r) => sum + Number(r.totalPnl || 0), 0);
  }, [userPnls]);

  // Load default today
  useEffect(() => {
    fetchUserPnls();
  }, []);

  return (
    <div className="p-4 font-sans">
      <h2 className="mb-3 text-xl font-semibold">User PnL Report</h2>

      {/* Top Row: Date + User Select + Totals + Excel */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          <RangePicker
            format="DD-MMMM-YYYY"
            className="h-11 border border-gray-300 rounded px-4 py-2"
            open={pickerOpen}
            onOpenChange={(open) => {
              if (open) {
                setPickerOpen(true);
                setPanelRange(dateRange);
              }
            }}
            value={panelRange ?? dateRange ?? null}
            onCalendarChange={(val) => setPanelRange(val as [Dayjs, Dayjs] | null)}
            onChange={(val) => setPanelRange(val as [Dayjs, Dayjs] | null)}
            allowClear={false}
            ranges={{
              Today: [dayjs().startOf("day"), dayjs().endOf("day")],
              Yesterday: [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")],
              "Last 7 Days": [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
              "Last 30 Days": [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
              "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
              "Last Month": [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
            }}
            renderExtraFooter={() => (
              <div className="flex justify-end gap-2 p-2">
                <Button size="small" onClick={handleCancelDate}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="primary"
                  disabled={!panelRange || !panelRange[0] || !panelRange[1]}
                  onClick={() => {
                    if (!panelRange) return;
                    setDateRange(panelRange);
                    setPickerOpen(false);
                    handleGetDates(panelRange);
                  }}
                >
                  Apply
                </Button>
              </div>
            )}
          />

          {/* ✅ User dropdown (unique users) */}
          <Select
            allowClear
            showSearch
            placeholder="Select user (First + Last)"
            value={selectedUserId ?? undefined}
            onChange={(val) => setSelectedUserId(val ?? null)}
            options={userOptions}
            style={{ width: 320, height: 44 }}
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />

          {/* ✅ Totals */}
          <div className="flex flex-col justify-center">
            <div className="text-sm text-gray-600">
              All Users Total: <b>{allUsersTotalPnl.toFixed(2)}</b>
            </div>
            <div className="text-sm text-gray-600">
              Selected User Total: <b>{selectedUserTotalPnl.toFixed(2)}</b>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExcelDownload}
            className="px-5 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
          >
            Excel Download
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-32 bg-white rounded-lg border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">Loading PnL data...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error</div>
          <p className="text-red-700">{error}</p>
          <Button onClick={fetchUserPnls} className="mt-3 bg-red-500 text-white hover:bg-red-600">
            Try Again
          </Button>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="ag-theme-alpine custom-ag-grid" style={{ height: "600px", width: "100%" }}>
          <AgGridReact<UserPnl>
            rowData={filteredRows}   // ✅ shows selected user rows if selected
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={20}
            suppressCellFocus={true}
            animateRows={true}
            rowSelection="single"
            enableCellTextSelection={true}
            ensureDomOrder={true}
            rowHeight={40}
            headerHeight={40}
            overlayNoRowsTemplate={
              '<div class="flex flex-col items-center justify-center h-full text-gray-500">No PnL data found</div>'
            }
          />
        </div>
      )}
    </div>
  );
}
