const Config = require('./src/configFacade.js');
const ConnectorAbstract = require('./src/connectorAbstract');

const configModule = Config;
configModule.ConnectorAbstract = ConnectorAbstract;

module.exports = configModule;
