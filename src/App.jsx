import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { AnimatePresence, motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import SecurityHeaders from '@/components/SecurityHeaders';
import ContentSecurityLayer from '@/components/ContentSecurityLayer';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from '@/components/ui/tooltip';
import TopLoader from '@/components/TopLoader';
import AppLayout from '@/components/layout/AppLayout';

const HomePage = React.lazy(() => import('@/pages/HomePage'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const StoryPage = React.lazy(() => import('@/pages/StoryPage'));
const StoryDetailPage = React.lazy(() => import('@/pages/StoryDetailPage'));
const ActivitiesPage = React.lazy(() => import('@/pages/ActivitiesPage'));
const AdminPage = React.lazy(() => import('@/pages/AdminPage'));
const SubscriptionPage = React.lazy(() => import('@/pages/SubscriptionPage'));
const SubscriptionCallbackPage = React.lazy(() => import('@/pages/SubscriptionCallbackPage'));
const IyzicoCheckoutPage = React.lazy(() => import('@/pages/IyzicoCheckoutPage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));
const PrivacyPolicyPage = React.lazy(() => import('@/pages/PrivacyPolicyPage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const QuizPage = React.lazy(() => import('@/pages/QuizPage'));
const QuizSetupPage = React.lazy(() => import('@/pages/QuizSetupPage'));
const SavedStoriesPage = React.lazy(() => import('@/pages/SavedStoriesPage'));
const HelpCenterPage = React.lazy(() => import('@/pages/HelpCenterPage'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage'));
const CareerPage = React.lazy(() => import('@/pages/CareerPage'));
const TermsOfServicePage = React.lazy(() => import('@/pages/TermsOfServicePage'));
const BlogPage = React.lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = React.lazy(() => import('@/pages/BlogPostPage'));
const CommunityPage = React.lazy(() => import('@/pages/CommunityPage'));
const CookiePolicyPage = React.lazy(() => import('@/pages/CookiePolicyPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('@/pages/ResetPasswordPage'));
const AuthCallbackPage = React.lazy(() => import('@/pages/AuthCallbackPage'));
const LessonsPage = React.lazy(() => import('@/pages/LessonsPage'));
const ReadStoriesPage = React.lazy(() => import('@/pages/ReadStoriesPage'));
const SitemapPage = React.lazy(() => import('@/pages/SitemapPage'));
const CategoryPage = React.lazy(() => import('@/pages/CategoryPage'));


const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.25,
};

const MotionWrapper = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

const AppRoutes = () => {
  const location = useLocation();

  const appRoutes = [
    { path: "/dashboard", component: DashboardPage, requiredAuth: true },
    { path: "/read/:slug", component: StoryPage, requiredAuth: true },
    { path: "/story/:slug", component: StoryDetailPage, requiredAuth: true },
    { path: "/activities", component: ActivitiesPage, requiredAuth: true },
    { path: "/quiz/setup", component: QuizSetupPage, requiredAuth: true },
    { path: "/quiz", component: QuizPage, requiredAuth: true },
    { path: "/saved-stories", component: SavedStoriesPage, requiredAuth: true },
    { path: "/read-stories", component: ReadStoriesPage, requiredAuth: true },
    { path: "/lessons", component: LessonsPage, requiredAuth: true },
    { path: "/subscription", component: SubscriptionPage, requiredAuth: true },
    { path: "/subscription/callback", component: SubscriptionCallbackPage, requiredAuth: true },
    { path: "/subscription/iyzico-checkout", component: IyzicoCheckoutPage, requiredAuth: true },
    { path: "/settings/*", component: SettingsPage, requiredAuth: true },
    { path: "/admin/*", component: AdminPage, requiredAuth: true, requiredRole: ["admin", "content_creator"] },
    { path: "/community", component: CommunityPage, requiredAuth: true },
    { path: "/category/:categoryName", component: CategoryPage, requiredAuth: true },
  ];

  const externalRoutes = [
    { path: "/", component: HomePage },
    { path: "/login", component: LoginPage },
    { path: "/register", component: LoginPage },
    { path: "/forgot-password", component: ForgotPasswordPage },
    { path: "/reset-password", component: ResetPasswordPage },
    { path: "/auth/callback", component: AuthCallbackPage },
    { path: "/about", component: AboutPage },
    { path: "/privacy-policy", component: PrivacyPolicyPage },
    { path: "/terms-of-service", component: TermsOfServicePage },
    { path: "/help-center", component: HelpCenterPage },
    { path: "/contact", component: ContactPage },
    { path: "/career", component: CareerPage },
    { path: "/blog", component: BlogPage },
    { path: "/blog/:slug", component: BlogPostPage },
    { path: "/cookie-policy", component: CookiePolicyPage },
    { path: "/sitemap.xml", component: SitemapPage },
  ];
  
  const noLayoutRoutes = ['/read', '/story', '/quiz', '/quiz/setup', '/subscription/iyzico-checkout', '/sitemap.xml'];
  const routesWithLayout = appRoutes.filter(route => !noLayoutRoutes.some(path => route.path.startsWith(path)));
  const routesWithoutLayout = appRoutes.filter(route => noLayoutRoutes.some(path => route.path.startsWith(path)));

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<TopLoader />}>
        <Routes location={location} key={location.pathname}>
            {routesWithoutLayout.map(({ path, component: Component, ...rest }) => (
               <Route key={path} path={path} element={
                <ProtectedRoute {...rest}>
                  <MotionWrapper><Component /></MotionWrapper>
                </ProtectedRoute>
              } />
            ))}

            <Route element={<AppLayout />}>
              {routesWithLayout.map(({ path, component: Component, ...rest }) => (
                <Route key={path} path={path} element={
                  <ProtectedRoute {...rest}>
                    <MotionWrapper><Component /></MotionWrapper>
                  </ProtectedRoute>
                } />
              ))}
            </Route>
          
          {externalRoutes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={path === '/sitemap.xml' ? <Component /> : <MotionWrapper><Component /></MotionWrapper>} />
          ))}
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};


function App() {
  useEffect(() => {
    if (window.location.protocol === 'http:') {
      window.location.href = 'https:' + window.location.href.substring(5);
    }
  }, []);

  return (
    <ErrorBoundary>
      {/* <HelmetProvider> */}
        <SecurityHeaders />
        <Router>
          <AuthProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <TooltipProvider>
                {/* <ContentSecurityLayer> */}
                  <div className="min-h-screen bg-background font-sans antialiased overflow-x-hidden">
                    <AppRoutes />
                    <Toaster />
                    <CookieConsentBanner />
                  </div>
                {/* </ContentSecurityLayer> */}
              </TooltipProvider>
            </ThemeProvider>
          </AuthProvider>
        </Router>
      {/* </HelmetProvider> */}
    </ErrorBoundary>
  );
}

export default App;