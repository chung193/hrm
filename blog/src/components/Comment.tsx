import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiService from "../services/common";
import { formatDate, getMediaUrl } from "../utils/formatDate";
import { getAuthProfile } from "../utils/auth";

interface User {
  id: number;
  name: string;
}

interface CommentType {
  id: number;
  body: string;
  user: User;
  replies: CommentType[];
  created_at: string;
  is_approved: boolean;
}

interface ApiCommentShape {
  id?: number;
  body?: string;
  created_at?: string;
  is_approved?: boolean;
  user?: User | null;
  name?: string;
  author_name?: string;
  guest_name?: string;
  replies?: ApiCommentShape[] | null;
  children?: ApiCommentShape[] | null;
}

interface CommentSubmitResponse {
  message?: string;
  comment?: ApiCommentShape | null;
}

interface CommentItemProps {
  comment: CommentType;
  postSlug: string;
  depth?: number;
  canReply: boolean;
  isAuthenticated: boolean;
  onReplyAdded: (parentId: number, reply: CommentType) => void;
}

interface CommentProps {
  comments: unknown;
  postSlug: string;
  canComment?: boolean;
}

const normalizeComment = (input: unknown): CommentType | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as ApiCommentShape;
  if (typeof raw.id !== "number" || typeof raw.body !== "string") {
    return null;
  }

  const fallbackName =
    (typeof raw.author_name === "string" && raw.author_name.trim()
      ? raw.author_name.trim()
      : typeof raw.guest_name === "string" && raw.guest_name.trim()
        ? raw.guest_name.trim()
        : typeof raw.name === "string" && raw.name.trim()
          ? raw.name.trim()
          : "?n danh");

  const user =
    raw.user && typeof raw.user.id === "number" && typeof raw.user.name === "string"
      ? raw.user
      : { id: 0, name: fallbackName };

  const nested = Array.isArray(raw.replies)
    ? raw.replies
    : Array.isArray(raw.children)
      ? raw.children
      : [];

  return {
    id: raw.id,
    body: raw.body,
    created_at: raw.created_at ?? new Date().toISOString(),
    is_approved: Boolean(raw.is_approved),
    user,
    replies: nested.map(normalizeComment).filter((item): item is CommentType => item !== null),
  };
};

const normalizeComments = (input: unknown): CommentType[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map(normalizeComment).filter((item): item is CommentType => item !== null);
};

