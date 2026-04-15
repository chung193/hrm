import { useState, useEffect } from "react";
import CategoryItem from "./CategoryItem";
import Pagination from "./Pagination";
import Waiting from "./Waiting";
import apiService from "../services/common";
import { formatDate } from "../utils/formatDate";
import PageMeta from "./PageMeta";

interface CategoryRow {
  id?: number | string;
  slug?: string;
  name: string;
  description?: string;
  created_at?: string;
  views?: number;
  comments?: number;
}

function Categories() {
  const [categories, setCategories] = useState<CategoryRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    apiService
      .get(`client/category?page=${page}`)
      .then((response) => {
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setCategories(rows);
        setPage(response?.data?.meta?.current_page ?? 1);
        setTotalPages(response?.data?.meta?.last_page ?? 0);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setCategories([]);
      });
  }, [page]);

  if (!categories) return <Waiting />;

  return (
    <>
      <PageMeta
        title="T?t c? danh m?c"
        description="Kh?m ph? to?n b? danh m?c b?i vi?t tr?n blog."
      />
      <section className="p-4 sm:p-5 dark:border-slate-800 dark:text-slate-100">
      {categories.map((category) => (
        <CategoryItem
          key={category.slug || category.id}
          slug={category.slug || String(category.id)}
          name={category.name}
          date={formatDate(category.created_at || new Date().toISOString())}
          description={category.description || ""}
          views={category.views || 0}
          comments={category.comments || 0}
        />
      ))}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
    </section>
    </>
  );
}

export default Categories;
