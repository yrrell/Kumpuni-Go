// src/pages/contribute/history.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ContribStatus = "pending" | "approved" | "rejected" | "warned";

const HOUR_LABELS: Record<number, string> = {
  0:"12:00 AM",1:"1:00 AM",2:"2:00 AM",3:"3:00 AM",4:"4:00 AM",5:"5:00 AM",
  6:"6:00 AM",7:"7:00 AM",8:"8:00 AM",9:"9:00 AM",10:"10:00 AM",11:"11:00 AM",
  12:"12:00 PM",13:"1:00 PM",14:"2:00 PM",15:"3:00 PM",16:"4:00 PM",17:"5:00 PM",
  18:"6:00 PM",19:"7:00 PM",20:"8:00 PM",21:"9:00 PM",22:"10:00 PM",23:"11:00 PM",
};

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatHour(h: number | null): string {
  if (h === null || h === undefined) return "—";
  return HOUR_LABELS[h] ?? `${h}:00`;
}

function formatWorkDays(days: number[] | null): string {
  if (!days || days.length === 0) return "—";
  return days.map((d) => DAY_NAMES[d] ?? d).join(", ");
}

interface ShopContrib {
  id: string; kind: "shop";
  name: string; brgy: string; municipality: string; province: string; type: string;
  lat: number; lng: number; contact: string | null;
  open_time: number | null; close_time: number | null; work_days: number[] | null;
  evidence_url: string | null; status: ContribStatus;
  rejection_reason: string | null; submitted_at: string;
}

interface UpdateContrib {
  id: string; kind: "update"; shop_id: number;
  original_name: string; updated_name: string;
  updated_brgy: string | null; updated_municipality: string | null; updated_province: string | null;
  updated_type: string | null; updated_contact: string | null;
  updated_open_time: number | null; updated_close_time: number | null;
  updated_work_days: number[] | null; update_note: string | null;
  change_types: string[]; evidence_url: string | null;
  updated_lat: number | null; updated_lng: number | null;
  status: ContribStatus; rejection_reason: string | null; submitted_at: string;
}

type AnyContrib = ShopContrib | UpdateContrib;

const statusColors: Record<ContribStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  approved: "bg-green-100 text-green-700 border-green-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
  warned: "bg-orange-100 text-orange-700 border-orange-300",
};

const statusIcons: Record<ContribStatus, string> = {
  pending: "🕐", approved: "✅", rejected: "❌", warned: "⚠️",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-gray-500 text-xs font-semibold min-w-[110px]">{label}</span>
      <span className="text-theme text-xs text-right flex-1">{value}</span>
    </div>
  );
}

