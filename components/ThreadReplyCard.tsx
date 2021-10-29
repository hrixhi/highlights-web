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
    const [color, setColor] = useState('#1F1F1F');

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
                setColor('#006AFF')
            } else if (unparsedUser._id.toString().trim() === props.thread.userId.toString().trim()) {
                setColor('#1F1F1F')
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
                        {props.thread.anonymous ? 'Anonymous' : props.thread.fullName}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', backgroundColor: '#efefef' }}>
                    <View style={{ flex: 1, backgroundColor: '#efefef' }}>
                        {
                            imported ?
                                <a download={true} href={url} style={{ textDecoration: 'none' }}>
                                    <View style={{ backgroundColor: '#efefef', flex: 1 }}>
                                        <Text style={{ width: '100%', color: '#1F1F1F', fontSize: 14, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                            <Ionicons name='document-outline' size={15} color='#1F1F1F' /> {title}.{type}
                                        </Text>
                                    </View>
                                </a>
                                : <div dangerouslySetInnerHTML={{ __html: props.thread.message }} style={{ fontFamily: 'overpass', color: '#000000', fontSize: 14 }} />
                        }
                    </View>
                    {
                        props.isOwner ?
                            <TouchableOpacity style={{ backgroundColor: '#efefef' }}
                                onPress={() => props.deleteThread()}
                            >
                                <Text style={{ width: '100%', color: '#1F1F1F', fontSize: 14, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    <Ionicons name='trash-outline' size={15} color={props.index === 0 ? '#f94144' : '#1F1F1F'} />
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
        backgroundColor: '#efefef'
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        fontWeight: 'bold',
        backgroundColor: '#efefef',
    },
    dateContainer: {
        fontSize: 10,
        color: '#1F1F1F',
        backgroundColor: '#efefef',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 10
    },
    date: {
        fontSize: 10,
        color: '#1F1F1F',
        marginLeft: 5
    }
});
