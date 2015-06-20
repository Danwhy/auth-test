var Hapi = require('hapi');
var server = new Hapi.Server();

server.connection({port : 8000});

server.register(require('hapi-auth-cookie'), function (err) {

    server.auth.strategy('session', 'cookie', {
        password: 'password',
        cookie: 'sid-example',
        isSecure: false
    });

});

server.register(require('bell'), function(err){

    server.auth.strategy('google', 'bell', {
        provider: 'google',
        password: 'password',
        clientId: process.env.GOOGID,
        clientSecret: process.env.GOOGSECRET,
        isSecure: false,
        providerParams: {
            redirect_uri: server.info.uri + '/login'
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        config: {
            auth: {
                mode: 'try',
                strategy: 'session'
            },
            handler: function(request, reply){
                return reply.file('index.html');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/login',
        config: {
            auth: 'google',
            handler: function(request, reply){
                request.auth.session.set(request.auth.credentials);
                return reply.redirect('/profile');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/profile',
        config: {
            auth: {
                mode: 'try',
                strategy: 'session'
            },
            handler: function(request, reply){
                if (request.auth.isAuthenticated){
                    return reply('<p>Welcome, ' + request.auth.credentials.profile.name.first + '</p><a href="/">Home</a>');
                } else {
                    return reply('<p>please login</p><a href="/">Home</a>');
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/logout',
        config: {
            auth: 'session',
            handler: function(request, reply){
                request.auth.session.clear();
                return reply.redirect('/');
            }
        }
    });

    server.start();
});