const CommentForm = ({
  postSlug,
  parentId = null,
  isAuthenticated,
  onSuccess,
  onCancel,
  placeholder = "Viết bình luận...",
}: {
  postSlug: string;
  parentId?: number | null;
  isAuthenticated: boolean;
  onSuccess: (comment: CommentType) => void;
  onCancel?: () => void;
  placeholder?: string;
}) => {
  const [guestName, setGuestName] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async () => {
    if (!isAuthenticated && !guestName.trim()) {
      setError("Vui lòng nhập tên.");
      return;
    }

    if (!body.trim()) {
      setError("Vui lòng nhập nội dung bình luận.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const payload: { body: string; parent_id?: number; guest_name?: string } = {
        body: body.trim(),
      };

      if (!isAuthenticated) {
        payload.guest_name = guestName.trim();
      }

      if (parentId !== null) {
        payload.parent_id = parentId;
      }

      const res = isAuthenticated
        ? await apiService.authPost(`client/post/${postSlug}/comments`, payload)
        : await apiService.post(`client/post/${postSlug}/comments`, payload);
      const responseData = (res?.data?.data ?? res?.data ?? {}) as CommentSubmitResponse;
      const createdComment = normalizeComment(responseData?.comment);

      if (!createdComment) {
        throw new Error("Invalid comment response");
      }

      if (createdComment.is_approved) {
        onSuccess(createdComment);
      } else {
        setSuccessMessage(responseData?.message || "Bình luận đã được gửi đi và đang chờ duyệt.");
      }

      if (!isAuthenticated) {
        setGuestName("");
      }
      setBody("");
    } catch {
      setError("Gửi thất bại, thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3 mt-2">
      {!isAuthenticated && (
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Nhập tên hiển thị..."
          className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      )}
      <textarea
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {successMessage && <p className="mt-1 text-xs text-emerald-600">{successMessage}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="cursor-pointer rounded-lg bg-sky-600 px-4 py-1.5 text-sm text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? "Đang gửi..." : "Gửi"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg bg-slate-100 px-4 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Hủy
          </button>
        )}
      </div>
    </div>
  );
};

const CommentItem = ({
  comment,
  postSlug,
  depth = 0,
  canReply,
  isAuthenticated,
  onReplyAdded,
}: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySuccess = (reply: CommentType) => {
    onReplyAdded(comment.id, reply);
    setShowReplyForm(false);
  };

  return (
    <div className={depth > 0 ? "ml-4 border-l-2 border-slate-100 pl-3 sm:ml-8 sm:pl-4 dark:border-slate-700" : ""}>
      <div className="mb-1 flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-sky-100 text-sm font-semibold text-sky-700 flex items-center justify-center dark:bg-slate-700 dark:text-slate-100">
          {comment.user?.name?.charAt(0).toUpperCase() || "?"}
        </div>

        <div className="flex-1">
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{comment.user?.name}</p>
            <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{comment.body}</p>
          </div>
          <div className="ml-1 mt-1 flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(comment.created_at)}</p>
            {canReply && depth < 3 && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="cursor-pointer text-xs text-sky-600 transition-colors hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
              >
                {showReplyForm ? "Hủy" : "Trả lời"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`ml-0 overflow-hidden transition-all duration-300 ease-in-out sm:ml-11 ${showReplyForm ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <CommentForm
          postSlug={postSlug}
          parentId={comment.id}
          isAuthenticated={isAuthenticated}
          onSuccess={handleReplySuccess}
          onCancel={() => setShowReplyForm(false)}
          placeholder={`Tr? l?i ${comment.user?.name}...`}
        />
      </div>

      {comment.replies.length > 0 && (
        <div className="mb-3 mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postSlug={postSlug}
              depth={depth + 1}
              canReply={canReply}
              isAuthenticated={isAuthenticated}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Comment = ({ comments: initialComments, postSlug, canComment = true }: CommentProps) => {
  const [comments, setComments] = useState<CommentType[]>(() => normalizeComments(initialComments));
  const [auth, setAuth] = useState(() => getAuthProfile());

  useEffect(() => {
    setComments(normalizeComments(initialComments));
  }, [initialComments, postSlug]);

  useEffect(() => {
    setAuth(getAuthProfile());
  }, []);

  const addReplyToTree = (nodes: CommentType[], parentId: number, reply: CommentType): CommentType[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return { ...node, replies: [...node.replies, reply] };
      }

      if (node.replies.length > 0) {
        return { ...node, replies: addReplyToTree(node.replies, parentId, reply) };
      }

      return node;
    });
  };

  const handleReplyAdded = (parentId: number, reply: CommentType) => {
    setComments((prev) => addReplyToTree(prev, parentId, reply));
  };

  const handleNewComment = (comment: CommentType) => {
    setComments((prev) => [...prev, comment]);
  };

  return (
    <div className="mt-4 border-t border-slate-200 py-4 dark:border-slate-700">
      <h3 className="mb-4 font-semibold text-slate-700 dark:text-slate-200">
        {comments.length > 0 ? `${comments.length} bình luận` : "Bình luận"}
      </h3>

      {canComment ? (
        <>
          {auth.isAuthenticated ? (
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              {auth.avatar ? (
                <img
                  src={getMediaUrl(auth.avatar)}
                  alt={auth.name || "Người dùng"}
                  className="h-7 w-7 rounded-full border border-slate-200 object-cover dark:border-slate-600"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800 dark:bg-slate-700 dark:text-slate-100">
                  {(auth.name?.charAt(0) || "N").toUpperCase()}
                </div>
              )}
              <p>
                Đăng nhập với tên <span className="font-semibold text-slate-800 dark:text-slate-100">{auth.name || "Người dùng"}</span>
              </p>
            </div>
          ) : (
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
              Bạn đang bình luận với tư cách là khách {" "}
              <Link to="/login" className="font-medium text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
                Đăng nhập
              </Link>{" "}
              Đã gửi bình luận bằng tài khoản
            </p>
          )}

          <CommentForm
            postSlug={postSlug}
            isAuthenticated={auth.isAuthenticated}
            onSuccess={handleNewComment}
            placeholder="Viết bình luận của bạn..."
          />
        </>
      ) : (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Bình luận đã được tắt cho bài viết này. Bạn vẫn có thể xem các bình luận trước đó.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Chưa có bình luận nào.</p>
      ) : (
        <div className="mt-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postSlug={postSlug}
              canReply={canComment}
              isAuthenticated={auth.isAuthenticated}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
