import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css';
import { FiHeart, FiGlobe, FiSmile, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import logo from '../assets/sanjeevani.jpeg';

function Home() {
  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="nav-brand">
          <img src={logo} alt="Sanjeevani" style={{ width: "40px", height: "40px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)" }} />
          <span className="brand-name" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white", letterSpacing: "0.5px" }}>Sanjeevani</span>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn-text" style={{ fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.85)" }}>Login</Link>
          <Link to="/signup" className="btn-solid" style={{ padding: "6px 16px", fontSize: "0.95rem", background: "white", color: "#764ba2", border: "1px solid rgba(255,255,255,0.7)" }}>Sign Up Free</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section" style={{ padding: "80px 6%" }}>
        <main className="home-content">
          <section className="home-text">
            <h1>Don't Let Good Food Go To Waste. <br />Share It With The World.</h1>
            <p>
              A smart shelf-life and food sharing platform that connects donors,
              receivers, and admins to make sure good food never goes to waste.
            </p>

            <div className="cta-group" style={{ justifyContent: "center", marginTop: "32px", width: "100%" }}>
              <Link to="/signup" className="btn-solid large">Get Started</Link>
              <Link to="/login" className="btn-outline large">I have an account</Link>
            </div>
          </section>
        </main>
      </header>

      {/* Why Donate Section */}
      <section className="why-donate py-section">
        <div className="section-title">
          <h2>Why Donate Through Sanjeevani?</h2>
          <p>Your single meal donation creates a chain of positive impacts on society and the planet.</p>
        </div>

        <div className="grid-cards-3">
          <div className="info-card">
            <div className="icon-wrap green"><FiSmile /></div>
            <h3>Feed The Hungry</h3>
            <p>Millions of people go to bed hungry every day. Your surplus food can become someone's only assured meal for the day.</p>
          </div>
          <div className="info-card">
            <div className="icon-wrap green"><FiGlobe /></div>
            <h3>Save Our Planet</h3>
            <p>Food in landfills generates harmful greenhouse gases (Methane). Donating food directly reduces your carbon footprint.</p>
          </div>
          <div className="info-card">
            <div className="icon-wrap green"><FiHeart /></div>
            <h3>Spread Kindness</h3>
            <p>Donation builds a compassionate community. It brings people together to share resources, happiness, and hope.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works py-section">
        <div className="section-title">
          <h2>How Sanjeevani Works?</h2>
          <p>A simple, transparent, and fast process to prevent food wastage.</p>
        </div>

        <div className="grid-cards-3">
          <div className="info-card">
            <div className="icon-wrap green"><span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>1</span></div>
            <h3>List Your Surplus Food</h3>
            <p>As a Donor (Restaurant, Event Organizer, Individual), you just log in and list the extra food you have, along with its quantity and expiry time.</p>
          </div>
          <div className="info-card">
            <div className="icon-wrap green"><span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>2</span></div>
            <h3>Smart Notification</h3>
            <p>Nearby NGOs, Volunteers, and Receivers get instantly notified about your available food on their dashboard.</p>
          </div>
          <div className="info-card">
            <div className="icon-wrap green"><span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>3</span></div>
            <h3>Pick Up & Distribute</h3>
            <p>The Receiver claims the food, picks it up from your location, and distributes it to the needy before it spoils.</p>
          </div>
        </div>
      </section>

      {/* User Roles / Who Are We? */}
      <section className="user-roles py-section">
        <div className="section-title">
          <h2>Who Can Join Sanjeevani?</h2>
          <p>Everyone has a part to play in reducing food waste.</p>
        </div>

        <div className="grid-cards-3 roles-grid">
          <div className="role-box">
            <h4><FiCheckCircle className="check-icon" /> Food Donors</h4>
            <p>If you host parties, run a hotel, or have excess food at home, become a donor. Help us turn your surplus into smiles.</p>
          </div>
          <div className="role-box">
            <h4><FiCheckCircle className="check-icon" /> Receivers (NGOs)</h4>
            <p>If you run a shelter, orphanage, or help the needy on streets, register as a receiver to claim fresh food daily.</p>
          </div>
          <div className="role-box">
            <h4><FiCheckCircle className="check-icon" /> Platform Admins</h4>
            <p>Admins oversee the entire process, ensuring quality matching and tracking exactly how much food is saved globally.</p>
          </div>
        </div>
      </section>

      {/* Call to action Section */}
      <section className="ready-cta-section py-section" style={{ textAlign: "center", background: "transparent" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "20px", color: "#333", fontWeight: "800", textShadow: "0 2px 14px rgba(255, 255, 255, 0.9)" }}>Ready To Make a Difference?</h2>
        <Link to="/signup" className="btn-solid large">Join Sanjeevani Now</Link>
      </section>

      {/* Footer */}
      <footer className="simple-footer">
        <div className="footer-copyright">
          <p style={{ color: "#ffffff", fontSize: "1.05rem", margin: 0 }}>&copy; {new Date().getFullYear()} Sanjeevani Food Donation Platform. Designed to save food and lives.</p>
          <p style={{ color: "#ede7f6", fontSize: "1rem", margin: "8px 0 0 0", fontWeight: "500", letterSpacing: "0.5px" }}>Developed by - Prince Raj</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
