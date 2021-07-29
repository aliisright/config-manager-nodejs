/**
 * Abstract class ConnectorAbstract
 * 
 * @class ConnectorAbstract
 */
class ConnectorAbstract {
    isWatchdog = false;
    timeout = 1 * 1000;
    watchdog;

    /**
     * 
     */
    constructor () {
        if (this.constructor == ConnectorAbstract) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    /**
     * @param {object} params | {timeout: (int) in milliseconds}
     * 
     */
    init = (params = {}) => {
        if ('timeout' in params) {
            this.timeout = params.timeout;
        }
    };

    /**
     * 
     */
    return_config = () => {
        throw new Error("Method 'return_config()' must be implemented.");
    };

    /**
     * 
     */
    setWatchdog = (watchdog) => {
        this.watchdog = watchdog;
    }

    /**
     * 
     */
    stop_watchdog = () => {
        if (this.isWatchdog) {
            clearInterval(this.watchdog);
        }
    };
}

module.exports = ConnectorAbstract;
