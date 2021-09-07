import React, { useState, useEffect } from 'react';
import { Animated, Dimensions, Keyboard } from 'react-native';
import { Text, View } from './Themed';
import ProfileControls from './ProfileControls';

const Profile: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

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
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,
        }}
            onTouchMove={() => Keyboard.dismiss()}
        >
            <Animated.View style={{
                width: '100%',
                paddingHorizontal: 0,
                backgroundColor: 'white',
                opacity: modalAnimation,
                // paddingLeft: 20
            }}>
                <ProfileControls
                    saveDataInCloud={() => props.saveDataInCloud()}
                    reOpenProfile={() => props.reOpenProfile()}
                    closeModal={() => props.closeModal()}
                    reloadData={() => props.reloadData()}
                />
            </Animated.View>
        </View >
    );
}

export default Profile;