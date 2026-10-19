import { useState } from 'react'
import { Award, Menu, Waves, X } from 'lucide-react'
import type { PageKey } from '../types/ocean'

const navItems: { key: PageKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'explore', label: 'Ocean Explorer' },
  { key: 'temperature', label: 'Temperature Profiles' },
  { key: 'ocean-intelligence', label: 'Ocean Intelligence' },
  { key: 'cyclone-analysis', label: 'Cyclone–Ocean Analysis' },
  { key: 'validation', label: 'Validation' },
  { key: 'uncertainty', label: 'Uncertainty' },
  { key: 'technical', label: 'Technical Details' },
]

interface NavigationProps {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
  onToggleJuryMode?: () => void
  juryModeActive?: boolean
}

export function Navigation({
  currentPage,
  onNavigate,
  onToggleJuryMode,
  juryModeActive = false,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function handleNavigate(page: PageKey) {
    onNavigate(page)
    setMobileMenuOpen(false)
  }

  return (
    <header className="government-header" role="banner">
      {/* Topmost Institutional Bar */}
      <div className="gov-topbar">
        <div className="gov-topbar__inner">
          <div className="gov-topbar__left">
            <span className="gov-sih-tag">
              <Award size={12} className="inline-icon" /> OCEAN INTELLIGENCE PLATFORM
            </span>
            <span className="gov-topbar-divider">|</span>
            <span className="gov-topbar-scope">
              Subsurface Ocean Temperature Reconstructions · 35 Vertical Levels
            </span>
          </div>
          <div className="gov-topbar__right">
            <span className="gov-topbar-badge">
              Domain: Bay of Bengal (5°N–22°N, 80°E–100°E)
            </span>
            <span className="gov-topbar-badge">
              Grid: 69 × 81 · 35 Vertical Depths (~0.5–902 m)
            </span>
          </div>
        </div>
      </div>

      {/* Main Scientific Brand & Navigation Header */}
      <div className="gov-main-header">
        <div className="gov-main-header__inner">
          {/* Brand Identity */}
          <a
            className="gov-brand"
            href="#overview"
            onClick={(e) => {
              e.preventDefault()
              handleNavigate('overview')
            }}
            aria-label="SAMUDRA Portal Home"
          >
            <div className="gov-brand__logo" aria-hidden="true">
              <Waves size={24} strokeWidth={2.2} />
            </div>
            <div className="gov-brand__text">
              <div className="gov-brand__title-row">
                <strong className="gov-brand__title">SAMUDRA</strong>
                <span className="gov-brand__pill">RESEARCH</span>
              </div>
              <span className="gov-brand__subtitle">
                Satellite-Based Subsurface Ocean Temperature Reconstruction
              </span>
            </div>
          </a>

          {/* Guided Walkthrough Button (Desktop) */}
          {onToggleJuryMode && (
            <button
              type="button"
              className={`gov-jury-btn ${juryModeActive ? 'is-active' : ''}`}
              onClick={onToggleJuryMode}
              title="Toggle Scientific Walkthrough Guide"
            >
              <Award size={14} />
              <span>{juryModeActive ? 'EXIT WALKTHROUGH' : 'GUIDED WALKTHROUGH'}</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="gov-mobile-toggle"
            type="button"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Horizontal Scientific Tab Navigation Bar */}
      <nav className={`gov-navbar ${mobileMenuOpen ? 'gov-navbar--open' : ''}`} aria-label="Primary Portal Navigation">
        <div className="gov-navbar__inner">
          {navItems.map(({ key, label }) => {
            const isActive = currentPage === key
            return (
              <a
                key={key}
                href={`#${key}`}
                className={`gov-nav-link ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavigate(key)
                }}
              >
                {label}
                {isActive && <span className="gov-nav-indicator" />}
              </a>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
