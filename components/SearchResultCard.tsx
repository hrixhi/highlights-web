// REACT
import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash';
import moment from 'moment';
import Alert from './Alert';
import { Avatar } from 'stream-chat-react';

// COMPONENTS
import { Text, View, TouchableOpacity } from '../components/Themed';
import { disableEmailId } from '../constants/zoomCredentials';
import Highlighter from 'react-highlight-words';

const SearchResultCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const colorScheme = 'dark';
    const styleObject = styles(colorScheme, props.colorCode || 'black', props.option);

    /**
     * @description Formats time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

    return (
        <TouchableOpacity
            key={'textPage'}
            onPress={() => {
                props.onPress();
            }}
            style={styleObject.swiper}
        >
            <View style={styleObject.text}>
                <View style={styleObject.dateContainer}>
                    {props.option === 'Content' || props.option === 'Discussion' ? (
                        <View
                            style={{
                                backgroundColor: props.colorCode || 'black',
                                width: 8,
                                height: 8,
                                borderRadius: 12,
                                marginRight: 7,
                            }}
                        />
                    ) : null}
                    {props.channelName !== '' && props.option !== 'Courses' ? (
                        <Text style={styleObject.date}>{props.channelName}</Text>
                    ) : props.option === 'Messages' ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* {props.messageSenderAvatar ? (
                                <Image
                                    source={{
                                        uri: props.messageSenderAvatar,
                                    }}
                                    style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: 24,
                                        marginRight: 10,
                                    }}
                                    // resizeMode="contain"
                                />
                            ) : null} */}
                            <Avatar
                                name={props.messageSenderName}
                                image={props.messageSenderAvatar}
                                size={24}
                                // id={props.messageSenderName}
                                // online={props.messageSenderOnline}
                            />
                            <Text style={styleObject.date}>
                                {props.messageSenderName +
                                    (props.messageSenderChannel ? ' in ' + props.messageSenderChannel : '')}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styleObject.date}> </Text>
                    )}
                </View>
                <View
                    style={{
                        backgroundColor: '#fff',
                        width: '100%',
                        flexDirection: 'row',
                        flex: 1,
                        // height: '70%',
                    }}
                >
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        {/* <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={{
                                fontFamily: 'inter',
                                fontSize: 15,
                                lineHeight: 20,
                                flex: 1,
                                marginTop: props.option === 'Messages' ? 6 : 10,
                                color: '#000000',
                            }}
                        >
                            {props.title}
                        </Text> */}
                        <View
                            style={{
                                flex: 1,
                                marginTop: props.option === 'Messages' ? 6 : 10,
                            }}
                        >
                            <Text numberOfLines={1} ellipsizeMode="tail">
                                <Highlighter
                                    searchWords={[props.searchTerm]}
                                    autoEscape={true}
                                    textToHighlight={props.title}
                                    highlightStyle={{
                                        backgroundColor: '#ffd54f',
                                        fontFamily: 'inter',
                                        fontSize: 15,
                                        // lineHeight: 20,
                                        color: '#000000',
                                    }}
                                    unhighlightStyle={{
                                        fontFamily: 'inter',
                                        fontSize: 15,
                                        // lineHeight: 20,
                                        color: '#000000',
                                    }}
                                    className="highlighter"
                                />
                            </Text>
                        </View>

                        {props.option === 'Content' || props.option === 'Messages' || props.option === 'Discussion' ? (
                            <Text
                                style={{
                                    fontSize: 13,
                                    padding: 5,
                                    lineHeight: 13,
                                }}
                                ellipsizeMode="tail"
                            >
                                {emailTimeDisplay(props.createdAt)}
                            </Text>
                        ) : null}
                        {props.option === 'Courses' && !props.subscribed ? (
                            <View style={{ paddingLeft: 10, paddingRight: 10 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert('Subscribe to ' + props.channelName + '?', '', [
                                            {
                                                text: 'Cancel',
                                                style: 'cancel',
                                                onPress: () => {
                                                    return;
                                                },
                                            },
                                            {
                                                text: 'Yes',
                                                onPress: () => props.handleSub(),
                                            },
                                        ]);
                                    }}
                                    style={{ marginTop: 1 }}
                                    disabled={props.user.email === disableEmailId}
                                >
                                    <Text style={{}}>
                                        <Ionicons name="enter-outline" size={24} color="#000" />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default SearchResultCard;

const styles: any = (colorScheme: any, col: any, option: any) =>
    StyleSheet.create({
        swiper: {
            height: 75,
            maxWidth: '100%',
            backgroundColor: '#fff',
            flexDirection: 'column',

            zIndex: 500000,
            borderBottomColor: '#efefef',
            borderBottomWidth: 1,
            paddingVertical: option === 'Messages' ? 2 : 5,
        },
        text: {
            height: '100%',
            width: '100%',
            paddingVertical: 7,
            // paddingHorizontal: 10,
            backgroundColor: '#fff',
        },
        dateContainer: {
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
        },
        date: {
            fontSize: 13,
            color: '#1F1F1F',
            textAlign: 'left',
            flex: 1,
        },
        title: {
            fontFamily: 'overpass',
            fontSize: 15,
            lineHeight: 20,
            flex: 1,
            marginTop: 5,
            color: '#000000',
        },
    });
