import React, { useCallback, useState, useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, TouchableOpacity } from '../components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateRangePicker } from 'rsuite';
import Alert from '../components/Alert'
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

const BottomBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = 'dark';
    const styles: any = styleObject(colorScheme)
    const [loggedIn, setLoggedIn] = useState(true)
    const [userLoaded, setUserLoaded] = useState(false)

    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [channelCategories, setChannelCategories] = useState([])
    const [filterChoice] = useState(props.channelFilterChoice)
    const current = new Date()
    const [deadline, setDeadline] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 24))
    const [initialDate, setInitialDate] = useState<Date>(new Date(current.getTime()))

    // const [filterChoice] = useState(props.channelFilterChoice)
    // const [meetingOn, setMeetingOn] = useState(false)
    const [isOwner, setIsOwner] = useState(false)

    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (props.channelId !== '') {
                if (parsedUser._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                    setIsOwner(true)
                }
            }
            if (parsedUser.email) {
                setLoggedIn(true)
            }
            else {
                setLoggedIn(false)
            }
        }
        setUserLoaded(true)
    }, [props.channelId, props.channelCreatedBy])

    useEffect(() => {
        getUser()
    }, [props.channelId, props.channelCreatedBy])

    useEffect(() => {
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
    }, [cues])

    let activeColor;

    if (choice === "All") {
        activeColor = "";
    } else if (choice === "MyCues") {
        activeColor = "#000";
    } else {
        const activeChannel = props.subscriptions.filter((subscription: any) => {
            return subscription.channelName === choice;
        })

        activeColor = activeChannel[0].colorCode;
    }

    const selectedChannel = props.subscriptions.find((sub: any) => {
        return sub.channelId.toString().trim() === props.channelId.toString().trim()
    })

    return (
        <View style={styles.bottombar}>
            <View style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#f8f8fa' }}>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => {
                            props.showHome()
                            props.handleFilterChange('All')
                            props.setChannelFilterChoice('All')
                            props.setChannelId('')
                            props.setChannelCreatedBy('')
                            props.closeModal()
                        }}
                        style={styles.center}
                    >
                        <Text style={styles.channelText}>
                            <Ionicons name='arrow-back-outline' size={30} color={'#1D1D20'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                {
                    selectedChannel && Dimensions.get('window').width >= 1024 ? <TouchableOpacity
                        onPress={() => props.showMenu()}
                        style={{ backgroundColor: '#f8f8fa', flexDirection: 'row', flex: 1 }}>
                        <View style={styles.icons}>
                            <Text style={{
                                fontSize: 23,
                                fontFamily: 'inter',
                                lineHeight: 35,
                                color: '#1D1D20',
                                marginTop: 12,
                            }}>
                                <View style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 9,
                                    marginRight: 10,
                                    marginTop: 10,
                                    backgroundColor: selectedChannel.colorCode
                                }} /> {selectedChannel.channelName}
                            </Text>
                        </View>
                    </TouchableOpacity> :
                        <View style={{ backgroundColor: '#f8f8fa', flexDirection: 'row', flex: 1 }} />
                }
                {
                    isOwner ?
                        <View style={styles.icons}>
                            <TouchableOpacity
                                style={styles.center}
                                onPress={() => props.openChannelSettings()}>
                                <Text style={styles.channelText}>
                                    <Ionicons name='hammer-outline' size={19} color={'#1D1D20'} />
                                </Text>
                                <Text style={{ fontSize: 10, color: '#1D1D20', textAlign: 'center' }}>
                                    Settings
                                </Text>
                            </TouchableOpacity>
                        </View>
                        : <View style={styles.icons} />}
                {
                    props.channelId && props.channelId !== '' ?
                        <View style={styles.icons}>
                            <TouchableOpacity
                                style={styles.center}
                                onPress={() => props.openMeeting()}>
                                <Text style={styles.channelText}>
                                    <Ionicons
                                        name='chatbubbles-outline' size={19} color={'#1D1D20'} />
                                </Text>
                                <Text style={{ fontSize: 10, color: '#1D1D20', textAlign: 'center' }}>
                                    Classroom
                                </Text>
                            </TouchableOpacity>
                        </View> : <View style={styles.icons} />
                }
                <View style={styles.icons2}>
                    <TouchableOpacity
                        style={styles.center}
                        onPress={() => props.hideMenu()}>
                        <Text style={styles.channelText}>
                            <Ionicons
                                name='chevron-up-outline' size={27} color={'#007AFF'} />
                        </Text>
                        {/* <Text style={{ fontSize: 10, color: '#1D1D20', textAlign: 'center' }}>
                            Hide
                        </Text> */}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default BottomBar

const styleObject: any = (colorScheme: any) => StyleSheet.create({
    bottombar: {
        height: 59,
        width: '100%',
        display: 'flex',
        paddingBottom: 10,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 40,
        backgroundColor: '#f8f8fa'
    },
    icons: {
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingRight: 25,
        overflow: 'hidden',
        backgroundColor: '#f8f8fa'
    },
    icons2: {
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingRight: 0,
        overflow: 'hidden',
        backgroundColor: '#f8f8fa'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        display: 'flex',
        textAlign: 'center',
        backgroundColor: '#f8f8fa'
    },
    colorBar: {
        width: '100%',
        height: '47%',
        paddingTop: 20,
        backgroundColor: '#f8f8fa'
    },
    iconContainer: {
        width: '20%',
        textAlign: 'right',
    },
    badge: {
        position: 'absolute',
        alignSelf: 'center',
        width: 10,
        height: 10,
        marginLeft: 8,
        marginBottom: 10,
        marginTop: -8,
        borderRadius: 0,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 0,
        backgroundColor: colorScheme === 'light' ? '#f8f8fa' : 'white',
        color: colorScheme === 'light' ? '#1D1D20' : '#1D1D20'
    },
    cusCategory: {
        fontSize: 15,
        color: '#818385',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#f8f8fa' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#f8f8fa' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 0,
        backgroundColor: colorScheme === 'light' ? '#f8f8fa' : 'white',
    },
    channelText: {
        textAlign: 'center',
        marginTop: 15
    }
});
