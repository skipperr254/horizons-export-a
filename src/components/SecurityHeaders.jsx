import { Helmet } from 'react-helmet-async';

const SecurityHeaders = () => {
  return (
    <Helmet>
      <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      <meta httpEquiv="Content-Security-Policy" content="
        upgrade-insecure-requests;
        script-src 'self' 'unsafe-inline' https://vjxkmufoztgzrnwaxswo.supabase.co https://accounts.google.com https://apis.google.com;
        connect-src 'self' https://vjxkmufoztgzrnwaxswo.supabase.co https://accounts.google.com;
        frame-src 'self' https://accounts.google.com;
        img-src 'self' data: https:;
        style-src 'self' 'unsafe-inline';
        font-src 'self' data:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'self';
      " />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
    </Helmet>
  );
};

export default SecurityHeaders;