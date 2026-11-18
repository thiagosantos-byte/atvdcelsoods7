import React from 'react';

export default function EnergiaVivaLogo({ subtitle = 'COMUNIDADE · ODS 7', compact = false, theme = 'light' }) {
  return <div className={`brand-lockup energia-viva-brand ${compact ? 'brand-compact' : ''}`}>
    <img className="brand-image" src={theme === 'dark' ? '/energia-viva-logo-dark.svg' : '/energia-viva-logo.png'} alt="Energia Viva" />
    <small className="brand-subtitle">{subtitle}</small>
  </div>;
}
