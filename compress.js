#!/usr/bin / env node
const filterBy = require('gulp-filter-by');
const fs = require('fs-extra');
const gulp = require('gulp');
const gulpFn = require('gulp-fn');
const gulpShell = require('gulp-shell');
const image = require('gulp-image');
const sha1 = require('sha1');

const DEST_PATH = process.argv.slice(2)[1];
const MANIFEST_PATH = process.argv.slice(2)[2];
const SRC_PATH = process.argv.slice(2)[0];

const buildHash = file => sha1(file._contents + file.relative);

gulp.task('compress-images', () => {
  let manifest = {};

  if (fs.existsSync(MANIFEST_PATH)) {
    manifest = fs.readJsonSync(MANIFEST_PATH);
    manifest = JSON.stringify(manifest);
  }

  return gulp.src(SRC_PATH)
    .pipe(filterBy((file) => {
      if (!Object.keys(manifest).length > 0 || !manifest.includes(buildHash(file))) return true;
      return false;
    }))
    .pipe(image({concurrent: 10, gifsicle: true, mozjpeg: true, optipng: true, pngquant: true, svgo: true, zopflipng: true}))
    .pipe(gulp.dest(DEST_PATH))
    .pipe(gulpShell(['git add <%= file.path %>']));
});

gulp.task('update-manifest', ['compress-images'], () => {
  const jsonData = {};

  return gulp.src(SRC_PATH)
    .pipe(gulpFn((file) => {
      jsonData[file.relative] = buildHash(file);
    }))
    .pipe(gulpFn(() => {
      fs.writeFileSync(MANIFEST_PATH, JSON.stringify(jsonData, null, 2));
    }))
    .pipe(gulpShell([`git add ${MANIFEST_PATH}`]));
});

gulp.start(['compress-images', 'update-manifest']);
