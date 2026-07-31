/**
 * Advanced SOC Lab — PostCSS Configuration
 * Required by Tailwind CSS for class generation and vendor prefixing.
 */
module.exports = {
  plugins: {
    tailwindcss: {},   // Processes @tailwind directives in src/index.css
    autoprefixer: {},  // Adds vendor prefixes (-webkit-, -moz-, etc.)
  },
};