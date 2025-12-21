import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BrokerSettings = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${apiUrl}/admin/broker`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data?.status === true) {
        const list = Array.isArray(data.data) ? data.data : [];
        setBrokers(list);
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // Skeleton loader component
  const BrokerSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="relative flex items-center gap-4 w-full rounded-2xl border px-6 py-5 bg-white shadow-sm border-slate-200"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-200"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 px-4 py-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Supported Brokers
            </h1>
          </div>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect your trading account seamlessly with our supported brokers. 
            Trade effortlessly across{" "}
            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {brokers.length} broker{brokers.length !== 1 ? 's' : ''}
            </span>{" "}
            and manage your investments in one place.
          </p>
        </div>

        {/* Loading State */}
        {loading && <BrokerSkeleton />}

        {/* Empty State */}
        {!loading && brokers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No Brokers Available
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Currently there are no brokers configured. Please check back later or contact support.
            </p>
            <button
              onClick={fetchBrokers}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        )}

        {/* Broker Cards */}
        {!loading && brokers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brokers.map((b: any) => (
              <div
                key={b.id}
                className="group relative flex flex-col w-full rounded-2xl border-2 px-6 py-5 text-left
                           bg-white  
                           transition-all duration-300  cursor-pointer"
              >
                {/* Status Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-green-600">Active</span>
                </div>

                {/* Logo and Main Content */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-50 to-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
                    {b.brokerLink ? (
                      <img
                        src={b.brokerLink}
                        alt={b.brokerName}
                        className="w-10 h-10 object-contain transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-xl font-bold text-blue-600">
                        {b.brokerName?.charAt(0) || "B"}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-slate-800 text-lg truncate">
                      {b.brokerName}
                    </h2>
                    {b.tag && (
                      <p className="text-sm text-slate-500 mt-1 truncate">{b.tag}</p>
                    )}
                  </div>
                </div>



                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 transition-colors pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerSettings;