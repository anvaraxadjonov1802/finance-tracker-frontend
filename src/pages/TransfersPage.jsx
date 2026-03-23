import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AppLayout from "../components/layout/AppLayout";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/common/EmptyState";
import SectionHeader from "../components/common/SectionHeader";
import LoadingButton from "../components/common/LoadingButton";
import { SkeletonListItem } from "../components/common/LoadingSkeleton";

const initialForm = {
  from_account: "",
  to_account: "",
  from_amount: "",
  exchange_rate: "1.0",
  note: "",
  transfer_date: new Date().toISOString().slice(0, 10),
};

export default function TransfersPage() {
  const toast = useToast();

  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fromAccountObj = useMemo(() => {
    return accounts.find(
      (account) => String(account.id) === String(formData.from_account)
    );
  }, [accounts, formData.from_account]);

  const toAccountObj = useMemo(() => {
    return accounts.find(
      (account) => String(account.id) === String(formData.to_account)
    );
  }, [accounts, formData.to_account]);

  const previewToAmount = useMemo(() => {
    const amount = Number(formData.from_amount || 0);
    const rate = Number(formData.exchange_rate || 0);

    if (!amount || !rate) return "0.00";

    if (
      fromAccountObj &&
      toAccountObj &&
      fromAccountObj.currency === toAccountObj.currency
    ) {
      return amount.toFixed(2);
    }

    return (amount * rate).toFixed(2);
  }, [formData.from_amount, formData.exchange_rate, fromAccountObj, toAccountObj]);

  const fetchAccounts = async () => {
    const response = await api.get("/accounts/");
    setAccounts(response.data);
  };

  const fetchTransfers = async () => {
    const response = await api.get("/transfers/");
    setTransfers(response.data);
  };

  const fetchAllData = async () => {
    try {
      setPageError("");
      setLoading(true);

      await Promise.all([fetchAccounts(), fetchTransfers()]);
    } catch (error) {
      console.error("Transfers page fetch error:", error);
      setPageError("Transfer ma'lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (
      fromAccountObj &&
      toAccountObj &&
      fromAccountObj.currency === toAccountObj.currency &&
      formData.exchange_rate !== "1.0"
    ) {
      setFormData((prev) => ({
        ...prev,
        exchange_rate: "1.0",
      }));
    }
  }, [fromAccountObj, toAccountObj, formData.exchange_rate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await api.post("/transfers/", formData);

      setFormData({
        ...initialForm,
        transfer_date: new Date().toISOString().slice(0, 10),
      });

      await fetchTransfers();
      toast.success("Transfer muvaffaqiyatli qo‘shildi.");
    } catch (error) {
      console.error("Create transfer error:", error);

      if (error.response?.data) {
        const backendErrors = error.response.data;
        const firstError = Object.values(backendErrors)?.[0];

        if (Array.isArray(firstError)) {
          setFormError(firstError[0]);
        } else if (typeof firstError === "string") {
          setFormError(firstError);
        } else {
          setFormError("Transfer yaratishda xatolik yuz berdi.");
        }
      } else {
        setFormError("Transfer yaratishda xatolik yuz berdi.");
      }

      toast.error("Transfer yaratishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (transferId) => {
    const confirmed = window.confirm(
      "Rostdan ham shu transferni o‘chirmoqchimisiz?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(transferId);
      await api.delete(`/transfers/${transferId}/`);
      setTransfers((prev) => prev.filter((item) => item.id !== transferId));
      toast.success("Transfer o‘chirildi.");
    } catch (error) {
      console.error("Delete transfer error:", error);
      toast.error("Transferni o‘chirishda xatolik yuz berdi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 min-w-0">
        <SectionHeader
          title="Transfers"
          subtitle="Accountlar orasida pul o‘tkazmalarini boshqaring"
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-6 min-w-0">
            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                Yangi transfer
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    From account
                  </label>
                  <select
                    name="from_account"
                    value={formData.from_account}
                    onChange={handleChange}
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
                    To account
                  </label>
                  <select
                    name="to_account"
                    value={formData.to_account}
                    onChange={handleChange}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="from_amount"
                      value={formData.from_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-sm sm:text-base">
                      Exchange rate
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      name="exchange_rate"
                      value={formData.exchange_rate}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                      required
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 -mt-2">
                  Bir xil valyutada bo‘lsa 1.0 qoldiring
                </p>

                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Sana
                  </label>
                  <input
                    type="date"
                    name="transfer_date"
                    value={formData.transfer_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-sm sm:text-base">
                    Izoh
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Masalan: UZS dan USD ga o'tkazma"
                    rows={3}
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                  />
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border min-w-0">
                  <p className="text-sm text-slate-500 mb-2">Preview</p>
                  <div className="space-y-2 text-sm">
                    <p className="break-words">
                      <span className="text-slate-500">From:</span>{" "}
                      {formData.from_amount || "0.00"} {fromAccountObj?.currency || ""}
                    </p>
                    <p className="break-words">
                      <span className="text-slate-500">To:</span>{" "}
                      {previewToAmount} {toAccountObj?.currency || ""}
                    </p>
                  </div>
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
                  Transfer qo‘shish
                </LoadingButton>
              </form>
            </div>
          </div>

          <div className="xl:col-span-2 min-w-0">
            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Transferlar</h2>
                <span className="text-sm text-slate-500">
                  Jami: {transfers.length}
                </span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <SkeletonListItem />
                  <SkeletonListItem />
                </div>
              ) : pageError ? (
                <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg break-words">
                  {pageError}
                </div>
              ) : transfers.length === 0 ? (
                <EmptyState
                  title="Hozircha transfer yo‘q"
                  description="Accountlar orasida birinchi transferni yarating."
                />
              ) : (
                <div className="space-y-4">
                  {transfers.map((transfer) => (
                    <div
                      key={transfer.id}
                      className="border rounded-2xl p-4 sm:p-5 hover:shadow-sm transition min-w-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold break-words">
                            {transfer.from_account_name} → {transfer.to_account_name}
                          </h3>
                          <p className="text-slate-500 text-sm break-words">
                            {transfer.transfer_date}
                          </p>
                        </div>

                        <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 w-fit">
                          TRANSFER
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="rounded-xl bg-slate-50 p-4 min-w-0">
                          <p className="text-slate-500 text-sm mb-1">From</p>
                          <p className="font-bold break-all">
                            {transfer.from_amount} {transfer.from_currency}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 min-w-0">
                          <p className="text-slate-500 text-sm mb-1">To</p>
                          <p className="font-bold break-all">
                            {transfer.to_amount} {transfer.to_currency}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm">
                        <p className="break-words">
                          <span className="text-slate-500">Rate:</span>{" "}
                          {transfer.exchange_rate}
                        </p>
                        <p className="break-words">
                          <span className="text-slate-500">Note:</span>{" "}
                          {transfer.note || "-"}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(transfer.id)}
                        disabled={deletingId === transfer.id}
                        className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletingId === transfer.id ? "O‘chirilmoqda..." : "Delete"}
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