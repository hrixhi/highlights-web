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

const VerticalBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorScheme = 'dark';
    const styles: any = styleObject(colorScheme, props.menuCollapsed ? true : false)

    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
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
        <View style={styles.bottombar}>
            <View style={{
                display: 'flex',
                flex: 1,
                paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 0,
                paddingTop: Dimensions.get('window').width < 768 ? 5 : 0,
                backgroundColor: '#F8F9FA',
                flexDirection: Dimensions.get('window').width < 768 ? 'row' : 'column'
            }}>
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
                        style={{ backgroundColor: '#F8F9FA', width: '100%', paddingBottom: 20 }}
                    >
                        <Text style={{ lineHeight: 35, marginTop: Dimensions.get('window').width < 768 ? 20 : 15, width: '100%', textAlign: 'center' }}>
                            <Ionicons name='arrow-back-outline' size={35} color={'#2f2f3c'} />
                        </Text>
                        {/* <Text style={{ fontSize: 10, color: '#fff', }}>
                            Dashboard
                        </Text> */}
                    </TouchableOpacity>
                </View>
                <View
                    style={{
                        flex: 1, backgroundColor: '#F8F9FA', width: '100%',
                        // borderWidth: 1,
                    }}>
                    {
                        props.channelId !== '' && (props.menuCollapsed === true) ?
                            <View style={{
                                flex: 1,
                                // borderWidth: 1,
                                flexDirection: Dimensions.get('window').width < 768 ? 'row' : 'column',
                                backgroundColor: '#F8F9FA', width: '100%',
                                paddingTop: Dimensions.get('window').width < 768 ? 7 : 0,
                                justifyContent: Dimensions.get('window').width < 768 ? 'space-evenly' : 'flex-start'
                            }}>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#F8F9FA', width: Dimensions.get('window').width < 768 ? 'auto' : '100%', paddingBottom: 20 }}
                                    onPress={() => props.openMeeting()}>
                                    <Text style={styles.channelText}>
                                        <Ionicons
                                            name='videocam-outline' size={19} color={'#2f2f3c'} />
                                        {
                                            props.meetingOn ?
                                                <View style={styles.badge} /> : null
                                        }
                                    </Text>
                                    <Text style={{ fontSize: 10, color: '#2f2f3c', textAlign: 'center', width: Dimensions.get('window').width < 768 ? 'auto' : '100%' }}>
                                        Classroom
                                    </Text>
                                </TouchableOpacity>
                                {/* <TouchableOpacity
                                    style={{ backgroundColor: '#2f2f3c', width: '100%', paddingBottom: 20 }}
                                    onPress={() => props.openSubscribers()}>
                                    <Text style={styles.channelText}>
                                        <Ionicons name='mail-outline' size={19} color={'#fff'} />
                                        {
                                            props.unreadMessages !== 0 ?
                                                <View style={styles.badge} /> : null
                                        }
                                    </Text>
                                    <Text style={{ fontSize: 10, color: '#fff', textAlign: 'center', width: '100%' }}>
                                        Inbox
                                    </Text>
                                </TouchableOpacity> */}
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#F8F9FA',
                                        width: Dimensions.get('window').width < 768 ? 'auto' : '100%', paddingBottom: 20
                                    }}
                                    onPress={() => props.openDiscussion()}>
                                    <Text style={styles.channelText}>
                                        <Ionicons name='chatbubble-ellipses-outline' size={19} color={'#2f2f3c'} />
                                        {
                                            props.unreadDiscussionThreads !== 0 ?
                                                <View style={styles.badge} /> : null
                                        }
                                    </Text>
                                    <Text style={{ fontSize: 10, color: '#2f2f3c', textAlign: 'center', width: '100%' }}>
                                        Discussion
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#F8F9FA', width: Dimensions.get('window').width < 768 ? 'auto' : '100%', paddingBottom: 20 }}
                                    onPress={() => props.openGrades()}>
                                    <Text style={styles.channelText}>
                                        <Ionicons name='stats-chart-outline' size={18} color={'#2f2f3c'} />
                                    </Text>
                                    <Text style={{ fontSize: 10, color: '#2f2fxc', textAlign: 'center', width: '100%', }}>
                                        Grades
                                    </Text>
                                </TouchableOpacity>
                                {
                                    isOwner ?
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#F8F9FA',
                                                width: Dimensions.get('window').width < 768 ? 'auto' : '100%',
                                                paddingBottom: 20
                                            }}
                                            onPress={() => props.openChannelSettings()}>
                                            <Text style={styles.channelText}>
                                                <Ionicons name='settings-outline' size={18} color={'#2f2f3c'} />
                                            </Text>
                                            <Text style={{ fontSize: 10, color: '#2f2f3c', textAlign: 'center', width: '100%', }}>
                                                Settings
                                            </Text>
                                        </TouchableOpacity> : null
                                }
                            </View> : null
                        // (
                        //     props.filterChoice === 'All' ?
                        //         <View style={{ flexDirection: 'column', flex: 1, width: '100%', justifyContent: 'center', backgroundColor: '#2f2f3c' }}>
                        //             <Text style={{ fontSize: 10, color: '#818385', textAlign: 'center' }}>
                        //                 Select channel to view options.
                        //             </Text>
                        //         </View> :
                        //         <View style={{ flexDirection: 'column', flex: 1, width: '100%', justifyContent: 'center', backgroundColor: '#2f2f3c' }}>
                        //             <Text style={{ fontSize: 10, color: '#818385', textAlign: 'center' }}>
                        //                 Your personal space.
                        //             </Text>
                        //         </View>
                        // )
                    }
                </View>
                {/* <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCreate()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 35, marginTop: 15 }}>
                            <Ionicons name='add-circle' size={35} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 10, color: '#fff', marginTop: -3 }}>
                            New
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCalendar()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 35, marginTop: 15 }}>
                            <Ionicons name='calendar-outline' size={30} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 10, color: '#fff' }}>
                            Planner
                        </Text>
                    </TouchableOpacity>
                </View> */}
            </View>
            {
                Dimensions.get('window').width < 768 && (props.menuCollapsed === false) ? null :
                    <TouchableOpacity
                        onPress={() => props.hideMenu()}
                        style={{
                            width: Dimensions.get('window').width < 768 ? '100%' : 30,
                            height: Dimensions.get('window').width < 768 ? 30 : '100%',
                            backgroundColor: '#fff',
                            justifyContent: 'center',
                            borderColor: '#F8F9FA',
                            // borderBottomWidth: Dimensions.get('window').width < 768 ? 2 : 0,
                            // borderRightWidth: Dimensions.get('window').width < 768 ? 0 : 2,
                        }}>
                        <Text style={{ textAlign: 'center' }}>
                            <Ionicons
                                name={Dimensions.get('window').width < 768 ? 'chevron-down-circle-outline' : 'chevron-forward-circle-outline'}
                                color="#2f2f3c"
                                size={20}
                                style={{}}
                            />
                        </Text>
                    </TouchableOpacity>
            }
        </View>
    );
}

