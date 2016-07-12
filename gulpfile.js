var gulp   = require('gulp'),
    //repl   = require('gulp-replace')
    sass   = require('gulp-sass'),
    jade   = require('gulp-jade'),
    shell  = require('gulp-shell'),
    coffee = require('gulp-coffee');

var paths = {
    'sass'   : './sass/*.sass',
    'jade'   : './jade/*.jade',
    'coffee' : './coffee/*.coffee'
};

gulp.task('sass', function () {
    gulp.src(paths.sass)
        .pipe(sass({
            indentedSyntax: true
            //sourceComments : true
        }))
        .pipe(gulp.dest('css'))
    ;
});

gulp.task('jade', function () {
    gulp.src(paths.jade)
        .pipe(jade({
            pretty: true
        }))
        .pipe(gulp.dest('html'))
    ;
});

gulp.task('coffee', function () {
    gulp.src(paths.coffee)
        .pipe(coffee({bare: true}))
        .pipe(gulp.dest('js'))
    ;
});
 
gulp.task('server', shell.task(['python -m SimpleHTTPServer 8090']));

gulp.task('watch', function () {
    gulp.watch(paths.jade, ['jade']);
    gulp.watch(paths.sass, ['sass']);
    gulp.watch(paths.sass, ['coffee']);
});

gulp.task('default', ['jade', 'sass', 'coffee', 'server', 'watch']);

gulp.task('build', function () {
    //gulp.src('css/*.css').pipe(gulp.dest('../dist/css'));
    //gulp.src('js/*.js').pipe(gulp.dest('../dist/js'));
    //gulp.src([
    //    'fonts/MyriadPro-Regular.otf',
    //    'fonts/MyriadPro-Bold.otf'
    //]).pipe(gulp.dest('../dist/fonts'));
    //gulp.src('img/**/*.{png,jpg,gif,ico}').pipe(gulp.dest('../dist/img'));
    //gulp.src('scripts/*.php').pipe(gulp.dest('../dist'));
    //gulp.src('html/index.html')
    //    .pipe(repl(/"\/js\//g, '"js/'))
    //    .pipe(repl(/"\/css\//g, '"css/'))
    //    .pipe(repl(/"[^"]+\/img\//g, '"img/'))
    //    .pipe(gulp.dest('../dist/html'));
});
