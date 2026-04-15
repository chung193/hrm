import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiService from "../services/common";
import { formatDate } from "../utils/formatDate";
import Waiting from "./Waiting";
import PageMeta from "./PageMeta";

interface MyComment {
  id: number;
  body: string;
  created_at: string;
  postSlug: string | null;
  postName: string | null;
}

const isAuthenticated = (): boolean => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return false;
  try {
    const parsed = JSON.parse(rawUser) as { token?: string; access_token?: string };
    return Boolean(parsed?.token || parsed?.access_token);
  } catch {
    return false;
  }
};

const normalizeMyComments = (input: unknown): MyComment[] => {
  if (!Array.isArray(input)) return [];

  const mapped = input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as {
        id?: unknown;
        body?: unknown;
        created_at?: unknown;
        post_slug?: unknown;
        post?: { slug?: unknown; name?: unknown } | null;
      };

      if (typeof row.id !== "number" || typeof row.body !== "string") return null;
      const createdAt = typeof row.created_at === "string" ? row.created_at : new Date().toISOString();
      const postSlug =
        typeof row.post_slug === "string"
          ? row.post_slug
          : typeof row.post?.slug === "string"
            ? row.post.slug
            : undefined;
      const postName = typeof row.post?.name === "string" ? row.post.name : undefined;

      const comment: MyComment = {
        id: row.id,
        body: row.body,
        created_at: createdAt,
        postSlug: postSlug ?? null,
        postName: postName ?? null,
      };

      return comment;
    })
    .filter((item): item is MyComment => item !== null);

  return mapped;
};

function MyComments() {
  const [comments, setComments] = useState<MyComment[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      setComments([]);
      return;
    }

    apiService
      .authGet("client/my-comments")
      .then((response) => {
        const rows = response?.data?.data;
        setComments(normalizeMyComments(rows));
      })
      .catch(() => {
        setError("Không tải được danh sách bình luận đã gửi.");
        setComments([]);
      });
  }, []);

  if (!isAuthenticated()) {
    return (
      <>
        <PageMeta title="B?nh lu?n ?? g?i" description="Xem l?i c?c b?nh lu?n b?n ?? g?i tr?n blog." />
        <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-2 dark:text-slate-100">Bình luận đã gửi</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Vui lòng <Link to="/login" className="text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">đăng nhập</Link> để xem bình luận đã gửi.
        </p>
      </div>
      </>
    );
  }

  if (comments === null) {
    return <Waiting />;
  }

  return (
    <>
      <PageMeta title="B?nh lu?n ?? g?i" description="Xem l?i c?c b?nh lu?n b?n ?? g?i tr?n blog." />
      <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4 dark:text-slate-100">Bình luận đã gửi</h1>
      {error && <p className="text-sm text-sky-700 mb-3">{error}</p>}
      {comments.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">Bạn chưa gửi bình luận nào.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-slate-200 rounded-lg p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-slate-800 dark:text-slate-100">{comment.body}</p>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <span>{formatDate(comment.created_at)}</span>
                {comment.postSlug && (
                  <Link to={`/posts/${comment.postSlug}`} className="text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
                    {comment.postName || "Xem bài viết"}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

export default MyComments;

