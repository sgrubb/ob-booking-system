import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import log from "@/lib/logger";
import AppLayout from "@/components/AppLayout";
import BookingsPage from "@/pages/BookingsPage";
import BookingFormPage from "@/pages/BookingFormPage";
import BookingDetailPage from "@/pages/BookingDetailPage";
import CalendarPage from "@/pages/CalendarPage";
import MembersPage from "@/pages/MembersPage";
import MemberFormPage from "@/pages/MemberFormPage";
import MemberDetailPage from "@/pages/MemberDetailPage";
import ContactsPage from "@/pages/ContactsPage";
import ContactFormPage from "@/pages/ContactFormPage";
import ContactDetailPage from "@/pages/ContactDetailPage";
import StatisticsPage from "@/pages/StatisticsPage";
import ArchivePage from "@/pages/ArchivePage";
import SettingsPage from "@/pages/SettingsPage";
import SetupPage from "@/pages/SetupPage";
import MigrationPage from "@/pages/MigrationPage";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      log.error(`Query failed [${JSON.stringify(query.queryKey)}]:`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      log.error("Mutation failed:", error);
    },
  }),
  defaultOptions: {
    queries: { retry: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/migration" element={<MigrationPage />} />
          <Route element={<AppLayout />}>
            <Route path="/bookings">
              <Route index element={<BookingsPage />} />
              <Route path="new" element={<BookingFormPage />} />
              <Route path=":id/edit" element={<BookingFormPage />} />
              <Route path=":id" element={<BookingDetailPage />} />
            </Route>
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/members">
              <Route index element={<MembersPage />} />
              <Route path="new" element={<MemberFormPage />} />
              <Route path=":id/edit" element={<MemberFormPage />} />
              <Route path=":id" element={<MemberDetailPage />} />
            </Route>
            <Route path="/contacts">
              <Route index element={<ContactsPage />} />
              <Route path="new" element={<ContactFormPage />} />
              <Route path=":id/edit" element={<ContactFormPage />} />
              <Route path=":id" element={<ContactDetailPage />} />
            </Route>
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/bookings" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}
