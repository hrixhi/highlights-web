import React, { useEffect, useRef, useState } from 'react';
import { WebView } from "react-native-webview";

const Webview: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const ref: any = useRef()
    const [intervalKey, setIntervalKey] = useState(0)
    const [key, setKey] = useState(Math.random())

    useEffect(() => {
        const id = setInterval(() => {
            setKey(Math.random())
        }, 3000)
        setIntervalKey(id)
    }, [])

    return (
        <WebView
            key={key}
            onLoad={(syntheticEvent) => {
                clearInterval(intervalKey)
            }}
            ref={ref}
            style={{ flex: 1 }}
            scrollEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsFullscreenVideo={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            source={{
                uri: 'https://docs.google.com/viewer?url=' + encodeURI(props.url) + '&embedded=true'
            }}
        />
    );
}

export default Webview