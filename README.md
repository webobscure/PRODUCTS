# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a multi-regional product page generator for ONKRON product listings using Gulp, Nunjucks templating, and SCSS. The repository contains template directories for different regional markets (US, UK, Russia, France, Germany, Spain, Italy, Poland), each capable of generating standalone product HTML pages with responsive images hosted on regional Shopify CDNs.

## Repository Structure

The repository follows a **template-per-region pattern** where each `TEMPLATE {REGION}` directory is an independent, self-contained build environment:

```
PRODUCTS/
├── TEMPLATE US/          # United States template
├── TEMPLATE ES/          # Spain template  
├── TEMPLATE FR/          # France template
├── TEMPLATE IT/          # Italy template
├── TEMPLATE PL/          # Poland template
├── TEMPLATE RU/          # Russia template
└── TEMPLATE SHOPIFY OLD/ # Legacy templates
```

Each template directory contains:
- `gulpfile.js` - Build pipeline configuration
- `data.json` - Regional configuration (lang flags, modelName, CDN links)
- `package.json` - Dependencies
- `app/` - Source files (templates, SCSS, JS, assets)
- `dist/` - Production build output (git-ignored)

## Common Commands

All commands must be run **inside a specific template directory** (e.g., `TEMPLATE US`), not from the repository root.

### Development
```powershell
# Navigate to specific template
cd "TEMPLATE US"

# Install dependencies (first time only)
npm install

# Start development server with live reload
gulp
# Runs: cleanHtml -> nunjucks + styles + images + scripts + browsersync + beautify + watching
# Server: http://localhost:3000
```

### Build Tasks
```powershell
# Generate production build
gulp build

# Clean distribution folder
gulp cleanDist

# Clean generated HTML files
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

# Optimize images (mozjpeg, optipng)
gulp images

# Beautify HTML output
gulp beautify
```

### Linting
```powershell
# Run ESLint with airbnb-base config
npx eslint app/js/**/*.js
```

## Architecture

### Data-Driven Multi-Regional System

The core architectural pattern is **configuration-based regional switching** where a single codebase generates region-specific output by evaluating language flags in `data.json`.

**Critical Flow:**
1. `data.json` sets ONE `lang` flag to `true` (us/uk/ru/fr/de/es/it/pl)
2. `gulpfile.js` task `nunjucks()` reads `data.json` via `gulp-data`
3. `components/macro.njk` evaluates `lang` flags in if/elif chain
4. Selected `lang` determines which CDN base URL from `links` object is used
5. `image()` macro constructs full image URLs: `{CDN base}/{modelName}-{block}-{desc|mob}.jpg`
6. Templates render with proper regional CDN links

**Example:** Setting `lang.uk: true` with `modelName: "g100-w"` generates:
```
https://cdn.shopify.com/s/files/1/0558/2277/8562/files/g100-w-header-desc.jpg
```

### Template System Architecture

**Macro System (`components/macro.njk`):**
- Evaluates `lang` flags sequentially to set `imgLink` variable
- Special case: Russian CDN includes `folderName` in path structure
- `image()` macro generates responsive `<picture>` elements:
  - Desktop: default `<img>` source
  - Mobile: `<source>` with `max-width: 480px` media query

**Template Hierarchy:**
```
pages/index.njk              # Main page entry point
├── imports macro.njk        # Image macro with context
├── includes blocks/header.njk
└── sections (full-img)
    └── calls macro.image()  # Generates <picture> elements
```

**Blocks:**
- `blocks/header.njk` - Page header
- `blocks/full-img.njk` - Full-width image section
- `blocks/grid-layout.njk` - Grid layout components
- `blocks/icons.njk` - Icon sections

### Build Pipeline

**Gulp Task Flow (`gulpfile.js`):**

1. **Default Task** (`gulp`):
   ```
   cleanHtml → parallel(
     nunjucks,      # Compile templates
     styles,        # Compile SCSS
     images,        # Optimize images
     scripts,       # Minify JS
     browsersync,   # Start server
     beautify,      # Format HTML
     watching       # Watch for changes
   )
   ```

2. **Nunjucks Compilation**:
   - Source: `app/templates/pages/**/*.njk`
   - Data injection: `JSON.parse(fs.readFileSync('./data.json'))`
   - Render path: `app/templates/`
   - Output: `app/*.html`

3. **SCSS Compilation**:
   - Entry: `app/scss/style.scss`
   - Imports: `header.scss`, `icons.scss`, `full-img.scss`, `grid-layout.scss`
   - Autoprefixer: last 10 versions, grid enabled
   - Output: `app/css/style.min.css` (expanded format)

4. **JavaScript**:
   - Input: `app/js/main.js`
   - Concatenation: `gulp-concat`
   - Minification: `gulp-uglify-es`
   - Output: `app/js/main.min.js`

