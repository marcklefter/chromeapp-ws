
import {httpd}      from './http/server/server';
import {routes}     from './http/server/routes';
import {websocket}  from './http/server/middleware/websocket';

// custom message handler for websocket messages.
import {appMessageHandler} from './appMessageHandler';

let ApplicationFactory = (() => {
    
    let initialized;
    
    // ...
    
    return class Application {
        
        constructor()
        {
            
        }
        
        init(sendResponse)
        {
            if (initialized) return sendResponse && sendResponse({ port: httpd.port });
            
            httpd.listen()
                .then(() => {
                    
                    // route for websocket connections.
                    routes.get('/ws', websocket(appMessageHandler));
                    
                    // ...
                    
                    initialized = true;
                    
                    if (sendResponse) { sendResponse({ port: httpd.port }); }
                });
        }
        
        deinit()
        {
            httpd.close();
        }
    }
})();

// ...

export let app = new ApplicationFactory();