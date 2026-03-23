import { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout({ children }) {
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);
  const openMenu = () => setMobileMenuOpen(true);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden lg:block lg:w-72 lg:shrink-0">
          <div className="fixed inset-y-0 left-0 w-72">
            <Sidebar />
          </div>
        </div>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40"
            onClick={closeMenu}
          />
        )}

        {/* Mobile drawer */}
        <div
          className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onNavigate={closeMenu} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 lg:ml-0">
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={openMenu}
                  className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border bg-white hover:bg-slate-50"
                  aria-label="Open menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold truncate">
                    Personal Finance Dashboard
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">
                    {user?.email || "Authenticated User"}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="shrink-0 bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}