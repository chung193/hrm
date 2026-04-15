import { Link } from "react-router-dom";

interface CategoryItemProps {
  slug: string;
  name: string;
  description: string;
  date: string;
  views: number;
  comments: number;
}

function CategoryItem({ slug, name, description }: CategoryItemProps) {
  return (
    <article className="max-w-4xl w-full mx-auto mb-4 p-4 transition-colors dark:border-slate-700">
      <h2 className="text-lg sm:text-xl font-bold mb-2 leading-snug text-slate-900 dark:text-slate-100">
        <Link to={`/category/${slug}`} className="transition-colors hover:text-sky-900 dark:hover:text-sky-300">
          {name}
        </Link>
      </h2>
      <p className="mt-2 text-slate-700 dark:text-slate-200">{description}</p>
    </article>
  );
}

export default CategoryItem;
