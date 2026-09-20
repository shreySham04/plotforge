import { useEffect, useState } from "react";
import { getMyInvitations, respondToInvitation } from "../services/projectService";

export default function CollaborationInvitationsCard({ onInvitationProcessed }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  async function fetchInvitations() {
    setLoading(true);
    try {
      const data = await getMyInvitations();
      setInvitations(Array.isArray(data) ? data : []);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvitations();
  }, []);

  async function handleRespond(id, action, projectTitle) {
    try {
      setActionMsg("");
      await respondToInvitation(id, action);
      if (action === "ACCEPT") {
        setActionMsg(`✅ Accepted collaboration request for "${projectTitle}"!`);
      } else {
        setActionMsg(`Declined invitation for "${projectTitle}".`);
      }
      await fetchInvitations();
      if (onInvitationProcessed) {
        onInvitationProcessed();
      }
    } catch {
      setActionMsg("Failed to process invitation request.");
    }
  }

  if (loading && invitations.length === 0) {
    return null;
  }

  if (invitations.length === 0 && !actionMsg) {
    return null;
  }

  return (
    <div className="card border-2 border-teal-500/40 bg-teal-500/5 dark:bg-teal-950/20 p-5 shadow-xl transition-all">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📩</span>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Collaboration Requests
          </h2>
          {invitations.length > 0 && (
            <span className="rounded-full bg-teal-500 px-2.5 py-0.5 text-xs font-black text-slate-950">
              {invitations.length}
            </span>
          )}
        </div>
      </div>

      {actionMsg && (
        <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-3 bg-teal-500/10 p-2 rounded-lg border border-teal-500/20">
          {actionMsg}
        </p>
      )}

      {invitations.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No pending collaboration invitations.</p>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {inv.projectTitle}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Invited by <strong className="text-teal-600 dark:text-teal-400">{inv.invitedByUsername}</strong> as{" "}
                  <span className="inline-block rounded bg-teal-500/10 text-teal-600 dark:text-teal-300 px-1.5 py-0.5 text-[11px] font-bold">
                    {inv.role}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(inv.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRespond(inv.id, "ACCEPT", inv.projectTitle)}
                  className="btn text-xs py-1.5 px-4 font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(inv.id, "REJECT", inv.projectTitle)}
                  className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-3 py-1.5 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
