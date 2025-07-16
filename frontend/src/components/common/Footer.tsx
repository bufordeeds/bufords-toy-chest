import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-text">
            Made with ❤️ by Buford | Open for everyone to play!
          </p>
          <div className="footer-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span className="footer-separator">•</span>
            <a href="/privacy">Privacy</a>
            <span className="footer-separator">•</span>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};