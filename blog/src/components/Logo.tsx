import Typewriter from "typewriter-effect";
import { Rocket } from "lucide-react";
import { useState } from "react";

function Logo() {
    const [showRocket, setShowRocket] = useState(false);

    return (
        <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2 hover:scale-200 origin-top hover:translate-y-1 transition-transform duration-200">
                <img
                    src="/logo.gif"
                    alt="Logo"
                    width="50"
                    height="50"
                    className=" cursor-pointer"
                />

                <div className="text-lg font-bold leading-none flex items-center min-w-[110px]">
                    <Typewriter
                        onInit={(typewriter) => {
                            typewriter
                                .typeString('<span class="text-sky-700">Explore</span>')
                                .pauseFor(1500)
                                .deleteAll()
                                .typeString(
                                    '<span class="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">Learn</span>'
                                )
                                .pauseFor(1500)
                                .deleteAll()
                                .callFunction(() => setShowRocket(true))
                                .typeString(
                                    '<span class="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Build</span>'
                                )
                                .pauseFor(1500)
                                .callFunction(() => setShowRocket(false))
                                .deleteAll()
                                .start();
                        }}
                        options={{
                            delay: 50,
                            deleteSpeed: 30,
                            loop: true,
                            cursor: "", // turn off default cursor
                        }}
                    />

                    {showRocket && (
                        <Rocket className="ml-2 w-4 h-4 text-pink-500 animate-pulse" />
                    )}

                    {/* custom cursor displayed at the end */}
                    <span className="ml-1 animate-pulse text-slate-700 dark:text-slate-200">|</span>
                </div>
            </a>
        </div>
    );
}

export default Logo;
