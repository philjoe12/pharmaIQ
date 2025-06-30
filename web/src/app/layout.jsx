import { Mulish } from 'next/font/google';
import './globals.css';
import { UserTypeProvider } from '../lib/context/UserTypeContext';
import MobileNav from '../components/ui/MobileNav';
import WebVitals from '../components/analytics/WebVitals';
const mulish = Mulish({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-mulish'
});
export const metadata = {
    title: {
        default: 'PharmaIQ - AI-Enhanced Drug Information Platform',
        template: '%s | PharmaIQ'
    },
    description: 'Your trusted source for comprehensive FDA drug information powered by AI. Search thousands of prescription medications with detailed indications, dosages, warnings, and professional insights.',
    keywords: ['drug information', 'prescription medications', 'FDA approved drugs', 'medical information', 'pharmaceutical data'],
    authors: [{ name: 'PharmaIQ Team' }],
    creator: 'PharmaIQ',
    publisher: 'PharmaIQ',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://pharmaiq.com'),
    openGraph: {
        title: 'PharmaIQ - AI-Enhanced Drug Information Platform',
        description: 'Your trusted source for comprehensive FDA drug information powered by AI',
        url: 'https://pharmaiq.com',
        siteName: 'PharmaIQ',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'PharmaIQ - AI-Enhanced Drug Information Platform',
        description: 'Your trusted source for comprehensive FDA drug information powered by AI',
        creator: '@pharmaiq',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body className={`${mulish.variable} font-sans`}>
        <WebVitals />
        <UserTypeProvider>
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <a href="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">PharmaIQ</span>
                </a>
              </div>
              
              <div className="hidden lg:flex items-center space-x-8">
                <a href="/search" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Drug Search</a>
                <a href="/drugs/discovery" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Drug Discovery</a>
                <a href="/drugs/compare" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Compare Drugs</a>
                <div className="ml-4">
                  <a href="/search" className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-2.5 rounded-full hover:from-blue-700 hover:to-teal-700 font-medium transition-all shadow-md hover:shadow-lg">
                    Search Now
                  </a>
                </div>
              </div>
              
              <MobileNav />
            </div>
          </nav>
        </header>
        
        <main>{children}</main>
        
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Rx</span>
                  </div>
                  <span className="text-xl font-bold">PharmaIQ</span>
                </div>
                <p className="text-gray-400 mb-4">Your trusted source for comprehensive FDA drug information powered by AI. Access detailed medication data for healthcare professionals.</p>
                <p className="text-sm text-gray-500">For healthcare professionals only. This information is not intended to replace professional medical advice.</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="/search" className="hover:text-white">Drug Search</a></li>
                  <li><a href="/drugs/discovery" className="hover:text-white">Drug Discovery</a></li>
                  <li><a href="/drugs/compare" className="hover:text-white">Compare Drugs</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white">FDA Disclaimer</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-8 mt-8">
              <p className="text-center text-gray-400 text-sm">© 2024 PharmaIQ. All rights reserved. Drug information sourced from FDA-approved labeling.</p>
            </div>
          </div>
        </footer>
        </UserTypeProvider>
      </body>
    </html>);
}
