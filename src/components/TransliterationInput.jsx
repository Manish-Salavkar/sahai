import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function TransliterationInput({ value, onChangeText, ...props }) {
  const { i18n } = useTranslation();
  const isMarathi = i18n.language?.startsWith('mr');

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const inputRef = useRef(null);

  const fetchSuggestions = async (word) => {
    if (!word) {
      setSuggestions([]);
      return;
    }
    try {
      // Direct call to Google's free Input Tools API for Marathi (mr-t-i0-und)
      const res = await fetch(
        `https://inputtools.google.com/request?text=${word}&itc=mr-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`
      );
      const data = await res.json();
      if (data[0] === 'SUCCESS') {
        setSuggestions(data[1][0][1]);
        setSuggestionIndex(0);
      }
    } catch (err) {
      console.error('Transliteration error:', err);
    }
  };

  const handleChange = (e) => {
    const text = e.target.value;
    onChangeText(text);

    if (!isMarathi) return;

    // Grab the very last word being typed to send to Google
    const words = text.split(/(\s+)/);
    const lastWord = words[words.length - 1];

    // Only fetch if it's English characters
    if (lastWord && !/^[ऀ-ॿ]+$/.test(lastWord)) {
      fetchSuggestions(lastWord);
    } else {
      setSuggestions([]);
    }
  };

  const replaceWord = (replacement, addSpace = true) => {
    const words = value.split(/(\s+)/);
    // Replace the last English word with the chosen Marathi word
    words[words.length - 1] = replacement + (addSpace ? ' ' : '');
    onChangeText(words.join(''));
    
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isMarathi || suggestions.length === 0) return;

    if (e.key === ' ') {
      e.preventDefault();
      replaceWord(suggestions[suggestionIndex]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      replaceWord(suggestions[suggestionIndex], false); // No space on Enter so form can submit if needed
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    }
  };

  if (!isMarathi) {
    return (
      <input
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        {...props}
      />
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
      
      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            bottom: '100%', // Opens upwards so it doesn't get hidden under chat UI
            left: 0,
            zIndex: 50,
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem',
            listStyle: 'none',
            padding: 0,
            margin: '0 0 4px 0',
            minWidth: '200px',
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {suggestions.map((sug, idx) => (
            <li
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input blur before click registers
                replaceWord(sug);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                backgroundColor: idx === suggestionIndex ? '#f1f5f9' : 'transparent',
                color: idx === suggestionIndex ? '#2563eb' : '#0f172a',
                transition: 'background-color 0.2s',
              }}
            >
              {sug}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}