import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Image, Dimensions, Linking, ScrollView } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import { creatFolder, getActivity, getOrganisation, getSearch, updateFolder, checkChannelStatus, subscribe } from '../graphql/QueriesAndMutations';
import logo from './default-images/cues-logo-black-exclamation-hidden.jpg'
import Profile from './Profile';
import Walkthrough from './Walkthrough';
import Channels from './Channels';
import ActivityCard from './ActivityCard';
import OverviewCueCard from './OverviewCueCard';
import Swiper from 'react-native-web-swiper'
import { PreferredLanguageText } from '../helpers/LanguageContext';
import CalendarX from './Calendar';
import { TextInput } from "./CustomTextInput";
import { DateRangePicker } from 'rsuite';
import alert from './Alert';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import Performance from './Performance';
import SearchResultCard from './SearchResultCard';
import { htmlStringParser } from '../helpers/HTMLParser';
import Inbox from './Inbox';
import Card from './Card';
import Alert from '../components/Alert'


const Dashboard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {


    const styles = styleObject()
    const [userId, setUserId] = useState('')
    const [avatar, setAvatar] = useState('')

    const [searchTerm, setSearchTerm] = useState('')
    const priorities = [4, 3, 2, 1, 0]
    const [collapseMap, setCollapseMap] = useState<any>({})
    const [channelCategories, setChannelCategories] = useState<any>({})
    const [results, setResults] = useState<any>({
        'Channels': [],
        'Content': [],
        'Messages': [],
        'Threads': []
    })
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);

    const [filterStart, setFilterStart] = useState<any>(new Date())
    const [filterEnd, setFilterEnd] = useState<any>(null)

    const [searchOptions] = useState(['Content', 'Messages', 'Threads', 'Channels',])
    const [sortBy, setSortBy] = useState('Date ↑')

    const [cueMap, setCueMap] = useState<any>({})
    const [categoryMap, setCategoryMap] = useState<any>({})
    const [selectedCategories, setSelectedCategories] = useState<any>({})

    const [editFolderChannelId, setEditFolderChannelId] = useState('')
    const [cueIds, setCueIds] = useState<any[]>([])
    const [folderIdsMap, setFolderIdsMap] = useState<any>({})
    const [folderId, setFolderId] = useState('')

    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');
    const invalidChannelNameAlert = PreferredLanguageText('invalidChannelName');
    const nameAlreadyInUseAlert = PreferredLanguageText('nameAlreadyInUse');

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    setAvatar(user.avatar)
                    const server = fetchAPI(user._id)
                    setUserId(user._id)
                }
            }
        )()

        const temp: any = {}
        const tempCat: any = {}
        const mycues: any[] = []
        temp['My Notes'] = []
        const tempCollapse: any = {}
        tempCollapse['My Notes'] = false
        const tempSelected: any = {}

        const tempFolders: any = {}

        let dateFilteredCues: any[] = []
        if (filterStart && filterEnd) {
            dateFilteredCues = props.cues.filter((item: any) => {
                const date = new Date(item.date)
                return date >= filterStart && date <= filterEnd
            })

        } else {
            dateFilteredCues = props.cues
        }

        props.subscriptions.map((sub: any) => {
            // const tempCategories: any = {}
            const tempCues: any[] = []
            const cat: any = { '': [] }
            dateFilteredCues.map((cue: any, ind: any) => {
                if (cue.channelId === sub.channelId) {
                    tempCues.push(cue)
                    if (!cat[cue.customCategory]) {
                        cat[cue.customCategory] = ''
                    }
                }
            })

            if (sortBy === 'Priority') {
                tempCues.reverse()
            } else if (sortBy === 'Date ↑') {
                tempCues.sort((a: any, b: any) => {
                    const aDate = new Date(a.date)
                    const bDate = new Date(b.date)
                    if (aDate < bDate) {
                        return 1
                    } else if (aDate > bDate) {
                        return -1
                    } else {
                        return 0
                    }
                })
            }

            tempCues.map((cue: any, ind: any) => {
                if (cue.folderId) {
                    if (tempFolders[cue.folderId]) {
                        tempFolders[cue.folderId].push(ind)
                    } else {
                        tempFolders[cue.folderId] = [ind]
                    }
                }
            })

            const key = sub.channelName + '-SPLIT-' + sub.channelId + '-SPLIT-' + sub.channelCreatedBy + '-SPLIT-' + sub.colorCode
            temp[key] = tempCues
            tempCollapse[key] = false
            if (cat[''].length === 0) {
                delete cat['']
            }
            tempCat[key] = Object.keys(cat)
            tempSelected[key] = ''
        })
        const cat: any = { '': [] }
        props.cues.map((cue: any) => {
            if (!cue.channelId || cue.channelId === '') {
                mycues.push(cue)
                if (!cat[cue.customCategory]) {
                    cat[cue.customCategory] = ''
                }
            }
        })
        if (sortBy === 'Priority') {
            mycues.reverse()
        } else if (sortBy === 'Date ↑') {
            mycues.sort((a: any, b: any) => {
                const aDate = new Date(a.date)
                const bDate = new Date(b.date)
                if (aDate < bDate) {
                    return -1
                } else if (aDate > bDate) {
                    return 1
                } else {
                    return 0
                }
            })
        }

        mycues.map((cue: any, ind: any) => {
            if (cue.folderId) {
                if (tempFolders[cue.folderId]) {
                    tempFolders[cue.folderId].push(ind)
                } else {
                    tempFolders[cue.folderId] = [ind]
                }
            }
        })

        temp['My Notes'] = mycues
        if (cat[''].length === 0) {
            delete cat['']
        }
        tempCat['My Notes'] = Object.keys(cat)
        tempSelected['My Notes'] = ''
        setCueMap(temp)
        setCollapseMap(tempCollapse)
        setCategoryMap(tempCat)
        setFolderIdsMap(tempFolders)
        setSelectedCategories(tempSelected)
    }, [props.cues, props.subscriptions, sortBy, filterStart, filterEnd])

    useEffect(() => {
        if (searchTerm.trim() === '') {
            return
        }
        setLoadingSearchResults(true);
        const server = fetchAPI('')
        server.query({
            query: getSearch,
            variables: {
                userId,
                term: searchTerm
            }
        }).then(res => {
            if (res.data && res.data.user.search) {
                const r = JSON.parse(res.data.user.search)
                const tempResults = {
                    'Content': [...r.personalCues, ...r.channelCues],
                    'Channels': r.channels,
                    'Threads': r.threads,
                    'Messages': r.messages
                }
                setResults(tempResults)
                setLoadingSearchResults(false);
            }
        }).catch(err => {
            console.log(err)
            setLoadingSearchResults(false);
        })
    }, [searchTerm, userId])

    const handleFolderUpdate = useCallback(() => {

        const server = fetchAPI('')

        if (folderId !== '') {
            server.mutate({
                mutation: updateFolder,
                variables: {
                    cueIds,
                    folderId
                }
            }).then(res => {
                if (res.data && res.data.folder.update) {
                    setEditFolderChannelId('')
                    setCueIds([])
                    setFolderId('')
                    props.reloadData()
                }
            })
        } else {
            if (cueIds.length === 0) {
                return;
            }
            server.mutate({
                mutation: creatFolder,
                variables: {
                    cueIds
                }
            }).then(res => {
                if (res.data && res.data.folder.create) {
                    setEditFolderChannelId('')
                    setCueIds([])
                    setFolderId('')
                    props.reloadData()
                }
            })
        }

    }, [cueIds, folderId])

    const handleSub = useCallback(async (cName) => {

        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)

        const server = fetchAPI('')
        server.query({
            query: checkChannelStatus,
            variables: {
                name: cName
            }
        }).then(res => {
            if (res.data.channel && res.data.channel.getChannelStatus) {
                const channelStatus = res.data.channel.getChannelStatus
                switch (channelStatus) {
                    case "public":
                        handleSubscribe(cName, '')
                        break;
                    case "private":
                        let pass: any = prompt('Enter Password')
                        if (!pass) {
                            pass = ''
                        }
                        handleSubscribe(cName, pass)
                        break;
                    case "non-existant":
                        Alert(doesNotExistAlert)
                        break;
                    default:
                        Alert(somethingWrongAlert, checkConnectionAlert)
                        break
                }
            }
        }).catch(err => {
            console.log(err)
            Alert(somethingWrongAlert, checkConnectionAlert)
        })

    }, [])

    const handleSubscribe = useCallback(async (nm, pass) => {

        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)

        const server = fetchAPI('')
        server.mutate({
            mutation: subscribe,
            variables: {
                userId: user._id,
                name: nm,
                password: pass
            }
        })
            .then(res => {
                if (res.data.subscription && res.data.subscription.subscribe) {
                    const subscriptionStatus = res.data.subscription.subscribe
                    switch (subscriptionStatus) {
                        case "subscribed":
                            alert('Subscribed to ' + nm + '!')
                            setSearchTerm('')
                            props.reloadData()
                            break;
                        case "incorrect-password":
                            Alert(incorrectPasswordAlert)
                            break;
                        case "already-subbed":
                            Alert(alreadySubscribedAlert)
                            break;
                        case "error":
                            Alert(somethingWrongAlert, checkConnectionAlert)
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert)
                            break;
                    }
                }
            })
            .catch(err => {
                Alert(somethingWrongAlert, checkConnectionAlert)
            })

    }, [props.closeModal])

    const searchResults = <View
        key={cueMap.toString()}
        style={{
            flexDirection: 'row',
            height: Dimensions.get("window").height - 80,
            width: '100%',
            overflow: 'hidden',
            paddingTop: 20
        }}>
        <View style={{
            width: '100%',
            paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 40
        }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                contentContainerStyle={{
                    width: '100%',
                }}
            >
                <Text style={{
                    fontSize: 24,
                    paddingBottom: 20,
                    paddingTop: 10,
                    fontFamily: 'inter',
                    flex: 1,
                    lineHeight: 23,
                    color: '#661CB0'
                }}>
                    Results
                </Text>
                {
                    (!loadingSearchResults && results && results[searchOptions[0]].length === 0 && results[searchOptions[1]].length === 0 && results[searchOptions[2]].length === 0 && results[searchOptions[3]].length === 0) ? <Text style={{
                        fontSize: 15,
                        paddingBottom: 20,
                        paddingTop: 10,
                        fontFamily: 'inter',
                        flex: 1,
                        lineHeight: 23,
                        backgroundColor: '#fff'
                    }}>None</Text> : null
                }
                {
                    loadingSearchResults ? <View
                        style={{
                            width: "100%",
                            flex: 1,
                            justifyContent: "center",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "white"
                        }}>
                        <ActivityIndicator color={"#a2a2ac"} />
                    </View> : null
                }
                {
                    searchOptions.map((option: any) => {

                        if (results[option].length === 0 || loadingSearchResults) {
                            return null
                        }

                        return <View style={{ marginBottom: 40, backgroundColor: '#fff' }}>
                            <Text style={{
                                fontSize: 15,
                                paddingBottom: 20,
                                paddingTop: 10,
                                fontFamily: 'inter',
                                flex: 1,
                                lineHeight: 23,
                                backgroundColor: '#fff'
                            }}>
                                {option}
                            </Text>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                horizontal={true}
                                // style={{ height: '100%' }}
                                contentContainerStyle={{
                                    // borderWidth: 2,
                                    width: '100%',
                                    // height: windowHeight - 200,
                                }}
                            >
                                {results[option].map((obj: any, index: any) => {

                                    let t = ''
                                    let s = ''
                                    let channelName = ''
                                    let colorCode = ''
                                    let subscribed = false;

                                    if (option === 'Content') {
                                        const { title, subtitle } = htmlStringParser(obj.cue)
                                        t = title
                                        s = subtitle
                                        const filterChannel = props.subscriptions.filter((channel: any) => {
                                            return channel.channelId === obj.channelId
                                        })

                                        if (filterChannel && filterChannel.length !== 0) {
                                            channelName = filterChannel[0].channelName
                                            colorCode = filterChannel[0].colorCode
                                        }
                                    } else if (option === 'Channels') {
                                        t = obj.name

                                        channelName = obj.name
                                        // Determine if already subscribed or not
                                        const existingSubscription = props.subscriptions.filter((channel: any) => {
                                            return channel.channelId === obj._id
                                        })

                                        if (existingSubscription && existingSubscription.length !== 0) {
                                            subscribed = true
                                        }

                                    } else if (option === 'Threads') {
                                        if (obj.message[0] === '{' && obj.message[obj.message.length - 1] === '}') {
                                            const o = JSON.parse(obj.message)
                                            t = (o.title)
                                            s = (o.type)
                                        } else {
                                            const { title, subtitle } = htmlStringParser(obj.message)
                                            t = title
                                            s = subtitle
                                        }
                                        const filterChannel = props.subscriptions.filter((channel: any) => {
                                            return channel.channelId === obj.channelId
                                        })

                                        if (filterChannel && filterChannel.length !== 0) {
                                            channelName = filterChannel[0].channelName
                                            colorCode = filterChannel[0].colorCode
                                        }
                                    } else if (option === 'Messages') {
                                        if (obj.message[0] === '{' && obj.message[obj.message.length - 1] === '}') {
                                            const o = JSON.parse(obj.message)
                                            t = (o.title)
                                            s = (o.type)
                                        } else {
                                            const { title, subtitle } = htmlStringParser(obj.message)
                                            t = title
                                            s = subtitle
                                        }
                                    }

                                    return <View style={{
                                        height: channelName !== "" ? 90 : 70,
                                        marginRight: 15,
                                        maxWidth: 175,
                                        backgroundColor: '#fff',
                                        alignSelf: 'center',
                                        width: '98%'
                                    }} key={index}>
                                        <SearchResultCard
                                            title={t}
                                            subtitle={s}
                                            channelName={channelName}
                                            colorCode={colorCode}
                                            option={option}
                                            subscribed={subscribed}
                                            handleSub={() => handleSub(channelName)}
                                            onPress={async () => {
                                                if (option === 'Content') {
                                                    props.openCueFromCalendar(obj.channelId, obj._id, obj.createdBy)
                                                    setSearchTerm("")
                                                } else if (option === 'Threads') {

                                                    await AsyncStorage.setItem("openThread", obj._id)

                                                    props.openDiscussionFromSearch(obj.channelId)
                                                    setSearchTerm("")


                                                } else if (option === 'Messages') {

                                                    // open chat and set Chat ID and users in Async storage to open that specific chat

                                                    await AsyncStorage.setItem("openChat", JSON.stringify({
                                                        _id: obj.groupId,
                                                        users: obj.users
                                                    }))

                                                    props.setOption("Inbox")

                                                    setSearchTerm("")

                                                } else if (option === "Channels") {

                                                    if (subscribed) {
                                                        // Open the channel meeting
                                                        props.openClassroom(obj._id)
                                                    }
                                                }


                                            }}
                                        />
                                    </View>
                                })}
                            </ScrollView>
                        </View>
                    })
                }
            </ScrollView>
        </View>
    </View>

    const onSwiperLongPress = useCallback((cue, key, swiperCue) => {
        const temp: any[] = []
        folderIdsMap[cue.folderId].map((i: any) => {
            temp.push(cueMap[key][i]._id)
        })
        setCueIds(temp)
        setFolderId(cue.folderId)
        setEditFolderChannelId(swiperCue.channelId ? swiperCue.channelId : 'My Notes')
    }, [folderIdsMap])

    const overview = <View
        key={cueMap.toString()}
        style={{
            flexDirection: 'row',
            height: Dimensions.get("window").height - 80,
            width: '100%',
            overflow: 'hidden',
            // paddingTop: 20
        }}>
        <View style={{ width: '100%' }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                contentContainerStyle={{
                    width: '100%',
                }}
            >
                {
                    Object.keys(cueMap).map((key: any, ind: any) => {
                        return <View style={{
                            marginTop: 20, paddingBottom: 20,
                            borderColor: '#f5f5f7',
                            borderBottomWidth: 1,
                        }}>
                            {
                                ind !== 0 ?
                                    <View style={{ flexDirection: 'row', paddingBottom: 20 }}>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row'
                                            }}
                                            onPress={() => {
                                                const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                tempCollapse[key] = !collapseMap[key]
                                                setCollapseMap(tempCollapse)
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 24,
                                                paddingBottom: 20,
                                                paddingTop: 10,
                                                fontFamily: 'inter',
                                                flex: 1,
                                                lineHeight: 23
                                            }}>
                                                <View style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    marginTop: 1,
                                                    marginRight: 10,
                                                    backgroundColor: key.split('-SPLIT-')[3]
                                                }} /> {key.split('-SPLIT-')[0]}
                                            </Text>
                                        </TouchableOpacity>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: '#fff', paddingTop: 10 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: '#fff' }}>
                                                {
                                                    editFolderChannelId === key.split('-SPLIT-')[1] && (cueIds.length !== 0 || folderId !== '') ?
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                handleFolderUpdate()
                                                            }}
                                                            style={{
                                                                backgroundColor: 'white',
                                                                overflow: 'hidden',
                                                                height: 35,
                                                                marginLeft: 20,
                                                                // marginTop: 15,
                                                                justifyContent: 'center',
                                                                flexDirection: 'row'
                                                            }}>
                                                            <Text style={{
                                                                textAlign: 'center',
                                                                lineHeight: 30,
                                                                color: '#fff',
                                                                fontSize: 12,
                                                                backgroundColor: '#4b956b',
                                                                paddingHorizontal: 25,
                                                                marginRight: 15,
                                                                fontFamily: 'inter',
                                                                height: 30,
                                                                // width: 100,
                                                                borderRadius: 15,
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                GROUP
                                                            </Text>
                                                        </TouchableOpacity>
                                                        : null
                                                }
                                                {
                                                    editFolderChannelId === key.split('-SPLIT-')[1] ?
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setCueIds([])
                                                                setEditFolderChannelId('')
                                                                setFolderId('')
                                                            }}
                                                            style={{
                                                                backgroundColor: 'white',
                                                                overflow: 'hidden',
                                                                height: 35,
                                                                justifyContent: 'center',
                                                                flexDirection: 'row'
                                                            }}>
                                                            <Text style={{
                                                                textAlign: 'center',
                                                                lineHeight: 30,
                                                                color: '#1D1D20',
                                                                fontSize: 12,
                                                                backgroundColor: '#f5f5f7',
                                                                paddingHorizontal: 25,
                                                                marginRight: 15,
                                                                fontFamily: 'inter',
                                                                height: 30,
                                                                borderRadius: 15,
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                CANCEL
                                                            </Text>
                                                        </TouchableOpacity>
                                                        : null
                                                }
                                                {
                                                    key.split('-SPLIT-')[2] === userId ?
                                                        <TouchableOpacity
                                                            style={{ marginRight: 20 }}
                                                            onPress={() => {
                                                                props.setChannelFilterChoice('All')
                                                                props.handleFilterChange(key.split('-SPLIT-')[0])
                                                                props.setChannelId(key.split('-SPLIT-')[1])
                                                                props.setChannelCreatedBy(key.split('-SPLIT-')[2])
                                                                props.openChannelSettings()
                                                                props.hideHome()
                                                            }}
                                                        >
                                                            <Text style={styles.channelText}>
                                                                <Ionicons
                                                                    name='hammer-outline' size={19} color={'#1D1D20'} />
                                                            </Text>
                                                            <Text style={{ fontSize: 10, color: '#1D1D20', textAlign: 'center' }}>
                                                                Settings
                                                            </Text>
                                                        </TouchableOpacity>
                                                        : null
                                                }
                                                <TouchableOpacity
                                                    style={{ marginRight: 20, backgroundColor: '#fff' }}
                                                    onPress={() => {
                                                        props.setChannelFilterChoice('All')
                                                        props.handleFilterChange(key.split('-SPLIT-')[0])
                                                        props.setChannelId(key.split('-SPLIT-')[1])
                                                        props.setChannelCreatedBy(key.split('-SPLIT-')[2])
                                                        props.openMeeting()
                                                        props.hideHome()
                                                    }}>
                                                    <Text style={styles.channelText}>
                                                        <Ionicons
                                                            name='chatbubbles-outline' size={19} color={'#1D1D20'} />
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: '#1D1D20', textAlign: 'center' }}>
                                                        Classroom
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                        tempCollapse[key] = !collapseMap[key]
                                                        setCollapseMap(tempCollapse)
                                                    }}
                                                >
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        lineHeight: 35
                                                    }}>
                                                        <Ionicons name={collapseMap[key] ? 'chevron-up-outline' : 'chevron-down-outline'} size={30} color={'#1D1D20'} />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View> : <View style={{ paddingBottom: 20, flexDirection: 'row', }}>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row'
                                            }}
                                            onPress={() => {
                                                const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                tempCollapse[key] = !collapseMap[key]
                                                setCollapseMap(tempCollapse)
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 24,
                                                paddingBottom: 20,
                                                paddingTop: 10,
                                                fontFamily: 'inter',
                                                flex: 1,
                                                lineHeight: 23,
                                                color: '#661CB0'
                                            }}>
                                                <View style={{
                                                    width: 18,
                                                    height: 18,
                                                    marginRight: 10,
                                                    borderRadius: 9,
                                                    marginTop: 1,
                                                    backgroundColor: '#1D1D20'
                                                }} /> {key}
                                            </Text>
                                        </TouchableOpacity>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: '#fff', paddingTop: 10 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: '#fff' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                        tempCollapse[key] = !collapseMap[key]
                                                        setCollapseMap(tempCollapse)
                                                    }}
                                                >
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        lineHeight: 35
                                                    }}>
                                                        <Ionicons name={collapseMap[key] ? 'chevron-up-outline' : 'chevron-down-outline'} size={30} color={'#1D1D20'} />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                            }
                            <View style={{ flexDirection: 'row' }} key={editFolderChannelId.toString() + cueIds.toString() + cueMap.toString()}>
                                {
                                    cueMap[key].length === 0 && collapseMap[key] ?
                                        <Text style={{ fontSize: 15, color: '#818385', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff' }}>
                                            {PreferredLanguageText('noCuesCreated')}
                                        </Text> :
                                        (
                                            collapseMap[key] ?
                                                <ScrollView
                                                    horizontal={true}
                                                    style={{ width: '100%' }}
                                                    key={editFolderChannelId.toString() + cueIds.toString() + cueMap.toString()}>
                                                    {
                                                        categoryMap[key].map((category: any, i: any) => {
                                                            return <View style={{
                                                                width: '100%',
                                                                maxWidth: 250,
                                                                marginRight: 25
                                                            }}>
                                                                <View style={{ backgroundColor: '#fff', paddingLeft: 23, marginBottom: 20 }}>
                                                                    <Text style={{
                                                                        flex: 1, flexDirection: 'row',
                                                                        color: '#818385',
                                                                        fontSize: 20, lineHeight: 25,
                                                                        fontFamily: 'inter'
                                                                    }} ellipsizeMode='tail'>
                                                                        {category === '' ? ' ' : category}
                                                                    </Text>
                                                                </View>
                                                                <View
                                                                    // showsVerticalScrollIndicator={false}
                                                                    // horizontal={true}
                                                                    // style={{ height: '100%' }}
                                                                    style={{
                                                                        // borderWidth: 1,

                                                                        // height: 190
                                                                    }}
                                                                    key={i.toString() + key.toString()}
                                                                >
                                                                    {cueMap[key].map((cue: any, index: any) => {
                                                                        if (cue.customCategory.toString().trim() !== category.toString().trim()) {
                                                                            return null
                                                                        }
                                                                        if (cue.folderId && folderId !== cue.folderId) {
                                                                            if (folderIdsMap[cue.folderId][0] !== index) {
                                                                                return null
                                                                            } else {
                                                                                // return swiper
                                                                                return <View style={{ width: 170, height: 190, alignSelf: 'flex-end', marginTop: 0 }}>
                                                                                    <Swiper
                                                                                        controlsProps={{
                                                                                            nextTitle: '>',
                                                                                            prevTitle: '<',
                                                                                            prevTitleStyle: {
                                                                                                marginTop: 20,
                                                                                                fontFamily: 'inter',
                                                                                                color: '#661CB0'
                                                                                            },
                                                                                            nextTitleStyle: {
                                                                                                marginTop: 20,
                                                                                                fontFamily: 'inter',
                                                                                                color: '#661CB0'
                                                                                            },
                                                                                            dotsWrapperStyle: {
                                                                                                marginTop: 19
                                                                                            },
                                                                                            dotActiveStyle: {
                                                                                                backgroundColor: '#661CB0'
                                                                                            }
                                                                                        }}
                                                                                        containerStyle={{
                                                                                            height: 150,
                                                                                            marginRight: 20,
                                                                                            marginBottom: 20,
                                                                                            width: 150,
                                                                                            backgroundColor: '#fff',
                                                                                            alignSelf: 'center'
                                                                                        }}
                                                                                        // swipeAreaStyle={{ width: 150, maxWidth: 150 }}
                                                                                        // innerContainerStyle={{ width: 150 }}
                                                                                        // slideWrapperStyle={{ width: 150 }}
                                                                                        vertical={false}
                                                                                    >
                                                                                        {
                                                                                            folderIdsMap[cue.folderId].map((ind: any) => {
                                                                                                const swiperCue = cueMap[key][ind]
                                                                                                return <OverviewCueCard
                                                                                                    cueIds={cueIds}
                                                                                                    editFolderChannelId={editFolderChannelId}
                                                                                                    onLongPress={() => onSwiperLongPress(cue, key, swiperCue)}
                                                                                                    add={() => {
                                                                                                        const temp = JSON.parse(JSON.stringify(cueIds))
                                                                                                        const found = temp.find((i: any) => {
                                                                                                            return i === swiperCue._id
                                                                                                        })
                                                                                                        if (!found) {
                                                                                                            temp.push(swiperCue._id)
                                                                                                        }
                                                                                                        setCueIds(temp)
                                                                                                    }}
                                                                                                    remove={() => {
                                                                                                        const temp = JSON.parse(JSON.stringify(cueIds))
                                                                                                        const upd = temp.filter((i: any) => {
                                                                                                            return i !== swiperCue._id
                                                                                                        })
                                                                                                        setCueIds(upd)
                                                                                                    }}
                                                                                                    fadeAnimation={props.fadeAnimation}
                                                                                                    updateModal={() => {
                                                                                                        props.openUpdate(
                                                                                                            swiperCue.key,
                                                                                                            swiperCue.index,
                                                                                                            0,
                                                                                                            swiperCue._id,
                                                                                                            (swiperCue.createdBy ? swiperCue.createdBy : ''),
                                                                                                            (swiperCue.channelId ? swiperCue.channelId : '')
                                                                                                        )
                                                                                                    }}
                                                                                                    cue={swiperCue}
                                                                                                    channelId={props.channelId}
                                                                                                    subscriptions={props.subscriptions}
                                                                                                />
                                                                                            })
                                                                                        }
                                                                                    </Swiper>
                                                                                </View>
                                                                            }
                                                                        }
                                                                        return <View style={{
                                                                            // height: 150,
                                                                            marginBottom: 20,
                                                                            // marginBottom: i === priorities.length - 1 ? 0 : 20,
                                                                            // maxWidth: 150,
                                                                            backgroundColor: '#fff',
                                                                            width: '100%'
                                                                        }}
                                                                            key={index}
                                                                        >
                                                                            <Card
                                                                                gray={true}
                                                                                cueIds={cueIds}
                                                                                onLongPress={() => {
                                                                                    setCueIds([])
                                                                                    setEditFolderChannelId(cue.channelId ? cue.channelId : 'My Notes')
                                                                                    // alert(cue.channelId ? cue.channelId : 'My Notes')
                                                                                }}
                                                                                add={() => {
                                                                                    const temp = JSON.parse(JSON.stringify(cueIds))
                                                                                    const found = temp.find((i: any) => {
                                                                                        return i === cue._id
                                                                                    })
                                                                                    if (!found) {
                                                                                        temp.push(cue._id)
                                                                                    }
                                                                                    setCueIds(temp)
                                                                                }}
                                                                                remove={() => {
                                                                                    const temp = JSON.parse(JSON.stringify(cueIds))
                                                                                    const upd = temp.filter((i: any) => {
                                                                                        return i !== cue._id
                                                                                    })
                                                                                    setCueIds(upd)
                                                                                }}
                                                                                editFolderChannelId={editFolderChannelId}
                                                                                fadeAnimation={props.fadeAnimation}
                                                                                updateModal={() => {
                                                                                    props.openUpdate(
                                                                                        cue.key,
                                                                                        cue.index,
                                                                                        0,
                                                                                        cue._id,
                                                                                        (cue.createdBy ? cue.createdBy : ''),
                                                                                        (cue.channelId ? cue.channelId : '')
                                                                                    )
                                                                                }}
                                                                                cue={cue}
                                                                                channelId={props.channelId}
                                                                                subscriptions={props.subscriptions}
                                                                            />
                                                                        </View>
                                                                    })}
                                                                </View>
                                                            </View>
                                                        })
                                                    }
                                                </ScrollView> : null
                                        )
                                }
                            </View>
                        </View>
                    })
                }
            </ScrollView>
        </View>
    </View>

    const width = Dimensions.get("window").width;
    const windowHeight =
        width < 1024 ? Dimensions.get("window").height - 30 : Dimensions.get("window").height;

    return (
        <View style={{
            height: windowHeight - 85,
            maxHeight: '100%',
        }}>
            <View style={{
                backgroundColor: '#f5f5f7',
                borderColor: '#f5f5f7',
                borderBottomWidth: 1,
                // borderWidth: 1,
                paddingTop: 20,
                paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 40,
                flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                // flex: 1, 
                paddingBottom: 0,
                width: '100%',
            }}>
                <View style={{ flexDirection: 'row', flex: 1, backgroundColor: '#f5f5f7', }}>
                    <Image
                        source={logo}
                        style={{
                            width: 80,
                            height: 24
                        }}
                        resizeMode={'contain'}
                    />
                    {
                        Dimensions.get('window').width < 768 ?
                            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', backgroundColor: '#f5f5f7', }}>
                                <Menu
                                    onSelect={(op: any) => props.setOption(op)}>
                                    <MenuTrigger style={{ flexDirection: 'row' }}>
                                        <Text style={{
                                            color: '#1D1D20',
                                            paddingLeft: 10,
                                            textTransform: 'uppercase',
                                            flexDirection: 'row',
                                            lineHeight: 14,
                                            fontSize: 14, marginTop: 3, fontFamily: 'inter'
                                        }}>
                                            {props.option}
                                        </Text>
                                        <Text style={{ color: '#1D1D20', paddingLeft: 10, flexDirection: 'row', lineHeight: 14, fontSize: 14, marginTop: 2 }}>
                                            <Ionicons name='menu-outline' size={25} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f5f5f7',
                                            overflow: 'scroll',
                                            maxHeight: '100%',
                                        }
                                    }}>
                                        {
                                            props.options.map((op: any) => {
                                                return <MenuOption
                                                    value={op}>
                                                    <Text style={{ textTransform: 'uppercase' }}>
                                                        {op}
                                                    </Text>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            : <View style={{ flexDirection: 'row', paddingLeft: 30, flex: 1, backgroundColor: '#f5f5f7' }}>
                                {
                                    props.options.map((op: any) => {
                                        if (op === 'Settings' || op === 'Channels') {
                                            return
                                        }
                                        return <TouchableOpacity
                                            style={{
                                                backgroundColor: '#f5f5f7'
                                            }}
                                            onPress={() => props.setOption(op)}>
                                            <Text style={op === props.option ? styles.allGrayFill : styles.all}>
                                                {op}
                                            </Text>
                                        </TouchableOpacity>
                                    })
                                }
                            </View>
                    }
                </View>
                <View style={{
                    flexDirection: 'row',
                    width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                    justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end',
                    marginTop: Dimensions.get('window').width < 768 ? 25 : 0,
                    // flex: Dimensions.get('window').width < 768 ? 1 : 0,
                    // borderWidth: 1,
                    backgroundColor: '#f5f5f7'
                }}>
                    {/* {
                        width < 768 ? <Ionicons name='search-outline' size={20} color='#1D1D20'
                            style={{
                                marginLeft: Dimensions.get('window').width < 768 ? 0 : 40,
                                marginTop: 0
                            }}
                        /> : null
                    } */}
                    {
                        width < 768 ? <TextInput
                            value={searchTerm}
                            style={{
                                // width: "100%",
                                borderColor: "#bbbbbb",
                                borderBottomWidth: 1,
                                fontSize: 15,
                                padding: 5,
                                paddingVertical: 12,
                                marginTop: -25,
                                flex: 1, flexDirection: 'row',
                                marginLeft: 10,
                                marginRight: 20,
                                // width: 175,
                                // maxWidth: 150,
                                // borderWidth: 1,
                                // marginLeft: 5,
                            }}
                            placeholder={"🔍"}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={"#818385"}
                        /> : null
                    }
                    {props.option === 'Home' || props.option === 'Content' ?
                        <Menu
                            style={{ flex: 1 }}
                            onSelect={(category: any) => {
                            }}>
                            <MenuTrigger>
                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#1D1D20', paddingTop: 5, textAlign: 'right' }}>
                                    Filter <Ionicons name="caret-down" size={14} />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#f5f5f7',
                                    overflow: 'scroll',
                                    maxHeight: '100%'
                                }
                            }}>
                                {(props.option === 'Content' ? <MenuOption
                                    // disabled={true}
                                    // style={{ height: 300 }}
                                    value={'1'}>
                                    <Menu
                                        // style={{ height: 300 }}
                                        onSelect={(category: any) => {
                                            setSortBy(category)
                                        }}>
                                        <MenuTrigger>
                                            <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#1D1D20' }}>
                                                {sortBy}<Ionicons name='caret-down' size={15} />
                                            </Text>
                                            <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 7, backgroundColor: '#fff' }}>
                                                Sort By
                                            </Text>
                                        </MenuTrigger>
                                        <MenuOptions customStyles={{
                                            optionsContainer: {
                                                padding: 10,
                                                borderRadius: 15,
                                                shadowOpacity: 0,
                                                borderWidth: 1,
                                                borderColor: '#f5f5f7',
                                                overflow: 'scroll',
                                                maxHeight: '100%'
                                            }
                                        }}>
                                            <MenuOption
                                                value={'Priority'}>
                                                <Text>
                                                    Priority
                                                </Text>
                                            </MenuOption>
                                            <MenuOption
                                                value={'Date ↑'}>
                                                <Text>
                                                    Date ↑
                                                </Text>
                                            </MenuOption>
                                            <MenuOption
                                                value={'Date ↓'}>
                                                <Text>
                                                    Date ↓
                                                </Text>
                                            </MenuOption>
                                        </MenuOptions>
                                    </Menu>
                                </MenuOption>
                                    : null
                                )
                                }
                                {
                                    props.option === 'Content' || props.option === 'Home' ? <MenuOption
                                        disabled={true}
                                        value={'2'}>
                                        <DateRangePicker
                                            // key={Math.random()}
                                            preventOverflow={true}
                                            size={'sm'}
                                            appearance={'subtle'}
                                            placeholder={'Filter  '}
                                            onChange={(e: any) => {
                                                if (e[0] > e[1]) {
                                                    alert('End date must be greater')
                                                    return
                                                }
                                                else {
                                                    setFilterStart(e[0])
                                                    setFilterEnd(e[1])
                                                }
                                            }}
                                            defaultShow={true}
                                            showOneCalendar={true}
                                            value={[
                                                filterStart,
                                                filterEnd
                                            ]}
                                            style={{
                                                marginTop: -4,
                                                marginRight: width < 768 ? -20 : 0,
                                                // alignSelf: 'flex-end'
                                                // paddingLeft: 40
                                            }}
                                        />
                                    </MenuOption>
                                        : null
                                }
                            </MenuOptions>
                        </Menu> : <View style={{ width: 80, right: 0, backgroundColor: '#f5f5f7' }} />
                    }
                    {
                        width < 768 ? null : <TextInput
                            value={searchTerm}
                            style={{
                                // width: "100%",
                                borderColor: "#bbbbbb",
                                borderBottomWidth: 1,
                                fontSize: 15,
                                padding: 5,
                                paddingVertical: 12,
                                marginTop: -25,
                                flex: 1, flexDirection: 'row',
                                marginLeft: 40,
                                marginRight: 40
                            }}
                            placeholder={"🔍"}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={"#818385"}
                        />
                    }
                    {
                        width < 768 ? null : <Menu
                            style={{ marginLeft: 0, right: 0, marginTop: -7 }}
                            onSelect={(op: any) => props.setOption(op)}>
                            <MenuTrigger>
                                <Image
                                    style={{
                                        height: 40,
                                        width: 40,
                                        marginBottom: 5,
                                        borderRadius: 75,
                                    }}
                                    source={{ uri: avatar ? avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                />
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#f5f5f7',
                                    overflow: 'scroll',
                                    maxHeight: '100%'
                                }
                            }}>
                                <MenuOption
                                    value={'Channels'}>
                                    <Text>
                                        CHANNELS
                                    </Text>
                                </MenuOption>
                                <MenuOption
                                    value={'Settings'}>
                                    <Text>
                                        ACCOUNT
                                    </Text>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                    }
                </View>
            </View>
            {
                searchTerm === '' ? <View style={{
                    // paddingTop: Dimensions.get('window').width < 1024 ? 15 : 30,
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 40
                }}>
                    {
                        props.option === 'Settings' ?
                            <Walkthrough
                                closeModal={() => props.hideHome()}
                                saveDataInCloud={() => props.saveDataInCloud()}
                                reOpenProfile={() => props.reOpenProfile()}
                                reloadData={() => props.reloadData()}
                            /> : null
                    }
                    {
                        props.option === 'Channels' ?
                            <Channels
                                closeModal={() => props.hideHome()}
                            /> : null
                    }
                    {
                        props.option === 'Content' ?
                            overview : null
                    }
                    {
                        props.option === 'Home' ?
                            <CalendarX
                                filterStart={filterStart}
                                filterEnd={filterEnd}
                                cues={props.calendarCues}
                                subscriptions={props.subscriptions}
                                openCueFromCalendar={props.openCueFromCalendar}
                                openDiscussion={props.openDiscussionFromActivity}
                                openChannel={props.openChannelFromActivity}
                                openQA={props.openQAFromActivity}
                            /> : null
                    }
                    {
                        props.option === 'Performance' ?
                            <Performance
                                onPress={(name: any, id: any, createdBy: any) => {
                                    props.setChannelFilterChoice('All')
                                    props.handleFilterChange(name)
                                    props.setChannelId(id)
                                    props.setChannelCreatedBy(createdBy)
                                    props.openGrades()
                                    props.hideHome()
                                }}
                                filterStart={filterStart}
                                filterEnd={filterEnd}
                                subscriptions={props.subscriptions}
                            /> : null
                    }
                    {
                        props.option === 'Inbox' ?
                            <Inbox
                                subscriptions={props.subscriptions}
                            /> : null
                    }
                </View> : searchResults

            }
        </View>
    );
}


export default Dashboard

const styleObject: any = () => StyleSheet.create({
    all: {
        fontSize: 13,
        color: '#1D1D20',
        height: 24,
        paddingHorizontal: 20,
        backgroundColor: '#f5f5f7',
        lineHeight: 24,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    allGrayFill: {
        fontSize: 13,
        color: '#fff',
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#1D1D20',
        lineHeight: 24,
        height: 24,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    col: {
        width: '100%',
        height: 80,
        marginBottom: 15,
        backgroundColor: 'white'
    },
    channelText: {
        // paddingTop: 1
        lineHeight: 21,
        textAlign: 'center'
    }
});
