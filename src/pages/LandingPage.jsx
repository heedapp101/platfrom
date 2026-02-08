import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Users, 
  Store, 
  TrendingUp,
  MessageCircle,
  Star,
  ChevronDown,
  Menu,
  X,
  Smartphone,
  Monitor,
  Download,
  CheckCircle,
  ShoppingBag,
  Heart,
  Bell,
  Camera
} from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showGetStartedModal, setShowGetStartedModal] = useState(false);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState({ loading: false, success: false, error: "" });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle contact form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus({ loading: true, success: false, error: "" });
    
    try {
      const response = await fetch(API_ENDPOINTS.CONTACT.SUBMIT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setContactStatus({ loading: false, success: true, error: "" });
        setContactForm({ name: "", email: "", message: "" });
        // Reset success message after 5 seconds
        setTimeout(() => setContactStatus({ loading: false, success: false, error: "" }), 5000);
      } else {
        setContactStatus({ loading: false, success: false, error: data.message || "Failed to send message" });
      }
    } catch (error) {
      setContactStatus({ loading: false, success: false, error: "Network error. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-3xl font-heed text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Heed </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-gray-600 hover:text-indigo-600 transition font-medium">Home</a>
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition font-medium">Features</a>
              <a href="#about" className="text-gray-600 hover:text-indigo-600 transition font-medium">About Us</a>
              <a href="#contact" className="text-gray-600 hover:text-indigo-600 transition font-medium">Contact</a>
              <Link 
                to="/login" 
                className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition flex items-center gap-2"
              >
                Login <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#home" className="block text-gray-600 hover:text-indigo-600 py-2">Home</a>
              <a href="#features" className="block text-gray-600 hover:text-indigo-600 py-2">Features</a>
              <a href="#about" className="block text-gray-600 hover:text-indigo-600 py-2">About Us</a>
              <a href="#contact" className="block text-gray-600 hover:text-indigo-600 py-2">Contact</a>
              <Link 
                to="/login" 
                className="block w-full bg-indigo-600 text-white text-center px-6 py-3 rounded-full font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                <Smartphone size={16} /> Mobile App + <Monitor size={16} /> Seller Dashboard
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                Buy & Sell on{" "}
                <span className="font-heed text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-5xl sm:text-6xl lg:text-7xl">
                  Heed{" "}
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                Discover unique products on our mobile app or grow your business with our powerful seller dashboard. 
                The complete marketplace ecosystem for buyers and sellers.
              </p>
              
              {/* Two CTAs for App & Dashboard */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowGetStartedModal(true)}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-lg"
                >
                  <Download size={20} /> Get the App
                </button>
                <Link 
                  to="/login" 
                  className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-indigo-50 transition text-center text-lg flex items-center justify-center gap-2"
                >
                  <Store size={20} /> Seller Dashboard
                </Link>
              </div>
              
              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">10K+</p>
                  <p className="text-gray-600">Active Sellers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">50K+</p>
                  <p className="text-gray-600">Happy Buyers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">100K+</p>
                  <p className="text-gray-600">Products</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                {/* App mockup image */}
                <img 
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=500&fit=crop" 
                  alt="Heed Mobile App" 
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              {/* Floating cards */}
              <div className="absolute -left-8 top-1/4 bg-white p-4 rounded-xl shadow-lg z-20 animate-bounce">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Today's Sales</p>
                    <p className="font-bold text-gray-900">+₹24,500</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-1/4 bg-white p-4 rounded-xl shadow-lg z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Heart className="text-pink-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">New Likes</p>
                    <p className="font-bold text-gray-900">+1,234</p>
                  </div>
                </div>
              </div>
              {/* Background decoration */}
              <div className="absolute -z-10 top-10 right-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-40"></div>
              <div className="absolute -z-10 bottom-10 left-10 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-40"></div>
            </div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="flex justify-center mt-16">
          <a href="#how-it-works" className="animate-bounce">
            <ChevronDown size={32} className="text-gray-400" />
          </a>
        </div>
      </section>

      {/* How It Works - For Buyers & Sellers */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              How <span className="font-heed text-indigo-600">Heed </span> Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're shopping or selling, we've got you covered
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* For Buyers */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Smartphone className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Buyers</h3>
              </div>
              <p className="text-gray-600 mb-6">Download our mobile app to discover and purchase unique products</p>
              <div className="space-y-4">
                {[
                  { icon: <Download size={20} />, text: "Download the Heed app from App Store or Play Store" },
                  { icon: <Camera size={20} />, text: "Browse stunning product photos from local sellers" },
                  { icon: <MessageCircle size={20} />, text: "Chat directly with sellers before buying" },
                  { icon: <ShoppingBag size={20} />, text: "Place orders and track delivery in real-time" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600">
                      {step.icon}
                    </div>
                    <p className="text-gray-700">{step.text}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowGetStartedModal(true)}
                className="mt-6 w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download App
              </button>
            </div>

            {/* For Sellers */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Store className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Sellers</h3>
              </div>
              <p className="text-gray-600 mb-6">Use the app to create posts & dashboard to manage your business</p>
              <div className="space-y-4">
                {[
                  { icon: <Camera size={20} />, text: "Sign up on the app & post your products with photos" },
                  { icon: <Monitor size={20} />, text: "Access your seller dashboard on web for analytics" },
                  { icon: <BarChart3 size={20} />, text: "Track sales, views, and customer engagement" },
                  { icon: <Zap size={20} />, text: "Boost products and run targeted ads" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-600">
                      {step.icon}
                    </div>
                    <p className="text-gray-700">{step.text}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowGetStartedModal(true)}
                className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <ArrowRight size={18} /> Get Started as Seller
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Powerful Features for Everyone
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tools designed for both buyers and sellers to have the best marketplace experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: <Camera className="text-indigo-600" size={28} />,
                title: "Beautiful Product Posts",
                description: "Sellers create stunning posts with multiple images. Buyers discover products in a Pinterest-style feed on the app."
              },
              {
                icon: <BarChart3 className="text-indigo-600" size={28} />,
                title: "Seller Analytics",
                description: "Sellers access detailed analytics on the web dashboard - track views, sales, and customer engagement in real-time."
              },
              {
                icon: <ShieldCheck className="text-indigo-600" size={28} />,
                title: "Secure Transactions",
                description: "Safe and secure payments with order tracking. Both buyers and sellers are protected throughout the transaction."
              },
              {
                icon: <MessageCircle className="text-indigo-600" size={28} />,
                title: "In-App Chat",
                description: "Buyers and sellers communicate directly through the app. Ask questions, negotiate, and build relationships."
              },
              {
                icon: <Zap className="text-indigo-600" size={28} />,
                title: "Boost & Ads",
                description: "Sellers can boost their products and run ads through the dashboard to reach more potential buyers."
              },
              {
                icon: <Bell className="text-indigo-600" size={28} />,
                title: "Real-time Notifications",
                description: "Stay updated with instant notifications for orders, messages, likes, and more on both app and web."
              },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">About <span className="font-heed text-indigo-600">Heed </span></h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Heed is a complete marketplace ecosystem that connects local sellers with buyers. 
                Our mobile app lets you discover and purchase unique products, while our web dashboard 
                empowers sellers with powerful tools to grow their business.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We believe in empowering small businesses and entrepreneurs by providing them with 
                the technology they need to succeed. From product posting to analytics, from chat 
                to order management - we've got everything covered.
              </p>
              
              {/* App + Web badges */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Smartphone className="text-purple-600" size={20} />
                  <span className="text-gray-700 font-medium">iOS & Android App</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Monitor className="text-indigo-600" size={20} />
                  <span className="text-gray-700 font-medium">Web Dashboard</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                </div>
                <p className="text-gray-600">Join <span className="font-semibold text-gray-900">50,000+</span> users on <span className="font-heed text-indigo-600">Heed</span></p>
              </div>
            </div>

            {/* Founder Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <img 
                    src="/paul.jpeg" 
                    alt="Paul Jo - Founder" 
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-indigo-100"
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Star className="text-white" size={20} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Paul Jo</h3>
                <p className="text-indigo-600 font-medium mb-4">Founder & CEO</p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  "We're building <span className="font-heed text-indigo-600">Heed</span> to empower local sellers and create a 
                  seamless shopping experience. Our vision is to become the go-to marketplace 
                  for discovering unique, quality products from passionate sellers."
                </p>
                <div className="flex justify-center gap-6 text-sm">
                  <div>
                    <p className="font-bold text-gray-900">5+ Years</p>
                    <p className="text-gray-500">Experience</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div>
                    <p className="font-bold text-gray-900">50+ Projects</p>
                    <p className="text-gray-500">Delivered</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div>
                    <p className="font-bold text-gray-900">Award</p>
                    <p className="text-gray-500">Winner</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">What Our Users Say</h2>
            <p className="text-lg text-gray-600">Trusted by thousands of buyers and sellers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Fashion Retailer",
                image: "https://randomuser.me/api/portraits/women/65.jpg",
                text: "Heed transformed my business. The analytics helped me understand my customers better and increased my sales by 150%."
              },
              {
                name: "Michael Chen",
                role: "Electronics Seller",
                image: "https://randomuser.me/api/portraits/men/75.jpg",
                text: "The platform is incredibly intuitive. I was able to set up my store and start selling within hours. Highly recommended!"
              },
              {
                name: "Emily Davis",
                role: "Home Decor Shop",
                image: "https://randomuser.me/api/portraits/women/42.jpg",
                text: "Customer support is amazing, and the boost feature really helped me reach new customers. My business has grown 3x since joining."
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-2xl">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-yellow-400" size={18} />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight">
            Ready to Join <span className="font-heed">Heed </span>?
          </h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Download our app to start shopping, or sign in to access your seller dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setShowGetStartedModal(true)}
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition"
            >
              <Download size={20} /> Get Started Now
            </button>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition"
            >
              <Store size={20} /> Seller Login
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight">Get in Touch</h2>
              <p className="text-gray-400 mb-8 text-base sm:text-lg">
                Have questions about our app or seller dashboard? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-300">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                    <MessageCircle className="text-indigo-400" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Email Us</p>
                    <p className="text-gray-400">support@heed.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-300">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                    <Smartphone className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Download App</p>
                    <p className="text-gray-400">Available on iOS & Android</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-8">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                {contactStatus.success && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl">
                    <CheckCircle size={20} />
                    <span>Message sent successfully! We'll get back to you soon.</span>
                  </div>
                )}
                {contactStatus.error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
                    {contactStatus.error}
                  </div>
                )}
                <div>
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <textarea 
                    rows="4" 
                    placeholder="Your Message" 
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={contactStatus.loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {contactStatus.loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>Send Message</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <span className="text-2xl font-heed text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Heed </span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Heed. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Get Started Modal */}
      {showGetStartedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowGetStartedModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Get Started with <span className="font-heed text-indigo-600">Heed</span></h3>
                <p className="text-gray-500 mt-1">Choose how you want to use Heed</p>
              </div>
              <button onClick={() => setShowGetStartedModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Buyer Option */}
              <div className="border-2 border-purple-200 rounded-2xl p-6 hover:border-purple-400 transition cursor-pointer bg-purple-50/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="text-purple-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">I want to Buy</h4>
                    <p className="text-gray-600 text-sm mt-1">Download our mobile app to browse and purchase products from local sellers</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a 
                        href="#" 
                        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                        App Store
                      </a>
                      <a 
                        href="#" 
                        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
                        Play Store
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Option */}
              <div className="border-2 border-indigo-200 rounded-2xl p-6 hover:border-indigo-400 transition cursor-pointer bg-indigo-50/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="text-indigo-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">I want to Sell</h4>
                    <p className="text-gray-600 text-sm mt-1">Start by downloading the app to create your seller account and post products</p>
                    
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <Smartphone className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-amber-800 text-sm font-medium">Sign up on the Heed App first</p>
                          <p className="text-amber-700 text-xs mt-1">Create your seller account and post products using our mobile app, then access your dashboard here to manage analytics, orders, and ads.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a 
                        href="#" 
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                      >
                        <Download size={16} /> Download App to Sign Up
                      </a>
                      <Link 
                        to="/login" 
                        className="inline-flex items-center gap-2 border border-indigo-300 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition"
                        onClick={() => setShowGetStartedModal(false)}
                      >
                        Already have account? Login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              Need help? <a href="#contact" onClick={() => setShowGetStartedModal(false)} className="text-indigo-600 hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
