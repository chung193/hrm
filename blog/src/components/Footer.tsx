function Footer() {
  return (
    <footer className="max-w-4xl w-full mx-auto py-4 px-4 sm:px-6 border-y border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:text-slate-300">
      <p className="text-sm">
        Xây dựng bởi{" "}
        <a href="" className="text-sky-700 font-bold hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-200" target="_blank">
          Tôi
        </a>
      </p>
      <ul className="flex space-x-4">
        <li>
          <a
            href="javascript:;"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <img
              src="/github.png"
              alt="GitHub"
              className="max-h-5 max-w-5 object-contain transition-transform duration-200 hover:scale-110 dark:brightness-125 dark:contrast-125"
            />
          </a>
        </li>
        <li>
          <a
            href="javascript:;"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <img
              src="/email.png"
              alt="mail"
              className="h-5 w-5 object-contain transition-transform duration-200 hover:scale-110 dark:brightness-125 dark:contrast-125"
            />
          </a>
        </li>
        <li>
          <a
            href="javascript:;"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <img
              src="/twitter.png"
              alt="twitter"
              className="h-5 w-5 object-contain transition-transform duration-200 hover:scale-110 dark:brightness-125 dark:contrast-125"
            />
          </a>
        </li>
      </ul>
    </footer>
  );
}

export default Footer;