// ─── Summary Modal ─────────────────────────────────────────────────────────────
function SummaryModal({ item, onClose }: { item: AnyContrib; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex justify-between items-center px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-extrabold text-theme text-base">
            {item.kind === "shop" ? "📋 New Shop Submission" : "📋 Shop Update Submission"}
          </h2>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[item.status]}`}>
              {statusIcons[item.status]} {item.status.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">{formatDate(item.submitted_at)}</span>
          </div>

          {item.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-800">
              <span className="font-bold">Rejection reason:</span> {item.rejection_reason}
            </div>
          )}

          {item.kind === "shop" ? (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Shop Details</p>
              <Row label="Shop Name" value={item.name} />
              <Row label="Barangay" value={item.brgy || "—"} />
              <Row label="Municipality" value={item.municipality || "—"} />
              <Row label="Province" value={item.province || "—"} />
              <Row label="Type" value={item.type} />
              <Row label="Opens" value={formatHour(item.open_time)} />
              <Row label="Closes" value={formatHour(item.close_time)} />
              <Row label="Work Days" value={formatWorkDays(item.work_days)} />
              <Row label="Contact" value={item.contact || "—"} />
              <Row label="Coordinates" value={`${item.lat?.toFixed(5)}, ${item.lng?.toFixed(5)}`} />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Update Details</p>
              <Row label="Original Shop" value={item.original_name} />
              <Row label="Updated Name" value={item.updated_name || "—"} />
              <Row label="Barangay" value={item.updated_brgy || "—"} />
              <Row label="Municipality" value={item.updated_municipality || "—"} />
              <Row label="Province" value={item.updated_province || "—"} />
              <Row label="Updated Type" value={item.updated_type || "—"} />
              <Row label="Opens" value={formatHour(item.updated_open_time)} />
              <Row label="Closes" value={formatHour(item.updated_close_time)} />
              <Row label="Work Days" value={formatWorkDays(item.updated_work_days)} />
              <Row label="Contact" value={item.updated_contact || "—"} />
              {item.updated_lat && item.updated_lng && (
                <Row label="New Location" value={`${item.updated_lat.toFixed(5)}, ${item.updated_lng.toFixed(5)}`} />
              )}
              {item.update_note && <Row label="Note" value={item.update_note} />}
              {item.change_types?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {item.change_types.map((c) => (
                    <span key={c} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evidence Photo</p>
            {item.evidence_url && !imgError ? (
              <img src={item.evidence_url} alt="Evidence"
                className="w-full rounded-xl object-cover max-h-52 border border-gray-200"
                onError={() => setImgError(true)} />
            ) : (
              <div className="w-full bg-gray-100 rounded-xl flex items-center justify-center h-24 text-gray-400 text-sm">
                📷 No Evidence Photo
              </div>
            )}
          </div>

          {item.kind === "shop" && item.lat && item.lng && (
            <a href={`https://www.google.com/maps?q=${item.lat},${item.lng}&z=18`}
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-blue-50 border border-blue-200 text-blue-700 font-semibold py-2.5 rounded-xl text-sm">
              🗺️ View on Google Maps
            </a>
          )}
          {item.kind === "update" && item.updated_lat && item.updated_lng && (
            <a href={`https://www.google.com/maps?q=${item.updated_lat},${item.updated_lng}&z=18`}
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-blue-50 border border-blue-200 text-blue-700 font-semibold py-2.5 rounded-xl text-sm">
              🗺️ View New Location on Maps
            </a>
          )}
          <button onClick={onClose} className="w-full bg-gray-100 dark:bg-[#2a2a2a] text-theme font-bold py-3 rounded-full text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Shop Modal ────────────────────────────────────────────────────────────
