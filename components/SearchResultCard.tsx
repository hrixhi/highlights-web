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
                        {/* {props.colorCode !== "" ? <View style={{
                            width: 9,
                            height: 9,
                            borderRadius: 12,
                            // marginTop: 1,
                            backgroundColor: props.colorCode
                        }} /> : null} */}

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
                        <View style={{ flex: 1, backgroundColor: '#f7fafc', flexDirection: 'row' }}>
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={{
                                    fontFamily: 'inter',
                                    fontSize: 12,
                                    lineHeight: 20,
                                    // flex: 1,
                                    marginTop: 7,
                                    marginBottom: 7,
                                    color: '#50566B',
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
                            {props.option === "Channels" && !props.subscribed ? <View style={{ paddingLeft: 10, backgroundColor: '#f7fafc' }}>
                                <TouchableOpacity
                                    onPress={() => props.handleSub()}
                                    style={{ marginTop: 10 }}
                                >
                                    <Text style={{ backgroundColor: '#f7fafc' }}>
                                        <Ionicons name='enter-outline' size={17} color='#5469D4' />
                                    </Text>
                                </TouchableOpacity>
                            </View> : null}
                        </View>
                    </View>

                </View>
            </TouchableOpacity>
            {
                props.colorCode !== "" ?
                    <View
                        style={{
                            backgroundColor: props.colorCode,
                            flex: 1,
                            borderLeftWidth: 2,
                            borderColor: '#E3E8EE',
                            opacity: 0.9
                            // borderTopLeftRadius: 8,
                            // borderBottomLeftRadius: 8,
                        }}
                    >
                    </View>
                    : <View style={{ flex: 1, backgroundColor: '#f7fafc' }} />
            }

        </View >
    );
}

export default SearchResultCard

const styles: any = (colorScheme: any) => StyleSheet.create({
    swiper: {
        height: '100%',
        maxHeight: 75,
        // borderRadius: 10,
        overflow: 'hidden',
        maxWidth: 175,
        width: '100%',
        borderWidth: 2,
        borderColor: '#E3E8EE',
        flexDirection: 'row'
    },
    card: {
        maxWidth: 210,
        height: '100%',
        // borderTopRightRadius: 10,
        // borderBottomRightRadius: 10,
        // borderTop
        width: '96%',
        padding: 10,
        paddingHorizontal: 10,
        backgroundColor: '#f7fafc',
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 0,
        padding: 13,
        color: '#f7fafc',
        backgroundColor: colorScheme === 'light' ? '#1A2036' : 'white'
    },
    descriptionFlip: {
        color: '#f7fafc',
        fontSize: 13,
        // height: '25%',
    },
    text: {
        // height: '100%',
        backgroundColor: '#f7fafc'
    },
    flipText: {
        height: '100%',
        color: '#f7fafc',
        backgroundColor: colorScheme === 'light' ? '#1A2036' : '#f7fafc'
    },
    dateContainer: {
        fontSize: 10,
        marginBottom: 5,
        color: '#f7fafc',
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
        color: '#f7fafc',
        backgroundColor: colorScheme === 'light' ? '#1A2036' : '#f7fafc'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#f7fafc' : '#333333',
        // marginLeft: 10,
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
