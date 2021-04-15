import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, StyleSheet, TextInput, ScrollView } from 'react-native';
import Alert from './Alert'
import { Text, View, TouchableOpacity } from './Themed';
import { fetchAPI } from '../graphql/FetchAPI';
import { createDate, deleteDate, getEvents } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import Datetime from 'react-datetime';
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { htmlStringParser } from '../helpers/HTMLParser';
import { Ionicons } from '@expo/vector-icons';

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
    const [end, setEnd] = useState(new Date())

    const onDateClick = useCallback((title, date, dateId) => {
        Alert(
            'Delete ' + title + '?',
            date,
            [
                {
                    text: "Cancel", style: "cancel"
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
                    end: end.toUTCString()
                }
            }).then(res => {
                loadEvents()
                setTitle('')
            }).catch(err => console.log(err))
        }
    }, [title, start, end])

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
    }, [])

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;
    return (
        <Animated.View style={{
            opacity: modalAnimation,
            width: '100%',
            height: windowHeight,
            backgroundColor: 'white',
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                <Text
                    ellipsizeMode="tail"
                    style={{ color: '#a2a2a2', fontSize: 17, flex: 1, lineHeight: 25, paddingHorizontal: 20, }}>
                    Calendar
                                </Text>
            </View>
            <ScrollView style={{
                width: '100%',
                height: windowHeight,
                backgroundColor: 'white',
                borderTopRightRadius: 30,
                borderTopLeftRadius: 30
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
                            <ActivityIndicator color={'#a2a2a2'} />
                        </View>
                        :
                        <View style={{
                            backgroundColor: 'white',
                            width: '100%',
                            height: '100%',
                            paddingHorizontal: 20,
                            borderTopRightRadius: 30,
                            borderTopLeftRadius: 30
                        }}>
                            <View style={{
                                flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                marginBottom: 40
                            }}>
                                <View style={{ width: Dimensions.get('window').width < 768 ? '100%' : '30%' }}>
                                    <TextInput
                                        value={title}
                                        style={styles.input}
                                        placeholder={'Event'}
                                        onChangeText={val => setTitle(val)}
                                        placeholderTextColor={'#a2a2a2'}
                                    />
                                </View>
                                <View style={{
                                    width: Dimensions.get('window').width < 768 ? '100%' : '30%',
                                    flexDirection: 'row',
                                    marginTop: 12,
                                    marginLeft: Dimensions.get('window').width < 768 ? 0 : 10
                                }}>
                                    <Text style={styles.text}>
                                        Start
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
                                        End
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
                                    >
                                        <Ionicons name='add-outline' size={21} color='#202020' />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Calendar
                                onSelectEvent={(e: any) => {
                                    console.log(e.dateId)
                                    if (e.dateId !== 'channel') {
                                        onDateClick(e.title, e.start.toString() + ' to ' + e.end.toString(), e.dateId)
                                    } else {
                                        Alert(e.title, e.start.toString() + ' to ' + e.end.toString())
                                    }
                                }}
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 500, fontFamily: 'roboto', color: '#202020' }}
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
        borderBottomColor: '#f6f6f6',
        borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20
    },
    text: {
        fontSize: 12,
        color: '#a2a2a2',
        textAlign: 'left',
        paddingHorizontal: 10
    }
})