function EditShopModal({ item, onClose, onSaved }: { item: ShopContrib; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(item.name);
  const [type, setType] = useState(item.type);
  const [openTime, setOpenTime] = useState<number>(item.open_time ?? 8);
  const [closeTime, setCloseTime] = useState<number>(item.close_time ?? 18);
  const [contact, setContact] = useState(item.contact ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  const handleSave = async () => {
    if (!name.trim()) { setError("Shop name is required."); return; }
    if (openTime >= closeTime) { setError("Opening time must be before closing time."); return; }
    setSaving(true);
    const { error: err } = await supabase.from("shops")
      .update({ name: name.trim().toUpperCase(), type, open_time: openTime, close_time: closeTime, contact: contact.trim() || null })
      .eq("id", item.id).eq("status", "pending");
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex justify-between items-center px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-extrabold text-theme text-base">✏️ Edit Submission</h2>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            ⚠️ You can only edit <strong>pending</strong> submissions.
          </p>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Shop Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-green-600 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-transparent focus:border-green-600 outline-none">
              <option value="Vulcanizing">Vulcanizing</option>
              <option value="Motorshop">Motorshop</option>
              <option value="Motorshop & Vulcanizing">Motorshop &amp; Vulcanizing</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Opens</label>
              <select value={openTime} onChange={(e) => setOpenTime(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none">
                {hourOptions.map((h) => <option key={h} value={h}>{HOUR_LABELS[h]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Closes</label>
              <select value={closeTime} onChange={(e) => setCloseTime(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none">
                {hourOptions.map((h) => <option key={h} value={h}>{HOUR_LABELS[h]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Contact</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="09XX XXX XXXX"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-green-600 outline-none" />
          </div>
          {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-full text-sm">
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>
          <button onClick={onClose} className="w-full bg-gray-100 dark:bg-[#2a2a2a] text-theme font-bold py-3 rounded-full text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ item, onClose, onDeleted }: { item: AnyContrib; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const table = item.kind === "shop" ? "shops" : "shop_updates";
    await supabase.from(table).delete().eq("id", item.id);
    onDeleted(); onClose();
  };

  const displayName = item.kind === "shop" ? item.name : item.original_name;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="text-4xl mb-3">🗑️</div>
        <h2 className="font-extrabold text-theme text-lg mb-1">Delete Submission?</h2>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete{" "}
          <span className="font-bold text-theme">&quot;{displayName}&quot;</span>?
          <br /><span className="text-xs text-red-500">This cannot be undone.</span>
        </p>
        <div className="space-y-2">
          <button onClick={handleDelete} disabled={deleting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-full text-sm">
            {deleting ? "Deleting…" : "🗑️ Yes, Delete"}
          </button>
          <button onClick={onClose} className="w-full bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 text-theme font-bold py-3 rounded-full text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Contribution Card ─────────────────────────────────────────────────────────
function ContribCard({ item, onSummary, onEdit, onDelete }: {
  item: AnyContrib; onSummary: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const canEdit = item.status === "pending";
  const isShop = item.kind === "shop";
  const displayName = isShop ? item.name : item.original_name;
  const displayAddress = isShop
    ? [item.brgy, item.municipality, item.province].filter(Boolean).join(", ")
    : [item.updated_brgy, item.updated_municipality].filter(Boolean).join(", ") || "—";
  const displayType = isShop ? item.type : item.updated_type ?? "—";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            isShop ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
          }`}>
            {isShop ? "🏪 New Shop" : "🔄 Update"}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[item.status]}`}>
            {statusIcons[item.status]} {item.status.toUpperCase()}
          </span>
        </div>

        <p className="font-extrabold text-theme text-sm leading-tight">{displayName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{displayAddress}</p>
        <p className="text-xs text-gray-400 mt-0.5">{displayType} • {formatDate(item.submitted_at)}</p>

        {item.kind === "update" && item.change_types?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.change_types.map((c) => (
              <span key={c} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
        )}

        {item.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs text-red-800 mt-2">
            ❌ {item.rejection_reason}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
        <button onClick={onSummary}
          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-xl text-xs border border-gray-200">
          📋 Summary
        </button>
        {canEdit && isShop && (
          <button onClick={onEdit}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 rounded-xl text-xs border border-blue-200">
            ✏️ Edit
          </button>
        )}
        {canEdit && (
          <button onClick={onDelete}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-3 rounded-xl text-xs border border-red-200">
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ contributions }: { contributions: AnyContrib[] }) {
  const pending = contributions.filter((c) => c.status === "pending").length;
  const approved = contributions.filter((c) => c.status === "approved").length;
  const rejected = contributions.filter((c) => c.status === "rejected").length;
  return (
    <div className="grid grid-cols-3 gap-2 mb-2">
      <div className="rounded-2xl border bg-amber-50 border-amber-200 text-amber-700 px-3 py-2 text-center">
        <p className="text-lg font-extrabold">{pending}</p>
        <p className="text-xs font-semibold">🕐 Pending</p>
      </div>
      <div className="rounded-2xl border bg-green-50 border-green-200 text-green-700 px-3 py-2 text-center">
        <p className="text-lg font-extrabold">{approved}</p>
        <p className="text-xs font-semibold">✅ Approved</p>
      </div>
      <div className="rounded-2xl border bg-red-50 border-red-200 text-red-700 px-3 py-2 text-center">
        <p className="text-lg font-extrabold">{rejected}</p>
        <p className="text-xs font-semibold">❌ Rejected</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MyContributions() {
  const router = useRouter();
  const { user } = useAuth();

  const [contributions, setContributions] = useState<AnyContrib[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string>((router.query.success as string) ?? "");
  const [filter, setFilter] = useState<"all" | ContribStatus>("all");

  const [summaryItem, setSummaryItem] = useState<AnyContrib | null>(null);
  const [editItem, setEditItem] = useState<ShopContrib | null>(null);
  const [deleteItem, setDeleteItem] = useState<AnyContrib | null>(null);

  const fetchContributions = async () => {
    if (!user) return;
    setLoading(true);

    const [shopsRes, updatesRes] = await Promise.all([
      supabase.from("shops").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("shop_updates").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    const shops: ShopContrib[] = (shopsRes.data ?? []).map((s) => ({
      id: String(s.id), kind: "shop" as const,
      name: s.name, brgy: s.brgy, municipality: s.municipality, province: s.province,
      type: s.type, lat: s.lat, lng: s.lng, contact: s.contact,
      open_time: s.open_time, close_time: s.close_time, work_days: s.work_days,
      evidence_url: s.evidence_url, status: s.status as ContribStatus,
      rejection_reason: s.rejection_reason, submitted_at: s.created_at,
    }));

    const updates: UpdateContrib[] = (updatesRes.data ?? []).map((u) => ({
      id: String(u.id), kind: "update" as const, shop_id: u.shop_id,
      original_name: u.original_name, updated_name: u.updated_name,
      updated_brgy: u.updated_brgy, updated_municipality: u.updated_municipality,
      updated_province: u.updated_province, updated_type: u.updated_type,
      updated_contact: u.updated_contact, updated_open_time: u.updated_open_time,
      updated_close_time: u.updated_close_time, updated_work_days: u.updated_work_days,
      update_note: u.update_note, change_types: u.change_types ?? [],
      evidence_url: u.evidence_url, updated_lat: u.updated_lat, updated_lng: u.updated_lng,
      status: u.status as ContribStatus, rejection_reason: u.rejection_reason ?? null,
      submitted_at: u.created_at,
    }));

    const merged = [...shops, ...updates].sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
    setContributions(merged);
    setLoading(false);
  };

  useEffect(() => { fetchContributions(); }, [user]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const filtered = filter === "all" ? contributions : contributions.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 flex items-center gap-3 px-4 pt-5 pb-4">
        <button onClick={() => router.back()} className="text-gray-600 text-2xl font-bold leading-none">‹</button>
        <div>
          <h1 className="text-lg font-extrabold tracking-wide text-theme leading-tight">MY CONTRIBUTIONS</h1>
          {!loading && (
            <p className="text-xs text-gray-400">{contributions.length} submission{contributions.length !== 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {successMsg && (
          <div className="bg-green-50 border border-green-300 text-green-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
            ✅ {successMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Loading contributions…</p>
          </div>
        ) : contributions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-bold text-gray-600">No contributions yet.</p>
            <p className="text-xs mt-1">Your submissions will appear here.</p>
          </div>
        ) : (
          <>
            <StatsBar contributions={contributions} />

            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    filter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"
                  }`}>
                  {f === "all" ? `All (${contributions.length})` : `${statusIcons[f as ContribStatus]} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No {filter} submissions.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((item) => (
                  <ContribCard
                    key={`${item.kind}-${item.id}`} item={item}
                    onSummary={() => setSummaryItem(item)}
                    onEdit={() => item.kind === "shop" && setEditItem(item as ShopContrib)}
                    onDelete={() => setDeleteItem(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {summaryItem && <SummaryModal item={summaryItem} onClose={() => setSummaryItem(null)} />}
      {editItem && <EditShopModal item={editItem} onClose={() => setEditItem(null)} onSaved={fetchContributions} />}
      {deleteItem && <DeleteConfirmModal item={deleteItem} onClose={() => setDeleteItem(null)} onDeleted={fetchContributions} />}
    </div>
  );
}
