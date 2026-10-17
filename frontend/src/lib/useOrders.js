import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { useStore } from "../store.jsx";

// Orders visible to the signed-in user (buyer: own orders, producer: received, admin: all).
export function useOrders() {
  const { user, toast } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!user) { setOrders([]); setLoading(false); return []; }
    try {
      const data = await api("/orders");
      setOrders(data.orders || []);
      return data.orders || [];
    } catch (error) {
      toast(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  useEffect(() => { reload(); }, [reload]);
  return { orders, loading, reload };
}
