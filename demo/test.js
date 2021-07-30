const Config = require('config-manager');
const DbConnector = require('./connectors/DbConnector');

config = new Config({
	configDirPath: 'config',
	connectorsDirPath: 'connectors',
	connectors: [new DbConnector],
});

config.init().then(() => {
	console.log('config.list()', config.list());
});
