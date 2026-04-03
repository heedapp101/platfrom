import { useEffect, useState } from "react";
import { API_ENDPOINTS, getDocumentUrl } from "../../config/api";

const getSafeDocumentPath = (value) => {
  if (!value || value === "pending") return "";
  return value;
};

const getInterestLabel = (interest) => {
  if (typeof interest === "string") return interest;
  return interest?.tag || interest?.name || "";
};

const truncateText = (value, maxLength = 160) => {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
};

const getCityStatePin = (user = {}) =>
  [[user?.city, user?.state].filter(Boolean).join(", "), user?.pinCode].filter(Boolean).join(" - ");

const getFullAddress = (user = {}) => {
  const address = user?.address || "";
  const cityStatePin = getCityStatePin(user);

  if (address && cityStatePin && address.includes(cityStatePin)) {
    return address;
  }

  return [address, cityStatePin].filter(Boolean).join(", ");
};

const getDisplayLocation = (user = {}) =>
  getCityStatePin(user) || user?.location || user?.country || "";

const getBooleanLabel = (value) => (value ? "Yes" : "No");

const getShippingLabel = (user = {}) =>
  user?.delivery?.freeDelivery
    ? "Free"
    : `Rs ${Number(user?.delivery?.defaultShippingCharges ?? 0).toLocaleString("en-IN")}`;

const normalizeBusinessUser = (user = {}) => {
  const accountType = String(user?.accountType ?? user?.account_type ?? user?.userType ?? "").toLowerCase();
  const verification_status = String(
    user?.verification_status ?? (user?.isVerified ? "approved" : "pending")
  ).toLowerCase();
  const interests = Array.isArray(user?.interests)
    ? user.interests.map(getInterestLabel).filter(Boolean)
    : [];
  const profileImage = getSafeDocumentPath(
    user?.profile?.profileImage || user?.profileImage || user?.profilePic
  );
  const coverImage = getSafeDocumentPath(
    user?.profile?.coverImage || user?.coverImage || user?.bannerImg
  );
  const idProofTypeValue = user?.idProofType ?? user?.id_proof_type ?? "";
  const idProofType = idProofTypeValue === "pending" ? "Pending" : idProofTypeValue || "";
  const idProofUrl = getSafeDocumentPath(user?.idProofUrl || user?.id_proof_file);
  const cashOnDelivery =
    user?.delivery?.cashOnDelivery ?? user?.cashOnDelivery ?? user?.cashOnDeliveryAvailable ?? false;
  const onlyDelivery = user?.delivery?.onlyDelivery ?? user?.onlyDelivery ?? false;
  const freeDelivery = user?.delivery?.freeDelivery ?? user?.freeDelivery ?? user?.freeShipping ?? false;
  const defaultShippingCharges =
    Number(
      user?.delivery?.defaultShippingCharges ?? user?.defaultShippingCharges ?? user?.fixedShippingCharge ?? 0
    ) || 0;
  const returnPolicy = user?.delivery?.returnPolicy ?? user?.returnPolicy ?? "";
  const customQuestionsValue =
    user?.delivery?.customQuestions ?? user?.customQuestions ?? user?.customQuickQuestion ?? "";
  const customQuestions = Array.isArray(customQuestionsValue)
    ? customQuestionsValue.filter(Boolean).join(", ")
    : customQuestionsValue;
  const requestChatBeforePurchase =
    user?.delivery?.requestChatBeforePurchase ??
    user?.requestChatBeforePurchase ??
    user?.requireChatBeforePurchase ??
    false;
  const inventoryThreshold =
    Number(
      user?.delivery?.inventoryThreshold ?? user?.inventoryThreshold ?? user?.inventoryAlertThreshold ?? 0
    ) || 0;

  return {
    ...user,
    accountType,
    userType: user?.userType ?? accountType,
    companyName: user?.companyName || user?.name || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pinCode: user?.pinCode || "",
    country: user?.country || "",
    phone: user?.phone || "",
    gstNumber: user?.gstNumber || "",
    location: user?.location || getDisplayLocation(user),
    delivery: {
      cashOnDelivery,
      onlyDelivery,
      freeDelivery,
      defaultShippingCharges,
      returnPolicy,
      customQuestions,
      requestChatBeforePurchase,
      inventoryThreshold,
    },
    profile: {
      bio: user?.profile?.bio || user?.bio || "",
      profileImage,
      coverImage,
    },
    bio: user?.profile?.bio || user?.bio || "",
    profilePic: profileImage || user?.profilePic || "",
    bannerImg: coverImage || user?.bannerImg || "",
    interests,
    verification_status,
    idProofType,
    idProofUrl,
  };
};

