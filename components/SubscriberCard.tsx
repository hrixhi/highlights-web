import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';

const SubscriberCard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styleObject = styles(props.status)
    const displayName = props.subscriber.displayName ? props.subscriber.displayName : ''
    const fullName = props.subscriber.fullName ? props.subscriber.fullName : ''

    return (
        <View
            style={styleObject.swiper}
        >
            <TouchableOpacity
                onPress={() => props.onPress()}
                key={'textPage'}
                style={styleObject.card}>
                <View style={{ backgroundColor: '#f4f4f4', width: '100%', flexDirection: 'row', display: 'flex', height: '44%', minHeight: 25 }}>
                    <Text ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={styleObject.title}>
                        {displayName}
                    </Text>
                    {
                        fullName === 'submitted' || fullName === 'graded' || props.chat ?
                            <View style={{ flexDirection: 'row', backgroundColor: '#f4f4f4' }}>
                                {
                                    props.subscriber.unreadMessages !== undefined
                                        && props.subscriber !== null
                                        && props.subscriber.unreadMessages !== 0
                                        ?
                                        <Text style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            backgroundColor: '#f94144',
                                            textAlign: 'center',
                                            zIndex: 150,
                                            marginLeft: 10,
                                            marginTop: 5,
                                            color: 'white', lineHeight: 20, fontSize: 10
                                        }}>
                                            {props.subscriber.unreadMessages}
                                        </Text> : null
                                }
                                {
                                    props.hideChevron ? null : <Ionicons name="chevron-forward-outline" color="#a6a2a2" size={20} style={{ marginTop: 3, marginLeft: 10 }} />
                                }
                            </View>
                            : null
                    }
                </View>
                <View style={styleObject.text}>
                    <Text ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={styleObject.description}>
                        {fullName}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(SubscriberCard, (prev, next) => {
    return _.isEqual({ ...prev.subscriber }, { ...next.subscriber })
})

const styles: any = (status: any) => StyleSheet.create({
    swiper: {
        height: '100%',
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'white'
    },
    card: {
        height: '100%',
        width: '100%',
        borderRadius: 20,
        padding: 13,
        backgroundColor: '#F4F4F4',
    },
    text: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#F4F4F4',
    },
    titleArrow: {
        fontFamily: 'inter',
        fontSize: 14,
        paddingTop: 5,
        color: '#101010',
        marginLeft: 10
    },
    title: {
        fontFamily: 'inter',
        fontSize: 14,
        width: '100%',
        paddingTop: 5,
        color: '#101010'
    },
    description: {
        fontSize: 14,
        color: '#a6a2a2',
    }
});
