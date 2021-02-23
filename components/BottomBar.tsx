import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useColorScheme from '../hooks/useColorScheme';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { fontSize } from '../assets/fonts/fontSize';

const BottomBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = useColorScheme();
    const styles: any = styleObject(colorScheme)

    return (
        <View style={styles.bottombar}>
            <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                {
                    props.customCategories.length === 0 ? null :
                        <TouchableOpacity
                            style={choice === 'All' ? styles.subOutline : styles.sub}
                            onPress={() => {
                                props.handleFilterChange('All')
                                props.setChannelFilterChoice('All')
                                props.setChannelId('')
                            }}>
                            <Text
                                style={{
                                    color: colorScheme === 'light' ? (
                                        choice === 'All' ? 'white' : '#101010'
                                    ) : (
                                            choice === 'All' ? '#101010' : 'white'
                                        ),
                                    lineHeight: 20,
                                    fontSize: 14
                                }}
                            >
                                <Ionicons name='home-outline' size={15} color={colorScheme === 'light' ? (
                                    choice === 'All' ? 'white' : '#101010'
                                ) : (
                                        choice === 'All' ? '#101010' : 'white'
                                    )} />
                            </Text>
                        </TouchableOpacity>
                }
                {
                    props.subscriptions.map((subscription: any) => {
                        return <TouchableOpacity
                            key={Math.random()}
                            style={choice === subscription.channelName ? styles.subOutline : styles.sub}
                            onPress={() => {
                                props.setChannelFilterChoice('All')
                                props.handleFilterChange(subscription.channelName)
                                props.setChannelId(subscription.channelId)
                                props.setChannelCreatedBy(subscription.channelCreatedBy)
                            }}>
                            <Text style={{
                                color: colorScheme === 'light' ? (
                                    choice === subscription.channelName ? 'white' : '#101010'
                                ) : (
                                        choice === subscription.channelName ? '#101010' : 'white'
                                    ),
                                lineHeight: 20,
                                fontFamily: 'overpass',
                                fontSize: 13
                            }}>
                                {subscription.channelName}
                            </Text>
                        </TouchableOpacity>
                    })
                }
                <TouchableOpacity
                    style={styles.sub}
                    onPress={() => {
                        props.openChannels()
                    }}>
                    <Text
                        style={{
                            color: '#0079FE',
                            lineHeight: 20,
                            fontFamily: 'inter'
                        }}
                    >
                        <Ionicons name='add-outline' size={17} />
                    </Text>
                </TouchableOpacity>
            </ScrollView>
            <View style={{ display: 'flex', flexDirection: 'row', height: '50%' }}>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openWalkthrough()}
                        style={{}}
                    >
                        <Text style={{ lineHeight: 40, paddingLeft: 45 }}>
                            <Ionicons name='help-circle-outline' size={24} color={colorScheme === 'light' ? '#101010' : 'white'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCreate()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 40 }}>
                            <Ionicons name='add-circle' size={28} color={colorScheme === 'light' ? '#101010' : 'white'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openMenu()}
                        style={{}}
                    >
                        <Text style={{ lineHeight: 40, textAlign: 'right', paddingRight: 45 }}>
                            <Ionicons name='settings-outline' size={19} color={colorScheme === 'light' ? '#101010' : 'white'} />
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default BottomBar

const styleObject: any = (colorScheme: any) => StyleSheet.create({
    bottombar: {
        height: '15%',
        width: '100%',
        display: 'flex',
        paddingHorizontal: 15,
        paddingBottom: 15,
        // borderColor: '#eaeaea',
        // borderLeftWidth: 1,
        // borderRightWidth: 1
    },
    icons: {
        width: '33.33333%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        justifyContent: 'center',
        display: 'flex'
    },
    colorBar: {
        width: '98.5%',
        height: '50%',
        flexDirection: 'row',
        paddingTop: 20
    },
    iconContainer: {
        width: '20%',
        textAlign: 'right',
    },
    outline: {
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#101010' : 'white',
        color: colorScheme === 'light' ? 'white' : '#101010'
    },
    cusCategory: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#101010' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#101010' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#101010' : 'white',
    },
    color1: {
        backgroundColor: '#f94144',
    },
    color2: {
        backgroundColor: '#f3722c',
    },
    color3: {
        backgroundColor: '#f8961e',
    },
    color4: {
        backgroundColor: '#f9c74f',
    },
    color5: {
        backgroundColor: '#90be6d',
    },
    colorContainer: {
        height: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4
    },
    color: {
        width: 12,
        height: 12,
        borderRadius: 6
    },
});
