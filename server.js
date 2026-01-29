// for caching purposes

const express = require('express');
const app = express();
const compression = require('compression');

// Add caching middleware for static files
app.use((req, res, next) => {
  // Cache static assets for 1 week (604800 seconds)
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.set('Cache-Control', 'public, max-age=604800, immutable');
  }
  // Cache HTML files for 1 hour
  else if (req.url.match(/\.html$/)) {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  // No cache for API responses
  else if (req.url.match(/^\/api\//)) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

app.use(express.static('public')); // or '.' for your root directory
app.use(compression()); // Add this near the top of middleware<link rel="stylesheet" href="./style.css?v=1.0">