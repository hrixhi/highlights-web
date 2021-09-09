import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import AsyncStorage from "@react-native-async-storage/async-storage";

const SearchResultCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorChoices: any[] = ['#d91d56', '#ED7D22', '#FFBA10', '#B8D41F', '#53BE6D'].reverse()
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
                        {/* <View style={{
                            width: 9,
                            height: 9,
                            borderRadius: 12,
                            // marginTop: 1,
                            backgroundColor: colorCode
                        }} /> */}

                        {/* <Text style={styleObject.date}>
                            {props.cue.customCategory ? props.cue.customCategory : ''}
                        </Text> */}
                        {/* {
                            props.cue.channelName ?
                                <Text style={styleObject.date}>
                                    {props.cue.channelName}
                                </Text> : null
                        } */}
                        {/* <Text style={styleObject.date}>
                            {props.cue.customCategory}
                        </Text> */}
                        {/* {
                            props.cue.submission ? <Text style={styleObject.date}>
                                <Ionicons name='share-outline' size={9} color={props.cue.submittedAt && props.cue.submittedAt !== '' ? ('#3B64F8') : (colorScheme === 'light' ? '#fff' : '#333333')} style={{ marginRight: 10 }} />
                            </Text> : null
                        }
                        {
                            props.cue.frequency !== '0' ?
                                <Text style={styleObject.date}>
                                    <Ionicons name='notifications-outline' size={9} color={colorScheme === 'light' ? '#fff' : '#333333'} />
                                </Text> : null
                        } */}
                        {/* {
                            props.cue.graded && showScore && !isOwner ? <Text style={{
                                fontSize: 9,
                                color: '#3B64F8',
                                marginLeft: 10
                            }}>
                                {props.cue.score}%
                            </Text> : null
                        } */}
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
                                    <Ionicons name='bookmark' size={18} color={starred ? '#d91d56' : '#fff'} />
                                </Text>
                                : null
                        } */}
                        {/* <View style={{
                            ...styleObject.date,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            flex: 1,
                            marginRight: 5,
                            marginTop: -5,
                            backgroundColor: colorScheme === 'light'
                                ? (starred ? '#43434f' : '#fff')
                                : (starred ? 'white' : '#fff'),
                        }}>
                            {
                                props.cue.submission ? <Text>
                                    <Ionicons name='share-outline' size={11} color={props.cue.submittedAt && props.cue.submittedAt !== '' ? ('#3B64F8') : (colorScheme === 'light' ? '#fff' : '#333333')} style={{ marginRight: 10 }} />
                                </Text> : null
                            }
                            {
                                props.cue.frequency !== '0' ?
                                    <Text>
                                        <Ionicons name='notifications-outline' size={11} color={colorScheme === 'light' ? '#fff' : '#333333'} />
                                    </Text> : null
                            }
                        </View> */}
                        {/* <Text style={styleObject.date2}>
                            {
                                (new Date(props.cue.date)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.cue.date)).toString().split(' ')[2]
                            }
                        </Text> */}
                    </View>
                    <View style={{
                        backgroundColor: '#f8f9fa',
                        width: '100%', flex: 1,
                        height: '100%',
                        flexDirection: 'row'
                    }}>
                        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
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
                        </View>
                        {
                            props.style ?
                                <View style={{ flexDirection: 'row', backgroundColor: '#f8f9fa' }}>
                                    {
                                        props.unreadMessages !== undefined
                                            && props.unreadMessages !== 0
                                            ?
                                            <Text style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 12,
                                                backgroundColor: '#3b64f8',
                                                textAlign: 'center',
                                                zIndex: 150,
                                                marginLeft: 10,
                                                marginTop: 5,
                                                color: 'white', lineHeight: 20, fontSize: 10
                                            }}>
                                                {props.unreadMessages}
                                            </Text> : null
                                    }
                                    <Ionicons name="chevron-forward-outline" color="#818385" size={20} style={{ marginTop: 3, marginLeft: 10 }} />
                                </View> : null
                        }
                        {/* {
                            props.cue.status && (props.cue.status !== 'read' && props.cue.status !== 'submitted')
                                ?
                                <Text style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    backgroundColor: '#d91d56',
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
                                    backgroundColor: '#3b64f8',
                                    textAlign: 'center',
                                    zIndex: 150,
                                    marginLeft: 5,
                                    marginTop: 12,
                                    color: 'white', lineHeight: 20, fontSize: 10
                                }}>
                                    {props.cue.unreadThreads}
                                </Text> : <Text style={{ width: 25 }} />
                        } */}
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
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eeeeee'
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
        backgroundColor: '#f8f9fa'
    },
    flipText: {
        height: '100%',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#43434f' : '#f8f9fa'
    },
    dateContainer: {
        fontSize: 10,
        color: '#fff',
        // height: '25%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '25%',
        display: 'flex',
        flexDirection: 'row',
        color: '#fff',
        backgroundColor: colorScheme === 'light' ? '#43434f' : '#f8f9fa'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#f8f9fa' : '#333333',
        // marginLeft: 10,
        lineHeight: 10
    },
    date2: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#f8f9fa' : '#333333',
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
        backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#f8f9fa',
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
