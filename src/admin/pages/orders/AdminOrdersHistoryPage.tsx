import { Navigate } from "react-router-dom";

/** @deprecated Use /admin/orders?tab=history */
export function AdminOrdersHistoryPage() {
  return <Navigate to="/admin/orders?tab=history" replace />;
}
