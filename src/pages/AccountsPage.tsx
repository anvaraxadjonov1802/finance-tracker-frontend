import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AppLayout from "../components/layout/AppLayout";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/common/EmptyState";
import SectionHeader from "../components/common/SectionHeader";
import LoadingButton from "../components/common/LoadingButton";
import {
  SkeletonCard,
  SkeletonListItem,
} from "../components/common/LoadingSkeleton";

const initialForm = {
  name: "",
  account_type: "CARD",
  currency: "UZS",
  initial_balance: "",
  is_active: true,
};

export default function AccountsPage() {
  const toast = useToast();

  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => {
      return sum + Number(account.current_balance || 0);
    }, 0);
  }, [accounts]);

  const fetchAccounts = async () => {
    try {
      setPageError("");
      setLoading(true);
      const response = await api.get("/accounts/");
      setAccounts(response.data);
    } catch (error) {
      console.error("Accounts fetch error:", error);
      setPageError("Accountlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await api.post("/accounts/", {
        ...formData,
        initial_balance:
          formData.initial_balance === "" ? "0.00" : formData.initial_balance,
      });

      setFormData(initialForm);
      await fetchAccounts();
      toast.success("Account muvaffaqiyatli qo‘shildi.");
    } catch (error) {
      console.error("Create account error:", error);

      if (error.response?.data) {
        const backendErrors = error.response.data;
        const firstError = Object.values(backendErrors)?.[0];

        if (Array.isArray(firstError)) {
          setFormError(firstError[0]);
        } else if (typeof firstError === "string") {
          setFormError(firstError);
        } else {
          setFormError("Account qo‘shishda xatolik yuz berdi.");
        }
      } else {
        setFormError("Account qo‘shishda xatolik yuz berdi.");
      }

      toast.error("Account qo‘shishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (accountId) => {
    const confirmed = window.confirm(
      "Rostdan ham shu accountni o‘chirmoqchimisiz?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(accountId);
      await api.delete(`/accounts/${accountId}/`);
      setAccounts((prev) => prev.filter((account) => account.id !== accountId));
      toast.success("Account o‘chirildi.");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error(
        "Bu account transaction yoki transferlarga bog‘langan bo‘lishi mumkin."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 min-w-0">
        <SectionHeader
          title="Accounts"
          subtitle="Kartalar, bank hisoblari va naqd pullarni boshqaring"
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 min-w-0">
            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                Yangi account qo‘shish
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Nomi
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Masalan: Humo Card"
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">
                      Turi
                    </label>
                    <select
                      name="account_type"
                      value={formData.account_type}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="CARD">Card</option>
                      <option value="BANK_ACCOUNT">Bank Account</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">
                      Valyuta
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="UZS">UZS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="RUB">RUB</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Boshlang‘ich balans
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="initial_balance"
                    value={formData.initial_balance}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span className="text-sm sm:text-base">Faol account</span>
                </label>

                {formError && (
                  <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg text-sm break-words">
                    {formError}
                  </div>
                )}

                <LoadingButton
                  type="submit"
                  loading={submitting}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800"
                >
                  Account qo‘shish
                </LoadingButton>
              </form>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-4 min-w-0">
            {loading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SkeletonListItem />
                  <SkeletonListItem />
                </div>
              </div>
            ) : pageError ? (
              <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg break-words">
                {pageError}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                  <p className="text-slate-500 mb-2 text-sm sm:text-base">
                    Jami balans
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold break-words">
                    {totalBalance.toFixed(2)}
                  </h2>
                </div>

                <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold">
                      Mening accountlarim
                    </h2>
                    <span className="text-sm text-slate-500">
                      Jami: {accounts.length}
                    </span>
                  </div>

                  {accounts.length === 0 ? (
                    <EmptyState
                      title="Hozircha account yo‘q"
                      description="Chap tomondagi form orqali birinchi accountni qo‘shing."
                    />
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className="border rounded-2xl p-4 sm:p-5 hover:shadow-sm transition min-w-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold break-words">
                                {account.name}
                              </h3>
                              <p className="text-slate-500 text-sm break-words">
                                {account.account_type} • {account.currency}
                              </p>
                            </div>

                            <span
                              className={`text-xs px-3 py-1 rounded-full w-fit ${
                                account.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {account.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-start justify-between gap-4">
                              <span className="text-slate-500 text-sm sm:text-base">
                                Initial balance
                              </span>
                              <span className="font-medium text-right break-all">
                                {account.initial_balance}
                              </span>
                            </div>

                            <div className="flex items-start justify-between gap-4">
                              <span className="text-slate-500 text-sm sm:text-base">
                                Current balance
                              </span>
                              <span className="font-bold text-base sm:text-lg text-right break-all">
                                {account.current_balance}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(account.id)}
                            disabled={deletingId === account.id}
                            className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === account.id
                              ? "O‘chirilmoqda..."
                              : "Delete"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}