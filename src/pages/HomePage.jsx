import React from 'react';
import { useNavigate } from 'react-router-dom';

// The Logo component now uses the image you provided.
// Make sure the image is in your `public` folder.
const Logo = () => (
    <img src="/Brush-it Logo.svg" alt="Brush It Logo" className="w-14 h-14 rounded-full" />
);

const Home = () => {
    const navigate = useNavigate();

    const createRoomButton = async () => {
        try {
            // Ensure the API endpoint matches your backend route
            const resp = await fetch('http://localhost:3000/api/create-room', {
                method: 'POST',
            });
            if (!resp.ok) {
                throw new Error('Network response was not ok');
            }
            const { roomId } = await resp.json();
            navigate(`/room/${roomId}`);
        } catch (err) {
            console.error("Error creating room:", err);
            alert("Could not create a new room. Please try again.");
        }
    };

    return (
        <>
            {/* We inject the animation styles directly for simplicity */}
            <style>
                {`
                    body {
                        font-family: 'Inter', sans-serif;
                        background-color: #fafafa;
                        color: #1f2937;
                    }
                    .hero-doodle path {
                        stroke-dasharray: 200;
                        stroke-dashoffset: 200;
                        animation: draw-loop 4s ease-in-out infinite;
                    }
                    .hero-doodle path:nth-child(2) {
                        animation-delay: 1s;
                    }
                    .hero-doodle path:nth-child(3) {
                        animation-delay: 2s;
                    }
                    @keyframes draw-loop {
                        0% {
                            stroke-dashoffset: 200;
                        }
                        70% {
                            stroke-dashoffset: 0;
                        }
                        100% {
                            stroke-dashoffset: -200;
                        }
                    }
                `}
            </style>

            {/* Header */}
            <header className="p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Logo />
                        <h1 className="text-3xl font-bold text-gray-800">Brush It</h1>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-20 md:py-28 text-center relative">
                {/* Container for the animated SVGs */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <svg className="hero-doodle w-full h-full" viewBox="0 0 400 200">
                        {/* Animated birds flying around the content */}
                        <path d="M50 50 Q 70 30 90 50" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        <path d="M300 80 Q 320 60 340 80" stroke="#2dd4bf" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        <path d="M150 160 Q 170 140 190 160" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    </svg>
                </div>
                
                <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                    Create, Collaborate, <br/>Instantly.
                </h2>
                <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
                    The simplest real-time whiteboard for your team, friends, or next big idea.
                </p>
                <button onClick={createRoomButton} className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-lg shadow-lg hover:bg-indigo-500 transition-all transform hover:scale-105">
                    Create a Room
                </button>
            </main>
            
            {/* How It Works Section */}
            <section className="bg-white py-20 border-t border-b border-gray-200">
                <div className="container mx-auto px-4 text-center">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center">
                            <div className="bg-indigo-100 text-indigo-600 rounded-full p-4 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <h4 className="text-xl font-semibold mb-2">1. Create Instantly</h4>
                            <p className="text-gray-500">Start a new, private canvas with a single click. No sign-up required.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-teal-100 text-teal-600 rounded-full p-4 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            </div>
                            <h4 className="text-xl font-semibold mb-2">2. Share the Link</h4>
                            <p className="text-gray-500">Send the unique room link to your team, friends, or students.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-purple-100 text-purple-600 rounded-full p-4 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h4 className="text-xl font-semibold mb-2">3. Draw Together</h4>
                            <p className="text-gray-500">Watch everyone's ideas appear on the shared canvas in real-time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center py-8 mt-8 border-t border-gray-200">
                <div className="container mx-auto px-4">
                    <p className="text-gray-500">&copy; 2024 Brush It. Made by Sarvansh.</p>
                </div>
            </footer>
        </>
    );
};

export default Home;
