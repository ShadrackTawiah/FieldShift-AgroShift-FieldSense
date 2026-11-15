
import { Link } from 'react-router-dom'
import {
  Sprout,
  ArrowRight,
  CloudSun,
  Satellite,
  Layers3,
  Map,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import './LandingPage.css'

const features = [
  {
    icon: CloudSun,
    title: 'Climate Insights',
    description:
      'Explore climate conditions and weather-related information to support better farming decisions.',
  },
  {
    icon: Satellite,
    title: 'Earth Observation',
    description:
      'Use satellite-based information to understand agricultural land and monitor farm conditions.',
  },
  {
    icon: Layers3,
    title: 'Soil Intelligence',
    description:
      'Explore soil properties and understand how they can influence crop growth and productivity.',
  },
  {
    icon: Sprout,
    title: 'Farm Management',
    description:
      'Register your farms, organize farm information and manage your agricultural activities.',
  },
  {
    icon: Map,
    title: 'Farm Mapping',
    description:
      'Map your farm locations and use geographical information to understand your farmland.',
  },
  {
    icon: RefreshCw,
    title: 'Crop Rotation',
    description:
      'Explore crop rotation strategies that can support soil health and sustainable agriculture.',
  },
]

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="landing-page">

      {/* NAVIGATION */}
      <header className="landing-header">
        <Link to="/" className="landing-brand" onClick={closeMenu}>
          <span className="landing-brand-icon">
            <img
              src="/images/fieldshift-hero.jpg"
              alt="FieldShift Logo"
              className="landing-logo"
            />
          </span>

          <span>
            <strong>FieldShift</strong>
            <small>AGROSHIFT FIELDSENSE</small>
          </span>
        </Link>

        <button
          className="landing-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

        <nav className={`landing-nav ${menuOpen ? 'open' : ''}`}>
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#how-it-works" onClick={closeMenu}>How It Works</a>

          <div className="landing-nav-actions">
            <Link to="/login" className="landing-login" onClick={closeMenu}>
              Log In
            </Link>

            <Link to="/register" className="landing-register" onClick={closeMenu}>
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="landing-hero" id="home">
        <div className="landing-hero-overlay"></div>

        <div className="landing-hero-content">
          <div className="landing-eyebrow">
            <Sprout size={15} />
            SMART AGRICULTURE. BETTER FUTURES.
          </div>

          <h1>
            Smarter Farming.
            <span> Better Decisions.</span>
            A Sustainable Future.
          </h1>

          <p>
            Discover a smarter approach to agriculture with climate
            insights, satellite observations, soil intelligence and
            digital farm management — all in one platform.
          </p>

          <div className="landing-hero-buttons">
            <Link to="/register" className="landing-primary-button">
              Create Your Account <ArrowRight size={18} />
            </Link>

            <a href="#about" className="landing-secondary-button">
              Discover FieldShift
            </a>
          </div>

          <div className="landing-hero-note">
            <CheckCircle2 size={16} />
            <span>Technology supporting informed agricultural decisions</span>
          </div>
        </div>

        <div className="landing-hero-bottom">
          <span>AGRICULTURE</span>
          <span>TECHNOLOGY</span>
          <span>SUSTAINABILITY</span>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="landing-about" id="about">
        <div className="landing-section-label">ABOUT FIELD SHIFT</div>

        <div className="landing-about-grid">
          <div>
            <h2>
              Bringing agricultural intelligence
              <span> closer to farmers.</span>
            </h2>
          </div>

          <div>
            <p>
              FieldShift, powered by AgroShift FieldSense, is a digital
              agricultural platform designed to help farmers explore
              useful agricultural information and make more informed
              decisions about their farms.
            </p>

            <p>
              By bringing together climate data, earth observation,
              soil information and farm management tools, the platform
              aims to support more productive and sustainable farming.
            </p>

            <Link to="/register" className="landing-text-link">
              Start using FieldShift <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-features" id="features">
        <div className="landing-section-heading">
          <div className="landing-section-label">OUR PLATFORM</div>
          <h2>Everything you need to understand your farm better.</h2>
          <p>
            Explore digital tools designed to support agricultural
            planning, monitoring and farm management.
          </p>
        </div>

        <div className="landing-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article className="landing-feature-card" key={feature.title}>
                <div className="landing-feature-icon">
                  <Icon size={24} />
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>

                <Link to="/register">
                  Explore feature <ArrowRight size={15} />
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-how" id="how-it-works">
        <div className="landing-how-heading">
          <div className="landing-section-label">GET STARTED</div>
          <h2>Your journey to smarter farming starts here.</h2>
        </div>

        <div className="landing-steps">
          <div className="landing-step">
            <span>01</span>
            <h3>Create an account</h3>
            <p>Register for your FieldShift farmer account.</p>
          </div>

          <div className="landing-step">
            <span>02</span>
            <h3>Add your farm</h3>
            <p>Provide your farm details and location information.</p>
          </div>

          <div className="landing-step">
            <span>03</span>
            <h3>Explore insights</h3>
            <p>Access the available agricultural tools and information.</p>
          </div>

          <div className="landing-step">
            <span>04</span>
            <h3>Make informed decisions</h3>
            <p>Use the available insights to support your farm planning.</p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="landing-cta">
        <div className="landing-cta-icon">
          <BarChart3 size={29} />
        </div>

        <h2>Ready to explore smarter agriculture?</h2>

        <p>
          Join FieldShift and discover digital tools that can help
          you understand and manage your farm.
        </p>

        <Link to="/register" className="landing-primary-button">
          Get Started Today <ArrowRight size={18} />
        </Link>

        <span>
          Already have an account? <Link to="/login">Log in here</Link>
        </span>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-icon">
            <img
              src="/images/fieldshift-hero.jpg"
              alt="FieldShift Logo"
              className="landing-logo"
            />
          </span>

          <span>
            <strong>FieldShift</strong>
            <small>AGROSHIFT FIELDSENSE</small>
          </span>
        </Link>

        <p>
          Supporting smarter agricultural decisions through technology.
        </p>

        <div className="landing-footer-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>

        <div className="landing-copyright">
          © {new Date().getFullYear()} AgroShift FieldSense. All rights reserved.
        </div>
      </footer>

    </div>
  )
}

export default LandingPage
