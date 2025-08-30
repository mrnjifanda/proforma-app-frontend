import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '@/utils/contexts/AuthContext';
import { PanierProvider } from '@/utils/contexts/PanierContext';
import { ToastContainer } from 'react-toastify';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'Gestion Proforma & Devis',
  description: 'Application de gestion de proforma et devis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning={true}
      className={inter.variable}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <PanierProvider>
            <div id="root" suppressHydrationWarning={true}>
              {children}
            </div>

            {/* Configuration de ToastContainer */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              className="mt-16"
              toastClassName="backdrop-blur-sm bg-white/95 border border-gray-200/50 shadow-lg"
              progressClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
            />
          </PanierProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
