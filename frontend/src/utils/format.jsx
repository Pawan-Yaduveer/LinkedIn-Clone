// Text formatting helpers (JSX version)
// Splits text into paragraphs and highlights hashtags (#tag) preserving surrounding text.
import React from 'react';
export function renderFormattedText(text) {
  if (!text) return null;
  const paragraphs = text.split(/\n+/);
  return paragraphs.map((p, idx) => {
    const parts = p.split(/(#\w[\w-]*)/g);
    return (
      <p key={idx} style={{ margin: '6px 0' }}>
        {parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('#')) {
            const tag = part.slice(1);
            return <span key={i} className="hashtag">#{tag}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  });
}
