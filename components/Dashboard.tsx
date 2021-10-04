import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import Discussion from './Discussion';
import Meeting from './Meeting';
import ChannelSettings from './ChannelSettings';

import { Datepicker, Select, Popup } from '@mobiscroll/react'
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import axios from 'axios';



const Dashboard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {



    const styles = styleObject()
    const [userId, setUserId] = useState('')
    const [avatar, setAvatar] = useState('')

    const mobiRef: any = useRef(null);

    const deskMobiRef: any = useRef(null);

    const scrollViewRef: any = useRef(null);

    const [searchTerm, setSearchTerm] = useState('')
    const priorities = [4, 3, 2, 1, 0]
    const [collapseMap, setCollapseMap] = useState<any>({})
    const [channelCategories, setChannelCategories] = useState<any>({})
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
            
            Object.keys(indexMap).map((key: any, ) => {
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
            
            Object.keys(indexMap).map((key: any ) => {
                if (key.split("-SPLIT-")[1] === openChannelId) {
                    indexMapKey = key
                }
            })

            if (matchIndex === -1  || !channelHeightList[matchIndex] || !openChannelId) return;

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
            
            Object.keys(indexMap).map((key: any ) => {
                if (key.split("-SPLIT-")[1] === loadDiscussionForChannelId) {
                    indexMapKey = key
                }
            })

            if (matchIndex === -1  || !channelHeightList[matchIndex] || indexMapKey === "" || !loadDiscussionForChannelId) return;

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
        tempIndexes['My Notes'] = 0

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
            axios.get(
              `http://localhost:8081/search`,
              { cancelToken: cancelTokenRef.current.token, params: { term: searchTerm, userId } } //Pass the cancel token to the current request
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
        key={cueMap.toString()}
        style={{
            flexDirection: 'row',
            height: Dimensions.get("window").height - 80,
            width: '100%',
            overflow: 'hidden',
            justifyContent: 'center',
            paddingTop: 20
        }}>
        <View style={{
            width: '100%',
            maxWidth: 1275,
            paddingHorizontal: 20
        }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                contentContainerStyle={{
                    width: '100%',
                }}
            >
                <Text style={{
                    fontSize: 23,
                    paddingBottom: 20,
                    paddingTop: 10,
                    fontFamily: 'inter',
                    flex: 1,
                    lineHeight: 23,
                    color: '#007AFF'
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

                        return <View style={{ marginBottom: 20, backgroundColor: '#fff' }}>
                            <Text style={{
                                paddingBottom: 20,
                                // paddingTop: 10,
                                flex: 1,
                                backgroundColor: '#fff',
                                color: '#818385',
                                fontSize: 15,
                                lineHeight: 25,
                                fontFamily: 'inter'
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
                                        height: option === "Channels" ? 80 : 70,
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
            </ScrollView>
        </View>
    </View>

    const tabs = ['Content', 'Meet', 'Discuss', 'Settings']

    const renderTabs = (key: any) => {

        const activeTab = tabs[indexMap[key]];

        return (<View style={{ flexDirection: "row", flex: 1, justifyContent: 'center', marginBottom: 40, paddingVertical: 10 }}>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(indexMap))
                    temp[key] = 0
                    setIndexMap(temp)
                }}>
                <Text style={activeTab === 'Content' ? styles.allGrayFill1 : styles.all1}>
                    <Ionicons name='library-outline' size={20} />
                </Text>
                <Text style={activeTab === 'Content' ? styles.allGrayFill1 : styles.all1}>
                    Library
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(indexMap))
                    temp[key] = 1
                    setIndexMap(temp)
                }}>
                <Text style={activeTab === 'Meet' ? styles.allGrayFill1 : styles.all1}>
                    <Ionicons name='videocam-outline' size={20} />
                </Text>
                <Text style={activeTab === 'Meet' ? styles.allGrayFill1 : styles.all1}>
                    Meet
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(indexMap))
                    temp[key] = 2
                    setIndexMap(temp)
                }}>
                <Text style={activeTab === 'Discuss' ? styles.allGrayFill1 : styles.all1}>
                    <Ionicons name='chatbubbles-outline' size={20} />
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
                            flexDirection: "column"
                        }}
                        onPress={() => {
                            const temp = JSON.parse(JSON.stringify(indexMap))
                            temp[key] = 3
                            setIndexMap(temp)
                        }}>
                        <Text style={activeTab === 'Settings' ? styles.allGrayFill1 : styles.all1}>
                            <Ionicons name='hammer-outline' size={20} />
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
        setEditFolderChannelId(swiperCue.channelId ? swiperCue.channelId : 'My Notes')
    }, [folderIdsMap])

    const width = Dimensions.get("window").width;
    const windowHeight =
        width < 1024 ? Dimensions.get("window").height - 30 : Dimensions.get("window").height;

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

                <Text style={{ fontSize: 10, color: '#1D1D20', paddingLeft: 5, paddingBottom: 10 }}>
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

                <Text style={{ fontSize: 10, color: '#1D1D20', paddingLeft: 5, paddingBottom: 10 }}>
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
            height: width < 1024 ? Dimensions.get("window").height - 120 : Dimensions.get("window").height - 80,
            width: '100%',
            overflow: 'scroll'
        }}>
        {/* Add sort by filter here */}
        <View style={{ width: '100%' }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                contentContainerStyle={{
                    width: '100%'
                }}
                ref={scrollViewRef}
            >
                {
                    Object.keys(cueMap).map((key: any, ind: any) => {

                        return <View 
                            style={{
                                marginTop: 20, paddingBottom: 20,
                                borderColor: '#e8e8ea',
                                borderBottomWidth: 1,
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
                                    <View style={{ flexDirection: 'row', paddingBottom: !collapseMap[key] ? 0 : 20, maxWidth: 1275, alignSelf: 'center', width: '100%' }}>
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
                                                fontSize: 23,
                                                paddingBottom: 10,
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
                                                {/* {
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
                                                                backgroundColor: '#007aff',
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
                                                                backgroundColor: '#f7f7f7',
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
                                                            style={{ marginRight: 15 }}
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
                                                            <Text style={{ fontSize: 11, color: '#1D1D20', textAlign: 'center' }}>
                                                                Settings
                                                            </Text>
                                                        </TouchableOpacity>
                                                        : null
                                                }
                                                <TouchableOpacity
                                                    style={{ marginRight: 15, backgroundColor: '#fff' }}
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
                                                    <Text style={{ fontSize: 11, color: '#1D1D20', textAlign: 'center' }}>
                                                        Classroom
                                                    </Text>
                                                </TouchableOpacity> */}
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                        tempCollapse[key] = !collapseMap[key]
                                                        setCollapseMap(tempCollapse)
                                                    }}
                                                >
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        lineHeight: 30
                                                    }}>
                                                        <Ionicons name={collapseMap[key] ? 'chevron-up-outline' : 'chevron-down-outline'} size={25} color={'#007AFF'} />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View> : <View style={{ flexDirection: 'row', paddingBottom: !collapseMap[key] ? 0 : 20, maxWidth: 1275, alignSelf: 'center', width: '100%' }}>
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
                                                fontSize: 23,
                                                paddingBottom: 20,
                                                paddingTop: 10,
                                                fontFamily: 'inter',
                                                flex: 1,
                                                lineHeight: 23,
                                                color: '#007AFF'
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
                                                        lineHeight: 30
                                                    }}>
                                                        <Ionicons name={collapseMap[key] ? 'chevron-up-outline' : 'chevron-down-outline'} size={25} color={'#007AFF'} />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                            }
                            <View style={{ flexDirection: 'row', justifyContent: 'center' }} key={collapseMap.toString()}>
                                {
                                        (
                                            collapseMap[key] ?
                                                <View
                                                    style={{ width: '100%' }}
                                                    key={editFolderChannelId.toString() + cueIds.toString() + cueMap.toString()}>
                                                    {key !== 'My Notes' ? renderTabs(key) : null}
                                                    {
                                                        indexMap[key] !== 0 ?
                                                            (
                                                                indexMap[key] === 1 ?
                                                                    // meet
                                                                    (
                                                                        <Meeting
                                                                            channelId={key.split('-SPLIT-')[1]}
                                                                            channelName={key.split('-SPLIT-')[0]}
                                                                            channelCreatedBy={key.split('-SPLIT-')}
                                                                            closeModal={() => { }}
                                                                            filterChoice={key.split('-SPLIT-')[0]}
                                                                        // refreshUnreadDiscussionCount={() => refreshUnreadDiscussionCount()}
                                                                        />
                                                                    ) :
                                                                    // discuss
                                                                    (
                                                                        indexMap[key] === 2 ?
                                                                            <Discussion
                                                                                channelId={key.split('-SPLIT-')[1]}
                                                                                filterChoice={key.split('-SPLIT-')[0]}
                                                                                channelCreatedBy={key.split('-SPLIT-')[2]}
                                                                                refreshUnreadDiscussionCount={() => props.refreshUnreadDiscussionCount()}
                                                                            /> :
                                                                            // settings 
                                                                            <ChannelSettings
                                                                                channelId={key.split('-SPLIT-')[1]}
                                                                                refreshSubscriptions={props.refreshSubscriptions}
                                                                                closeModal={() => {
                                                                                    // setShowHome(false)
                                                                                    // closeModal()
                                                                                }}
                                                                            />
                                                                    )
                                                            ) :
                                                            cueMap[key].length === 0 ? 
                                                                <Text style={{ width: '100%', color: '#818385', fontSize: 23, paddingTop: 100, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                                    {PreferredLanguageText('noCuesCreated')}
                                                                </Text>
                                                            :
                                                             (<ScrollView
                                                                horizontal={true}
                                                                contentContainerStyle={{
                                                                    maxWidth: '100%'
                                                                }}
                                                                key={editFolderChannelId.toString() + cueIds.toString() + cueMap.toString()}>
                                                                {categoryMap[key].map((category: any, i: any) => {
                                                                    return <View style={{
                                                                        width: '100%',
                                                                        maxWidth: 210,
                                                                        marginRight: 25
                                                                    }}>
                                                                        <View style={{ backgroundColor: '#fff', paddingLeft: 23, marginBottom: 20 }}>
                                                                            <Text style={{
                                                                                flex: 1, flexDirection: 'row',
                                                                                color: '#818385',
                                                                                fontSize: 15, lineHeight: 25,
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
                                                                                maxWidth: 210,
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
                                                                                    marginBottom: 20,
                                                                                    // marginBottom: i === priorities.length - 1 ? 0 : 20,
                                                                                    // maxWidth: 150,
                                                                                    backgroundColor: '#fff',
                                                                                    width: '100%',
                                                                                    maxWidth: 210,
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
                                                                })}</ScrollView>
                                                            )
                                                    }
                                                </View> : null
                                        )
                                }
                            </View>
                        </View>
                    })
                }
            </ScrollView>
        </View>
    </View>


    return (
        <View style={{
            height: '100%',
            maxHeight: '100%'
        }}>
            <View style={{
                backgroundColor: '#f7f7f7',
                borderColor: '#e8e8ea',
                borderBottomWidth: 1,
                // borderWidth: 1,
                paddingTop: 20,
                paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 40,
                flexDirection: 'row',
                justifyContent: 'center',
                // flex: 1, 
                paddingBottom: 0,
                width: '100%',
            }}>
                <View style={{
                    flexDirection: 'row',
                    width: '100%',
                    maxWidth: 1275, alignSelf: 'center',
                    backgroundColor: '#f7f7f7',
                    flex: 1
                }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#f7f7f7', flex: 1 }}>
                        <Image
                            source={logo}
                            style={{
                                width: 50,
                                marginTop: Dimensions.get('window').width < 1024 ? 4 : 2,
                                height: 22,
                                marginRight: 0
                            }}
                            resizeMode={'contain'}
                        />
                        {
                            Dimensions.get('window').width < 1024 ?
                                null : <View style={{ flexDirection: 'row', paddingLeft: 30, flex: 1, backgroundColor: '#f7f7f7' }}>
                                    {
                                        props.options.map((op: any) => {
                                            if (op === 'Settings' || op === 'Channels') {
                                                return
                                            }
                                            return <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#f7f7f7'
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
                        // flex: 1,
                        // width: Dimensions.get('window').width < 1024 ? '100%' : 'auto',
                        justifyContent: Dimensions.get('window').width < 1024 ? 'flex-start' : 'flex-end',
                        // marginTop: Dimensions.get('window').width < 1024 ? 25 : 0,
                        // flex: Dimensions.get('window').width < 1024 ? 1 : 0,
                        // borderWidth: 1,
                        backgroundColor: '#f7f7f7'
                    }}>
                        {props.option === "To Do" || props.option === "Classroom" ? <TouchableOpacity style={{ backgroundColor: 'none' }} onPress={() => {
                            setShowFilterPopup(true)
                        }}>
                            <Text style={{ fontSize: 11, color: '#1D1D20', paddingTop: 9, textAlign: 'right' }}>
                                Filter <Ionicons name="caret-down" size={11} />
                            </Text>

                        </TouchableOpacity> : null}

                        <TextInput
                            value={searchTerm}
                            style={{
                                // width: "100%",
                                borderColor: "#d0d0d2",
                                borderBottomWidth: 1,
                                fontSize: 11,
                                padding: 5,
                                paddingVertical: 7,
                                marginTop: -10,
                                flex: 1, flexDirection: 'row',
                                marginLeft: 20,
                                marginRight: 20,
                                maxWidth: 200
                            }}
                            placeholder={"Search"}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={"#818385"}
                        /> <Menu
                            style={{ marginLeft: 0, right: 0, marginTop: -7 }}
                            onSelect={(op: any) => props.setOption(op)}>
                            <MenuTrigger>
                                <Image
                                    style={{
                                        height: 31,
                                        width: 31,
                                        marginBottom: 7,
                                        marginTop: 7,
                                        borderRadius: 75,
                                        borderWidth: 1,
                                        borderColor: '#e8e8ea'
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
                                    borderColor: '#e8e8ea',
                                    overflow: 'scroll',
                                    maxHeight: '100%'
                                }
                            }}>
                                <MenuOption
                                    value={'Channels'}>
                                    <Text>
                                        Classroom <Ionicons name='settings-outline' size={12} />
                                    </Text>
                                </MenuOption>
                                <MenuOption
                                    value={'Settings'}>
                                    <Text>
                                        Profile <Ionicons name='hammer-outline' size={12} />
                                    </Text>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                    </View>
                </View>
            </View>
            {
                searchTerm === '' ? <View style={{
                    // paddingBottom: Dimensions.get('window').width < 1024 ? 15 : 30,
                    paddingHorizontal: width < 1024 ? 20 : 40,
                    maxWidth: 1275,
                    alignSelf: 'center',
                    width: '100%',
                    height: width < 1024 ? windowHeight - 120 : windowHeight - 80, overflow: 'scroll'
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
                                subscriptions={props.subscriptions}
                            /> : null
                    }
                    {
                        props.option === 'Classroom' ?
                            overview : null
                    }
                    {
                        props.option === 'To Do' ?
                            <CalendarX
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
                                subscriptions={props.subscriptions}
                            /> : null
                    }
                </View> : searchResults

            }
            <Popup isOpen={showFilterPopup}
                buttons={['ok', {
                    text: 'Reset',
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
                        <Text style={{ fontSize: 10, color: '#1D1D20', paddingLeft: 5, paddingBottom: 10 }}>
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
                        <Text style={{ fontSize: 10, color: '#1D1D20', paddingLeft: 5, paddingBottom: 10 }}>
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
    return _.isEqual({ ...prev.cues }, { ...next.cues })
});

// export default Dashboard

const styleObject: any = () => StyleSheet.create({
    all: {
        fontSize: 12,
        color: '#1D1D20',
        height: 24,
        paddingHorizontal: 20,
        backgroundColor: '#f7f7f7',
        lineHeight: 24,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    allGrayFill: {
        fontSize: 12,
        color: '#fff',
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#1D1D20',
        lineHeight: 24,
        height: 24,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    all1: {
        fontSize: 10,
        color: '#43434f',
        height: 25,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        // textTransform: 'uppercase',
        lineHeight: 25,
        // fontFamily: 'inter',
        textAlign: 'center'
    },
    allGrayFill1: {
        fontSize: 10,
        color: '#007AFF',
        height: 25,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        // textTransform: 'uppercase',
        lineHeight: 25,
        // fontFamily: 'inter',
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
