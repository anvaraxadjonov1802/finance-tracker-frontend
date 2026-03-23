import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AppLayout from "../components/layout/AppLayout";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/common/EmptyState";
import SectionHeader from "../components/common/SectionHeader";
import LoadingButton from "../components/common/LoadingButton";
import { SkeletonListItem } from "../components/common/LoadingSkeleton";

const initialForm = {
  account: "",
  category: "",
  transaction_type: "EXPENSE",
  amount: "",
  description: "",
  transaction_date: new Date().toISOString().slice(0, 10),
};

const initialFilters = {
  type: "",
  account: "",
  category: "",
};

export default function TransactionsPage() {
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const filteredCategories = useMemo(() => {
    if (!formData.transaction_type) return categories;
    return categories.filter(
      (category) => category.category_type === formData.transaction_type
    );
  }, [categories, formData.transaction_type]);

  const filterCategories = useMemo(() => {
    if (!filters.type) return categories;
    return categories.filter(
      (category) => category.category_type === filters.type
    );
  }, [categories, filters.type]);

  const buildQuery = (paramsObj) => {
    const params = new URLSearchParams();

    Object.entries(paramsObj).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.append(key, value);
      }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const fetchAccounts = async () => {
    const response = await api.get("/accounts/");
    setAccounts(response.data);
  };

  const fetchCategories = async () => {
    const response = await api.get("/categories/");
    setCategories(response.data);
  };

  const fetchTransactions = async (customFilters = filters) => {
    const query = buildQuery(customFilters);
    const response = await api.get(`/transactions/${query}`);
    setTransactions(response.data);
  };

  const fetchAllData = async () => {
    try {
      setPageError("");
      setLoading(true);

      await Promise.all([
        fetchAccounts(),
        fetchCategories(),
        fetchTransactions(initialFilters),
      ]);
    } catch (error) {
      console.error("Transactions page fetch error:", error);
      setPageError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      category: "",
    }));
  }, [formData.transaction_type]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "type") {
        next.category = "";
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await api.post("/transactions/", formData);

      setFormData({
        ...initialForm,
        transaction_date: new Date().toISOString().slice(0, 10),
      });

      await fetchTransactions(filters);
      toast.success("Transaction muvaffaqiyatli qo‘shildi.");
    } catch (error) {
      console.error("Create transaction error:", error);

      if (error.response?.data) {
        const backendErrors = error.response.data;
        const firstError = Object.values(backendErrors)?.[0];

        if (Array.isArray(firstError)) {
          setFormError(firstError[0]);
        } else if (typeof firstError === "string") {
          setFormError(firstError);
        } else {
          setFormError("Transaction qo‘shishda xatolik yuz berdi.");
        }
      } else {
        setFormError("Transaction qo‘shishda xatolik yuz berdi.");
      }

      toast.error("Transaction qo‘shishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      setPageError("");
      await fetchTransactions(filters);
    } catch (error) {
      console.error("Filter transactions error:", error);
      setPageError("Transactionlarni filterlashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = async () => {
    const reset = { ...initialFilters };
    setFilters(reset);

    try {
      setLoading(true);
      setPageError("");
      await fetchTransactions(reset);
    } catch (error) {
      console.error("Reset filters error:", error);
      setPageError("Transactionlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId) => {
    const confirmed = window.confirm(
      "Rostdan ham shu transactionni o‘chirmoqchimisiz?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(transactionId);
      await api.delete(`/transactions/${transactionId}/`);
      setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== transactionId)
      );
      toast.success("Transaction o‘chirildi.");
    } catch (error) {
      console.error("Delete transaction error:", error);
      toast.error("Transactionni o‘chirishda xatolik yuz berdi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 min-w-0">
        <SectionHeader
          title="Transactions"
          subtitle="Daromad va xarajatlarni boshqaring"
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-6 min-w-0">
            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                Yangi transaction qo‘shish
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Turi
                  </label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Account
                  </label>
                  <select
                    name="account"
                    value={formData.account}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                    required
                  >
                    <option value="">Account tanlang</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                    required
                  >
                    <option value="">Category tanlang</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">
                      Sana
                    </label>
                    <input
                      type="date"
                      name="transaction_date"
                      value={formData.transaction_date}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Tavsif
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Masalan: Korzinka xarajati"
                    rows={3}
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                  />
                </div>

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
                  Transaction qo‘shish
                </LoadingButton>
              </form>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Filterlar</h2>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Turi
                  </label>
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="w-full border rounded-lg px-4 py-3"
                  >
                    <option value="">Barchasi</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Account
                  </label>
                  <select
                    name="account"
                    value={filters.account}
                    onChange={handleFilterChange}
                    className="w-full border rounded-lg px-4 py-3"
                  >
                    <option value="">Barchasi</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Category
                  </label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full border rounded-lg px-4 py-3"
                  >
                    <option value="">Barchasi</option>
                    {filterCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleApplyFilters}
                    className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800"
                  >
                    Apply
                  </button>

                  <button
                    onClick={handleResetFilters}
                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 min-w-0">
            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Transactionlar
                </h2>
                <span className="text-sm text-slate-500">
                  Jami: {transactions.length}
                </span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <SkeletonListItem />
                  <SkeletonListItem />
                  <SkeletonListItem />
                </div>
              ) : pageError ? (
                <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg break-words">
                  {pageError}
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState
                  title="Hozircha transaction yo‘q"
                  description="Income yoki expense qo‘shib boshlang."
                />
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="border rounded-2xl p-4 sm:p-5 hover:shadow-sm transition min-w-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold break-words">
                            {transaction.category_name}
                          </h3>
                          <p className="text-slate-500 text-sm break-words">
                            {transaction.account_name} • {transaction.transaction_date}
                          </p>
                        </div>

                        <span
                          className={`text-xs px-3 py-1 rounded-full w-fit ${
                            transaction.transaction_type === "INCOME"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {transaction.transaction_type}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <span className="text-slate-500 text-sm sm:text-base">
                          Amount
                        </span>
                        <span
                          className={`font-bold text-base sm:text-lg break-all ${
                            transaction.transaction_type === "INCOME"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.transaction_type === "INCOME" ? "+" : "-"}
                          {transaction.amount} {transaction.currency}
                        </span>
                      </div>

                      <div className="mb-4 break-words">
                        <span className="text-slate-500 text-sm sm:text-base">
                          Description:{" "}
                        </span>
                        <span className="text-sm sm:text-base">
                          {transaction.description || "-"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deletingId === transaction.id}
                        className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletingId === transaction.id
                          ? "O‘chirilmoqda..."
                          : "Delete"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}