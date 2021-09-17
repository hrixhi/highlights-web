import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from "@react-native-async-storage/async-storage";

const OverviewCueCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#35AC78'].reverse()
    const colorScheme = 'dark'
    const styleObject = styles(colorScheme, props.channelId, colorChoices[props.cue.color])
    const starred = props.cue.starred;
    const { title, subtitle } = htmlStringParser(props.cue.channelId && props.cue.channelId !== '' ? props.cue.original : props.cue.cue)
    const [showScore, setShowScore] = useState(false);
    const [colorCode, setColorCode] = useState('#1D1D20');
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u && props.cue.createdBy) {
                    const parsedUser = JSON.parse(u)
                    if (parsedUser._id.toString().trim() === props.cue.createdBy.toString().trim()) {
                        setIsOwner(true)
                    }
                }
            }
        )()
    }, [props.cue])

    useEffect(() => {
        if (props.cue && props.cue.original) {

            // Hide scores if it's a quiz and !releaseSubmission
            if (props.cue.graded && !props.cue.releaseSubmission) {
                setShowScore(false)
            } else {
                setShowScore(true);
            }
        }

        // Set color code
        const matchSubscription = props.subscriptions.find((sub: any) => {
            return sub.channelName === props.cue.channelName
        })

        if (matchSubscription && matchSubscription !== undefined) {
            setColorCode(matchSubscription.colorCode)
        }
    }, [props.cue])

    const checked = props.cueIds.find((id: any) => {
        return id.toString().trim() === props.cue._id.toString().trim()
    })

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                key={'textPage'}
                onPress={() => {
                    if (props.editFolderChannelId === props.cue.channelId) {
                        if (checked) {
                            props.remove()
                        } else {
                            props.add()
                        }
                    } else {
                        props.updateModal()
                    }
                }}
                onLongPress={() => props.onLongPress()}
                style={styleObject.card}>
                <View style={styleObject.text}>
                    <View style={styleObject.dateContainer}>
                        {/* <View style={{
                            width: 9,
                            height: 9,
                            borderRadius: 0,
                            // marginTop: 1,
                            backgroundColor: colorCode
                        }} /> */}

                        <Text style={styleObject.date}>
                            {props.cue.customCategory ? props.cue.customCategory : ''}
                        </Text>
                        {/* {
                            props.cue.channelName ?
                                <Text style={styleObject.date}>
                                    {props.cue.channelName}
                                </Text> : null
                        } */}
                        {/* <Text style={styleObject.date}>
                            {props.cue.customCategory}
                        </Text> */}
                        {/* {
                            props.cue.submission ? <Text style={styleObject.date}>
                                <Ionicons name='share-outline' size={9} color={props.cue.submittedAt && props.cue.submittedAt !== '' ? ('#007AFF') : (colorScheme === 'light' ? '#fff' : '#333333')} style={{ marginRight: 10 }} />
                            </Text> : null
                        }
                        {
                            props.cue.frequency !== '0' ?
                                <Text style={styleObject.date}>
                                    <Ionicons name='notifications-outline' size={9} color={colorScheme === 'light' ? '#fff' : '#333333'} />
                                </Text> : null
                        } */}
                        {
                            props.cue.graded && showScore && !isOwner ? <Text style={{
                                fontSize: 9,
                                color: '#007AFF',
                                marginLeft: 10
                            }}>
                                {props.cue.score}%
                            </Text> : null
                        }
                        {
                            props.cue.starred ?
                                <Text style={{
                                    textAlign: 'right',
                                    lineHeight: 30,
                                    marginTop: -20,
                                    paddingRight: 30,
                                    position: 'absolute',
                                    width: '97%',
                                    zIndex: 20
                                }}>
                                    <Ionicons name='bookmark' size={18} color={starred ? '#f94144' : '#fff'} />
                                </Text>
                                : null
                        }
                        <Text style={styleObject.date2}>
                            {
                                (new Date(props.cue.date)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.cue.date)).toString().split(' ')[2]
                            }
                        </Text>
                    </View>
                    <View style={{
                        backgroundColor: '#f8f8fa',
                        width: '100%', flex: 1, height: '80%'
                    }}>
                        <View
                            style={{ flexDirection: 'row', height: '13%', backgroundColor: '#f8f8fa', justifyContent: 'flex-end' }}
                        >
                            {
                                props.editFolderChannelId === props.cue.channelId ?
                                    <input
                                        disabled={true}
                                        style={{ paddingRight: 20 }}
                                        type='checkbox'
                                        checked={checked ? true : false}
                                        value={checked ? "true" : "false"}
                                    /> : null
                            }
                            {
                                props.cue.status && (props.cue.status !== 'read' && props.cue.status !== 'submitted')
                                    ?
                                    <Text style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 0,
                                        overflow: 'hidden',
                                        backgroundColor: '#f94144',
                                        textAlign: 'center',
                                        zIndex: 150,
                                        // marginLeft: 10,
                                        // marginTop: 12,
                                        color: 'white', lineHeight: 20, fontSize: 10
                                    }}>
                                        !
                                    </Text>
                                    : <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 0,
                                            overflow: 'hidden',
                                            backgroundColor: '#f8f8fa',
                                            zIndex: 150
                                        }}
                                    />
                            }
                            {
                                props.cue.channelId && props.cue.unreadThreads !== 0 ?
                                    <Text style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 0,
                                        overflow: 'hidden',
                                        backgroundColor: '#007AFF',
                                        textAlign: 'center',
                                        zIndex: 150,
                                        marginLeft: 10,
                                        // marginLeft: 5,
                                        // marginTop: 12,
                                        color: 'white', lineHeight: 20, fontSize: 10
                                    }}>
                                        {props.cue.unreadThreads}
                                    </Text> : null
                            }
                        </View>
                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={2}
                            style={styleObject.title}>
                            {title}
                        </Text>
                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={2}
                            style={styleObject.description}>
                            {subtitle}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(OverviewCueCard, (prev, next) => {
    return _.isEqual({ ...prev.cue }, { ...next.cue })
})

