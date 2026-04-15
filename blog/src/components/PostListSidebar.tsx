import { Link } from "react-router-dom";

interface TagRow {
  id?: number | string;
  slug?: string;
  name: string;
}

interface PostListSidebarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  tags: TagRow[];
  selectedTag: string;
  buildTagLink: (tagSlug: string) => string;
}

function PostListSidebar({
  searchInput,
  onSearchInputChange,
  tags,
  selectedTag,
  buildTagLink,
}: PostListSidebarProps) {
  return (
    <aside className="h-fit rounded-2xl border border-sky-100 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/80 lg:sticky lg:top-20">
      <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Bộ lọc</h2>
      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Tìm kiếm</label>
      <input
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
        placeholder="Tìm bài viết..."
        className="mb-4 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
      />

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tag</h3>
      <div className="flex flex-wrap gap-2 lg:flex-col">
        <Link
          to={buildTagLink("")}
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm transition-colors ${
            selectedTag === ""
              ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
          }`}
        >
          Tất cả tag
        </Link>

        {tags.map((tag) => {
          const tagSlug = tag.slug || "";
          return (
            <Link
              key={tag.slug || tag.id}
              to={buildTagLink(tagSlug)}
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm transition-colors ${
                selectedTag === tagSlug
                  ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
              }`}
            >
              #{tag.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export type { TagRow };
export default PostListSidebar;
