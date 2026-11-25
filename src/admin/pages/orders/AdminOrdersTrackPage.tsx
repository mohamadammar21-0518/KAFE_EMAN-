import { Navigate } from "react-router-dom";

/** @deprecated Use /admin/orders?tab=processing */
export function AdminOrdersTrackPage() {
  return <Navigate to="/admin/orders?tab=processing" replace />;
}
