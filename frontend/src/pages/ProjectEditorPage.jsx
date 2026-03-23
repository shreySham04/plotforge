import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StoryEditor from "../components/StoryEditor";
import ScriptEditor from "../components/ScriptEditor";
import useWebSocket from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";
import {
  addComment,
  deleteComment,
  getComments,
  getProjectContent,
  getProjectHistory,
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
import RelationBadge from "../components/RelationBadge";
import SubjectTag from "../components/SubjectTag";

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

  const [sectionNumber, setSectionNumber] = useState(1);
  const [text, setText] = useState("");
  const [content, setContent] = useState([]);
  const [history, setHistory] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const typingTimeoutRef = useRef(null);
  const [dirty, setDirty] = useState(false);

  const [invite, setInvite] = useState({ username: "", email: "", role: "EDITOR" });

  const canEdit = Boolean(project?.canEdit);
  const canManageCollaborators = project?.accessRole === "OWNER";

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
        getProject(projectId),
        getProjectContent(projectId),
        getCollaborators(projectId),
        getComments(projectId, 0, 30),
        getProjectVersionHistory(projectId, 0, 20)
      ]);
      setProject(projectData);
      setContent(contentData);
      setCollaborators(collabData);
      setComments(commentsPage.items || []);
      setHistory(historyPage.items || []);
      const initial = contentData.find((item) => item.sectionNumber === 1);
      setText(initial?.text || "");
      setSectionNumber(1);
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
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const selected = content.find((item) => item.sectionNumber === sectionNumber);
    setText(selected?.text || "");
    setDirty(false);
  }, [sectionNumber, content]);

  const doSave = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const updated = await updateProjectContent(projectId, { sectionNumber, text });
      setContent((prev) => {
        const next = prev.filter((item) => item.sectionNumber !== sectionNumber);
        next.push(updated);
        return next.sort((a, b) => a.sectionNumber - b.sectionNumber);
      });
      setDirty(false);
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
    const [commentsPage, historyPage, collabData] = await Promise.all([
      getComments(projectId, 0, 30),
      getProjectVersionHistory(projectId, 0, 20),
      getCollaborators(projectId)
    ]);
    setComments(commentsPage.items || []);
    setHistory(historyPage.items || []);
    setCollaborators(collabData);
  }

  async function onInvite(e) {
    e.preventDefault();
    if (!canManageCollaborators) return;
    await inviteCollaborator(projectId, invite);
    setInvite({ username: "", email: "", role: "EDITOR" });
    await refreshSidebarData();
  }

  async function onRemove(userId) {
    if (!canManageCollaborators) return;
    await removeCollaborator(projectId, userId);
    await refreshSidebarData();
  }

  async function onAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment({
      projectId,
      text: commentText.trim(),
      position: sectionPosition(sectionNumber)
    });
    setCommentText("");
    const commentsPage = await getComments(projectId, 0, 30);
    setComments(commentsPage.items || []);
  }

  async function onDeleteComment(commentId) {
    await deleteComment(commentId);
    const commentsPage = await getComments(projectId, 0, 30);
    setComments(commentsPage.items || []);
  }

  async function onRestoreVersion(versionId) {
    if (!canEdit) return;
    await restoreProjectVersion(projectId, versionId);
    await loadAll();
  }

  const editorProps = useMemo(
    () => ({
      sectionNumber,
      text,
      onSectionChange: setSectionNumber,
      onTextChange,
      onSave: doSave,
      readOnly: !canEdit,
      saving
    }),
    [sectionNumber, text, onTextChange, doSave, canEdit, saving]
  );

  const editor = useMemo(() => {
    if (project?.type === "SCRIPT") {
      return <ScriptEditor {...editorProps} />;
    }
    return <StoryEditor {...editorProps} />;
  }, [project, editorProps]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base text-slate-100">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 text-center text-slate-300">Loading project...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          {typingUser && <p className="text-sm text-blue-300">{typingUser}</p>}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {!canEdit && <p className="text-sm text-amber-300">Read-only access: viewer permissions.</p>}
          {saving && <p className="text-xs text-slate-400">Auto-saving...</p>}
          {editor}
        </section>

        <aside className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold">{project?.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm text-blue-300">{project?.type}</p>
              <SubjectTag subjectName={project?.subjectName} />
              <RelationBadge relationType={project?.relationType} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Role: {project?.accessRole}</p>
            {project?.relationType && project.relationType !== "NONE" && (
              <p className="mt-2 text-xs text-slate-300">
                {project.relationType === "SEQUEL" ? "Sequel to" : project.relationType === "PREQUEL" ? "Prequel to" : "Spinoff of"}: {project.relatedProjectTitle || project.externalMediaTitle || (project.externalMediaId ? `TMDB #${project.externalMediaId}` : "-")}
              </p>
            )}
            {project?.type === "SCRIPT" && project?.linkedStoryTitle && (
              <p className="mt-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                Based on Story: {project.linkedStoryTitle}
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="mb-2 font-semibold">Collaborators</h3>
            <form onSubmit={onInvite} className="space-y-2">
              <input
                className="input"
                placeholder="Username"
                value={invite.username}
                onChange={(e) => setInvite({ ...invite, username: e.target.value })}
                disabled={!canManageCollaborators}
              />
              <input
                className="input"
                placeholder="Email"
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                disabled={!canManageCollaborators}
              />
              <select
                className="input"
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                disabled={!canManageCollaborators}
              >
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button className="btn w-full" type="submit" disabled={!canManageCollaborators}>
                Invite
              </button>
            </form>

            <ul className="mt-3 space-y-2 text-sm">
              {collaborators.map((c) => (
                <li key={c.id || c.userId} className="flex items-center justify-between rounded bg-slate-800 px-2 py-1">
                  <span>{c.username} ({c.owner ? "OWNER" : c.role})</span>
                  {!c.owner && canManageCollaborators && (
                    <button className="text-rose-400" onClick={() => onRemove(c.userId)}>
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Version History</h3>
              <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => setHistoryOpen((v) => !v)}>
                {historyOpen ? "Hide" : "Show"}
              </button>
            </div>
            {historyOpen && (
              <ul className="max-h-56 space-y-2 overflow-auto text-xs text-slate-300">
                {history.map((h) => (
                  <li key={h.id} className="rounded bg-slate-800 px-2 py-1">
                    <div>{h.username} saved snapshot</div>
                    <div className="text-[11px] text-slate-400">{new Date(h.createdAt).toLocaleString()}</div>
                    {canEdit && (
                      <button className="mt-1 text-blue-300" onClick={() => onRestoreVersion(h.id)}>
                        Restore
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3 className="mb-2 font-semibold">Comments</h3>
            <form onSubmit={onAddComment} className="space-y-2">
              <textarea
                className="input h-20 resize-none"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Comment for ${sectionPosition(sectionNumber)}`}
              />
              <button className="btn w-full" type="submit">Add Comment</button>
            </form>

            <ul className="mt-3 max-h-60 space-y-2 overflow-auto text-xs text-slate-300">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded bg-slate-800 px-2 py-1">
                  <div className="font-semibold text-slate-200">{comment.username}</div>
                  <div className="text-[11px] text-blue-300">{comment.position}</div>
                  <div className="mt-1 whitespace-pre-wrap">{comment.text}</div>
                  {(project?.accessRole === "OWNER" || comment.userId === user?.id) && (
                    <button className="mt-1 text-rose-400" onClick={() => onDeleteComment(comment.id)}>
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
