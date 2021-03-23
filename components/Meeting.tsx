import React, { useState, useEffect } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, View } from './Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Jutsu } from 'react-jutsu'

const Meeting: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))
    const [room] = useState(props.channelId)
    const [name, setName] = useState('')
    const [password] = useState(props.channelCreatedBy)

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    setName(user.displayName)
                }
            }
        )()
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])
    const windowHeight = Dimensions.get('window').height;

    if (name === '') {
        return null
    }

    return (
        <View style={{
            width: '100%',
            height: windowHeight - 30,
            backgroundColor: '#fff',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
        }}>
            <Animated.View style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'white',
                padding: 20,
                opacity: modalAnimation,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                alignSelf: 'center'
            }}>
                <Text style={{ width: '100%', textAlign: 'center', paddingTop: 5 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                    <Text
                        ellipsizeMode="tail"
                        style={{ color: '#a6a2a2', fontSize: 18, flex: 1, lineHeight: 25 }}>
                        Virtual Classroom
                    </Text>
                </View>
                <Jutsu
                    containerStyles={{
                        width: '100%',
                        height: '62.5%',
                        marginTop: 75,
                        borderRadius: 20
                    }}
                    // domain='cuesapp.co'
                    roomName={room}
                    displayName={name}
                    password={password}
                    onMeetingEnd={() => console.log('Meeting has ended')}
                    loadingComponent={<p>loading ...</p>}
                    errorComponent={<p>Oops, something went wrong</p>} />
            </Animated.View>
        </View >
    );
}

export default Meeting;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: 'white',
        height: '100%',
        width: Dimensions.get('window').width < 1024 ? '100%' : '60%',
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0,
        alignSelf: 'center',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
    },
});