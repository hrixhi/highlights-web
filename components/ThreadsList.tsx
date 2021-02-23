import React, { useCallback, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import Swiper from 'react-native-swiper'
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import ThreadCard from './ThreadCard';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { getThreadWithReplies } from '../graphql/QueriesAndMutations';
import NewMessage from './NewMessage';
import ThreadReplyCard from './ThreadReplyCard';

const ThreadsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loading, setLoading] = useState(false)
    const unparsedThreads: any[] = JSON.parse(JSON.stringify(props.threads))
    const [threads] = useState<any[]>(unparsedThreads.reverse())
    const [threadWithReplies, setThreadWithReplies] = useState<any[]>([])
    const [numCards] = useState(5)
    const styles = styleObject()
    const [showThreadCues, setShowThreadCues] = useState(false)
    const [filterChoice, setFilterChoice] = useState('All')
    const [showPost, setShowPost] = useState(false)
    const [threadId, setThreadId] = useState('')
    const categories: any[] = []
    const categoryObject: any = {}
    let filteredThreads: any[] = []
    threads.map((item) => {
        if (item.category !== '' && !categoryObject[item.category]) {
            categoryObject[item.category] = 'category'
        }
    })
    Object.keys(categoryObject).map((key) => {
        categories.push(key)
    })
    if (filterChoice === 'All') {
        filteredThreads = threads
    } else {
        filteredThreads = threads.filter((item) => {
            return item.category === filterChoice
        })
    }
    const length = showThreadCues ? threadWithReplies.length : filteredThreads.length
    const pages = showThreadCues
        ? new Array(Math.ceil(threadWithReplies.length / numCards))
        : new Array(Math.ceil(filteredThreads.length / numCards))
    for (let i = 0; i < pages.length; i++) {
        pages[i] = 0
    }

    const loadCueDiscussions = useCallback((tId) => {
        setThreadId(tId)
        setLoading(true)
        setShowThreadCues(true)
        const server = fetchAPI('')
        server.query({
            query: getThreadWithReplies,
            variables: {
                threadId: tId
            }
        })
            .then(res => {
                setThreadWithReplies(res.data.thread.getThreadWithReplies)
                setLoading(false)
            })
            .catch(err => {
                Alert.alert("Unable to load thread.", "Check connection.")
                setLoading(false)
            })
    }, [])

    if (showPost) {
        return <View style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            padding: 15,
            paddingTop: 5,
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 35 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <NewMessage
                cueId={props.cueId}
                channelId={props.channelId}
                parentId={null}
                back={() => {
                    props.reload()
                    setShowPost(false)
                    setThreadId('')
                }}
                placeholder='Post...'
            />
        </View>
    }

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: '100%',
            paddingTop: 5,
            padding: 20,
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 30 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            {
                showThreadCues ?
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                flex: 1,
                                backgroundColor: 'white'
                            }}
                            onPress={() => {
                                props.reload()
                                setThreadWithReplies([])
                                setShowThreadCues(false)
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
                            !props.cueId
                                ? <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a6a2a2', fontWeight: 'bold', fontSize: 20, flex: 1, lineHeight: 25 }}>
                                    Discussion
                                </Text>
                                : <Text
                                    ellipsizeMode="tail"
                                    style={{ color: '#a6a2a2', fontWeight: 'bold', fontSize: 20, flex: 1, lineHeight: 25 }}>
                                    Comments
                                </Text>
                        }
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                width: '10%',
                                backgroundColor: 'white'
                            }}
                            onPress={() => setShowPost(true)}>
                            <Text style={{
                                width: '100%',
                                textAlign: 'right',
                                lineHeight: 23,
                                paddingRight: 10,
                                marginTop: -1
                            }}>
                                <Ionicons name='create-outline' size={20} color={'#101010'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
            }
            {
                threads.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a6a2a2', fontWeight: 'bold', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                !props.cueId ? 'No posts.' : 'No comments.'
                            }
                        </Text>
                    </View>
                    : (
                        loading ?
                            <View style={{
                                width: '100%',
                                justifyContent: 'center',
                                flex: 1,
                                flexDirection: 'column',
                                backgroundColor: 'white'
                            }}>
                                <ActivityIndicator color={'#a6a2a2'} />
                            </View> :
                            <View style={{
                                width: '100%',
                                backgroundColor: 'white',
                                flex: 1
                            }}>
                                {
                                    !showThreadCues ?
                                        <Swiper
                                            containerStyle={{}}
                                            index={0}
                                            activeDotColor={'#0079FE'}
                                            horizontal={false}
                                            dotColor={'#e0e0e0'}
                                            dotStyle={{ marginRight: -30, marginBottom: 11, opacity: 1 }}
                                            activeDotStyle={{ marginRight: -30, marginBottom: 11, opacity: 1 }}
                                            loadMinimal={true}
                                            loadMinimalSize={1}
                                            loop={false}
                                            key={JSON.stringify(filterChoice)}
                                        >
                                            {
                                                pages.map((pageUndef, pageNumber) => {
                                                    const index = (pageNumber * numCards);
                                                    return <View style={styles.screen} key={Math.random()}>
                                                        <View style={styles.col}>
                                                            {
                                                                (index + 0 > length - 1) ? null :
                                                                    <ThreadCard
                                                                        fadeAnimation={props.fadeAnimation}
                                                                        thread={filteredThreads[index + 0]}
                                                                        onPress={() => loadCueDiscussions(filteredThreads[index + 0]._id)}
                                                                        channelCreatedBy={props.channelCreatedBy}
                                                                    />
                                                            }
                                                            <View style={styles.margin} />
                                                            {
                                                                (index + 1 > length - 1) ? null :
                                                                    <ThreadCard
                                                                        fadeAnimation={props.fadeAnimation}
                                                                        thread={filteredThreads[index + 1]}
                                                                        onPress={() => loadCueDiscussions(filteredThreads[index + 1]._id)}
                                                                        channelCreatedBy={props.channelCreatedBy}
                                                                    />
                                                            }
                                                            <View style={styles.margin} />
                                                            {
                                                                (index + 2 > length - 1) ? null :
                                                                    <ThreadCard
                                                                        fadeAnimation={props.fadeAnimation}
                                                                        thread={filteredThreads[index + 2]}
                                                                        onPress={() => loadCueDiscussions(filteredThreads[index + 2]._id)}
                                                                        channelCreatedBy={props.channelCreatedBy}
                                                                    />
                                                            }
                                                            <View style={styles.margin} />
                                                            {
                                                                (index + 3 > length - 1) ? null :
                                                                    <ThreadCard
                                                                        fadeAnimation={props.fadeAnimation}
                                                                        thread={filteredThreads[index + 3]}
                                                                        onPress={() => loadCueDiscussions(filteredThreads[index + 3]._id)}
                                                                        channelCreatedBy={props.channelCreatedBy}
                                                                    />
                                                            }
                                                            <View style={styles.margin} />
                                                            {
                                                                (index + 4 > length - 1) ? null :
                                                                    <ThreadCard
                                                                        fadeAnimation={props.fadeAnimation}
                                                                        thread={filteredThreads[index + 4]}
                                                                        onPress={() => loadCueDiscussions(filteredThreads[index + 4]._id)}
                                                                        channelCreatedBy={props.channelCreatedBy}
                                                                    />
                                                            }
                                                            <View style={styles.margin} />
                                                        </View>
                                                    </View>
                                                })
                                            }
                                        </Swiper> :
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            keyboardDismissMode={'on-drag'}
                                            style={{ flex: 1, paddingTop: 12 }}>
                                            {
                                                threadWithReplies.map((thread) => {
                                                    return <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }} key={Math.random()}>
                                                        <ThreadReplyCard
                                                            channelCreatedBy={props.channelCreatedBy}
                                                            thread={thread} />
                                                    </View>
                                                })
                                            }
                                            <View style={{ backgroundColor: 'white' }}>
                                                <NewMessage
                                                    cueId={props.cueId}
                                                    channelId={props.channelId}
                                                    parentId={threadId}
                                                    back={() => {
                                                        props.reload()
                                                        setShowPost(false)
                                                        setThreadId('')
                                                    }}
                                                    placeholder='Reply...'
                                                />
                                            </View>
                                        </ScrollView>
                                }
                                {
                                    showThreadCues ? null :
                                        <View style={{
                                            width: '100%',
                                            height: 60,
                                            backgroundColor: 'white',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            flexDirection: 'column'
                                        }}>
                                            {
                                                props.cueId === null && !showThreadCues ?
                                                    <ScrollView
                                                        contentContainerStyle={{
                                                            height: 20, width: '100%'
                                                        }}
                                                        style={{}}
                                                        horizontal={true}
                                                        showsHorizontalScrollIndicator={false}
                                                    >
                                                        {
                                                            categories.length === 0 ? null :
                                                                <TouchableOpacity
                                                                    style={filterChoice === 'All' ? styles.cusCategoryOutline : styles.cusCategory}
                                                                    onPress={() => setFilterChoice('All')}>
                                                                    <Text
                                                                        style={{
                                                                            color: '#a6a2a2',
                                                                            lineHeight: 20,
                                                                        }}
                                                                    >
                                                                        All
                                                                    </Text>
                                                                </TouchableOpacity>
                                                        }
                                                        {
                                                            categories.map((category: string) => {
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
                                                    </ScrollView> : null
                                            }
                                        </View>
                                }
                            </View>
                    )
            }
        </View >
    );
}

export default React.memo(ThreadsList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads)
})

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        margin: {
            height: '2.5%',
            backgroundColor: 'white'
        },
        marginSmall: {
            height: '2.5%',
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
            paddingRight: 7.5,
            flex: 1,
            backgroundColor: 'white'
        },
        colorBar: {
            width: '100%',
            height: '10%',
            flexDirection: 'row'
        },
        channelOption: {
            width: '33.333%'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
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
