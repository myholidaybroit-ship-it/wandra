import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import PublicLayout from './components/layout/PublicLayout'
import Toaster from './components/ui/Toaster'

// public
import Landing from './pages/public/Landing'
import Login from './pages/public/Login'
import LeadInquiry from './pages/public/LeadInquiry'
import ItineraryPreview from './pages/public/ItineraryPreview'
import PdfDoc from './pages/public/PdfDoc'
import VoucherDoc from './pages/public/VoucherDoc'
import BizLanding from './pages/public/BizLanding'
import LandingBuilder from './pages/admin/LandingBuilder'
import Roles from './pages/admin/Roles'
import AssignmentRules from './pages/admin/AssignmentRules'
import PublicInvoice from './pages/public/PublicInvoice'
import PublicGallery from './pages/public/PublicGallery'
import StorySubmit from './pages/public/StorySubmit'

// admin
import Dashboard from './pages/admin/Dashboard'
import ClientList from './pages/admin/clients/ClientList'
import ClientCreate from './pages/admin/clients/ClientCreate'
import ClientDetail from './pages/admin/clients/ClientDetail'
import PackageStart from './pages/admin/packages/PackageStart'
import LeadForm from './pages/admin/clients/LeadForm'
import DestinationList from './pages/admin/destinations/DestinationList'
import DestinationCreate from './pages/admin/destinations/DestinationCreate'
import DestinationDetail from './pages/admin/destinations/DestinationDetail'
import HotelList from './pages/admin/hotels/HotelList'
import HotelCreate from './pages/admin/hotels/HotelCreate'
import HotelDetail from './pages/admin/hotels/HotelDetail'
import CabList from './pages/admin/cabs/CabList'
import CabCreate from './pages/admin/cabs/CabCreate'
import CabDetail from './pages/admin/cabs/CabDetail'
import ServiceLocationList from './pages/admin/services/ServiceLocationList'
import ServiceLocationCreate from './pages/admin/services/ServiceLocationCreate'
import ActivityList from './pages/admin/activities/ActivityList'
import ActivityCreate from './pages/admin/activities/ActivityCreate'
import PackageList from './pages/admin/packages/PackageList'
import QuoteBuilder from './pages/admin/packages/QuoteBuilder'
import PackageDetail from './pages/admin/packages/PackageDetail'
import PackageShare from './pages/admin/packages/PackageShare'
import InclusionsExclusions from './pages/admin/packages/InclusionsExclusions'
import InclusionsExclusionsEdit from './pages/admin/packages/InclusionsExclusionsEdit'
import ItineraryTemplates from './pages/admin/packages/ItineraryTemplates'
import Vouchers from './pages/admin/packages/Vouchers'
import BookingList from './pages/admin/bookings/BookingList'
import BookingDetail from './pages/admin/bookings/BookingDetail'
import InvoiceList from './pages/admin/invoices/InvoiceList'
import InvoiceCreate from './pages/admin/invoices/InvoiceCreate'
import InvoiceDetail from './pages/admin/invoices/InvoiceDetail'
import InvoiceSettings from './pages/admin/invoices/InvoiceSettings'
import QuotationList from './pages/admin/quotations/QuotationList'
import Reports from './pages/admin/Reports'
import Gallery from './pages/admin/Gallery'
import Settings from './pages/admin/Settings'
import UserManagement from './pages/admin/UserManagement'
import Billing from './pages/admin/Billing'
import UpgradePro from './pages/admin/UpgradePro'
import HelpSupport from './pages/admin/HelpSupport'

export default function App() {
  return (
    <>
      <Routes>
        {/* Public marketing + client-facing */}
        {/* Standalone full-screen auth (no marketing chrome) */}
        <Route path="/login" element={<Login />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/inquiry" element={<LeadInquiry />} />
          <Route path="/i/:code" element={<ItineraryPreview />} />
          <Route path="/inv/:code" element={<PublicInvoice />} />
        </Route>

        {/* Standalone print documents — no site chrome */}
        <Route path="/pdf/:code" element={<PdfDoc />} />
        <Route path="/voucher/:id" element={<VoucherDoc />} />

        {/* Business lead-capture landing page (built in /app/landing) */}
        <Route path="/site/:slug" element={<BizLanding />} />

        {/* Agency-branded public testimonial pages — no Wandra site chrome */}
        <Route path="/stories/:agency" element={<PublicGallery />} />
        <Route path="/share-story/:token" element={<StorySubmit />} />

        {/* Admin app */}
        <Route path="/app" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/new" element={<ClientCreate />} />
          <Route path="clients/lead-form" element={<LeadForm />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="clients/:id/start" element={<PackageStart />} />
          <Route path="destinations" element={<DestinationList />} />
          <Route path="destinations/new" element={<DestinationCreate />} />
          <Route path="destinations/:id" element={<DestinationDetail />} />
          <Route path="hotels" element={<HotelList />} />
          <Route path="hotels/new" element={<HotelCreate />} />
          <Route path="hotels/:id" element={<HotelDetail />} />
          <Route path="cabs" element={<CabList />} />
          <Route path="cabs/new" element={<CabCreate />} />
          <Route path="cabs/:id" element={<CabDetail />} />
          <Route path="landing" element={<LandingBuilder />} />
          <Route path="roles" element={<Roles />} />
          <Route path="assignment" element={<AssignmentRules />} />
          <Route path="services" element={<ServiceLocationList />} />
          <Route path="services/new" element={<ServiceLocationCreate />} />
          <Route path="activities" element={<ActivityList />} />
          <Route path="activities/new" element={<ActivityCreate />} />
          <Route path="packages" element={<PackageList />} />
          <Route path="packages/new" element={<QuoteBuilder />} />
          <Route path="packages/:id/edit" element={<QuoteBuilder />} />
          <Route path="packages/:id" element={<PackageDetail />} />
          <Route path="packages/:id/share" element={<PackageShare />} />
          <Route path="packages/:id/vouchers" element={<Vouchers />} />
          <Route path="packages/inclusions" element={<InclusionsExclusions />} />
          <Route path="packages/inclusions/:dest" element={<InclusionsExclusionsEdit />} />
          <Route path="packages/templates" element={<ItineraryTemplates />} />
          <Route path="bookings" element={<BookingList />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/new" element={<InvoiceCreate />} />
          <Route path="invoices/settings" element={<InvoiceSettings />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="quotations" element={<QuotationList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="billing" element={<Billing />} />
          <Route path="upgrade" element={<UpgradePro />} />
          <Route path="support" element={<HelpSupport />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
