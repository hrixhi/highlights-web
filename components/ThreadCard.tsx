import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const ThreadCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loading, setLoading] = useState(true)
    const [color, setColor] = useState('#50566B');
    const [subtitle, setSubtitle] = useState('')

    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [type, setType] = useState('')


    useEffect(() => {
        if (props.thread.message[0] === '{' && props.thread.message[props.thread.message.length - 1] === '}') {
            const obj = JSON.parse(props.thread.message)
            setImported(true)
            setUrl(obj.url)
            setTitle(obj.title)
            setType(obj.type)
        } else {
            const { title: t, subtitle: s } = htmlStringParser(props.thread.message)
            setTitle(t)
            setSubtitle(s)
            setImported(false)
            setUrl('')
            setType('')
        }
    }, [props.thread.message])

    const loadColor = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const unparsedUser = JSON.parse(u)
            if (props.channelCreatedBy.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#5469D4')
            } else if (unparsedUser._id.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#50566B')
            }
        }
        setLoading(false)
    }, [props.thread, props.channelCreatedBy])

    useEffect(() => {
        loadColor()
    }, [])

    if (loading) {
        return null
    }

    const styleObject = styles(color)

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                onPress={() => props.onPress()}
                key={'textPage'}
                style={styleObject.card}>
                <View style={styleObject.text}>
                    <View style={styleObject.dateContainer}>
                        <Text style={styleObject.date}>
                            {
                                (new Date(props.thread.time)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.thread.time)).toString().split(' ')[2]
                            }
                        </Text>
                        {
                            props.thread.isPrivate ?
                                <Text style={styleObject.date}>
                                    <Ionicons name='eye-off-outline' color={'#50566B'} />
                                </Text> : null
                        }
                        <Text style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color,
                            marginRight: 5,
                            flex: 1,
                            textAlign: 'right'
                        }}>
                            {props.thread.anonymous ? 'Anonymous' : props.thread.fullName}
                        </Text>
                    </View>
                    {
                        imported ?
                            <View style={{ backgroundColor: '#f7fafc', flex: 1, flexDirection: 'row', paddingTop: 6 }}>
                                <Text style={{ width: '100%', color: '#50566B', fontSize: 14, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    <Ionicons name='document-outline' size={15} color='#50566B' /> {title}.{type}
                                </Text>
                                <Text ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={styleObject.titleArrow}>
                                    <Ionicons name="chevron-forward-outline" color="#50566B" size={15} style={{ marginTop: 4 }} />
                                </Text>
                            </View>
                            : <View style={{ backgroundColor: '#f7fafc', width: '100%', flexDirection: 'row', display: 'flex' }}>
                                <Text ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={styleObject.title}>
                                    {title}
                                </Text>
                                {
                                    props.thread.unreadThreads !== 0 ?
                                        <Text style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 1,
                                            backgroundColor: '#5469D4',
                                            textAlign: 'center',
                                            zIndex: 150,
                                            marginLeft: 10,
                                            marginTop: 7,
                                            color: 'white', lineHeight: 20, fontSize: 10
                                        }}>
                                            {props.thread.unreadThreads}
                                        </Text> : null
                                }
                                <Text ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={styleObject.titleArrow}>
                                    <Ionicons name="chevron-forward-outline" color="#50566B" size={15} style={{ marginTop: 4 }} />
                                </Text>
                            </View>
                    }
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(ThreadCard, (prev, next) => {
    return _.isEqual({ ...prev.thread }, { ...next.thread })
})

const styles: any = () => StyleSheet.create({
    swiper: {
        height: '100%',
        width: '100%',
        maxWidth: 500,
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: 'white'
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: 1,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 150,
        marginLeft: 10
    },
    card: {
        height: '100%',
        width: '100%',
        borderRadius: 1,
        padding: 13,
        backgroundColor: '#f7fafc',
        borderWidth: 1,
        borderColor: '#d0d0d2'
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#f7fafc'
    },
    dateContainer: {
        fontSize: 10,
        height: '22%',
        backgroundColor: '#f7fafc',
        display: 'flex',
        flexDirection: 'row'
    },
    date: {
        fontSize: 10,
        color: '#50566B',
        marginLeft: 5
    },
    title: {
        fontFamily: 'inter',
        fontSize: 13,
        paddingTop: 5,
        color: '#1A2036',
        flex: 1
    },
    titleArrow: {
        fontFamily: 'inter',
        fontSize: 13,
        lineHeight: 20,
        paddingTop: 5,
        color: '#1A2036',
        marginLeft: 10
    },
    description: {
        fontSize: 13,
        color: '#50566B',
        // height: '30%',
    },
    color: {
        width: 10,
        height: 10,
        borderRadius: 1,
        marginTop: 1
    }
});
