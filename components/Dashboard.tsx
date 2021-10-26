import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Image, Dimensions, Linking, ScrollView, Platform } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import { creatFolder, updateFolder, checkChannelStatus, subscribe, markAttendance, meetingRequest } from '../graphql/QueriesAndMutations';
import Walkthrough from './Walkthrough';
import Channels from './Channels';
import Create from './Create';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import CalendarX from './Calendar';
import { TextInput } from "./CustomTextInput";
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
import Discussion from './Discussion';
import Meeting from './Meeting';
import ChannelSettings from './ChannelSettings';

import { Datepicker, Select, Popup } from '@mobiscroll/react5'
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import axios from 'axios';

import logo from '../components/default-images/cues-logo-white-exclamation-hidden.jpg'


const Dashboard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const styles = styleObject()
    const [userId, setUserId] = useState('')
    const [avatar, setAvatar] = useState('')

    const scrollViewRef: any = useRef(null);

    const [searchTerm, setSearchTerm] = useState('')
    const [collapseMap, setCollapseMap] = useState<any>({})
    const [results, setResults] = useState<any>({
        'Channels': [],
        'Classroom': [],
        'Messages': [],
        'Threads': []
    })
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);

    const [filterStart, setFilterStart] = useState<any>(null)
    const [filterEnd, setFilterEnd] = useState<any>(null)

    const [searchOptions] = useState(['Classroom', 'Messages', 'Threads', 'Channels',])
    const [sortBy, setSortBy] = useState('Date ↑')

    const [cueMap, setCueMap] = useState<any>({})
    const [categoryMap, setCategoryMap] = useState<any>({})
    const [selectedCategories, setSelectedCategories] = useState<any>({})

    const [editFolderChannelId, setEditFolderChannelId] = useState('')
    const [cueIds, setCueIds] = useState<any[]>([])
    const [folderIdsMap, setFolderIdsMap] = useState<any>({})
    const [folderId, setFolderId] = useState('')

    const [filterByChannel, setFilterByChannel] = useState("All");
    const [indexMap, setIndexMap] = useState<any>({})
    const [channelKeyList, setChannelKeyList] = useState<any[]>([])
    const [channelHeightList, setChannelHeightList] = useState<any[]>([])

    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');
    const invalidChannelNameAlert = PreferredLanguageText('invalidChannelName');
    const nameAlreadyInUseAlert = PreferredLanguageText('nameAlreadyInUse');

    const [activityChannelId, setActivityChannelId] = useState<any>('')
    const [filterEventsType, setFilterEventsType] = useState('All');
    const [showFilterPopup, setShowFilterPopup] = useState(false);

    const [loadDiscussionForChannelId, setLoadDiscussionForChannelId] = useState();
    const [openChannelId, setOpenChannelId] = useState('');

    const openThreadFromSearch = useCallback((channelId: String) => {

        if (scrollViewRef && scrollViewRef.current !== null && channelKeyList && channelKeyList.length > 0 && channelHeightList && channelHeightList.length > 0) {

            let matchIndex = -1;

            channelKeyList.map((key: any, index: number) => {
                if (key === channelId) {
                    matchIndex = index;
                }
            })

            let indexMapKey = "";

            Object.keys(indexMap).map((key: any,) => {
                if (key.split("-SPLIT-")[1] === channelId) {
                    indexMapKey = key
                }
            })


            if (matchIndex === -1 || !channelHeightList[matchIndex] || indexMapKey === "") {
                Alert("Cannot open discussion.");
            };

            const temp = JSON.parse(JSON.stringify(indexMap))
            temp[indexMapKey] = 2
            setIndexMap(temp)

            const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
            tempCollapse[indexMapKey] = !collapseMap[indexMapKey]
            setCollapseMap(tempCollapse)

            scrollViewRef.current.scrollTo({
                x: 0,
                y: channelHeightList[matchIndex],
                animated: true,
            })

        }

    }, [scrollViewRef.current, channelKeyList, channelHeightList, indexMap])

    useEffect(() => {
        setLoadDiscussionForChannelId(props.loadDiscussionForChannelId)
    }, [props.loadDiscussionForChannelId])

    useEffect(() => {
        setOpenChannelId(props.openChannelId)
    }, [props.openChannelId])

    useEffect(() => {
        if (scrollViewRef && scrollViewRef.current !== null && channelKeyList && channelKeyList.length > 0 && channelHeightList && channelHeightList.length > 0 && openChannelId !== "") {
            let matchIndex = -1;

            channelKeyList.map((key: any, index: number) => {
                if (key === openChannelId) {
                    matchIndex = index;
                }
            })

            let indexMapKey = "";

            Object.keys(indexMap).map((key: any) => {
                if (key.split("-SPLIT-")[1] === openChannelId) {
                    indexMapKey = key
                }
            })

            if (matchIndex === -1 || !channelHeightList[matchIndex] || !openChannelId) return;

            const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
            tempCollapse[indexMapKey] = !collapseMap[indexMapKey]
            setCollapseMap(tempCollapse)


            scrollViewRef.current.scrollTo({
                x: 0,
                y: channelHeightList[matchIndex],
                animated: true,
            })

            setOpenChannelId('')
        }

    }, [scrollViewRef.current, channelKeyList, channelHeightList, loadDiscussionForChannelId])

    useEffect(() => {

        if (scrollViewRef && scrollViewRef.current !== null && channelKeyList && channelKeyList.length > 0 && channelHeightList && channelHeightList.length > 0 && loadDiscussionForChannelId !== "") {

            let matchIndex = -1;

            channelKeyList.map((key: any, index: number) => {
                if (key === loadDiscussionForChannelId) {
                    matchIndex = index;
                }
            })

            let indexMapKey = "";

            Object.keys(indexMap).map((key: any) => {
                if (key.split("-SPLIT-")[1] === loadDiscussionForChannelId) {
                    indexMapKey = key
                }
            })

            if (matchIndex === -1 || !channelHeightList[matchIndex] || indexMapKey === "" || !loadDiscussionForChannelId) return;

            const temp = JSON.parse(JSON.stringify(indexMap))
            temp[indexMapKey] = 2
            setIndexMap(temp)

            const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
            tempCollapse[indexMapKey] = !collapseMap[indexMapKey]
            setCollapseMap(tempCollapse)


            scrollViewRef.current.scrollTo({
                x: 0,
                y: channelHeightList[matchIndex],
                animated: true,
            })

            setLoadDiscussionForChannelId('')

        }

    }, [scrollViewRef.current, channelKeyList, channelHeightList, loadDiscussionForChannelId, indexMap])

    const handleEnterClassroom = useCallback(async () => {

        const u = await AsyncStorage.getItem('user')

        if (u) {
            const user = JSON.parse(u)
            if (user.zoomInfo) {

                // Zoom is connected
                const server = fetchAPI('')
                server.mutate({
                    mutation: meetingRequest,
                    variables: {
                        userId,
                        channelId: props.channelId,
                        isOwner: user._id.toString().trim() === props.channelCreatedBy
                    }
                }).then(res => {
                    console.log(res)
                    if (res.data && res.data.channel.meetingRequest !== 'error') {
                        server
                            .mutate({
                                mutation: markAttendance,
                                variables: {
                                    userId: userId,
                                    channelId: props.channelId
                                }
                            })
                        window.open(res.data.channel.meetingRequest, "_blank");
                    } else {
                        Alert("Classroom not in session. Waiting for instructor.")
                    }
                }).catch(err => {
                    Alert("Something went wrong.")
                })
            } else {

                Alert("Connect with Zoom to enter meeting.")

                // LIVE
                // const clientId = 'yRzKFwGRTq8bNKLQojwnA'
                // const redirectUri = 'https://web.cuesapp.co/zoom_auth'
                // DEV   
                const redirectUri = 'http://localhost:19006/zoom_auth'
                const clientId = 'PAfnxrFcSd2HkGnn9Yq96A'

                const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`

                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    Linking.openURL(url)
                } else {
                    window.open(url)
                }

            }
        } else {
            return
        }

    }, [userId, props.channelId, props.channelCreatedBy])

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
        temp['Home'] = []
        const tempCollapse: any = {}
        tempCollapse['Home'] = false
        const tempSelected: any = {}

        const tempFolders: any = {}

        const tempIndexes: any = {}

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
            tempIndexes[key] = 0
            if (!cat['']) {
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
                    cat[cue.customCategory] = 1
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

        temp['Home'] = mycues
        if (!cat['']) {
            delete cat['']
        }
        tempCat['Home'] = Object.keys(cat)
        tempSelected['Home'] = ''
        tempIndexes['Home'] = 0

        setCueMap(temp)
        setCollapseMap(tempCollapse)
        setCategoryMap(tempCat)
        setIndexMap(tempIndexes)
        setFolderIdsMap(tempFolders)
        setSelectedCategories(tempSelected)
    }, [sortBy, filterStart, filterEnd])

    // Using this architecture so that only the last request for search sets the loadingSearchResults to false -> Previous ones get cancelled
    let cancelTokenRef: any = useRef({});

    useEffect(() => {
        if (searchTerm.trim() === '') {
            return
        }

        setLoadingSearchResults(true);


        if (typeof cancelTokenRef.current != typeof undefined) {

            cancelTokenRef.current && cancelTokenRef.current.cancel && cancelTokenRef.current.cancel("Operation canceled due to new request.")
        }

        //Save the cancel token for the current request
        cancelTokenRef.current = axios.CancelToken.source()

        try {
            axios.post(`https://api.cuesapp.co/search`,
                {
                    term: searchTerm, userId
                },
                { cancelToken: cancelTokenRef.current.token }
            ).then((res: any) => {
                console.log(res.data)
                console.log(res.channels)
                const tempResults = {
                    'Classroom': [...res.data.personalCues, ...res.data.channelCues],
                    'Channels': res.data.channels,
                    'Threads': res.data.threads,
                    'Messages': res.data.messages
                }
                setResults(tempResults)
                setLoadingSearchResults(false);
            })

        } catch (error) {
            setLoadingSearchResults(false);
            console.log(error)
        }

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
        key={cueMap.toString() + JSON.stringify(results)}
        style={{
            flexDirection: 'row',
            height: Dimensions.get("window").width < 1024 ? Dimensions.get("window").height - 115 : Dimensions.get("window").height - 52,
            width: '100%',
            overflow: 'hidden',
            justifyContent: 'center',
        }}>
        <View style={{
            width: '100%',
            maxWidth: 900,
            paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0
        }}>
            <Text style={{
                fontSize: 20,
                paddingBottom: 10,
                paddingTop: 15,
                fontFamily: 'inter',
                // flex: 1,
                lineHeight: 23,
                color: '#3289d0'
            }}>
                <Ionicons name='search-outline' size={22} color="#343A40" />
            </Text>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={true}
                nestedScrollEnabled={true}
                contentContainerStyle={{
                    width: '100%',
                }}
            >
                {
                    (!loadingSearchResults && results && results[searchOptions[0]].length === 0 && results[searchOptions[1]].length === 0 && results[searchOptions[2]].length === 0 && results[searchOptions[3]].length === 0) ? <Text style={{
                        fontSize: 14,
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
                        <ActivityIndicator color={"#343A40"} />
                    </View> : null
                }
                <View style={{ flexDirection: 'row' }}>
                    {
                        searchOptions.map((option: any) => {

                            if (results[option].length === 0 || loadingSearchResults) {
                                return null
                            }

                            return <View style={{ marginRight: 20, backgroundColor: '#fff' }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#343A40',
                                    // fontWeight: 'bold',
                                    fontSize: 12, lineHeight: 25,
                                    fontFamily: 'inter',
                                    paddingBottom: 10
                                }}>
                                    {option}
                                </Text>
                                <ScrollView>
                                    {results[option].map((obj: any, index: any) => {

                                        let t = ''
                                        let s = ''
                                        let channelName = ''
                                        let colorCode = ''
                                        let subscribed = false;

                                        if (option === 'Classroom') {
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
                                            height: 70,
                                            marginBottom: 15,
                                            maxWidth: 175,
                                            backgroundColor: '#fff',
                                            alignSelf: 'center',
                                            width: 160
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
                                                    if (option === 'Classroom') {
                                                        props.openCueFromCalendar(obj.channelId, obj._id, obj.createdBy)
                                                        setSearchTerm("")
                                                    } else if (option === 'Threads') {

                                                        await AsyncStorage.setItem("openThread", obj.parentId && obj.parentId !== "" ? obj.parentId : obj._id)

                                                        if (obj.cueId && obj.cueId !== "") {

                                                            props.openQAFromSearch(obj.channelId, obj.cueId)

                                                        } else {

                                                            props.openDiscussionFromSearch(obj.channelId)


                                                            props.setLoadDiscussionForChannelId(obj.channelId)
                                                        }

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
                                                            props.openChannelFromActivity(obj._id)
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
                </View>
            </ScrollView>
        </View>
    </View>

    const tabs = ['Content', 'Meet', 'Discuss', 'Settings']

    const renderTabs = (key: any) => {

        const activeTab = tabs[indexMap[key]];

        return (<View style={{
            flexDirection: "row", marginBottom: 30,
            paddingTop: 10,
            backgroundColor: '#E7EBEE',
            flex: 1,
            justifyContent: 'center'
            //paddingVertical: 20 
        }}>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column",
                    backgroundColor: '#E7EBEE'
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(indexMap))
                    temp[key] = 0
                    setIndexMap(temp)
                }}>
                <Text style={activeTab === 'Content' ? styles.allGrayFill1 : styles.all1}>
                    <Ionicons name='library-outline' size={18} style={{ marginBottom: 5 }} />
                </Text>
                <Text style={activeTab === 'Content' ? styles.allGrayFill1 : styles.all1}>
                    Library
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column",
                    backgroundColor: '#E7EBEE'
                }}
                onPress={() => handleEnterClassroom()}>
                <Text style={activeTab === 'Meet' ? styles.allGrayFill1 : styles.all1}>
                    <Ionicons name='videocam-outline' size={18} />
                </Text>
                <Text style={activeTab === 'Meet' ? styles.allGrayFill1 : styles.all1}>
                    Meet
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column",
                    backgroundColor: '#E7EBEE'
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(indexMap))
                    temp[key] = 2
                    setIndexMap(temp)
                }}>
                <Text style={activeTab === 'Discuss' ? styles.allGrayFill1 : styles.all1}>
                    <Ionicons name='chatbubbles-outline' size={18} />
                </Text>
                <Text style={activeTab === 'Discuss' ? styles.allGrayFill1 : styles.all1}>
                    Discuss
                </Text>
            </TouchableOpacity>
            {
                key.split('-SPLIT-')[2] === userId ?
                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            flexDirection: "column",
                            backgroundColor: '#E7EBEE'
                        }}
                        onPress={() => {
                            const temp = JSON.parse(JSON.stringify(indexMap))
                            temp[key] = 3
                            setIndexMap(temp)
                        }}>
                        <Text style={activeTab === 'Settings' ? styles.allGrayFill1 : styles.all1}>
                            <Ionicons name='build-outline' size={18} />
                        </Text>
                        <Text style={activeTab === 'Settings' ? styles.allGrayFill1 : styles.all1}>
                            Settings
                        </Text>
                    </TouchableOpacity>
                    : null
            }
        </View>)
    }

    const onSwiperLongPress = useCallback((cue, key, swiperCue) => {
        const temp: any[] = []
        folderIdsMap[cue.folderId].map((i: any) => {
            temp.push(cueMap[key][i]._id)
        })
        setCueIds(temp)
        setFolderId(cue.folderId)
        setEditFolderChannelId(swiperCue.channelId ? swiperCue.channelId : 'Home')
    }, [folderIdsMap])

    const width = Dimensions.get("window").width;
    const windowHeight =
        width < 1024 ? Dimensions.get("window").height - 0 : Dimensions.get("window").height;

    const sortbyOptions = [
        {
            value: 'Date ↑',
            text: 'Date ↑'
        },
        {
            value: 'Date ↓',
            text: 'Date ↓'
        },
        {
            value: 'Priority',
            text: 'Priority'
        }
    ]

    const renderEventFilters = () => {

        const channelOptions = [{ value: 'All', text: 'All' }, { value: 'My Events', text: 'My Events' }]

        props.subscriptions.map((sub: any) => {
            channelOptions.push({
                value: sub.channelName,
                text: sub.channelName
            })
        })

        const typeOptions = [{ value: 'All', text: 'All' }, { value: 'Lectures', text: 'Lectures' }, { value: 'Submissions', text: 'Submissions' }, { value: 'Events', text: 'Events' }]

        return (<div style={{ display: 'flex', flexDirection: 'column', }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                <Text style={{ fontSize: 10, color: '#16181C', paddingLeft: 5, paddingBottom: 10 }}>
                    Channel
                </Text>
                <label style={{ width: 200 }}>
                    <Select
                        touchUi={true}
                        theme="ios"
                        themeVariant="light"
                        value={filterByChannel}
                        onChange={(val: any) => {
                            setFilterByChannel(val.value)
                        }}
                        responsive={{
                            small: {
                                display: 'bubble'
                            },
                            medium: {
                                touchUi: false
                            }
                        }}
                        dropdown={false}
                        data={channelOptions}
                    />
                </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>

                <Text style={{ fontSize: 10, color: '#16181C', paddingLeft: 5, paddingBottom: 10 }}>
                    Type
                </Text>

                <label style={{ width: 200 }}>
                    <Select
                        touchUi={true}
                        theme="ios"
                        themeVariant="light"
                        value={filterEventsType}
                        onChange={(val: any) => {
                            setFilterEventsType(val.value)
                        }}
                        responsive={{
                            small: {
                                display: 'bubble'
                            },
                            medium: {
                                touchUi: false
                            }
                        }}
                        dropdown={false}
                        data={typeOptions}
                    />

                </label>


            </div>


        </div>)
    }


    const overview = <View
        key={collapseMap.toString()}
        style={{
            flexDirection: 'row',
            // height: width < 1024 ? Dimensions.get("window").height - 120 : Dimensions.get("window").height,
            width: '100%',
            bottom: 0,
            // overflow: 'scroll'
        }}>
        {/* Add sort by filter here */}
        <ScrollView
            showsVerticalScrollIndicator={false}
            horizontal={false}
            contentContainerStyle={{
                width: '100%',
                maxHeight: width < 1024 ? Dimensions.get("window").height - 115 : Dimensions.get("window").height - 52,
                backgroundColor: '#fff'
            }}
            ref={scrollViewRef}
        >
            {
                Object.keys(cueMap).map((key: any, ind: any) => {

                    return <View
                        style={{
                            backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',
                            borderColor: '#E7EBEE',
                            borderTopWidth: ind !== 0 && collapseMap[key] ? 1 : 0,
                            // paddingBottom: 10,
                        }}
                        key={ind}
                        onLayout={(event) => {
                            const layout = event.nativeEvent.layout;
                            const temp1 = [...channelKeyList]
                            const temp2 = [...channelHeightList]
                            temp1[ind] = key.split('-SPLIT-')[1];
                            temp2[ind] = layout.y;
                            setChannelKeyList(temp1);
                            setChannelHeightList(temp2)
                        }}
                    >
                        {
                            ind !== 0 ?
                                <View style={{
                                    backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',
                                    flexDirection: 'row',
                                    borderColor: '#E7EBEE',
                                    paddingTop: 10,
                                    paddingHorizontal: width < 1024 && props.option === 'Classroom' ? 20 : 0,
                                    borderTopWidth: ind === 0 || collapseMap[key] || collapseMap[Object.keys(cueMap)[ind - 1]] ? 0 : 1,
                                    paddingBottom: 0, maxWidth: 900, alignSelf: 'center', width: '100%',
                                }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',
                                        }}
                                        onPress={() => {
                                            const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                            tempCollapse[key] = !collapseMap[key]
                                            setCollapseMap(tempCollapse)
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 16,
                                            paddingBottom: 15,
                                            paddingTop: 10,
                                            fontFamily: 'inter',
                                            flex: 1,
                                            backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',
                                            lineHeight: 16,
                                            color: collapseMap[key] ? '#16181C' : '#1a3026',
                                        }}>
                                            <View style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 9,
                                                // marginTop: 2,
                                                marginRight: 5,
                                                backgroundColor: key.split('-SPLIT-')[3]
                                            }} /> {key.split('-SPLIT-')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={{
                                        backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',
                                        paddingTop: 5, paddingLeft: 15
                                    }}>
                                        <View style={{
                                            flexDirection: 'row', justifyContent: 'center', display: 'flex',
                                            backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',

                                        }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                    tempCollapse[key] = !collapseMap[key]
                                                    setCollapseMap(tempCollapse)
                                                }}
                                                style={{ backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff', }}
                                            >
                                                <Text style={{
                                                    textAlign: 'center',
                                                    lineHeight: 30,
                                                    backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',

                                                }}>
                                                    <Ionicons name={collapseMap[key] ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={collapseMap[key] ? '#343A40' : '#3289d0'} />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View> : <View style={{
                                    paddingTop: 10,
                                    backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',
                                    flexDirection: 'row', paddingBottom: 0,
                                    paddingHorizontal: width < 1024 && props.option === 'Classroom' ? 20 : 0,
                                    maxWidth: 900, alignSelf: 'center', width: '100%'
                                }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',

                                        }}
                                        onPress={() => {
                                            const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                            tempCollapse[key] = !collapseMap[key]
                                            setCollapseMap(tempCollapse)
                                        }}
                                    >
                                        <Text
                                            ellipsizeMode='tail'
                                            style={{
                                                fontSize: 16,
                                                paddingBottom: 15,
                                                backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',
                                                paddingTop: 10,
                                                fontFamily: 'inter',
                                                flex: 1,
                                                lineHeight: 16,
                                                color: collapseMap[key] ? '#16181C' : '#343A40'
                                            }}>
                                            <View style={{
                                                width: 12,
                                                height: 12,
                                                marginRight: 5,
                                                borderRadius: 9,
                                                // marginTop: 2,
                                                backgroundColor: '#16181C'
                                            }} /> {key}
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={{
                                        flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',
                                        paddingTop: 5
                                    }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            paddingLeft: 7,
                                            justifyContent: 'center', display: 'flex', backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',

                                        }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                    tempCollapse[key] = !collapseMap[key]
                                                    setCollapseMap(tempCollapse)
                                                }}
                                                style={{ backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff' }}
                                            >
                                                <Text style={{
                                                    textAlign: 'center',
                                                    lineHeight: 30,
                                                    backgroundColor: collapseMap[key] ? '#E7EBEE' : '#fff',

                                                }}>
                                                    <Ionicons name={collapseMap[key] ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={collapseMap[key] ? '#343A40' : '#3289d0'} />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                        }
                        {collapseMap[key] && ind !== 0 ? renderTabs(key) : null}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#E7EBEE',
                            borderColor: '#E7EBEE',
                            borderBottomWidth: collapseMap[key] && ind !== Object.keys(cueMap).length - 1 ? 1 : 0,
                        }} key={collapseMap.toString()}>
                            <View style={{
                                width: '100%',
                                maxWidth: 900,
                                backgroundColor: '#E7EBEE',
                                paddingHorizontal: width < 1024 ? 20 : 0
                            }}>
                                {
                                    (
                                        collapseMap[key] ?
                                            <View
                                                style={{ width: '100%', paddingBottom: 25, backgroundColor: '#E7EBEE' }}
                                                key={editFolderChannelId.toString() + cueIds.toString() + cueMap.toString()}>
                                                {
                                                    indexMap[key] !== 0 ?
                                                        (
                                                            indexMap[key] === 1 ?
                                                                // meet
                                                                (
                                                                    <View
                                                                        style={{ width: '100%', maxWidth: 900, alignSelf: 'center' }}
                                                                    >
                                                                        <Meeting
                                                                            channelId={key.split('-SPLIT-')[1]}
                                                                            channelName={key.split('-SPLIT-')[0]}
                                                                            channelCreatedBy={key.split('-SPLIT-')}
                                                                            closeModal={() => { }}
                                                                            filterChoice={key.split('-SPLIT-')[0]}
                                                                        // refreshUnreadDiscussionCount={() => refreshUnreadDiscussionCount()}
                                                                        />
                                                                    </View>
                                                                ) :
                                                                // discuss
                                                                (
                                                                    indexMap[key] === 2 ?
                                                                        <Discussion
                                                                            channelId={key.split('-SPLIT-')[1]}
                                                                            filterChoice={key.split('-SPLIT-')[0]}
                                                                            channelCreatedBy={key.split('-SPLIT-')[2]}
                                                                            refreshUnreadDiscussionCount={() => props.refreshUnreadDiscussionCount()}
                                                                            channelColor={key.split('-SPLIT-')[3]}
                                                                        /> :
                                                                        // settings 
                                                                        // settings 
                                                                        // settings 
                                                                        // settings 
                                                                        // settings 
                                                                        // settings 
                                                                        // settings 
                                                                        <View
                                                                            style={{ 
                                                                                width: '100%', 
                                                                                maxWidth: 400, 
                                                                                alignSelf: 'center',
                                                                                borderTopRightRadius: 10,
                                                                                borderBottomRightRadius: 10
                                                                            }}
                                                                        >
                                                                            <ChannelSettings
                                                                                channelId={key.split('-SPLIT-')[1]}
                                                                                refreshSubscriptions={props.refreshSubscriptions}
                                                                                closeModal={() => {
                                                                                    // setShowHome(false)
                                                                                    // closeModal()
                                                                                }}
                                                                                channelColor={key.split('-SPLIT-')[3]}
                                                                            />
                                                                        </View>
                                                                )
                                                        ) :
                                                        cueMap[key].length === 0 ?
                                                            <Text style={{ width: '100%', color: '#343A40', fontSize: 20, paddingTop: 50, paddingBottom: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                                {PreferredLanguageText('noCuesCreated')}
                                                            </Text>
                                                            :
                                                            (<ScrollView
                                                                horizontal={true}
                                                                contentContainerStyle={{
                                                                    maxWidth: '100%', backgroundColor: '#E7EBEE',
                                                                }}
                                                                key={editFolderChannelId.toString() + cueIds.toString() + cueMap.toString()}>
                                                                {categoryMap[key].map((category: any, i: any) => {
                                                                    return <View style={{
                                                                        width: '100%',
                                                                        maxWidth: 150,
                                                                        backgroundColor: '#E7EBEE',
                                                                        marginRight: 15
                                                                    }}>
                                                                        <View style={{
                                                                            backgroundColor: '#E7EBEE',
                                                                            marginBottom: 10
                                                                        }}>
                                                                            <Text style={{
                                                                                flex: 1, flexDirection: 'row',
                                                                                color: '#343A40',
                                                                                fontWeight: 'bold',
                                                                                fontSize: width < 1024 ? 12 : 14, lineHeight: 25,
                                                                                // fontFamily: 'inter',
                                                                                backgroundColor: '#E7EBEE',
                                                                            }} ellipsizeMode='tail'>
                                                                                {category === '' ? ' ' : category}
                                                                            </Text>
                                                                        </View>
                                                                        <View
                                                                            style={{
                                                                                // borderWidth: 1,
                                                                                maxWidth: 150,
                                                                                backgroundColor: '#E7EBEE',
                                                                                width: '100%'
                                                                                // height: 190
                                                                            }}
                                                                            key={i.toString() + key.toString()}
                                                                        >
                                                                            {cueMap[key].map((cue: any, index: any) => {
                                                                                if (cue.customCategory.toString().trim() !== category.toString().trim()) {
                                                                                    return null
                                                                                }
                                                                                return <View style={{
                                                                                    // height: 150,
                                                                                    marginBottom: 15,
                                                                                    // marginBottom: i === priorities.length - 1 ? 0 : 20,
                                                                                    // maxWidth: 150,
                                                                                    backgroundColor: '#E7EBEE',
                                                                                    width: '100%',
                                                                                    maxWidth: 150,
                                                                                }}
                                                                                    key={index}
                                                                                >
                                                                                    <Card
                                                                                        gray={true}
                                                                                        cueIds={cueIds}
                                                                                        onLongPress={() => {
                                                                                            setCueIds([])
                                                                                            setEditFolderChannelId(cue.channelId ? cue.channelId : 'Home')
                                                                                            // alert(cue.channelId ? cue.channelId : 'Home')
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
                                                                })}</ScrollView>
                                                            )
                                                }
                                            </View> : null
                                    )
                                }
                            </View>
                        </View>
                    </View>
                })
            }
        </ScrollView >
    </View >

    return (
        <View style={{
            height: windowHeight,
            backgroundColor: props.option === 'To Do' ? '#e7ebee' : '#fff',
            // flexDirection: width < 1024 ? 'column-reverse' : 'column'
        }}>
            <View style={{
                backgroundColor: '#16181C',
                // borderColor: '#E7EBEE',
                borderBottomWidth: 2,
                overflow: 'hidden',
                paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0,
                flexDirection: 'row',
                justifyContent: 'center',
                // paddingBottom: 0,
                width: '100%',
                height: 52,
                paddingVertical: 2
            }}>
                <View style={{
                    flexDirection: 'row',
                    width: '100%',
                    maxWidth: 900, alignSelf: 'center',
                    backgroundColor: '#16181C',
                    paddingVertical: 10,
                    flex: 1,
                    height: 48
                }}>
                    {
                        Dimensions.get('window').width < 1024 ?
                            null :
                            <View style={{
                                flexDirection: 'row',
                                backgroundColor: '#16181C',
                                flex: 1,
                                height: 50,
                                paddingTop: 0
                            }}>
                                <Image
                                    source={logo}
                                    style={{
                                        width: 50,
                                        marginTop: 1,
                                        height: 22,
                                        marginRight: 13
                                    }}
                                    resizeMode={'contain'}
                                />
                                <View style={{ flexDirection: 'row', paddingRight: 30, flex: 1, backgroundColor: '#16181C', paddingTop: 1 }}>
                                    {
                                        props.options.map((op: any) => {
                                            if (op === 'Settings' || op === 'Channels') {
                                                return
                                            }
                                            return <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#16181C'
                                                }}
                                                onPress={() => {
                                                    if (op === 'To Do') {
                                                        setFilterEventsType('')
                                                        setFilterByChannel('')
                                                        setActivityChannelId('')
                                                    }
                                                    props.setOption(op)
                                                }}>
                                                <Text style={op === props.option ? styles.allGrayFill : styles.all}>
                                                    {op === 'Classroom' ? 'Workspace' : (
                                                        op === 'Performance' ? 'Performance' : (op === 'To Do' ? 'Agenda' : op)
                                                    )}
                                                </Text>
                                            </TouchableOpacity>
                                        })
                                    }
                                </View>
                            </View>
                    }
                    <View style={{
                        flexDirection: 'row',
                        // justifyContent: Dimensions.get('window').width < 1024 ? 'flex-start' : 'flex-end',
                        backgroundColor: '#16181C',
                        width: Dimensions.get('window').width < 1024 ? '100%' : 'auto',
                    }}>
                        {
                            Dimensions.get('window').width < 1024 ? <Image
                                source={logo}
                                style={{
                                    width: 50,
                                    marginTop: 5,
                                    height: 18,
                                    marginRight: 13
                                }}
                                resizeMode={'contain'}
                            /> : null
                        }
                        <TextInput
                            value={searchTerm}
                            style={{
                                // width: "100%",
                                color: '#fff',
                                backgroundColor: '#343A40',
                                borderColor: "#E7EBEE",
                                // borderWidth: 1,
                                borderRadius: 15,
                                fontSize: 12,
                                paddingBottom: 5,
                                paddingTop: 4,
                                paddingHorizontal: 16,
                                // paddingVertical: 8,
                                marginTop: -8,
                                marginRight: 2,
                                // flex: 1, flexDirection: 'row',
                                // marginLeft: 20,
                                // marginRight: 25,
                                maxWidth: 225
                            }}
                            placeholder={"Search"}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={"#fff"}
                        />
                        {
                            Dimensions.get('window').width < 1024 ?
                                <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#16181C' }} />
                                : null
                        }
                        {props.option === "To Do" || props.option === "Classroom" ?
                            <TouchableOpacity style={{ backgroundColor: 'none', marginLeft: 15 }} onPress={() => {
                                setShowFilterPopup(true)
                            }}>
                                <Text style={{
                                    fontSize: 11, color: '#E7EBEE',
                                    marginTop: 1,
                                    textAlign: 'right'
                                }}>
                                    <Ionicons name="filter-outline" size={18} />
                                </Text>

                            </TouchableOpacity> : null}
                        <Menu
                            style={{
                                marginLeft: 15,
                                right: 0,
                                // marginTop: -5
                                marginTop: 3
                            }}
                            onSelect={(op: any) => {
                                if (op === 'Settings') {
                                    props.setShowHelp(false)
                                }
                                props.setOption(op)
                            }}>
                            <MenuTrigger>
                                <Text>
                                    <Ionicons
                                        name={props.option === 'Settings' && !props.showHelp ? 'person-circle-outline' : (props.option === 'Channels' ? 'file-tray-stacked-outline' : "settings-outline")}
                                        size={16}
                                        color={(props.option === 'Settings' && !props.showHelp) || props.option === 'Channels' ? '#3289d0' : '#E7EBEE'} />
                                </Text>
                                {/* <Image
                                    style={{
                                        height: 29,
                                        width: 29,
                                        marginBottom: 8,
                                        marginTop: 7,
                                        borderRadius: 75,
                                        borderWidth: 1,
                                        borderColor: '#E7EBEE'
                                    }}
                                    source={{ uri: avatar ? avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                /> */}
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 5,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#E7EBEE',
                                    maxWidth: 150
                                }
                            }}>
                                <MenuOption
                                    value={'Channels'}>
                                    <Text style={{
                                        fontFamily: 'inter', fontSize: 14, fontWeight: 'bold',
                                        color: '#16181C'
                                    }}>
                                        &nbsp;WORKSPACES
                                    </Text>
                                </MenuOption>
                                <MenuOption
                                    value={'Settings'}>
                                    <Text style={{
                                        fontFamily: 'inter', fontSize: 14, fontWeight: 'bold',
                                        color: '#16181C'
                                    }}>
                                        &nbsp;ACCOUNT
                                    </Text>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                        <TouchableOpacity style={{ backgroundColor: 'none', marginLeft: 15 }} onPress={() => {
                            props.setShowHelp(true)
                            props.setOption('Settings')
                        }}>
                            <Text style={{
                                fontSize: 11, color: '#343A40',
                                marginTop: 1,
                                textAlign: 'right'
                            }}>
                                <Ionicons
                                    name="help-circle-outline"
                                    size={18}
                                    color={(props.option === 'Settings' && props.showHelp) ? '#3289d0' : '#E7EBEE'}
                                />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {
                searchTerm === '' ?
                    props.modalType === "Create" && props.option === 'Classroom' ? <Create
                        key={JSON.stringify(props.customCategories)}
                        customCategories={props.customCategories}
                        closeModal={() => props.closeCreateModal()}
                        closeOnCreate={() => props.closeOnCreate()}
                    />
                        :
                        <View style={{
                            // paddingBottom: Dimensions.get('window').width < 1024 ? 15 : 30,
                            paddingHorizontal: width < 1024 && props.option !== 'Classroom' ? 20 : 0,
                            maxWidth: props.option === 'Classroom' ? '100%' : 1000,
                            alignSelf: 'center',
                            width: '100%',
                            backgroundColor: props.option === 'To Do' ? '#e7ebee' : '#fff',
                            height: width < 1024 ? windowHeight - 104 : windowHeight - 52,
                            // overflow: 'scroll'
                        }}>
                            {
                                props.option === 'Settings' ?
                                    <Walkthrough
                                        closeModal={() => { }}
                                        saveDataInCloud={() => props.saveDataInCloud()}
                                        reOpenProfile={() => props.reOpenProfile()}
                                        reloadData={() => props.reloadData()}
                                        setShowHelp={(val: any) => props.setShowHelp(val)}
                                        showHelp={props.showHelp}
                                    /> : null
                            }
                            {
                                props.option === 'Channels' ?
                                    <Channels
                                        setShowCreate={(val: any) => props.setShowCreate(val)}
                                        showCreate={props.showCreate}
                                        closeModal={() => { }}
                                        subscriptions={props.subscriptions}
                                        refreshSubscriptions={props.refreshSubscriptions}
                                    /> : null
                            }
                            {
                                props.option === 'Classroom' ?
                                    overview : null
                            }
                            {
                                props.option === 'To Do' ?
                                    <CalendarX
                                        tab={props.tab}
                                        setTab={(val: any) => props.setTab(val)}
                                        filterStart={filterStart}
                                        filterEnd={filterEnd}
                                        cues={props.calendarCues}
                                        subscriptions={props.subscriptions}
                                        openCueFromCalendar={props.openCueFromCalendar}
                                        openDiscussion={props.openDiscussionFromActivity}
                                        openChannel={props.openChannelFromActivity}
                                        openQA={props.openQAFromActivity}
                                        filterByChannel={filterByChannel}
                                        activityChannelId={activityChannelId}
                                        filterEventsType={filterEventsType}
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
                                        openCueFromGrades={props.openCueFromCalendar}
                                    /> : null
                            }
                            {
                                props.option === 'Inbox' ?
                                    <Inbox
                                        showDirectory={props.showDirectory}
                                        setShowDirectory={(val: any) => props.setShowDirectory(val)}
                                        subscriptions={props.subscriptions}
                                    /> : null
                            }
                        </View> : searchResults
            }
            <Popup isOpen={showFilterPopup}
                buttons={[
                    {
                        text: 'OK',
                        handler: function (event) {
                            setShowFilterPopup(false)
                        }
                    },
                    {
                        text: 'RESET',
                        handler: function (event) {
                            setFilterStart(null)
                            setFilterEnd(null)
                            setFilterByChannel('All')
                            setFilterEventsType('All')
                            setShowFilterPopup(false)
                        }
                    },]}
                themeVariant="light"
                onClose={() => setShowFilterPopup(false)}
                responsive={{
                    small: {
                        display: 'bottom'
                    },
                    medium: { // Custom breakpoint
                        display: 'center'
                    },

                }}
            >
                {/* Show all the settings here */}
                <View style={{ flexDirection: 'column', padding: 25, backgroundColor: 'none' }} className="mbsc-align-center mbsc-padding">
                    {props.option === 'Classroom' ? <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                        <Text style={{ fontSize: 10, color: '#16181C', paddingLeft: 5, paddingBottom: 10 }}>
                            Sort By
                        </Text>

                        <label style={{ width: 200 }}>
                            <Select
                                touchUi={true}
                                theme="ios"
                                themeVariant="light"
                                value={sortBy}
                                onChange={(val: any) => {
                                    setSortBy(val.value)
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false
                                    }
                                }}
                                dropdown={false}
                                data={sortbyOptions}
                            />

                        </label>

                    </div> : null}

                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                        <Text style={{ fontSize: 10, color: '#16181C', paddingLeft: 5, paddingBottom: 10 }}>
                            Filter
                        </Text>

                        <label style={{ width: 200 }}>
                            <Datepicker
                                themeVariant="light"
                                controls={['calendar']}
                                select="range"
                                touchUi={true}
                                inputProps={{
                                    placeholder: 'Select'
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false,
                                    }
                                }}
                                value={[filterStart, filterEnd]}

                                onChange={(val: any) => {
                                    console.log("Selected", val)
                                    setFilterStart(val.value[0])
                                    setFilterEnd(val.value[1])
                                }}
                            />
                        </label>

                    </div>

                    {props.option === "To Do" ? renderEventFilters() : null}
                </View>
            </Popup>
        </View>
    );
}

