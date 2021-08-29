import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
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

    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (parsedUser.email) {
                setLoggedIn(true)
            }
            else {
                setLoggedIn(false)
            }
        }
        setUserLoaded(true)
    }, [])

    useEffect(() => {
        getUser()
    }, [])

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

    return (
        <View style={styles.bottombar}>
            <View style={{ display: 'flex', flexDirection: 'row', paddingHorizontal: 30, backgroundColor: '#F8F9FA' }}>
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
                        <Text style={{ textAlign: 'left', lineHeight: 35, marginTop: 15 }}>
                            <Ionicons name='arrow-back-outline' size={40} color={'#2f2f3c'} />
                        </Text>
                        {/* <Text style={{ fontSize: 10, color: '#fff', }}>
                            Dashboard
                        </Text> */}
                    </TouchableOpacity>
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
        </View>
    );
}

export default BottomBar

const styleObject: any = (colorScheme: any) => StyleSheet.create({
    bottombar: {
        height: '8%',
        width: '100%',
        display: 'flex',
        paddingBottom: 10,
        // borderTopWidth: 1,
        // borderColor: '#555555',
        backgroundColor: '#F8F9FA'
    },
    icons: {
        width: '100%',
        display: 'flex',
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
        backgroundColor: '#F8F9FA'
    },
    colorBar: {
        width: '100%',
        height: '47%',
        paddingTop: 20,
        backgroundColor: '#F8F9FA'
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
        borderRadius: 10,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#F8F9FA' : 'white',
        color: colorScheme === 'light' ? '#2f2f3c' : '#2f2f3c'
    },
    cusCategory: {
        fontSize: 15,
        color: '#818385',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#F8F9FA' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#F8F9FA' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#F8F9FA' : 'white',
    }
});
