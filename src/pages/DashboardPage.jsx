import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import api from "../api/axios";
import AppLayout from "../components/layout/AppLayout";
import SectionHeader from "../components/common/SectionHeader";
import EmptyState from "../components/common/EmptyState";
import { SkeletonCard } from "../components/common/LoadingSkeleton";

function formatMoney(value) {
  const number = Number(value || 0);
  return number.toLocaleString();
}

function StatCard({ title, value, subtitle, tone = "default" }) {
  const toneMap = {
    default: "bg-white border text-slate-900",
    green: "bg-green-50 border-green-100 text-green-700",
    red: "bg-red-50 border-red-100 text-red-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${toneMap[tone] || toneMap.default}`}
    >
      <p className="text-sm text-slate-500 mb-2">{title}</p>
      <h3 className="text-xl sm:text-2xl font-bold mb-1 break-words">
        {formatMoney(value)}
      </h3>
      {subtitle && <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function SectionCard({ title, subtitle, children, rightNode }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold break-words">{title}</h2>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-1 break-words">{subtitle}</p>
          )}
        </div>
        {rightNode}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [budgetStats, setBudgetStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const pieColors = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#ca8a04",
    "#7c3aed",
    "#0891b2",
    "#ea580c",
    "#475569",
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .slice(0, 10);

      const today = new Date().toISOString().slice(0, 10);

      const [summaryRes, breakdownRes, trendRes, calendarRes, budgetRes] =
        await Promise.allSettled([
          api.get("/analytics/summary/"),
          api.get("/analytics/category-breakdown/?type=EXPENSE"),
          api.get(
            `/analytics/income-vs-expense/?group_by=day&date_from=${monthStart}&date_to=${today}`
          ),
          api.get("/analytics/calendar/"),
          api.get("/analytics/budget-vs-actual/"),
        ]);

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value.data);
      }

      if (breakdownRes.status === "fulfilled") {
        setExpenseBreakdown(breakdownRes.value.data);
      }

      if (trendRes.status === "fulfilled") {
        setTrendData(trendRes.value.data);
      }

      if (calendarRes.status === "fulfilled") {
        setCalendarData(calendarRes.value.data);
      }

      if (budgetRes.status === "fulfilled") {
        setBudgetStats(budgetRes.value.data);
      } else {
        setBudgetStats(null);
      }

      const hasAnyCriticalFailure =
        summaryRes.status === "rejected" &&
        breakdownRes.status === "rejected" &&
        trendRes.status === "rejected";

      if (hasAnyCriticalFailure) {
        setPageError("Dashboard ma'lumotlarini yuklashda xatolik yuz berdi.");
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setPageError("Dashboard ma'lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const trendChartData = useMemo(() => {
    return trendData.map((item) => ({
      period: item.period,
      income: Number(item.income || 0),
      expense: Number(item.expense || 0),
      net: Number(item.net || 0),
    }));
  }, [trendData]);

  const expensePieData = useMemo(() => {
    return expenseBreakdown.map((item) => ({
      name: item.category_name,
      value: Number(item.total_amount || 0),
      percentage: item.percentage,
    }));
  }, [expenseBreakdown]);

  const recentCalendarData = useMemo(() => {
    return [...calendarData]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7);
  }, [calendarData]);

  const budgetProgressPercent = useMemo(() => {
    if (!budgetStats) return 0;

    const limit = Number(budgetStats.total_expense_limit || 0);
    const actual = Number(budgetStats.actual_expense || 0);

    if (limit <= 0) return 0;
    return Math.min((actual / limit) * 100, 100);
  }, [budgetStats]);

  const summaryCards = [
    {
      title: "Total Balance",
      value: summary?.total_balance ?? 0,
      subtitle: "Barcha accountlar bo‘yicha",
      tone: "blue",
    },
    {
      title: "Monthly Income",
      value: summary?.monthly_income ?? 0,
      subtitle: "Joriy oy kirimlari",
      tone: "green",
    },
    {
      title: "Monthly Expense",
      value: summary?.monthly_expense ?? 0,
      subtitle: "Joriy oy xarajatlari",
      tone: "red",
    },
    {
      title: "Net Savings",
      value: summary?.net_savings ?? 0,
      subtitle: "Income - Expense",
      tone: "default",
    },
    {
      title: "Open Debts",
      value: summary?.open_debt_total ?? 0,
      subtitle: "Qaytarilishi kerak bo‘lgan qarzlar",
      tone: "yellow",
    },
    {
      title: "Open Receivables",
      value: summary?.open_receivable_total ?? 0,
      subtitle: "Sizga qaytishi kerak mablag‘",
      tone: "green",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 min-w-0">
        <SectionHeader
          title="Dashboard"
          subtitle="Moliyaviy holatingizning umumiy ko‘rinishi"
          action={
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                to="/transactions"
                className="bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 text-center"
              >
                Add Transaction
              </Link>
              <Link
                to="/transfers"
                className="bg-white border px-4 py-2.5 rounded-lg hover:bg-slate-50 text-center"
              >
                Add Transfer
              </Link>
              <Link
                to="/budgets"
                className="bg-white border px-4 py-2.5 rounded-lg hover:bg-slate-50 text-center"
              >
                Manage Budget
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : pageError ? (
          <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg">
            {pageError}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {summaryCards.map((card) => (
                <StatCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  tone={card.tone}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 min-w-0">
                <SectionCard
                  title="Expense Breakdown"
                  subtitle="Kategoriya bo‘yicha xarajatlar"
                >
                  {expensePieData.length === 0 ? (
                    <EmptyState
                      title="Expense ma'lumotlari yo‘q"
                      description="Pie chart chiqishi uchun expense transactionlar qo‘shing."
                    />
                  ) : (
                    <div className="h-72 sm:h-80 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={window.innerWidth < 640 ? 70 : 90}
                            labelLine={false}
                          >
                            {expensePieData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={pieColors[index % pieColors.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatMoney(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </SectionCard>
              </div>

              <div className="xl:col-span-2 min-w-0">
                <SectionCard
                  title="Income vs Expense"
                  subtitle="Joriy oy bo‘yicha kunlik trend"
                >
                  {trendChartData.length === 0 ? (
                    <EmptyState
                      title="Trend ma'lumotlari yo‘q"
                      description="Bar chart uchun joriy oy transactionlari kerak."
                    />
                  ) : (
                    <div className="h-72 sm:h-80 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 10 }}
                            minTickGap={20}
                          />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value) => formatMoney(value)} />
                          <Legend />
                          <Bar
                            dataKey="income"
                            name="Income"
                            fill="#16a34a"
                            radius={[6, 6, 0, 0]}
                          />
                          <Bar
                            dataKey="expense"
                            name="Expense"
                            fill="#dc2626"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 min-w-0">
                <SectionCard title="Net Cashflow" subtitle="Kunlik sof oqim">
                  {trendChartData.length === 0 ? (
                    <EmptyState
                      title="Net cashflow ma'lumotlari yo‘q"
                      description="Line chart uchun joriy oy transactionlari kerak."
                    />
                  ) : (
                    <div className="h-72 sm:h-80 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 10 }}
                            minTickGap={20}
                          />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value) => formatMoney(value)} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="net"
                            name="Net"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </SectionCard>
              </div>

              <div className="xl:col-span-1 min-w-0">
                <SectionCard
                  title="Budget Status"
                  subtitle="Joriy oyning budget holati"
                  rightNode={
                    <Link
                      to="/budgets"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Open
                    </Link>
                  }
                >
                  {!budgetStats ? (
                    <EmptyState
                      title="Bu oy uchun budget topilmadi"
                      description="Budgets bo‘limida joriy oy uchun budget yarating."
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-slate-500 text-sm mb-1">Planned income</p>
                        <p className="font-bold text-lg sm:text-xl break-words">
                          {formatMoney(budgetStats.planned_income)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-slate-500 text-sm mb-1">Actual income</p>
                        <p className="font-bold text-lg sm:text-xl text-green-600 break-words">
                          {formatMoney(budgetStats.actual_income)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-slate-500 text-sm mb-1">Actual expense</p>
                        <p className="font-bold text-lg sm:text-xl text-red-600 break-words">
                          {formatMoney(budgetStats.actual_expense)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-slate-500 text-sm mb-2">Budget usage</p>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              budgetProgressPercent >= 100
                                ? "bg-red-500"
                                : budgetProgressPercent >= 80
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${budgetProgressPercent}%` }}
                          />
                        </div>
                        <p className="text-sm mt-2 text-slate-600">
                          {budgetProgressPercent.toFixed(1)}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-slate-500 text-sm mb-1">Remaining budget</p>
                        <p className="font-bold text-lg sm:text-xl break-words">
                          {formatMoney(budgetStats.remaining_budget)}
                        </p>
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard
                title="Recent Daily Summary"
                subtitle="So‘nggi kunlar bo‘yicha kirim va chiqim"
              >
                {recentCalendarData.length === 0 ? (
                  <EmptyState
                    title="Daily summary ma'lumotlari yo‘q"
                    description="Calendar summary chiqishi uchun transactionlar kerak."
                  />
                ) : (
                  <div className="space-y-3">
                    {recentCalendarData.map((item) => (
                      <div
                        key={item.date}
                        className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium break-words">{item.date}</p>
                          <p className="text-sm text-slate-500">
                            Daily activity summary
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-green-600 font-medium">
                            + {formatMoney(item.income)}
                          </p>
                          <p className="text-red-600 font-medium">
                            - {formatMoney(item.expense)}
                          </p>
                          <p className="text-slate-700 text-sm">
                            Net: {formatMoney(item.net)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Quick Navigation"
                subtitle="Asosiy bo‘limlarga tez o‘tish"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/accounts"
                    className="border rounded-2xl p-5 hover:bg-slate-50 transition"
                  >
                    <h3 className="font-semibold text-lg mb-1">Accounts</h3>
                    <p className="text-slate-500 text-sm">
                      Kartalar va balanslarni boshqaring
                    </p>
                  </Link>

                  <Link
                    to="/transactions"
                    className="border rounded-2xl p-5 hover:bg-slate-50 transition"
                  >
                    <h3 className="font-semibold text-lg mb-1">Transactions</h3>
                    <p className="text-slate-500 text-sm">
                      Income va expense qo‘shing
                    </p>
                  </Link>

                  <Link
                    to="/transfers"
                    className="border rounded-2xl p-5 hover:bg-slate-50 transition"
                  >
                    <h3 className="font-semibold text-lg mb-1">Transfers</h3>
                    <p className="text-slate-500 text-sm">
                      Accountlar orasida pul o‘tkazing
                    </p>
                  </Link>

                  <Link
                    to="/debts"
                    className="border rounded-2xl p-5 hover:bg-slate-50 transition"
                  >
                    <h3 className="font-semibold text-lg mb-1">Debts</h3>
                    <p className="text-slate-500 text-sm">
                      Qarz va haqdorliklarni yuriting
                    </p>
                  </Link>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}