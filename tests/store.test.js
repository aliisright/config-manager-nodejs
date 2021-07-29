/* global describe, it, expect */
const Store = require('../src/store');

const defaultFilesExpectedObject = {
    APP_ENV: "default",
    app: {
        version: 2,
        auth: {
            client_id: 1,
            url: "http://localhost",
        },
    },
    db: {
        default_connection: "users",
        connections: {
            users: {
                engine: "mariadb",
                host: "127.0.0.1",
                user: "users_local_user",
                password: "users_local_password",
            },
            invoices_db: {
                engine: "mysql",
                host: "127.0.0.1",
                user: "invoices_local_user",
                password: "invoices_local_password",
            },
        },
    },
};

const productionFilesExpectedObject = {
    APP_ENV: "production",
    app: {
        auth: {
            client_id: 30,
            url: "https://some_url",
        },
    },
    db: {
        connections: {
            users: {
                host: "https://someRemoteUrl",
                user: "users_production_user",
                password: "users_production_password",
            },
            invoices_db: {
                host: "https://someRemoteUrl",
                user: "invoices_production_user",
                password: "invoices_production_password",
            },
        },
    },
};

const productionFilesExpectedObjectOverriden = {
    APP_ENV: "production",
    app: {
        version: 2,
        auth: {
            client_id: 30,
            url: "https://some_url",
        },
    },
    db: {
        default_connection: "users",
        connections: {
            users: {
                engine: "mariadb",
                host: "https://someRemoteUrl",
                user: "users_production_user",
                password: "users_production_password",
            },
            invoices_db: {
                engine: "mysql",
                host: "https://someRemoteUrl",
                user: "invoices_production_user",
                password: "invoices_production_password",
            },
        },
    },
};

describe('Store', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        process.env = OLD_ENV;
    });

    describe('setters', () => {
        it('setConfigDirPath - should set the store configDirPath property', async () => {
            let store = new Store();
            await store.setConfigDirPath('some config dir path');
            expect(store.configDirPath).toEqual('some config dir path');
        });
        it('setConnectorsDirPath - should set the store connectorsDirPath property', async () => {
            let store = new Store();
            await store.setConnectorsDirPath('some connectors dir path');
            expect(store.connectorsDirPath).toEqual('some connectors dir path');
        });
        it('setDefaultConfigPrefix - should set the store defaultConfigPrefix property', async () => {
            let store = new Store();
            await store.setDefaultConfigPrefix('some config prefix');
            expect(store.defaultConfigPrefix).toEqual('some config prefix');
        });
        it('setConnectors - should set the store connectors property', async () => {
            let store = new Store();
            await store.setConnectors(['connector1', 'connector2']);
            expect(store.connectors).toEqual(['connector1', 'connector2']);
        });
    });

    describe('loaders', () => {
        describe('loadConfigFiles', () => {
            it('loadConfigFiles - loads a specific configuration file (fresh new key)', async () => {
                let store = new Store();
                await store.setConfigDirPath('tests/stubs/config');

                await store.loadConfigFiles('default');
                expect(store.listConfig()).toEqual(defaultFilesExpectedObject);
            });
            it('loadConfigFiles - loads a specific configuration file (using the APP_ENV from app environment variables)', async () => {
                let store = new Store();
                await store.setConfigDirPath('tests/stubs/config');
                process.env = {
                    CONFIG__APP_ENV: 'production',
                };

                await store.loadConfigFiles();
                expect(store.listConfig()).toEqual(productionFilesExpectedObject);
            });
            it('loadConfigFiles - loads a specific configuration file (overrides an existing key)', async () => {
                let store = new Store();
                await store.setConfigDirPath('tests/stubs/config');

                await store.setConfigValue('app.version', 1000);
                expect(store.getConfigByKey('app.version')).toEqual(1000);

                await store.loadConfigFiles('default');
                expect(store.listConfig()).toEqual(defaultFilesExpectedObject);
            });
            it('loadConfigFiles - should log a console error', async () => {
                let store = new Store();
                await store.setConfigDirPath('tests/stubs/someWrongPath');
                
                console.error = jest.fn();
                await store.loadConfigFiles('default');
                expect(console.error).toBeCalled();
            });
        });

        describe('loadEnvVariable', () => {
            it('loadEnvVariable - load a compatible env variable and add it to store', async () => {
                let store = new Store();

                await store.setConfigValue('db.password', 'someDefaultPassword');
                expect(store.getConfigByKey('db.password')).toEqual('someDefaultPassword');

                await store.loadEnvVariable('CONFIG__db__password', 'envPassword');
                expect(store.getConfigByKey('db.password')).toEqual('envPassword');
            });
            it('loadEnvVariable - returns false when a non compatible env variable key is entered', async () => {
                let store = new Store();

                await store.loadEnvVariable('db__password', 'envPassword');
                expect(store.getConfigByKey('db.password')).toEqual(null);
            });
        });

        describe('loadEnvironment', () => {
            it('loadEnvironment - should read environment variables and set only the compatible ones in the store', async () => {
                let store = new Store();
                const initalDbConfig = {
                    user: 'defaultUser',
                    password: 'defaultPassword',
                    OS_VERSION: 2,
                };
                process.env = {
                    CONFIG__db__user: 'productionUser',
                    CONFIG__db__password: 'productionPassword',
                    OS_VERSION: 3,
                };

                await store.setConfigValue('db', initalDbConfig);
                expect(store.getConfigByKey('db')).toEqual(initalDbConfig);

                await store.loadEnvironment();
                expect(store.getConfigByKey('db')).toEqual({
                    ...initalDbConfig,
                    user: 'productionUser',
                    password: 'productionPassword',
                    OS_VERSION: 2,
                });
            });
            it('loadEnvironment - should show a console error', async () => {
                let store = new Store();
                console.error = jest.fn();
                process.env = null;
                store.loadEnvVariable = jest.fn();

                await store.loadEnvironment();
                expect(console.error).toBeCalled();
            });
        });

        describe('loadEnvironment', () => {
            it('loadEnvironment - should read environment variables and set only the compatible ones in the store', async () => {
                let store = new Store();
                const initalDbConfig = {
                    user: 'defaultUser',
                    password: 'defaultPassword',
                    OS_VERSION: 2,
                };
                process.env = {
                    CONFIG__db__user: 'productionUser',
                    CONFIG__db__password: 'productionPassword',
                    OS_VERSION: 3,
                };

                await store.setConfigValue('db', initalDbConfig);
                expect(store.getConfigByKey('db')).toEqual(initalDbConfig);

                await store.loadEnvironment();
                expect(store.getConfigByKey('db')).toEqual({
                    ...initalDbConfig,
                    user: 'productionUser',
                    password: 'productionPassword',
                    OS_VERSION: 2,
                });
            });
        });
    });
});
