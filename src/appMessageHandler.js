
// 'message' is either of type 'string' or an instance of ArrayBuffer.
// 'sendFn' is a helper function to send a message of type 'string' or an instance of ArrayBuffer to the client.
export let appMessageHandler = (message, sendFn) => {
    
    // echo the message back to the client.
    sendFn(message);  
};