var Hapi = require('hapi');
var server = new Hapi.Server();
var Handlebars = require('handlebars');

server.connection({port : 8000});

server.views({
    engines: {
        html: Handlebars
    },
    relativeTo: __dirname,
    path: "templates",
});

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
                if (request.auth.isAuthenticated){
                    return reply.view('index.html', {name: request.auth.credentials.profile.name.first, link: new Handlebars.SafeString('<a href="/profile">Profile</a>')});
                } else {
                    return reply.view('index.html', {link: new Handlebars.SafeString('<a href="/login">Login</a>')});
                }
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
