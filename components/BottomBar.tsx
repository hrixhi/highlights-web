import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useColorScheme from '../hooks/useColorScheme';
import { Text, View, TouchableOpacity } from '../components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

const BottomBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = useColorScheme();
    const styles: any = styleObject(colorScheme)
    const [loggedIn, setLoggedIn] = useState(true)
    const [userLoaded, setUserLoaded] = useState(false)

    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [channelCategories, setChannelCategories] = useState([])
    const [filterChoice] = useState(props.channelFilterChoice)

    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (parsedUser.email) {
                setLoggedIn(true)
            }
            else {
                setLoggedIn(false)
            }
        }
        setUserLoaded(true)
    }, [])

    useEffect(() => {
        getUser()
    }, [])

    useEffect(() => {
        const custom: any = {}
        const cat: any = []
        cues.map((cue) => {
            if (cue.customCategory && cue.customCategory !== '' && !custom[cue.customCategory]) {
                custom[cue.customCategory] = 'category'
            }
        })
        Object.keys(custom).map(key => {
            cat.push(key)
        })
        setChannelCategories(cat)
    }, [cues])

    return (
        <View style={styles.bottombar}>
            <View style={styles.colorBar}>
                {/* <View style={{ flexDirection: 'row', width: '100%' }}> */}
                {/* <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 25 }}>
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
                                        choice === 'All' ? 'white' : '#202025'
                                    ) : (
                                        choice === 'All' ? '#202025' : 'white'
                                    ),
                                    lineHeight: 22,
                                    fontSize: 13
                                }}
                            >
                                {PreferredLanguageText('myCues')}
                            </Text>
                        </TouchableOpacity>
                        {
                            props.subscriptions.map((subscription: any) => {
                                return <TouchableOpacity
                                    key={Math.random()}
                                    style={choice === subscription.channelName ? styles.subOutline : styles.sub}
                                    onPress={() => {
                                        if (subscription.inactive) {
                                            Alert("Subscription inactivated by channel creator!", "Contact channel creator to gain access.")
                                            return;
                                        }
                                        props.setChannelFilterChoice('All')
                                        props.handleFilterChange(subscription.channelName)
                                        props.setChannelId(subscription.channelId)
                                        props.setChannelCreatedBy(subscription.channelCreatedBy)
                                    }}>
                                    <Text style={{
                                        color: colorScheme === 'light' ? (
                                            choice === subscription.channelName ? 'white' : '#202025'
                                        ) : (
                                            choice === subscription.channelName ? '#202025' : 'white'
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
                    </ScrollView> */}
                <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ width: '50%', paddingLeft: 20, flexDirection: 'row', justifyContent: 'center' }}>
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex' }}>
                                <Menu
                                    onSelect={(subscription: any) => {
                                        if (subscription === 'My Cues') {
                                            props.handleFilterChange('All')
                                            props.setChannelFilterChoice('All')
                                            props.setChannelId('')
                                            return
                                        }
                                        props.setChannelFilterChoice('All')
                                        props.handleFilterChange(subscription.channelName)
                                        props.setChannelId(subscription.channelId)
                                        props.setChannelCreatedBy(subscription.channelCreatedBy)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 17 }}>
                                            {choice === 'All' ? 'My Cues' : choice}<Ionicons name='caret-down' size={17} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'My Cues'}>
                                            <Text>
                                                My Cues
                                            </Text>
                                        </MenuOption>
                                        {
                                            props.subscriptions.map((subscription: any) => {
                                                return <MenuOption
                                                    value={subscription}>
                                                    <Text>
                                                        {subscription.channelName}
                                                    </Text>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 9, color: '#a2a2aa', paddingTop: 7, textAlign: 'center' }}>
                                Channel
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: '50%', paddingRight: 20, flexDirection: 'row', justifyContent: 'center' }}>
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex' }}>
                                <Menu
                                    onSelect={(category: any) => {
                                        props.setChannelFilterChoice(category)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 17, color: '#a2a2aa' }}>
                                            {filterChoice}<Ionicons name='caret-down' size={17} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f4f4f6'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'All'}>
                                            <Text>
                                                {PreferredLanguageText('myCues')}
                                            </Text>
                                        </MenuOption>
                                        {
                                            channelCategories.map((category: any) => {
                                                return <MenuOption
                                                    value={category}>
                                                    <Text>
                                                        {category}
                                                    </Text>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 9, color: '#a2a2aa', paddingTop: 7, textAlign: 'center' }}>
                                Category
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', height: '50%', paddingHorizontal: 15 }}>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openChannels()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 22 }}>
                            <Ionicons name='radio-outline' size={21} color={'#202025'} />
                        </Text>
                        <Text style={{ fontSize: 9, color: '#202025' }}>
                            Channels
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCalendar()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 20 }}>
                            <Ionicons name='calendar-outline' size={21} color={'#202025'} />
                        </Text>
                        <Text style={{ fontSize: 9, color: '#202025' }}>
                            Planner
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openCreate()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 40, marginTop: 5 }}>
                            <Ionicons name='add-circle' size={40} color={'#202025'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openProfile()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 22 }}>
                            <Ionicons name={loggedIn ? 'person-circle-outline' : 'cloud-upload-outline'} size={22} color={'#202025'} />
                        </Text>
                        <Text style={{ fontSize: 9, color: '#202025' }}>
                            {!loggedIn && userLoaded ? 'Sign Up' : 'Profile'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openWalkthrough()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 22 }}>
                            <Ionicons name='help-circle-outline' size={22} color={'#202025'} />
                        </Text>
                        <Text style={{ fontSize: 9, color: '#202025' }}>
                            Help
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
        height: '20%',
        width: '100%',
        display: 'flex',
        paddingBottom: 10,
        borderTopWidth: 1,
        borderColor: '#eeeeee'
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
        display: 'flex',
        textAlign: 'center'
    },
    colorBar: {
        width: '100%',
        height: '50%',
        // flexDirection: 'row',
        paddingTop: 20,
        // paddingLeft: 20
    },
    iconContainer: {
        width: '20%',
        textAlign: 'right',
    },
    badge: {
        position: 'absolute',
        alignSelf: 'center',
        width: 10,
        height: 10,
        marginLeft: 8,
        marginBottom: 10,
        marginTop: -8,
        borderRadius: 10,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#202025' : 'white',
        color: colorScheme === 'light' ? 'white' : '#202025'
    },
    cusCategory: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#202025' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#202025' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#202025' : 'white',
    }
});
