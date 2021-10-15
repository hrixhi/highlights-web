import React, { useState, useEffect } from 'react';
import { ScrollView, Keyboard } from 'react-native';
import { Text, View } from './Themed';
import ChannelControls from './ChannelControls';

const Channels: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    // const [modalAnimation] = useState(new Animated.Value(0))

    // useEffect(() => {
    //     Animated.timing(modalAnimation, {
    //         toValue: 1,
    //         duration: 150,
    //         useNativeDriver: true
    //     }).start();
    // }, [])

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,
        }}
            onTouchMove={() => Keyboard.dismiss()}
        >
            <ScrollView style={{
                width: '100%',
                paddingHorizontal: 0,
                // minHeight: '100%',
                backgroundColor: 'white',
                //opacity: modalAnimation,
                // alignSelf: 'center',
                // paddingLeft: 20
            }}>
                {/* <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 10 }}>
                    {/* <Ionicons name='chevron-down' size={15} color={'#e0e0e0'} />
                </Text> */}
                <ChannelControls
                    subscriptions={props.subscriptions}
                    closeModal={() => props.closeModal()}
                    refreshSubscriptions={props.refreshSubscriptions}
                    setShowCreate={(val: any) => props.setShowCreate(val)}
                    showCreate={props.showCreate}
                />
            </ScrollView>
        </View >
    );
}

export default Channels;