5. **Images**:
   - Source: `app/assets/images/src/1x/*`
   - Optimization: imagemin with mozjpeg (75% quality) and optipng (level 5)
   - Only processes newer files (`gulp-newer`)
   - Output: `app/assets/images/dist/`

6. **Production Build** (`gulp build`):
   ```
   cleanDist → images → copy to dist/
   ```
   Copies: CSS, fonts, minified JS, HTML, images

**Watch Patterns:**
- `app/scss/**/*.scss` → triggers `styles`
- `app/js/**/*.js` (except main.min.js) → triggers `scripts`
- `app/templates/**/*.+(html|nunjucks|njk)` → triggers `nunjucks`
- `data.json` → triggers `nunjucks`
- `app/*.html` → triggers `beautify`

## Development Workflow

### Creating a New Product Page

**Option 1: Use existing template directory**
1. Navigate to template for target region (e.g., `cd "TEMPLATE US"`)
2. Edit `data.json`:
   - Set ONE `lang` flag to `true`, all others to `false`
   - Update `modelName` to product identifier
   - Verify `links` object contains correct CDN URLs
3. Upload product images to CDN with naming convention:
   - `{modelName}-header-desc.jpg`, `{modelName}-header-mob.jpg`
   - `{modelName}-block1-desc.jpg`, `{modelName}-block1-mob.jpg`
   - Continue numbering: block2, block3, etc.
4. Edit `app/templates/pages/index.njk`:
   - Add/remove section blocks as needed
   - Update alt text in `macro.image()` calls
5. Run `gulp` to develop with live reload
6. Run `gulp build` to generate production output in `dist/`

**Option 2: Clone template for new region**
1. Copy entire template directory: `Copy-Item "TEMPLATE US" "TEMPLATE {NEW}"` 
2. Update `data.json` with new region's lang flag and CDN URL
3. Follow steps 3-6 above

### Modifying Templates

- **Header changes**: Edit `app/templates/blocks/header.njk`
- **New section types**: Create new block in `app/templates/blocks/`, include in `index.njk`
- **Image macro logic**: Modify `app/templates/components/macro.njk`
- **Styling changes**: Edit SCSS files in `app/scss/`
- **JavaScript functionality**: Edit `app/js/main.js`

### Working Across Templates

When making changes that apply to all regions:
1. Test changes in one template directory first
2. Manually propagate changes to other template directories
3. Note: No automated sync mechanism exists between templates

## Configuration Details

### `data.json` Structure

```json
{
  "lang": {
    "us": false,    // United States
    "uk": true,     // United Kingdom (example: active)
    "ru": false,    // Russia
    "fr": false,    // France
    "de": false,    // Germany
    "es": false,    // Spain
    "it": false,    // Italy
    "pl": false     // Poland
  },
  "modelName": "g100-w",
  "folderName": "n2l-b-imgs/",  // Used only for Russian CDN paths
  "links": {
    "ruIcons": "https://shop.onkron.ru/images/content/new_listings/icons/",
    "us": "https://cdn.shopify.com/s/files/1/2223/8189/files/",
    "uk": "https://cdn.shopify.com/s/files/1/0558/2277/8562/files/",
    "ru": "https://shop.onkron.ru/images/content/new_listings/",
    "fr": "https://cdn.shopify.com/s/files/1/0012/5924/1550/files/",
    "de": "https://cdn.shopify.com/s/files/1/0031/6860/0153/files/",
    "es": "https://cdn.shopify.com/s/files/1/0079/2254/8809/files/",
    "it": "https://cdn.shopify.com/s/files/1/0816/5589/0267/files/",
    "pl": "https://cdn.shopify.com/s/files/1/0783/6467/2329/files/"
  }
}
```

**Critical Rules:**
- Exactly ONE `lang` flag must be `true` at a time
- Russian template uses special `folderName` in path construction
- All CDN URLs must end with `/`

### Regional Differences

**TEMPLATE RU** includes additional dependencies:
- `gulp-svg-sprite` - SVG sprite generation
- `gulp-svgmin` - SVG optimization
- `potrace` - Image tracing
- `gulp-exec` - Command execution

All other templates share identical dependencies.

## Important Notes

- **Never edit generated HTML**: Always edit `.njk` templates; `app/index.html` is auto-generated
- **Single-region builds**: Each template directory generates for ONE region at a time
- **Image paths are dynamic**: URLs constructed at build time from `lang` + `modelName`
- **BrowserSync port**: Default 3000, auto-reloads on file changes
- **No test suite**: Project has no automated tests (`"test": "echo \"Error: no test specified\""`)
- **Git ignore**: Images (*.jpg, *.webp), dist/, node_modules/, and config.js are ignored
- **Windows environment**: Repository appears to be primarily developed on Windows (PowerShell commands)
