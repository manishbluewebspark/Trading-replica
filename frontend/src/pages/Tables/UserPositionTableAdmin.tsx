import { useEffect, useMemo, useState } from "react";
import "antd/dist/reset.css";
import { Select } from "antd";
// import { getSocket } from "../../socket/Socket";
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from "axios";

// type Tick = {
//   mode: 1 | 2 | 3;
//   exchangeType: number;
//   token: string;
//   sequenceNumber: number;
//   exchangeTimestamp: string;
//   ltpPaiseOrRaw: number;
//   ltp: number;
// };

type Position = {
  tradingsymbol: string;
  buy_quantity: string;
  sell_quantity: string;
  buy_price: string;
  sell_price: string;
  pnl: string;
  product: string;
};

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

// const statusColor = (status: string) => {
//   const s = status?.toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//   if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//   return "#64748b";
// };

// const StatusBadge = ({ status }: { status: string }) => (
//   <span
//     className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
//     style={{
//       backgroundColor: `${statusColor(status)}20`,
//       color: statusColor(status),
//       border: `1px solid ${statusColor(status)}40`
//     }}
//   >
//     <span
//       className="w-1.5 h-1.5 rounded-full mr-1.5"
//       style={{ backgroundColor: statusColor(status) }}
//     />
//     {status || "-"}
//   </span>
// );

// const TransactionBadge = ({ type }: { type: string }) => {
//   const isBuy = type === "BUY";
//   const isSell = type === "SELL";

//   const config = isBuy ? {
//     bg: "bg-emerald-50",
//     text: "text-emerald-800",
//     border: "border-emerald-200",
//     dot: "bg-emerald-500"
//   } : isSell ? {
//     bg: "bg-rose-50",
//     text: "text-rose-800",
//     border: "border-rose-200",
//     dot: "bg-rose-500"
//   } : {
//     bg: "bg-gray-100",
//     text: "text-gray-800",
//     border: "border-gray-200",
//     dot: "bg-gray-500"
//   };

//   return (
//     <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}>
//       <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
//       {type || "-"}
//     </span>
//   );
// };

