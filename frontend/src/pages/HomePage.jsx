import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import CreateRoomDialog from "../components/CreateRoomDialog";

// Clean logo with white outline
const Logo = () => (
  <div className="relative">
    <img
      src="/Brush-it Logo.svg"
      alt="Brush It Logo"
      className="w-14 h-14"
      style={{
        filter: "drop-shadow(0 0 2px white) drop-shadow(0 0 4px white)",
      }}
    />
  </div>
);

const Home = () => {
  const whatsNextRef = useRef(null);
  const navigate = useNavigate();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const scrollToWhatsNext = () => {
    whatsNextRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCreateRoom = async (canvasSize) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/room/create-room`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            canvasWidth: canvasSize.width,
            canvasHeight: canvasSize.height,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to create room");
      }
      const { roomid } = await response.json();
      navigate(`/room/${roomid}`, {
        state: {
          width: canvasSize.width,
          height: canvasSize.height,
        },
      });
    } catch (error) {
      console.error("Error creating room:", error);
      alert(
        "Backend deployed on Render may take a moment to wake up on the first request. Please wait a few seconds and try again."
      );
    }
  };

  return (
    <div className="bg-neutral-900 min-h-screen">
      {/* Header */}
      <header className="p-6 bg-neutral-900 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo />
            <h1 className="text-3xl font-bold text-white">Brush It</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={scrollToWhatsNext}
              className="bg-neutral-800 text-white px-4 py-2 rounded-lg shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-shadow duration-200"
            >
              What's Next?
            </button>
            <button
              disabled
              className="bg-neutral-800 text-white px-4 py-2 rounded-lg border border-neutral-600 opacity-50 cursor-not-allowed"
            >
              Join Public Room (Coming soon)
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-6xl lg:text-6xl font-semibold text-white leading-tight tracking-tight">
                  Collaborative
                  <br />
                  Drawing
                  <br />
                  Made Simple
                </h2>
                <p className="text-xl text-zinc-300 leading-relaxed max-w-lg">
                  Create, share, and draw together in real-time. Bring your ideas
                  to life on an infinite canvas.
                </p>
              </div>

              <button
                onClick={() => setIsCreatingRoom(true)}
                className="relative z-10 px-10 py-5 rounded-2xl text-xl font-extrabold text-white tracking-wide overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_white] hover:cursor-pointer"
              >
                <span className="relative z-20">Create Your Room</span>
                {/* Animated Border Glow */}
                <span className="absolute inset-0 rounded-2xl p-[6px] bg-gradient-to-r from-pink-500 via-yellow-500 to-blue-500 animate-borderLoop"></span>
                {/* Inner background */}
                <span className="absolute inset-[6px] bg-neutral-800 rounded-2xl"></span>
              </button>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-4 pt-8">
                <div className="bg-neutral-800 rounded-full px-4 py-2 border border-neutral-700">
                  <span className="text-sm font-medium text-neutral-200">
                    No Sign-Up Required
                  </span>
                </div>
                <div className="bg-neutral-800 rounded-full px-4 py-2 border border-neutral-700">
                  <span className="text-sm font-medium text-neutral-200">
                    Real-Time Collaboration
                  </span>
                </div>
                <div className="bg-neutral-800 rounded-full px-4 py-2 border border-neutral-700">
                  <span className="text-sm font-medium text-neutral-200">
                    Infinite Canvas
                  </span>
                </div>
              </div>
            </div>

            {/* Right - Clean Browser Window with floating white glow */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative max-w-2xl w-full">
                <div
                  className="relative"
                  style={{
                    filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.7))",
                  }}
                >
                  <div
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xl"
                    style={{
                      boxShadow:
                        "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div className="bg-gray-50 px-4 py-3 flex items-center space-x-3 border-b border-gray-200">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>

                    <div className="relative h-96 bg-gray-50">
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        <img
                          src="/bg-hero.svg"
                          alt="Brush It Background"
                          className="w-full h-full object-contain opacity-60"
                        />
                      </div>

                      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
                        <div className="flex -space-x-1">
                          <div className="w-4 h-4 bg-black rounded-full border-2 border-white"></div>
                          <div className="w-4 h-4 bg-gray-600 rounded-full border-2 border-white"></div>
                          <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          3 online
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-200"></div>
                            <div className="w-4 h-4 bg-amber-600 rounded-full border border-gray-200"></div>
                            <div className="w-4 h-4 bg-green-600 rounded-full border border-gray-200"></div>
                          </div>
                          <div className="w-px h-4 bg-gray-300"></div>
                          <div className="flex items-center space-x-3">
                            <svg
                              className="w-4 h-4 text-gray-700"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-20 left-20 w-3 h-3 bg-black rounded-full"></div>
                      <div className="absolute top-32 right-24 w-3 h-3 bg-gray-600 rounded-full"></div>
                      <div className="absolute bottom-20 left-32 w-3 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="bg-neutral-900 py-20 border-t border-neutral-700">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-white mb-16">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center space-y-4 p-6">
              <div className="w-12 h-12 bg-white text-neutral-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">
                Create Instantly
              </h4>
              <p className="text-neutral-300 leading-relaxed">
                Start a new, private canvas with a single click. No sign-up
                required.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6">
              <div className="w-12 h-12 bg-white text-neutral-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">Share the Link</h4>
              <p className="text-neutral-300 leading-relaxed">
                Send the unique room link to your team, friends, or students.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6">
              <div className="w-12 h-12 bg-white text-neutral-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">Draw Together</h4>
              <p className="text-neutral-300 leading-relaxed">
                Watch everyone's ideas appear on the shared canvas in
                real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Next Section */}
      <section
        ref={whatsNextRef}
        className="bg-neutral-900 py-20 border-t border-neutral-700"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-white mb-16">What's Next?</h3>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="flex flex-col items-center space-y-4 p-6">
              <h4 className="text-xl font-bold text-white">Custom URLs</h4>
              <p className="text-neutral-300 leading-relaxed">
                Allow users to save and share unique custom URLs for their
                drawings.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 p-6">
              <h4 className="text-xl font-bold text-white">Save Drawings</h4>
              <p className="text-neutral-300 leading-relaxed">
                Enable saving drawings for later editing and sharing.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 p-6">
              <h4 className="text-xl font-bold text-white">
                Flexible Canvas Size
              </h4>
              <p className="text-neutral-300 leading-relaxed">
                Provide more freedom to adjust the canvas size based on user
                requirements.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 p-6">
              <h4 className="text-xl font-bold text-white">
                Responsive Drawing Board
              </h4>
              <p className="text-neutral-300 leading-relaxed">
                Improve the drawing board design for various screen sizes for a
                better user experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-center py-12 border-t border-neutral-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-8">
              <a
                href="https://github.com/sarvansh30"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>

              <a
                href="https://x.com/sarv_ansh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X (Twitter)</span>
              </a>

              <a
                href="mailto:sarvansh.pachori45@gmail.com"
                className="text-neutral-400 hover:text-white transition-colors duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>Contact</span>
              </a>
            </div>

            <p className="text-neutral-400 text-lg">
              © 2025 Brush It. Made by{" "}
              <a
                href="https://github.com/sarvansh30"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                Sarvansh
              </a>
            </p>
          </div>
        </div>
      </footer>

      {isCreatingRoom && (
        <CreateRoomDialog
          onCreateRoom={handleCreateRoom}
          onClose={() => setIsCreatingRoom(false)}
        />
      )}
    </div>
  );
};

export default Home;