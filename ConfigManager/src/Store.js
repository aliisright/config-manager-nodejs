const _ = require('lodash');
const fs = require("fs");
require('dotenv').config();

class Store {
    store = {};
    watchdogs = [];

    configDirPath = './config';
    connectorsDirPath = './connectors';
    defaultConfigPrefix = 'default';
    connectors = [];

    constructor () {
        this.store = {};
    };

    setConfigDirPath = (path) => {
        this.configDirPath = path;
    };

    setConnectorsDirPath = (path) => {
        this.connectorsDirPath = path;
    };

    setDefaultConfigPrefix = (prefix) => {
        this.defaultConfigPrefix = prefix;
    };

    setConnectors = (connectors) => {
        this.connectors = connectors;
    };

    loadConfigFiles = (env = process.env.CONFIG__APP_ENV) => {
        try {
            const appEnv = env ?? 'default';
            const envPath = `${this.configDirPath}/${appEnv}`;

            fs.readdirSync(envPath).forEach((file) => {
                // read the file
                const filename = file.split(".").slice(0, -1).join(".");
                const fileContent = JSON.parse(fs.readFileSync(`${envPath}/${file}`));
                let newFileContent = {};
                // fill the store keys with config file keys
                if (this.store[filename]) {
                    newFileContent = _.merge(this.store[filename], fileContent);
                } else {
                    newFileContent = {...fileContent};
                }
                _.set(this.store, [filename], newFileContent);
            });
            if (!this.store.APP_ENV) {
                this.store.APP_ENV = appEnv;
            }
        } catch (error) {
            console.error('Config.loadConfigFiles', error);
        }
    };

    loadEnvVariable = (key, value) => {
        const keys = key.split("__");
        if (keys[0] !== "CONFIG") {
            return false;
        }
        keys.shift();
        _.set(this.store, keys, value);
        return value;
    };

    loadEnvironment = () => {
        try {
            const env = process.env;
            Object.entries(env).forEach(([key, value]) => {
                const envKey = key.split("__");
                if (envKey.length <= 1 || envKey[0] !== "CONFIG") {
                    return;
                }
                this.loadEnvVariable(key, value);
            });
        } catch (error) {
            console.error('Config.loadEnvironment', error);
        }
    };

    loadConnectors = () => {
        this.connectors.forEach((connector) => {
            this.loadConnectorConfig(connector);
        });
    };

    loadConnectorConfig = (connector) => {
        connector.init();
        if (connector.isWatchdog) {
            this.watchdogs.push(connector);
            const watchdog = setInterval(() => {
                _.merge(this.store, connector.return_config());
            }, connector.timeout);
            connector.setWatchdog(watchdog);
        } else {
            _.merge(this.store, connector.return_config());
        }
    };

    stopWatchdogs = () => {
        this.watchdogs.forEach((watchdog) => {
            watchdog.stop_watchdog();
        });
    };

    /**
     * Initialize config and load config elements from sources
     */
    init = async () => {
        try {
            await this.loadConfigFiles('default');
            await this.loadConfigFiles();
            await this.loadConnectors();
        } catch (error) {
            console.error('Config.init', error);
        }
    };

    /**
     * Clear and reload config object
     */
    reload = () => {
        try {
            this.store = {};
            this.init()
                .then(() => resolve(this.store));
            
        } catch (error) {
            console.error('Config.reload', error);
        }
    };

    /**
     * Clear config object
     */
    clear = () => {
        try {
            this.store = {};
        } catch (error) {
            console.error('Config.clear', error);
        }
    };

    /**
     * Get a config element by key
     * @param {string} key 
     */
    getConfigByKey = key => _.get(this.store, key, null);

    /**
     * List all config elements
     */
    listConfig = () => this.store;

    /**
     * Set a config element
     * @param {string} key 
     * @param {any} value 
     */
    setConfigValue = (key, value) => _.set(this.store, key, value);

    getCurrentEnv = () => _.get(this.store, ['APP_ENV'], null);
}

module.exports = Store;
