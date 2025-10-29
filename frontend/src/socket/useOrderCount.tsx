import { useEffect, useState } from "react";

import { getSocket } from "./Socket";



export function useOrderCount() {
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
   

    // 2) Live updates
    const socket = getSocket();
    const onCount = (payload: { total: number }) => setTotal(payload.total);

    socket.on("orders:count", onCount);

    return () => {
      socket.off("orders:count", onCount);
      // do NOT close socket here if multiple components reuse it
    };
  }, []);

  return total;
}
