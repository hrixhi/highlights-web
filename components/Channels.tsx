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
            minHeight: '100%'
        }}
            onTouchMove={() => Keyboard.dismiss()}
        >
            <Animated.View style={{ ...styles.container, opacity: modalAnimation }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 20 }}>
                    <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} />
                </Text>
                <ChannelControls
                    closeModal={() => props.closeModal()}
                />
            </Animated.View>
        </View >
    );
}

export default Channels;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        minHeight: '100%',
        backgroundColor: 'white',
        // padding: 22.5,
        paddingTop: 5
    },
    screen: {
        padding: 15,
        width: '100%',
        height: '80%',
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a6a2a2'
    },
    all: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 20,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '3%',
        // marginTop: '4%',
        lineHeight: 18
    },
    cuesInput: {
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderRadius: 15,
        fontSize: 18,
        fontWeight: 'bold',
        padding: 20,
        paddingTop: 20,
        paddingBottom: 20,
        marginBottom: '4%',
        marginTop: 15
    },
});
