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
                        backgroundColor: '#FBFBFC',
                        width: '100%', flex: 1,
                        height: '100%',
                        flexDirection: 'row'
                    }}>
                        <View style={{ flex: 1, backgroundColor: '#FBFBFC' }}>
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={styleObject.title}>
                                {props.title}
                            </Text>
                            {props.subtitle ?
                                <Text ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={styleObject.description}>
                                    {props.subtitle}
                                </Text>
                                : null}
                            {props.option === "Channels" && !props.subscribed ?  <View style={{ flex: 1, paddingLeft: 10, backgroundColor: '#FBFBFC' }}>
                                <TouchableOpacity
                                    onPress={() => props.handleSub()}
                                >
                                    <Text style={{ textAlign: 'center', fontSize: 12, paddingTop: 10, color: '#560bad', backgroundColor: '#FBFBFC' }} ellipsizeMode='tail'>
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
        borderRadius: 12,
        overflow: 'hidden',
        maxWidth: 200
    },
    card: {
        // maxWidth: 200,
        height: '100%',
        borderRadius: 12,
        padding: 12,
        paddingHorizontal: 15,
        backgroundColor: '#FBFBFC',
        borderWidth: 1,
        borderColor: '#e4e7eb'
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 12,
        padding: 13,
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#43434f' : 'white'
    },
    descriptionFlip: {
        color: '#fff',
        fontSize: 13,
        // height: '25%',
    },
    text: {
        // height: '100%',
        backgroundColor: '#FBFBFC'
    },
    flipText: {
        height: '100%',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#43434f' : '#FBFBFC'
    },
    dateContainer: {
        fontSize: 10,
        marginBottom: 5,
        color: '#fff',
        // height: '25%',
        backgroundColor: '#FBFBFC',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '25%',
        display: 'flex',
        flexDirection: 'row',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#43434f' : '#FBFBFC'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#FBFBFC' : '#333333',
        marginLeft: 10,
        lineHeight: 10
    },
    date2: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#FBFBFC' : '#333333',
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
        marginBottom: 10,
        color: '##43434f',
        flexDirection: 'row', flex: 1,
        // height: '50%'
    },
    titleFlip: {
        color: colorScheme === 'light' ? '#43434f' : '#43434f',
        backgroundColor: colorScheme === 'light' ? '#FBFBFC' : '#FBFBFC',
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
