import { useEffect, useState } from "react";
import API_ENDPOINTS from "../../config/api";

export default function Legal() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    isRequired: true,
    isActive: true,
    bumpVersion: false,
  });

  const token = localStorage.getItem("token");

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.LEGAL.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDocs(data.docs || []);
    } catch (error) {
      console.error("Failed to load legal docs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      content: "",
      isRequired: true,
      isActive: true,
      bumpVersion: false,
    });
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? API_ENDPOINTS.LEGAL.UPDATE(editing._id) : API_ENDPOINTS.LEGAL.CREATE;
      const method = editing ? "PUT" : "POST";
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        content: form.content,
        isRequired: form.isRequired,
        isActive: form.isActive,
        bumpVersion: form.bumpVersion,
      };
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save");
      }
      resetForm();
      fetchDocs();
    } catch (error) {
      alert(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (doc) => {
    setEditing(doc);
    setForm({
      title: doc.title || "",
      slug: doc.slug || "",
      content: doc.content || "",
      isRequired: !!doc.isRequired,
      isActive: !!doc.isActive,
      bumpVersion: false,
    });
  };

  const handleToggle = async (doc, field) => {
    try {
      await fetch(API_ENDPOINTS.LEGAL.TOGGLE(doc._id), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: !doc[field] }),
      });
      fetchDocs();
    } catch (error) {
      console.error("Toggle failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Legal Documents</h1>
          <p className="text-slate-500">Manage terms, privacy policy, and other legal docs</p>
        </div>
        <button
          onClick={fetchDocs}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {/* Create / Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit Document" : "Create New Document"}
          </h2>
          {editing && (
            <button type="button" onClick={resetForm} className="text-sm text-slate-500">
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500">Title</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">Slug (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-500">Content</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 min-h-[180px]"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
        </div>

        <div className="flex flex-wrap gap-6 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
            />
            Required
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          {editing && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.bumpVersion}
                onChange={(e) => setForm({ ...form, bumpVersion: e.target.checked })}
              />
              Bump Version
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {saving ? "Saving..." : editing ? "Update Document" : "Create Document"}
        </button>
      </form>

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold">All Documents</h2>
        </div>
        {loading ? (
          <div className="p-6 text-slate-500">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="p-6 text-slate-500">No documents found.</div>
        ) : (
          <div className="divide-y">
            {docs.map((doc) => (
              <div key={doc._id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-xs text-slate-500">
                    slug: {doc.slug} • v{doc.version}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(doc, "isActive")}
                  className={`px-3 py-1.5 text-xs rounded-lg ${
                    doc.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {doc.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => handleToggle(doc, "isRequired")}
                  className={`px-3 py-1.5 text-xs rounded-lg ${
                    doc.isRequired ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {doc.isRequired ? "Required" : "Optional"}
                </button>
                <button
                  onClick={() => handleEdit(doc)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 text-white"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
