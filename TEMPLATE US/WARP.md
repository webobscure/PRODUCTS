# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Gulp-based product page generator using Nunjucks templating for ONKRON product listings. It generates responsive HTML pages with images hosted on CDN (Shopify) for multiple regional stores (US, UK, Russia, France, Germany, Spain, Italy, Poland).

## Common Commands

### Development
```powershell
# Start development server with live reload
gulp

# Default task runs: cleanHtml -> nunjucks + styles + images + scripts + browsersync + beautify + watching
# Server runs on http://localhost:3000 (default BrowserSync port)
```

### Build Tasks
```powershell
# Generate production build
gulp build

# Clean distribution folder
gulp cleanDist

# Clean generated HTML files in app/
gulp cleanHtml
```

### Individual Tasks
```powershell
# Compile Nunjucks templates to HTML
gulp nunjucks

# Compile SCSS to CSS
gulp styles

# Minify and concatenate JavaScript
gulp scripts

# Optimize images (converts to WebP)
gulp images

# Beautify HTML output
gulp beautify
```

### Linting
```powershell
# Run ESLint (configuration uses airbnb-base)
npx eslint app/js/**/*.js
```

## Architecture

### Template System Architecture

The project uses a **data-driven templating approach** where configuration in `data.json` determines which regional CDN URLs are used and which product model is being generated.

**Key Flow:**
1. `data.json` sets `lang` flags (us/uk/ru/etc), `modelName`, and `links` (CDN URLs)
2. Nunjucks reads `data.json` via `gulp-data` during compilation
3. `components/macro.njk` evaluates `lang` flags to select appropriate CDN base URL
4. `pages/index.njk` uses the `image()` macro to generate responsive picture elements
5. Gulp outputs compiled HTML to `app/index.html`

### Directory Structure

```
app/
  templates/
    pages/          # Main page templates (index.njk)
    blocks/         # Reusable content blocks (header.njk, full-img.njk, etc)
    components/     # Macros and utilities (macro.njk)
  scss/             # Sass source files
  js/               # JavaScript source (main.js compiles to main.min.js)
  css/              # Compiled CSS output
  assets/
    images/
      src/1x/       # Source images for optimization
      dist/         # Optimized images
  *.html            # Generated HTML (index.html)
```

### Critical Configuration

**`data.json`** - Central configuration file:
- `lang`: Object with boolean flags for each region (only ONE should be true)
- `modelName`: Product model identifier (e.g., "g100-w")
- `folderName`: Used for Russian CDN paths only
- `links`: CDN base URLs for all regional stores

**Image Macro (`components/macro.njk`):**
- Evaluates `lang` flags sequentially (if/elif chain)
- Constructs `imgLink` based on active region
- `image()` macro generates `<picture>` elements with mobile/desktop sources
- Mobile breakpoint: max-width 480px

### Build Pipeline

1. **Nunjucks Compilation** (`gulp nunjucks`):
   - Reads `templates/pages/**/*.njk`
   - Injects `data.json` context
   - Renders through `templates/` path
   - Outputs to `app/`

2. **SCSS Compilation** (`gulp styles`):
   - Entry point: `app/scss/style.scss`
   - Imports: `header.scss`, `icons.scss`, `full-img.scss`, `grid-layout.scss`
   - Outputs: `app/css/style.min.css` (autoprefixed, expanded format)

3. **JavaScript** (`gulp scripts`):
   - Input: `app/js/main.js`
   - Outputs: `app/js/main.min.js` (concatenated, uglified)

4. **Images** (`gulp images`):
   - Source: `app/assets/images/src/1x/*`
   - Optimizes with imagemin (mozjpeg, optipng)
   - Outputs: `app/assets/images/dist/`
   - Only processes newer files

5. **Production Build** (`gulp build`):
   - Cleans `dist/` folder
   - Optimizes images
   - Copies to `dist/`: CSS, fonts, minified JS, HTML, images

## Development Workflow

### Creating a New Product Page

1. Update `data.json`:
   - Set ONE `lang` flag to `true`, others to `false`
   - Update `modelName` to product model identifier
   - Verify CDN URLs in `links` object match target store

2. Add product images to CDN following naming convention:
   - Desktop: `{modelName}-header-desc.jpg`, `{modelName}-block1-desc.jpg`, etc.
   - Mobile: `{modelName}-header-mob.jpg`, `{modelName}-block1-mob.jpg`, etc.

3. Edit `app/templates/pages/index.njk`:
   - Add/remove sections as needed
   - Update alt text for each image macro call
   - Maintain block numbering sequence

4. Run `gulp` to compile and preview
5. Run `gulp build` to generate production output in `dist/`

### Modifying Templates

- **Header changes**: Edit `app/templates/blocks/header.njk`
- **Global layout**: Modify `app/templates/pages/index.njk`
- **Image logic**: Update `app/templates/components/macro.njk`
- **Styling**: Edit files in `app/scss/`

### Watch Behavior

The default `gulp` task watches:
- `app/scss/**/*.scss` → triggers `styles`
- `app/js/**/*.js` (except main.min.js) → triggers `scripts`
- `app/templates/**/*.+(html|nunjucks|njk)` → triggers `nunjucks`
- `data.json` → triggers `nunjucks`
- `app/*.html` → triggers `beautify`

## Important Notes

- **Single-language builds**: Only one `lang` flag in `data.json` should be `true` at a time
- **Image paths are dynamic**: Image URLs are constructed at build time based on `lang` and `modelName`
- **Russian special case**: Russian CDN uses `folderName` in the path structure
- **HTML is generated**: Never edit `app/index.html` directly - always edit `.njk` templates
- **BrowserSync auto-reload**: Page refreshes automatically when templates, styles, or scripts change
- **Image optimization**: Place source images in `app/assets/images/src/1x/` before running `gulp images`
