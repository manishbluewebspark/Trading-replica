import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

type Order = {
  variety: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: number;
  triggerprice: number;
  quantity: string;
  disclosedquantity: string;
  squareoff: number;
  stoploss: number;
  trailingstoploss: number;
  tradingsymbol: string;
  transactiontype: string;
  exchange: string;
  symboltoken: string;
  ordertag: string;
  instrumenttype: string;
  strikeprice: number;
  optiontype: string;
  expirydate: string;
  lotsize: string;
  cancelsize: string;
  averageprice: number;
  filledshares: string;
  unfilledshares: string;
  orderid: string;
  text: string;
  status: string;
  orderstatus: string;
  updatetime: string;
  exchtime: string;
  exchorderupdatetime: string;
  fillid: string;
  filltime: string;
  fillprice: string;
  fillsize: string;
  parentorderid: string;
  uniqueorderid: string;
  exchangeorderid: string;
  createdAt: string;
  tradedValue: any;
  buyprice: any;
  pnl: any;
  updatedAt: any;
userNameId:any;
  // 👇 extra fields you’re using in columnDefs
  buyTime?: string;
  sellTime?: string;

};

const { RangePicker } = DatePicker;

export default function RejectedHistory () {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalTradedData, setTotalTradedData] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [panelRange, setPanelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);


  const [gridApi, setGridApi] = useState<any>(null);

  console.log(gridApi);
  

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`${apiUrl}/order/get/tablerejects/order`, 
        {},
        {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data?.status === true) {
        setOrders(Array.isArray(data.data) ? data.data : []);
        setTotalTradedData(data.buydata || 0);
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleGetDates = async (rangeParam?: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    const activeRange = rangeParam ?? dateRange;

    if (!activeRange) {
      toast.error("Please select a date range");
      return;
    }

    const [from, to] = activeRange;
    const payload = [from.toISOString(), to.toISOString()];

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${apiUrl}/order/get/tablerejects/order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        }
      );

      if (res.data?.status === true) {
        setOrders(Array.isArray(res.data.data) ? res.data.data : []);
        setTotalTradedData(res?.data?.buydata || 0);
        toast.success(res.data?.message || "Filtered orders loaded");
      } else if (
        res.data?.status === false &&
        res.data?.message === "Unauthorized"
      ) {
        localStorage.clear();
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(res.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };



  const convertHeaders = (data: any, mapping: any) => {
    return data.map((item: any) => {
      const newItem: any = {};

      Object.keys(mapping).forEach(oldKey => {
        let value = item[oldKey];
        newItem[mapping[oldKey]] = value ?? "";
      });

      return newItem;
    });
  };

  const handleExcelDownload = () => {
    const headerMapping = {
      userNameId: "UserId",
      transactiontype: "SignalType",
      exchange: "Exchange",
      instrumenttype: "Instrument",
      orderid: "OrderID",
      tradingsymbol: "Symbol",
      ordertype: "OrderType",
      producttype: "ProductType",
      buyprice: "Buy Price",
      fillprice: "Sell Price",
      pnl: "PnL",
      quantity: "OrderQty",
      fillsize: "TradedQty",
      status: "Status",
      text: "Message",
      buyTime: "Buy Time",
      filltime: "Sell Time",
    };

    // ⭐ Add static value for "transactiontype"
  const updatedOrders = orders.map(o => ({
    ...o,
    transactiontype: "BUY",  // <-- put your value here
  }));

    const formattedOrders = convertHeaders(updatedOrders, headerMapping);
    const ws = XLSX.utils.json_to_sheet(formattedOrders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "orders.xlsx");
  };

  const handleCancelDate = async function () {
    setDateRange(null);
    setPanelRange(null);
    setPickerOpen(false);
    fetchOrders();
  };

  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
  }, []);

  const statusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
    if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
    if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
    return "#64748b";
  };

  const transactionTypeCellRenderer = (params: any) => {
    const value = params.value || "-";
    const isBuy = value === "BUY";
    const isSell = value === "SELL";

    const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
    const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-700";

    return (
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}
      >
        {value}
      </span>
    );
  };



  
  const statusCellRenderer = (params: any) => {
    const status = params.value || "-";
    const backgroundColor = statusColor(status);

    return (
      <span
        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize whitespace-nowrap"
        style={{ backgroundColor }}
        title={status}
      >
        {status}
      </span>
    );
  };

  const textCellRenderer = (params: any) => {
    const text = params.value || "—";
    return (
      <span
        title={text}
        className="inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-[360px]"
      >
        {text}
      </span>
    );
  };

// const pnlCellRenderer = (params: any) => {
//   const pnl = params.value;
//   const numericPnl = Number(pnl);
//   const isPositive = numericPnl > 0;
//   const isNegative = numericPnl < 0;

//   // Text color logic
//   const colorClass = isPositive
//     ? "text-green-700"
//     : isNegative
//     ? "text-red-700"
//     : "text-gray-800";

//   // Background color logic
//   const bgClass = isPositive
//     ? "bg-green-100"
//     : isNegative
//     ? "bg-red-100"
//     : "bg-gray-200";

