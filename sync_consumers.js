const debug   = require('debug')('main.consumers');
const dry     = !!process.env.DRY_RUN;
const kong    = require('./lib/kong.js');
const kongOld = kong.old;
const kongNew = kong.new;

const createConsumer = async (consumer) => {
    const options = {
        method: 'POST',
        url:    '/consumers/',
        body: {
            username:    consumer.username,
            custom_id:   consumer.custom_id,
        }
    };
    if (dry) {
        debug('would have created consumer: %j', options.body);
        return {};
    } else {
        debug('creating consumer: %j', options.body);
    }
    const resp = await kongNew(options);
    return resp.body;
};

const createOrUpdateConsumer = async (consumer) => {
    const resp = await kongNew({
        method: 'GET',
        url:    '/consumers/' + consumer.username
    });
    if (resp.statusCode != 200) {
        return await createConsumer(consumer);
    }
    debug('would have updated consumer: %j with %j', resp.body, consumer);
    return resp.body;
};

const createOrUpdateHmac = async (consumer) => {
    const respOld = await kongOld({
        method: 'GET',
        url:    '/consumers/' + consumer.username + '/hmac-auth?size=10000'
    });
    debug('Found HMAC auth for consumer: %j', respOld.body);
    const resp = await kongNew({
        method: 'GET',
        url:    '/consumers/' + consumer.username + '/hmac-auth?size=10000'
    });
    const extinct = respOld.body.data
        .filter(c => {
            return (resp.body.data || [])
                .filter(cc => c.username === cc.username).length < 1;
        });
    for (let i = extinct.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createConsumerHmac(consumer, extinct[i]);
    }
};

const createOrUpdateApiKey = async (consumer) => {
    const respOld = await kongOld({
        method: 'GET',
        url:    '/consumers/' + consumer.username + '/key-auth?size=10000'
    });
    debug('Found key auth for consumer: %j', respOld.body);
    const resp = await kongNew({
        method: 'GET',
        url:    '/consumers/' + consumer.username + '/key-auth?size=10000'
    });
    const extinct = respOld.body.data
        .filter(c => {
            return (resp.body.data || [])
                .filter(cc => c.key === cc.key).length < 1;
        });
    for (let i = extinct.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createConsumerApiKey(consumer, extinct[i]);
    }
};

const createConsumerApiKey = async (consumer, key) => {
    const options = {
        method: 'POST',
        url:    '/consumers/' + consumer.username + '/key-auth',
        body: {
            key:   key.key,
        }
    };
    if (dry) {
        debug('would have created consumer key: %j', options.body);
        return {};
    } else {
        debug('creating consumer key: %j', options.body);
    }
    const resp = await kongNew(options);
    return resp.body;
};

const createConsumerHmac = async (consumer, hmac) => {
    const options = {
        method: 'POST',
        url:    '/consumers/' + consumer.username + '/hmac-auth',
        body: {
            username: hmac.username,
            secret:   hmac.secret,
        }
    };
    if (dry) {
        debug('would have created consumer hmac: %j', options.body);
        return {};
    } else {
        debug('creating consumer hmac: %j', options.body);
    }
    const resp = await kongNew(options);
    return resp.body;
};

const createOrUpdateAcls = async (consumer) => {
    const respOld = await kongOld({
        method: 'GET',
        url:    '/consumers/' + consumer.username + '/acls?size=10000'
    });
    debug('Found acls for consumer: %j', respOld.body);
    const resp = await kongNew({
        method: 'GET',
        url:    '/consumers/' + consumer.username + '/acls?size=10000'
    });
    const extinct = respOld.body.data
        .filter(c => {
            return (resp.body.data || [])
                .filter(cc => c.group === cc.group).length < 1;
        });
    for (let i = extinct.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createConsumerAcl(consumer, extinct[i]);
    }
};

const createConsumerAcl = async (consumer, acl) => {
    const options = {
        method: 'POST',
        url:    '/consumers/' + consumer.username + '/acls',
        body: {
            group:   acl.group,
        }
    };
    if (dry) {
        debug('would have created consumer acl: %j', options.body);
        return {};
    } else {
        debug('creating consumer acl: %j', options.body);
    }
    const resp = await kongNew(options);
    return resp.body;
};

const createOrUpdateConsumers = async () => {
    const oldConsumersResp = await kongOld({
        url: '/consumers?size=10000',   // TODO: This is a hack
        method: 'GET'
    });
    const oldConsumers = oldConsumersResp.body.data;
    for (let i = oldConsumers.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createOrUpdateConsumer(oldConsumers[i]);
    }
    for (let i = oldConsumers.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createOrUpdateHmac(oldConsumers[i]);
    }
    for (let i = oldConsumers.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createOrUpdateApiKey(oldConsumers[i]);
    }
    for (let i = oldConsumers.length - 1; i >= 0; i--) {
        // This for loop is to avoid DOSing the server
        await createOrUpdateAcls(oldConsumers[i]);
    }
};

const main = async () => {
    try {
        await createOrUpdateConsumers();
    } catch (e) {
        console.error(e);
    }
};
main();
