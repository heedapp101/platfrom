import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS, getDocumentUrl } from "../../config/api";

export default function AdminSettings() {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  // Get current profile pic URL
  const currentPic = user?.profilePic
    ? user.profilePic.startsWith("http")
      ? user.profilePic
      : getDocumentUrl(user.profilePic)
    : null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be less than 5MB" });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setMessage({ type: "error", text: "Display name cannot be empty" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("name", displayName.trim());
      if (selectedFile) {
        formData.append("profilePic", selectedFile);
      }

      const token = localStorage.getItem("token");
      const res = await fetch(API_ENDPOINTS.ADMIN.UPDATE_PROFILE, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      // Update local auth state
      updateUser({
        name: data.user.name,
        profilePic: data.user.profilePic,
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const avatarSrc = previewUrl || currentPic;
  const hasChanges = displayName.trim() !== (user?.name || "") || selectedFile;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Admin Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Profile Photo */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Profile Photo
          </label>
          <div className="flex items-center gap-5">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden group"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-slate-400 group-hover:text-blue-500">
                  {user?.username?.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {avatarSrc ? "Change Photo" : "Upload Photo"}
              </button>
              {(previewUrl || currentPic) && (
                <button
                  onClick={handleRemovePhoto}
                  className="text-sm text-slate-500 hover:text-red-500"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-slate-400">JPG, PNG. Max 5MB.</p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Display Name */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={50}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            This is shown in the top bar and across the admin panel. Your username <span className="font-medium text-slate-500">@{user?.username}</span> stays the same.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
            saving || !hasChanges
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Account Info (read-only) */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Account Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Username</span>
            <span className="font-medium text-slate-700">@{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-700">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <span className="font-medium text-slate-700 capitalize">{user?.role || user?.userType}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
