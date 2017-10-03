const debug   = require('debug')('main.apis');
const dry     = !!process.env.DRY_RUN;
const kong    = require('./lib/kong.js');
const kongOld = kong.old;
const kongNew = kong.new;
const config  = {
    https_only:           true,
    http_if_terminated:   true
};

const stripTrailingSlash = (str) => {
    return str.match(/.*[^\/]/)[0];
};

const createApiPlugin = async (api, plugin) => {
    const options = {
        method:   'POST',
        url:      '/apis/' + api.name + '/plugins',
        body: {
            name:     plugin.name,
            config:   plugin.config,
        }
    };
    if (dry) {
        debug('would have created plugin: %j at ', options.body, options.url);
        return {};
    }
    const resp = await kongNew(options);
    return resp.body;
};

const updateApiPlugin = async (api, plugin, update) => {
    debug('would have updated plugin: %j on api %s with %j', plugin, api.name, update);
    return {};
};

const createOrUpdateApiPlugin = async (api, plugin) => {
    const options = {
        method:   'GET',
        url:      '/apis/' + api.name + '/plugins/' + plugin.name
    };
    const resp = await kongNew(options);
    if (resp.statusCode != 200) {
        return await createApiPlugin(api, plugin);
    }
    return await updateApiPlugin(api, resp.body, plugin);
};

const createOrUpdatePlugins = async (api) => {
    const resp = await kongOld({
        method:   'GET',
        url:      '/apis/' + api.name + '/plugins?size=1000'
    });
    const plugins = resp.body.data;
    return Promise.all(plugins.map(p => createOrUpdateApiPlugin(api, p)));
};

const createApi = async (api) => {
    const options = {
        method: 'POST',
        url:    '/apis/',
        body: {
            name:                 api.name,
            uris:                 stripTrailingSlash(api.request_path),
            upstream_url:         stripTrailingSlash(api.upstream_url),
            strip_uri:            api.strip_request_path,
            preserve_host:        api.preserve_host,
            https_only:           config.https_only,
            http_if_terminated:   config.http_if_terminated,
        }
    };
    if (dry) {
        debug('would have created api: %j', options.body);
        return {};
    }
    const resp = await kongNew(options);
    return resp.body;
};

const updateApi = async (api, update) => {
    debug('would have updated api: %j with %j', api, update);
    return {};
};

const createOrUpdateApi = async (api) => {
    const resp = await kongNew({
        method: 'GET',
        url:    '/apis/' + api.name
    });
    if (resp.statusCode != 200) {
        return await createApi(api);
    }
    return await updateApi(resp.body, api);
};

const createOrUpdateApis = async () => {
    const oldApisResp = await kongOld({
        url: '/apis?size=10000',   // TODO: This is a hack
        method: 'GET'
    });
    const oldApis = oldApisResp.body.data;
    for (let i = oldApis.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createOrUpdateApi(oldApis[i]);
    }
    for (let i = oldApis.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createOrUpdatePlugins(oldApis[i]);
    }
};

const main = async () => {
    try {
        await createOrUpdateApis();
    } catch (e) {
        console.error(e);
    }
};
main();
