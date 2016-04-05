
import {HttpUtil} from './util';

let 
    statusCodes = {
        101: 'Switching Protocols',
        200: 'OK'    
    },
    
    // ...
    
    // returns helper object for parsing and writing HTTP messages.
    HttpMessage = (parseStartLine, writeStartLine) => {
        
        let instance = {};
        
        instance.parse = (data) => {
                
            let 
                messageObject = {},
                
                messageString = HttpUtil.arrayBufferToString(data),
                
                headerString,
                bodyString,
                
                lines,
                line,
                
                bodyIndex;
                
            // ...
            
            bodyIndex 
                = messageString.indexOf('\r\n\r\n');
            
            headerString
                = messageString.substr(0, bodyIndex);

            bodyString
                = messageString.substr(bodyIndex + 4);

            headerString.replace(/\r\n/g, '\n');

            lines
                = headerString.split('\n');

            bodyIndex
                += 2;

            // ...

            line = lines.shift();
            parseStartLine(line, messageObject);

            // ...

            messageObject.headers = {};

            line = lines.shift();
            while (line)
            {
                let 
                    headerName
                        = line.substr(0, line.indexOf(':')),

                    headerValue
                        = line.substr(line.indexOf(':') + 1);

                messageObject.headers[headerName] = headerValue.trim();
                
                line = lines.shift();
            }  

            // ...

            if (
                messageObject.headers['Content-Length'] && 
                messageObject.headers['Content-Length'] != 0
                )
            {
                messageObject.body = bodyString;
            }

            return messageObject;
        };
            
        instance.write = (messageObject) => {
            let messageString = writeStartLine(messageObject);
            messageString += '\r\n';

            for (let header in messageObject.headers)
            {
                messageString += header + ': ' + messageObject.headers[header] + '\r\n';
            }

            messageString += '\r\n';
            
            if (messageObject.body)
            {
                messageString += messageObject.body;
            }
            
            return HttpUtil.stringToArrayBuffer(messageString);
        };
        
        return instance;
    },
    
    HttpReq = () => {
        return HttpMessage(
            (line, messageObject) => {
                
                let 
                    tokens = line.split(' '),
                    
                    queryString,
                    queryIndex;
                    
                // ...
                    
                messageObject.method 
                    = tokens[0];
                
                queryIndex
                    = tokens[1].indexOf('?');

                messageObject.path 		
                    = tokens[1].substring(
                        0, 
                        queryIndex !== -1 ? queryIndex : tokens[1].length
                    );

                if (queryIndex !== -1)
                {
                    queryString = tokens[1].substring(queryIndex + 1);

                    (() => {
                        let 
                            params = {},
                            parts,
                            temp; 
                            
                        parts = queryString.split('&');
                        for (let i = 0; i < parts.length; i++)
                        {
                            temp 			= parts[i].split('=');
                            params[temp[0]] = temp[1]; 
                        }

                        messageObject.params = params;
                    })();
                }
            },
            (messageObject) => {
                return `${messageObject.method} ${messageObject.path} HTTP/1.1`;
            }
        );  
    },
    
    HttpRes = () => {
        return HttpMessage(
            (line, messageObject) => {
                messageObject.statusCode = parseInt(line.split(' ')[1]);
            },
            (messageObject) => {
                return `HTTP/1.1 ${messageObject.statusCode} ${statusCodes[messageObject.statusCode]}`;
            }
        );
    };
    
// ...

export let HttpIO = {
    Request: 
        HttpReq,
    
    Response:
        HttpRes 
};