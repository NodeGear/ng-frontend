define([
    'require',
    'angular',
    'ng-routes'
], function (require, ng) {
    require(['domReady!'], function (document) {
        ng.bootstrap(document, ['nodegear']);
    });
});