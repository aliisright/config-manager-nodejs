const _ = require('lodash');
const Store = require('./store');

class ConfigFacade {
    store;

    constructor (params = {}) {
        this.store = new Store();
        if ('configDirPath' in params) {
            this.store.setConfigDirPath(params.configDirPath);
        }
        if ('connectorsDirPath' in params) {
            this.store.setConnectorsDirPath(params.connectorsDirPath);
        }
        if ('defaultConfigPrefix' in params) {
            this.store.setDefaultConfigPrefix(params.defaultConfigPrefix);
        }
        if ('connectors' in params) {
            this.store.setConnectors(params.connectors);
        }
    };

    /**
     * Initialize config and load config elements from sources
     */
    init = async () => {
        try {
            this.store.init();
        } catch (error) {
            console.error('Config.init', error);
        }
    };

    /**
     * Clear and reload config object
     */
    reload = async () => {
        try {
            await this.store.reload();
        } catch (error) {
            console.error('Config.reload', error);
        }
    };

    /**
     * Clear config object
     */
    clear = async () => {
        try {
            await this.store.clear();
        } catch (error) {
            console.error('Config.clear', error);
        }
    };

    /**
     * Get a config element by key
     * @param {string} key 
     * @param {mixed} defaultValue 
     */
    get_config = (key, defaultValue = null) => this.store.getConfigByKey(key, defaultValue);

    /**
     * List all config elements
     */
    list = () => this.store.listConfig();

    /**
     * Set a config element
     * @param {string} key 
     * @param {any} value 
     */
    set_config = (key, value) => this.store.setConfigValue(key, value);

    /**
     * Stop all running watchdog processes
     * 
     * @returns {void}
     */
    stop_watchdogs = () => {
        this.store.stopWatchdogs();
    };

    /**
     * Get current config app env
     * 
     * @returns {string}
     */
    get_current_env = () => this.store.getCurrentEnv();
}

module.exports = ConfigFacade;
