import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye,
  Clock,
  Flag,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

const REASON_LABELS = {
  stolen_content: 'Stolen Content / Copyright',
  inappropriate: 'Inappropriate Content',
  spam: 'Spam',
  misleading: 'Misleading Information',
  harassment: 'Harassment / Bullying',
  other: 'Other',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  dismissed: 'bg-gray-100 text-gray-800',
  action_taken: 'bg-red-100 text-red-800',
};

export default function ReportedPosts() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedPost, setExpandedPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.ADMIN.REPORTS}?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status, adminNotes = '') => {
    setActionLoading(reportId);
    try {
      await fetch(API_ENDPOINTS.ADMIN.UPDATE_REPORT(reportId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNotes }),
      });
      fetchReports();
    } catch (err) {
      console.error('Failed to update report:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    setActionLoading(postId);
    try {
      await fetch(API_ENDPOINTS.ADMIN.DELETE_POST(postId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReports();
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getPostImage = (post) => {
    if (!post?.images?.[0]) return null;
    return post.images[0].low || post.images[0].high;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Flag className="w-8 h-8 text-red-500" />
          Reported Posts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review and manage posts reported by users
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['pending', 'reviewed', 'dismissed', 'action_taken'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
              statusFilter === status
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No {statusFilter} reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((item) => (
            <div
              key={item.post?._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4 flex items-start gap-4">
                {/* Post Thumbnail */}
                {getPostImage(item.post) && (
                  <img
                    src={getPostImage(item.post)}
                    alt={item.post?.title}
                    className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                  />
                )}

                {/* Post Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {item.post?.title || 'Deleted Post'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.reports?.[0]?.status || 'pending']}`}>
                      {item.totalReports} report{item.totalReports > 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      •
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.reports?.[0]?.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3">
                    {statusFilter === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReportStatus(item.reports[0]._id, 'dismissed')}
                          disabled={actionLoading === item.reports[0]._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => updateReportStatus(item.reports[0]._id, 'reviewed')}
                          disabled={actionLoading === item.reports[0]._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => deletePost(item.post?._id)}
                          disabled={actionLoading === item.post?._id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Post
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedPost(expandedPost === item.post?._id ? null : item.post?._id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {expandedPost === item.post?._id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedPost === item.post?._id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Report Details ({item.totalReports})
                  </h4>
                  <div className="space-y-3">
                    {item.reports.map((report, idx) => (
                      <div
                        key={report._id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3" />
                              {REASON_LABELS[report.reason] || report.reason}
                            </span>
                            {report.customReason && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                "{report.customReason}"
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Reported by: {report.reporter?.username || report.reporter?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(report.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
