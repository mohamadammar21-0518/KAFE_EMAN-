import { Routes, Route } from "react-router-dom";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminLayout } from "@/admin/AdminLayout";
import { AdminDashboardPage } from "@/admin/pages/AdminDashboardPage";
import { AdminBranchesPage } from "@/admin/pages/AdminBranchesPage";
import { AdminMenuPage } from "@/admin/pages/AdminMenuPage";
import { AdminReservationsPage } from "@/admin/pages/AdminReservationsPage";
import { AdminUsersPage } from "@/admin/pages/AdminUsersPage";
import { AdminStaffPage } from "@/admin/pages/AdminStaffPage";
import { AdminAccountPage } from "@/admin/pages/AdminAccountPage";
import { AdminMessagesPage } from "@/admin/pages/AdminMessagesPage";
import { AdminOrdersProcessingPage } from "@/admin/pages/orders/AdminOrdersProcessingPage";
import { AdminOrdersTrackPage } from "@/admin/pages/orders/AdminOrdersTrackPage";
import { AdminOrdersHistoryPage } from "@/admin/pages/orders/AdminOrdersHistoryPage";
import { AdminFinancePage } from "@/admin/pages/AdminFinancePage";
import { AdminFaqsPage } from "@/admin/pages/AdminFaqsPage";
import { AdminContentPage } from "@/admin/pages/AdminContentPage";
import { AdminTestimonialsPage } from "@/admin/pages/AdminTestimonialsPage";
import { AdminLoginPage } from "@/admin/pages/AdminLoginPage";
import { AdminAiPage } from "@/admin/pages/AdminAiPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="branches" element={<AdminBranchesPage />} />
        <Route path="menu" element={<AdminMenuPage />} />
        <Route path="orders" element={<AdminOrdersProcessingPage />} />
        <Route path="orders/track" element={<AdminOrdersTrackPage />} />
        <Route path="orders/history" element={<AdminOrdersHistoryPage />} />
        <Route path="finance" element={<AdminFinancePage />} />
        <Route path="reservations" element={<AdminReservationsPage />} />
        <Route path="clients" element={<AdminUsersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="staff" element={<AdminStaffPage />} />
        <Route path="account" element={<AdminAccountPage />} />
        <Route path="faqs" element={<AdminFaqsPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="testimonials" element={<AdminTestimonialsPage />} />
        <Route path="content" element={<AdminContentPage />} />
        <Route path="ai" element={<AdminAiPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
