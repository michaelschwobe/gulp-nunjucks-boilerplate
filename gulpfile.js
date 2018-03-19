'use strict';

const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const changed = require('gulp-changed');
const cleanCSS = require('gulp-clean-css');
const data = require('gulp-data');
const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const named = require('vinyl-named');
const noop = require('gulp-noop');
const notify = require('gulp-notify');
const nunjucksRender = require('gulp-nunjucks-render');
const plumber = require('gulp-plumber');
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const webpack = require('webpack-stream');

// Local
const packageJson = require('./package.json');

//------------------------------------------------------------------------------
// Configuration.
//------------------------------------------------------------------------------

// Environment configuration.
const isProd = process.env.NODE_ENV === 'production';

// Directory configuration.
// Must have values, don't use leading or trailing slashes.
const dirs = {
  entry: 'src',
  output: 'build',
};

// Path configuration.
// Must have values, don't use leading or trailing slashes.
const paths = {
  public: {
    src: `${dirs.entry}/public/**/*`,
    dest: `${dirs.output}`,
  },
  views: {
    root: `${dirs.entry}/views`,
    watch: `${dirs.entry}/views/**/*.+(html|json|njk|nunjucks)`,
    src: `${dirs.entry}/views/pages/**/*.+(html|njk|nunjucks)`,
    dest: `${dirs.output}`,
  },
  media: {
    src: `${dirs.entry}/media/**/*.+(gif|jpg|jpeg|png|svg)`,
    dest: `${dirs.output}/static/media`,
  },
  styles: {
    src: `${dirs.entry}/styles/**/*.+(css|scss)`,
    dest: `${dirs.output}/static/styles`,
  },
  scripts: {
    src: [
      `${dirs.entry}/scripts/**/*.js`,
      `!${dirs.entry}/scripts/**/*.module.js`,
    ],
    dest: `${dirs.output}/static/scripts`,
  },
};

// Plugin configurations.
// Use an empty object for empty configurations.
const pluginConfig = {
  autoprefixer: { browsers: ['last 2 versions'] },
  browserSync: {
    port: process.env.PORT || 3000,
    server: { baseDir: `${dirs.output}` },
  },
  cleanCSS: [
    { debug: true },
    ({ name, stats }) => {
      console.log(`Original size of ${name}: ${stats.originalSize} bytes`);
      console.log(`Minified size of ${name}: ${stats.minifiedSize} bytes`);
    },
  ],
  htmlmin: {
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
  },
  imagemin: [
    imagemin.gifsicle({ interlaced: true, optimizationLevel: 3 }),
    imagemin.jpegtran({ progressive: true }),
    imagemin.optipng({ optimizationLevel: 7 }),
    imagemin.svgo({
      plugins: [{ removeUselessDefs: false }, { cleanupIDs: false }],
    }),
  ],
  nunjucksRender: {
    path: paths.views.root,
    data: {
      isProd,
      version: packageJson.version,
      paths: {
        root: isProd ? 'https://example.com' : '',
        scripts: '/static/scripts',
        styles: '/static/styles',
        media: '/static/media',
      },
    },
    envOptions: {
      autoescape: true,
      throwOnUndefined: true,
      trimBlocks: true,
      lstripBlocks: true,
      watch: false,
    },
  },
  plumber: {
    errorHandler(...args) {
      notify
        .onError({
          title: 'Compile Error',
          message: '<%= error.message %>',
          sound: 'Funk',
        })
        .apply(this, args);
      this.emit('end');
    },
  },
  sass: {
    outputStyle: 'expanded',
    includePaths: ['node_modules'],
  },
  sourcemaps: '.',
  webpack: {
    devtool: isProd ? 'cheap-source-map' : 'cheap-eval-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          options: { presets: ['env'] },
        },
      ],
    },
    plugins: isProd ? [new MinifyPlugin({ removeConsole: true })] : [],
  },
};

// -----------------------------------------------------------------------------
// Public.
// -----------------------------------------------------------------------------

gulp.task('public', () =>
  gulp
    // Input.
    .src(paths.public.src)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? noop() : changed(paths.public.dest))
    // Output.
    .pipe(gulp.dest(paths.public.dest))
    // Production: Do nothing.
    // Development: Stream changes back to 'watch' tasks.
    .pipe(isProd ? noop() : browserSync.stream()),
);

// -----------------------------------------------------------------------------
// Views.
// -----------------------------------------------------------------------------

const getJSONFile = slug => {
  // Read Buffer from file.
  const fileData = fs.readFileSync(`${paths.views.root}/${slug}.json`);
  // Convert Buffer to JSON.
  return JSON.parse(fileData);
};

