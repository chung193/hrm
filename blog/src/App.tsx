import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import DonateButton from "./components/Donate";
import HomePage from "./components/HomePage";
import PostDetail from "./components/PostDetail";
import Category from "./components/Category";
import Categories from "./components/Categories";
import PostWithUser from "./components/PostWithUser";
import Tag from "./components/Tag";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import MyComments from "./components/MyComments";
import Profile from "./components/Profile";
import AboutMe from "./components/AboutMe";

type ThemeMode = "light" | "dark";

const getInitialTheme = (): ThemeMode => {
  const savedTheme = localStorage.getItem("theme-mode");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

function App() {
  const location = useLocation();
  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthPage = authPaths.includes(location.pathname);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme-mode", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <Header theme={theme} onToggleTheme={handleToggleTheme} />
      {!isAuthPage && (
        <DonateButton
          imageUrl="/donate.gif"
          donateUrl="https://me.momo.vn/chungvd"
          tooltip="Ủng hộ dự án nuôi anh ly cafe ☕"
        />
      )}

      <div className="container mx-auto flex-1 px-4 py-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutMe />} />
          <Route path="/posts/:slug" element={<PostDetail />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/user/:slug" element={<PostWithUser />} />
          <Route path="/tag/:slug" element={<Tag />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/my-comments" element={<MyComments />} />
          <Route path="/thong-tin-ca-nhan" element={<Profile />} />
        </Routes>
      </div>

      <Footer />
      <BackToTop />
    </div>
  );
}

export default App;
