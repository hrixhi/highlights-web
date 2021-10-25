import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, Dimensions, Linking } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import { getOrganisation } from '../graphql/QueriesAndMutations';

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
                    }
                }
            }
        )()

    }, [props.channelCreatedBy])



    return (
        <View style={styles.topbar} key={Math.random()}>
            <View style={{ width: '100%', height: Dimensions.get('window').height * 0.15, backgroundColor: '#E7EBEE' }}>
                <View style={{
                    // height: '45%',
                    flexDirection: 'row',
                    display: 'flex',
                    paddingHorizontal: 20,
                    // paddingTop: 10,
                    backgroundColor: '#E7EBEE'
                }}>
                    {/* <TouchableOpacity
                        disabled={true}
                        // onPress={() => Linking.openURL('http://www.cuesapp.co')}
                        style={{ backgroundColor: '#16181C' }}
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
                    </TouchableOpacity> */}
                    <View
                        key={JSON.stringify(props.cues)}
                        style={{
                            flex: 1, flexDirection: 'row', backgroundColor: '#E7EBEE'
                        }}>
                        {
                            props.channelId !== '' ?
                                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-evenly', backgroundColor: '#E7EBEE' }}>
                                    <TouchableOpacity
                                        style={{ marginRight: 15, backgroundColor: '#E7EBEE' }}
                                        onPress={() => props.openMeeting()}>
                                        <Text style={styles.channelText}>
                                            <Ionicons
                                                name='chatbubbles-outline' size={18} color={'#16181C'} />
                                            {/* {
                                                props.meetingOn ?
                                                    <View style={styles.badge} /> : null
                                            } */}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#16181C', textAlign: 'center' }}>
                                            Classroom
                                        </Text>
                                    </TouchableOpacity>
                                    {
                                        isOwner ?
                                            <TouchableOpacity
                                                style={{ marginRight: 0, backgroundColor: '#E7EBEE' }}
                                                onPress={() => props.openChannelSettings()}>
                                                <Text style={styles.channelText}>
                                                    <Ionicons name='hammer-outline' size={18} color={'#16181C'} />
                                                </Text>
                                                <Text style={{ fontSize: 10, color: '#16181C', textAlign: 'center' }}>
                                                    Settings
                                                </Text>
                                            </TouchableOpacity> : null
                                    }
                                </View> : null
                        }
                    </View>
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
        height: channelId ? '10%' : '0%',
        width: '100%',
        flexDirection: 'column',
        display: 'flex',
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        paddingTop: 15,
        maxWidth: 550,
        alignSelf: 'center',
        backgroundColor: '#E7EBEE'
    },
    badge: {
        position: 'absolute',
        alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginRight: -2,
        marginTop: 0,
        borderRadius: 15,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 50
    },
    text: {
        textAlign: 'right',
        color: '#16181C',
        fontSize: 14,
        paddingRight: 15
    },
    subOutline: {
        fontSize: 14,
        color: '#343A40',
        height: 22,
        paddingHorizontal: 10,
        lineHeight: 20,
        borderRadius: 1,
        borderColor: '#343A40',
        borderWidth: 1
    },
    sub: {
        fontSize: 14,
        color: '#343A40',
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
