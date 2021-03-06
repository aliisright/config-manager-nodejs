const _ = require('lodash');
const fs = require('fs');
const {
    deepMerge,
    typeCast,
} = require('./helpers');
require('dotenv').config();

class Store {
    store = {};
    watchdogs = [];

    configDirPath = './config';
    connectorsDirPath = './connectors';
    defaultConfigPrefix = 'CONFIG';
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
            const appEnv = env ? env : 'default';
            const envPath = `${this.configDirPath}/${appEnv}`;
            const directory = fs.readdirSync(envPath);

            if (fs.existsSync(envPath)) {
                fs.readdirSync(envPath).forEach((file) => {
                    // read the file
                    const filename = file.split(".").slice(0, -1).join(".");
                    const fileContent = JSON.parse(fs.readFileSync(`${envPath}/${file}`));
                    let newFileContent = {};
                    // fill the store keys with config file keys
                    if (this.store[filename]) {
                        newFileContent = deepMerge(this.store[filename], fileContent);
                    } else {
                        newFileContent = {...fileContent};
                    }
                    _.set(this.store, [filename], newFileContent);
                });
            } else {
                console.error('Config.loadConfigFiles', 'directory doesn\'t exist');
            }
            if (!this.store.APP_ENV) {
                this.store.APP_ENV = appEnv;
            }
        } catch (error) {
            console.error('Config.loadConfigFiles', error);
        }
    };

    loadEnvVariable = (key, value) => {
        const keys = key.split("__");
        let type = 'string'; // Default type
        if (keys[0] !== "CONFIG") {
            return false;
        }
        keys.shift();
        if (keys.length > 1)??{
            type = keys[0];
            keys.shift();
        }
        value = typeCast(value, type);
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
                deepMerge(this.store, connector.return_config());
            }, connector.timeout);
            connector.setWatchdog(watchdog);
        } else {
            deepMerge(this.store, connector.return_config());
        }
    };

    /**
     * Stop all running watchdogs
     */
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
            await this.loadEnvironment();
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
     * @param {any} defaultValue 
     */
    getConfigByKey = (key, defaultValue = null) => {
        return _.get(this.store, key, defaultValue);
    }

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

    /**
     * Get current app config env
     * 
     * @returns {string}
     */
    getCurrentEnv = () => _.get(this.store, ['APP_ENV'], null);
}

module.exports = Store;
