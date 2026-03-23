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
  debt_type: "DEBT",
  person_name: "",
  amount: "",
  currency: "UZS",
  description: "",
  due_date: "",
  status: "OPEN",
};

const initialFilters = {
  type: "",
  status: "",
  person_name: "",
};

export default function DebtsPage() {
  const toast = useToast();

  const [debts, setDebts] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionId, setActionId] = useState(null);

  const summary = useMemo(() => {
    return debts.reduce(
      (acc, item) => {
        const amount = Number(item.amount || 0);

        if (item.status === "OPEN" && item.debt_type === "DEBT") {
          acc.openDebt += amount;
        }

        if (item.status === "OPEN" && item.debt_type === "RECEIVABLE") {
          acc.openReceivable += amount;
        }

        return acc;
      },
      { openDebt: 0, openReceivable: 0 }
    );
  }, [debts]);

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

  const fetchDebts = async (customFilters = filters) => {
    const query = buildQuery(customFilters);
    const response = await api.get(`/debts/${query}`);
    setDebts(response.data);
  };

  const fetchAllData = async () => {
    try {
      setPageError("");
      setLoading(true);
      await fetchDebts(initialFilters);
    } catch (error) {
      console.error("Debts fetch error:", error);
      setPageError("Qarzlar ma'lumotini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await api.post("/debts/", {
        ...formData,
        due_date: formData.due_date || null,
      });

      setFormData(initialForm);
      await fetchDebts(filters);
      toast.success("Yozuv muvaffaqiyatli qo‘shildi.");
    } catch (error) {
      console.error("Create debt error:", error);

      if (error.response?.data) {
        const backendErrors = error.response.data;
        const firstError = Object.values(backendErrors)?.[0];

        if (Array.isArray(firstError)) {
          setFormError(firstError[0]);
        } else if (typeof firstError === "string") {
          setFormError(firstError);
        } else {
          setFormError("Qarz yozuvini qo‘shishda xatolik yuz berdi.");
        }
      } else {
        setFormError("Qarz yozuvini qo‘shishda xatolik yuz berdi.");
      }

      toast.error("Qarz yozuvini qo‘shishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      setPageError("");
      await fetchDebts(filters);
    } catch (error) {
      console.error("Filter debts error:", error);
      setPageError("Filterlashda xatolik yuz berdi.");
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
      await fetchDebts(reset);
    } catch (error) {
      console.error("Reset debt filters error:", error);
      setPageError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Rostdan ham shu qarz yozuvini o‘chirmoqchimisiz?"
    );

    if (!confirmed) return;

    try {
      setActionId(id);
      await api.delete(`/debts/${id}/`);
      setDebts((prev) => prev.filter((item) => item.id !== id));
      toast.success("Yozuv o‘chirildi.");
    } catch (error) {
      console.error("Delete debt error:", error);
      toast.error("Yozuvni o‘chirishda xatolik yuz berdi.");
    } finally {
      setActionId(null);
    }
  };

  const handleClose = async (id) => {
    try {
      setActionId(id);
      const response = await api.patch(`/debts/${id}/close/`);
      setDebts((prev) =>
        prev.map((item) => (item.id === id ? response.data : item))
      );
      toast.success("Yozuv yopildi.");
    } catch (error) {
      console.error("Close debt error:", error);
      toast.error("Yozuvni yopishda xatolik yuz berdi.");
    } finally {
      setActionId(null);
    }
  };

  const handleReopen = async (id) => {
    try {
      setActionId(id);
      const response = await api.patch(`/debts/${id}/reopen/`);
      setDebts((prev) =>
        prev.map((item) => (item.id === id ? response.data : item))
      );
      toast.success("Yozuv qayta ochildi.");
    } catch (error) {
      console.error("Reopen debt error:", error);
      toast.error("Yozuvni qayta ochishda xatolik yuz berdi.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 min-w-0">
        <SectionHeader
          title="Debts & Receivables"
          subtitle="Qarz va haqdorlik yozuvlarini boshqaring"
        />

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        ) : pageError ? (
          <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg break-words">
            {pageError}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                <p className="text-slate-500 mb-2 text-sm sm:text-base">
                  Open debts
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-red-600 break-words">
                  {summary.openDebt.toFixed(2)}
                </h2>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                <p className="text-slate-500 mb-2 text-sm sm:text-base">
                  Open receivables
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-green-600 break-words">
                  {summary.openReceivable.toFixed(2)}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 space-y-6 min-w-0">
                <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">
                    Yangi yozuv
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block mb-2 font-medium text-sm sm:text-base">
                        Turi
                      </label>
                      <select
                        name="debt_type"
                        value={formData.debt_type}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg px-4 py-3"
                      >
                        <option value="DEBT">Debt</option>
                        <option value="RECEIVABLE">Receivable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-sm sm:text-base">
                        Person
                      </label>
                      <input
                        type="text"
                        name="person_name"
                        value={formData.person_name}
                        onChange={handleFormChange}
                        placeholder="Masalan: Ali"
                        className="w-full border rounded-lg px-4 py-3"
                        required
                      />
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
                          className="w-full border rounded-lg px-4 py-3"
                          required
                        />
                      </div>

                      <div>
                        <label className="block mb-2 font-medium text-sm sm:text-base">
                          Currency
                        </label>
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleFormChange}
                          className="w-full border rounded-lg px-4 py-3"
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
                        Due date
                      </label>
                      <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleFormChange}
                        className="w-full border rounded-lg px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-sm sm:text-base">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        rows={3}
                        placeholder="Izoh"
                        className="w-full border rounded-lg px-4 py-3 resize-none"
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
                      Yozuv qo‘shish
                    </LoadingButton>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">
                    Filterlar
                  </h2>

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
                        <option value="DEBT">Debt</option>
                        <option value="RECEIVABLE">Receivable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-sm sm:text-base">
                        Status
                      </label>
                      <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full border rounded-lg px-4 py-3"
                      >
                        <option value="">Barchasi</option>
                        <option value="OPEN">OPEN</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 font-medium text-sm sm:text-base">
                        Person qidirish
                      </label>
                      <input
                        type="text"
                        name="person_name"
                        value={filters.person_name}
                        onChange={handleFilterChange}
                        placeholder="Masalan: Ali"
                        className="w-full border rounded-lg px-4 py-3"
                      />
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
                    <h2 className="text-lg sm:text-xl font-semibold">Yozuvlar</h2>
                    <span className="text-sm text-slate-500">
                      Jami: {debts.length}
                    </span>
                  </div>

                  {debts.length === 0 ? (
                    <EmptyState
                      title="Hozircha yozuv yo‘q"
                      description="Debt yoki receivable qo‘shib boshlang."
                    />
                  ) : (
                    <div className="space-y-4">
                      {debts.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-2xl p-4 sm:p-5 hover:shadow-sm transition min-w-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold break-words">
                                {item.person_name}
                              </h3>
                              <p className="text-slate-500 text-sm break-words">
                                {item.due_date || "No due date"}
                              </p>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              <span
                                className={`text-xs px-3 py-1 rounded-full w-fit ${
                                  item.debt_type === "DEBT"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {item.debt_type}
                              </span>

                              <span
                                className={`text-xs px-3 py-1 rounded-full w-fit ${
                                  item.status === "OPEN"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                            <span className="text-slate-500 text-sm sm:text-base">
                              Amount
                            </span>
                            <span className="font-bold text-base sm:text-lg break-all">
                              {item.amount} {item.currency}
                            </span>
                          </div>

                          <div className="mb-4 break-words">
                            <span className="text-slate-500 text-sm sm:text-base">
                              Description:{" "}
                            </span>
                            <span className="text-sm sm:text-base">
                              {item.description || "-"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {item.status === "OPEN" ? (
                              <button
                                onClick={() => handleClose(item.id)}
                                disabled={actionId === item.id}
                                className="bg-green-50 text-green-700 py-2.5 rounded-lg hover:bg-green-100 disabled:opacity-60"
                              >
                                {actionId === item.id ? "..." : "Close"}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReopen(item.id)}
                                disabled={actionId === item.id}
                                className="bg-blue-50 text-blue-700 py-2.5 rounded-lg hover:bg-blue-100 disabled:opacity-60"
                              >
                                {actionId === item.id ? "..." : "Reopen"}
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={actionId === item.id}
                              className="sm:col-span-1 lg:col-span-2 bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 disabled:opacity-60"
                            >
                              {actionId === item.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}