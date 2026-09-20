import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StoryEditor from "../components/StoryEditor";
import ScriptEditor from "../components/ScriptEditor";
import AICopilotModal from "../components/AICopilotModal";
import useWebSocket from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";
import { getPersonaById } from "../utils/aiPersonas";
import {
  addComment,
  deleteComment,
  getComments,
  getProjectContent,
  updateProjectContent
} from "../services/contentService";
import {
  getCollaborators,
  getProject,
  getProjectVersionHistory,
  inviteCollaborator,
  removeCollaborator,
  restoreProjectVersion
} from "../services/projectService";
import { publishEdit, publishTyping } from "../services/wsService";
import { extractApiError } from "../utils/errors";
import { safeArray } from "../utils/data";
import SubjectTag from "../components/SubjectTag";
import { getProjectGenres } from "../utils/genres";

function sectionPosition(sectionNumber) {
  return `section:${sectionNumber}`;
}

export default function ProjectEditorPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const projectId = Number(id);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [sectionNumber, setSectionNumber] = useState(1);
  const [text, setText] = useState("");
  const [content, setContent] = useState([]);
  const [history, setHistory] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [isExpanded, setIsExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const typingTimeoutRef = useRef(null);
  const [dirty, setDirty] = useState(false);

  const [invite, setInvite] = useState({ username: "", email: "", role: "EDITOR" });

  const canEdit = Boolean(project?.canEdit ?? true);
  const canManageCollaborators = project?.accessRole === "OWNER" || !project?.accessRole;

  const onSocketMessage = useCallback(
    (msg) => {
      if (msg.editedBy && msg.editedBy === user?.username) {
        return;
      }

      if (msg.messageType === "TYPING") {
        if (msg.editedBy) {
          setTypingUser(`${msg.editedBy} is typing...`);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(""), 1800);
        }
        return;
      }

      if (msg.sectionNumber === sectionNumber) {
        setText(msg.text || "");
      }

      setContent((prev) => {
        const next = [...prev];
        const existing = next.find((item) => item.sectionNumber === msg.sectionNumber);
        if (existing) {
          existing.text = msg.text;
        } else {
          next.push({ sectionNumber: msg.sectionNumber, text: msg.text });
        }
        return next.sort((a, b) => a.sectionNumber - b.sectionNumber);
      });
    },
    [sectionNumber, user?.username]
  );

  const socketRef = useWebSocket(projectId, onSocketMessage);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [projectData, contentData, collabData, commentsPage, historyPage] = await Promise.all([
        getProject(projectId).catch(() => ({ id: projectId, title: "Untitled Project", type: "STORY", accessRole: "OWNER", canEdit: true })),
        getProjectContent(projectId).catch(() => ({})),
        getCollaborators(projectId).catch(() => []),
        getComments(projectId, 0, 30).catch(() => ({ items: [] })),
        getProjectVersionHistory(projectId, 0, 20).catch(() => ({ items: [] }))
      ]);

      setProject(projectData);

      let parsedSections = [];
      if (Array.isArray(contentData)) {
        parsedSections = contentData;
      } else if (Array.isArray(contentData?.sections) && contentData.sections.length > 0) {
        parsedSections = contentData.sections;
      } else {
        const textBody = contentData?.storyContent || contentData?.scriptContent || "";
        parsedSections = [{ sectionNumber: 1, text: textBody }];
      }

      setContent(parsedSections);
      setCollaborators(safeArray(collabData));
      setComments(commentsPage.items || commentsPage.content || safeArray(commentsPage));
      setHistory(historyPage.items || historyPage.content || safeArray(historyPage));

      const initialSec = parsedSections.find((item) => item.sectionNumber === 1) || parsedSections[0];
      setText(initialSec?.text || "");
      setSectionNumber(initialSec?.sectionNumber || 1);
      setDirty(false);
    } catch (err) {
      setError(extractApiError(err, "Could not load project"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [projectId]);

  const handleSectionChange = useCallback(
    (newSec) => {
      const num = Number(newSec) || 1;
      setSectionNumber(num);
      const found = content.find((item) => item.sectionNumber === num);
      setText(found?.text || "");
      setDirty(false);
    },
    [content]
  );

  const doSave = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true);
    setError("");
    try {
      await updateProjectContent(projectId, {
        sectionNumber,
        text,
        storyContent: text,
        scriptContent: text
      });
      setDirty(false);
    } catch (err) {
      setError(extractApiError(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }, [canEdit, projectId, sectionNumber, text]);

  useEffect(() => {
    if (!canEdit || !dirty) return;

    const timer = setTimeout(() => {
      doSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [text, sectionNumber, canEdit, dirty, doSave]);

  const onTextChange = useCallback(
    (value) => {
      setText(value);
      setDirty(true);
      setContent((prev) => {
        const next = prev.filter((item) => item.sectionNumber !== sectionNumber);
        next.push({ sectionNumber, text: value });
        return next.sort((a, b) => a.sectionNumber - b.sectionNumber);
      });

      publishTyping(socketRef.current, projectId, {
        projectId,
        sectionNumber,
        editedBy: user?.username || "collaborator"
      });
      publishEdit(socketRef.current, projectId, {
        projectId,
        sectionNumber,
        text: value,
        editedBy: user?.username || "collaborator"
      });
    },
    [projectId, sectionNumber, socketRef, user?.username]
  );

  async function refreshSidebarData() {
    try {
      const [commentsPage, historyPage, collabData] = await Promise.all([
        getComments(projectId, 0, 30).catch(() => ({ items: [] })),
        getProjectVersionHistory(projectId, 0, 20).catch(() => ({ items: [] })),
        getCollaborators(projectId).catch(() => [])
      ]);
      setComments(commentsPage.items || commentsPage.content || []);
      setHistory(historyPage.items || historyPage.content || []);
      setCollaborators(Array.isArray(collabData) ? collabData : []);
    } catch {
      // ignore
    }
  }

  async function onInvite(e) {
    e.preventDefault();
    if (!canManageCollaborators) return;
    setError("");
    setSuccessMsg("");
    try {
      const res = await inviteCollaborator(projectId, invite);
      setSuccessMsg(res?.message || "Collaboration invitation sent!");
      setInvite({ username: "", email: "", role: "EDITOR" });
      await refreshSidebarData();
    } catch (err) {
      setError(extractApiError(err, "Failed to invite collaborator"));
    }
  }

  async function onRemove(userId) {
    if (!canManageCollaborators) return;
    try {
      await removeCollaborator(projectId, userId);
      await refreshSidebarData();
    } catch (err) {
      setError(extractApiError(err, "Failed to remove collaborator"));
    }
  }

  async function onAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({
        projectId,
        text: commentText.trim(),
        position: sectionPosition(sectionNumber)
      });
      setCommentText("");
      const commentsPage = await getComments(projectId, 0, 30);
      setComments(commentsPage.items || commentsPage.content || []);
    } catch (err) {
      setError(extractApiError(err, "Failed to add comment"));
    }
  }

  async function onDeleteComment(commentId) {
    try {
      await deleteComment(commentId);
      const commentsPage = await getComments(projectId, 0, 30);
      setComments(commentsPage.items || commentsPage.content || []);
    } catch (err) {
      setError(extractApiError(err, "Failed to delete comment"));
    }
  }

  async function onRestoreVersion(versionId) {
    if (!canEdit) return;
    try {
      await restoreProjectVersion(projectId, versionId);
      await loadAll();
    } catch (err) {
      setError(extractApiError(err, "Failed to restore version"));
    }
  }

  const editorProps = useMemo(
    () => ({
      sectionNumber,
      text,
      onSectionChange: handleSectionChange,
      onTextChange,
      onSave: doSave,
      readOnly: !canEdit,
      saving,
      isExpanded,
      onToggleExpand: () => setIsExpanded((prev) => !prev)
    }),
    [sectionNumber, text, handleSectionChange, onTextChange, doSave, canEdit, saving, isExpanded]
  );

  const editor = useMemo(() => {
    if (project?.type === "SCRIPT") {
      return <ScriptEditor {...editorProps} />;
    }
    return <StoryEditor {...editorProps} />;
  }, [project, editorProps]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-600 dark:text-slate-300">
          <div className="inline-block animate-spin text-3xl mb-3">✍️</div>
          <p className="text-sm font-semibold">Loading studio environment...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />
      <main className={`mx-auto grid w-full max-w-7xl gap-6 px-4 md:px-6 py-6 transition-all ${isExpanded ? "grid-cols-1" : "lg:grid-cols-[1fr_340px]"}`}>
        <section className="space-y-3">
          {typingUser && <p className="text-sm font-semibold text-teal-400 animate-pulse">{typingUser}</p>}
          {error && <p className="text-sm font-semibold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/30">{error}</p>}
          {successMsg && <p className="text-sm font-semibold text-teal-400 bg-teal-500/10 p-3 rounded-xl border border-teal-500/30">{successMsg}</p>}
          {!canEdit && <p className="text-sm text-amber-300">Read-only access: viewer permissions.</p>}
          {saving && <p className="text-xs text-slate-400 animate-pulse">Auto-saving to cloud...</p>}
          {editor}
        </section>

        {!isExpanded && (
          <aside className="space-y-4">
            <div className="card border border-slate-200 dark:border-slate-800 space-y-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{project?.title || "Project"}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-[var(--theme-glow)] border border-[var(--theme-ring)] theme-text text-xs font-bold px-2 py-0.5">{project?.type}</span>
                {project?.accessRole && <span className="text-xs text-slate-400">Role: {project?.accessRole}</span>}
              </div>

              {getProjectGenres(project).length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap gap-1">
                  {getProjectGenres(project).map((g) => (
                    <SubjectTag key={g} label={g} />
                  ))}
                </div>
              )}
            </div>

            <div className="card border border-slate-200 dark:border-slate-800">
              <h3 className="mb-2 font-bold text-slate-900 dark:text-slate-100 text-sm">Collaborators</h3>
              <p className="text-[11px] text-slate-500 mb-3">Invite writers to collaborate on this project with real-time editing.</p>
              <form onSubmit={onInvite} className="space-y-2">
                <input
                  className="input text-xs"
                  placeholder="Target Username"
                  value={invite.username}
                  onChange={(e) => setInvite({ ...invite, username: e.target.value })}
                  disabled={!canManageCollaborators}
                />
                <input
                  className="input text-xs"
                  placeholder="Or Email Address"
                  type="email"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  disabled={!canManageCollaborators}
                />
                <select
                  className="input text-xs"
                  value={invite.role}
                  onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                  disabled={!canManageCollaborators}
                >
                  <option value="EDITOR">EDITOR (Can Write & Edit)</option>
                  <option value="VIEWER">VIEWER (Read Only)</option>
                </select>
                <button className="btn w-full text-xs py-2 font-bold" type="submit" disabled={!canManageCollaborators}>
                  Send Invitation
                </button>
              </form>

              <ul className="mt-4 space-y-2 text-xs">
                {collaborators.length === 0 && <li className="text-slate-500 text-center py-2">No active collaborators.</li>}
                {collaborators.map((c) => (
                  <li key={c.id || c.userId || c.email} className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800/80 p-2.5">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{c.username || c.email} ({c.owner ? "OWNER" : c.role})</span>
                    {!c.owner && canManageCollaborators && (
                      <button className="text-rose-400 hover:underline font-semibold" onClick={() => onRemove(c.userId)}>
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card border border-slate-200 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Version History</h3>
                <button className="rounded-lg bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition" onClick={() => setHistoryOpen((v) => !v)}>
                  {historyOpen ? "Hide" : "Show"}
                </button>
              </div>
              {historyOpen && (
                <ul className="max-h-56 space-y-2 overflow-auto text-xs text-slate-300 mt-2">
                  {history.length === 0 && <li className="text-slate-500 py-1">No saved versions yet.</li>}
                  {history.map((h) => (
                    <li key={h.id} className="rounded-xl bg-slate-100 dark:bg-slate-800/80 p-2.5 border border-slate-200 dark:border-slate-700/50">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{h.username || "Snapshot"} saved</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{new Date(h.createdAt).toLocaleString()}</div>
                      {canEdit && (
                        <button className="mt-1 text-teal-600 dark:text-teal-400 font-bold hover:underline" onClick={() => onRestoreVersion(h.id)}>
                          Restore Version
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card border border-slate-200 dark:border-slate-800">
              <h3 className="mb-2 font-bold text-slate-900 dark:text-slate-100 text-sm">Comments & Feedback</h3>
              <form onSubmit={onAddComment} className="space-y-2">
                <textarea
                  className="input h-20 resize-none text-xs"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Comment for ${sectionPosition(sectionNumber)}`}
                />
                <button className="btn w-full text-xs py-2 font-bold" type="submit">Add Comment</button>
              </form>

              <ul className="mt-4 max-h-60 space-y-2 overflow-auto text-xs text-slate-300">
                {comments.length === 0 && <li className="text-slate-500 text-center py-2">No comments yet.</li>}
                {comments.map((comment) => (
                  <li key={comment.id} className="rounded-xl bg-slate-100 dark:bg-slate-800/80 p-2.5 border border-slate-200 dark:border-slate-700/50">
                    <div className="font-bold text-slate-900 dark:text-slate-200">{comment.username}</div>
                    <div className="text-[11px] text-teal-600 dark:text-teal-400">{comment.position}</div>
                    <div className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{comment.text}</div>
                    {(canManageCollaborators || comment.userId === user?.id) && (
                      <button className="mt-1 text-rose-400 font-semibold hover:underline" onClick={() => onDeleteComment(comment.id)}>
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </main>

      {/* Floating AI Co-pilot Button */}
      {(() => {
        const persona = getPersonaById(user?.aiPersona);
        return (
          <button
            onClick={() => setCopilotOpen(true)}
            className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl ${persona.buttonBg} px-4 py-3 font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer border`}
            title={`Consult ${persona.name}`}
          >
            <span className="text-lg">{persona.emoji}</span>
            <span>{persona.buttonText}</span>
          </button>
        );
      })()}

      {/* Agent 2 Co-pilot Modal */}
      <AICopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        projectTitle={project?.title || "Project"}
        storyContent={content.map((c) => c.text).join("\n\n")}
        scriptContent={text}
        onApplyScriptEdit={(newScript) => {
          onTextChange(newScript);
        }}
      />
    </div>
  );
}
