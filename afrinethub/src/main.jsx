import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './refinement.css';

const root = document.getElementById('root');
const page = <React.StrictMode><App/></React.StrictMode>;
// Development renders normally; production hydrates pre-rendered HTML.
if (root.hasChildNodes()) {
  hydrateRoot(root, page);
} else {
  createRoot(root).render(page);
}
