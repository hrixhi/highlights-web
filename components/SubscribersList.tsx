import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TextInput, Dimensions } from 'react-native';
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';
import {
    RichEditor
} from "react-native-pell-rich-editor";
import { fetchAPI } from '../graphql/FetchAPI';
import { submitGrade } from '../graphql/QueriesAndMutations';

const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [filterChoice, setFilterChoice] = useState('All')
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers))
    const [subscribers] = useState<any[]>(unparsedSubs.reverse())
    const categories = ['All', 'Read', 'Delivered', 'Not Delivered']
    const [showSubmission, setShowSubmission] = useState(false)
    const [submission, setSubmission] = useState<any>('')
    const [score, setScore] = useState("0")
    const [status, setStatus] = useState("")
    const [userId, setUserId] = useState("")
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

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: '100%',
            paddingHorizontal: 20,
            borderTopRightRadius: 30,
            borderTopLeftRadius: 30
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            {
                showSubmission ?
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                flex: 1,
                                backgroundColor: 'white'
                            }}
                            onPress={() => {
                                setShowSubmission(false)
                                setStatus("")
                                setScore("0")
                                setUserId("")
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
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
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
                                    Team
                        </Text>
                        }
                    </View>}
            {
                subscribers.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a6a2a2', fontWeight: 'bold', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                props.cueId ? 'No statuses.' : 'No subscribers.'
                            }
                        </Text>
                    </View>
                    :
                    <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flex: 1
                    }}
                        key={JSON.stringify(filteredSubscribers)}
                    >
                        {
                            !showSubmission ?
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    horizontal={false}
                                    contentContainerStyle={{
                                        width: '100%',
                                        height: '100%'
                                        // width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width - 40 : (Dimensions.get('window').width * 0.3 - 70),
                                        // height: Dimensions.get('window').width < 1024 ? '100%' : ((Dimensions.get('window').height - 30) * 0.7),
                                    }}
                                >
                                    <View style={styles.marginSmall} />
                                    {
                                        subscribers.map((subscriber, index) => {
                                            return <View style={styles.col} key={index}>
                                                <SubscriberCard
                                                    fadeAnimation={props.fadeAnimation}
                                                    subscriber={subscriber}
                                                    onPress={() => {
                                                        if (subscriber.fullName === 'submitted' || subscriber.fullName === 'graded') {
                                                            setSubmission(subscriber.submission)
                                                            setShowSubmission(true)
                                                            setStatus(subscriber.fullName)
                                                            setScore(subscriber.score)
                                                            setUserId(subscriber.userId)
                                                        }
                                                    }}
                                                    status={!props.cueId ? false : true}
                                                />
                                            </View>
                                        })
                                    }
                                    <View style={styles.marginSmall} />
                                </ScrollView> :
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
                                                        fontWeight: 'bold',
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
                                            placeholder="Note..."
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
            height: 25,
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
            maxHeight: 80,
            marginBottom: 20,
            flex: 1,
            backgroundColor: 'white'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        input: {
            width: '100%',
            backgroundColor: '#f4f4f4',
            borderRadius: 10,
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
