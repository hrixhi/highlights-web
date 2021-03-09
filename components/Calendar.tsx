import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions } from 'react-native';
import Alert from './Alert'
import { Text, View } from './Themed';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getChannelThreads, getEvents } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { htmlStringParser } from '../helpers/HTMLParser';

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

    const loadEvents = useCallback(async () => {

        const u = await AsyncStorage.getItem('user')
        let parsedUser: any = {}
        if (u) {
            parsedUser = JSON.parse(u)
        }

        setLoading(true)
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('')
            server.query({
                query: getEvents,
                variables: {
                    channelId: props.channelId
                }
            })
                .then(res => {
                    if (res.data.channel && res.data.channel.getCalendar) {
                        const parsedEvents: any[] = []
                        res.data.channel.getCalendar.map((event: any) => {
                            const { title } = htmlStringParser(event.title)
                            parsedEvents.push({
                                title,
                                start: new Date(event.start),
                                end: new Date(event.end)
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
        } else {
            setLoading(false)
            modalAnimation.setValue(0)
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, [props.channelId, modalAnimation])

    useEffect(() => {
        loadEvents()
    }, [props.channelId])

    const windowHeight = Dimensions.get('window').height - 30;
    return (
        <ScrollView style={{
            width: '100%',
            height: windowHeight - 30,
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
            <Animated.View style={{
                opacity: modalAnimation,
                width: '100%',
                height: windowHeight,
                backgroundColor: 'white',
                borderTopRightRadius: 30,
                borderTopLeftRadius: 30
            }}>
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
                            <ActivityIndicator color={'#a6a2a2'} />
                        </View>
                        :
                        <View style={{
                            backgroundColor: 'white',
                            width: '100%',
                            height: windowHeight,
                            paddingHorizontal: 20,
                            borderTopRightRadius: 30,
                            borderTopLeftRadius: 30
                        }}>
                            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                            </Text>
                            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                                <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a6a2a2', fontSize: 18, flex: 1, lineHeight: 25 }}>
                                    Calendar
                                </Text>
                            </View>
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 650, fontFamily: 'roboto', color: '#101010' }}
                            />
                        </View>
                }
            </Animated.View>
        </ScrollView>
    );
}

export default CalendarX