import React, { useState } from 'react';

// Button Component
const Button = ({ 
  variant = 'default', 
  size = 'default', 
  className = '', 
  children, 
  onClick,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };
  
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Chevron Icons
const ChevronLeft = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Header Component
const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-16 h-16 bg-azalee-navy rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">A</span>
              </div>
              <span className="text-2xl font-semibold text-gray-900">Azalee</span>
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 ml-44">
            <a 
              href="/fiscalite" 
              className="text-gray-700 hover:text-azalee-navy transition-colors text-sm font-medium"
            >
              Fiscalité
            </a>
            <a 
              href="/investissement-immobilier" 
              className="text-gray-700 hover:text-azalee-navy transition-colors text-sm font-medium"
            >
              Investissement Immobilier
            </a>
            <a 
              href="/placements" 
              className="text-gray-700 hover:text-azalee-navy transition-colors text-sm font-medium"
            >
              Placements
            </a>
            <a 
              href="/retraite" 
              className="text-gray-700 hover:text-azalee-navy transition-colors text-sm font-medium"
            >
              Retraite
            </a>
            <a 
              href="/patrimoine" 
              className="text-gray-700 hover:text-azalee-navy transition-colors text-sm font-medium"
            >
              Patrimoine
            </a>
            <a 
              href="/outils-financiers" 
              className="text-gray-700 hover:text-azalee-navy transition-colors text-sm font-medium"
            >
              Outils financiers
            </a>
          </nav>

          {/* Contact CTA */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-azalee-navy text-azalee-navy hover:bg-azalee-navy hover:text-white"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

// ContactBar Component
const ContactBar = () => {
  return (
    <div className="bg-gray-50 border-b border-gray-200 py-2">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-center lg:justify-end space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span>📞</span>
            <span>07.45.06.43.88</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>✉️</span>
            <span>contact@alliance-courtage.fr</span>
          </div>
          <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500">
            <span>Non-agents</span>
            <span>|</span>
            <span>Actualités</span>
            <span>|</span>
            <span className="text-amber-600 font-medium">Espace client</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// HeroSection Component
const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 9;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const previousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  return (
    <section className="bg-azalee-navy relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[500px] py-12 lg:py-16">
          {/* Left Content */}
          <div className="text-white space-y-6">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
              VOTRE PARTENAIRE DE CONFIANCE EN MATIÈRE DE{" "}
              <span className="text-azalee-yellow">GESTION DE PATRIMOINE</span>, DE FISCALITÉ ET DE CONSEIL EN{" "}
              <span className="text-azalee-yellow">INVESTISSEMENT</span>.
            </h1>
            
            <p className="text-lg text-gray-200 leading-relaxed">
              Explorez des conseils personnalisés en matière de fiscalité, d'immobilier, 
              d'investissements, de retraite et de{" "}
              <span className="text-azalee-yellow font-medium">gestion de patrimoine</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-base font-medium"
              >
                Obtenez Votre Consultation Personnalisée
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-azalee-navy px-8 py-3 text-base font-medium"
              >
                Commencez À Explorer Les Sujets
              </Button>
            </div>
          </div>

          {/* Right Content - Carousel Placeholder */}
          <div className="relative">
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl min-h-[300px]">
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 w-12 h-12"
            onClick={previousSlide}
          >
            <ChevronLeft />
          </Button>
        </div>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 w-12 h-12"
            onClick={nextSlide}
          >
            <ChevronRight />
          </Button>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center space-x-2 pb-8">
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-azalee-yellow' : 'bg-white/30'
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// ContentSection Component
const ContentSection = () => {
  return (
    <section className="bg-azalee-light-gray py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="max-w-4xl">
          {/* Yellow accent circle */}
          <div className="relative mb-8">
            <div className="w-16 h-16 bg-azalee-yellow rounded-full absolute -left-4"></div>
            <div className="w-4 h-16 bg-gray-300 ml-12"></div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              GESTION DE PATRIMOINE — OPTIMISATION FISCALE IMMOBILIÈRE — CONSEIL FINANCIER
            </h2>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Depuis 30 ans, nous façonnons l'avenir financier de clients exigeants. Notre mission : 
              libérer le potentiel caché de votre patrimoine grâce à une approche humaine, experte 
              et transparente. Nous construisons des relations de confiance basées sur la proximité, 
              l'écoute active et l'engagement partagé — à vos côtés à chaque étape 
              de votre projet.
            </p>

            <div className="pt-4">
              <Button 
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-base font-medium"
              >
                Rencontrez-Nous
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Azalee Website Component
const AzaleeWebsite = () => {
  return (
    <div className="min-h-screen bg-white">
      <ContactBar />
      <Header />
      <main>
        <HeroSection />
        <ContentSection />
      </main>
    </div>
  );
};

// Export for use
export default AzaleeWebsite; 