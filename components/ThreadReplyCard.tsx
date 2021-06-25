import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThreadReplyCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles()
    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [type, setType] = useState('')
    const [color, setColor] = useState('#a2a2aa');

    useEffect(() => {
        if (props.thread.message[0] === '{' && props.thread.message[props.thread.message.length - 1] === '}') {
            const obj = JSON.parse(props.thread.message)
            setImported(true)
            setUrl(obj.url)
            setTitle(obj.title)
            setType(obj.type)
        } else {
            setImported(false)
            setUrl('')
            setTitle('')
            setType('')
        }
    }, [props.thread.message])

    const loadColor = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const unparsedUser = JSON.parse(u)
            if (props.channelCreatedBy.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#3B64F8')
            } else if (unparsedUser._id.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#a2a2aa')
            }
        }
    }, [props.thread, props.channelCreatedBy])

    useEffect(() => {
        loadColor()
    }, [])

    return (
        <View
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
                    <Text style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color,
                        marginRight: 5,
                        flex: 1,
                        textAlign: 'right'
                    }}>
                        {props.thread.anonymous ? 'Anonymous' : props.thread.displayName}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', backgroundColor: '#f4f4f6' }}>
                    <View style={{ flex: 1, backgroundColor: '#f4f4f6' }}>
                        {
                            imported ?
                                <a download={true} href={url} style={{ textDecoration: 'none' }}>
                                    <View style={{ backgroundColor: '#f4f4f6', flex: 1 }}>
                                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 15, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                            <Ionicons name='document-outline' size={17} color='#a2a2aa' /> {title}.{type}
                                        </Text>
                                    </View>
                                </a>
                                : <div dangerouslySetInnerHTML={{ __html: props.thread.message }} style={{ fontFamily: 'overpass', color: '#202025', fontSize: 14 }} />
                        }
                    </View>
                    {
                        props.isOwner ?
                            <TouchableOpacity style={{ backgroundColor: '#f4f4f6' }}
                                onPress={() => props.deleteThread()}
                            >
                                <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 15, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    <Ionicons name='trash-outline' size={17} color={props.index === 0 ? '#d91d56' : '#a2a2aa'} />
                                </Text>
                            </TouchableOpacity> : null
                    }
                </View>
            </View>
        </View>
    );
}

export default React.memo(ThreadReplyCard, (prev, next) => {
    return _.isEqual({ ...prev.thread }, { ...next.thread })
})

const styles: any = () => StyleSheet.create({
    card: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 15,
        padding: 13,
        paddingBottom: 20,
        backgroundColor: '#f4f4f6'
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        fontWeight: 'bold',
        backgroundColor: '#f4f4f6',
    },
    dateContainer: {
        fontSize: 10,
        color: '#a2a2aa',
        backgroundColor: '#f4f4f6',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 10
    },
    date: {
        fontSize: 10,
        color: '#a2a2aa',
        marginLeft: 5
    }
});
