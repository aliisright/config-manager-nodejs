const Config = require('./src/Config.js');
const ConnectorAbstract = require('./src/ConnectorAbstract');

const configModule = Config;
configModule.ConnectorAbstract = ConnectorAbstract;

module.exports = configModule;
