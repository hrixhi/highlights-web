import React, { useState, useEffect } from 'react';
import { Animated, Dimensions, Keyboard, ScrollView } from 'react-native';
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
            <View style={{
                flex: 1,
                paddingHorizontal: 0,
                // minHeight: '100%',
                backgroundColor: 'white',
                //opacity: modalAnimation,
                // alignSelf: 'center',
                // paddingLeft: 20
            }}>
                <ProfileControls
                    saveDataInCloud={() => props.saveDataInCloud()}
                    reOpenProfile={() => props.reOpenProfile()}
                    closeModal={() => props.closeModal()}
                    reloadData={() => props.reloadData()}
                    setShowSavePassword={(val: any) => props.setShowSavePassword(val)}
                    showSavePassword={props.showSavePassword}
                />
            </View>
        </View >
    );
}

export default Profile;