export default function Approvals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchApprovals = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.APPROVALS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const rawUsers = Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : [];
      const users = rawUsers.map((user) => normalizeBusinessUser(user));

      console.log("Business User Data:", users);

      const pendingBusinesses = users.filter(
        (u) => u?.accountType === "business" && u?.verification_status === "pending"
      );

      if (res.ok) {
        setPendingUsers(pendingBusinesses);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id, action) => {
    if (!id) return;

    const token = localStorage.getItem("token");
    const verificationStatus = action === "approve" ? "approved" : "rejected";

    try {
      const res = await fetch(API_ENDPOINTS.USER.APPROVE, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: id,
          verification_status: verificationStatus,
        }),
      });

      if (res.ok) {
        setPendingUsers((prev) => prev.filter((u) => u?._id !== id));
        setSelectedUser(null);
      } else {
        alert("Action failed");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Pending Business Approvals</h1>

      {loading ? (
        <p className="text-slate-500">Loading requests...</p>
      ) : pendingUsers.length === 0 ? (
        <div className="text-slate-500 italic">No pending approvals found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingUsers.map((user) => (
            <div
              key={user?._id}
              onClick={() => setSelectedUser(user)}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                  {user?.profile?.profileImage ? (
                    <img
                      src={getDocumentUrl(user?.profile?.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                      {user?.companyName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "B"}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {user?.companyName || "N/A"}
                  </h3>
                  <p className="text-xs text-slate-500">Owner: {user?.name || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-1 text-sm text-slate-600 mb-4">
                <p><span className="font-semibold">Type:</span> {user?.productType || "N/A"}</p>
                <p><span className="font-semibold">Phone:</span> {user?.phone || "N/A"}</p>
                <p><span className="font-semibold">Address:</span> {truncateText(getFullAddress(user) || "N/A", 70)}</p>
                <p><span className="font-semibold">Loc:</span> {getDisplayLocation(user) || user?.country || "N/A"}</p>
                {user?.gstNumber && <p><span className="font-semibold">GST:</span> {user?.gstNumber}</p>}
                {user?.profile?.bio && <p><span className="font-semibold">Bio:</span> {truncateText(user?.profile?.bio, 70)}</p>}
              </div>

              <button className="w-full py-2 bg-slate-50 text-slate-600 rounded font-medium text-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                View Full Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Business Application Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex gap-6 mb-8">
                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border">
                  {selectedUser?.profile?.profileImage ? (
                    <img
                      src={getDocumentUrl(selectedUser?.profile?.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 text-4xl">🏢</div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{selectedUser?.companyName || "N/A"}</h3>
                  <p className="text-slate-500">@{selectedUser?.username || "N/A"}</p>
                  {selectedUser?.createdAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Applied: {new Date(selectedUser?.createdAt).toLocaleDateString()}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold">
                      {selectedUser?.productType || "Retail"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider border-b pb-1">Contact Info</h4>
                  <div className="grid grid-cols-[90px_1fr] gap-2 text-sm">
                    <span className="text-slate-500">Owner:</span>
                    <span className="font-medium">{selectedUser?.name || "N/A"}</span>
                    <span className="text-slate-500">Company:</span>
                    <span className="font-medium">{selectedUser?.companyName || "N/A"}</span>
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium truncate" title={selectedUser?.email || ""}>
                      {selectedUser?.email || "N/A"}
                    </span>
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-medium">{selectedUser?.phone || "N/A"}</span>
                    <span className="text-slate-500">Address:</span>
                    <span className="font-medium">{getFullAddress(selectedUser) || "N/A"}</span>
                    <span className="text-slate-500">City/State:</span>
                    <span className="font-medium">{getCityStatePin(selectedUser) || "N/A"}</span>
                    <span className="text-slate-500">Country:</span>
                    <span className="font-medium">{selectedUser?.country || "N/A"}</span>
                    <span className="text-slate-500">Status:</span>
                    <span className="font-medium capitalize">{selectedUser?.verification_status || "pending"}</span>
                  </div>
                  {selectedUser?.profile?.bio && (
                    <div className="mt-2">
                      <span className="text-slate-500 text-sm">Bio:</span>
                      <p className="text-sm font-medium mt-1 bg-slate-50 p-2 rounded">
                        {truncateText(selectedUser?.profile?.bio, 180)}
                      </p>
                    </div>
                  )}
                  {!!selectedUser?.interests?.length && (
                    <div className="mt-2">
                      <span className="text-slate-500 text-sm">Interests:</span>
                      <p className="text-sm font-medium mt-1 bg-slate-50 p-2 rounded">
                        {selectedUser?.interests?.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider border-b pb-1">Legal & ID Details</h4>
                  <div className="grid grid-cols-[90px_1fr] gap-2 text-sm">
                    <span className="text-slate-500">GST No:</span>
                    <span className="font-mono bg-slate-100 px-1 rounded">{selectedUser?.gstNumber || "N/A"}</span>
                    <span className="text-slate-500">ID Type:</span>
                    <span className="font-medium">{selectedUser?.idProofType || "N/A"}</span>
                    <span className="text-slate-500">ID Number:</span>
                    <span className="font-mono bg-slate-100 px-1 rounded">{selectedUser?.idProofNumber || "N/A"}</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-slate-500 text-sm mb-2">Attached ID Proof:</p>
                    {selectedUser?.idProofUrl ? (
                      selectedUser?.idProofUrl?.toLowerCase().includes(".pdf") ? (
                        <a
                          href={getDocumentUrl(selectedUser?.idProofUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col items-center justify-center w-full h-32 bg-slate-100 rounded border hover:bg-slate-200 transition-colors gap-2 text-slate-600"
                        >
                          <span className="text-4xl">📄</span>
                          <span className="text-sm font-bold">Click to View PDF Document</span>
                          <span className="text-xs text-slate-400">(Secure Link Generated)</span>
                        </a>
                      ) : (
                        <a
                          href={getDocumentUrl(selectedUser?.idProofUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full h-32 bg-slate-100 rounded border hover:opacity-90 transition-opacity overflow-hidden relative group"
                        >
                          <img
                            src={getDocumentUrl(selectedUser?.idProofUrl)}
                            alt="ID Proof"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                            Click to Enlarge
                          </div>
                        </a>
                      )
                    ) : (
                      <div className="w-full h-24 bg-red-50 text-red-500 border border-red-100 rounded flex items-center justify-center text-sm">
                        No ID Document Uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider border-b pb-1">Business Settings</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser?.delivery?.cashOnDelivery && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold">COD Available</span>
                    )}
                    {selectedUser?.delivery?.onlyDelivery && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold">Delivery Only</span>
                    )}
                    {selectedUser?.allIndiaDelivery && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold">All India Delivery</span>
                    )}
                    {selectedUser?.delivery?.freeDelivery && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-bold">Free Shipping</span>
                    )}
                    {selectedUser?.delivery?.requestChatBeforePurchase && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-bold">Chat Before Purchase</span>
                    )}
                    {selectedUser?.autoReplyEnabled && (
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded font-bold">Auto-Reply On</span>
                    )}
                    {!selectedUser?.delivery?.cashOnDelivery &&
                      !selectedUser?.delivery?.onlyDelivery &&
                      !selectedUser?.allIndiaDelivery &&
                      !selectedUser?.delivery?.freeDelivery &&
                      !selectedUser?.delivery?.requestChatBeforePurchase &&
                      !selectedUser?.autoReplyEnabled && (
                        <span className="text-sm text-slate-400 italic">No flags set</span>
                      )}
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-2 text-sm">
                    <span className="text-slate-500">Cash on Delivery:</span>
                    <span className="font-medium">{getBooleanLabel(selectedUser?.delivery?.cashOnDelivery)}</span>
                    <span className="text-slate-500">Only Delivery:</span>
                    <span className="font-medium">{getBooleanLabel(selectedUser?.delivery?.onlyDelivery)}</span>
                    <span className="text-slate-500">Free Delivery:</span>
                    <span className="font-medium">{getBooleanLabel(selectedUser?.delivery?.freeDelivery)}</span>
                    <span className="text-slate-500">Shipping Charges:</span>
                    <span className="font-medium">{getShippingLabel(selectedUser)}</span>
                    <span className="text-slate-500">Request Chat:</span>
                    <span className="font-medium">
                      {getBooleanLabel(selectedUser?.delivery?.requestChatBeforePurchase)}
                    </span>
                    <span className="text-slate-500">Inventory Alert:</span>
                    <span className="font-medium">{selectedUser?.delivery?.inventoryThreshold ?? 0}</span>
                  </div>
                  {selectedUser?.delivery?.returnPolicy && (
                    <div className="text-sm">
                      <span className="text-slate-500">Return Policy:</span>
                      <p className="font-medium mt-1 bg-slate-50 p-2 rounded">{selectedUser?.delivery?.returnPolicy}</p>
                    </div>
                  )}
                  {selectedUser?.autoReplyMessage && (
                    <div className="text-sm">
                      <span className="text-slate-500">Auto-Reply Message:</span>
                      <p className="font-medium mt-1 bg-slate-50 p-2 rounded">{selectedUser?.autoReplyMessage}</p>
                    </div>
                  )}
                  {selectedUser?.delivery?.customQuestions && (
                    <div className="text-sm">
                      <span className="text-slate-500">Custom Questions:</span>
                      <p className="font-medium mt-1 bg-slate-50 p-2 rounded">
                        {selectedUser?.delivery?.customQuestions}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider border-b pb-1">Payment Details</h4>
                  {selectedUser?.paymentDetails &&
                  (selectedUser?.paymentDetails?.upiId ||
                    selectedUser?.paymentDetails?.accountNumber ||
                    selectedUser?.paymentDetails?.bankName) ? (
                    <div className="grid grid-cols-[90px_1fr] gap-2 text-sm">
                      {selectedUser?.paymentDetails?.upiId && (
                        <>
                          <span className="text-slate-500">UPI ID:</span>
                          <span className="font-mono bg-slate-100 px-1 rounded">{selectedUser?.paymentDetails?.upiId}</span>
                        </>
                      )}
                      {selectedUser?.paymentDetails?.bankName && (
                        <>
                          <span className="text-slate-500">Bank:</span>
                          <span className="font-medium">{selectedUser?.paymentDetails?.bankName}</span>
                        </>
                      )}
                      {selectedUser?.paymentDetails?.accountHolderName && (
                        <>
                          <span className="text-slate-500">Holder:</span>
                          <span className="font-medium">{selectedUser?.paymentDetails?.accountHolderName}</span>
                        </>
                      )}
                      {selectedUser?.paymentDetails?.accountNumber && (
                        <>
                          <span className="text-slate-500">Account:</span>
                          <span className="font-mono bg-slate-100 px-1 rounded">
                            {selectedUser?.paymentDetails?.accountNumber}
                          </span>
                        </>
                      )}
                      {selectedUser?.paymentDetails?.ifsc && (
                        <>
                          <span className="text-slate-500">IFSC:</span>
                          <span className="font-mono bg-slate-100 px-1 rounded">{selectedUser?.paymentDetails?.ifsc}</span>
                        </>
                      )}
                      {selectedUser?.paymentDetails?.phone && (
                        <>
                          <span className="text-slate-500">Phone:</span>
                          <span className="font-medium">{selectedUser?.paymentDetails?.phone}</span>
                        </>
                      )}
                      {selectedUser?.paymentDetails?.note && (
                        <>
                          <span className="text-slate-500">Note:</span>
                          <span className="font-medium">{selectedUser?.paymentDetails?.note}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No payment details provided.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => handleAction(selectedUser?._id, "reject")}
                className="px-6 py-2 border border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleAction(selectedUser?._id, "approve")}
                className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
              >
                Approve Business
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
