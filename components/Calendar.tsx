import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { TextInput } from './CustomTextInput';
import Alert from './Alert'
import { Text, View, TouchableOpacity } from './Themed';
import { fetchAPI } from '../graphql/FetchAPI';
import { createDate, deleteDate, getChannels, getEvents } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import Datetime from 'react-datetime';
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { htmlStringParser } from '../helpers/HTMLParser';
import { Ionicons } from '@expo/vector-icons';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const localizer = momentLocalizer(moment)

const CalendarX: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(1))
    const [loading, setLoading] = useState(true)
    const [events, setEvents] = useState<any[]>([
        {
            title: '',
            start: new Date(),
            end: new Date(),
        }
    ])

    const [title, setTitle] = useState('')
    const [start, setStart] = useState(new Date())
    const [end, setEnd] = useState(new Date(start.getTime() + 1000 * 60 * 60))
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [channels, setChannels] = useState<any[]>([])
    const [channelId, setChannelId] = useState('')

    const loadChannels = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user')
        if (uString) {
            const user = JSON.parse(uString)
            const server = fetchAPI('')
            server.query({
                query: getChannels,
                variables: {
                    userId: user._id
                }
            })
                .then(res => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId)
                    }
                })
                .catch(err => {
                })
        }
    }, [])

    useEffect(() => {
        if (title !== "" && end > start) {
            setIsSubmitDisabled(false);
            return;
        }
        setIsSubmitDisabled(true);
    }, [title, start, end])

    const onDateClick = useCallback((title, date, dateId) => {
        Alert(
            'Delete ' + title + '?',
            date,
            [
                {
                    text: "Cancel", style: "cancel", onPress: () => {
                        return;
                    }
                },
                {
                    text: "Delete", onPress: async () => {
                        const server = fetchAPI('')
                        server.mutate({
                            mutation: deleteDate,
                            variables: {
                                dateId
                            }
                        }).then(res => {
                            if (res.data && res.data.date.delete) {
                                Alert("Event Deleted!")
                                loadEvents()
                            }
                        })
                    }
                }
            ]
        );

    }, [])

    const handleCreate = useCallback(async () => {

        if (start < new Date()) {
            Alert('Event must be set in the future.')
            return;
        }

        const u = await AsyncStorage.getItem('user')
        if (u) {
            const user = JSON.parse(u)
            const server = fetchAPI('')
            server.mutate({
                mutation: createDate,
                variables: {
                    title,
                    userId: user._id,
                    start: start.toUTCString(),
                    end: end.toUTCString(),
                    channelId
                }
            }).then(res => {
                loadEvents()
                setTitle('')
            }).catch(err => console.log(err))
        }
    }, [title, start, end, channelId])

    const loadEvents = useCallback(async () => {

        const u = await AsyncStorage.getItem('user')
        let parsedUser: any = {}
        if (u) {
            parsedUser = JSON.parse(u)
        } else {
            return;
        }

        setLoading(true)
        const server = fetchAPI('')
        server.query({
            query: getEvents,
            variables: {
                userId: parsedUser._id
            }
        })
            .then(res => {
                if (res.data.date && res.data.date.getCalendar) {
                    const parsedEvents: any[] = []
                    res.data.date.getCalendar.map((e: any) => {
                        const { title } = htmlStringParser(e.title)
                        parsedEvents.push({
                            title: e.channelName ? (e.channelName + ' - ' + title) : title,
                            start: new Date(e.start),
                            end: new Date(e.end),
                            dateId: e.dateId
                        })
                    })
                    setEvents(parsedEvents)
                }
                setLoading(false)
                modalAnimation.setValue(0)
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            })
            .catch((err) => {
                console.log(err)
                Alert("Unable to load calendar.", "Check connection.")
                setLoading(false)
                modalAnimation.setValue(0)
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            })

    }, [, modalAnimation])

    useEffect(() => {
        loadEvents()
        loadChannels()
    }, [])

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;
    return (
        <Animated.View style={{
            opacity: modalAnimation,
            width: '100%',
            height: windowHeight,
            backgroundColor: 'white',
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                <Text
                    ellipsizeMode="tail"
                    style={{ color: '#a2a2aa', fontSize: 16, flex: 1, lineHeight: 25, paddingHorizontal: 20, }}>
                    {PreferredLanguageText('planner')}
                </Text>
            </View>
            <ScrollView style={{
                width: '100%',
                height: windowHeight,
                backgroundColor: 'white',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0
            }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                scrollEventThrottle={1}
                keyboardDismissMode={'on-drag'}
                overScrollMode={'never'}
                nestedScrollEnabled={true}
            >
                {
                    loading
                        ? <View style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white'
                        }}>
                            <ActivityIndicator color={'#a2a2aa'} />
                        </View>
                        :
                        <View style={{
                            backgroundColor: 'white',
                            width: '100%',
                            height: '100%',
                            paddingHorizontal: 20,
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0
                        }}>
                            <View style={{
                                flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                            }}>
                                <View style={{ width: Dimensions.get('window').width < 768 ? '100%' : '30%' }}>
                                    <TextInput
                                        value={title}
                                        placeholder={PreferredLanguageText('event')}
                                        onChangeText={val => setTitle(val)}
                                        placeholderTextColor={'#a2a2aa'}
                                        required={true}
                                    />
                                </View>
                                <View style={{
                                    width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                    flexDirection: 'row',
                                    marginTop: 12,
                                    marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                                }}>
                                    <Text style={styles.text}>
                                        {PreferredLanguageText('start')}
                                    </Text>
                                    <Datetime
                                        value={start}
                                        onChange={(event: any) => {
                                            const date = new Date(event)
                                            setStart(date)
                                        }}
                                    />
                                </View>
                                <View style={{
                                    width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                    flexDirection: 'row',
                                    marginTop: 12,
                                    marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                                }}>
                                    <Text style={styles.text}>
                                        {PreferredLanguageText('end')}
                                    </Text>
                                    <Datetime
                                        value={end}
                                        onChange={(event: any) => {
                                            const date = new Date(event)
                                            setEnd(date)
                                        }}
                                    />
                                </View>
                                <View style={{
                                    width: Dimensions.get('window').width < 768 ? '100%' : '10%',
                                    flexDirection: 'row',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}>
                                    <TouchableOpacity
                                        style={{
                                            marginTop: 9
                                        }}
                                        onPress={() => handleCreate()}
                                        disabled={isSubmitDisabled}
                                    >
                                        <Ionicons name='add-outline' size={21} color='#202025' />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{ marginBottom: 40 }}>
                                <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 12, color: '#a2a2aa' }}>
                                        {PreferredLanguageText('channel')}
                                        {/* <Ionicons
                                                name='school-outline' size={20} color={'#a2a2aa'} /> */}
                                    </Text>
                                </View>
                                <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                    <View style={{ width: '85%', backgroundColor: 'white', display: 'flex' }}>
                                        <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                            <TouchableOpacity
                                                style={channelId === '' ? styles.allOutline : styles.allBlack}
                                                onPress={() => {
                                                    setChannelId('')
                                                }}>
                                                <Text style={{ lineHeight: 20, fontSize: 12, color: channelId === '' ? '#fff' : '#202025' }}>
                                                    {PreferredLanguageText('myCues')}
                                                </Text>
                                            </TouchableOpacity>
                                            {
                                                channels.map((channel) => {
                                                    return <TouchableOpacity
                                                        key={Math.random()}
                                                        style={channelId === channel._id ? styles.allOutline : styles.allBlack}
                                                        onPress={() => {
                                                            setChannelId(channel._id)
                                                        }}>
                                                        <Text style={{ lineHeight: 20, fontSize: 12, color: channelId === channel._id ? '#fff' : '#202025' }}>
                                                            {channel.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                })
                                            }
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>
                            <Calendar
                                onSelectEvent={(e: any) => {
                                    console.log(e.dateId)
                                    if (e.dateId !== 'channel') {
                                        onDateClick(e.title, moment(new Date(e.start)).format('MMMM Do YYYY, h:mm a') + ' to ' + moment(new Date(e.end)).format('MMMM Do YYYY, h:mm a'), e.dateId)
                                    } else {
                                        Alert(e.title, moment(new Date(e.start)).format('MMMM Do YYYY, h:mm a') + ' to ' + moment(new Date(e.end)).format('MMMM Do YYYY, h:mm a'))
                                    }
                                }}
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 500, fontFamily: 'overpass', color: '#202025' }}
                            />
                        </View>
                }
            </ScrollView>
        </Animated.View >
    );
}

export default CalendarX

const styles: any = StyleSheet.create({
    input: {
        width: '100%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20
    },
    text: {
        fontSize: 12,
        color: '#a2a2aa',
        textAlign: 'left',
        paddingHorizontal: 10
    },
    allBlack: {
        fontSize: 12,
        color: '#202025',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 12,
        color: '#FFF',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#202025'
    }
})