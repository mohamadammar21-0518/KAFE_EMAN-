import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Eye, Mail, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AdminDeleteConfirmModal } from "@/admin/components/AdminDeleteConfirmModal";
import { AdminModal } from "@/admin/components/AdminModal";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { useAdminPermissions } from "@/admin/AdminPermissionsContext";
import { useAdminToken } from "@/admin/useAdminToken";
import { formatDateTime } from "@/admin/lib/format";
import { cn } from "@/lib/utils";

export function AdminMessagesPage() {
  const adminToken = useAdminToken();
  const { canDelete } = useAdminPermissions();
  const messages = useQuery(
    api.contactMessages.list,
    adminToken ? { adminToken } : "skip",
  );
  const updateStatus = useMutation(api.contactMessages.updateStatus);
  const removeMessage = useMutation(api.contactMessages.remove);
  const [viewMessage, setViewMessage] = useState<Doc<"contactMessages"> | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<Doc<"contactMessages"> | null>(null);

  const viewOpen = viewMessage !== null;

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "space-y-6 transition-[filter,opacity] duration-200",
          viewOpen && "pointer-events-none blur-[2px] opacity-90",
        )}
        aria-hidden={viewOpen}
      >
        <div>
          <h1 className="text-headline-lg text-coffee-dark">Get In Touch</h1>
          <p className="mt-1 text-sm text-muted">
            Messages submitted from the contact form on your website.
          </p>
        </div>

        {!messages ? (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            Loading messages…
          </p>
        ) : messages.length === 0 ? (
          <p className="rounded-2xl border border-outline/40 bg-white/70 p-8 text-center text-sm text-muted shadow-card">
            No messages yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {messages.map((msg) => (
              <article
                key={msg._id}
                className="flex flex-col rounded-2xl border border-outline/40 bg-white/70 p-5 shadow-card transition-shadow hover:shadow-soft"
              >
                <div className="min-h-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs text-muted">{msg.referenceId ?? "—"}</p>
                    <StatusBadge label={msg.status} variant="order" />
                  </div>
                  <h2 className="mt-2 line-clamp-2 font-semibold text-coffee-dark">{msg.name}</h2>
                  <p className="mt-1 truncate text-xs text-muted">{msg.email}</p>
                  {msg.subject ? (
                    <p className="mt-3 line-clamp-2 text-sm text-on-surface">
                      <Mail className="mr-1 inline h-3.5 w-3.5 text-muted" aria-hidden />
                      {msg.subject}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-muted">No subject</p>
                  )}
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{msg.message}</p>
                  <p className="mt-3 text-xs text-muted">{formatDateTime(msg.createdAt)}</p>
                </div>
                <div className="mt-4 flex gap-1 border-t border-outline/30 pt-4">
                  <button
                    type="button"
                    onClick={() => setViewMessage(msg)}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline/40 text-sm hover:bg-cream"
                    title="View message"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteMessage(msg)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <AdminDeleteConfirmModal
        open={deleteMessage !== null}
        onClose={() => setDeleteMessage(null)}
        itemName={
          deleteMessage
            ? `${deleteMessage.name}${deleteMessage.referenceId ? ` · ${deleteMessage.referenceId}` : ""}`
            : ""
        }
        entityLabel="message"
        confirmMode="checkbox"
        onConfirm={async () => {
          if (!adminToken || !deleteMessage) return;
          await removeMessage({
            adminToken,
            messageId: deleteMessage._id,
          });
          if (viewMessage?._id === deleteMessage._id) {
            setViewMessage(null);
          }
        }}
      />

      <AdminModal
        open={viewMessage !== null}
        onClose={() => setViewMessage(null)}
        title={viewMessage?.referenceId ?? viewMessage?.subject ?? "Contact message"}
        subtitle={viewMessage ? formatDateTime(viewMessage.createdAt) : undefined}
        softBackdrop
      >
        {viewMessage && (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-1">
                <StatusBadge label={viewMessage.status} variant="order" />
              </dd>
            </div>
            <div>
              <dt className="text-muted">From</dt>
              <dd className="mt-1 font-medium text-on-surface">{viewMessage.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-1 text-on-surface">{viewMessage.email}</dd>
            </div>
            {viewMessage.phone && (
              <div>
                <dt className="text-muted">Phone</dt>
                <dd className="mt-1 text-on-surface">{viewMessage.phone}</dd>
              </div>
            )}
            {viewMessage.subject && (
              <div>
                <dt className="text-muted">Subject</dt>
                <dd className="mt-1 text-on-surface">{viewMessage.subject}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Message</dt>
              <dd className="mt-1 whitespace-pre-wrap text-on-surface">{viewMessage.message}</dd>
            </div>
            <div>
              <dt className="text-muted">Update status</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {(["read", "archived", "pending"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={viewMessage.status === status || !adminToken}
                    onClick={() => {
                      if (!adminToken) return;
                      void updateStatus({
                        adminToken,
                        messageId: viewMessage._id,
                        status,
                      });
                    }}
                    className="rounded-full border border-outline/40 px-4 py-2 text-sm capitalize hover:bg-cream disabled:opacity-40"
                  >
                    Mark {status}
                  </button>
                ))}
              </dd>
            </div>
          </dl>
        )}
      </AdminModal>
    </div>
  );
}