const styles: any = (colorScheme: any, channelId: any, col: any) => StyleSheet.create({
    swiper: {
        height: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        maxWidth: 300,
        width: '100%',
        maxHeight: 150
    },
    card: {
        maxWidth: 150,
        height: '100%',
        width: '100%',
        borderRadius: 15,
        padding: 12,
        paddingHorizontal: 15,
        backgroundColor: '#f8f8fa',
        borderWidth: 1,
        borderColor: '#f0f0f2',
        maxHeight: 150
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 15,
        padding: 13,
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#1D1D20' : 'white'
    },
    descriptionFlip: {
        color: '#fff',
        fontSize: 13,
        // height: '25%',
    },
    text: {
        height: '100%',
        backgroundColor: '#f8f8fa'
    },
    flipText: {
        height: '100%',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#1D1D20' : '#f8f8fa'
    },
    dateContainer: {
        fontSize: 10,
        color: '#fff',
        height: '20%',
        backgroundColor: '#f8f8fa',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '25%',
        display: 'flex',
        flexDirection: 'row',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#1D1D20' : '#f8f8fa'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#f8f8fa' : '#333333',
        // marginLeft: 10,
        lineHeight: 10
    },
    date2: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#f8f8fa' : '#333333',
        marginLeft: 10,
        lineHeight: 10,
        textAlign: 'right',
        flex: 1
    },
    title: {
        fontFamily: 'inter',
        fontSize: 15,
        lineHeight: 20,
        // flex: 1,
        height: '41%',
        marginTop: 8,
        color: col
    },
    titleFlip: {
        color: colorScheme === 'light' ? '#1D1D20' : '#1D1D20',
        backgroundColor: colorScheme === 'light' ? '#f8f8fa' : '#f8f8fa',
        fontFamily: 'inter',
        fontSize: 13,
        // ,
        height: '75%',
        width: '100%',
        paddingTop: 5,
    },
    description: {
        fontSize: 13,
        color: '#818385',
        // height: '30%'
        height: '27%',
    }
});
