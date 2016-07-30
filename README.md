# gulp-nunjucks-boilerplate

> A scalable [Gulp](http://gulpjs.com/) generated [Nunjucks](https://mozilla.github.io/nunjucks/) boilerplate.

## Getting Started

__Required globally:__ [npm](https://nodejs.org/en/), [gulp-cli](http://gulpjs.com/)

- __Installation:__ `npm i`
- __Development:__ `npm start`
- __Production:__ `npm run build` or `npm run build:minify`

## Documentation

__Note:__ HTML, Styles, and Scripts are minified in production mode.

### HTML
- Set global variables and macros here: `./src/layouts/default.html`
- Create/Edit Layouts here: `./src/layouts/`
- Create/Edit Macros here: `./src/macros/`
- Create/Edit Pages here: `./src/pages/`
- Create/Edit Partials here: `./src/partials/`

### Styles
- CSS and SCSS files are processed with node-sass and autoprefixer.
- Vendor CSS files must have the suffix `.min` to avoid being reprocessed.
- Create/Edit stylesheets here: `./src/styles/`

### Scripts
- JavaScript files are processed down to ES5 with babelify and browserify/watchify.
- Vendor JavaScript files must have the suffix `.min` to avoid being reprocessed.
- Create/Edit scripts here: `./src/scripts/`

### Images
- GIF, JPG, PNG, and SVG files are processed with imagemin.
- Create/Edit images here: `./src/images/`

### Other Assets
- Files that aren't processed but still need to be handled (ex: dotfiles, favicons, fonts, etc).
- Create/Edit assets here: `./src/assets/`
