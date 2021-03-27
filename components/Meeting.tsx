import React, { useState, useEffect, useCallback } from 'react';
import { Animated, Dimensions, Switch, StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Jutsu } from 'react-jutsu'
import { fetchAPI } from '../graphql/FetchAPI';
import { editMeeting, getMeetingStatus } from '../graphql/QueriesAndMutations';

const Meeting: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(0))
    const [room] = useState(props.channelId)
    const [name, setName] = useState('')
    const [password] = useState(props.channelCreatedBy)
    const [isOwner, setIsOwner] = useState(false)
    const [meetingOn, setMeetingOn] = useState(false)

    const loadMeetingStatus = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: getMeetingStatus,
            variables: {
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data && res.data.channel && res.data.channel.getMeetingStatus) {
                setMeetingOn(true)
            } else {
                setMeetingOn(false)
            }
        }).catch(err => console.log(err))
    }, [props.channelId])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    setName(user.displayName)
                    if (user._id.toString().trim() === props.channelCreatedBy) {
                        setIsOwner(true)
                    }
                }
            }
        )()
        loadMeetingStatus()
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [props.channelCreatedBy, props.channelId])
    const windowHeight = Dimensions.get('window').height;

    const updateMeetingStatus = useCallback(() => {
        const server = fetchAPI('')
        server.mutate({
            mutation: editMeeting,
            variables: {
                channelId: props.channelId,
                meetingOn: !meetingOn
            }
        }).then(res => {
            if (res.data && res.data.channel && res.data.channel.editMeeting) {
                loadMeetingStatus()
            }
        }).catch(e => console.log(e))
    }, [meetingOn, props.channelId])

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
                        Classroom
                    </Text>
                </View>
                <View style={{ backgroundColor: 'white', flex: 1 }}>
                    {
                        isOwner ?
                            <View>
                                <View style={{ width: '100%', paddingTop: 20, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                        Allow Participants
                                    </Text>
                                </View>
                                <View style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    marginRight: 10
                                }}>
                                    <Switch
                                        value={meetingOn}
                                        onValueChange={() => updateMeetingStatus()}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: '#f4f4f4',
                                            true: '#0079fe'
                                        }}
                                        activeThumbColor='white'
                                    />
                                </View>
                            </View> : null
                    }
                    {
                        meetingOn ?
                            <Jutsu
                                containerStyles={{
                                    width: '100%',
                                    height: '80%',
                                    marginTop: isOwner ? 20 : 70,
                                    borderRadius: 20
                                }}
                                // domain='cuesapp.co'
                                roomName={room}
                                displayName={name}
                                password={password}
                                onMeetingEnd={() => console.log('Meeting has ended')}
                                loadingComponent={<p>loading ...</p>}
                                errorComponent={<p>Oops, something went wrong</p>} />
                            : <View style={{ backgroundColor: 'white', flex: 1 }}>
                                <Text style={{ width: '100%', color: '#a6a2a2', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    Classroom not in session.
                                </Text>
                            </View>
                    }
                </View>
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