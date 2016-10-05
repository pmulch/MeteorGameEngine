Package.describe({
  name: 'pmulch:game',
  version: '0.0.1',
  summary: 'A framework for building bring-your-own-device (BYOD) games using Meteor',
  git: 'https://github.com/pmulch/MeteorGameEngine.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  // min version
  api.versionsFrom('1.4.1.1');


  // dependencies
  // common
  api.use([
    'ecmascript', 
    'underscore',
    'tracker',
    'mongo',
    'random'
  ]);

  // client
  api.use([
    'session',
    'u2622:persistent-session@0.4.4'
  ], ['client']);


  // source files
  // common
  api.addFiles([
    'lib/common/utils.js', 
    'lib/common/data.js'
  ]);

  // server
  api.addFiles([
    'lib/server/publish.js',
    'lib/server/game-server.js'
  ], ['server']);

  // client
  api.addFiles([
    'lib/client/game-controller.js',
    'lib/client/game-session.js'
  ], ['client']);


  // exports
  api.export(['Games', 'Game']);
  api.export(['GameSession', 'GameController'], 'client');

  api.imply(['random']);
  api.imply(['u2622:persistent-session'], 'client');
});

Package.onTest(function(api) {
  api.use([
    'ecmascript',
    'tinytest',
    'underscore',
    'pmulch:game'
  ]);
  
  api.addFiles('tests/client.js', 'client');
  api.addFiles('tests/server.js', 'server');
});
