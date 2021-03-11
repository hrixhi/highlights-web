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
                <View style={{ backgroundColor: '#f4f4f4', width: '100%', flexDirection: 'row', display: 'flex', height: '44%' }}>
                    <Text ellipsizeMode={'tail'}
                        numberOfLines={1}
                        style={styleObject.title}>
                        {displayName}
                    </Text>
                    {
                        fullName === 'submitted' || fullName === 'graded' || props.chat ?
                            <Ionicons name="chevron-forward-outline" color="#a6a2a2" size={20} style={{ marginTop: 3 }} /> : null
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
