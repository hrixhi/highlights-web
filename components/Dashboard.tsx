import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, Dimensions, Linking, ScrollView } from 'react-native';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import { getActivity, getOrganisation, getSearch } from '../graphql/QueriesAndMutations';
import logo from './default-images/cues-logo-black-exclamation-hidden.jpg'
import Profile from './Profile';
import Walkthrough from './Walkthrough';
import Channels from './Channels';
import ActivityCard from './ActivityCard';
import OverviewCueCard from './OverviewCueCard';
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


const Dashboard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {


    const styles = styleObject()
    const [userId, setUserId] = useState('')

    const [searchTerm, setSearchTerm] = useState('')
    const priorities = [4, 3, 2, 1, 0]
    const [collapseMap, setCollapseMap] = useState<any>({})
    const [results, setResults] = useState<any>({
        'Channels': [],
        'Notes': [],
        'Messages': [],
        'Threads': []
    })

    const [searchOptions, setSearchOptions] = useState(['Channels', 'Notes', 'Messages', 'Threads'])
    const [sortBy, setSortBy] = useState('Priority')

    const [cueMap, setCueMap] = useState<any>({})

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    const server = fetchAPI(user._id)
                    setUserId(user._id)
                }
            }
        )()

        const temp: any = {}
        const mycues: any[] = []
        temp['My Notes'] = []
        const tempCollapse: any = {}
        tempCollapse['My Notes'] = false

        props.subscriptions.map((sub: any) => {
            const tempCues: any[] = []
            props.cues.map((cue: any) => {
                if (cue.channelName === sub.channelName) {
                    tempCues.push(cue)
                }
            })
            tempCues.reverse()
            temp[sub.channelName + '-SPLIT-' + sub.channelId + '-SPLIT-' + sub.channelCreatedBy + '-SPLIT-' + sub.colorCode] = tempCues
            tempCollapse[sub.channelName + '-SPLIT-' + sub.channelId + '-SPLIT-' + sub.channelCreatedBy + '-SPLIT-' + sub.colorCode] = false
        })
        props.cues.map((cue: any) => {
            if (!cue.channelId || cue.channelId === '') {
                mycues.push(cue)
            }
        })
        mycues.reverse()
        temp['My Notes'] = mycues
        setCueMap(temp)
        setCollapseMap(tempCollapse)
    }, [props.cues, props.subscriptions])

    useEffect(() => {
        if (searchTerm.trim() === '') {
            return
        }
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
                    'Notes': [...r.personalCues, ...r.channelCues],
                    'Channels': r.channels,
                    'Threads': r.threads,
                    'Messages': r.messages
                }
                setResults(tempResults)
            }
        }).catch(err => {
            console.log(err)
        })
    }, [searchTerm, userId])

    const searchResults = <View
        key={cueMap.toString()}
        style={{
            flexDirection: 'row',
            height: Dimensions.get("window").height - 80,
            width: '100%',
            overflow: 'hidden',
            paddingTop: 20
        }}>
        <View style={{ width: '100%' }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                contentContainerStyle={{
                    width: '100%',
                }}
            >
                <Text style={{
                    fontSize: 25,
                    paddingBottom: 20,
                    paddingTop: 10,
                    fontFamily: 'inter',
                    flex: 1,
                    lineHeight: 23,
                    color: '#3b64f8'
                }}>
                    Search Results
                </Text>
                {
                    searchOptions.map((option: any) => {

                        if (results[option].length === 0) {
                            return null
                        }

                        return <View style={{ marginBottom: 40, backgroundColor: '#fff' }}>
                            <Text style={{
                                fontSize: 25,
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

                                    if (option === 'Notes') {
                                        const { title, subtitle } = htmlStringParser(obj.cue)
                                        t = title
                                        s = subtitle
                                    } else if (option === 'Channels') {
                                        t = obj.name
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
                                        marginRight: 15,
                                        maxWidth: 175,
                                        backgroundColor: '#fff',
                                        alignSelf: 'center',
                                        width: '98%'
                                    }} key={index}>
                                        <SearchResultCard
                                            title={t}
                                            subtitle={s}
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

    const overview = <View
        key={cueMap.toString()}
        style={{
            flexDirection: 'row',
            height: Dimensions.get("window").height - 80,
            width: '100%',
            overflow: 'hidden',
            paddingTop: 20
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
                        return <View style={{ marginBottom: 20, paddingBottom: 20 }}>
                            {
                                ind !== 0 ?
                                    <View style={{ flexDirection: 'row', paddingBottom: 20 }}>
                                        <Text style={{
                                            fontSize: 25,
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
                                                backgroundColor: key.split('-SPLIT-')[3]
                                            }} /> {key.split('-SPLIT-')[0]}
                                        </Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: '#fff', paddingTop: 10 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: '#fff' }}>
                                                <Menu
                                                    onSelect={(option: any) => {
                                                        switch (option) {
                                                            case 'Classroom':
                                                                props.setChannelFilterChoice('All')
                                                                props.handleFilterChange(key.split('-SPLIT-')[0])
                                                                props.setChannelId(key.split('-SPLIT-')[1])
                                                                props.setChannelCreatedBy(key.split('-SPLIT-')[2])
                                                                props.openMeeting()
                                                                props.hideHome()
                                                                break;
                                                            case 'Inbox':
                                                                props.setChannelFilterChoice('All')
                                                                props.handleFilterChange(key.split('-SPLIT-')[0])
                                                                props.setChannelId(key.split('-SPLIT-')[1])
                                                                props.setChannelCreatedBy(key.split('-SPLIT-')[2])
                                                                props.openSubscribers()
                                                                props.hideHome()
                                                                break;
                                                            case 'Discussion':
                                                                props.setChannelFilterChoice('All')
                                                                props.handleFilterChange(key.split('-SPLIT-')[0])
                                                                props.setChannelId(key.split('-SPLIT-')[1])
                                                                props.setChannelCreatedBy(key.split('-SPLIT-')[2])
                                                                props.openDiscussion()
                                                                props.hideHome()
                                                                break;
                                                            case 'Grades':
                                                                props.setChannelFilterChoice('All')
                                                                props.handleFilterChange(key.split('-SPLIT-')[0])
                                                                props.setChannelId(key.split('-SPLIT-')[1])
                                                                props.setChannelCreatedBy(key.split('-SPLIT-')[2])
                                                                props.openChannelSettings()
                                                                props.hideHome()
                                                                break;
                                                            case 'Settings':
                                                                props.setChannelFilterChoice('All')
                                                                props.handleFilterChange(key.split('-SPLIT-')[0])
                                                                props.setChannelId(key.split('-SPLIT-')[1])
                                                                props.setChannelCreatedBy(key.split('-SPLIT-')[2])
                                                                props.openChannelSettings()
                                                                props.hideHome()
                                                                break;
                                                            default:
                                                                break;
                                                        }
                                                    }}>
                                                    <MenuTrigger>
                                                        <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c', paddingLeft: 10 }}>
                                                            <Ionicons name='menu-outline' size={25} />
                                                        </Text>
                                                    </MenuTrigger>
                                                    <MenuOptions customStyles={{
                                                        optionsContainer: {
                                                            padding: 10,
                                                            borderRadius: 15,
                                                            shadowOpacity: 0,
                                                            borderWidth: 1,
                                                            borderColor: '#F8F9FA',
                                                            overflow: 'scroll',
                                                            maxHeight: '100%'
                                                        }
                                                    }}>
                                                        <MenuOption
                                                            value={'Classroom'}>
                                                            <Text>
                                                                Classroom
                                                            </Text>
                                                        </MenuOption>
                                                        {/* <MenuOption
                                                            value={'Inbox'}>
                                                            <Text>
                                                                Inbox
                                                            </Text>
                                                        </MenuOption> */}
                                                        <MenuOption
                                                            value={'Discussion'}>
                                                            <Text>
                                                                Discussion
                                                            </Text>
                                                        </MenuOption>
                                                        <MenuOption
                                                            value={'Grades'}>
                                                            <Text>
                                                                Grades
                                                            </Text>
                                                        </MenuOption>
                                                        {
                                                            key.split('-SPLIT-')[2] === userId ?
                                                                <MenuOption
                                                                    value={'Settings'}>
                                                                    <Text>
                                                                        Settings
                                                                    </Text>
                                                                </MenuOption> : null
                                                        }
                                                    </MenuOptions>
                                                </Menu>
                                                <TouchableOpacity
                                                    style={{ marginLeft: 15 }}
                                                    onPress={() => {
                                                        const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                        tempCollapse[key] = !collapseMap[key]
                                                        setCollapseMap(tempCollapse)
                                                    }}
                                                // style={{ height: 25 }}
                                                >
                                                    <Text style={{
                                                        textAlign: 'center'
                                                    }}>
                                                        <Ionicons name={collapseMap[key] ? 'contract-outline' : 'expand-outline'} size={25} color={'#2f2f3c'} />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View> : <View style={{ paddingBottom: 20, flexDirection: 'row', }}>
                                        <Text style={{
                                            fontSize: 25,
                                            paddingBottom: 20,
                                            paddingTop: 10,
                                            fontFamily: 'inter',
                                            flex: 1,
                                            lineHeight: 23,
                                            color: '#3b64f8'
                                        }}>
                                            <View style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: 9,
                                                marginTop: 1,
                                                backgroundColor: '#2f2f3c'
                                            }} /> {key}
                                        </Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', backgroundColor: '#fff', paddingTop: 10 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: '#fff' }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                                        tempCollapse[key] = !collapseMap[key]
                                                        setCollapseMap(tempCollapse)
                                                    }}
                                                // style={{ height: 25 }}
                                                >
                                                    <Text style={{
                                                        textAlign: 'center'
                                                    }}>
                                                        <Ionicons name={collapseMap[key] ? 'contract-outline' : 'expand-outline'} size={25} color={'#2f2f3c'} />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                            }
                            <View style={{ flexDirection: 'row' }}>
                                {
                                    cueMap[key].length === 0 ?
                                        <Text style={{ fontSize: 15, color: '#818385', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff' }}>
                                            {PreferredLanguageText('noCuesCreated')}
                                        </Text> :
                                        (
                                            collapseMap[key] ?
                                                <View>
                                                    {
                                                        priorities.map((priority, i: any) => {
                                                            return <ScrollView
                                                                showsVerticalScrollIndicator={false}
                                                                horizontal={true}
                                                                // style={{ height: '100%' }}
                                                                contentContainerStyle={{
                                                                    // borderWidth: 2,
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                {cueMap[key].map((cue: any, index: any) => {
                                                                    if (cue.color !== priority) {
                                                                        return null
                                                                    }
                                                                    return <View style={{
                                                                        height: 150,
                                                                        marginRight: 15,
                                                                        marginBottom: i === priorities.length - 1 ? 0 : 20,
                                                                        maxWidth: 150,
                                                                        backgroundColor: '#fff',
                                                                        alignSelf: 'center',
                                                                        width: '98%'
                                                                    }} key={index}>
                                                                        <OverviewCueCard
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
                                                            </ScrollView>
                                                        })
                                                    }
                                                </View> :
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
                                                    {cueMap[key].map((cue: any, index: any) => {
                                                        return <View style={{
                                                            height: 150,
                                                            marginRight: 15,
                                                            width: 150,
                                                            backgroundColor: '#fff',
                                                            alignSelf: 'center',
                                                        }} key={index}>
                                                            <OverviewCueCard
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
                                                </ScrollView>
                                        )
                                }
                            </View>
                            {/* <TouchableOpacity
                                onPress={() => {
                                    const tempCollapse = JSON.parse(JSON.stringify(collapseMap))
                                    tempCollapse[key] = !collapseMap[key]
                                    setCollapseMap(tempCollapse)
                                }}
                                style={{ width: '100%', height: 25 }}>
                                <Text style={{
                                    textAlign: 'center', width: '100%'
                                }}>
                                    <Ionicons name={collapseMap[key] ? 'contract-outline' : 'expand-outline'} size={20} color={'#2f2f3c'} />
                                </Text>
                            </TouchableOpacity> */}
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
            maxHeight: '100%'
        }}>
            <View style={{
                backgroundColor: '#F8F9FA',
                paddingTop: 30,
                paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 40,
                flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                // flex: 1, 
                paddingBottom: 0,
                width: '100%'
            }}>
                <View style={{ flexDirection: 'row', flex: 1, backgroundColor: '#F8F9FA', }}>
                    <Image
                        source={logo}
                        style={{
                            width: 80,
                            height: 23
                        }}
                        resizeMode={'contain'}
                    />
                    {
                        Dimensions.get('window').width < 768 ?
                            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', backgroundColor: '#F8F9FA', }}>
                                <Menu
                                    onSelect={(op: any) => props.setOption(op)}>
                                    <MenuTrigger style={{ flexDirection: 'row' }}>
                                        <Text style={{ color: '#2f2f3c', paddingLeft: 10, flexDirection: 'row', lineHeight: 15, fontSize: 15, marginTop: 3, fontFamily: 'inter' }}>
                                            {props.option}
                                        </Text>
                                        <Text style={{ color: '#2f2f3c', paddingLeft: 10, flexDirection: 'row', lineHeight: 15, fontSize: 15, marginTop: 2 }}>
                                            <Ionicons name='menu-outline' size={25} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#F8F9FA',
                                            overflow: 'scroll',
                                            maxHeight: '100%'
                                        }
                                    }}>
                                        {
                                            props.options.map((op: any) => {
                                                return <MenuOption
                                                    value={op}>
                                                    <Text>
                                                        {op}
                                                    </Text>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            : <View style={{ flexDirection: 'row', paddingLeft: 30, flex: 1, backgroundColor: '#F8F9FA' }}>
                                {
                                    props.options.map((op: any) => {
                                        return <TouchableOpacity
                                            style={{
                                                backgroundColor: '#F8F9FA'
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
                    justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end',
                    marginTop: Dimensions.get('window').width < 768 ? 25 : 0,
                    // flex: Dimensions.get('window').width < 768 ? 1 : 0,
                    // borderWidth: 1,
                    backgroundColor: '#F8F9FA'
                }}>
                    {
                        width < 768 ? <Ionicons name='search-outline' size={25} color='#2f2f3c'
                            style={{
                                marginLeft: Dimensions.get('window').width < 768 ? 0 : 40,
                                marginTop: -5
                            }}
                        /> : null
                    }
                    {
                        width < 768 ? <TextInput
                            value={searchTerm}
                            style={{
                                // width: "100%",
                                borderBottomColor: "#2f2f3c",
                                borderBottomWidth: 1,
                                fontSize: 15,
                                padding: 15,
                                paddingVertical: 12,
                                marginTop: -23,
                                flex: 1, flexDirection: 'row',
                                // marginLeft: 40,
                                width: 140,
                                // borderWidth: 1,
                                marginLeft: 5,
                                marginRight: Dimensions.get('window').width < 768 ? 5 : 0
                            }}
                            // placeholder={"Search"}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={"#818385"}
                        /> : null
                    }
                    {
                        width < 768 ?
                            (
                                props.option === 'Content' ?
                                    <View style={{ backgroundColor: '#F8F9FA', marginTop: -5, paddingRight: 5 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: '#F8F9FA' }}>
                                            <Menu
                                                onSelect={(category: any) => {
                                                    setSortBy(category)
                                                }}>
                                                <MenuTrigger>
                                                    <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                                        {sortBy}<Ionicons name='caret-down' size={15} />
                                                    </Text>
                                                </MenuTrigger>
                                                <MenuOptions customStyles={{
                                                    optionsContainer: {
                                                        padding: 10,
                                                        borderRadius: 15,
                                                        shadowOpacity: 0,
                                                        borderWidth: 1,
                                                        borderColor: '#F8F9FA',
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
                                                        value={'Date'}>
                                                        <Text>
                                                            Date
                                                        </Text>
                                                    </MenuOption>
                                                </MenuOptions>
                                            </Menu>
                                        </View>
                                        <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7 }}>
                                            Sort By
                                        </Text>
                                    </View> : null
                            ) : null
                    }
                    {
                        props.option === 'Content' || props.option === 'Home' ?
                            <DateRangePicker
                                preventOverflow={true}
                                size={'sm'}
                                placeholder={'Filter  '}
                                onChange={(e: any) => {
                                    console.log('dates start', e[0])
                                    console.log('dates end', e[1])
                                    if (e[0] > e[1]) {
                                        alert('End date must be greater')
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
                                style={{
                                    marginTop: -4,
                                    marginRight: width < 768 ? -20 : 0,
                                    // alignSelf: 'flex-end'
                                    // paddingLeft: 40
                                }}
                            /> : null
                    }
                    {
                        width < 768 ? null :
                            (
                                props.option === 'Content' ?
                                    <View style={{ backgroundColor: '#F8F9FA', paddingLeft: 30, marginTop: -5 }}>
                                        <View style={{ flexDirection: 'row', display: 'flex', backgroundColor: '#F8F9FA' }}>
                                            <Menu
                                                onSelect={(category: any) => {
                                                    setSortBy(category)
                                                }}>
                                                <MenuTrigger>
                                                    <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                                        {sortBy}<Ionicons name='caret-down' size={15} />
                                                    </Text>
                                                </MenuTrigger>
                                                <MenuOptions customStyles={{
                                                    optionsContainer: {
                                                        padding: 10,
                                                        borderRadius: 15,
                                                        shadowOpacity: 0,
                                                        borderWidth: 1,
                                                        borderColor: '#F8F9FA',
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
                                                        value={'Date'}>
                                                        <Text>
                                                            Date
                                                        </Text>
                                                    </MenuOption>
                                                </MenuOptions>
                                            </Menu>
                                        </View>
                                        <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, backgroundColor: '#F8F9FA' }}>
                                            Sort By
                                        </Text>
                                    </View> : null
                            )
                    }
                    {
                        width < 768 ? null : <Ionicons name='search-outline' size={25} color='#2f2f3c'
                            style={{
                                marginLeft: Dimensions.get('window').width < 768 ? 0 : 40,
                                marginTop: -5
                            }}
                        />
                    }
                    {
                        width < 768 ? null : <TextInput
                            value={searchTerm}
                            style={{
                                // width: "100%",
                                borderBottomColor: "#2f2f3c",
                                borderBottomWidth: 1,
                                fontSize: 15,
                                padding: 15,
                                paddingVertical: 12,
                                marginTop: -23,
                                flex: 1, flexDirection: 'row',
                                // marginLeft: 40,
                                // borderWidth: 1,
                                marginLeft: 5,
                                marginRight: Dimensions.get('window').width < 768 ? 30 : 0
                            }}
                            // placeholder={"Search"}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={"#818385"}
                        />
                    }
                </View>
            </View>
            {
                searchTerm === '' ? <View style={{
                    // paddingTop: Dimensions.get('window').width < 1024 ? 15 : 30,
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 40
                }}>
                    {
                        props.option === 'Account' ?
                            <Profile
                                closeModal={() => props.hideHome()}
                                saveDataInCloud={() => props.saveDataInCloud()}
                                reOpenProfile={() => props.reOpenProfile()}
                                reloadData={() => props.reloadData()}
                            /> : null
                    }
                    {
                        props.option === 'Help' ?
                            <Walkthrough /> : null
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
                                cues={props.calendarCues}
                                subscriptions={props.subscriptions}
                                openCueFromCalendar={props.openCueFromCalendar}
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
        fontSize: 14,
        color: '#2f2f3c',
        height: 22,
        paddingHorizontal: 20,
        backgroundColor: '#F8F9FA',
        lineHeight: 22,
        fontFamily: 'inter'
    },
    allGrayFill: {
        fontSize: 14,
        color: '#fff',
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#2f2f3c',
        lineHeight: 22,
        fontFamily: 'inter'
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
