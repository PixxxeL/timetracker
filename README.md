# Timetracker. JS frameworks compare

This is a simple project for track time of working process.
It's created on some variant of Javascript frameworks:
[jQuery](https://jquery.com/),
[Backbone.js](http://backbonejs.org/),
[Knockout](http://knockoutjs.com/),
[React](https://reactjs.org/)
[Vue.js](https://vuejs.org/)
with identically functionality.
For compare them.

Working instance deployed [here](http://tt.pixel-tyumen.ru/).

I'm use [build environment](https://github.com/PixxxeL/regular-gulpfile)
based on [Gulp](https://gulpjs.com/).

For developement or deploy you must have
[Node.js](https://nodejs.org/),
[NPM](https://www.npmjs.com/),
[Gulp](https://gulpjs.com/),
[Bower](https://bower.io/).
For React variant -- [Webpack](https://webpack.js.org/) also.

## Environment

* Change directory to `jquery` or `backbone` or `knockout` or `react` or `vue`
  from repository root
* Run `bower install`
* Run `npm install`

## Developement

* Run `gulp`
* Run `webpack` (react variant only)
* Browse `http://127.0.0.1:8090/html/`

## Demo

* Run `gulp build`
* Run `gulp py-demo` (`gulp demo` for jquery variant)
* Browse `http://127.0.0.1:8090/`
