import React from 'react';

export default function Logo({ size = 36 }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="40 10 425 410" 
      width={size} 
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', maxWidth: '100%', maxHeight: '100%' }}
    >
      {/* Left Document (Stacked Shadow) */}
      <rect x="68" y="75" width="140" height="225" rx="14" fill="none" stroke="#0B1936" strokeWidth="14"/>

      {/* Left Document (Main Sheet) */}
      <path d="M 105 40 L 180 40 L 220 80 L 220 285 C 220 295 212 303 202 303 L 105 303 C 95 303 87 295 87 285 L 87 58 C 87 48 95 40 105 40 Z" 
            fill="#FFFFFF" stroke="#0B1936" strokeWidth="14" strokeLinejoin="round"/>
      <path d="M 180 40 L 180 80 L 220 80" fill="none" stroke="#0B1936" strokeWidth="14" strokeLinejoin="round"/>

      {/* Document Lines */}
      <line x1="115" y1="115" x2="185" y2="115" stroke="#0B1936" strokeWidth="10" strokeLinecap="round"/>
      <line x1="115" y1="145" x2="195" y2="145" stroke="#0B1936" strokeWidth="10" strokeLinecap="round"/>
      <line x1="115" y1="175" x2="195" y2="175" stroke="#0B1936" strokeWidth="10" strokeLinecap="round"/>
      <line x1="115" y1="205" x2="175" y2="205" stroke="#0B1936" strokeWidth="10" strokeLinecap="round"/>
      <line x1="115" y1="235" x2="185" y2="235" stroke="#0B1936" strokeWidth="10" strokeLinecap="round"/>

      {/* Right Neural Brain lobe */}
      <path d="M 260 45 C 300 20, 360 20, 380 60 C 410 60, 430 90, 425 125 C 445 150, 445 190, 420 220 C 430 250, 410 290, 370 300 C 340 310, 300 295, 270 270" 
            fill="none" stroke="#0B1936" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Brain Connections & Nodes */}
      <path d="M 300 90 L 350 80 L 380 130 L 330 160 L 300 90 M 380 130 L 400 190 L 340 220 L 330 160 M 340 220 L 300 240" 
            fill="none" stroke="#0B1936" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="300" cy="90" r="9" fill="#0B1936"/>
      <circle cx="350" cy="80" r="9" fill="#0B1936"/>
      <circle cx="380" cy="130" r="9" fill="#0B1936"/>
      <circle cx="330" cy="160" r="9" fill="#0B1936"/>
      <circle cx="400" cy="190" r="9" fill="#0B1936"/>
      <circle cx="340" cy="220" r="9" fill="#0B1936"/>
      <circle cx="300" cy="240" r="9" fill="#0B1936"/>

      {/* Center Speech Bubble Overlay */}
      <path d="M 250 160 C 295 160, 330 195, 330 240 C 330 285, 295 320, 250 320 C 236 320, 223 316, 212 309 L 178 325 L 188 293 C 177 279, 170 260, 170 240 C 170 195, 205 160, 250 160 Z" 
            fill="#FFFFFF" stroke="#38BDF8" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Plus / Help Symbol inside Bubble */}
      <line x1="250" y1="212" x2="250" y2="268" stroke="#0B1936" strokeWidth="14" strokeLinecap="round"/>
      <line x1="222" y1="240" x2="278" y2="240" stroke="#0B1936" strokeWidth="14" strokeLinecap="round"/>

      {/* Underlying Text: SAH.ai */}
      <text x="250" y="395" 
            textAnchor="middle" 
            fill="#0B1936" 
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            fontWeight="800" 
            fontSize="62" 
            letterSpacing="-1">SAH.ai</text>
    </svg>
  );
}