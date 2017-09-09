var gulp = require('gulp');
var less = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

var BASE_DIR = './';

gulp.task('scripts', function(){

    console.log('Scripts!');
    gulp.src(BASE_DIR + 'src/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(BASE_DIR + 'dist/'));

});

gulp.task('styles', function(){

    console.log('Styles!');
    gulp.src(BASE_DIR + 'src/**/*.less')
        .pipe(less().on('error', function(e){
            console.log(e.message);
        }))
        .pipe(minifyCss())
        .pipe(gulp.dest(BASE_DIR + 'dist/'));

});

gulp.task('default', ['scripts', 'styles'],function(){

    console.log('Watching JS!');
    gulp.watch(BASE_DIR + 'src/**/*.js', ['scripts']);

    console.log('Watching LESS!');
    gulp.watch(BASE_DIR + 'src/**/*.less', ['styles']);

});
