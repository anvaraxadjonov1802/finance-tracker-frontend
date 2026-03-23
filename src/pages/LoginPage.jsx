import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated, loadingUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loadingUser && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loadingUser, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      setError("Login xato. Email yoki parol noto‘g‘ri.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Personal finance tizimiga kiring
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-sm sm:text-base">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-sm sm:text-base">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="********"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg text-sm break-words">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Kirilmoqda..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6 leading-6">
          Accauntingiz yo‘qmi?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}