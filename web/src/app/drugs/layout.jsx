export default function DrugsLayout({ children }) {
    return (<div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-3">
          <ul className="flex space-x-6 text-sm">
            <li>
              <a href="/drugs" className="text-blue-600 hover:text-blue-800">
                All Drugs
              </a>
            </li>
            <li>
              <a href="/drugs/discovery" className="text-blue-600 hover:text-blue-800">
                Drug Discovery
              </a>
            </li>
            <li>
              <a href="/drugs/compare" className="text-blue-600 hover:text-blue-800">
                Compare Drugs
              </a>
            </li>
          </ul>
        </div>
      </nav>
      <main>{children}</main>
    </div>);
}
