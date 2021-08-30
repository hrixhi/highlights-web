import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
// import HTMLView from 'react-native-htmlview';

const MessageCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles()

    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [type, setType] = useState('')

    useEffect(() => {
        if (props.message.message[0] === '{' && props.message.message[props.message.message.length - 1] === '}') {
            const obj = JSON.parse(props.message.message)
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
    }, [props.message.message])

    return (
        <View
            key={'textPage'}
            style={styleObject.card}>
            <View style={styleObject.text}>
                <View style={styleObject.dateContainer}>
                    <Text style={styleObject.date}>
                        {
                            (new Date(props.message.sentAt)).toString().split(' ')[1] +
                            ' ' +
                            (new Date(props.message.sentAt)).toString().split(' ')[2]
                        }
                    </Text>
                    <Text style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: props.user.displayName === props.message.displayName ? '#333333' : '#818385',
                        marginRight: 5,
                        flex: 1,
                        textAlign: 'right'
                    }}>
                        {props.message.fullName}
                    </Text>
                </View>
                {
                    imported ?
                        <a download={true} href={url} style={{ textDecoration: 'none' }}>
                            <View style={{ backgroundColor: '#F8F9FA', flex: 1 }}>
                                <Text style={{ width: '100%', color: '#818385', fontSize: 15, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    <Ionicons name='document-outline' size={17} color='#818385' /> {title}.{type}
                                </Text>
                            </View>
                        </a>
                        : <div dangerouslySetInnerHTML={{ __html: props.message.message }} style={{ fontFamily: 'overpass', color: '#2f2f3c', fontSize: 14 }} />

                }
            </View>
        </View>
    );
}

export default React.memo(MessageCard, (prev, next) => {
    return _.isEqual({ ...prev.thread }, { ...next.thread })
})

const styles: any = () => StyleSheet.create({
    card: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 15,
        padding: 13,
        paddingBottom: 20,
        backgroundColor: '#F8F9FA'
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        fontWeight: 'bold',
        backgroundColor: '#F8F9FA',
    },
    dateContainer: {
        fontSize: 10,
        color: '#818385',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 10
    },
    date: {
        fontSize: 10,
        color: '#818385',
        marginLeft: 5
    }
});
