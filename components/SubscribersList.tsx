import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, TextInput, Dimensions, Button, Switch } from 'react-native';
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';
import {
    RichEditor
} from "react-native-pell-rich-editor";
import { fetchAPI } from '../graphql/FetchAPI';
import { editPersonalMeeting, findUserById, getMessages, getPersonalMeetingLink, getPersonalMeetingLinkStatus, inviteByEmail, isSubInactive, makeSubActive, makeSubInactive, markMessagesAsRead, submitGrade, unsubscribe } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Alert from './Alert';
import NewMessage from './NewMessage';
import MessageCard from './MessageCard';
import { validateEmail } from '../helpers/emailCheck';
import Select from 'react-select'
import WebView from 'react-native-webview';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import ReactPlayer from 'react-player'
import moment from "moment"
import alert from './Alert';


const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [filterChoice, setFilterChoice] = useState('All')
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers))
    const [subscribers] = useState<any[]>(unparsedSubs.reverse())
    const categories = ['All', 'Read', 'Delivered', 'Not Delivered']
    const categoriesLanguageMap: { [label: string]: string } = {
        All: 'all',
        Read: 'read',
        Delivered: 'delivered',
        "Not Delivered": 'notDelivered',
        "Submitted": 'submitted',
        "Graded": "graded"
    }
    const [showSubmission, setShowSubmission] = useState(false)
    const [showAddUsers, setShowAddUsers] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [submission, setSubmission] = useState<any>('')
    const [score, setScore] = useState("0")
    const [status, setStatus] = useState("")
    const [userId, setUserId] = useState("")
    const [messages, setMessages] = useState<any[]>([])
    const [showChat, setShowChat] = useState(false)
    const [users, setUsers] = useState<any>([])
    const [emails, setEmails] = useState('')
    const [showNewGroup, setShowNewGroup] = useState(false)
    const RichText: any = useRef()
    const [selected, setSelected] = useState<any[]>([])
    const [expandMenu, setExpandMenu] = useState(false)
    const [comment, setComment] = useState('')
    const [isQuiz, setIsQuiz] = useState(false);
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [loadedChatWithUser, setLoadedChatWithUser] = useState<any>({})
    const [isLoadedUserInactive, setIsLoadedUserInactive] = useState(false)
    const [user, setUser] = useState<any>({})
    const [meetingOn, setMeetingOn] = useState(false)
    const [meetingLink, setMeetingLink] = useState('')

    // Alerts
    const usersAddedAlert = PreferredLanguageText('usersAdded')
    const emailInviteSentAlert = PreferredLanguageText('emailInviteSent')
    const unableToLoadMessagesAlert = PreferredLanguageText('unableToLoadMessages')
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const userSubscriptionActivatedAlert = PreferredLanguageText('userSubscriptionActivated')
    const userSubscriptionInactivatedAlert = PreferredLanguageText('userSubscriptionInactivated')
    const userRemovedAlert = PreferredLanguageText('userRemoved');
    const alreadyUnsubscribedAlert = PreferredLanguageText('alreadyUnsubscribed')

    const [webviewKey, setWebviewKey] = useState(Math.random())
    useEffect(() => {
        setTimeout(() => {
            setWebviewKey(Math.random())
        }, 3500);
    }, [imported])

    if (props.cue && props.cue.submission) {
        categories.push('Submitted')
        categories.push('Graded')
    }
    const styles = styleObject()
    let filteredSubscribers: any = []
    switch (filterChoice) {
        case 'All':
            filteredSubscribers = subscribers
            break;
        case 'Read':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'read'
            })
            break;
        case 'Delivered':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'delivered'
            })
            break;
        case 'Not Delivered':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'not-delivered'
            })
            break;
        case 'Graded':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'graded'
            })
            break;
        case 'Submitted':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'submitted'
            })
            break;
        default:
            filteredSubscribers = subscribers
            break;
    }
    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;
    const key = JSON.stringify(filteredSubscribers)
    let options = filteredSubscribers.map((sub: any) => {
        return {
            value: sub._id, label: sub.displayName
        }
    })
    const group = selected.map(s => {
        return s.value
    })

    useEffect(() => {
        if (submission[0] === '{' && submission[submission.length - 1] === '}') {
            const obj = JSON.parse(submission)
            if (obj.solutions) {
                setIsQuiz(true)
                setQuizSolutions(obj)
            } else {
                setImported(true)
                setUrl(obj.url)
                setType(obj.type)
                setTitle(obj.title)
            }
        } else {
            setImported(false)
            setUrl('')
            setType('')
            setTitle('')
        }
    }, [submission])

    const onChange = useCallback((value) => {
        setSelected(value)
    }, [subscribers])

    const handleGradeSubmit = useCallback(() => {
        if (Number.isNaN(Number(score))) {
            return
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: submitGrade,
            variables: {
                cueId: props.cueId,
                userId,
                score,
                comment
            }
        }).then(res => {
            if (res.data.cue.submitGrade) {
                props.reload()
                setShowSubmission(false)
            }
        })
    }, [score, userId, props.cueId, comment])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    setUser(user)
                    if (user._id && props.channelCreatedBy && user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                        setIsOwner(true)
                    }
                }
            }
        )()
    }, [props.channelCreatedBy])

    useEffect(() => {
        // get meeting status & set the meeting link accordingly
        if (users && users.length > 0) {
            const server = fetchAPI('')
            server.query({
                query: getPersonalMeetingLinkStatus,
                variables: {
                    users
                }
            }).then((res: any) => {
                if (res.data && res.data.channel.getPersonalMeetingLinkStatus) {
                    setMeetingOn(true)
                    getMeetingLink()
                }
            })
        }
    }, [users])

    const getMeetingLink = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: getPersonalMeetingLink,
            variables: {
                userId: user._id,
                users: users
            }
        }).then((res: any) => {
            if (res.data && res.data.channel.getPersonalMeetingLink && res.data.channel.getPersonalMeetingLink !== 'error') {
                setMeetingLink(res.data.channel.getPersonalMeetingLink)
            }
        }).catch(err => {
            console.log(err)
            alert('Something went wrong')
        })
    }, [users, user])

    const updateMeetingStatus = useCallback(() => {
        const server = fetchAPI('')
        server.mutate({
            mutation: editPersonalMeeting,
            variables: {
                users,
                channelId: props.channelId,
                meetingOn: !meetingOn
            }
        }).then((res: any) => {
            if (res.data && res.data.channel.editPersonalMeeting) {
                if (!meetingOn) {
                    // meeting turned on
                    getMeetingLink()
                }
                setMeetingOn(!meetingOn)
            } else {
                console.log(res)
                alert('Something went wrong')
            }
        }).catch(err => {
            console.log(err)
            alert('Something went wrong')
        })
    }, [users, props.channelId, meetingOn, getMeetingLink])

    const showError = useCallback(() => {
        alert('Meeting is inactive.')
    }, [])

    const submitEmails = useCallback(async () => {
        const lowerCaseEmails = emails.toLowerCase()
        const parsedEmails: any[] = []
        const unparsedEmails = lowerCaseEmails.split('\n')
        unparsedEmails.map((email) => {
            if (validateEmail(email)) {
                parsedEmails.push(email)
            }
        })

        if (parsedEmails.length === 0) return;
        const server = fetchAPI('')
        server.mutate({
            mutation: inviteByEmail,
            variables: {
                emails: parsedEmails,
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data.user.inviteByEmail) {
                setEmails('')
                Alert(usersAddedAlert, emailInviteSentAlert)
                props.reload()
            }
        }).catch(err => {
            console.log(err)
        })
    }, [emails, props.channelId])

    const loadChat = useCallback(async (userId, groupId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setUsers([parsedUser._id, userId])
            setMeetingOn(false)
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: [parsedUser._id, userId]
                }
            })
                .then(res => {
                    setMessages(res.data.message.getMessagesThread)
                    setShowChat(true)
                })
                .catch(err => {
                    Alert(unableToLoadMessagesAlert, checkConnectionAlert)
                })
            // mark chat as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId: parsedUser._id,
                    groupId
                }
            }).then(res => {
                props.refreshUnreadMessagesCount()
            })
                .catch(e => console.log(e))
            // load the user
            server.query({
                query: findUserById,
                variables: {
                    id: userId
                }
            }).then(res => {
                if (res.data && res.data.user.findById) {
                    setLoadedChatWithUser(res.data.user.findById)
                    server.query({
                        query: isSubInactive,
                        variables: {
                            userId: res.data.user.findById._id,
                            channelId: props.channelId
                        }
                    }).then((res2: any) => {
                        if (res2.data && res2.data.subscription.isSubInactive) {
                            setIsLoadedUserInactive(true)
                        }
                    }).catch((err) => console.log(err))
                }
            })
        }
    }, [props.channelId])

    const loadGroupChat = useCallback(async (groupUsers, groupId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setUsers(groupUsers)
            setMeetingOn(false)
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: groupUsers
                }
            })
                .then(res => {
                    setMessages(res.data.message.getMessagesThread)
                    setShowChat(true)
                })
                .catch(err => {
                    Alert(unableToLoadMessagesAlert, checkConnectionAlert)
                })
            // mark as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId: parsedUser._id,
                    groupId
                }
            }).then(res => console.log(res))
                .catch(e => console.log(e))
        }
    }, [])

    const handleDelete = useCallback(() => {

        Alert("Remove user from channel?", "",
            [
                {
                    text: "Cancel", style: "cancel", onPress: () => { return; }
                },
                {
                    text: "Okay", onPress: async () => {
                        const server = fetchAPI('')
                        server.mutate({
                            mutation: unsubscribe,
                            variables: {
                                userId: loadedChatWithUser._id,
                                channelId: props.channelId,
                                keepContent: false
                            }
                        }).then(async res => {
                            if (res.data.subscription && res.data.subscription.unsubscribe) {
                                Alert(userRemovedAlert)
                                props.reload()
                                setShowChat(false)
                                setIsLoadedUserInactive(false)
                                setLoadedChatWithUser({})
                            } else {
                                Alert(alreadyUnsubscribedAlert)
                            }
                        }).catch(err => {
                            Alert(somethingWentWrongAlert, checkConnectionAlert)
                        })
                    }
                }
            ]
        )

    }, [loadedChatWithUser, props.channelId, props.reload])

    const handleSubStatusChange = useCallback(() => {

        const alertMessage = isLoadedUserInactive ? "Make user active?" : "Make user inactive?"

        Alert(alertMessage, "",
            [
                {
                    text: "Cancel", style: "cancel", onPress: () => { return; }
                },
                {
                    text: "Okay", onPress: async () => {
                        const server = fetchAPI('')
                        server.mutate({
                            mutation: isLoadedUserInactive ? makeSubActive : makeSubInactive,
                            variables: {
                                userId: loadedChatWithUser._id,
                                channelId: props.channelId
                            }
                        }).then(res => {
                            if (isLoadedUserInactive) {
                                // changed to active
                                if (res.data && res.data.subscription.makeActive) {
                                    Alert(userSubscriptionActivatedAlert)
                                    props.reload()
                                    setShowChat(false)
                                    setIsLoadedUserInactive(false)
                                    setLoadedChatWithUser({})
                                }
                            } else {
                                // changed to inactive
                                if (res.data && res.data.subscription.makeInactive) {
                                    Alert(userSubscriptionInactivatedAlert)
                                    props.reload()
                                    setShowChat(false)
                                    setIsLoadedUserInactive(false)
                                    setLoadedChatWithUser({})
                                }
                            }
                        })
                    }
                }
            ]
        )


    }, [isLoadedUserInactive, loadedChatWithUser, props.channelId])

    const renderQuizSubmissions = () => {

        const { initiatedAt, solutions } = quizSolutions;

        return (<View style={{ width: '100%', marginLeft: '5%', display: 'flex', flexDirection: 'column' }}>
            {initiatedAt ? <Text style={{ width: '100%', height: 15, paddingBottom: 25 }}>
                Quiz initiated at {moment(new Date(initiatedAt)).format('MMMM Do YYYY, h:mm a')}
            </Text> :
                null
            }
            <Text style={{ width: '100%', height: 15, marginTop: '20px', paddingBottom: 25, fontWeight: 'bold' }}>
                Selected Answers:
            </Text>
            <View style={{ marginTop: '20px', display: 'flex', flexDirection: "column" }}>
                {solutions.map((problem: any, index: number) => {

                    const answers: any[] = problem.selected;

                    const selectedAnswers = answers.filter(ans => ans.isSelected);

                    let selectedAnswersString: any[] = []

                    selectedAnswers.forEach((ans: any) => {
                        selectedAnswersString.push(ans.options)
                    })

                    return (<Text style={{ width: '100%', height: 15, marginTop: '10px', paddingBottom: 25 }}>
                        Problem {index + 1} : {selectedAnswersString.join(", ")}
                    </Text>)
                })}
            </View>
        </View>)

    }

    return (
        <View style={{
            // borderWidth: 2,
            backgroundColor: 'white',
            width: '100%',
            minHeight: windowHeight - 200,
            paddingHorizontal: 20,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            {
                showSubmission || showChat || showAddUsers || showNewGroup ?
                    <View style={{ backgroundColor: 'white', paddingBottom: 15, maxWidth: 600 }}>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                key={Math.random()}
                                style={{
                                    backgroundColor: 'white'
                                }}
                                onPress={() => {
                                    if (showChat) {
                                        setShowChat(false)
                                        setIsLoadedUserInactive(false)
                                        setLoadedChatWithUser({})
                                        setUsers([])
                                        props.reload()
                                    } else {
                                        setShowSubmission(false)
                                        setStatus("")
                                        setScore("0")
                                        setUserId("")
                                    }
                                    setShowAddUsers(false)
                                    setShowNewGroup(false)
                                }}>
                                <Text style={{
                                    width: '100%',
                                    lineHeight: 23
                                }}>
                                    <Ionicons name='chevron-back-outline' size={23} color={'#202025'} />
                                </Text>
                            </TouchableOpacity>
                            {
                                loadedChatWithUser && loadedChatWithUser !== {} && !showNewGroup && !showAddUsers && users.length < 3 && !showSubmission ?
                                    <View style={{ marginHorizontal: 20, paddingTop: 5 }}>
                                        <Text>
                                            {loadedChatWithUser.displayName}, {loadedChatWithUser.fullName} {loadedChatWithUser.email ? ("(" + loadedChatWithUser.email + ")") : ''}
                                        </Text>
                                    </View> : null
                            }
                        </View>
                        {
                            isOwner && !props.cueId && !showAddUsers && !showNewGroup && !showSubmission && users.length < 3
                                ? <View style={{ flexDirection: 'row', flex: 1, paddingLeft: 43 }}>
                                    <TouchableOpacity
                                        onPress={() => handleSubStatusChange()}
                                    >
                                        <Text style={{
                                            color: '#a2a2aa',
                                            fontSize: 11,
                                            lineHeight: 30,
                                            textAlign: 'right',
                                            paddingRight: 20,
                                            textTransform: 'uppercase'
                                        }}>
                                            {
                                                isLoadedUserInactive ? PreferredLanguageText('makeActive') : PreferredLanguageText('makeInactive')
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDelete()}
                                    >
                                        <Text style={{
                                            color: '#a2a2aa',
                                            fontSize: 11,
                                            lineHeight: 30,
                                            textAlign: 'right',
                                            paddingRight: 10,
                                            textTransform: 'uppercase'
                                        }}>
                                            {PreferredLanguageText('removeFromChannel')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                : null
                        }
                        {
                            showChat ? <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1, paddingLeft: 43 }}>
                                <View style={{
                                    marginBottom: 25,
                                    backgroundColor: 'white',
                                    minWidth: '40%,'
                                }}>

                                    <View>
                                        <View style={{
                                            backgroundColor: 'white',
                                            height: 40,
                                            marginTop: 20,
                                            flexDirection: 'row'
                                        }}>
                                            <Switch
                                                value={meetingOn}
                                                onValueChange={() => updateMeetingStatus()}
                                                style={{ height: 20, marginRight: 20 }}
                                                trackColor={{
                                                    false: '#f4f4f6',
                                                    true: '#3B64F8'
                                                }}
                                                activeThumbColor='white'
                                            />
                                            <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 3 }}>
                                                <Text style={{ fontSize: 15, color: '#a2a2aa', }}>
                                                    Meeting
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 12, color: '#a2a2aa', paddingTop: 10 }}>
                                            Turn on to begin private meeting. {'\n'}Restart switch if you are unable to join the call.
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: 'white' }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (meetingOn) {
                                                window.open(meetingLink, '_blank');
                                            } else {
                                                showError()
                                            }
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 35,
                                            marginTop: 15,
                                            marginBottom: 20
                                        }}>
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: meetingOn ? '#fff' : '#202025',
                                            fontSize: 12,
                                            backgroundColor: meetingOn ? '#3B64F8' : '#f4f4f6',
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            height: 35,
                                            width: 175,
                                            borderRadius: 15,
                                            textTransform: 'uppercase'
                                        }}>
                                            Join Meeting
                                        </Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 12, color: '#a2a2aa', marginBottom: 10 }}>
                                        Enabled only when meeting in session.
                                    </Text>
                                </View>
                            </View>
                                : null
                        }
                    </View>
                    :
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25, maxWidth: 500 }}>
                        {
                            props.cueId ?
                                null :
                                <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a2a2aa', fontSize: 15, flex: 1, lineHeight: 25, fontWeight: 'bold' }}>
                                    {PreferredLanguageText('inbox')}
                                </Text>
                        }
                        {
                            !props.cueId ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    style={{
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowNewGroup(true)}>
                                    <Text style={{
                                        width: '100%',
                                        textAlign: 'right',
                                        lineHeight: 23,
                                        marginRight: 20,
                                        color: '#a2a2aa',
                                        fontSize: 11,
                                    }}>
                                        NEW GROUP
                                    </Text>
                                </TouchableOpacity> : null
                        }
                        {
                            isOwner && !props.cueId ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    style={{
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowAddUsers(true)}>
                                    <Text style={{
                                        width: '100%',
                                        textAlign: 'right',
                                        lineHeight: 23,
                                        marginRight: 20,
                                        color: '#a2a2aa',
                                        fontSize: 11,
                                    }}>
                                        ADD USERS
                                    </Text>
                                </TouchableOpacity> : null
                        }
                    </View>
            }
            {
                !showAddUsers ? (subscribers.length === 0 ?
                    <View style={{ backgroundColor: 'white', flex: 1 }}>
                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                            {
                                props.cueId ? PreferredLanguageText('noStatuses') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View> :
                    <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flex: 1
                    }}
                        key={key}
                    >
                        {
                            !showSubmission ?
                                (
                                    showChat ?
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            keyboardDismissMode={'on-drag'}
                                            style={{ flex: 1, paddingTop: 12 }}>
                                            {
                                                messages.length === 0 ?
                                                    <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingVertical: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                        {PreferredLanguageText('noMessages')}
                                                    </Text>
                                                    : null
                                            }
                                            {
                                                messages.map((message) => {
                                                    return <View style={{ width: '100%', maxWidth: 500, paddingBottom: 15, backgroundColor: 'white' }} key={Math.random()}>
                                                        <MessageCard
                                                            user={user}
                                                            message={message} />
                                                    </View>
                                                })
                                            }
                                            <View style={{ backgroundColor: 'white' }}>
                                                <NewMessage
                                                    cueId={props.cueId}
                                                    channelId={props.channelId}
                                                    parentId={null}
                                                    users={users}
                                                    back={() => {
                                                        props.reload()
                                                        setShowChat(false)
                                                        setIsLoadedUserInactive(false)
                                                        setLoadedChatWithUser({})
                                                    }}
                                                    placeholder={`${PreferredLanguageText('message')}...`}
                                                />
                                            </View>
                                        </ScrollView>
                                        :
                                        (
                                            showNewGroup ?
                                                <ScrollView
                                                    showsVerticalScrollIndicator={false}
                                                    keyboardDismissMode={'on-drag'}
                                                    style={{ flex: 1, paddingTop: 12 }}>
                                                    <Text
                                                        ellipsizeMode="tail"
                                                        style={{ color: '#a2a2aa', fontSize: 15, flex: 1, lineHeight: 25 }}>
                                                        {PreferredLanguageText('newGroup')}
                                                    </Text>
                                                    <View style={{ maxHeight: 175, flexDirection: 'column', marginTop: 25, overflow: 'scroll', marginBottom: 25 }}>
                                                        <View style={{ width: '90%', padding: 5, height: expandMenu ? 175 : 'auto', maxWidth: 500 }}>
                                                            <Select
                                                                placeholder='Share with'
                                                                styles={{
                                                                    menu: (provided: any, state: any) => ({
                                                                        ...provided,
                                                                        zIndex: 9999,
                                                                        overflow: 'scroll',
                                                                        height: 125,
                                                                        display: 'flex',
                                                                        margin: 5,
                                                                        width: '97%',
                                                                        boxShadow: 'none'
                                                                    }),
                                                                    option: (provided: any, state: any) => ({
                                                                        ...provided,
                                                                        fontFamily: 'overpass',
                                                                        color: '#a2a2aa',
                                                                        fontSize: 10,
                                                                        height: 25,
                                                                        width: '97%'
                                                                    }),
                                                                    input: (styles: any) => ({
                                                                        // ...styles,
                                                                        width: '100%',
                                                                        border: 'none',
                                                                        borderWidth: 0,
                                                                        fontSize: 12
                                                                    }),
                                                                    placeholder: (styles: any) => ({
                                                                        ...styles,
                                                                        fontFamily: 'overpass',
                                                                        color: '#a2a2aa',
                                                                        fontSize: 12
                                                                    }),
                                                                    multiValueLabel: (styles: any, { data }: any) => ({
                                                                        ...styles,
                                                                        color: '#202025',
                                                                        fontFamily: 'overpass'
                                                                    }),
                                                                    multiValue: (styles: any, { data }: any) => ({
                                                                        ...styles,
                                                                        backgroundColor: '#f4f4f6',
                                                                        fontFamily: 'overpass'
                                                                    })
                                                                }}
                                                                value={selected}
                                                                isMulti={true}
                                                                onMenuOpen={() => setExpandMenu(true)}
                                                                onMenuClose={() => setExpandMenu(false)}
                                                                name="Share with"
                                                                className="basic-multi-select"
                                                                classNamePrefix="select"
                                                                onChange={onChange}
                                                                options={options}
                                                            />
                                                        </View>
                                                    </View>
                                                    <View style={{ backgroundColor: 'white' }}>
                                                        <NewMessage
                                                            cueId={props.cueId}
                                                            channelId={props.channelId}
                                                            parentId={null}
                                                            users={group}
                                                            addUserId={true}
                                                            back={() => {
                                                                props.reload()
                                                                setShowChat(false)
                                                                setIsLoadedUserInactive(false)
                                                                setLoadedChatWithUser({})
                                                                setShowNewGroup(false)
                                                            }}
                                                            placeholder={`${PreferredLanguageText('message')}...`}
                                                        />
                                                    </View>
                                                </ScrollView>
                                                : <ScrollView
                                                    showsVerticalScrollIndicator={false}
                                                    horizontal={false}
                                                    key={filterChoice + key}
                                                    contentContainerStyle={{
                                                        width: '100%',
                                                        height: props.cueId ? windowHeight - 200 : '100%',
                                                        marginBottom: props.cueId ? 20 : 0
                                                    }}
                                                >
                                                    {
                                                        !props.cueId || props.cueId === '' ?
                                                            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f4f4f6', marginBottom: 20 }}>
                                                                {
                                                                    props.groups.length > 0 ? (props.groups.map((group: any, index: any) => {
                                                                        let displayName = ''
                                                                        console.log(group)
                                                                        group.userNames.map((u: any) => { displayName += (u.displayName + ', ') })
                                                                        return <View style={styles.col} key={filterChoice + key + index}>
                                                                            <SubscriberCard
                                                                                chat={!props.cueId || props.cueId === '' ? true : false}
                                                                                fadeAnimation={props.fadeAnimation}
                                                                                subscriber={{
                                                                                    displayName,
                                                                                    fullName: 'Team',
                                                                                    unreadMessages: group.unreadMessages
                                                                                }}
                                                                                onPress={() => {
                                                                                    loadGroupChat(group.users, group._id)
                                                                                }}
                                                                                status={!props.cueId ? false : true}
                                                                            />
                                                                        </View>
                                                                    })) : <View style={{ backgroundColor: 'white', flex: 1 }}>
                                                                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingHorizontal: 50, paddingBottom: 100, paddingTop: 50, fontFamily: 'inter', flex: 1 }}>
                                                                            {PreferredLanguageText('noGroups')}
                                                                        </Text>
                                                                    </View>
                                                                }
                                                            </View>
                                                            : null
                                                    }
                                                    {
                                                        filteredSubscribers.map((subscriber: any, index: any) => {
                                                            return <View style={styles.col} key={filterChoice + key + index}>
                                                                <SubscriberCard
                                                                    chat={!props.cueId || props.cueId === '' ? true : false}
                                                                    fadeAnimation={props.fadeAnimation}
                                                                    subscriber={subscriber}
                                                                    onPress={() => {
                                                                        if (props.cueId && props.cueId !== null) {
                                                                            if (subscriber.fullName === 'submitted' || subscriber.fullName === 'graded') {
                                                                                setSubmission(subscriber.submission)
                                                                                setShowSubmission(true)
                                                                                setStatus(subscriber.fullName)
                                                                                setScore(subscriber.score)
                                                                                setComment(subscriber.comment)
                                                                                setUserId(subscriber.userId)
                                                                            }
                                                                        } else {
                                                                            console.log(subscriber)
                                                                            loadChat(subscriber._id, subscriber.groupId)
                                                                        }
                                                                    }}
                                                                    status={!props.cueId ? false : true}
                                                                />
                                                            </View>
                                                        })
                                                    }
                                                </ScrollView>)
                                ) :
                                <View>
                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        keyboardDismissMode={'on-drag'}
                                        contentContainerStyle={{
                                            height: windowHeight - 132
                                        }}
                                        style={{ flex: 1, paddingTop: 12 }}>
                                        <View style={{
                                            width: Dimensions.get('window').width < 1024 ? '100%' : '60%', alignSelf: 'center'
                                        }}>
                                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                                {PreferredLanguageText('score')}
                                            </Text>
                                            <TextInput
                                                value={score}
                                                style={styles.input}
                                                placeholder={'0-100'}
                                                onChangeText={val => setScore(val)}
                                                placeholderTextColor={'#a2a2aa'}
                                            />
                                            <Text style={{ color: '#202025', fontSize: 14, paddingVertical: 10, }}>
                                                {PreferredLanguageText('comment')}
                                            </Text>
                                            <TextInput
                                                value={comment}
                                                style={{
                                                    height: 200,
                                                    backgroundColor: '#f4f4f6',
                                                    borderRadius: 10,
                                                    fontSize: 15,
                                                    padding: 15,
                                                    paddingTop: 13,
                                                    paddingBottom: 13,
                                                    marginTop: 5,
                                                    marginBottom: 20
                                                }}
                                                placeholder={'Optional'}
                                                onChangeText={val => setComment(val)}
                                                placeholderTextColor={'#a2a2aa'}
                                                multiline={true}
                                            />
                                            <View
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'white',
                                                    justifyContent: 'center',
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    marginTop: 25,
                                                    marginBottom: 25
                                                }}>
                                                <TouchableOpacity
                                                    onPress={() => handleGradeSubmit()}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        borderRadius: 15,
                                                        overflow: 'hidden',
                                                        height: 35,
                                                    }}>
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        lineHeight: 35,
                                                        color: 'white',
                                                        fontSize: 12,
                                                        backgroundColor: '#3B64F8',
                                                        paddingHorizontal: 25,
                                                        fontFamily: 'inter',
                                                        height: 35,
                                                    }}>
                                                        {status === 'graded' ? 'REGRADE' : 'ENTER GRADE'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 25, marginLeft: '5%' }}>
                                            {PreferredLanguageText('viewSubmission')}
                                        </Text>
                                        {
                                            imported && !isQuiz ?
                                                <View style={{ width: '40%', alignSelf: 'flex-start', marginLeft: '10%' }}>
                                                    <TextInput
                                                        editable={false}
                                                        value={title}
                                                        style={styles.input}
                                                        placeholder={'Title'}
                                                        onChangeText={val => setTitle(val)}
                                                        placeholderTextColor={'#a2a2aa'}
                                                    />
                                                </View> : null
                                        }
                                        {
                                            isQuiz && Object.keys(quizSolutions).length > 0 ?
                                                renderQuizSubmissions() : null
                                        }
                                        {
                                            !imported && !isQuiz ?
                                                <RichEditor
                                                    disabled={true}
                                                    key={Math.random()}
                                                    containerStyle={{
                                                        backgroundColor: '#f4f4f6',
                                                        padding: 3,
                                                        paddingTop: 5,
                                                        paddingBottom: 10,
                                                        borderRadius: 15,
                                                    }}
                                                    ref={RichText}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: '#f4f4f6',
                                                        borderRadius: 15,
                                                        minHeight: 450
                                                    }}
                                                    editorStyle={{
                                                        backgroundColor: '#f4f4f6',
                                                        placeholderColor: '#a2a2aa',
                                                        color: '#202025',
                                                        contentCSSText: 'font-size: 13px;'
                                                    }}
                                                    initialContentHTML={submission}
                                                    placeholder={"Title"}
                                                    onChange={(text) => { }}
                                                    allowFileAccess={true}
                                                    allowFileAccessFromFileURLs={true}
                                                    allowUniversalAccessFromFileURLs={true}
                                                    allowsFullscreenVideo={true}
                                                    allowsInlineMediaPlayback={true}
                                                    allowsLinkPreview={true}
                                                    allowsBackForwardNavigationGestures={true}
                                                /> : (
                                                    <View style={{
                                                        width: '100%',
                                                        minHeight: 500,
                                                        backgroundColor: 'white'
                                                    }}
                                                    >
                                                        {
                                                            (
                                                                type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav' ?
                                                                    <ReactPlayer url={url} controls={true} />
                                                                    :
                                                                    (!isQuiz ? <View
                                                                        // key={Math.random()}
                                                                        style={{ flex: 1 }}
                                                                    >
                                                                        <WebView
                                                                            source={{ uri: "https://docs.google.com/gview?embedded=true&url=" + url }}
                                                                            key={webviewKey} />
                                                                    </View> : null)
                                                            )
                                                        }
                                                    </View>
                                                )
                                        }
                                    </ScrollView>
                                </View>
                        }
                        {
                            !props.cueId || showSubmission ? null :
                                <View style={{
                                    width: '100%',
                                    height: 70,
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                }}>
                                    <ScrollView
                                        contentContainerStyle={{
                                            height: 20, width: '100%',
                                            paddingTop: 15
                                        }}
                                        style={{}}
                                        horizontal={true}
                                        showsHorizontalScrollIndicator={false}
                                    >
                                        {
                                            unparsedSubs.length === 0 ? null : categories.map((category: string) => {
                                                return <TouchableOpacity
                                                    key={Math.random()}
                                                    style={filterChoice === category ? styles.cusCategoryOutline : styles.cusCategory}
                                                    onPress={() => setFilterChoice(category)}>
                                                    <Text
                                                        style={{
                                                            color: '#a2a2aa',
                                                            lineHeight: 20
                                                        }}>
                                                        {PreferredLanguageText(categoriesLanguageMap[category])}
                                                    </Text>
                                                </TouchableOpacity>
                                            })
                                        }
                                    </ScrollView>
                                </View>
                        }
                    </View>) :
                    <View style={{ width: 500, maxWidth: '100%' }}>
                        <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                            {PreferredLanguageText('inviteByEmail')}
                        </Text>
                        <TextInput
                            value={emails}
                            style={{
                                height: 200,
                                backgroundColor: '#f4f4f6',
                                borderRadius: 10,
                                fontSize: 15,
                                padding: 15,
                                paddingTop: 13,
                                paddingBottom: 13,
                                marginTop: 5,
                                marginBottom: 20
                            }}
                            placeholder={'Enter one email per line.'}
                            onChangeText={val => setEmails(val)}
                            placeholderTextColor={'#a2a2aa'}
                            multiline={true}
                        />
                        <TouchableOpacity
                            onPress={() => submitEmails()}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 15,
                                width: '100%',
                                justifyContent: 'center', flexDirection: 'row',
                                marginBottom: 50
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#202025s',
                                fontSize: 12,
                                backgroundColor: '#f4f4f6',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                                {PreferredLanguageText("addUsers")}
                            </Text>
                        </TouchableOpacity>

                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: '#202025s',
                            fontSize: 12,
                            paddingHorizontal: 25,
                            width: "100%",
                            fontFamily: 'inter',
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}>
                            {filteredSubscribers.length !== 0 ? PreferredLanguageText('existingUsers') : PreferredLanguageText('noExistingUsers')}
                        </Text>
                        <View style={{ display: "flex", flexDirection: 'column', alignItems: 'center' }}>
                            {
                                filteredSubscribers.map((sub: any) => {
                                    return (<View style={{
                                        backgroundColor: '#f4f4f6',
                                        width: '100%',
                                        padding: 10,
                                        borderRadius: 8,
                                        marginBottom: 10
                                    }}>
                                        <Text>
                                            {sub.displayName}
                                        </Text>
                                        <Text>
                                            {sub.email}
                                        </Text>
                                    </View>)
                                })
                            }
                        </View>

                    </View>
            }
        </View >
    );
}

export default React.memo(SubscribersList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads)
})


const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        margin: {
            height: 20,
            backgroundColor: 'white'
        },
        marginSmall: {
            height: 10,
            backgroundColor: 'white'
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            height: 80,
            marginBottom: 12,
            // flex: 1,
            backgroundColor: 'white'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        input: {
            width: '100%',
            borderBottomColor: '#f4f4f6',
            borderBottomWidth: 1,
            fontSize: 15,
            padding: 15,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20
        },
        outline: {
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a2a2aa',
            color: 'white'
        },
        cusCategory: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a2a2aa',
            color: 'white'
        }
    })
}
