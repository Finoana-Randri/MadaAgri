import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { useStore } from "../store.jsx";

const EMPTY = { users: [], products: [], claims: [], metrics: {}, settings: {} };

export function useAdmin() {
  const { user, toast } = useStore();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (user?.role !== "admin") return;
    try { setData({ ...EMPTY, ...(await api("/admin")) }); } catch (error) { toast(error.message); }
    setLoading(false);
  }, [user, toast]);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
}
