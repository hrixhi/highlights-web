import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Card: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#35AC78'].reverse()
    const colorScheme = 'dark'
    const styleObject = styles(colorScheme, props.channelId, colorChoices[props.cue.color])
    const starred = props.cue.starred;
    const { title } = htmlStringParser(props.cue.channelId && props.cue.channelId !== '' ? props.cue.original : props.cue.cue)
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

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                // key={'textPage'}
                onPress={() => props.updateModal()}
                style={styleObject.card}>
                <View style={styleObject.text}>
                    <View style={styleObject.dateContainer}>
                        {/* {
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
                        } */}
                        <Text style={styleObject.date2}>
                            {
                                (new Date(props.cue.date)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.cue.date)).toString().split(' ')[2]
                            }
                        </Text>
                        {
                            props.cue.graded && showScore && !isOwner ? <Text style={{
                                fontSize: 9,
                                color: '#007AFF',
                                marginLeft: 10, textAlign: 'right'
                            }}>
                                {props.cue.score}%
                            </Text> : null
                        }
                    </View>
                    <View style={{
                        backgroundColor: '#fff',
                        width: '100%', flexDirection: 'row', flex: 1, height: '75%'
                    }}>
                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.title}>
                            {title}
                        </Text>
                        {
                            props.cue.status && (props.cue.status !== 'read' && props.cue.status !== 'submitted')
                                ?
                                <Text style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    backgroundColor: '#f94144',
                                    textAlign: 'center',
                                    zIndex: 150,
                                    marginLeft: 10,
                                    marginTop: 12,
                                    color: 'white', lineHeight: 20, fontSize: 10
                                }}>
                                    !
                                </Text>
                                : null
                        }
                        {
                            props.cue.channelId && props.cue.unreadThreads !== 0 ?
                                <Text style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    backgroundColor: '#007AFF',
                                    textAlign: 'center',
                                    zIndex: 150,
                                    marginLeft: 5,
                                    marginTop: 12,
                                    color: 'white', lineHeight: 20, fontSize: 10
                                }}>
                                    {props.cue.unreadThreads}
                                </Text> : <Text style={{ width: 25 }} />
                        }
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(Card, (prev, next) => {
    return _.isEqual({ ...prev.cue }, { ...next.cue })
})

const styles: any = (colorScheme: any, channelId: any, col: any) => StyleSheet.create({
    swiper: {
        height: '100%',
        borderRadius: 10,
        overflow: 'hidden',
        maxWidth: 175,
        width: '100%'
    },
    card: {
        maxWidth: 210,
        height: '100%',
        borderRadius: 10,
        width: '100%',
        padding: 10,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e8e8ea'
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 0,
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
        backgroundColor: '#fff'
    },
    flipText: {
        height: '100%',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#1D1D20' : 'white'
    },
    dateContainer: {
        fontSize: 10,
        color: '#fff',
        height: '25%',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '25%',
        display: 'flex',
        flexDirection: 'row',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#1D1D20' : 'white'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#fff' : '#333333',
        marginLeft: 10,
        lineHeight: 10
    },
    date2: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#fff' : '#333333',
        // marginLeft: 10,
        lineHeight: 10,
        textAlign: 'left',
        flex: 1
    },
    title: {
        fontFamily: 'inter',
        fontSize: 12,
        lineHeight: 20,
        flex: 1,
        marginTop: 5,
        color: col
    },
    titleFlip: {
        color: colorScheme === 'light' ? '#fff' : '#1D1D20',
        backgroundColor: colorScheme === 'light' ? '#1D1D20' : '#fff',
        fontFamily: 'inter',
        fontSize: 13,
        // ,
        height: '75%',
        width: '100%',
        paddingTop: 5,
    },
    description: {
        fontSize: 13,
        color: colorScheme === 'light' ? '#fff' : '#333333',
        // height: '30%'
    }
});
