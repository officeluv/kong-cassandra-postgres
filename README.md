# kong-cassandra-postgres
This is a migration script for moving Kong 0.X.0 to >=0.8.0

## Installation

~~~sh
$ npm install
$ export KONG_OLD_URL=https://example.com
$ export KONG_OLD_APIKEY=alskdjflkj2l34h2k3jh4kj23h4
$ export KONG_NEW_URL=https://example-foo.com
$ export KONG_NEW_APIKEY=234k2k3j4hkj23h4234
$ export DRY_RUN=true # optional
$ export DEBUG=main.* # optional
~~~

## Usage

~~~sh
$ node sync_apis.js     # copies over apis/plugins
$ node sync_consumers.js # copies over consumers/keys/hmac/acls
~~~
