import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useColorScheme from '../hooks/useColorScheme';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { fontSize } from '../assets/fonts/fontSize';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BottomBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = useColorScheme();
    const styles: any = styleObject(colorScheme)
    const [loggedIn, setLoggedIn] = useState(false)

    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (parsedUser.email) {
                setLoggedIn(true)
            }
        }
    }, [])

    useEffect(() => {
        getUser()
    }, [])

    return (
        <View style={styles.bottombar}>
            <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
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
                            lineHeight: 22,
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
                                lineHeight: 22,
                                fontFamily: 'overpass',
                                fontSize: 13
                            }}>
                                {subscription.channelName}
                            </Text>
                        </TouchableOpacity>
                    })
                }
            </ScrollView>
            <View style={{ display: 'flex', flexDirection: 'row', height: '50%' }}>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openMenu()}
                        style={{}}
                    >
                        <Text style={{ lineHeight: 30, textAlign: 'center' }}>
                            <Ionicons name='settings-outline' size={18} color={colorScheme === 'light' ? '#101010' : 'white'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openWalkthrough()}
                        style={{}}
                    >
                        <Text style={{ lineHeight: 30, textAlign: 'center' }}>
                            <Ionicons name='help-circle-outline' size={22} color={colorScheme === 'light' ? '#101010' : 'white'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCreate()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 30 }}>
                            <Ionicons name='add-circle' size={30} color={colorScheme === 'light' ? '#101010' : 'white'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openChannels()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 30 }}>
                            <Ionicons name='radio-outline' size={20} color={colorScheme === 'light' ? '#101010' : 'white'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openProfile()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 30 }}>
                            <Ionicons name={loggedIn ? 'person-circle-outline' : 'cloud-upload-outline'} size={19} color={colorScheme === 'light' ? '#101010' : 'white'} />
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
        paddingHorizontal: 20,
        paddingBottom: 10
    },
    icons: {
        width: '20%',
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
    }
});
