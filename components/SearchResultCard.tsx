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
                        </Text> : <Text style={styleObject.date}>{" "}</Text>}
                    </View>
                    <View style={{
                        backgroundColor: '#efefef',
                        width: '100%', flex: 1,
                        height: '100%',
                        flexDirection: 'row'
                    }}>
                        <View style={{ flex: 1, backgroundColor: '#efefef', flexDirection: 'row' }}>
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={{
                                    fontFamily: 'overpass',
                                    // fontWeight: 'bold',
                                    fontSize: 12,
                                    lineHeight: 20,
                                    flex: 1,
                                    marginTop: 5,
                                    color: '#16181C'
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
                            {props.option === "Channels" && !props.subscribed ? <View style={{ paddingLeft: 10, backgroundColor: '#efefef' }}>
                                <TouchableOpacity
                                    onPress={() => props.handleSub()}
                                    style={{ marginTop: 1 }}
                                >
                                    <Text style={{ backgroundColor: '#efefef' }}>
                                        <Ionicons name='enter-outline' size={18} color='#006AFF' />
                                    </Text>
                                </TouchableOpacity>
                            </View> : null}
                        </View>
                    </View>

                </View>
            </TouchableOpacity>
            <View
                style={{
                    backgroundColor: props.colorCode !== '' ? props.colorCode : '#16181C',
                    flex: 1,
                    // borderLeftWidth: 2,
                    borderColor: '#efefef',
                    opacity: 0.9
                    // borderTopLeftRadius: 8,
                    // borderBottomLeftRadius: 8,
                }}
            >
            </View>
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
        // borderWidth: 1,
        borderColor: '#efefef',
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
        backgroundColor: '#efefef',
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 1,
        padding: 13,
        color: '#efefef',
        backgroundColor: colorScheme === 'light' ? '#16181C' : 'white'
    },
    descriptionFlip: {
        color: '#efefef',
        fontSize: 13,
        // height: '25%',
    },
    text: {
        // height: '100%',
        backgroundColor: '#efefef'
    },
    flipText: {
        height: '100%',
        color: '#efefef',
        backgroundColor: colorScheme === 'light' ? '#16181C' : '#efefef'
    },
    dateContainer: {
        fontSize: 10,
        marginBottom: 5,
        color: '#efefef',
        // height: '25%',
        backgroundColor: '#efefef',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '25%',
        display: 'flex',
        flexDirection: 'row',
        color: '#efefef',
        backgroundColor: colorScheme === 'light' ? '#16181C' : '#efefef'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#efefef' : '#393939',
        // marginLeft: 10,
        lineHeight: 10
    },
    date2: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#efefef' : '#393939',
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
        color: '#16181C'
    },
    titleFlip: {
        color: colorScheme === 'light' ? '#16181C' : '#16181C',
        backgroundColor: colorScheme === 'light' ? '#efefef' : '#efefef',
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
