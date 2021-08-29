import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const ActivityCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles()

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
                        <Text style={{
                            fontSize: 11,
                            color: '#2f2f3c',
                            marginRight: 5,
                            flex: 1,
                            textAlign: 'left'
                        }}>
                            <View style={{
                                width: 9,
                                height: 9,
                                borderRadius: 10,
                                marginRight: 5,
                                // marginTop: 1,
                                backgroundColor: props.activity.colorCode
                            }} />
                            {props.activity.channelName}
                        </Text>
                        <Text style={styleObject.date}>
                            {
                                (new Date(props.activity.date)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.activity.date)).toString().split(' ')[2]
                            }
                        </Text>

                    </View> <View style={{ backgroundColor: '#F8F9FA', width: '100%', flexDirection: 'row', display: 'flex' }}>
                        <Text ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.title}>
                            {props.activity.title}
                        </Text>
                        {
                            props.activity.status === 'unread' ?
                                <Text style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: '#d91d56',
                                    textAlign: 'center',
                                    zIndex: 150,
                                    marginLeft: 10,
                                    marginTop: 7,
                                    color: 'white', lineHeight: 20, fontSize: 10
                                }}>
                                    !
                                </Text> : null
                        }
                        <Text ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.titleArrow}>
                            <Ionicons name="chevron-forward-outline" color="#818385" size={20} style={{ marginTop: 4 }} />
                        </Text>
                    </View>
                    <Text ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={styleObject.description}>
                        {props.activity.subtitle}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default ActivityCard

const styles: any = () => StyleSheet.create({
    swiper: {
        height: '100%',
        width: '100%',
        maxWidth: 500,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#F8F9FA'
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 150,
        marginLeft: 10
    },
    card: {
        height: '100%',
        width: '100%',
        borderRadius: 15,
        padding: 13,
        backgroundColor: '#F8F9FA',
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    dateContainer: {
        fontSize: 10,
        height: '22%',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        flexDirection: 'row'
    },
    date: {
        fontSize: 10,
        color: '#818385',
        // marginLeft: 5
    },
    title: {
        fontFamily: 'inter',
        fontSize: 13,
        paddingTop: 7,
        color: '#2f2f3c',
        flex: 1
    },
    titleArrow: {
        fontFamily: 'inter',
        fontSize: 13,
        lineHeight: 20,
        paddingTop: 5,
        color: '#2f2f3c',
        marginLeft: 10
    },
    description: {
        fontSize: 13,
        color: '#818385',
        // height: '30%',
    },
    color: {
        width: 10,
        height: 10,
        borderRadius: 10,
        marginTop: 1
    }
});
