const { src, dest, watch, parallel, series } = require("gulp");

const sass = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const browserSync = require("browser-sync").create();
const uglify = require("gulp-uglify-es").default;
const autoprefixer = require("gulp-autoprefixer");
const imagemin = require("gulp-imagemin");
const del = require("del");
const data = require("gulp-data");
const fs = require("fs");
const nunjucksRender = require("gulp-nunjucks-render");
const htmlbeautify = require("gulp-html-beautify");
const imageminWebp = require('imagemin-webp');
const webp = require("gulp-webp");
const newer = require("gulp-newer");

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "app/",
    },
  });
}

function cleanDist() {
  return del("dist");
}

function cleanHtml() {
  return del("app/*.html");
}

function images() {
  return src("app/assets/images/src/*.*")
    .pipe(newer("app/assets/images/dist"))
    .pipe(imagemin([
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
    ]))
    .pipe(dest("app/assets/images/dist"));
}

function scripts() {
  // return src(["node_modules/jquery/dist/jquery.js", "app/js/main.js"])
  return src(["app/js/main.js"])
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("app/js"))
    .pipe(browserSync.stream());
}

function styles() {
  return src("app/scss/style.scss")
    .pipe(
      sass({
        includePaths: ["./node_modules"],
        outputStyle: "expanded",
      })
    )
    .pipe(concat("style.min.css"))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 10 versions"],
        grid: true,
      })
    )
    .pipe(dest("app/css"))
    .pipe(browserSync.stream());
}

function nunjucks() {
  return src("app/templates/pages/**/*.+(html|nunjucks|njk)")
    .pipe(
      data(function(file) {
        return JSON.parse(fs.readFileSync("./data.json"));
      })
    )
    .pipe(
      nunjucksRender({
        path: ["app/templates/"],
      }) 
    )
    .pipe(dest("app/"))
    .pipe(browserSync.stream());
}

function beautify() {
  return src("app/*.html")
    .pipe(htmlbeautify({ indent_size: 2 }))
    .pipe(dest("app/"));
}

function build() {
  return src(
    [
      // Выбираем нужные файлы
      "app/css/style.min.css",
      "app/fonts/**/*",
      "app/js/**/*.min.js",
      "app/**/*.html",
      "app/images/dest/**/*",
    ],
    { base: "app" }
  ).pipe(dest("dist"));
}

function watching() {
  watch(["app/scss/**/*.scss"], styles);
  watch(["app/js/**/*.js", "!app/js/main.min.js"], scripts);
  watch(["app/templates/**/*.+(html|nunjucks|njk)"]).on("change", nunjucks);
  watch(["data.json"]).on("change", nunjucks);
  watch(["app/*.html"]).on("change", beautify);
  // watch(["app/*.+(html|nunjucks|njk)"]).on("change", browserSync.reload);
}

function deploy() {
  return ghPages.publish("dist", {
    branch: "gh-pages",
    //   repo: 'https://github.com/tgluk/gulp-start.git',
    dotfiles: true,
  });
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = images;
exports.cleanDist = cleanDist;
exports.cleanHtml = cleanHtml;
exports.nunjucks = nunjucks;
exports.beautify = beautify;

exports.deploy = deploy;
exports.build = series(cleanDist, images, build);
exports.default = series(
  cleanHtml,
  parallel(nunjucks, styles, images, scripts, browsersync, beautify, watching)
);
