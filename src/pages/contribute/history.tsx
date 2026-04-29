// src/pages/contribute/history.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ContribStatus = "pending" | "approved" | "rejected" | "warned";

interface ShopContrib {
  id: string;
  kind: "shop";
  name: string;
  municipality: string;
  province: string;
  type: string;
  barangay: string;
  lat: number;
  lng: number;
  contact: string | null;
  open_time: string | null;
  close_time: string | null;
  evidence_photo: string | null;
  status: ContribStatus;
  submitted_at: string;
  admin_note: string | null;
}

interface UpdateContrib {
  id: string;
  kind: "update";
  shop_name: string;
  shop_address: string;
  shop_type: string;
  reason: string;
  other_description: string | null;
  new_lat: number | null;
  new_lng: number | null;
  contact: string | null;
  open_time: string | null;
  close_time: string | null;
  evidence_photo: string | null;
  status: ContribStatus;
  submitted_at: string;
  admin_note: string | null;
}

type AnyContrib = ShopContrib | UpdateContrib;

const statusColors: Record<ContribStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  approved: "bg-green-100 text-green-700 border-green-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
  warned: "bg-orange-100 text-orange-700 border-orange-300",
};

const statusIcons: Record<ContribStatus, string> = {
  pending: "🕐",
  approved: "✅",
  rejected: "❌",
  warned: "⚠️",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Evidence Photo helper ──────────────────────────────────────────────────
function evidencePhotoSrc(filename: string | null): string | null {
  if (!filename) return null;
  return `/assets/evidence_photo/${filename}`;
}

// ─── Summary Modal ─────────────────────────────────────────────────────────────
function SummaryModal({
  item,
  onClose,
}: {
  item: AnyContrib;
  onClose: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const photoSrc =
    item.kind === "shop"
      ? evidencePhotoSrc(item.evidence_photo)
      : evidencePhotoSrc(item.evidence_photo);

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex justify-between items-center px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-base">
            Submission Summary
          </h2>
          <button onClick={onClose} className="text-gray-400 text-xl">
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                statusColors[item.status]
              }`}
            >
              {statusIcons[item.status]}{" "}
              {item.status.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">
              {item.kind === "shop" ? "New Shop" : "Shop Update"}
            </span>
          </div>

          {/* Admin note if any */}
          {item.admin_note && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
              <span className="font-bold">Admin note:</span> {item.admin_note}
            </div>
          )}

          {/* Shop details */}
          {item.kind === "shop" ? (
            <div className="space-y-2 text-sm">
              <Row label="Shop Name" value={item.name} />
              <Row label="Barangay" value={item.barangay || "—"} />
              <Row label="Municipality" value={`${item.municipality}, ${item.province}`} />
              <Row label="Type" value={item.type} />
              <Row label="Hours" value={item.open_time && item.close_time ? `${item.open_time} – ${item.close_time}` : "—"} />
              <Row label="Contact" value={item.contact || "—"} />
              <Row label="Coordinates" value={`${item.lat?.toFixed(5)}, ${item.lng?.toFixed(5)}`} />
              <Row label="Submitted" value={formatDate(item.submitted_at)} />
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Row label="Shop" value={item.shop_name} />
              <Row label="Address" value={item.shop_address} />
              <Row label="Type" value={item.shop_type} />
              <Row label="Update Reason" value={item.reason} />
              {item.other_description && (
                <Row label="Description" value={item.other_description} />
              )}
              {item.new_lat && item.new_lng && (
                <Row label="New Location" value={`${item.new_lat.toFixed(5)}, ${item.new_lng.toFixed(5)}`} />
              )}
              <Row label="Submitted" value={formatDate(item.submitted_at)} />
            </div>
          )}

          {/* Evidence photo */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              EVIDENCE PHOTO
            </p>
            {photoSrc && !imgError ? (
              <img
                src={photoSrc}
                alt="Evidence"
                className="w-full rounded-xl object-cover max-h-52 border border-gray-200"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full bg-gray-100 rounded-xl flex items-center justify-center h-24 text-gray-400 text-sm">
                📷 No Evidence Photo
              </div>
            )}
          </div>

          {/* Google Maps link (if coords) */}
          {item.kind === "shop" && item.lat && item.lng && (
            <a
              href={`https://www.google.com/maps?q=${item.lat},${item.lng}&z=18`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-50 border border-blue-200 text-blue-700 font-semibold py-2 rounded-xl text-sm"
            >
              🗺️ View on Google Maps
            </a>
          )}
          {item.kind === "update" && item.new_lat && item.new_lng && (
            <a
              href={`https://www.google.com/maps?q=${item.new_lat},${item.new_lng}&z=18`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-50 border border-blue-200 text-blue-700 font-semibold py-2 rounded-xl text-sm"
            >
              🗺️ View New Location on Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-gray-500 text-xs font-semibold min-w-[100px]">{label}</span>
      <span className="text-gray-900 text-xs text-right">{value}</span>
    </div>
  );
}

// ─── Edit Shop Modal ────────────────────────────────────────────────────────────
function EditShopModal({
  item,
  onClose,
  onSaved,
}: {
  item: ShopContrib;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [type, setType] = useState(item.type);
  const [openTime, setOpenTime] = useState(item.open_time ?? "8:00");
  const [closeTime, setCloseTime] = useState(item.close_time ?? "18:00");
  const [contact, setContact] = useState(item.contact ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const { error: err } = await supabase
      .from("shops")
      .update({
        name: name.trim().toUpperCase(),
        type,
        open_time: openTime,
        close_time: closeTime,
        contact: contact.trim() || null,
      })
      .eq("id", item.id)
      .eq("status", "pending"); // only allow editing pending submissions
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex justify-between items-center px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-base">Edit Submission</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase">Shop Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-gray-300 focus:border-green-600 outline-none py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full border-b border-gray-300 focus:border-green-600 outline-none py-2 text-sm bg-transparent">
              <option>Vulcanizing</option>
              <option>Motorshop</option>
              <option>Motorshop &amp; Vulcanizing</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase">Opens</label>
              <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                className="w-full border-b border-gray-300 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase">Closes</label>
              <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                className="w-full border-b border-gray-300 py-2 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase">Contact</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)}
              placeholder="09XX XXX XXXX"
              className="w-full border-b border-gray-300 focus:border-green-600 outline-none py-2 text-sm" />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-full">
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({
  item,
  onClose,
  onDeleted,
}: {
  item: AnyContrib;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const table = item.kind === "shop" ? "shops" : "shop_updates";
    await supabase.from(table).delete().eq("id", item.id);
    onDeleted();
    onClose();
  };

  const displayName =
    item.kind === "shop" ? item.name : item.shop_name;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="text-4xl mb-3">🗑️</div>
        <h2 className="font-extrabold text-gray-900 text-lg mb-1">
          Delete Submission
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-bold">{displayName}</span>? This cannot be
          undone.
        </p>
        <div className="space-y-2">
          <button onClick={handleDelete} disabled={deleting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full transition-colors">
            {deleting ? "Deleting…" : "🗑️ Yes, Delete"}
          </button>
          <button onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-full">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Contribution Card ─────────────────────────────────────────────────────────
function ContribCard({
  item,
  onSummary,
  onEdit,
  onDelete,
}: {
  item: AnyContrib;
  onSummary: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const canEdit = item.status === "pending";
  const displayName = item.kind === "shop" ? item.name : item.shop_name;
  const displayAddress =
    item.kind === "shop"
      ? `${item.municipality}, ${item.province}`
      : item.shop_address;
  const displayType = item.kind === "shop" ? item.type : item.shop_type;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-4">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusIcons[item.status]}</span>
            <div>
              <p className="font-extrabold text-gray-900 text-sm leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-gray-500">
                {displayAddress} • {displayType}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(item.submitted_at)}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              statusColors[item.status]
            }`}
          >
            {item.status.toUpperCase()}
          </span>
        </div>

        {/* Update reason pill */}
        {item.kind === "update" && (
          <div className="mt-1 mb-2">
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              {item.reason}
            </span>
          </div>
        )}

        {/* Admin note */}
        {item.admin_note && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-800 mb-2">
            ⚠️ {item.admin_note}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-gray-100 px-4 py-3 flex gap-2 flex-wrap">
        {/* Summary */}
        <button
          onClick={onSummary}
          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-xl text-xs transition-colors border border-gray-200"
        >
          📋 Summary
        </button>

        {/* Edit (pending only) */}
        {canEdit && item.kind === "shop" && (
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 rounded-xl text-xs transition-colors border border-blue-200"
          >
            ✏️ Edit
          </button>
        )}

        {/* Delete */}
        <button
          onClick={onDelete}
          className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-3 rounded-xl text-xs transition-colors border border-red-200"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function MyContributions() {
  const router = useRouter();
  
  const { user } = useAuth();

  const [contributions, setContributions] = useState<AnyContrib[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string>(
    (router.query.success as string) ?? ""
  );

  // Modal states
  const [summaryItem, setSummaryItem] = useState<AnyContrib | null>(null);
  const [editItem, setEditItem] = useState<ShopContrib | null>(null);
  const [deleteItem, setDeleteItem] = useState<AnyContrib | null>(null);

  const fetchContributions = async () => {
    if (!user) return;
    setLoading(true);

    const [shopsRes, updatesRes] = await Promise.all([
      supabase
        .from("shops")
        .select("*")
        .eq("submitted_by", user.email)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("shop_updates")
        .select("*")
        .eq("submitted_by", user.email)
        .order("submitted_at", { ascending: false }),
    ]);

    const shops: ShopContrib[] = (shopsRes.data ?? []).map((s) => ({
      ...s,
      kind: "shop" as const,
    }));
    const updates: UpdateContrib[] = (updatesRes.data ?? []).map((u) => ({
      ...u,
      kind: "update" as const,
    }));

    // Merge and sort by date descending
    const merged = [...shops, ...updates].sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
    setContributions(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchContributions();
  }, [user]);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button onClick={() => router.back()} className="text-gray-600 text-xl font-bold">
          ‹
        </button>
        <h1 className="text-xl font-extrabold tracking-wide text-gray-900">
          MY CONTRIBUTIONS
        </h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Success toast */}
        {successMsg && (
          <div className="bg-green-50 border border-green-300 text-green-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
            ✅ {successMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : contributions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No contributions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contributions.map((item) => (
              <ContribCard
                key={`${item.kind}-${item.id}`}
                item={item}
                onSummary={() => setSummaryItem(item)}
                onEdit={() => item.kind === "shop" && setEditItem(item as ShopContrib)}
                onDelete={() => setDeleteItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {summaryItem && (
        <SummaryModal item={summaryItem} onClose={() => setSummaryItem(null)} />
      )}
      {editItem && (
        <EditShopModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={fetchContributions}
        />
      )}
      {deleteItem && (
        <DeleteConfirmModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onDeleted={fetchContributions}
        />
      )}
    </div>
  );
}