export default function AdminCheckUserPosition() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 50);
  const [isMobile, setIsMobile] = useState(false);
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🔹 Fetch Users for Dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${apiUrl}/admin/tokenstatussummary`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (res?.data?.status) {
          const allUsers = res?.data?.generatedUsers||[]
          setUsers(allUsers);
        }
      } catch (err) {
        setPaginationPageSize(10)
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  // 🔹 Fetch Positions for Selected User
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        let url = `${apiUrl}/admin/userpostionshow?userId=${selectedUser?._id}`;
        let res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "AngelOneToken": localStorage.getItem("angel_token") || "",
          },
        });
        if (res.data.status === true) {
          const brokerPositions = res.data.positions[res.data.user.brokerName.toLowerCase()] || [];
          setPositions(brokerPositions);
        } else {
          setPositions([]);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch positions");
        setLoading(false);
      }
    };
    fetchPositions();
  }, [selectedUser]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return positions;
    return positions.filter((p) => {
      const haystack = [
        p.tradingsymbol,
        p.product,
        p.buy_quantity,
        p.sell_quantity,
        p.buy_price,
        p.sell_price,
        p.pnl,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [positions, debouncedSearch]);

  const columnDefs: ColDef<any>[] = useMemo(() => [
    {
      headerName: "Symbol",
      field: "tradingsymbol",
      cellRenderer: (params: any) => {
        const position = params.data as Position;
        return (
          <div className="py-2">
            <div className="font-semibold text-gray-900">
              {position.tradingsymbol}
            </div>
          </div>
        );
      },
      width: 250,
      minWidth: 230,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Product",
      field: "product",
      cellRenderer: (params: any) => {
        return <div className="py-2">{params.value}</div>;
      },
      width: 150,
      minWidth: 130,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Buy Qty",
      field: "buy_quantity",
      cellRenderer: (params: any) => {
        return <div className="py-2 text-center">{params.value}</div>;
      },
      width: 100,
      minWidth: 80,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Sell Qty",
      field: "sell_quantity",
      cellRenderer: (params: any) => {
        return <div className="py-2 text-center">{params.value}</div>;
      },
      width: 100,
      minWidth: 80,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Net Qty",
      field: "quantity",
      cellRenderer: (params: any) => {
        return <div className="py-2 text-center">{params.value}</div>;
      },
     width: 100,
      minWidth: 80,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    // {
    //   headerName: "Buy Price",
    //   field: "buy_price",
    //   cellRenderer: (params: any) => {
    //     return <div className="py-2 text-right">₹{params.value}</div>;
    //   },
    //   width: 120,
    //   minWidth: 100,
    //   cellStyle: { borderRight: '1px solid #e2e8f0' }
    // },
    // {
    //   headerName: "Sell Price",
    //   field: "sell_price",
    //   cellRenderer: (params: any) => {
    //     return <div className="py-2 text-right">₹{params.value}</div>;
    //   },
    //   width: 120,
    //   minWidth: 100,
    //   cellStyle: { borderRight: '1px solid #e2e8f0' }
    // },
    {
  headerName: "Buy Price",
  field: "buy_price",
  cellRenderer: (params: any) => {
    const value = Number(params.value || 0).toFixed(2);
    return <div className="py-2 text-right">₹{value}</div>;
  },
  width: 120,
  minWidth: 100,
  cellStyle: { borderRight: '1px solid #e2e8f0' }
},
{
  headerName: "Sell Price",
  field: "sell_price",
  cellRenderer: (params: any) => {
    const value = Number(params.value || 0).toFixed(2);
    return <div className="py-2 text-right">₹{value}</div>;
  },
  width: 120,
  minWidth: 100,
  cellStyle: { borderRight: '1px solid #e2e8f0' }
},

    {
      headerName: "PnL",
      field: "pnl",
      cellRenderer: (params: any) => {
        const pnl = Number(params.value);
        return (
          <div className="py-2 text-right" style={{ color: pnl >= 0 ? "#16a34a" : "#ef4444" }}>
            ₹{pnl.toFixed(2)}
          </div>
        );
      },
      width: 120,
      minWidth: 100,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
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

  const getRowStyle = () => {
    return {
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #e2e8f0'
    };
  };

  const MobilePositionCard = ({ position }: { position: Position }) => {
    const pnl = Number(position.pnl);
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{position.tradingsymbol}</h3>
            <p className="text-sm text-gray-600">{position.product}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-gray-500">Buy Qty</span>
            <p className="font-medium text-center">{position.buy_quantity}</p>
          </div>
          <div>
            <span className="text-gray-500">Sell Qty</span>
            <p className="font-medium text-center">{position.sell_quantity}</p>
          </div>
          <div>
            <span className="text-gray-500">Buy Price</span>
            <p className="font-medium text-right">₹{position.buy_price}</p>
          </div>
          <div>
            <span className="text-gray-500">Sell Price</span>
            <p className="font-medium text-right">₹{position.sell_price}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">PnL</span>
            <span className="font-medium" style={{ color: pnl >= 0 ? "#16a34a" : "#ef4444" }}>
              ₹{pnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Positions</h1>
          <p className="text-gray-600">Monitor your current positions and PnL</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search positions by symbol, product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                />
              </div>
            </div>

            <div className="w-full lg:w-64">
              <Select
                showSearch
                placeholder="Select a user"
                optionFilterProp="children"
                onChange={(value) => setSelectedUser(users.find((u:any) => u._id === value))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={users.map((user:any) => ({
                  value: user._id,
                  label: `${user.firstName} ${user.lastName} (${user._id})`
                }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {isMobile ? (
            <div className="p-4">
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
              {error && !loading && (
                <div className="text-center py-8 text-rose-500 bg-rose-50 rounded-lg">
                  {error}
                </div>
              )}
              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No positions found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
                </div>
              )}
              {!loading && !error && filtered.map((position) => (
                <MobilePositionCard key={position.tradingsymbol} position={position} />
              ))}
            </div>
          ) : (
            <div className="ag-theme-alpine custom-ag-grid" style={{ height: '600px', width: '100%' }}>
              <AgGridReact
                rowData={filtered}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                loading={loading}
                getRowStyle={getRowStyle}
                rowHeight={50}
                headerHeight={50}
                pagination={true}
                paginationPageSize={paginationPageSize}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressCellFocus={true}
                animateRows={true}
                enableRangeSelection={true}
                enableRangeHandle={true}
                enableCharts={true}
                enableFillHandle={true}
                rowClass="ag-row-custom"
                suppressRowHoverHighlight={false}
                enableBrowserTooltips={true}
                overlayLoadingTemplate={
                  '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-600">Loading positions...</span></div>'
                }
                overlayNoRowsTemplate={
                  '<div class="flex flex-col items-center justify-center h-full text-gray-500"><svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No positions match your search criteria</div>'
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
