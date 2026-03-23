import { Link, useLocation } from "react-router-dom";

const links = [
  { name: "Dashboard", path: "/" },
  { name: "Accounts", path: "/accounts" },
  { name: "Transactions", path: "/transactions" },
  { name: "Transfers", path: "/transfers" },
  { name: "Debts", path: "/debts" },
  { name: "Budgets", path: "/budgets" },
];

export default function Sidebar({ onNavigate }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="h-full bg-slate-900 text-white flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Finance Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">Personal finance app</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const active = isActive(link.path);

          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onNavigate}
              className={`block rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-slate-700 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        Responsive MVP
      </div>
    </aside>
  );
}