export default VerticalBar

const styleObject: any = (colorScheme: any, mc: any) => StyleSheet.create({
    bottombar: {
        height: Dimensions.get('window').width < 768 ? (mc ? 90 : 55) : '100%',
        width: Dimensions.get('window').width < 768 ? '100%' : 110,
        // display: 'flex',
        //  paddingBottom: 10,
        // borderTopWidth: 1,
        // borderColor: '#555555',
        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
        // flex: 1,
        backgroundColor: '#fff'
    },
    icons: {
        // width: '100%',
        // display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#F8F9FA'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        // justifyContent: 'center',
        display: 'flex',
        textAlign: 'left',
        backgroundColor: '#2f2f3c'
    },
    colorBar: {
        width: '100%',
        height: '47%',
        paddingTop: 20,
        backgroundColor: '#2f2f3c'
    },
    iconContainer: {
        width: '100%',
        // textAlign: 'right',
    },
    badge: {
        position: 'absolute',
        alignSelf: 'center',
        width: 10,
        height: 10,
        marginLeft: 4,
        marginBottom: 10,
        marginTop: -4,
        borderRadius: 10,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#2f2f3c' : 'white',
        color: colorScheme === 'light' ? 'white' : '#2f2f3c'
    },
    cusCategory: {
        fontSize: 15,
        color: '#818385',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#2f2f3c' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#2f2f3c' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#2f2f3c' : 'white',
    },
    text: {
        textAlign: 'right',
        color: '#2f2f3c',
        fontSize: 15,
        paddingRight: 15
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21,
        textAlign: 'center'
    }
});
