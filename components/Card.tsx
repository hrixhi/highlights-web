// REACT
import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import _ from 'lodash';
import AsyncStorage from '@react-native-async-storage/async-storage';

// COMPONENTS
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';

const Card: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#35AC78'].reverse();
    const colorScheme = 'dark';
    const styleObject = styles(colorScheme, props.channelId, colorChoices[props.cue.color]);
    const { title } = htmlStringParser(
        props.cue.channelId && props.cue.channelId !== '' ? props.cue.original : props.cue.cue
    );
    const [showScore, setShowScore] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    // HOOKS

    /**
     * @description Check if user is Owner
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u && props.cue.createdBy) {
                const parsedUser = JSON.parse(u);
                if (parsedUser._id.toString().trim() === props.cue.createdBy.toString().trim()) {
                    setIsOwner(true);
                }
            }
        })();
    }, [props.cue]);

    /**
     * @description Checks if score should be displayed for Cue
     */
    useEffect(() => {
        if (props.cue && props.cue.original) {
            // Hide scores if it's a quiz and !releaseSubmission
            if (props.cue.graded && !props.cue.releaseSubmission) {
                setShowScore(false);
            } else {
                setShowScore(true);
            }
        }
    }, [props.cue]);

    // MAIN RETURN
    return (
        <TouchableOpacity
            onPress={() => props.updateModal()}
            style={{
                height: '100%',
                backgroundColor: '#f8f8f8',
                borderRadius: 1,
                maxWidth: 145,
                width: 145,
                borderLeftColor: colorChoices[props.cue.color],
                borderLeftWidth: 2,
                flexDirection: 'row',
                paddingVertical: 7,
                paddingHorizontal: 10,
            }}
        >
            <View
                style={{
                    backgroundColor: '#f8f8f8',
                    width: '100%',
                    flexDirection: 'column',
                }}
            >
                <View
                    style={{
                        backgroundColor: '#f8f8f8',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    {/* <Ionicons name={getContentIcon(props.cue)} size={10} color="#000" /> */}
                    {/* {
                            props.cue.starred ?
                                <Text style={{
                                    textAlign: 'right',
                                    lineHeight: 34,
                                    marginTop: -20,
                                    paddingRight: 30,
                                    position: 'absolute',
                                    width: '97%',
                                    zIndex: 20
                                }}>
                                    <Ionicons name='bookmark' size={19} color={starred ? '#f94144' : '#fff'} />
                                </Text>
                                : null
                        } */}
                    <Text style={styleObject.date2}>
                        {new Date(props.cue.date).toString().split(' ')[1] +
                            ' ' +
                            new Date(props.cue.date).toString().split(' ')[2]}
                    </Text>
                    {/* {props.cue.status && props.cue.status !== 'read' && props.cue.status !== 'submitted' ? (
                            <Ionicons name="alert-circle-outline" size={14} color="#f94144" />
                        ) : null} */}
                    {props.cue.graded && showScore && !isOwner ? (
                        <Text
                            style={{
                                fontSize: 11,
                                color: '#007AFF',
                                // marginLeft: 5,
                                textAlign: 'right',
                                marginLeft: 'auto',
                            }}
                        >
                            {props.cue.score}%
                        </Text>
                    ) : null}
                </View>
                <View
                    style={{
                        backgroundColor: '#f8f8f8',
                        flexDirection: 'row',
                    }}
                >
                    <Text ellipsizeMode={'tail'} numberOfLines={1} style={styleObject.title}>
                        {title}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default React.memo(Card, (prev, next) => {
    return _.isEqual({ ...prev.cue }, { ...next.cue });
});

const styles: any = (colorScheme: any, channelId: any, col: any) =>
    StyleSheet.create({
        swiper: {
            height: '100%',
            backgroundColor: '#f8f8f8',
            // borderWidth: 1,
            // borderColor: '#e8e8e8',
            borderRadius: 1,
            maxWidth: 145,
            width: 145,
            borderLeftColor: col,
            borderLeftWidth: 3,
            flexDirection: 'row',
            // shadowOffset: {
            //     width: 2,
            //     height: 2
            // },
            // overflow: 'hidden',
            // shadowOpacity: 0.07,
            // shadowRadius: 7,
            zIndex: 500000,
        },
        card: {
            height: '100%',
            // borderTop
            width: '100%',
            padding: 7,
            paddingHorizontal: 10,
            backgroundColor: '#f8f8f8',
        },
        flipCard: {
            height: '100%',
            width: '100%',
            borderRadius: 1,
            padding: 13,
            color: '#fff',
            backgroundColor: colorScheme === 'light' ? '#000000' : 'white',
        },
        descriptionFlip: {
            color: '#fff',
            fontSize: 14,
        },
        text: {
            height: '100%',
            backgroundColor: '#f8f8f8',
        },
        flipText: {
            height: '100%',
            color: '#fff',
            backgroundColor: colorScheme === 'light' ? '#000000' : 'white',
        },
        dateContainer: {
            fontSize: 11,
            color: '#fff',
            // height: '30%',
            backgroundColor: '#f8f8f8',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
        },
        flipDateContainer: {
            fontSize: 11,
            height: '70%',
            display: 'flex',
            flexDirection: 'row',
            color: '#fff',
            backgroundColor: colorScheme === 'light' ? '#000000' : 'white',
        },
        date: {
            fontSize: 9,
            color: colorScheme === 'light' ? '#fff' : '#1F1F1F',
            marginLeft: 10,
            lineHeight: 10,
        },
        date2: {
            fontSize: 11,
            color: colorScheme === 'light' ? '#fff' : '#1F1F1F',
            lineHeight: 12,
            textAlign: 'left',
            paddingVertical: 2,
            flex: 1,
        },
        title: {
            fontFamily: 'inter',
            fontSize: 13,
            lineHeight: 20,
            flex: 1,
            marginTop: 5,
            color: '#000000',
            backgroundColor: '#f8f8f8',
            maxWidth: '100%',
        },
        titleFlip: {
            color: colorScheme === 'light' ? '#fff' : '#000000',
            backgroundColor: colorScheme === 'light' ? '#000000' : '#fff',
            fontFamily: 'inter',
            fontSize: 14,
            // ,
            height: '75%',
            width: '100%',
            paddingTop: 5,
        },
        description: {
            fontSize: 14,
            color: colorScheme === 'light' ? '#fff' : '#333333',
        },
    });
