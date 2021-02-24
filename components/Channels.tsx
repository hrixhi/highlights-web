import React, { useState, useEffect } from 'react';
import { StyleSheet, Animated, Keyboard } from 'react-native';
import { Text, View } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import ChannelControls from './ChannelControls';

const Channels: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))

    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
            paddingBottom: 330,
            minHeight: '100%',
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30,
        }}
            onTouchMove={() => Keyboard.dismiss()}
        >
            <Animated.View style={{
                width: '60%',
                minHeight: '100%',
                backgroundColor: 'white',
                paddingTop: 5,
                opacity: modalAnimation,
                alignSelf: 'center'
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 20 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <ChannelControls
                    closeModal={() => props.closeModal()}
                />
            </Animated.View>
        </View >
    );
}

export default Channels;