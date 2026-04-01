import API from "@/lib/client";
import { CustomerSession } from "@/types";

export const customerAPI = {
  join: async (tableSessionId: string, name: string) => {
    if (!tableSessionId) throw new Error("Table session ID is missing");
    if (!name || name.trim().length === 0) throw new Error("Name is required");

    const res = await API.post("/customer/join", {
      table_session_id: tableSessionId,
      name: name.trim(),
    });

    // store customer session locally
    localStorage.setItem("customer_session_id", res.data.id);

    return res.data as CustomerSession;
  },

  get: async (customerId: string) => {
    const res = await API.get(`/customer/${customerId}`);
    return res.data as CustomerSession;
  },
};