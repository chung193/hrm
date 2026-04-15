import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Post from "./PostItem";
import Pagination from "./Pagination";
import Waiting from "./Waiting";
import PostListSidebar from "./PostListSidebar";
import type { TagRow } from "./PostListSidebar";
import apiService from "../services/common";
import { formatDate } from "../utils/formatDate";
import PageMeta from "./PageMeta";

interface PostRow {
  id?: number | string;
  slug?: string;
  name: string;
  created_at: string;
  description: string;
  views: number;
  comments?: number;
  allow_comments?: boolean;
  type?: "article" | "news" | "tutorial" | "review";
  category?: {
    name?: string;
    slug?: string;
  };
  tags?: TagRow[];
}

function Tag() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<PostRow[] | null>(null);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [tagTitle, setTagTitle] = useState("");
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const didInitFilters = useRef(false);
  const [page, setPage] = useState(() => {
    const parsed = Number(searchParams.get("page") || "1");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  const [totalPages, setTotalPages] = useState(0);
  const { slug } = useParams();

  useEffect(() => {
    const nextSearch = searchParams.get("search") || "";
    const parsedPage = Number(searchParams.get("page") || "1");
    const nextPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    setSearchInput((prev) => (prev === nextSearch ? prev : nextSearch));
    setSearch((prev) => (prev === nextSearch ? prev : nextSearch));
    setPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!didInitFilters.current) {
      didInitFilters.current = true;
      return;
    }
    setPage(1);
  }, [search, slug]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, page, setSearchParams]);

  useEffect(() => {
    apiService
      .get("client/tag")
      .then((response) => {
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setTags(rows);
      })
      .catch(() => {
        setTags([]);
      });
  }, []);

  useEffect(() => {
    apiService
      .get("client/post", { tag_slug: slug, search, page })
      .then((response) => {
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setPosts(rows);
        setPage(response?.data?.meta?.current_page ?? 1);
        setTotalPages(response?.data?.meta?.last_page ?? 0);

        const matchedTag = rows
          .flatMap((post: PostRow) => (Array.isArray(post.tags) ? post.tags : []))
          .find((tag: TagRow) => tag.slug === slug);

        const fallbackTitle = (slug || "").replace(/-/g, " ");
        setTagTitle(matchedTag?.name || fallbackTitle);
      })
      .catch((error) => {
        console.error("Error fetching posts by tag:", error);
        setPosts([]);
      });
  }, [slug, search, page]);

  const buildTagLink = (tagSlug: string): string => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const query = params.toString();

    if (!tagSlug) {
      return query ? `/?${query}` : "/";
    }

    return query ? `/tag/${tagSlug}?${query}` : `/tag/${tagSlug}`;
  };

  if (!posts) return <Waiting />;

  return (
    <>
      <PageMeta
        title={`Tag: ${tagTitle || "..."}`}
        description={`C?c b?i vi?t ???c g?n tag ${tagTitle || slug || "?ang c?p nh?t"}.`}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <PostListSidebar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          tags={tags}
          selectedTag={slug || ""}
          buildTagLink={buildTagLink}
        />

        <section className="rounded-2xl p-4 sm:p-5 dark:border-slate-800">
          <h1 className="mb-4 text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">Tag: {tagTitle || "..."}</h1>
          {posts.map((post) => (
            <Post
              key={post.slug || post.id}
              slug={post.slug || String(post.id)}
              name={post.name}
              date={formatDate(post.created_at)}
              description={post.description}
              views={post.views}
              comments={post.comments}
              allowComments={post.allow_comments !== false}
              categoryName={post.category?.name || "Uncategorized"}
              categorySlug={post.category?.slug || "uncategorized"}
              type={post.type}
              tags={post.tags || []}
            />
          ))}
          {posts.length === 0 && (
            <p className="mb-4 text-slate-600 dark:text-slate-300">Không tìm thấy bài viết cho tag này.</p>
          )}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </section>
      </div>
    </>
  );
}

export default Tag;
