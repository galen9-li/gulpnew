import gulp, { series } from 'gulp';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import {deleteAsync} from 'del';
import svgSprite from'gulp-svg-sprite';
import webpackStream from 'webpack-stream';
import browserSync from 'browser-sync';
import htmlmin from 'gulp-htmlmin';

const sass = gulpSass(dartSass);


function ind(){
    return gulp.src('src/index.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'))
}


// для запуска сервера
function server() {
    browserSync.init({
        server: {
            baseDir: 'dist'
        }
    })
}

// для отслеживания и внесения изменений
function watch() {
    
    gulp.watch(['src/style.sccs', 'src/scss/*'], styles);
    gulp.watch(['src/app.js'], scripts);
    gulp.watch(['src/fonts/*', 'src/assets/*'], copy);
    
}

function scripts() {
    // 1.взять все java файлы
    // 2. при необходимости переписать новый синтаксис с учетом браузерной поддержки
    // 3. минифицировать код
    // 4. переименовать добавить суффикс min
    // 5. сохранить итоговый результат
    // для 1 
    return gulp.src('src/app.js')
    // для 2 babel: npm i babel-loader @babel/preset-env
    // для 3 и далее для 2
    .pipe(webpackStream({
        mode: 'production',
        module: {
            rules: [
              {
                test: /\.(?:js|mjs|cjs)$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    targets: "defaults",
                    presets: [
                      ['@babel/preset-env', {targets: "defaults"}]
                    ]
                  }
                }
              }
            ]
          }
    }))
    // для 4
    .pipe(rename('app.min.js'))
    // для 5
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream())
    
}

function styles(){

return gulp.src('src/style.scss')
// возвращать результат// 1. указать расположение файлов
// вызов метода sass, при возникновении ошибок мы хотим о них знать
.pipe(sass() .on('error', sass.logError))

// сделать префикс для разных браузеров
.pipe(autoprefixer(['last 15 version']))

// минификация css
.pipe(cleanCSS())

// длбавить суффикс min
.pipe(rename({suffix: '.min'}))

// записать итоговый результат через метод dest
.pipe(gulp.dest('dist'))

// для обновления результата после перезапусков browserSync
.pipe(browserSync.stream())
}

// очищаем папку dist от лишнего. файл style.css без min
function clean() {
return deleteAsync(['dist/**'])
}
// папка dist пустеет, потом gulp styles и останется только с суффикосом мин


// спрайт для svg
function svg() {
    return gulp.src('src/assets/*.svg')
    .pipe(svgSprite({
        mode: {
            symbol: {
                sprite: '../sprite.svg'
            }
        }
    }))
    .pipe(gulp.dest('src/assets/'));
    }
    


// копируем все ресурсы в папку dist, чтоб совпадали пути/ доппакет не нужен
function copy(){
    // перечисляем откуда какие ресурсы копировать с указанием базовой папки
    return gulp.src(['src/index.html', 'src/fonts/*',  'src/assets/*', ], {base: 'src'})
    .pipe(gulp.dest('dist'))

    .pipe(browserSync.stream({
        once: true
    }))
}




export {styles, clean, copy, svg, scripts, server, watch, ind};

// серия по умолчанию
export default gulp.series(clean, gulp.parallel (copy, styles, scripts), gulp.parallel(ind, server, watch) )


export let build = gulp.series(clean, copy, styles, scripts)