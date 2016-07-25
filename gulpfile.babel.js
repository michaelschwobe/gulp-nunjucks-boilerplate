'use strict';

import autoprefixer from 'gulp-autoprefixer';
import babelify from 'babelify';
import browserSync from 'browser-sync';
import cache from 'gulp-cache';
import changed from 'gulp-changed';
import cssnano from 'gulp-cssnano';
import del from 'del';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import htmlmin from 'gulp-htmlmin';
import imagemin from 'gulp-imagemin';
import notify from 'gulp-notify';
import nunjucksRender from 'gulp-nunjucks-render';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import runSequence from 'run-sequence';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import streamify from 'gulp-streamify';
import uglify from 'gulp-uglify';
import util from 'gulp-util';
import watchify from 'gulp-watchify';

/*----------------------------------------------------------------------------*/
/* Configuration
/*----------------------------------------------------------------------------*/

const isProd = process.env.NODE_ENV === 'production';

const paths = {
  entry: 'src',
  output: 'dist',
};

const pluginConfig = {
  autoprefixer: {
    browsers: ['last 2 versions'],
  },
  browserSync: {
    server: {
      baseDir: `${paths.output}`,
    },
  },
  cssnano: {
    discardComments: {
      removeAllButFirst: true,
    },
  },
  htmlmin: {
    collapseWhitespace: true,
  },
  imagemin: {
    interlaced: true,
  },
  notify: {
    title: 'Compile Error',
    message: '<%= error.message %>',
    sound: 'Funk',
  },
  nunjucksRender: {
    path: `${paths.entry}/`,
    data: {
      minify: isProd,
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
    errorHandler: handleErrors,
  },
  rename: {
    suffix: '.min',
  },
};

/*----------------------------------------------------------------------------*/
/* Errors
/*----------------------------------------------------------------------------*/

function handleErrors() {
  const args = Array.prototype.slice.call(arguments);
  notify.onError(pluginConfig.notify).apply(this, args);
  this.emit('end');
}

/*----------------------------------------------------------------------------*/
/* Assets
/*----------------------------------------------------------------------------*/

/*
Move assets.
 */
gulp.task('assets', () => (
  gulp.src(`${paths.entry}/assets/**/*`)
  .pipe(isProd ? util.noop() : plumber(pluginConfig.plumber))
  .pipe(isProd ? util.noop() : changed(paths.output))
  .pipe(gulp.dest(paths.output))
  .pipe(isProd ? util.noop() : browserSync.stream())
));

/*----------------------------------------------------------------------------*/
/* Pages
/*----------------------------------------------------------------------------*/

/*
Process page templates.
 */
gulp.task('pages', () => (
  gulp.src(`${paths.entry}/pages/**/*.+(html|njk|nunjucks)`)
  .pipe(isProd ? util.noop() : plumber(pluginConfig.plumber))
  .pipe(nunjucksRender(pluginConfig.nunjucksRender))
  .pipe(isProd ? htmlmin(pluginConfig.htmlmin) : util.noop())
  .pipe(gulp.dest(paths.output))
));

/*
Hard reload.
 */
gulp.task('html', ['pages'], browserSync.reload);

/*----------------------------------------------------------------------------*/
/* Images
/*----------------------------------------------------------------------------*/

/*
Optimize images.
 */
gulp.task('images', () => (
  gulp.src(`${paths.entry}/images/**/*.+(gif|jpg|jpeg|png|svg)`)
  .pipe(isProd ? util.noop() : plumber(pluginConfig.plumber))
  .pipe(isProd ? imagemin(pluginConfig.imagemin) : cache(imagemin(pluginConfig.imagemin)))
  .pipe(gulp.dest(`${paths.output}/img`))
  .pipe(isProd ? util.noop() : browserSync.stream())
));

/*----------------------------------------------------------------------------*/
/* Styles
/*----------------------------------------------------------------------------*/

/*
Process non-minified css or sass files (minify if production mode).
 */
gulp.task('styles:sass', () => (
  gulp.src([
    `${paths.entry}/styles/**/*.+(css|scss)`,
    `!${paths.entry}/styles/*.min.css`,
    `!${paths.entry}/styles/**/*.min.css`,
  ])
  .pipe(isProd ? util.noop() : plumber(pluginConfig.plumber))
  .pipe(isProd ? util.noop() : changed(`${paths.output}/css`))
  .pipe(isProd ? util.noop() : sourcemaps.init())
  .pipe(sass())
  .pipe(autoprefixer(pluginConfig.autoprefixer))
  .pipe(isProd ? util.noop() : sourcemaps.write())
  .pipe(isProd ? cssnano(pluginConfig.cssnano) : util.noop())
  .pipe(isProd ? rename(pluginConfig.rename) : util.noop())
  .pipe(gulp.dest(`${paths.output}/css`))
  .pipe(isProd ? util.noop() : browserSync.stream())
));

/*
Move minified files.
 */
gulp.task('styles:vendor', () => (
  gulp.src(`${paths.entry}/styles/**/*.min.css`)
  .pipe(isProd ? util.noop() : plumber(pluginConfig.plumber))
  .pipe(isProd ? util.noop() : changed(`${paths.output}/css`))
  .pipe(gulp.dest(`${paths.output}/css`))
  .pipe(isProd ? util.noop() : browserSync.stream())
));

/*
Combine tasks.
 */
gulp.task('styles', ['styles:sass', 'styles:vendor']);

/*----------------------------------------------------------------------------*/
/* Scripts
/*----------------------------------------------------------------------------*/

/*
Lint non-minified js files.
 */
gulp.task('scripts:lint', () => (
  gulp.src([
    'gulpfile.babel.js',
    `${paths.entry}/scripts/**/*.js`,
    `!${paths.entry}/scripts/*.min.js`,
    `!${paths.entry}/scripts/**/*.min.js`,
  ])
  .pipe(plumber(pluginConfig.plumber))
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(browserSync.active ? eslint.failAfterError() : eslint.failOnError())
));

/*
Process non-minified js files (uglify if production mode).
*/
gulp.task('scripts:watchify', ['scripts:lint'], watchify((watchify) => (
  gulp.src([
    `${paths.entry}/scripts/**/*.js`,
    `!${paths.entry}/scripts/*.min.js`,
    `!${paths.entry}/scripts/**/*.min.js`,
  ])
  .pipe(isProd ? util.noop() : plumber(pluginConfig.plumber))
  .pipe(watchify({
    watch: !isProd,
    setup: (bundle) => bundle.transform(babelify),
  }))
  .pipe(isProd ? streamify(uglify()) : util.noop())
  .pipe(isProd ? streamify(rename(pluginConfig.rename)) : util.noop())
  .pipe(gulp.dest(`${paths.output}/js`))
  .pipe(isProd ? util.noop() : browserSync.stream())
)));

/*
Move minified js files.
 */
gulp.task('scripts:vendor', () => (
  gulp.src(`${paths.entry}/scripts/**/*.min.js`)
  .pipe(isProd ? util.noop() : plumber(pluginConfig.plumber))
  .pipe(isProd ? util.noop() : changed(`${paths.output}/js`))
  .pipe(gulp.dest(`${paths.output}/js`))
));

/*
Hard Reload.
 */
gulp.task('scripts:vendor:watch', ['scripts:vendor'], browserSync.reload);

/*
Combine tasks.
 */
gulp.task('scripts', ['scripts:vendor', 'scripts:watchify']);

/*----------------------------------------------------------------------------*/
/* Serve
/*----------------------------------------------------------------------------*/

/*
Start browserSync server.
 */
gulp.task('serve', () => browserSync.init(pluginConfig.browserSync));

/*
Watch files for changes.
 */
gulp.task('watch', () => {
  gulp.watch(`${paths.entry}/assets/**/*`, ['assets']);

  gulp.watch(`${paths.entry}/**/*.+(html|njk|nunjucks)`, ['html']);

  gulp.watch(`${paths.entry}/images/**/*.+(gif|jpg|jpeg|png|svg)`, ['images']);

  gulp.watch([
    `${paths.entry}/styles/**/*.+(css|scss)`,
    `!${paths.entry}/styles/*.min.css`,
    `!${paths.entry}/styles/**/*.min.css`,
  ], ['styles:sass']);

  gulp.watch(`${paths.entry}/styles/**/*.min.css`, ['styles:vendor']);

  gulp.watch([
    `${paths.entry}/scripts/**/*.js`,
    `!${paths.entry}/scripts/*.min.js`,
    `!${paths.entry}/scripts/**/*.min.js`,
  ], ['scripts:watchify']);

  gulp.watch(`${paths.entry}/scripts/**/*.min.js`, ['scripts:vendor:watch']);
});

/*----------------------------------------------------------------------------*/
/* Cleanup
/*----------------------------------------------------------------------------*/

/*
Clear cache (production).
 */
gulp.task('clear', (cb) => cache.clearAll(cb));

/*
Clean entire build folder (production).
 */
gulp.task('clean', () => del(['.sass-cache', `${paths.output}/*`]));

/*
Clean entire build folder, except for optimized images (development).
 */
gulp.task('clean:ignore-images', () => {
  del.sync([
    '.sass-cache',
    `${paths.output}/**/*`,
    `!${paths.output}/img`,
    `!${paths.output}/img/*`,
    `!${paths.output}/img/**/*`,
  ]);
});

/*----------------------------------------------------------------------------*/
/* Build Sequences
/*----------------------------------------------------------------------------*/

if (isProd) {
  /*
  Production.
   */
  gulp.task('default', ['clear', 'clean'], (cb) => {
    runSequence(['assets', 'html', 'images', 'styles', 'scripts'], cb);
  });
} else {
  /*
  Development.
   */
  gulp.task('default', ['clean:ignore-images'], (cb) => {
    runSequence(['assets', 'html', 'images', 'styles', 'scripts'], 'serve', 'watch', cb);
  });
};
