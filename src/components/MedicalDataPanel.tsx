"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import type { MynaPortalData, HealthCheckResult } from "@/lib/health-data-connector";
import { DATA_SOURCES } from "@/lib/health-data-connector";

interface Props {
  mynaData: MynaPortalData | null;
}

const SUBTABS = ["健康診断", "薬歴", "接続設定"] as const;
type Subtab = (typeof SUBTABS)[number];

export default function MedicalDataPanel({ mynaData }: Props) {
  const [subtab, setSubtab] = useState<Subtab>("健康診断");

  return (
    <div className="space-y-4">

      {/* 接続ステータスバー */}
      <ConnectionStatusBar mynaData={mynaData} />

      {/* サブタブ */}
      <nav className="bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
        {SUBTABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSubtab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              subtab === tab
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {subtab === "健康診断" && <HealthCheckTab data={mynaData} />}
      {subtab === "薬歴"     && <MedicationTab data={mynaData} />}
      {subtab === "接続設定" && <ConnectionSettingsTab connected={mynaData?.connected ?? false} />}
    </div>
  );
}

// ── 接続ステータスバー ─────────────────────────────────────────
function ConnectionStatusBar({ mynaData }: { mynaData: MynaPortalData | null }) {
  if (!mynaData?.connected) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🔗</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">マイナポータル未連携</p>
            <p className="text-xs text-amber-600 mt-0.5">連携すると健診・薬歴が自動取込されます</p>
          </div>
        </div>
        <button className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          連携する
        </button>
      </div>
    );
  }

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
          <span className="text-teal-600 text-sm">✓</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-teal-800">マイナポータル連携済み</p>
          <p className="text-xs text-teal-600 mt-0.5">
            最終同期: {mynaData.last_synced_at
              ? format(parseISO(mynaData.last_synced_at), "M月d日 HH:mm", { locale: ja })
              : "—"}
          </p>
        </div>
      </div>
      <button className="shrink-0 text-teal-600 hover:text-teal-800 text-xs font-medium border border-teal-200 px-3 py-1.5 rounded-xl transition-colors bg-white">
        同期
      </button>
    </div>
  );
}

// ── 健康診断タブ ──────────────────────────────────────────────
function HealthCheckTab({ data }: { data: MynaPortalData | null }) {
  if (!data?.connected || data.health_checks.length === 0) {
    return <EmptyState icon="🩺" message="健康診断データがありません" sub="マイナポータルと連携すると自動取込されます" />;
  }

  const latest = data.health_checks[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-500">
          {format(parseISO(latest.exam_date), "yyyy年M月d日", { locale: ja })}受診
        </p>
        {latest.institution_name && (
          <p className="text-xs text-slate-400">{latest.institution_name}</p>
        )}
      </div>

      {/* 身体計測 */}
      <Section title="身体計測">
        <div className="grid grid-cols-2 gap-2">
          <LabRow label="BMI" value={latest.bmi} unit="" ref_range="18.5〜24.9" />
          <LabRow label="腹囲" value={latest.waist_cm} unit="cm" ref_range="男性85cm未満" />
          <LabRow label="収縮期血圧" value={latest.systolic_bp} unit="mmHg" ref_range="130未満" />
          <LabRow label="拡張期血圧" value={latest.diastolic_bp} unit="mmHg" ref_range="85未満" />
        </div>
      </Section>

      {/* 血糖 */}
      <Section title="血糖値">
        <div className="grid grid-cols-2 gap-2">
          <LabRow label="空腹時血糖" value={latest.fasting_glucose} unit="mg/dL" ref_range="100未満" />
          <LabRow label="HbA1c" value={latest.hba1c} unit="%" ref_range="5.6未満" />
        </div>
      </Section>

      {/* 脂質 */}
      <Section title="脂質">
        <div className="grid grid-cols-2 gap-2">
          <LabRow label="総コレステロール" value={latest.total_cholesterol} unit="mg/dL" ref_range="220未満" />
          <LabRow label="LDLコレステロール" value={latest.ldl_cholesterol} unit="mg/dL" ref_range="120未満" />
          <LabRow label="HDLコレステロール" value={latest.hdl_cholesterol} unit="mg/dL" ref_range="40以上" higherIsBetter />
          <LabRow label="中性脂肪" value={latest.triglycerides} unit="mg/dL" ref_range="150未満" />
        </div>
      </Section>

      {/* 肝機能 */}
      <Section title="肝機能">
        <div className="grid grid-cols-3 gap-2">
          <LabRow label="AST(GOT)" value={latest.ast} unit="U/L" ref_range="30以下" />
          <LabRow label="ALT(GPT)" value={latest.alt} unit="U/L" ref_range="30以下" />
          <LabRow label="γ-GTP" value={latest.gamma_gtp} unit="U/L" ref_range="50以下" />
        </div>
      </Section>
    </div>
  );
}

