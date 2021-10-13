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

    const selectedChannel = props.subscriptions.find((sub: any) => {
        return sub.channelId.toString().trim() === props.channelId.toString().trim()
    })

    return (
        <View style={styles.bottombar}>
            <View style={{
                display: 'flex',
                width: '100%',
                borderColor: '#E3E8EE',
                // borderRightWidth: Dimensions.get('window').width < 1024 ? 0 : 1,
                // paddingHorizontal: Dimensions.get('window').width < 1024 ? 15 : 0,
                paddingTop: 5,
                backgroundColor: '#f7fafc',
                flexDirection: 'row',
                maxWidth: 1000,
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
                        style={{ backgroundColor: '#f7fafc', width: '100%', paddingBottom: 20 }}
                    >
                        <Text style={{ lineHeight: 33, width: '100%', textAlign: 'center' }}>
                            <Ionicons name='arrow-back-outline' size={25} color={'#50566B'} style={{ marginTop: -2 }} />
                        </Text>
                    </TouchableOpacity>
                </View>
                {/* {
                    selectedChannel ? <View style={styles.icons}>
                        <Text style={{
                            fontSize: 22,
                            fontFamily: 'inter',
                            lineHeight: 20,
                            color: '#1A2036',
                            // marginTop: 1,
                        }}>
                            <View style={{
                                width: 18,
                                height: 18,
                                borderRadius: 9,
                                marginRight: 10,
                                marginTop: 7,
                                backgroundColor: selectedChannel.colorCode
                            }} /> {selectedChannel.channelName}
                        </Text>
                    </View> : null
                } */}
                <TouchableOpacity onPress={() => {
                    props.hideMenu()
                }} style={{ backgroundColor: '#f7fafc', flexDirection: 'row', flex: 1 }} />
                <View style={styles.icons}>
                    {/* {
                        isOwner && props.channelId !== '' && (props.menuCollapsed === true) ?
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#f7fafc',
                                    width: Dimensions.get('window').width < 1024 ? 'auto' : '100%',
                                    paddingBottom: 20
                                }}
                                onPress={() => props.openChannelSettings()}>
                                <Text style={styles.channelText}>
                                    <Ionicons name='hammer-outline' size={19} color={'#1A2036'} />
                                </Text>
                                <Text style={{ fontSize: 11, color: '#1A2036', textAlign: 'center', width: '100%', }}>
                                    Settings
                                </Text>
                            </TouchableOpacity> : null
                    } */}
                </View>
                <View style={styles.icons}>
                    {/* {
                        props.channelId !== '' && (props.menuCollapsed === true) ?
                            <TouchableOpacity
                                style={{ backgroundColor: '#f7fafc', width: Dimensions.get('window').width < 1024 ? 'auto' : '100%', paddingBottom: 20 }}
                                onPress={() => props.openMeeting()}>
                                <Text style={styles.channelText}>
                                    <Ionicons
                                        name='chatbubbles-outline' size={19} color={'#1A2036'} />
                                </Text>
                                <Text style={{ fontSize: 11, color: '#1A2036', textAlign: 'center', width: Dimensions.get('window').width < 1024 ? 'auto' : '100%' }}>
                                    Classroom
                                </Text>
                            </TouchableOpacity>
                            : null
                    } */}
                </View>
                {/* <View style={styles.icons2}>
                    {
                        props.channelId !== '' && (props.menuCollapsed === true) ?
                            <TouchableOpacity style={{ backgroundColor: '#f7fafc', width: '100%', paddingBottom: 20 }}
                                onPress={() => props.hideMenu()}>
                                <Text style={{ lineHeight: 35, width: '100%', textAlign: 'center' }}>
                                    <Ionicons
                                        name='chevron-down-outline' size={25} color={'#5469D4'} />
                                </Text>
                            </TouchableOpacity> : null
                    }
                </View> */}
            </View>
        </View>
    );
}

export default VerticalBar

const styleObject: any = (colorScheme: any, mc: any) => StyleSheet.create({
    bottombar: {
        height: 60,
        width: '100%',
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 40,
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#f7fafc',
    },
    icons: {
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingRight: 25,
        overflow: 'hidden',
        backgroundColor: '#f7fafc'
    },
    icons2: {
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingRight: 0,
        overflow: 'hidden',
        backgroundColor: '#f7fafc'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        // justifyContent: 'center',
        display: 'flex',
        textAlign: 'left',
        backgroundColor: '#1A2036'
    },
    colorBar: {
        width: '100%',
        height: '47%',
        paddingTop: 20,
        backgroundColor: '#1A2036'
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
        borderRadius: 0,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 0,
        backgroundColor: colorScheme === 'light' ? '#1A2036' : 'white',
        color: colorScheme === 'light' ? 'white' : '#1A2036'
    },
    cusCategory: {
        fontSize: 14,
        color: '#50566B',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 14,
        color: colorScheme === 'light' ? '#1A2036' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 14,
        color: colorScheme === 'light' ? '#1A2036' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 0,
        backgroundColor: colorScheme === 'light' ? '#1A2036' : 'white',
    },
    text: {
        textAlign: 'right',
        color: '#1A2036',
        fontSize: 14,
        paddingRight: 15
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21,
        textAlign: 'center'
    }
});
