import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, Dimensions, Linking } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import { getOrganisation } from '../graphql/QueriesAndMutations';
import logo from './default-images/cues-logo-white-exclamation-hidden.jpg'

const TopBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styles: any = styleObject(props.channelId)
    // const [filterChoice] = useState(props.channelFilterChoice)
    // const [meetingOn, setMeetingOn] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [school, setSchool] = useState<any>(null)

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    const server = fetchAPI('')
                    server.query({
                        query: getOrganisation,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.school.findByUserId) {
                            setSchool(res.data.school.findByUserId)
                        }
                    })
                    if (props.channelId !== '') {
                        if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                            setIsOwner(true)
                        }
                        // server.query({
                        //     query: getMeetingStatus,
                        //     variables: {
                        //         channelId: props.channelId
                        //     }
                        // }).then(res => {
                        //     if (res.data && res.data.channel && res.data.channel.getMeetingStatus) {
                        //         setMeetingOn(true)
                        //     } else {
                        //         setMeetingOn(false)
                        //     }
                        // }).catch(err => console.log(err))
                    }
                }
            }
        )()

    }, [props.channelCreatedBy])



    return (
        <View style={styles.topbar} key={Math.random()}>
            <View style={{ width: '100%', height: Dimensions.get('window').height * 0.15, backgroundColor: '#2F2F3C' }}>
                <View style={{
                    // height: '45%',
                    flexDirection: 'row',
                    display: 'flex',
                    paddingHorizontal: 25,
                    paddingTop: 10,
                    backgroundColor: '#2F2F3C'
                }}>
                    <TouchableOpacity
                        disabled={true}
                        // onPress={() => Linking.openURL('http://www.cuesapp.co')}
                        style={{ backgroundColor: '#2F2F3C' }}
                    >
                        <Image
                            source={
                                school && school.logo && school.logo !== ''
                                    ? school.logo
                                    : 'https://cues-files.s3.amazonaws.com/logo/cues-logo-white-exclamation-hidden.jpg'
                            }
                            style={{
                                width: school && school.logo && school.logo !== '' ? Dimensions.get('window').height * 0.07 : Dimensions.get('window').height * 0.07,
                                height: school && school.logo && school.logo !== '' ? Dimensions.get('window').height * 0.05 : Dimensions.get('window').height * 0.03
                            }}
                            resizeMode={'contain'}
                        />
                    </TouchableOpacity>
                    <View
                        key={JSON.stringify(props.cues)}
                        style={{
                            flex: 1, flexDirection: 'row', backgroundColor: '#2F2F3C'
                        }}>
                        {
                            props.channelId !== '' ?
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', backgroundColor: '#2F2F3C' }}>
                                    <TouchableOpacity
                                        style={{ marginRight: 15, backgroundColor: '#2F2F3C' }}
                                        onPress={() => props.openMeeting()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons
                                                name='videocam-outline' size={19} color={'#fff'} />
                                            {
                                                props.meetingOn ?
                                                    <View style={styles.badge} /> : null
                                            }
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                            Classroom
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15, backgroundColor: '#2F2F3C' }}
                                        onPress={() => props.openSubscribers()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='mail-outline' size={19} color={'#fff'} />
                                            {
                                                props.unreadMessages !== 0 ?
                                                    <View style={styles.badge} /> : null
                                            }
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                            Inbox
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: 15, backgroundColor: '#2F2F3C' }}
                                        onPress={() => props.openDiscussion()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='chatbubble-ellipses-outline' size={19} color={'#fff'} />
                                            {
                                                props.unreadDiscussionThreads !== 0 ?
                                                    <View style={styles.badge} /> : null
                                            }
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                            Discussion
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ marginRight: isOwner ? 15 : 0, backgroundColor: '#2F2F3C' }}
                                        onPress={() => props.openGrades()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons name='stats-chart-outline' size={18} color={'#fff'} />
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                            Grades
                                        </Text>
                                    </TouchableOpacity>
                                    {
                                        isOwner ?
                                            <TouchableOpacity
                                                style={{ marginRight: 0, backgroundColor: '#2F2F3C' }}
                                                onPress={() => props.openChannelSettings()}>
                                                <Text style={styles.channelText}>
                                                    <Ionicons name='settings-outline' size={18} color={'#fff'} />
                                                </Text>
                                                <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center' }}>
                                                    Settings
                                                </Text>
                                            </TouchableOpacity> : null
                                    }
                                </View> :
                                (
                                    props.filterChoice === 'All' ?
                                        <View style={{ flexDirection: 'column', flex: 1, width: '100%', justifyContent: 'center', backgroundColor: '#2f2f3c' }}>
                                            <Text style={{ fontSize: 10, color: '#a2a2ac', textAlign: 'right' }}>
                                                Select channel to view options.
                                            </Text>
                                        </View> :
                                        <View style={{ flexDirection: 'column', flex: 1, width: '100%', justifyContent: 'center', backgroundColor: '#2f2f3c' }}>
                                            <Text style={{ fontSize: 10, color: '#a2a2ac', textAlign: 'right' }}>
                                                Your personal space.
                                            </Text>
                                        </View>
                                )
                        }
                    </View>
                </View>
                {/* <View
                    key={JSON.stringify(cues) + JSON.stringify(filterChoice)}
                    style={{
                        width: '100%', height: '55%', flexDirection: 'column',
                        paddingTop: 2
                    }}>
                    <View style={{ flex: 1 }} />
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
                                style={{ color: '#a2a2ac', lineHeight: 20, fontSize: 13 }}
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
                                        style={{ color: '#a2a2ac', lineHeight: 20, fontSize: 13 }}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            })
                        }
                    </ScrollView>
                </View> */}
            </View>
        </View>
    );
}


export default React.memo(TopBar, (prev, next) => {
    return _.isEqual(prev.cues, next.cues) && _.isEqual(prev.channelFilterChoice, next.channelFilterChoice)
})

const styleObject: any = (channelId: any) => StyleSheet.create({
    topbar: {
        height: '13%',
        width: '100%',
        flexDirection: 'column',
        display: 'flex',
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        paddingTop: 25,
        maxWidth: 550,
        alignSelf: 'center',
        backgroundColor: '#2F2F3C'
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
        color: '#2F2F3C',
        fontSize: 15,
        paddingRight: 15
    },
    subOutline: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20,
        borderRadius: 10,
        borderColor: '#a2a2ac',
        borderWidth: 1
    },
    sub: {
        fontSize: 15,
        color: '#a2a2ac',
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
