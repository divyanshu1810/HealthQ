"use client";
import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { ChevronDown, Globe, MessageSquare, Users, Shield, ArrowRight } from 'lucide-react';

// Language selector type
type Language = {
  code: string;
  name: string;
  flag: string;
};

// Available languages
const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const [showLanguages, setShowLanguages] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black">
      <Head>
        <title>HealthQ: Multilingual Chatbot</title>
        <meta name="description" content="HealthQ - Your health assistant in multiple languages" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-2xl font-bold">
              Health<span className="bg-black text-white">Q</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                <li><a href="#features" className="hover:text-gray-300 transition duration-300">Features</a></li>
                <li><a href="/auth" className="hover:text-gray-300 transition duration-300">Demo</a></li>
                <li><a href="#languages" className="hover:text-gray-300 transition duration-300">Languages</a></li>
                <li><a href="#about" className="hover:text-gray-300 transition duration-300">About</a></li>
                <li><a href="#contact" className="hover:text-gray-300 transition duration-300">Contact</a></li>
              </ul>
            </nav>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4">
              <ul className="flex flex-col space-y-3">
                <li><a href="#features" className="block hover:text-gray-300">Features</a></li>
                <li><a href="#demo" className="block hover:text-gray-300">Demo</a></li>
                <li><a href="#languages" className="block hover:text-gray-300">Languages</a></li>
                <li><a href="#about" className="block hover:text-gray-300">About</a></li>
                <li><a href="#contact" className="block hover:text-gray-300">Contact</a></li>
              </ul>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-100 to-gray-200 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Your Health Assistant in Any Language
              </h1>
              <p className="text-gray-700 text-lg mb-8 max-w-md">
                HealthQ provides accurate medical information and guidance in multiple languages, making healthcare accessible to everyone around the world.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <a 
                  href="/auth"
                  className="bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition duration-300 text-center"
                >
                  Try Demo
                </a>
                <a 
                  href="#features" 
                  className="border border-black px-6 py-3 rounded font-medium hover:bg-gray-100 transition duration-300 text-center"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="bg-white p-4 rounded-lg shadow-xl max-w-md mx-auto">
                <div className="flex items-center p-3 bg-black text-white rounded-t-md">
                  <MessageSquare size={20} className="mr-2" />
                  <div className="font-medium">HealthQ Chat</div>
                  <div className="ml-auto relative">
                    <button 
                      className="flex items-center space-x-1 focus:outline-none"
                      onClick={() => setShowLanguages(!showLanguages)}
                    >
                      <span>{selectedLanguage.flag}</span>
                      <ChevronDown size={16} />
                    </button>
                    {showLanguages && (
                      <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-md shadow-lg overflow-hidden z-20">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                            onClick={() => {
                              setSelectedLanguage(lang);
                              setShowLanguages(false);
                            }}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 h-64 overflow-y-auto">
                  <div className="flex mb-4">
                    <div className="bg-gray-200 rounded-lg p-3 max-w-xs">
                      <p className="text-sm">How can I reduce my fever without medication?</p>
                    </div>
                  </div>
                  <div className="flex justify-end mb-4">
                    <div className="bg-black text-white rounded-lg p-3 max-w-xs">
                      <p className="text-sm">
                        To reduce fever naturally, you can try these methods:
                        <br />- Stay hydrated with plenty of fluids
                        <br />- Apply a lukewarm compress
                        <br />- Rest and get plenty of sleep
                        <br />- Take a lukewarm bath
                        <br />
                        <br />Would you like more details on any of these methods?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t">
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="Ask a health question..."
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button className="ml-2 bg-black text-white p-2 rounded-md">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose HealthQ?</h2>
            <p className="text-gray-600">Our AI-powered chatbot delivers accurate health information in multiple languages, making healthcare knowledge accessible to everyone.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300">
              <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multilingual Support</h3>
              <p className="text-gray-600">
                Get health information in over 30 languages with accurate translations that preserve medical nuance and terminology.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300">
              <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Accurate Information</h3>
              <p className="text-gray-600">
                Powered by verified medical databases and regularly updated with the latest research and health guidelines.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300">
              <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Culturally Sensitive</h3>
              <p className="text-gray-600">
                Considers cultural context and health practices when providing information across different regions.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300">
              <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Privacy Focused</h3>
              <p className="text-gray-600">
                Your health questions remain private and secure with enterprise-grade encryption and anonymized data.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300">
              <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">24/7 Availability</h3>
              <p className="text-gray-600">
                Access health guidance anytime, anywhere without waiting for appointments or office hours.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-300">
              <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Personalized Guidance</h3>
              <p className="text-gray-600">
                Receive tailored health information based on your specific questions and concerns.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Languages Section */}
      <section id="languages" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Supported Languages</h2>
            <p className="text-gray-600">HealthQ breaks down language barriers to healthcare information with support for these languages and more.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {languages.map((lang) => (
              <div key={lang.code} className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 hover:shadow-md transition duration-300">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </div>
            ))}
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 hover:shadow-md transition duration-300">
              <span className="text-2xl">🌐</span>
              <span className="font-medium">And 20+ more</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to make health information accessible?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare providers, organizations, and individuals using HealthQ to break down language barriers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a 
              href="#contact" 
              className="bg-white text-black px-8 py-3 rounded-md font-medium hover:bg-gray-200 transition duration-300"
            >
              Get Started
            </a>
            <a 
              href="#demo" 
              className="border border-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-black transition duration-300"
            >
              Try Demo
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">HealthQ</div>
              <p className="text-gray-400 mb-4">
                Making healthcare information accessible across languages and cultures.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Home</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition duration-300">Features</a></li>
                <li><a href="#demo" className="text-gray-400 hover:text-white transition duration-300">Try Demo</a></li>
                <li><a href="#languages" className="text-gray-400 hover:text-white transition duration-300">Languages</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400">contact@healthq.com</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-400">+1 (555) 123-4567</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} HealthQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}