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
                borderColor: '#e1e9f0',
                borderRightWidth: Dimensions.get('window').width < 768 ? 0 : 1,
                // paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 0,
                paddingTop: Dimensions.get('window').width < 768 ? 5 : 0,
                backgroundColor: '#FBFBFC',
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
                        style={{ backgroundColor: '#FBFBFC', width: '100%', paddingBottom: 20 }}
                    >
                        <Text style={{ lineHeight: 35, width: '100%', textAlign: 'center' }}>
                            <Ionicons name='arrow-back-outline' size={30} color={'#43434f'} />
                        </Text>
                        {/* <Text style={{ fontSize: 10, color: '#fff', }}>
                            Dashboard
                        </Text> */}
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    {
                        props.channelId !== '' && (props.menuCollapsed === true) ?
                            <TouchableOpacity
                                style={{ backgroundColor: '#FBFBFC', width: Dimensions.get('window').width < 768 ? 'auto' : '100%', paddingBottom: 20 }}
                                onPress={() => props.openMeeting()}>
                                <Text style={styles.channelText}>
                                    <Ionicons
                                        name='chatbubbles-outline' size={19} color={'#43434f'} />
                                </Text>
                                <Text style={{ fontSize: 10, color: '#43434f', textAlign: 'center', width: Dimensions.get('window').width < 768 ? 'auto' : '100%' }}>
                                    Classroom
                                </Text>
                            </TouchableOpacity>
                            : null
                    }
                </View>
                <View style={styles.icons}>
                    {
                        isOwner && props.channelId !== '' && (props.menuCollapsed === true) ?
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#FBFBFC',
                                    width: Dimensions.get('window').width < 768 ? 'auto' : '100%',
                                    paddingBottom: 20
                                }}
                                onPress={() => props.openChannelSettings()}>
                                <Text style={styles.channelText}>
                                    <Ionicons name='hammer-outline' size={19} color={'#43434f'} />
                                </Text>
                                <Text style={{ fontSize: 10, color: '#43434f', textAlign: 'center', width: '100%', }}>
                                    Settings
                                </Text>
                            </TouchableOpacity> : null
                    }
                </View>
                <View style={styles.icons}>
                    {
                        (props.menuCollapsed === true) ?
                            <TouchableOpacity
                                style={{ backgroundColor: '#FBFBFC', width: Dimensions.get('window').width < 768 ? 'auto' : '100%', paddingBottom: 20 }}
                                onPress={() => props.hideMenu()}>
                                <Text style={styles.channelText}>
                                    <Ionicons
                                        name='expand-outline' size={19} color={'#43434f'} />
                                </Text>
                                <Text style={{ fontSize: 10, color: '#43434f', textAlign: 'center', width: Dimensions.get('window').width < 768 ? 'auto' : '100%' }}>
                                    Expand
                                </Text>
                            </TouchableOpacity> : null
                    }
                </View>
            </View>
        </View>
    );
}

export default VerticalBar

const styleObject: any = (colorScheme: any, mc: any) => StyleSheet.create({
    bottombar: {
        height: Dimensions.get('window').width < 768 ? (mc ? 59 : 59) : '100%',
        width: Dimensions.get('window').width < 768 ? '100%' : 110,
        paddingRight: Dimensions.get('window').width < 768 ? 0 : 25,
        // display: 'flex',
        //  paddingBottom: 10,
        // borderWidth: 1,
        // borderColor: '#606060',
        // marginTop: 8,
        paddingTop: 10,
        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
        // flex: 1,
        backgroundColor: '#ffffff'
    },
    icons: {
        width: Dimensions.get('window').width < 768 ? '25%' : '100%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: '#FBFBFC'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        // justifyContent: 'center',
        display: 'flex',
        textAlign: 'left',
        backgroundColor: '#43434f'
    },
    colorBar: {
        width: '100%',
        height: '47%',
        paddingTop: 20,
        backgroundColor: '#43434f'
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
        borderRadius: 12,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 12,
        backgroundColor: colorScheme === 'light' ? '#43434f' : 'white',
        color: colorScheme === 'light' ? 'white' : '#43434f'
    },
    cusCategory: {
        fontSize: 15,
        color: '#818385',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#43434f' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#43434f' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: colorScheme === 'light' ? '#43434f' : 'white',
    },
    text: {
        textAlign: 'right',
        color: '#43434f',
        fontSize: 15,
        paddingRight: 15
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21,
        textAlign: 'center'
    }
});
