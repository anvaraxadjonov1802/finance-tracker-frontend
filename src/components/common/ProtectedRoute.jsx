import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingUser } = useAuth();

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded-lg w-40 mx-auto" />
            <div className="h-4 bg-slate-200 rounded-lg w-56 mx-auto" />
            <div className="h-12 bg-slate-200 rounded-lg w-full mt-6" />
            <div className="h-12 bg-slate-200 rounded-lg w-full" />
            <div className="h-12 bg-slate-200 rounded-lg w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}