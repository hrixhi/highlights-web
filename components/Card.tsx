import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import useColorScheme from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';

const Card: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d'].reverse()
    const colorScheme = useColorScheme();
    const styleObject = styles(colorScheme, props.channelId)
    const starred = props.cue.starred;
    const { title, subtitle } = htmlStringParser(props.cue.cue)

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                key={'textPage'}
                onPress={() => props.updateModal()}
                style={starred ? styleObject.flipCard : styleObject.card}>
                <View style={starred ? styleObject.flipText : styleObject.text}>
                    <View style={starred ? styleObject.flipDateContainer : styleObject.dateContainer}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 10,
                            marginTop: 1,
                            backgroundColor: colorChoices[props.cue.color]
                        }} />
                        <Text style={styleObject.date}>
                            {
                                (new Date(props.cue.date)).toString().split(' ')[1] +
                                ' ' +
                                (new Date(props.cue.date)).toString().split(' ')[2]
                            }
                        </Text>
                        {
                            props.cue.channelName ?
                                <Text style={styleObject.date}>
                                    {props.cue.channelName}
                                </Text> : null
                        }
                        <Text style={styleObject.date}>
                            {props.cue.customCategory}
                        </Text>
                        {
                            props.cue.starred ?
                                <Text style={{
                                    textAlign: 'right',
                                    lineHeight: 30,
                                    marginTop: -25,
                                    paddingRight: 25,
                                    position: 'absolute',
                                    width: '97%'
                                }}>
                                    <Ionicons name='bookmark' size={20} color={starred ? '#f94144' : '#a6a2a2'} />
                                </Text>
                                : null
                        }
                        {
                            props.cue.shuffle ?
                                <View style={{
                                    ...styleObject.date,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    flex: 1,
                                    marginRight: 5,
                                    marginTop: -2,
                                    backgroundColor: colorScheme === 'light'
                                        ? (starred ? '#101010' : '#F4F4F4')
                                        : (starred ? 'white' : '#a6a2a2'),
                                }}>
                                    <Text style={{ paddingRight: 4 }}>
                                        {
                                            props.cue.status && props.cue.status !== 'read'
                                                ? <Ionicons name='alert-outline'
                                                    style={{ paddingRight: 15 }}
                                                    size={11} color={'#0079FE'} />
                                                : null
                                        }
                                    </Text>
                                    <Text>
                                        <Ionicons name='shuffle-outline' size={11} color={colorScheme === 'light' ? '#a6a2a2' : '#333333'} />
                                    </Text>
                                </View> :
                                (
                                    props.cue.frequency === "0" ?
                                        <View style={{
                                            ...styleObject.date,
                                            display: 'flex',
                                            flexDirection: 'row',
                                            justifyContent: 'flex-end',
                                            flex: 1,
                                            marginRight: 5,
                                            marginTop: -2,
                                            backgroundColor: colorScheme === 'light'
                                                ? (starred ? '#101010' : '#F4F4F4')
                                                : (starred ? 'white' : '#a6a2a2'),
                                        }}>
                                            <Text style={{ paddingRight: 4 }}>
                                                {
                                                    props.cue.status && props.cue.status !== 'read'
                                                        ? <Ionicons name='alert-outline'
                                                            style={{ marginRight: 15 }}
                                                            size={11} color={'#0079FE'} />
                                                        : null
                                                }
                                            </Text>
                                            <Text>
                                                <Ionicons name='notifications-off-outline' size={11} color={colorScheme === 'light' ? '#a6a2a2' : '#333333'} />
                                            </Text>
                                        </View>
                                        :
                                        <View style={{
                                            ...styleObject.date,
                                            display: 'flex',
                                            flexDirection: 'row',
                                            justifyContent: 'flex-end',
                                            flex: 1,
                                            marginRight: 5,
                                            marginTop: -2,
                                            backgroundColor: colorScheme === 'light'
                                                ? (starred ? '#101010' : '#F4F4F4')
                                                : (starred ? 'white' : '#a6a2a2'),
                                        }}>
                                            <Text style={{ paddingRight: 4 }}>
                                                {
                                                    props.cue.status && props.cue.status !== 'read'
                                                        ? <Ionicons name='alert-outline'
                                                            style={{ marginRight: 15 }}
                                                            size={11} color={'#0079FE'} />
                                                        : null
                                                }
                                            </Text>
                                            <Text>
                                                <Ionicons name='timer-outline' size={11} color={colorScheme === 'light' ? '#a6a2a2' : '#333333'} />
                                            </Text>
                                        </View>
                                )
                        }
                    </View>
                    <Text
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={starred ? styleObject.titleFlip : styleObject.title}>
                        {title}
                    </Text>
                    {
                        subtitle === '' ? null :
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={starred ? styleObject.descriptionFlip : styleObject.description}>
                                {subtitle !== '' ? subtitle : ' '}
                            </Text>
                    }
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(Card, (prev, next) => {
    return _.isEqual({ ...prev.cue }, { ...next.cue })
})

const styles: any = (colorScheme: any, channelId: any) => StyleSheet.create({
    swiper: {
        height: '87.5%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    card: {
        height: '100%',
        borderRadius: 20,
        padding: 13,
        backgroundColor: colorScheme === 'light' ? '#F4F4F4' : '#a6a2a2',
    },
    flipCard: {
        height: '100%',
        width: '100%',
        borderRadius: 20,
        padding: 13,
        color: '#F4F4F4',
        backgroundColor: colorScheme === 'light' ? '#101010' : 'white'
    },
    descriptionFlip: {
        color: '#a6a2a2',
        fontSize: 13,
        height: '30%'
    },
    text: {
        backgroundColor: colorScheme === 'light' ? '#F4F4F4' : '#a6a2a2'
    },
    flipText: {
        color: '#F4F4F4',
        backgroundColor: colorScheme === 'light' ? '#101010' : 'white'
    },
    dateContainer: {
        fontSize: 10,
        color: colorScheme === 'light' ? '#a6a2a2' : '#f4f4f4',
        height: '22%',
        backgroundColor: colorScheme === 'light' ? '#F4F4F4' : '#a6a2a2',
        display: 'flex',
        flexDirection: 'row'
    },
    flipDateContainer: {
        fontSize: 10,
        height: '22%',
        display: 'flex',
        flexDirection: 'row',
        color: '#F4F4F4',
        backgroundColor: colorScheme === 'light' ? '#101010' : 'white'
    },
    date: {
        fontSize: 9,
        color: colorScheme === 'light' ? '#a6a2a2' : '#333333',
        marginLeft: 10
    },
    title: {
        fontFamily: 'inter',
        fontSize: 14,
        fontWeight: 'bold',
        height: '44%',
        width: '100%',
        paddingTop: 5,
        color: colorScheme === 'light' ? '#101010' : 'white'
    },
    titleFlip: {
        color: colorScheme === 'light' ? '#fff' : '#101010',
        backgroundColor: colorScheme === 'light' ? '#101010' : '#fff',
        fontFamily: 'inter',
        fontSize: 14,
        fontWeight: 'bold',
        height: '44%',
        width: '100%',
        paddingTop: 5,
    },
    description: {
        fontSize: 13,
        color: colorScheme === 'light' ? '#a6a2a2' : '#333333',
        height: '30%'
    }
});