// ── 薬歴タブ ─────────────────────────────────────────────────
function MedicationTab({ data }: { data: MynaPortalData | null }) {
  if (!data?.connected || data.medications.length === 0) {
    return <EmptyState icon="💊" message="薬歴データがありません" sub="マイナポータルと連携すると自動取込されます" />;
  }

  return (
    <div className="space-y-2.5">
      {data.medications.map((m, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700">{m.drug_name}</p>
            {m.condition_category && (
              <span className="shrink-0 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                {m.condition_category}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{m.dosage}</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>{format(parseISO(m.dispensed_date), "yyyy年M月d日", { locale: ja })}調剤</span>
            {m.days_supplied && <span>{m.days_supplied}日分</span>}
            {m.pharmacy_name && <span>{m.pharmacy_name}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 接続設定タブ ──────────────────────────────────────────────
function ConnectionSettingsTab({ connected }: { connected: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 px-1">対応データソース</p>
      {DATA_SOURCES.map((src) => (
        <div
          key={src.id}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-3"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-slate-700">{src.name}</p>
              <StatusBadge status={src.id === "myna_portal" && connected ? "available" : src.status} />
            </div>
            <p className="text-xs text-slate-400">{src.description}</p>
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {src.data_types.map((t) => (
                <span key={t} className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
              src.id === "myna_portal" && connected
                ? "bg-teal-50 text-teal-600 border border-teal-200"
                : "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
            disabled={!(src.id === "myna_portal" && connected)}
          >
            {src.id === "myna_portal" && connected ? "連携済み" : "準備中"}
          </button>
        </div>
      ))}

      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-xs text-blue-600 leading-relaxed">
        <p className="font-semibold mb-1">🔐 データの安全性について</p>
        <p className="text-blue-500">
          マイナポータルとの連携は公式APIを通じて行われます。データはお客様の同意のもとでのみ取得・保存されます。第三者への提供はありません。
        </p>
      </div>
    </div>
  );
}

// ── ユーティリティ ────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2.5">
      <p className="text-xs text-blue-600 font-semibold">{title}</p>
      {children}
    </div>
  );
}

function LabRow({
  label, value, unit, ref_range, higherIsBetter = false,
}: {
  label: string; value: number | null; unit: string; ref_range: string; higherIsBetter?: boolean;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5">
      <p className="text-[10px] text-slate-400 mb-1">{label}</p>
      <p className="text-base font-bold text-slate-700">
        {value ?? "—"}
        <span className="text-[10px] font-normal text-slate-400 ml-1">{unit}</span>
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">基準: {ref_range}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-teal-100 text-teal-700",
    planned:   "bg-slate-100 text-slate-500",
    in_review: "bg-amber-100 text-amber-700",
  };
  const labels: Record<string, string> = {
    available: "利用可能",
    planned:   "準備中",
    in_review: "審査中",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${styles[status] ?? styles.planned}`}>
      {labels[status] ?? "準備中"}
    </span>
  );
}

function EmptyState({ icon, message, sub }: { icon: string; message: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-14 space-y-2">
      <p className="text-3xl">{icon}</p>
      <p className="text-slate-400 text-sm">{message}</p>
      <p className="text-xs text-slate-300">{sub}</p>
    </div>
  );
}
