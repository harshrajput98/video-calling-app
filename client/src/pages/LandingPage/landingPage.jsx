import React from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
// You need to install lottie-react and import an animation JSON file
// Example: import heroAnimation from "../assets/hero-animation.json";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full">
        <div className="text-3xl font-extrabold tracking-tight cursor-pointer">
          <span className="text-white">We</span>
          <span className="text-purple-400">Meet</span>
        </div>
        <div className="space-x-6 text-lg font-semibold hidden md:flex">
          <Link to="/login" className="hover:underline">
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col-reverse md:flex-row items-center justify-between max-w-7xl mx-auto px-6 md:px-12 flex-grow">
        <div className="md:w-1/2 mt-12 md:mt-0">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Connect With Your Team <br /> Anytime, Anywhere
          </h1>
          <p className="text-lg text-blue-200 mb-8 max-w-xl">
            High-quality video and audio calls, screen sharing, and chat — all in one place.
            Experience seamless collaboration with WeMeet.
          </p>
          <div className="space-x-4">
            <Link
              to="/signup"
              className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Get Started – It’s Free
            </Link>
            <Link
              to="/login"
              className="inline-block bg-transparent border border-white hover:border-purple-400 px-6 py-3 rounded-lg font-semibold transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="md:w-1/2 max-w-lg">
          {/* Replace below div with Lottie animation or SVG */}
          {/* <Lottie animationData={heroAnimation} loop autoplay /> */}
          <div className="w-full h-80 bg-gradient-to-tr from-purple-400 to-blue-400 rounded-xl shadow-lg flex items-center justify-center text-4xl font-bold opacity-70 select-none">
            {/* Placeholder for Animation */}
           <img src="/front.webp" alt="eee" srcset="" />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-blue-800 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl font-extrabold mb-12">Why Choose WeMeet?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <FeatureCard
              title="Crystal Clear Video"
              description="Experience HD video calls with ultra-low latency and no interruptions."
              icon="🎥"
            />
            <FeatureCard
              title="Secure & Private"
              description="End-to-end encryption ensures your conversations stay confidential."
              icon="🔒"
            />
            <FeatureCard
              title="Easy Scheduling"
              description="Plan and join meetings effortlessly with calendar integrations."
              icon="📅"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 py-6 mt-auto text-center text-blue-300 text-sm">
        &copy; {new Date().getFullYear()} SlrTechCalls. All rights reserved.
      </footer>
    </div>
  );
};

const FeatureCard = ({ title, description, icon }) => (
  <div className="bg-blue-700 rounded-xl p-6 shadow-lg flex flex-col items-center text-center hover:bg-purple-700 transition">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-blue-200">{description}</p>
  </div>
);

export default LandingPage;
