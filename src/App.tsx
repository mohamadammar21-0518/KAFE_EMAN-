import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { AboutPage } from "@/pages/AboutPage";
import { MenuPage } from "@/pages/MenuPage";
import { ReservationPage } from "@/pages/ReservationPage";
import { ContactPage } from "@/pages/ContactPage";
import { TermsPage } from "@/pages/TermsPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { AccountPage } from "@/pages/AccountPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
const AdminRoutes = lazy(() => import("@/admin/AdminRoutes"));

export default function App() {
  return (
    <Routes>
      <Route path="admin/*" element={
        <Suspense fallback={<p role="status" className="p-6">Loading admin workspace…</p>}>
          <AdminRoutes />
        </Suspense>
      } />

      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="sign-in" element={<LoginPage />} />
        <Route path="reservation" element={<ReservationPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
