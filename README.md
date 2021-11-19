# Config manager

A Node JS config manager library, helping you to fetch, organise and use your configurations and secrets from different sources

[See the project specifications on Confluence](https://sublimeskinz.atlassian.net/wiki/spaces/LT/pages/2090860549/Config+management)

## Testing

From the repo root:

```
npm install
npm run test
```
<hr />

# Documentation

## Usage
```Javascript
const { ConfigManager } = require('nodejs-common-libs');
const DbConnector = require('./connectors/DbConnector');

config = new ConfigManager.Config({
	configDirPath: 'config',
	connectorsDirPath: 'connectors',
	connectors: [new DbConnector],
});

config.init().then(() => {
	console.log('config.list()', config.list());
});
```
```Javascript
const { ConfigManager } = require("nodejs-common-libs");

class DbConnector extends ConfigManager.ConnectorAbstract {
    isWatchdog = true;
    timeout = 3 * 1000;

    /**
     * 
     */
    return_config = () => {
        return {
            app: {auth: {client_id: 1212}},
            db: {connections: {users: {user: 'db_connector'}}},
        }
    };
}

module.exports = DbConnector;
```

## Sources priority

Steps of warmup:

<b>1) Loading environment</b> via an env variable APP_ENV with a stage as value (defaulting to APP_ENV=default)
<b>2) Loading static committed files</b>

```JSON
|-- config
    |-- default
    |   |-- config.json
    |-- local
    |   |-- config.json
    |-- dev
    |   |-- config.json
    |-- staging
    |   |-- config.json
    |-- production
    |   |-- config.json
```

- It first loads default files to construct a first config object

- Then it loads the specific stage config file to make another config object

- It merges these 2 config objects (stage values overrides default ones)

    File content looks like must look like this 
```JSON
{
  "db": {
    "user": "someUser",
    "password": "somePassword"
  },
  "theme": "dark"
}
```

<b>3) Loading environment variables</b>
```
CONFIG__db__password=123456 // compliant config and it's fetched
CONFIG__db__user=user // compliant config and it's fetched
SECRET_TOKEN=someToken // non-compliant config and it's not fetched
CONFIG__client_secret=someSecret // compliant config and it's fetched
```
- Fetches specific compliant env variables starting with CONFIG__ (allowing to avoid naming conflicts, see example above)

- Removes the prefix CONFIG__ and splits variable name by __ to rebuild a config nested object (__ double underscore defines a nested hierarchy relationship)

- Merges it into the existing config object we built in the last step (env variables overload static file configurations)

- If a watchdog is setup (fetches config from other source like DB)

- It loads config object new behavior configuration.

- It merges it into the object as well (watchdog config overloads environment configuration)

- Watchdog may be setup to run on a scheduled basis (dynamically updates our configuration)

## Config file content

After the preceding operations, and based on the secrets we’ve seen in the examples, our config object should look like this:
```JSON
{
  "db": {
    "user": "user",
    "password": "123456"
  },
  "theme": "dark",
  "client_secret": "someSecret"
}
```
- Note that the db user name and the db password have been overriden at the env variables loading
<hr />

## Naming and variable declarations
The final storage format is json, it means a format allowing nesting. Therefore we need to express this nesting in our config environment variables declarations

Env variable declaration example: `CONFIG__app__auth__client_id`

The `CONFIG__` part tells us it’s a compliant variable and that it’s readable by our config management library

The two underscores separator between two keywords gets us deeper in the object (auth is a child object of app)

No special interpretation for the one underscore separator, so it stays in the variable name

```JSON
{
  "app": {
    "auth": {
      "client_id": "someValue"
    }
  }
}
```

## How can I fetch these variables?
They can be fetched via the library, by adding `.` a dot to get deeper in the object, for our example we fetch the values with the keys: `app.auth.client_id db.password` using a function defined by the library API interface ex: `get_config('app.auth.client_id')`

It’s possible to access the config as a dict or an object 

```Javascript
const dbConfig = get_config('app.auth.client_id');
console.log(dbConfig); // {user: 'someUser', password: 'somePassword'}
```

    ⚠️ The dot separator `.` can’t be used in variable name
<hr />

# API interface

## 1- Config handler

### constructor (object)

- Instantiation of the config handler

