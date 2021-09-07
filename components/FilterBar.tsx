import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, TouchableOpacity } from '../components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateRangePicker } from 'rsuite';
import Alert from '../components/Alert'
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

const FilterBar: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [choice] = useState(props.filterChoice)
    const colorScheme = 'dark';
    const styles: any = styleObject(colorScheme)
    const [loggedIn, setLoggedIn] = useState(true)
    const [userLoaded, setUserLoaded] = useState(false)

    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [cues] = useState<any[]>(unparsedCues.reverse())
    const [channelCategories, setChannelCategories] = useState([])
    const [filterChoice] = useState(props.channelFilterChoice)
    const current = new Date()
    const [deadline, setDeadline] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 24))
    const [initialDate, setInitialDate] = useState<Date>(new Date(current.getTime()))

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
                <View style={{ flexDirection: 'row', flex: 1, backgroundColor: '#f8f9fa' }}>
                    <View style={{ paddingLeft: 10, flexDirection: 'row', backgroundColor: '#f8f9fa' }}>
                        <View style={{ backgroundColor: '#f8f9fa' }}>
                            <View style={{ flexDirection: 'row', display: 'flex', backgroundColor: '#f8f9fa', paddingLeft: 30 }}>
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
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#43434F' }}>
                                            {choice === 'MyCues' ? 'My Cues' : choice}<Ionicons name='caret-down' size={15} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f8f9fa',
                                            overflow: 'scroll',
                                            maxHeight: '100%'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'All'}>
                                            <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                <View style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 12,
                                                    marginTop: 1,
                                                    backgroundColor: "#fff"
                                                }} />
                                                <Text style={{ marginLeft: 5 }}>
                                                    All
                                                </Text>
                                            </View>
                                        </MenuOption>
                                        <MenuOption
                                            value={'My Cues'}>
                                            <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                <View style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 12,
                                                    marginTop: 1,
                                                    backgroundColor: "#000"
                                                }} />
                                                <Text style={{ marginLeft: 5 }}>
                                                    My Cues
                                                </Text>
                                            </View>
                                        </MenuOption>
                                        {
                                            props.subscriptions.map((subscription: any) => {
                                                return <MenuOption
                                                    value={subscription}>
                                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                        <View style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: 12,
                                                            marginTop: 1,
                                                            backgroundColor: subscription.colorCode
                                                        }} />
                                                        <Text style={{ marginLeft: 5 }}>
                                                            {subscription.channelName}
                                                        </Text>
                                                    </View>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 10, color: '#43434F', paddingTop: 7, backgroundColor: '#f8f9fa', paddingLeft: 30 }}>
                                Channel
                            </Text>
                        </View>
                    </View>
                    <View style={{ paddingRight: 20, flexDirection: 'row', backgroundColor: '#f8f9fa', paddingLeft: 20 }}>
                        <View style={{ backgroundColor: '#f8f9fa' }}>
                            <View style={{ flexDirection: 'row', display: 'flex', backgroundColor: '#f8f9fa' }}>
                                <Menu
                                    onSelect={(category: any) => {
                                        props.setChannelFilterChoice(category)
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#43434F', paddingLeft: 10 }}>
                                            {filterChoice}<Ionicons name='caret-down' size={15} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f8f9fa',
                                            overflow: 'scroll',
                                            maxHeight: '100%'
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
                            <Text style={{ fontSize: 10, color: '#43434F', paddingTop: 7, paddingLeft: 10 }}>
                                Category
                            </Text>
                        </View>
                    </View>
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        backgroundColor: '#f8f9fa',
                        paddingRight: 30
                    }}>
                        <DateRangePicker
                            preventOverflow={true}
                            size={'sm'}
                            appearance={'subtle'}
                            placeholder={'Filter  '}
                            onChange={e => {
                                console.log('dates start', e[0])
                                console.log('dates end', e[1])
                                if (e[0] > e[1]) {
                                    Alert('End date must be greater')
                                    return
                                }
                                else {

                                    props.setFilterStart(e[0])
                                    props.setFilterEnd(e[1])
                                }
                            }}
                            defaultShow={true}
                            showOneCalendar={true}
                            value={[
                                props.filterStart,
                                props.filterEnd
                            ]}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}

export default FilterBar

const styleObject: any = (colorScheme: any) => StyleSheet.create({
    bottombar: {
        height: '9%',
        width: '100%',
        display: 'flex',
        paddingBottom: 10,
        // borderTopWidth: 1,
        borderColor: '#555555',
        backgroundColor: '#f8f9fa'
    },
    icons: {
        width: '33.33%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#f8f9fa'
    },
    defaultFont: {
        fontFamily: 'system font'
    },
    center: {
        width: '100%',
        // justifyContent: 'center',
        display: 'flex',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
    },
    colorBar: {
        width: '100%',
        height: '47%',
        paddingTop: 20,
        backgroundColor: '#f8f9fa'
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
        borderRadius: 12,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
    outline: {
        borderRadius: 12,
        backgroundColor: colorScheme === 'light' ? '#43434F' : 'white',
        color: colorScheme === 'light' ? 'white' : '#43434F'
    },
    cusCategory: {
        fontSize: 15,
        color: '#818385',
        height: 22,
        paddingHorizontal: 10
    },
    sub: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#43434F' : 'white',
        height: 22,
        paddingHorizontal: 10
    },
    subOutline: {
        fontSize: 15,
        color: colorScheme === 'light' ? '#43434F' : 'white',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: colorScheme === 'light' ? '#43434F' : 'white',
    }
});