const getPageId = file =>
  file.relative
    // Convert slashes to dashes.
    .replace(/\//, '-')
    // Remove extension.
    .replace(/\.[^/.]+$/, '');

const getDataForFile = file => {
  const id = getPageId(file);
  // Get global data.
  const jsonData = { ...getJSONFile('data') };
  // Extract and assign page data.
  jsonData.page = { id, ...jsonData.pages[id] };
  // Remove redundant data.
  delete jsonData.pages;
  // Output global and page specific data.
  return jsonData;
};

gulp.task('views', () =>
  gulp
    // Input.
    .src(paths.views.src)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Pass data to templates.
    .pipe(data(getDataForFile))
    // Compile (un)changed templates.
    .pipe(nunjucksRender(pluginConfig.nunjucksRender))
    // Production: Minify.
    // Development: Do Nothing.
    .pipe(isProd ? htmlmin(pluginConfig.htmlmin) : noop())
    // Output.
    .pipe(gulp.dest(paths.views.dest)),
);

//------------------------------------------------------------------------------
// Media.
//------------------------------------------------------------------------------

gulp.task('media', () =>
  gulp
    // Input.
    .src(paths.media.src)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? noop() : changed(paths.media.dest))
    // Production: Optimize.
    // Development: Do Nothing.
    .pipe(isProd ? imagemin(pluginConfig.imagemin) : noop())
    // Output.
    .pipe(gulp.dest(paths.media.dest))
    // Production: Do nothing.
    // Development: Stream changes back to 'watch' tasks.
    .pipe(isProd ? noop() : browserSync.stream()),
);

//------------------------------------------------------------------------------
// Styles.
//------------------------------------------------------------------------------

gulp.task('styles', () =>
  gulp
    // Input.
    .src(paths.styles.src)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Production: Do nothing.
    // Development: Pipe only changed files to the next process.
    .pipe(isProd ? noop() : changed(paths.styles.dest))
    // Start mapping original source.
    .pipe(sourcemaps.init())
    // Convert to CSS.
    .pipe(sass(pluginConfig.sass))
    // Add browser compatibility.
    .pipe(autoprefixer(pluginConfig.autoprefixer))
    // Production: Minify.
    // Development: Do nothing.
    .pipe(isProd ? cleanCSS(...pluginConfig.cleanCSS) : noop())
    // Save mapping for easier debugging.
    .pipe(sourcemaps.write(pluginConfig.sourcemaps))
    // Output.
    .pipe(gulp.dest(paths.styles.dest))
    // Production: Do nothing.
    // Development: Stream changes back to 'watch' tasks.
    .pipe(isProd ? noop() : browserSync.stream()),
);

//------------------------------------------------------------------------------
// Scripts.
//------------------------------------------------------------------------------

gulp.task('scripts', () =>
  gulp
    // Input.
    .src(paths.scripts.src)
    // Report errors.
    .pipe(plumber(pluginConfig.plumber))
    // Automatically pass named chunks to webpack.
    .pipe(named())
    // Bundle.
    .pipe(webpack(pluginConfig.webpack))
    // Output.
    .pipe(gulp.dest(paths.scripts.dest)),
);

//------------------------------------------------------------------------------
// Serve.
//------------------------------------------------------------------------------

// Development.
// Starts the browserSync server.
gulp.task('serve', () => browserSync.init(pluginConfig.browserSync));

//------------------------------------------------------------------------------
// Watch.
//------------------------------------------------------------------------------

// Ensures the 'views' task is complete before reloading browsers.
gulp.task('views:watch', ['views'], done => {
  browserSync.reload();
  done();
});

// Ensures the 'scripts' task is complete before reloading browsers.
gulp.task('scripts:watch', ['scripts'], done => {
  browserSync.reload();
  done();
});

// Development.
// Watches files for changes.
gulp.task('watch', () => {
  gulp.watch(paths.public.src, ['public']);
  gulp.watch(paths.views.watch, ['views:watch']);
  gulp.watch(paths.media.src, ['media']);
  gulp.watch(paths.styles.src, ['styles']);
  gulp.watch(paths.scripts.src[0], ['scripts:watch']);
});

//------------------------------------------------------------------------------
// Clean.
//------------------------------------------------------------------------------

// Deletes the output folder.
gulp.task('clean', () => del([dirs.output]));

//------------------------------------------------------------------------------
// Default.
//------------------------------------------------------------------------------

gulp.task('default', callback => {
  const compile = ['public', 'views', 'media', 'styles', 'scripts'];
  if (isProd) {
    // Production.
    runSequence('clean', compile, callback);
  } else {
    // Development.
    runSequence('clean', compile, 'serve', 'watch', callback);
  }
});
