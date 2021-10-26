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
                borderColor: '#efefef',
                // borderRightWidth: Dimensions.get('window').width < 1024 ? 0 : 1,
                // paddingHorizontal: Dimensions.get('window').width < 1024 ? 15 : 0,
                paddingTop: 5,
                backgroundColor: '#efefef',
                flexDirection: 'row',
                maxWidth: 900,
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
                        style={{ backgroundColor: '#efefef', width: '100%', paddingBottom: 20 }}
                    >
                        <Text style={{ lineHeight: 33, width: '100%', textAlign: 'center' }}>
                            <Ionicons name='chevron-back-outline' size={30} color={'#393939'} style={{ marginTop: -2 }} />
                        </Text>
                    </TouchableOpacity>
                </View>
                {/* {
                    selectedChannel ? <View style={styles.icons}>
                        <Text style={{
                            fontSize: 22,
                            fontFamily: 'inter',
                            lineHeight: 20,
                            color: '#16181C',
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
                }} style={{ backgroundColor: '#efefef', flexDirection: 'row', flex: 1 }} />
                <View style={styles.icons}>
                    {/* {
                        isOwner && props.channelId !== '' && (props.menuCollapsed === true) ?
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#efefef',
                                    width: Dimensions.get('window').width < 1024 ? 'auto' : '100%',
                                    paddingBottom: 20
                                }}
                                onPress={() => props.openChannelSettings()}>
                                <Text style={styles.channelText}>
                                    <Ionicons name='hammer-outline' size={18} color={'#16181C'} />
                                </Text>
                                <Text style={{ fontSize: 11, color: '#16181C', textAlign: 'center', width: '100%', }}>
                                    Settings
                                </Text>
                            </TouchableOpacity> : null
                    } */}
                </View>
                <View style={styles.icons}>
                    {/* {
                        props.channelId !== '' && (props.menuCollapsed === true) ?
                            <TouchableOpacity
                                style={{ backgroundColor: '#efefef', width: Dimensions.get('window').width < 1024 ? 'auto' : '100%', paddingBottom: 20 }}
                                onPress={() => props.openMeeting()}>
                                <Text style={styles.channelText}>
                                    <Ionicons
                                        name='chatbubbles-outline' size={18} color={'#16181C'} />
                                </Text>
                                <Text style={{ fontSize: 11, color: '#16181C', textAlign: 'center', width: Dimensions.get('window').width < 1024 ? 'auto' : '100%' }}>
                                    Classroom
                                </Text>
                            </TouchableOpacity>
                            : null
                    } */}
                </View>
                {/* <View style={styles.icons2}>
                    {
                        props.channelId !== '' && (props.menuCollapsed === true) ?
                            <TouchableOpacity style={{ backgroundColor: '#efefef', width: '100%', paddingBottom: 20 }}
                                onPress={() => props.hideMenu()}>
                                <Text style={{ lineHeight: 35, width: '100%', textAlign: 'center' }}>
                                    <Ionicons
                                        name='chevron-down-outline' size={25} color={'#006AFF'} />
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
        backgroundColor: '#efefef',
    },
    icons: {
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingRight: 25,
        overflow: 'hidden',
        backgroundColor: '#efefef'
    },
    icons2: {
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingRight: 0,
        overflow: 'hidden',
        backgroundColor: '#efefef'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        // justifyContent: 'center',
        display: 'flex',
        textAlign: 'left',
        backgroundColor: '#16181C'
    },
    colorBar: {
        width: '100%',
        height: '47%',
        paddingTop: 20,
        backgroundColor: '#16181C'
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
        borderRadius: 1,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 1,
        backgroundColor: colorScheme === 'light' ? '#16181C' : 'white',
        color: colorScheme === 'light' ? 'white' : '#16181C'
    },
    cusCategory: {
        fontSize: 14,
        color: '#393939',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 14,
        color: colorScheme === 'light' ? '#16181C' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 14,
        color: colorScheme === 'light' ? '#16181C' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 1,
        backgroundColor: colorScheme === 'light' ? '#16181C' : 'white',
    },
    text: {
        textAlign: 'right',
        color: '#16181C',
        fontSize: 14,
        paddingRight: 15
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21,
        textAlign: 'center'
    }
});
