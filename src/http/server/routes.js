
let RoutesFactory = (() => {
    
    let mappings = {
        GET: {}
    };
    
    return class Routes {
        
        constructor()
        {
            
        }
        
        /** Registers a middleware chain for GET requests matching a specific path. */
        get(path, ...middleware)
        {
            mappings.GET[path] = middleware;
        }
        
        route(req, res, context)
        {
            let 
                routeChain = mappings[req.method][req.path].slice(),
                
                next = () => {
                    let middleware = routeChain.shift();
                    if (middleware)
                    {
                        try 
                        {
                            middleware(req, res, context, next);
                        } 
                        catch (err)
                        {
                            // TBD: Handle error thrown by middleware.
                        }
                    }
                };
                
            return next();
        }
    };
    
})();

export let routes = new RoutesFactory();