import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Clock3, FolderOpen, LogOut, Menu, MessageCircle, Moon, Settings, Sun, X } from "lucide-react";
import Logo from "./Logo";
import apiService from "../services/common";
import { AUTH_PROFILE_UPDATED_EVENT, clearStoredUser, getAuthProfile } from "../utils/auth";
import { getMediaUrl } from "../utils/formatDate";

interface MenuCategory {
  id?: number;
  slug: string;
  name: string;
}

interface ApiEnvelope<T> {
  data?: T;
}

type AuthProfile = {
  isAuthenticated: boolean;
  name: string;
  avatar: string;
};

type ThemeMode = "light" | "dark";

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const getResponseData = <T,>(response: ApiEnvelope<T | ApiEnvelope<T>> | undefined): T | null => {
  const payload = response?.data;
  if (!payload) return null;

  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as ApiEnvelope<T>).data ?? null;
  }

  return payload as T;
};

function Header({ theme, onToggleTheme }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthProfile>(() => getAuthProfile());
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  useEffect(() => {
    const syncAuthProfile = () => {
      setAuth(getAuthProfile());
    };

    syncAuthProfile();
    window.addEventListener(AUTH_PROFILE_UPDATED_EVENT, syncAuthProfile as EventListener);
    window.addEventListener("storage", syncAuthProfile);

    return () => {
      window.removeEventListener(AUTH_PROFILE_UPDATED_EVENT, syncAuthProfile as EventListener);
      window.removeEventListener("storage", syncAuthProfile);
    };
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    apiService
      .get("client/category", { page: 1 })
      .then((response) => {
        if (!mounted) return;
        const categoryPayload = getResponseData<unknown[]>(response);
        const items = Array.isArray(categoryPayload) ? categoryPayload : [];
        const mapped = items
          .filter((item: unknown): item is { id?: number; slug: string; name: string } => {
            if (!item || typeof item !== "object") return false;
            const current = item as { id?: unknown; slug?: unknown; name?: unknown };
            return typeof current.slug === "string" && typeof current.name === "string";
          })
          .map((item: { id?: number; slug: string; name: string }) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
          }));
        setCategories(mapped);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    clearStoredUser();
    setAuth(getAuthProfile());
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sky-100 /95 backdrop-blur bg-white dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-2">
          <Logo />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <nav className="hidden md:block">
            <ul className="flex h-full items-center space-x-4 text-sm sm:text-base">
              <li>
                <Link
                  to="/"
                  className="flex items-center gap-1.5 text-slate-700 transition-colors hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300"
                >
                  <Clock3 className="h-4 w-4" />
                  Mới nhất
                </Link>
              </li>
              <li className="group relative flex h-full items-center">
                <button className="flex h-full cursor-pointer items-center gap-1.5 text-slate-700 transition-colors hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300">
                  <FolderOpen className="h-4 w-4" />
                  <span>Bài viết</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="invisible bg-white absolute right-0 top-[calc(100%+20px)] z-50 mt-0 w-56 rounded-b-lg border border-sky-100  py-1 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-900">
                  {categories.slice(0, 8).map((category) => (
                    <Link
                      key={category.slug}
                      to={`/category/${category.slug}`}
                      className=" flex items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                    >
                      {category.name}
                    </Link>
                  ))}

                  {categories.length > 8 && (
                    <Link
                      to="/categories"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-sky-700 transition-colors hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Xem tất cả danh mục
                    </Link>
                  )}
                </div>
              </li>
              <li>
                <Link
                  to="/about"
                  className="flex items-center gap-1.5 text-slate-700 transition-colors hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300"
                >
                  Về tôi
                </Link>
              </li>
              {!auth.isAuthenticated && (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="text-slate-700 transition-colors hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300"
                    >
                      Đăng nhập
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="text-slate-700 transition-colors hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300"
                    >
                      Đăng ký
                    </Link>
                  </li>
                </>
              )}
              {auth.isAuthenticated && (
                <li className="group relative flex h-full items-center">
                  <button className="flex h-full cursor-pointer items-center gap-2">
                    {auth.avatar ? (
                      <img
                        src={getMediaUrl(auth.avatar)}
                        alt={auth.name || "Người dùng"}
                        className="h-8 w-8 rounded-full border border-sky-200 object-cover dark:border-slate-600"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-slate-700 dark:text-slate-100">
                        {(auth.name?.charAt(0) || "N").toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-32 truncate text-slate-700 dark:text-slate-200">{auth.name || "Người dùng"}</span>
                  </button>
                  <div className="bg-white invisible absolute right-0 top-[calc(100%+16px)] z-50 mt-0 w-56 rounded-b-lg border border-sky-100  opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-900">
                    <Link
                      to="/thong-tin-ca-nhan"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                    >
                      <Settings className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                      Thông tin cá nhân
                    </Link>
                    <Link
                      to="/my-comments"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                    >
                      <MessageCircle className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                      Bài viết và bình luận
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </nav>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-sky-700 transition-colors hover:bg-sky-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-sky-100  px-4 py-3 dark:border-slate-700 dark:bg-slate-900 md:hidden">
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <Link
                to="/"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
              >
                <Clock3 className="h-4 w-4" />
                Mới nhất
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setMobileCategoriesOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Bài viết
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileCategoriesOpen && (
                <div className="mt-1 pl-2">
                  {categories.slice(0, 8).map((category) => (
                    <Link
                      key={category.slug}
                      to={`/category/${category.slug}`}
                      className="block rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                    >
                      {category.name}
                    </Link>
                  ))}
                  {categories.length > 8 && (
                    <Link
                      to="/categories"
                      className="block rounded-md px-3 py-2 text-sky-700 transition-colors hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800"
                    >
                      Xem tất cả danh mục
                    </Link>
                  )}
                </div>
              )}
            </li>
            <li>
              <Link
                to="/about"
                className="block rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
              >
                Về tôi
              </Link>
            </li>
            {!auth.isAuthenticated && (
              <>
                <li>
                  <Link
                    to="/login"
                    className="block rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                  >
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="block rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                  >
                    Đăng ký
                  </Link>
                </li>
              </>
            )}
            {auth.isAuthenticated && (
              <>
                <li>
                  <Link
                    to="/thong-tin-ca-nhan"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                  >
                    <Settings className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                    Thông tin cá nhân
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-comments"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                  >
                    <MessageCircle className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                    Xem bình luận đã gửi
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;