export default React.memo(Dashboard, (prev, next) => {
    console.log("Previous", prev);
    console.log("Next", next)
    return _.isEqual(
        {
            ...prev.cues,
            ...prev.tab,
            ...prev.showDirectory,
            ...prev.showHelp,
            ...prev.modalType,

        },
        {
            ...next.cues,
            ...next.tab,
            ...next.showDirectory,
            ...next.showHelp,
            ...next.modalType,
        }
    )
});

// export default Dashboard

const styleObject: any = () => StyleSheet.create({
    all: {
        fontSize: 14,
        color: '#fff',
        height: 24,
        paddingHorizontal: 15,
        backgroundColor: '#16181C',
        lineHeight: 24,
        fontFamily: 'overpass',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    allGrayFill: {
        fontSize: 14,
        color: '#fff',
        paddingHorizontal: 15,
        borderRadius: 12,
        backgroundColor: '#3289d0',
        lineHeight: 24,
        height: 24,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    all1: {
        fontSize: 10,
        color: '#343A40',
        height: 20,
        // fontWeight: 'bold',
        paddingHorizontal: 7,
        backgroundColor: '#E7EBEE',
        // textTransform: 'uppercase',
        lineHeight: 20,
        fontFamily: 'inter',
        textAlign: 'center'
    },
    allGrayFill1: {
        fontSize: 10,
        color: '#3289d0',
        height: 20,
        // borderRadius: 15,
        // fontWeight: 'bold',
        paddingHorizontal: 7,
        // backgroundColor: '#3289d0',
        // textTransform: 'uppercase',
        lineHeight: 20,
        fontFamily: 'inter',
        textAlign: 'center'
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
