Package.describe({
  name: 'pmulch:game',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'A framework for building bring-your-own-device (BYOD) games using Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/pmulch/MeteorGameEngine.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  // min version
  api.versionsFrom('1.4.1.1');

  // dependencies
  api.use(['ecmascript', 'underscore']);

  // common
  api.addFiles([
    'lib/utils.js', 
    'lib/data.js'
  ], ['client', 'server']);

  // server
  api.addFiles([
    'lib/publish.js',
    'lib/game-server.js'
  ], ['server']);

  // client
  api.addFiles([
    'lib/game-controller.js',
    'lib/game-session.js'
  ], ['client']);

  // exports
  api.export(['GameSession', 'GameController', 'Games', 'Game'], ['client', 'server']);
});

Package.onTest(function(api) {
  // api.use('ecmascript');
  // api.use('tinytest');
  // api.use('pmulch:game');
  // api.mainModule('game-tests.js');
});
