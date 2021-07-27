import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, TouchableOpacity } from '../components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateRangePicker } from 'rsuite';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

const BottomBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = 'dark';
    const styles: any = styleObject(colorScheme)
    const [loggedIn, setLoggedIn] = useState(false)
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
                <View style={{ flexDirection: 'row', flex: 1, backgroundColor: '#2f2f3c' }}>
                    <View style={{ paddingLeft: 10, flexDirection: 'row', backgroundColor: '#2F2F3C' }}>
                        <View style={{ backgroundColor: '#2F2F3C' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: '#2F2F3C', paddingLeft: 30 }}>
                                <Menu
                                    onSelect={(subscription: any) => {
                                        if (subscription === 'All') {
                                            props.handleFilterChange('All')
                                            props.setChannelFilterChoice('All')
                                            props.setChannelId('')
                                            props.closeModal()
                                            return
                                        }
                                        if (subscription === 'My Cues') {
                                            props.handleFilterChange('MyCues')
                                            props.setChannelFilterChoice('All')
                                            props.setChannelId('')
                                            props.closeModal()
                                            return
                                        }
                                        props.setChannelFilterChoice('All')
                                        props.handleFilterChange(subscription.channelName)
                                        props.setChannelId(subscription.channelId)
                                        props.setChannelCreatedBy(subscription.channelCreatedBy)
                                        props.closeModal()
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#fff' }}>
                                            {choice === 'MyCues' ? 'My Cues' : choice}<Ionicons name='caret-down' size={15} />
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
                                                All
                                            </Text>
                                        </MenuOption>
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
                            <Text style={{ fontSize: 9, color: '#a2a2ac', paddingTop: 7, textAlign: 'center', backgroundColor: '#2F2F3C', paddingLeft: 30 }}>
                                Channel
                            </Text>
                        </View>
                    </View>
                    <View style={{ paddingRight: 20, flexDirection: 'row', backgroundColor: '#2F2F3C', paddingLeft: 20 }}>
                        <View style={{ backgroundColor: '#2F2F3C' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: '#2F2F3C' }}>
                                <Menu
                                    onSelect={(category: any) => {
                                        props.setChannelFilterChoice(category)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#a2a2ac' }}>
                                            {filterChoice}<Ionicons name='caret-down' size={15} />
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
                                                All
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
                            <Text style={{ fontSize: 9, color: '#a2a2ac', paddingTop: 7, textAlign: 'center' }}>
                                Category
                            </Text>
                        </View>
                    </View>
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        backgroundColor: '#2f2f3c',
                        paddingRight: 30
                    }}>
                        <DateRangePicker
                            preventOverflow={true}
                            size={'xs'}
                            placeholder={'Select Dates'}
                            onChange={e => {
                                props.setFilterStart(e[0])
                                props.setFilterEnd(e[1])
                            }}
                            value={[
                                props.filterStart,
                                props.filterEnd
                            ]}
                        />
                    </View>
                </View>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', height: '50%', paddingHorizontal: 15, backgroundColor: '#2F2F3C' }}>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openChannels()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 20 }}>
                            <Ionicons name='school-outline' size={19} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 9, color: '#a2a2ac' }}>
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
                            <Ionicons name='calendar-outline' size={19} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 9, color: '#a2a2ac' }}>
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
                            <Ionicons name='add-circle' size={40} color={'#fff'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openProfile()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 20 }}>
                            <Ionicons name={loggedIn ? 'person-circle-outline' : 'cloud-upload-outline'} size={20} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 9, color: '#a2a2ac' }}>
                            {!loggedIn && userLoaded ? 'Sign Up' : 'Profile'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.icons}>
                    <TouchableOpacity
                        onPress={() => props.openWalkthrough()}
                        style={styles.center}
                    >
                        <Text style={{ textAlign: 'center', lineHeight: 20 }}>
                            <Ionicons name='help-circle-outline' size={20} color={'#fff'} />
                        </Text>
                        <Text style={{ fontSize: 9, color: '#a2a2ac' }}>
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
        height: '21%',
        width: '100%',
        display: 'flex',
        paddingBottom: 10,
        borderTopWidth: 1,
        borderColor: '#a2a2ac',
        backgroundColor: '#2F2F3C'
    },
    icons: {
        width: '20%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#2F2F3C'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        justifyContent: 'center',
        display: 'flex',
        textAlign: 'center',
        backgroundColor: '#2F2F3C'
    },
    colorBar: {
        width: '100%',
        height: '50%',
        // flexDirection: 'row',
        paddingTop: 20,
        backgroundColor: '#2F2F3C'
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
        backgroundColor: colorScheme === 'light' ? '#2F2F3C' : 'white',
        color: colorScheme === 'light' ? 'white' : '#2F2F3C'
    },
    cusCategory: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#2F2F3C' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#2F2F3C' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: colorScheme === 'light' ? '#2F2F3C' : 'white',
    }
});
