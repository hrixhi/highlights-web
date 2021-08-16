import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WebView } from "react-native-webview";

const Webview: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

const urls = props.url

    const ref: any = useRef()
    const [intervalKey, setIntervalKey] = useState(0)
    const [key, setKey] = useState(Math.random())
    const [height, setHeight] = useState(0)
    const [showDelete,setShowDelete] = useState(false)

    useEffect(() => {
        const id = setInterval(() => {
            setKey(Math.random())
        }, 3000)
        setIntervalKey(id)
    }, [])

    useEffect(()=>{
       if(props.showDelete){
       setShowDelete(true)
      }
   },[])

    const onWebViewMessage = useCallback((event: any) => {
        if (props.fullScreen) {
            setHeight(Number(event.nativeEvent.data))
        }
    }, [])

    
    return (
        <>  
       
           <WebView
                key={key}
                onLoad={(syntheticEvent) => {
                    clearInterval(intervalKey)
    
                }}
                ref={ref}
                onMessage={onWebViewMessage}
                style={props.fullScreen ? { flex: 1 } : { flex: 1 }}
                scrollEnabled={props.fullScreen ? false : true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                automaticallyAdjustContentInsets={props.fullScreen ? false : true}
                startInLoadingState={true}
                allowsFullscreenVideo={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                // injectedJavaScript='window.ReactNativeWebView.postMessage(document.body.scrollHeight)'
                source={{
                    uri: 'https://docs.google.com/viewer?url=' + encodeURI(urls) + '&embedded=true'
                }}
            />
            
        
        </>
    );
}

export default Webview