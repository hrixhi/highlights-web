
import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, View, Keyboard, } from "react-native";
import {
    RichEditor,
} from "react-native-pell-rich-editor";

const MiniEditorScreen: React.FC<{ [label: string]: any }> = (props: any) => {

    const RichText: any = useRef();
    const [height, setHeight] = useState(100)

    const handleHeightChange = useCallback((h: any) => {
        setHeight(h)
    }, [])

    return (
        <View style={{
            width: '100%',
            minHeight: 100,
            backgroundColor: 'white',
            paddingBottom: 5
        }}>
            <RichEditor
                disabled={false}
                containerStyle={{
                    height,
                    backgroundColor: '#f4f4f4',
                    borderRadius: 15,
                    padding: 3,
                    paddingTop: 5,
                    paddingBottom: 10
                }}
                ref={RichText}
                style={{
                    width: '100%',
                    backgroundColor: '#f4f4f4',
                    borderRadius: 15,
                    minHeight: 100
                }}
                editorStyle={{
                    backgroundColor: '#f4f4f4',
                    placeholderColor: '#a6a2a2',
                    color: '#101010'
                }}
                initialContentHTML={props.message}
                onScroll={() => Keyboard.dismiss()}
                placeholder={props.placeholder}
                onChange={(text) => props.setMessage(text)}
                onHeightChange={handleHeightChange}
                onBlur={() => Keyboard.dismiss()}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                allowsLinkPreview={true}
                allowsBackForwardNavigationGestures={true}
            />
        </View>
    );
};

export default MiniEditorScreen;