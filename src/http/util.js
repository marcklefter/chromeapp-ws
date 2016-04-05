
export let HttpUtil = {
    arrayBufferToString: (arrayBuffer) => {
    
        let 
            sb 
                = '',
            view 
                = new Uint8Array(arrayBuffer);
            
        for (let i = 0; i < view.length; i++)
        {
            sb += String.fromCharCode(view[i]);
        }
        
        return sb;
    },

    stringToArrayBuffer: (str) => {
    
        let 
            arrayBuffer 
                = new ArrayBuffer(str.length),
            view 
                = new Uint8Array(arrayBuffer);
            
        for (let i = 0; i < str.length; i++)
        {
            view[i] = str.charCodeAt(i);
        }
        
        return arrayBuffer;
    }  
};