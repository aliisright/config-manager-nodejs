const Config = require('./ConfigManager');
const DbConnector = require('./connectors/DbConnector');

config = new Config({
	configDirPath: 'config',
	connectorsDirPath: 'connectors',
	connectors: [new DbConnector],
});

setTimeout(() => config.init().then(() => {
	setInterval(() => console.log(config.list()), 1000);
}));
