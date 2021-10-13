import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from "@react-native-async-storage/async-storage";

const SearchResultCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const colorScheme = 'dark'
    const styleObject = styles(colorScheme)


    return (
        <View
            style={props.style ? props.style : styleObject.swiper}
        >
            <TouchableOpacity
                key={'textPage'}
                onPress={() => {
                    props.onPress()
                }}
                style={styleObject.card}>
                <View style={styleObject.text}>
                    <View style={styleObject.dateContainer}>
                        {props.colorCode !== "" ? <View style={{
                            width: 9,
                            height: 9,
                            borderRadius: 12,
                            // marginTop: 1,
                            backgroundColor: props.colorCode
                        }} /> : null}

                        {props.channelName !== "" && props.option !== "Channels" ? <Text style={styleObject.date}>
                            {props.channelName}
                        </Text> : null}
                    </View>
                    <View style={{
                        backgroundColor: '#f7fafc',
                        width: '100%', flex: 1,
                        height: '100%',
                        flexDirection: 'row'
                    }}>
                        <View style={{ flex: 1, backgroundColor: '#f7fafc' }}>
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={{
                                    fontFamily: 'inter',
                                    fontSize: 12,
                                    lineHeight: 20,
                                    // flex: 1,
                                    marginTop: props.option === "Channels" ? 0 : 7,
                                    marginBottom: props.option === "Channels" ? 7 : 0,
                                    color: '##1A2036',
                                    flexDirection: 'row', flex: 1,
                                }}>
                                {props.title}
                            </Text>
                            {/* {props.subtitle ?
                                <Text ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={styleObject.description}>
                                    {props.subtitle}
                                </Text>

                                : null} */}
                            {props.option === "Channels" && !props.subscribed ? <View style={{ flex: 1, paddingLeft: 10, backgroundColor: '#f8f8fa' }}>
                                <TouchableOpacity
                                    onPress={() => props.handleSub()}
                                >
                                    <Text style={{ textAlign: 'center', fontSize: 12, paddingTop: 5, color: '#5469D4', backgroundColor: '#f8f8fa' }} ellipsizeMode='tail'>
                                        Join
                                    </Text>
                                </TouchableOpacity>
                            </View> : null}
                        </View>
                    </View>

                </View>
            </TouchableOpacity>
        </View >
    );
}

export default SearchResultCard

const styles: any = (colorScheme: any) => StyleSheet.create({
    swiper: {
        height: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        maxWidth: 175
    },
    card: {
        // maxWidth: 200,
        height: '100%',
        borderRadius: 10,
        padding: 10,
        paddingHorizontal: 10,
        backgroundColor: '#f7fafc',
        borderWidth: 1,
        borderColor: '#E3E8EE'
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 0,
        padding: 13,
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#1A2036' : 'white'
    },
    descriptionFlip: {
        color: '#fff',
        fontSize: 13,
        // height: '25%',
    },
    text: {
        // height: '100%',
        backgroundColor: '#f7fafc'
    },
    flipText: {
        height: '100%',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#1A2036' : '#f7fafc'
    },
    dateContainer: {
        fontSize: 10,
        marginBottom: 5,
        color: '#fff',
        // height: '25%',
        backgroundColor: '#f7fafc',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '25%',
        display: 'flex',
        flexDirection: 'row',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#1A2036' : '#f7fafc'
    },
    date: {
        fontSize: 10,
        color: colorScheme === 'light' ? '#f7fafc' : '#333333',
        marginLeft: 10,
        lineHeight: 10
    },
    date2: {
        fontSize: 10,
        color: colorScheme === 'light' ? '#f7fafc' : '#333333',
        marginLeft: 10,
        lineHeight: 10,
        textAlign: 'right',
        flex: 1
    },
    // title: {
    //     fontFamily: 'inter',
    //     fontSize: 14,
    //     lineHeight: 20,
    //     // flex: 1,
    //     marginTop: 7,
    //     color: '##1A2036',
    //     flexDirection: 'row', flex: 1,
    //     // height: '50%'
    // },
    titleFlip: {
        color: colorScheme === 'light' ? '#1A2036' : '#1A2036',
        backgroundColor: colorScheme === 'light' ? '#f7fafc' : '#f7fafc',
        fontFamily: 'inter',
        fontSize: 13,
        // ,
        height: '75%',
        width: '100%',
        paddingTop: 5,
    },
    description: {
        fontSize: 13,
        flexDirection: 'row', flex: 1,
        color: '#333333',
        // height: '50%'
        // height: '30%'
    }
});
