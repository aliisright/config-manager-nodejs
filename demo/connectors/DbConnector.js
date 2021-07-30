const { ConnectorAbstract } = require("config-manager");

class DbConnector extends ConnectorAbstract {
    isWatchdog = true;
    timeout = 3 * 1000;

    /**
     * 
     */
    return_config = () => {
        return {
            app: {auth: {client_id: 787878}},
            db: {connections: {users: {user: 'db_connector'}}},
        }
    };
}

module.exports = DbConnector;
