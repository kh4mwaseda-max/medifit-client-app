"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Card,
  StatCard,
  Badge,
  Avatar,
  Input,
  Select,
  Tabs,
  Icon,
  cn,
} from "@/components/cf/primitives";
import { BarChart, Sparkline } from "@/components/cf/charts";

type Client = {
  id: string;
  name: string;
  goal: string | null;
  startKg: number | null;
  curKg: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  lastActiveHours: number;
  flag: "ok" | "warn" | "alert";
  weightSeries: number[];
  lineLinked: boolean;
  startDate: string;
};

type Activity = {
  id: string;
  clientId: string;
  clientName: string;
  type: "body" | "training" | "meal";
  label: string;
  detail: string;
  at: string;
  icon: string;
};

type Props = {
  stats: {
    totalClients: number;
    todayLogs: number;
    needsAttention: number;
    lineUsageUsed: number;
    lineUsageCap: number;
  };
  clients: Client[];
  needsAttention: { clientId: string; name: string; reason: string }[];
  volumeSeries: number[];
  activity: Activity[];
};

function lastActiveLabel(hours: number): string {
  if (hours >= 9999) return "記録なし";
  if (hours < 1) return "1時間以内";
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function relativeTime(at: string): string {
  const diffMs = Date.now() - new Date(at).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function courseFromGoal(goal: string | null): string {
  if (!goal) return "—";
  if (goal.includes("減量") || goal.includes("ダイエット")) return "減量";
  if (goal.includes("バルク") || goal.includes("増量")) return "バルクアップ";
  if (goal.includes("大会")) return "大会準備";
  if (goal.includes("健康")) return "健康維持";
  return "ボディメイク";
}

function courseTone(course: string): "brand" | "amber" | "red" | "slate" {
  if (course === "減量") return "brand";
  if (course === "バルクアップ") return "amber";
  if (course === "大会準備") return "red";
  return "slate";
}

const activityTints: Record<Activity["type"], string> = {
  meal: "bg-amber-100 text-amber-600",
  training: "bg-brand-100 text-brand-600",
  body: "bg-emerald-100 text-emerald-600",
};

export function DashboardView({
  stats,
  clients,
  needsAttention,
  volumeSeries,
  activity,
}: Props) {
  const [sortBy, setSortBy] = React.useState("lastActive");
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    let list = [...clients];
    if (filter === "attention")
      list = list.filter((c) => c.flag === "alert" || c.flag === "warn");
    if (filter === "active")
      list = list.filter((c) => c.lastActiveHours <= 24);
    if (query) list = list.filter((c) => c.name.includes(query));
    if (sortBy === "lastActive")
      list.sort((a, b) => a.lastActiveHours - b.lastActiveHours);
    if (sortBy === "weight")
      list.sort(
        (a, b) =>
          (b.startKg ?? 0) -
          (b.curKg ?? 0) -
          ((a.startKg ?? 0) - (a.curKg ?? 0)),
      );
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filter, sortBy, query, clients]);

  const lineRemaining = Math.max(
    0,
    stats.lineUsageCap - stats.lineUsageUsed,
  );

  return (
    <>
      {/* Top actions (mobile) */}
      <div className="flex md:hidden gap-2 mb-4">
        <Input
          icon="search"
          placeholder="クライアントを検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Link href="/trainer/clients/new">
          <Button variant="primary" icon="user-plus">
            追加
          </Button>
        </Link>
      </div>
      <div className="hidden md:flex gap-2 mb-4 items-center justify-end">
        <Input
          icon="search"
          placeholder="クライアントを検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64"
        />
        <Link href="/trainer/clients/new">
          <Button variant="primary" icon="user-plus">
            新規クライアント
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="総クライアント数"
          value={stats.totalClients}
          unit="人"
          icon="users"
          iconTint="brand"
        />
        <StatCard
          label="今日の記録件数"
          value={stats.todayLogs}
          unit="件"
          icon="activity"
          iconTint="emerald"
        />
        <StatCard
          label="要対応"
          value={stats.needsAttention}
          unit="件"
          icon="alert-triangle"
          iconTint={stats.needsAttention > 0 ? "red" : "slate"}
          subtitle="30時間以上 記録なし"
        />
        <StatCard
          label="LINE月使用枚数"
          value={`${stats.lineUsageUsed}/${stats.lineUsageCap}`}
          unit="通"
          icon="message-circle"
          iconTint="slate"
          subtitle={`残り ${lineRemaining} 通`}
        />
      </div>

      {/* Needs attention banner */}
      {needsAttention.length > 0 && (
        <Card className="mt-4 p-4 border-red-200 bg-red-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Icon name="alert-triangle" className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-red-700">
                要対応クライアント {needsAttention.length} 名
              </div>
              <div className="text-sm text-red-600/80 mt-1">
                記録が30時間以上停止しています。LINEで声かけをおすすめします。
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {needsAttention.map((n) => (
                  <Link
                    key={n.clientId}
                    href={`/trainer/clients/${n.clientId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white border border-red-200 px-3 py-1.5 hover:bg-red-50 transition"
                  >
                    <Avatar name={n.name} size={22} />
                    <span className="text-sm font-bold text-ink-800">
                      {n.name}
                    </span>
                    <span className="text-xs text-red-600">{n.reason}</span>
                    <Icon name="chevron-right" className="text-red-500" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Two column: volume chart + activity feed */}
      <div className="mt-6 grid xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-ink-800">週のアクティビティ</div>
              <div className="text-xs text-ink-500 mt-0.5">
                過去14日間の記録件数
              </div>
            </div>
            <Tabs
              variant="pill"
              value="14d"
              onChange={() => {}}
              tabs={[
                { value: "7d", label: "7日" },
                { value: "14d", label: "14日" },
                { value: "30d", label: "30日" },
              ]}
            />
          </div>
          <BarChart
            data={volumeSeries}
            height={220}
            yFormat={(v) => (v >= 1 ? Math.round(v).toString() : "0")}
          />
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <div className="font-bold text-ink-800">最新アクティビティ</div>
          </div>
          <div className="divide-y divide-ink-100 max-h-[260px] overflow-auto nice-scroll">
            {activity.length === 0 ? (
              <div className="p-5 text-sm text-ink-500 text-center">
                まだ記録がありません
              </div>
            ) : (
              activity.map((a) => (
                <Link
                  key={a.id}
                  href={`/trainer/clients/${a.clientId}`}
                  className="w-full flex items-start gap-3 px-5 py-3 hover:bg-ink-50 text-left transition"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      activityTints[a.type],
                    )}
                  >
                    <Icon name={a.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-ink-800">
                        {a.clientName}
                      </span>
                      <span className="text-ink-500">{a.label}</span>
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5 truncate">
                      {a.detail}
                    </div>
                  </div>
                  <div className="text-[11px] text-ink-400 shrink-0 font-mono">
                    {relativeTime(a.at)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Clients table */}
      <Card className="mt-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="font-bold text-ink-800">クライアント一覧</div>
            <Badge tone="slate">
              {filtered.length} / {clients.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              variant="pill"
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: "all", label: "すべて" },
                { value: "active", label: "活動中" },
                { value: "attention", label: "要対応" },
              ]}
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-48"
            >
              <option value="lastActive">並び: 最終活動日</option>
              <option value="weight">並び: 減量達成度</option>
              <option value="name">並び: 名前順</option>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="text-left text-[11px] text-ink-500 uppercase tracking-wider bg-ink-50/50 border-b border-ink-100">
                <th className="py-3 px-5 font-bold">クライアント</th>
                <th className="py-3 px-3 font-bold">コース</th>
                <th className="py-3 px-3 font-bold">最終活動</th>
                <th className="py-3 px-3 font-bold">現体重</th>
                <th className="py-3 px-3 font-bold">変化</th>
                <th className="py-3 px-3 font-bold">推移</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-sm text-ink-500"
                  >
                    {clients.length === 0
                      ? "まだクライアントがいません。右上から追加してください。"
                      : "条件に一致するクライアントがいません。"}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const course = courseFromGoal(c.goal);
                  const diff =
                    c.curKg != null && c.startKg != null
                      ? +(c.curKg - c.startKg).toFixed(1)
                      : null;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60 transition"
                    >
                      <td className="py-3 px-5">
                        <Link
                          href={`/trainer/clients/${c.id}`}
                          className="flex items-center gap-3"
                        >
                          <Avatar name={c.name} size={36} />
                          <div className="min-w-0">
                            <div className="font-bold text-ink-800 flex items-center gap-1.5">
                              {c.name}
                              {c.flag === "alert" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              )}
                              {!c.lineLinked && (
                                <Badge tone="slate" className="!text-[9px]">
                                  LINE未連携
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-ink-500 truncate max-w-[220px]">
                              {c.goal || "—"}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <Badge tone={courseTone(course)}>{course}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs",
                            c.flag === "alert"
                              ? "text-red-600 font-bold"
                              : "text-ink-600",
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              c.flag === "alert"
                                ? "bg-red-500 pulse-dot"
                                : c.lastActiveHours < 6
                                  ? "bg-emerald-500"
                                  : "bg-ink-300",
                            )}
                          />
                          {lastActiveLabel(c.lastActiveHours)}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-ink-800">
                        {c.curKg != null ? (
                          <>
                            {c.curKg}
                            <span className="text-ink-500 font-sans font-normal text-xs ml-0.5">
                              kg
                            </span>
                          </>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-sm">
                        {diff == null ? (
                          <span className="text-ink-400">—</span>
                        ) : diff < 0 ? (
                          <span className="text-emerald-600 font-bold">
                            {diff} kg
                          </span>
                        ) : diff > 0 ? (
                          <span className="text-brand-600 font-bold">
                            +{diff} kg
                          </span>
                        ) : (
                          <span className="text-ink-500">±0</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {c.weightSeries.length >= 2 ? (
                          <Sparkline
                            data={c.weightSeries}
                            width={90}
                            height={28}
                            color={
                              diff != null && diff < 0
                                ? "#10b981"
                                : diff != null && diff > 0
                                  ? "#3b82f6"
                                  : "#64748b"
                            }
                          />
                        ) : (
                          <span className="text-ink-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <Link
                          href={`/trainer/clients/${c.id}`}
                          className="inline-flex items-center gap-1 text-ink-400 hover:text-brand-600"
                        >
                          <Icon name="chevron-right" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
