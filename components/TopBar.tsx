import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Image, ScrollView, Dimensions, Linking } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import { doesChannelNameExist, getMeetingStatus, totalUnreadDiscussionThreads, totalUnreadMessages, updateChannel } from '../graphql/QueriesAndMutations';
import alert from './Alert';

const TopBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styles: any = styleObject(props.channelId)
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [filterChoice] = useState(props.channelFilterChoice)
    const [channelCategories, setChannelCategories] = useState([])
    const [meetingOn, setMeetingOn] = useState(false)
    const [isOwner, setIsOwner] = useState(false)

    // NAVRACHANA HARD CODE
    const [showNavrachanaLogo, setShowNavrachanaLogo] = useState(false)

    const editChannelInfo = useCallback(() => {
        const name = prompt('Update Channel Name', props.filterChoice)
        const password = prompt('Update Channel Password (Optional)')
        if (!name || name === '') {
            alert("Enter channel name.")
            return;
        }
        const server = fetchAPI("")
        server.query({
            query: doesChannelNameExist,
            variables: {
                name
            }
        }).then(res => {
            if (res.data && (res.data.channel.doesChannelNameExist !== true || name.trim() === props.filterChoice.trim())) {
                server.mutate({
                    mutation: updateChannel,
                    variables: {
                        name: name.trim(),
                        password,
                        channelId: props.channelId
                    }
                }).then(res => {
                    if (res.data && res.data.channel.update) {
                        props.loadData()
                        alert("Channel updated!")
                    } else {
                        alert("Something went wrong.")
                    }
                }).catch(err => {
                    alert("Something went wrong.")
                })
            } else {
                alert("Channel name in use.")
            }
        }).catch(err => {
            alert("Something went wrong.")
        })
    }, [props.filterChoice, props.loadData])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    if (user.email === 'hrishi@cuesapp.co') {
                        setShowNavrachanaLogo(true)
                    }
                    if (props.channelId !== '') {
                        if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                            setIsOwner(true)
                        }
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
                    }
                }
            }
        )()
        const custom: any = {}
        const cat: any = []
        cues.map((cue) => {
            if (cue.customCategory && cue.customCategory !== '' && !custom[cue.customCategory]) {
                custom[cue.customCategory] = 'category'
            }
        })
        Object.keys(custom).map(key => {
            cat.push(key)
        })
        setChannelCategories(cat)
    }, [cues, props.channelCreatedBy])

    return (
        <View style={styles.topbar} key={Math.random()}>
            <View style={{ width: '80%', height: Dimensions.get('window').height * 0.15 * 0.15, alignSelf: 'center' }} />
            <View style={{ width: '100%', height: Dimensions.get('window').height * 0.15 * 0.85 }}>
                <View style={{
                    height: '45%',
                    flexDirection: 'row',
                    display: 'flex',
                    paddingLeft: 20,
                    paddingTop: 3
                }}>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('http://www.cuesapp.co')}
                        style={{ backgroundColor: 'white', paddingTop: 6 }}>
                        {/* NAVRACHANA HARD CODE */}
                        <Image
                            source={
                                // showNavrachanaLogo
                                // ? 'https://cues-files.s3.amazonaws.com/media/png/1624424962493_logo.png' :
                                require('./default-images/cues-logo-black-exclamation-hidden.jpg')
                            }
                            style={{
                                // width: Dimensions.get('window').height * (showNavrachanaLogo ? 0.11 : 0.14) * 0.53456,
                                // height: Dimensions.get('window').height * (showNavrachanaLogo ? 0.22 : 0.14) * 0.2
                                width: Dimensions.get('window').height * 0.13 * 0.53456,
                                height: Dimensions.get('window').height * 0.15 * 0.2
                            }}
                            resizeMode={'contain'}
                        />
                    </TouchableOpacity>
                    <View
                        key={JSON.stringify(cues)}
                        style={{
                            flex: 1, flexDirection: 'row'
                        }}>
                        {
                            props.channelId !== '' ?
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openMeeting()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='videocam-outline' size={21} color={'#a2a2aa'} />
                                            {
                                                meetingOn ?
                                                    <View style={styles.badge} /> : null
                                            }
                                        </Text>
                                        <Text style={{ fontSize: 9, color: '#a2a2aa', textAlign: 'center' }}>
                                            Lectures
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openSubscribers()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='mail-outline' size={21} color={'#a2a2aa'} />
                                            {
                                                props.unreadMessages !== 0 ?
                                                    <View style={styles.badge} /> : null
                                            }
                                        </Text>
                                        <Text style={{ fontSize: 9, color: '#a2a2aa', textAlign: 'center' }}>
                                            Inbox
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openDiscussion()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='chatbubble-ellipses-outline' size={20} color={'#a2a2aa'} />
                                            {
                                                props.unreadDiscussionThreads !== 0 ?
                                                    <View style={styles.badge} /> : null
                                            }
                                        </Text>
                                        <Text style={{ fontSize: 9, color: '#a2a2aa', textAlign: 'center' }}>
                                            Discussion
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15 }}
                                        onPress={() => props.openGrades()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='stats-chart-outline' size={19} color={'#a2a2aa'} />
                                        </Text>
                                        <Text style={{ fontSize: 9, color: '#a2a2aa', textAlign: 'center' }}>
                                            Grades
                                        </Text>
                                    </TouchableOpacity>
                                    {
                                        isOwner ?
                                            <TouchableOpacity
                                                style={{ marginRight: 15 }}
                                                onPress={() => editChannelInfo()}>
                                                <Text style={styles.channelText}>
                                                    <Ionicons name='settings-outline' size={19} color={'#a2a2aa'} />
                                                </Text>
                                                <Text style={{ fontSize: 9, color: '#a2a2aa', textAlign: 'center' }}>
                                                    Settings
                                                </Text>
                                            </TouchableOpacity> : null
                                    }
                                </View> :
                                <View style={{ height: 34 }} />
                        }
                    </View>
                </View>
                <View
                    key={JSON.stringify(cues) + JSON.stringify(filterChoice)}
                    style={{
                        width: '100%', height: '55%', flexDirection: 'column',
                        paddingTop: 5
                    }}>
                    <View style={{ flex: 1 }} />
                    {/* <View>
                        <Text
                            style={{
                                // paddingTop: 5,
                                paddingLeft: 5,
                                paddingBottom: 4,
                                fontSize: 8,
                                color: '#a2a2aa'
                            }}>
                            {props.channelId && props.channelId !== '' ? props.filterChoice : 'My Cues'}
                        </Text>
                    </View> */}
                    <ScrollView style={{
                        width: '98.5%',
                        paddingLeft: 20,
                    }} horizontal={true}
                        showsHorizontalScrollIndicator={false}
                    >
                        <TouchableOpacity
                            style={filterChoice === 'All' ? styles.subOutline : styles.sub}
                            onPress={() => props.setChannelFilterChoice('All')}>
                            <Text
                                style={{ color: '#a2a2aa', lineHeight: 20, fontSize: 13 }}
                            >
                                All
                            </Text>
                        </TouchableOpacity>
                        {
                            channelCategories.map((category: string) => {
                                return <TouchableOpacity
                                    key={Math.random()}
                                    style={filterChoice === category ? styles.subOutline : styles.sub}
                                    onPress={() => props.setChannelFilterChoice(category)}>
                                    <Text
                                        style={{ color: '#a2a2aa', lineHeight: 20, fontSize: 13 }}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            })
                        }
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}


export default React.memo(TopBar, (prev, next) => {
    return _.isEqual(prev.cues, next.cues) && _.isEqual(prev.channelFilterChoice, next.channelFilterChoice)
})

const styleObject: any = (channelId: any) => StyleSheet.create({
    topbar: {
        height: '18%',
        width: '100%',
        flexDirection: 'column',
        display: 'flex',
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        paddingTop: 18
    },
    badge: {
        position: 'absolute',
        alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginRight: -2,
        marginTop: 0,
        borderRadius: 15,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    text: {
        textAlign: 'right',
        color: '#202025',
        fontSize: 15,
        paddingRight: 15
    },
    subOutline: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20,
        borderRadius: 10,
        borderColor: '#a2a2aa',
        borderWidth: 1
    },
    sub: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21,
        textAlign: 'center'
    }
});