Parameter | Description | Type | Required | Default value 
-----------|-----------|------------|------------|------------
`configDirPath` | Path to configuration files folder | string | Yes | -
`connectorsDirPath` | stage name (local, staging, prod …) | string | No | `default`
`defaultConfigPrefix` | The suffix used for env variables to be readable by the lib | string | No | `CONFIG`
`connectors` | A list of connectors subscriptions (for external sources, watchdogs…) | an array of connector instances | No | `[]`

- Return value: new config manager instance

### init ()

- Initializes the config handler, loads the configurations from different sources and runs the connectors.

- Return value: void

### get_current_env ()

- Get current environment (stage) name (ex: default, staging, production …)

- Return value: string

### get_config (key, defaultValue)

- Fetches the value of a given config key

Parameter | Description | Type | Required | Default value 
-----------|-----------|------------|------------|------------
`key` | a flattened key string to access to a configuration value | string | No | empty string
`defaultValue` | if key doesn’t exist in the config object, this value is returned | string | No | `null`

- Return value: a config value of mixed type depending on the target (string, array, object…)

### list ()

- Returns all the config store content

- Return value: object

### set_config (key, value)

- Sets the value of config key

Parameter | Description | Type | Required
-----------|-----------|------------|------------
`key` | a flattened key string to access to a configuration value | string | Yes
`value` | config value to assign | mixed | Yes

- Return value: void

### reload ()

- Clears the config store and relaunch the config load (as in init)

- Return value: void

### clear ()

- Clears the config store

- Return value: void

### load_connectors (connectors)

- Loads or reloads a list of given connectors

Parameter | Description | Type | Required
-----------|-----------|------------|------------
`connectors` | A list of connectors subscriptions (for external sources, watchdogs…) | an array of connector instances | Yes

- Return value: void

### stop_watchdogs ()

- Stop all connectors running watchdogs

- Return value: void

## 2- Connector (watchdog)
- A connector should extend the ConnectorAbstract provided within the lib

- You can set the following available props:

Prop name| Description | Type | Required | Default value 
-----------|-----------|------------|------------|------------
`isWatchdog` | Defines whether the connector is a watchdog (scheduled task) or not | bool | No | `false`
`timeout` | if isWatchdog=true: The time interval for the watchdog to fetch config (in milliseconds),  otherwise not used | integer | No | `1000`

You should implement the following method in order to fetch the config from the external source:

### return_config ()

- Fetches the configuration for the external source and load it into our main config object. It will be called at least once or on every run if the connector is configured as a watchdog.

- The returned object with be merged with the existing configuration store

- Return value: object
<hr />

# Type casting
The config handler provides the typecasting declaration in environment variables. Environment variables are fetched in our apps as strings. However, we are able to ask our config handler to treat it as another data type.

Here’s an example of environment variables that might have different types from string:

```
CONFIG__db__port=5432 // Basically an integer
CONFIG__db__user=someUser // Basically a string
CONFIG__db__do_migrations=1 // Basically a boolean
CONFIG__accepted_domains=[domain1,domain2] // Basically an array
```
But they are all translated as strings:
```JSON
{
  "db": {
    "port": "5432",
    "user": "someUser",
    "do_migrations": "1"
  },
  "accepted_domains": "[domain1,domain2]"
}
```
### How to request a specific type for an env var?

By adding a keyword in the variable key right after the prefix CONFIG__ and followed by a double underscore __. It would look like this {config-prefix}__{type}__{variable-name}

ex: CONFIG__integer__db_port=5432

### What types are accepted? 

Type|Usage (representation in the variable name)| Value syntax
-----------|-----------|------------
Integer | `int` or `integer` | Should be a number
String | `str` or `string` | Anything, it would be just transformed into a string (Type defaults to string anyway)
Boolean | `bool` or `boolean` | 0 or false (case insensitive) returns a boolean `FALSE`. Otherwise it’s transformed to a boolean, usually `TRUE`
Array | `arr` or `array` | `[element1, element2]`. Returns an array having `element1` and `element2` as <b>string</b> elements

ℹ️ Types default to string (if not defined or if type is not found)

⚠️ Array output elements are always strings

<b>So the previous example would look like this with the type casting syntax:</b>
```
CONFIG__str__db__port=5432 // Basically an integer
CONFIG__int__db__user=someUser // Basically a string
CONFIG__bool__db__do_migrations=1 // Basically a boolean
CONFIG__arr__accepted_domains=[domain1,domain2] // Basically an array
```
And the output would be like this:
```JSON
{
  "db": {
    "port": 5432,
    "user": "someUser",
    "do_migrations": true
  },
  "accepted_domains": [
    "domain1", "domain2"
  ]
}
```