//   return (
//     <span
//       className={`px-2.5 py-1 rounded-full font-medium ${colorClass} ${bgClass}`}
//     >
//       {numericPnl > 0 ? `+${numericPnl.toFixed(2)}` : numericPnl.toFixed(2)}
//     </span>
//   );
// };


  const quantityCellRenderer = (params: any) => {
    const order = params.data;
    const title = `Filled: ${order.filledshares} / Unfilled: ${order.unfilledshares}`;

    return (
      <span title={title}>
        {params.value}
      </span>
    );
  };

  // Fixed column definitions with proper TypeScript typing
  const columnDefs: ColDef<Order>[] = useMemo(() => [
    {
      headerName: "User Id",
      field: "userNameId",
      filter: true,
      sortable: true,
       width: 170,
      minWidth: 180,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Symbol",
      field: "tradingsymbol",
      filter: true,
      sortable: true,
       width: 170,
      minWidth: 180,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Instrument",
      field: "instrumenttype",
      filter: true,
      sortable: true,
      width: 120,
      minWidth: 120,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Type",
      field: "transactiontype",
      filter: true,
      sortable: true,
      cellRenderer: transactionTypeCellRenderer,
       width: 100,
      minWidth: 100,
      valueGetter: () => "BUY",     // ⭐ always same output
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Order Type",
      field: "ordertype",
      filter: true,
      sortable: true,
        width: 120,
       minWidth: 120,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Product Type",
      field: "producttype",
      filter: true,
      sortable: true,
      width: 140,
      minWidth: 150,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    
    {
      headerName: "Traded Qty",
      field: "quantity",
      filter: true,
      sortable: true,
      cellRenderer: quantityCellRenderer,
       width: 150,
        minWidth: 150,
          cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Order ID",
      field: "orderid",
      filter: true,
      sortable: true,
        width: 200,
      minWidth: 180,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      sortable: true,
      cellRenderer: statusCellRenderer,
        width: 120,
      minWidth: 120,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Message",
      field: "text",
      filter: true,
      sortable: true,
      cellRenderer: textCellRenderer,
      width: 570,
      minWidth: 450,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },

     {
      headerName: "Created Time",
      field: "filltime",
      filter: true,
      sortable: true,
        width: 280,
      minWidth: 260,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },

  ], []);

  const getRowStyle = () => {
    return {
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #e2e8f0'
    };
  };

  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
    sortable: true,
    flex: 1,
    minWidth: 100,
  }), []);

  return (
    <div className="p-4 font-sans">
      <h2 className="mb-3 text-xl font-semibold">Rejected Orders History</h2>

      {/* Date filter + Excel + Total Traded */}
      <div className="flex justify-between items-center gap-6 mb-3">
        <RangePicker
          format="DD-MMMM-YYYY"
          className="h-11 w-140 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          open={pickerOpen}
          onOpenChange={(open) => {
            if (open) {
              setPickerOpen(true);
              setPanelRange(dateRange);
            }
          }}
          value={panelRange ?? dateRange ?? null}
          onCalendarChange={(val) =>
            setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
          }
          onChange={(val) =>
            setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
          }
          allowClear={false}
          ranges={{
            Today: [dayjs().startOf("day"), dayjs().endOf("day")],
            Yesterday: [
              dayjs().subtract(1, "day").startOf("day"),
              dayjs().subtract(1, "day").endOf("day"),
            ],
            "Last 7 Days": [
              dayjs().subtract(6, "day").startOf("day"),
              dayjs().endOf("day"),
            ],
            "Last 30 Days": [
              dayjs().subtract(29, "day").startOf("day"),
              dayjs().endOf("day"),
            ],
            "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
            "Last Month": [
              dayjs().subtract(1, "month").startOf("month"),
              dayjs().subtract(1, "month").endOf("month"),
            ],
          }}
          renderExtraFooter={() => (
            <div className="flex justify-end gap-3 p-2">
              <button
                className="px-5 py-0.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => {
                  setPanelRange(dateRange);
                  setPickerOpen(false);
                  handleCancelDate();
                }}
              >
                Cancel
              </button>

              <button
                className="px-5 py-0.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={!panelRange || !panelRange[0] || !panelRange[1]}
                onClick={() => {
                  if (!panelRange) return;
                  setDateRange(panelRange);
                  setPickerOpen(false);
                  handleGetDates(panelRange);
                }}
              >
                <span className="text-white">Apply</span>
              </button>
            </div>
          )}
        />

        <div className="flex items-center gap-4">
          <div className="px-4 py-3.5 bg-indigo-50 text-indigo-800 rounded-lg font-semibold text-sm border border-indigo-200 whitespace-nowrap">
            Total Traded: {totalTradedData}
          </div>
          <button
            onClick={handleExcelDownload}
            className="bg-blue-500 text-white px-4 py-3.5 rounded hover:bg-blue-600"
          >
            <span className="text-white">Excel Download</span>
          </button>
        </div>
      </div>

    
      {/* AG Grid Table */}
      <div className="ag-theme-alpine custom-ag-grid" style={{ height: 600, width: '100%' }}>
        <AgGridReact<Order>
          columnDefs={columnDefs}
          rowData={orders}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          getRowStyle={getRowStyle}
          loading={loading}
          rowHeight={50}
          headerHeight={50}
          overlayLoadingTemplate={
            '<span class="ag-overlay-loading-center">Loading orders...</span>'
          }
          overlayNoRowsTemplate={
            error
              ? `<div class="ag-overlay-no-rows-center text-red-500">${error}</div>`
              : '<div class="ag-overlay-no-rows-center">No orders found.</div>'
          }
          pagination={true}
          paginationPageSize={20}
          suppressRowClickSelection={true}
          rowSelection="multiple"
          animateRows={true}
        />
      </div>
    </div>
  );
}