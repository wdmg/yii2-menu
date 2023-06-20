const gulp = require('gulp');
const cleaner = require('gulp-clean');
const gulpSass = require('gulp-sass')(require('sass'));
const jsConcat = require('gulp-concat');
const jsUglify = require('gulp-terser');
const cssMinify = require('gulp-cssmin');
const jsInclude = require('gulp-include');
const renameIt = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const sourceMaps = require('gulp-sourcemaps');

function css() {
    return gulp.src('src/sass/menu.scss')
        .pipe(sourceMaps.init())
        .pipe(gulpSass({
            includePaths: ['node_modules']
        }).on('error', gulpSass.logError))
        .pipe(sourceMaps.write())
        .pipe(gulp.dest('assets/css'));
}

function css_minify() {
    return gulp.src(['assets/css/*.css', '!assets/css/*.min.css'])
        .pipe(sourceMaps.init())
        .pipe(cleanCSS({debug: true}, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        .pipe(sourceMaps.write())
        .pipe(renameIt({ suffix: '.min' }))
        .pipe(gulp.dest('assets/css'));
}

function js() {
    return gulp.src('src/js/*.js')
        .pipe(sourceMaps.init())
        .pipe(jsInclude({
            extensions: 'js',
            hardFail: true,
            separateInputs: true
        }))
        .on('error', console.log)
        .pipe(jsConcat('menu.js'))
        .pipe(sourceMaps.write())
        .pipe(gulp.dest('assets/js'));
}

function js_minify() {
    return gulp.src(['assets/js/*.js', '!assets/js/*.min.js'])
        .pipe(sourceMaps.init())
        .pipe(jsUglify())
        .pipe(sourceMaps.write())
        .pipe(renameIt({ suffix: '.min' }))
        .pipe(gulp.dest('assets/js'));
}

function minify() {
    return js_minify() && css_minify();
}

function watchFiles() {
    gulp.watch('src/**/*.scss', gulp.series(css, css_minify));
    gulp.watch('src/**/*.js', gulp.series(js, js_minify));
    return;
}

function cleanup() {
    return gulp.src('assets/*', {read: false})
        .pipe(cleaner());
}

exports.js = js;
exports.css = css;
exports.cleanup = cleanup;
exports.js_minify = js_minify;
exports.css_minify = css_minify;
exports.minify = gulp.parallel(js_minify, css_minify);
exports.watch = gulp.parallel(css, js, watchFiles);
exports.default = gulp.series(cleanup, css, js, minify);