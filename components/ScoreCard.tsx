import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const ScoreCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles()

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                onPress={() => props.onPress(props.score.channelName, props.score.channelId, props.score.channelCreatedBy)}
                key={'textPage'}
                style={styleObject.card}>
                <View style={styleObject.text}>
                    <View style={styleObject.dateContainer}>
                        {/* <Text style={styleObject.date}>
                            {
                                (new Date(props.score.date)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.score.date)).toString().split(' ')[2]
                            }
                        </Text> */}
                        {/* <Text style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: '#1A2036',
                            marginRight: 5,
                            flex: 1,
                            textAlign: 'right'
                        }}>
                           
                        </Text> */}
                    </View> <View style={{ backgroundColor: '#f7fafc', width: '100%', flexDirection: 'row', display: 'flex' }}>
                        <Text ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.title}>
                            {props.score.channelName}
                        </Text>
                        {/* {
                            props.score.status === 'unread' ?
                                <Text style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 1,
                                    backgroundColor: '#f94144',
                                    textAlign: 'center',
                                    zIndex: 150,
                                    marginLeft: 10,
                                    marginTop: 7,
                                    color: 'white', lineHeight: 20, fontSize: 10
                                }}>
                                    !
                                </Text> : null
                        } */}
                        <Text ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.titleArrow}>
                            {props.score.score}%
                        </Text>
                        <Text ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={styleObject.titleArrow}>
                            <Ionicons name="chevron-forward-outline" color="#50566B" size={15} style={{ marginTop: 4 }} />
                        </Text>
                    </View>
                    <Text ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={styleObject.description}>
                        {props.score.total}% of total grade scored.
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default ScoreCard

const styles: any = () => StyleSheet.create({
    swiper: {
        height: '100%',
        width: '100%',
        maxWidth: 500,
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: '#f7fafc'
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: 1,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 150,
        marginLeft: 10
    },
    card: {
        height: '100%',
        width: '100%',
        borderRadius: 1,
        padding: 13,
        backgroundColor: '#f7fafc',
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#f7fafc'
    },
    dateContainer: {
        fontSize: 10,
        height: '22%',
        backgroundColor: '#f7fafc',
        display: 'flex',
        flexDirection: 'row'
    },
    date: {
        fontSize: 10,
        color: '#50566B',
        marginLeft: 5
    },
    title: {
        fontFamily: 'inter',
        fontSize: 13,
        paddingTop: 5,
        color: '#1A2036',
        flex: 1
    },
    titleArrow: {
        fontFamily: 'inter',
        fontSize: 13,
        lineHeight: 20,
        paddingTop: 5,
        color: '#1A2036',
        marginLeft: 10
    },
    description: {
        fontSize: 13,
        color: '#50566B',
        // height: '30%',
    },
    color: {
        width: 10,
        height: 10,
        borderRadius: 1,
        marginTop: 1
    }
});
