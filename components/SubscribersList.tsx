import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, TextInput, Dimensions, Button } from 'react-native';
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';
import {
    RichEditor
} from "react-native-pell-rich-editor";
import { fetchAPI } from '../graphql/FetchAPI';
import { getMessages, inviteByEmail, markMessagesAsRead, submitGrade } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Alert from './Alert';
import NewMessage from './NewMessage';
import MessageCard from './MessageCard';
import { validateEmail } from '../helpers/emailCheck';

const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [filterChoice, setFilterChoice] = useState('All')
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers))
    const [subscribers] = useState<any[]>(unparsedSubs.reverse())
    const categories = ['All', 'Read', 'Delivered', 'Not Delivered']
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
    const RichText: any = useRef()
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

    console.log(filteredSubscribers)

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
                score
            }
        }).then(res => {
            if (res.data.cue.submitGrade) {
                props.reload()
                setShowSubmission(false)
            }
        })
    }, [score, userId, props.cueId])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    if (user._id && props.channelCreatedBy && user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                        setIsOwner(true)
                    }
                }
            }
        )()
    }, [props.channelCreatedBy])

    const submitEmails = useCallback(async () => {
        const lowerCaseEmails = emails.toLowerCase()
        const parsedEmails: any[] = []
        const unparsedEmails = lowerCaseEmails.split('\n')
        unparsedEmails.map((email) => {
            if (validateEmail(email)) {
                parsedEmails.push(email)
            }
        })
        const server = fetchAPI('')
        server.mutate({
            mutation: inviteByEmail,
            variables: {
                emails: parsedEmails,
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data.user.inviteByEmail) {
                Alert("Users Added!", "Email invite sent.")
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
                    Alert("Unable to load messages.", "Check connection.")
                })
            // mark as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId,
                    groupId
                }
            }).then(res => console.log(res))
                .catch(e => console.log(e))
        }
    }, [])

    const windowHeight = Dimensions.get('window').height - 30;
    const key = JSON.stringify(filteredSubscribers)

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: windowHeight,
            paddingHorizontal: 20,
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            {
                showSubmission || showChat || showAddUsers ?
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                flex: 1,
                                backgroundColor: 'white'
                            }}
                            onPress={() => {
                                if (showChat) {
                                    setShowChat(false)
                                    setUsers([])
                                } else {
                                    setShowSubmission(false)
                                    setStatus("")
                                    setScore("0")
                                    setUserId("")
                                }
                                setShowAddUsers(false)
                            }}>
                            <Text style={{
                                width: '100%',
                                lineHeight: 23
                            }}>
                                <Ionicons name='chevron-back-outline' size={23} color={'#101010'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                        {
                            props.cueId ?
                                <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a6a2a2', fontSize: 18, flex: 1, lineHeight: 25 }}>
                                    Status
                        </Text> :
                                <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a6a2a2', fontSize: 18, flex: 1, lineHeight: 25 }}>
                                    Direct Messaging
                        </Text>
                        }
                        {
                            isOwner ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    style={{
                                        width: '10%',
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowAddUsers(true)}>
                                    <Text style={{
                                        width: '100%',
                                        textAlign: 'right',
                                        lineHeight: 23,
                                        paddingRight: 10,
                                        marginTop: -1
                                    }}>
                                        <Ionicons name='person-add-outline' size={20} color={'#101010'} />
                                    </Text>
                                </TouchableOpacity> : null
                        }
                    </View>
            }
            {
                !showAddUsers ? (subscribers.length === 0 ?
                    <View style={{ backgroundColor: 'white', flex: 1 }}>
                        <Text style={{ width: '100%', color: '#a6a2a2', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                            {
                                props.cueId ? 'No statuses.' : 'No students.'
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
                                                    <Text style={{ width: '100%', color: '#a6a2a2', fontSize: 25, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                        No messages.
                                                    </Text>
                                                    : null
                                            }
                                            {
                                                messages.map((message) => {
                                                    return <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }} key={Math.random()}>
                                                        <MessageCard
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
                                                    }}
                                                    placeholder='Message...'
                                                />
                                            </View>
                                        </ScrollView>
                                        :
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            horizontal={false}
                                            key={filterChoice + key}
                                            contentContainerStyle={{
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        >
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
                                        </ScrollView>
                                ) :
                                <View>
                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        keyboardDismissMode={'on-drag'}
                                        style={{ flex: 1, paddingTop: 12 }}>
                                        <View style={{
                                            width: Dimensions.get('window').width < 1024 ? '100%' : '60%', alignSelf: 'center'
                                        }}>
                                            <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 10 }}>
                                                Score
                                        </Text>
                                            <TextInput
                                                value={score}
                                                style={styles.input}
                                                placeholder={'0-100'}
                                                onChangeText={val => setScore(val)}
                                                placeholderTextColor={'#a6a2a2'}
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
                                                        fontSize: 14,
                                                        backgroundColor: '#0079FE',
                                                        paddingHorizontal: 25,
                                                        fontFamily: 'inter',
                                                        height: 35,
                                                    }}>
                                                        {status === 'graded' ? 'REGRADE' : 'ENTER GRADE'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 10 }}>
                                            Submission
                                        </Text>
                                        <RichEditor
                                            disabled={true}
                                            key={Math.random()}
                                            containerStyle={{
                                                backgroundColor: '#f4f4f4',
                                                padding: 3,
                                                paddingTop: 5,
                                                paddingBottom: 10,
                                                borderRadius: 10
                                            }}
                                            ref={RichText}
                                            style={{
                                                width: '100%',
                                                backgroundColor: '#f4f4f4',
                                                borderRadius: 10,
                                                minHeight: 450
                                            }}
                                            editorStyle={{
                                                backgroundColor: '#f4f4f4',
                                                placeholderColor: '#a6a2a2',
                                                color: '#101010',
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
                                        />
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
                                            height: 20, width: '100%'
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
                                                            color: '#a6a2a2',
                                                            lineHeight: 20
                                                        }}>
                                                        {category}
                                                    </Text>
                                                </TouchableOpacity>
                                            })
                                        }
                                    </ScrollView>
                                </View>
                        }
                    </View>) :
                    <View style={{ alignSelf: 'center', width: 400 }}>
                        <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 10 }}>
                            Invite By Email
                            </Text>
                        <TextInput
                            value={emails}
                            style={{
                                height: 200,
                                backgroundColor: '#f4f4f4',
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
                            placeholderTextColor={'#a6a2a2'}
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
                                color: '#101010s',
                                fontSize: 14,
                                backgroundColor: '#f4f4f4',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                            }}>
                                ADD USERS
                  </Text>
                        </TouchableOpacity>
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
            marginBottom: 20,
            // flex: 1,
            backgroundColor: 'white'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        input: {
            width: '100%',
            borderBottomColor: '#f4f4f4',
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
            borderColor: '#a6a2a2',
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
            borderColor: '#a6a2a2',
            color: 'white'
        }
    })
}
