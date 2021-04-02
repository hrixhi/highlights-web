import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';

const ThreadReplyCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles()
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
            setImported(false)
            setUrl('')
            setTitle('')
            setType('')
        }
    }, [props.thread.message])

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
                        fontSize: 10,
                        color: '#a6a2a2',
                        marginRight: 5,
                        flex: 1,
                        textAlign: 'right'
                    }}>
                        {props.thread.anonymous ? 'Anonymous' : props.thread.displayName}
                    </Text>
                </View>
                {
                    imported ?
                        <a download={true} href={url} style={{ textDecoration: 'none' }}>
                            <View style={{ backgroundColor: '#f4f4f4', flex: 1 }}>
                                <Text style={{ width: '100%', color: '#a6a2a2', fontSize: 18, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                    <Ionicons name='document-outline' size={18} color='#a6a2a2' /> {title}.{type}
                                </Text>
                            </View>
                        </a>
                        : <div dangerouslySetInnerHTML={{ __html: props.thread.message }} style={{ fontFamily: 'overpass', color: '#101010', fontSize: 14 }} />

                }
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
        borderRadius: 20,
        padding: 13,
        paddingBottom: 20,
        backgroundColor: '#F4F4F4'
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#F4F4F4',
    },
    dateContainer: {
        fontSize: 10,
        color: '#a6a2a2',
        backgroundColor: '#F4F4F4',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 10
    },
    date: {
        fontSize: 10,
        color: '#a6a2a2',
        marginLeft: 5
    }
});
