import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from "@react-native-async-storage/async-storage";



const SearchResultCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const colorScheme = 'dark'
    const styleObject = styles(colorScheme, props.colorCode)
    return (
        <View
            style={styleObject.swiper}
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
                        </Text> : <Text style={styleObject.date}>{" "}</Text>}
                    </View>
                    <View style={{
                        width: '100%', flex: 1,
                        height: '100%',
                        flexDirection: 'row'
                    }}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={{
                                    fontFamily: 'inter',
                                    fontSize: 12,
                                    lineHeight: 20,
                                    flex: 1,
                                    marginTop: 5,
                                    color: '#000000'
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
                            {props.option === "Channels" && !props.subscribed ? <View style={{ paddingLeft: 10, }}>
                                <TouchableOpacity
                                    onPress={() => props.handleSub()}
                                    style={{ marginTop: 1 }}
                                >
                                    <Text style={{ }}>
                                        <Ionicons name='duplicate-outline' size={18} color='#006AFF' />
                                    </Text>
                                </TouchableOpacity>
                            </View> : null}
                        </View>
                    </View>

                </View>
            </TouchableOpacity>
            {/* <View
                style={{
                    backgroundColor: props.colorCode !== '' ? props.colorCode : '#000000',
                    flex: 1,
                    // borderLeftWidth: 2,
                    borderColor: '#efefef',
                    opacity: 0.9
                    // borderTopLeftRadius: 8,
                    // borderBottomLeftRadius: 8,
                }}
            >
            </View> */}
        </View >
    );
}

export default SearchResultCard

const styles: any = (colorScheme: any, col: any) => StyleSheet.create({
    swiper: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 1,
        // borderTopRightRadius: 5,
        // borderBottomRightRadius: 5,
        // borderBottomRightRadius: 1,
        maxWidth: 130,
        width: 130,
        // borderLeftWidth: 1,
        borderColor: col,
        borderLeftWidth: 3,
        flexDirection: 'row',
        shadowOffset: {
            width: 2,
            height: 2,
        },
        overflow: 'hidden',
        shadowOpacity: 0.07,
        shadowRadius: 7,
        zIndex: 500000,
    },
    card: {
        // maxWidth: 210,
        height: '100%',
        // borderTop,
        width: 130,
        minWidth: 130,
        padding: 10,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 1,
        padding: 13,
        color: '#efefef',
        backgroundColor: colorScheme === 'light' ? '#000000' : 'white'
    },
    descriptionFlip: {
        color: '#efefef',
        fontSize: 13,
        // height: '25%',
    },
    text: {
        // height: '100%',
        backgroundColor: 'white'
    },
    flipText: {
        height: '100%',
        color: '#efefef',
        backgroundColor: colorScheme === 'light' ? '#000000' : '#efefef'
    },
    dateContainer: {
        fontSize: 10,
        marginBottom: 5,
        color: '#efefef',
        // height: '25%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '25%',
        display: 'flex',
        flexDirection: 'row',
        color: '#efefef',
        backgroundColor: colorScheme === 'light' ? '#000000' : '#efefef'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#efefef' : '#1F1F1F',
        // marginLeft: 10,
        lineHeight: 10
    },
    date2: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#efefef' : '#1F1F1F',
        // marginLeft: 10,
        lineHeight: 10,
        textAlign: 'left',
        flex: 1
    },
    title: {
        fontFamily: 'overpass',
        // fontWeight: 'bold',
        fontSize: 12,
        lineHeight: 20,
        flex: 1,
        marginTop: 5,
        color: '#000000'
    },
    titleFlip: {
        color: colorScheme === 'light' ? '#000000' : '#000000',
        backgroundColor: 'white',
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
