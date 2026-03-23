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

const today = new Date();

const initialBudgetForm = {
  month: today.getMonth() + 1,
  year: today.getFullYear(),
  planned_income: "",
};

const initialLimitForm = {
  category: "",
  expense_limit: "",
};

export default function BudgetsPage() {
  const toast = useToast();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [budgetForm, setBudgetForm] = useState(initialBudgetForm);
  const [limitForm, setLimitForm] = useState(initialLimitForm);

  const [currentBudget, setCurrentBudget] = useState(null);
  const [budgetStats, setBudgetStats] = useState(null);
  const [expenseCategories, setExpenseCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [creatingLimit, setCreatingLimit] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [limitError, setLimitError] = useState("");
  const [pageError, setPageError] = useState("");
  const [actionId, setActionId] = useState(null);

  const monthOptions = useMemo(
    () => [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
      { value: 3, label: "March" },
      { value: 4, label: "April" },
      { value: 5, label: "May" },
      { value: 6, label: "June" },
      { value: 7, label: "July" },
      { value: 8, label: "August" },
      { value: 9, label: "September" },
      { value: 10, label: "October" },
      { value: 11, label: "November" },
      { value: 12, label: "December" },
    ],
    []
  );

  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = today.getFullYear() - 2; year <= today.getFullYear() + 3; year++) {
      years.push(year);
    }
    return years;
  }, []);

  const fetchExpenseCategories = async () => {
    const response = await api.get("/categories/?type=EXPENSE");
    setExpenseCategories(response.data);
  };

  const fetchCurrentBudget = async (month = selectedMonth, year = selectedYear) => {
    try {
      const response = await api.get(`/budgets/current/?month=${month}&year=${year}`);
      setCurrentBudget(response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        setCurrentBudget(null);
        return null;
      }
      throw error;
    }
  };

  const fetchBudgetStats = async (month = selectedMonth, year = selectedYear) => {
    try {
      const response = await api.get(
        `/analytics/budget-vs-actual/?month=${month}&year=${year}`
      );
      setBudgetStats(response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        setBudgetStats(null);
        return null;
      }
      throw error;
    }
  };

  const fetchAllData = async (month = selectedMonth, year = selectedYear) => {
    try {
      setLoading(true);
      setPageError("");

      await fetchExpenseCategories();
      await fetchCurrentBudget(month, year);
      await fetchBudgetStats(month, year);
    } catch (error) {
      console.error("Budget page fetch error:", error);
      setPageError("Budget ma'lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleChangeMonthYear = async () => {
    await fetchAllData(selectedMonth, selectedYear);
  };

  const handleBudgetFormChange = (e) => {
    const { name, value } = e.target;
    setBudgetForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLimitFormChange = (e) => {
    const { name, value } = e.target;
    setLimitForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setBudgetError("");
    setCreatingBudget(true);

    try {
      await api.post("/budgets/", budgetForm);

      setSelectedMonth(Number(budgetForm.month));
      setSelectedYear(Number(budgetForm.year));

      await fetchAllData(Number(budgetForm.month), Number(budgetForm.year));
      toast.success("Budget yaratildi.");
    } catch (error) {
      console.error("Create budget error:", error);

      if (error.response?.data) {
        const backendErrors = error.response.data;
        const firstError = Object.values(backendErrors)?.[0];

        if (Array.isArray(firstError)) {
          setBudgetError(firstError[0]);
        } else if (typeof firstError === "string") {
          setBudgetError(firstError);
        } else {
          setBudgetError("Budget yaratishda xatolik yuz berdi.");
        }
      } else {
        setBudgetError("Budget yaratishda xatolik yuz berdi.");
      }

      toast.error("Budget yaratishda xatolik yuz berdi.");
    } finally {
      setCreatingBudget(false);
    }
  };

  const handleCreateLimit = async (e) => {
    e.preventDefault();

    if (!currentBudget) {
      setLimitError("Avval budget yarating.");
      toast.error("Avval budget yarating.");
      return;
    }

    setLimitError("");
    setCreatingLimit(true);

    try {
      await api.post(`/budgets/${currentBudget.id}/limits/`, limitForm);

      setLimitForm(initialLimitForm);
      await fetchAllData(selectedMonth, selectedYear);
      toast.success("Limit qo‘shildi.");
    } catch (error) {
      console.error("Create budget limit error:", error);

      if (error.response?.data) {
        const backendErrors = error.response.data;
        const firstError = Object.values(backendErrors)?.[0];

        if (Array.isArray(firstError)) {
          setLimitError(firstError[0]);
        } else if (typeof firstError === "string") {
          setLimitError(firstError);
        } else {
          setLimitError("Limit qo‘shishda xatolik yuz berdi.");
        }
      } else {
        setLimitError("Limit qo‘shishda xatolik yuz berdi.");
      }

      toast.error("Limit qo‘shishda xatolik yuz berdi.");
    } finally {
      setCreatingLimit(false);
    }
  };

  const handleDeleteLimit = async (limitId) => {
    if (!currentBudget) return;

    const confirmed = window.confirm(
      "Rostdan ham shu category limitini o‘chirmoqchimisiz?"
    );

    if (!confirmed) return;

    try {
      setActionId(limitId);
      await api.delete(`/budgets/${currentBudget.id}/limits/${limitId}/`);
      await fetchAllData(selectedMonth, selectedYear);
      toast.success("Limit o‘chirildi.");
    } catch (error) {
      console.error("Delete budget limit error:", error);
      toast.error("Limitni o‘chirishda xatolik yuz berdi.");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteBudget = async () => {
    if (!currentBudget) return;

    const confirmed = window.confirm(
      "Rostdan ham shu budgetni o‘chirmoqchimisiz?"
    );

    if (!confirmed) return;

    try {
      setActionId("budget-delete");
      await api.delete(`/budgets/${currentBudget.id}/`);
      setCurrentBudget(null);
      setBudgetStats(null);
      await fetchAllData(selectedMonth, selectedYear);
      toast.success("Budget o‘chirildi.");
    } catch (error) {
      console.error("Delete budget error:", error);
      toast.error("Budgetni o‘chirishda xatolik yuz berdi.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 min-w-0">
        <SectionHeader
          title="Budgets"
          subtitle="Oylik reja va real xarajatlarni boshqaring"
        />

        <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block mb-2 font-medium text-sm sm:text-base">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full border rounded-lg px-4 py-3"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-sm sm:text-base">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full border rounded-lg px-4 py-3"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 xl:col-span-2">
              <button
                onClick={handleChangeMonthYear}
                className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800"
              >
                Load budget
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonListItem />
          </div>
        ) : pageError ? (
          <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg break-words">
            {pageError}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-6 min-w-0">
              <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Yangi budget</h2>

                <form onSubmit={handleCreateBudget} className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">Month</label>
                    <select
                      name="month"
                      value={budgetForm.month}
                      onChange={handleBudgetFormChange}
                      className="w-full border rounded-lg px-4 py-3"
                    >
                      {monthOptions.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">Year</label>
                    <select
                      name="year"
                      value={budgetForm.year}
                      onChange={handleBudgetFormChange}
                      className="w-full border rounded-lg px-4 py-3"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">
                      Planned income
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="planned_income"
                      value={budgetForm.planned_income}
                      onChange={handleBudgetFormChange}
                      placeholder="0.00"
                      className="w-full border rounded-lg px-4 py-3"
                      required
                    />
                  </div>

                  {budgetError && (
                    <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg text-sm break-words">
                      {budgetError}
                    </div>
                  )}

                  <LoadingButton
                    type="submit"
                    loading={creatingBudget}
                    className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800"
                  >
                    Budget yaratish
                  </LoadingButton>
                </form>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  Category limit qo‘shish
                </h2>

                <form onSubmit={handleCreateLimit} className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">Category</label>
                    <select
                      name="category"
                      value={limitForm.category}
                      onChange={handleLimitFormChange}
                      className="w-full border rounded-lg px-4 py-3"
                      required
                    >
                      <option value="">Category tanlang</option>
                      {expenseCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">
                      Expense limit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="expense_limit"
                      value={limitForm.expense_limit}
                      onChange={handleLimitFormChange}
                      placeholder="0.00"
                      className="w-full border rounded-lg px-4 py-3"
                      required
                    />
                  </div>

                  {limitError && (
                    <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg text-sm break-words">
                      {limitError}
                    </div>
                  )}

                  <LoadingButton
                    type="submit"
                    loading={creatingLimit}
                    disabled={!currentBudget}
                    className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800"
                  >
                    Limit qo‘shish
                  </LoadingButton>
                </form>
              </div>
            </div>

            <div className="xl:col-span-2 space-y-6 min-w-0">
              {!currentBudget ? (
                <EmptyState
                  title="Budget topilmadi"
                  description="Tanlangan oy uchun budget yo‘q. Chap tomondan yangi budget yarating."
                />
              ) : (
                <>
                  <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold break-words">
                          Current budget: {currentBudget.month}/{currentBudget.year}
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base">
                          Limitlar va real xarajatlar holati
                        </p>
                      </div>

                      <button
                        onClick={handleDeleteBudget}
                        disabled={actionId === "budget-delete"}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 disabled:opacity-60 w-full sm:w-auto"
                      >
                        {actionId === "budget-delete" ? "..." : "Delete budget"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="rounded-xl border p-4 min-w-0">
                        <p className="text-slate-500 mb-2 text-sm sm:text-base">Planned income</p>
                        <h3 className="text-xl sm:text-2xl font-bold break-words">
                          {currentBudget.planned_income}
                        </h3>
                      </div>

                      <div className="rounded-xl border p-4 min-w-0">
                        <p className="text-slate-500 mb-2 text-sm sm:text-base">Total actual expense</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-red-600 break-words">
                          {currentBudget.total_actual_expense}
                        </h3>
                      </div>

                      <div className="rounded-xl border p-4 min-w-0">
                        <p className="text-slate-500 mb-2 text-sm sm:text-base">Total limit</p>
                        <h3 className="text-xl sm:text-2xl font-bold break-words">
                          {currentBudget.total_limit}
                        </h3>
                      </div>

                      <div className="rounded-xl border p-4 min-w-0">
                        <p className="text-slate-500 mb-2 text-sm sm:text-base">Remaining budget</p>
                        <h3 className="text-xl sm:text-2xl font-bold break-words">
                          {currentBudget.remaining_budget}
                        </h3>
                      </div>

                      <div className="rounded-xl border p-4 min-w-0">
                        <p className="text-slate-500 mb-2 text-sm sm:text-base">Actual income</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-green-600 break-words">
                          {budgetStats?.actual_income ?? "0.00"}
                        </h3>
                      </div>

                      <div className="rounded-xl border p-4 min-w-0">
                        <p className="text-slate-500 mb-2 text-sm sm:text-base">Income gap</p>
                        <h3 className="text-xl sm:text-2xl font-bold break-words">
                          {budgetStats?.income_gap ?? "0.00"}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <h2 className="text-lg sm:text-xl font-semibold">Category limits</h2>
                      <span className="text-sm text-slate-500">
                        Jami: {currentBudget.limits?.length || 0}
                      </span>
                    </div>

                    {!currentBudget.limits || currentBudget.limits.length === 0 ? (
                      <EmptyState
                        title="Hozircha limit qo‘shilmagan"
                        description="Chap tomondagi form orqali birinchi category limitni qo‘shing."
                      />
                    ) : (
                      <div className="space-y-4">
                        {currentBudget.limits.map((limit) => (
                          <div
                            key={limit.id}
                            className="border rounded-2xl p-4 sm:p-5 hover:shadow-sm transition min-w-0"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold break-words">
                                  {limit.category_name}
                                </h3>
                                <p className="text-slate-500 text-sm">
                                  Limit vs real xarajat
                                </p>
                              </div>

                              <button
                                onClick={() => handleDeleteLimit(limit.id)}
                                disabled={actionId === limit.id}
                                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 disabled:opacity-60 w-full sm:w-auto"
                              >
                                {actionId === limit.id ? "..." : "Delete"}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                              <div className="rounded-xl bg-slate-50 p-4 min-w-0">
                                <p className="text-slate-500 text-sm mb-1">Expense limit</p>
                                <p className="font-bold text-base sm:text-lg break-words">
                                  {limit.expense_limit}
                                </p>
                              </div>

                              <div className="rounded-xl bg-slate-50 p-4 min-w-0">
                                <p className="text-slate-500 text-sm mb-1">Actual expense</p>
                                <p className="font-bold text-base sm:text-lg text-red-600 break-words">
                                  {limit.actual_expense}
                                </p>
                              </div>

                              <div className="rounded-xl bg-slate-50 p-4 min-w-0">
                                <p className="text-slate-500 text-sm mb-1">Usage</p>
                                <p className="font-bold text-base sm:text-lg break-words">
                                  {limit.usage_percent}%
                                </p>
                              </div>
                            </div>

                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  Number(limit.usage_percent) >= 100
                                    ? "bg-red-500"
                                    : Number(limit.usage_percent) >= 80
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(Number(limit.usage_percent), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}