import { useEffect, useState } from "react";
import PageMeta from "./PageMeta";
import { Github, Linkedin, Mail, Twitter, Instagram, Code2, Zap, BookOpen, Rocket } from "lucide-react";

const typingAnimation = `
@keyframes chungTyping {
  0% {
    max-width: 0;
  }
  100% {
    max-width: 500px;
  }
}

@keyframes cursorBlink {
  0%, 50%, 100% {
    opacity: 1;
  }
  51%, 99% {
    opacity: 0;
  }
}

.chung-text {
  display: inline-block;
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  animation: chungTyping 2s steps(7, end) 0.3s forwards;
  font-family: inherit;
  letter-spacing: inherit;
}

.cursor {
  display: inline-block;
  width: 3px;
  height: 1em;
  background: currentColor;
  animation: cursorBlink 1s infinite 2.3s;
  margin-left: 4px;
  vertical-align: middle;
}`;

function AboutMe() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);
    const skills = [
        {
            category: "Languages",
            items: ["C#", "JavaScript", "Python", "TypeScript"],
            icon: Code2,
            color: "from-blue-500 to-cyan-500",
        },
        {
            category: "Frontend",
            items: ["React.js", "Next.js", "Tailwind CSS", "Vue.js"],
            icon: Zap,
            color: "from-purple-500 to-pink-500",
        },
        {
            category: "Backend",
            items: ["Laravel", "Node.js", "FastAPI", "PostgreSQL"],
            icon: Rocket,
            color: "from-green-500 to-emerald-500",
        },
        {
            category: "Tools & DevOps",
            items: ["Git", "Docker", "VS Code", "Vite", "AWS"],
            icon: BookOpen,
            color: "from-orange-500 to-red-500",
        },
    ];

    const socialLinks = [
        {
            name: "GitHub",
            url: "https://github.com/chung193",
            icon: Github,
            color: "from-gray-600 to-gray-800",
        },
        {
            name: "Twitter",
            url: "https://twitter.com/chungvd_it",
            icon: Twitter,
            color: "from-blue-400 to-blue-600",
        },
        {
            name: "LinkedIn",
            url: "https://www.linkedin.com/in/chung193/",
            icon: Linkedin,
            color: "from-blue-600 to-blue-800",
        },
        {
            name: "Instagram",
            url: "https://www.instagram.com/chungvd193/",
            icon: Instagram,
            color: "from-pink-500 to-orange-500",
        },
        {
            name: "Email",
            url: "mailto:chung193contact@gmail.com",
            icon: Mail,
            color: "from-red-500 to-pink-500",
        },
    ];

    const highlights = [
        {
            number: "50+",
            label: "Projects",
            icon: "🚀",
        },
        {
            number: "20+",
            label: "Technologies",
            icon: "⚡",
        },
        {
            number: "5+",
            label: "Years Experience",
            icon: "👨‍💻",
        },
    ];

    return (
        <div className="min-h-screen">
            <style>{typingAnimation}</style>
            <PageMeta
                title="About Me"
                description="Learn more about me, my skills, and my journey in web development."
            />

            {/* Hero Section with Image */}
            <section
                className={`relative overflow-hidden bg-white dark:bg-slate-950 px-6 py-16 md:px-12 md:py-24 transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"
                    }`}
                style={{
                    backgroundImage: `linear-gradient(135deg, hsla(0,3%,6%,.678), rgba(12,10,22,.863)), url('https://portfolio-7d4i3yi4e-chung193.vercel.app/static/media/home-bg.dc52d5d40a40b13154b0.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                {/* Overlay for dark mode effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 dark:from-black/40 dark:to-black/50" />

                <div className="relative z-10 px-6 md:px-12 py-12 md:py-20">
                    <div className="grid gap-6 md:grid-cols-2 items-center">
                        {/* Left Content */}
                        <div className="space-y-6">
                            <div className="inline-block animate-bounce text-6xl drop-shadow-2xl">👋</div>
                            <h1 className="text-5xl font-black sm:text-6xl md:text-7xl tracking-tight leading-tight text-white" style={{
                                textShadow: "0 4px 20px rgba(0,0,0,0.4)"
                            }}>
                                Hi There!
                                <br />
                                <span className="inline-block">I'm </span>
                                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-purple-400">
                                    <span className="chung-text">Chung193</span>
                                    <span className="cursor" style={{
                                        background: "linear-gradient(90deg, #38bdf8, #60a5fa, #d8b4fe)"
                                    }}></span>
                                </span>
                            </h1>
                            <p className="max-w-xl text-lg sm:text-xl font-semibold text-slate-100 dark:text-slate-100">
                                A passionate full-stack developer crafting beautiful, scalable web experiences ✨
                            </p>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap gap-8 pt-6">
                                {highlights.map((item) => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <span className="text-4xl drop-shadow-lg">{item.icon}</span>
                                        <div>
                                            <div className="text-2xl font-black text-white dark:text-white" style={{
                                                textShadow: "0 2px 8px rgba(0,0,0,0.5)"
                                            }}>{item.number}</div>
                                            <div className="text-xs font-semibold text-slate-200 dark:text-slate-300">{item.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Image */}
                        <img
                            src="https://portfolio-7d4i3yi4e-chung193.vercel.app/Assets/home-main.svg"
                            alt="Chung193"
                            className="w-full h-auto hidden md:block"
                        />
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="my-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent dark:via-blue-700" />

            {/* Introduction Section */}
            <section className="space-y-8 py-16 md:py-20">
                <div className="mx-auto max-w-6xl px-6 md:px-12 space-y-4">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tight" style={{
                        background: "linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0c4a6e 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        Know Who I'M
                    </h2>
                </div>

                <div className="mx-auto max-w-6xl px-6 md:px-12 grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                            Hi Everyone, I am <span className="font-bold text-sky-700 dark:text-sky-300">Chung Vu Dinh</span> from Hai Phong, Viet Nam.
                            I am a passionate developer and a tech enthusiast.
                        </p>
                        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                            Apart from coding, some other activities that I love to do!
                        </p>
                        <ul className="space-y-3 text-slate-700 dark:text-slate-300 font-medium">
                            <li className="flex items-center gap-2">🎮 <span>Playing Games</span></li>
                            <li className="flex items-center gap-2">📝 <span>Writing Tech Blogs</span></li>
                            <li className="flex items-center gap-2">✈️ <span>Travelling</span></li>
                        </ul>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="bg-gradient-to-br from-sky-100 to-purple-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-sky-200 dark:border-slate-700">
                            <p className="text-2xl font-black text-slate-900 dark:text-white mb-4">"Read and learn!"</p>
                            <p className="text-lg font-bold text-sky-700 dark:text-sky-400">— Chung193 👨‍💻</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Skills Section */}
            <section className="space-y-8 py-16 md:py-20 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-950/20">
                <div className="mx-auto max-w-6xl px-6 md:px-12">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-12" style={{
                        background: "linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #0c4a6e 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        Professional Skillset
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {skills.map((skillGroup) => {
                            const Icon = skillGroup.icon;
                            return (
                                <div
                                    key={skillGroup.category}
                                    className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-6 transition-all duration-300 hover:border-sky-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/50"
                                >
                                    {/* Gradient Background Effect */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${skillGroup.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />

                                    <div className="relative space-y-4">
                                        <div className={`inline-block rounded-lg bg-gradient-to-br ${skillGroup.color} p-3 text-white`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 bg-gradient-to-r px-2 py-1 rounded" style={{
                                            background: `linear-gradient(135deg, ${skillGroup.color === 'from-blue-500 to-cyan-500' ? '#3b82f6' : skillGroup.color === 'from-purple-500 to-pink-500' ? '#a855f7' : skillGroup.color === 'from-green-500 to-emerald-500' ? '#22c55e' : '#f97316'}, ${skillGroup.color === 'from-blue-500 to-cyan-500' ? '#06b6d4' : skillGroup.color === 'from-purple-500 to-pink-500' ? '#ec4899' : skillGroup.color === 'from-green-500 to-emerald-500' ? '#10b981' : '#ea580c'})`,
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            backgroundClip: "text",
                                        }}>
                                            {skillGroup.category}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {skillGroup.items.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors group-hover:bg-sky-100 dark:bg-slate-700 dark:text-slate-200"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Passions Section */}
            <section className="space-y-8 py-16 md:py-20">
                <div className="mx-auto max-w-6xl px-6 md:px-12">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-12" style={{
                        background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 50%, #ec4899 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        Passionate <span className="inline-block ml-2">About</span>
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { icon: "🏗️", title: "System Design", desc: "Building scalable architectures" },
                            { icon: "🚀", title: "Product Dev", desc: "From idea to market launch" },
                            { icon: "📚", title: "Open Source", desc: "Contributing & learning together" },
                            { icon: "🔧", title: "DevOps", desc: "Cloud, Docker, CI/CD pipelines" },
                            { icon: "📱", title: "Innovation", desc: "Exploring new technologies" },
                            { icon: "🎓", title: "Knowledge Share", desc: "Writing & teaching others" },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="group rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/30 p-6 transition-all duration-300 hover:border-sky-300 hover:shadow-lg dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-900/50 dark:hover:border-blue-600"
                            >
                                <div className="text-5xl transition-transform group-hover:scale-125 drop-shadow-lg">{item.icon}</div>
                                <h3 className="mt-3 font-bold text-lg text-slate-900 dark:text-slate-100" style={{
                                    textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }}>{item.title}</h3>
                                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Links Section */}
            <section className="space-y-8 py-16 md:py-20">
                <div className="mx-auto max-w-6xl px-6 md:px-12 space-y-4">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tight" style={{
                        background: "linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #14b8a6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        Let's <span className="inline-block ml-2">Connect</span>
                    </h2>
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                        Feel free to reach out! I'm always happy to discuss projects, collaborate, or grab a virtual coffee ☕
                    </p>
                </div>

                <div className="mx-auto max-w-6xl px-6 md:px-12 flex flex-wrap gap-4">
                    {socialLinks.map(({ name, url, icon: Icon, color }) => (
                        <a
                            key={name}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative overflow-hidden rounded-xl p-px transition-all duration-300 hover:shadow-lg"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-100 transition-opacity`} />
                            <div className="relative flex items-center gap-2 rounded-[10px] bg-white px-6 py-3 text-slate-900 transition-colors group-hover:bg-gray-50 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
                                <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                                <span className="font-semibold">{name}</span>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-purple-600 px-6 py-16 text-center text-white shadow-2xl dark:from-blue-900 dark:via-purple-900 dark:to-slate-900 md:py-24 md:px-12">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-3xl space-y-6">
                    <h2 className="text-4xl md:text-5xl font-black">Ready to work together?</h2>
                    <p className="text-xl font-semibold text-blue-100">Let's create something amazing!</p>
                    <div className="pt-4">
                        <a
                            href="mailto:chung193contact@gmail.com"
                            className="inline-block rounded-xl bg-white px-8 py-3 font-bold text-blue-600 transition-all hover:scale-105 hover:shadow-lg dark:text-blue-500"
                        >
                            Get in Touch →
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AboutMe;
