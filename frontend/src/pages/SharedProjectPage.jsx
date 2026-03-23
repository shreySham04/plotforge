import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getSharedProject } from "../services/projectService";
import { extractApiError } from "../utils/errors";

export default function SharedProjectPage() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getSharedProject(token);
        setProject(data.project);
        setContent(data.content || []);
      } catch (err) {
        setError(extractApiError(err, "Could not load shared project"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading && <div className="card text-center text-slate-300">Loading shared project...</div>}
        {error && <div className="card text-rose-400">{error}</div>}

        {!loading && !error && project && (
          <section className="space-y-4">
            <div className="card">
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <p className="mt-1 text-sm text-blue-300">{project.type} • Shared read-only</p>
            </div>

            {content.map((section) => (
              <article key={section.id ?? section.sectionNumber} className="card">
                <h3 className="mb-2 text-sm font-semibold text-blue-300">
                  {project.type === "SCRIPT" ? "Scene" : "Chapter"} {section.sectionNumber}
                </h3>
                <pre className="whitespace-pre-wrap text-sm text-slate-200">{section.text}</pre>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
