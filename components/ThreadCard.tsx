import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const ThreadCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loading, setLoading] = useState(true)
    const [color, setColor] = useState('#a6a2a2');
    const { title, subtitle } = htmlStringParser(props.thread.message)
    const loadColor = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const unparsedUser = JSON.parse(u)
            if (props.channelCreatedBy.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#0079f3')
            } else if (unparsedUser._id.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#333333')
            }
        }
        setLoading(false)
    }, [props.thread, props.channelOwner])

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
                                    <Ionicons name='eye-off-outline' color={'#a6a2a2'} />
                                </Text> : null
                        }
                        <Text style={{
                            fontSize: 10,
                            color,
                            marginRight: 5,
                            flex: 1,
                            textAlign: 'right'
                        }}>
                            {props.thread.anonymous ? 'Anonymous' : props.thread.displayName}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: '#f4f4f4', width: '100%', flexDirection: 'row', display: 'flex', height: '44%' }}>
                        <Text ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.title}>
                            {title}
                        </Text>
                        <Text ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.titleArrow}>
                            <Ionicons name="chevron-forward-outline" color="#a6a2a2" size={20} style={{ marginTop: 4 }} />
                        </Text>
                    </View>
                    <Text ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={styleObject.description}>
                        {subtitle}
                    </Text>
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
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'white'
    },
    card: {
        height: '100%',
        width: '100%',
        borderRadius: 20,
        padding: 13,
        backgroundColor: '#f4f4f4',
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#f4f4f4'
    },
    dateContainer: {
        fontSize: 10,
        height: '22%',
        backgroundColor: '#f4f4f4',
        display: 'flex',
        flexDirection: 'row'
    },
    date: {
        fontSize: 10,
        color: '#a6a2a2',
        marginLeft: 5
    },
    title: {
        fontFamily: 'inter',
        fontSize: 14,
        fontWeight: 'bold',
        paddingTop: 5,
        color: '#101010',
        flex: 1
    },
    titleArrow: {
        fontFamily: 'inter',
        fontSize: 14,
        fontWeight: 'bold',
        paddingTop: 5,
        color: '#101010',
        marginLeft: 10
    },
    description: {
        fontSize: 13,
        color: '#a6a2a2',
        height: '30%',
    },
    color: {
        width: 10,
        height: 10,
        borderRadius: 10,
        marginTop: 1
    }
});
