import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, ScrollView } from 'react-native';
import Alert from '../components/Alert'
import { Text, View, TouchableOpacity } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { getThreadCategories, createMessage, sendDirectMessage } from '../graphql/QueriesAndMutations';
import MiniEditorScreen from './MiniTextEditor';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NewMessage: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [message, setMessage] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const [anonymous, setAnonymous] = useState(false)
    const [customCategory, setCustomCategory] = useState('')
    const [categories, setCategories] = useState([])
    const [addCustomCategory, setAddCustomCategory] = useState(false)
    const [channelId] = useState<any>(props.channelId)
    const [cueId] = useState<any>(props.cueId)          // Null if Channel Thread. Not null if Cue Thread.
    const [parentId] = useState<any>(props.parentId)    //  Null if new Thread. Not null if reply.
    const now = new Date()

    const loadCategories = useCallback(async () => {
        if (channelId === undefined || channelId === null || channelId === '') {
            return;
        }
        const server = fetchAPI('')
        server.query({
            query: getThreadCategories,
            variables: {
                channelId
            }
        })
            .then(res => {
                if (res.data.thread && res.data.thread.getChannelThreadCategories) {
                    setCategories(res.data.thread.getChannelThreadCategories)
                }
            })
            .catch(err => {
            })
    }, [channelId])

    const createDirectMessage = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (!message || message === '' || !u) {
            return
        }
        const user = JSON.parse(u)
        const users: any[] = props.addUserId ? (
            [user._id, ...props.users]
        ) : props.users
        const server = fetchAPI('')
        server.mutate({
            mutation: sendDirectMessage,
            variables: {
                users,
                message: message,
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data.message.create) {
                props.back()
            } else {
                Alert("Unable to post.", "Check connection.")
            }
        }).catch(err => {
            Alert("Something went wrong.", "Check connection.")
        })
    }, [props.users, message, props.channelId])

    const createThreadMessage = useCallback(async () => {
        if (!message || message === '') {
            return
        }
        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)
        const server = fetchAPI('')
        server.mutate({
            mutation: createMessage,
            variables: {
                message,
                userId: user._id,
                channelId,
                isPrivate,
                anonymous,
                cueId: cueId === null ? 'NULL' : cueId,
                parentId: parentId === null ? 'INIT' : parentId,
                category: customCategory
            }
        }).then(res => {
            if (res.data.thread.writeMessage) {
                props.back()
            } else {
                Alert("Unable to post.", "Check connection.")
            }
        }).catch(err => {
            Alert("Something went wrong.", "Check connection.")
        })

    }, [message, customCategory, isPrivate, anonymous, cueId, channelId, parentId, props.back])

    useEffect(() => {
        if (!props.users) {
            loadCategories()
        }
    }, [props.users]);

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
        }}>
            {
                parentId || props.users ? null :
                    <View style={{ width: '100%', backgroundColor: 'white', display: 'flex', flexDirection: 'row', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                backgroundColor: 'white'
                            }}
                            onPress={() => props.back()}>
                            <Text style={{
                                width: '100%',
                                lineHeight: 23
                            }}>
                                <Ionicons name='chevron-back-outline' size={23} color={'#101010'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
            }
            <View style={styles.date} onTouchStart={() => Keyboard.dismiss()}>
                <Text style={{
                    width: '50%',
                    color: '#a6a2a2',
                    fontSize: 11,
                    lineHeight: 30
                }}>
                    {
                        now.toString().split(' ')[1] +
                        ' ' +
                        now.toString().split(' ')[2] +
                        ', ' +
                        now.toString().split(' ')[3]
                    }
                </Text>
            </View>
            <MiniEditorScreen
                placeholder={props.placeholder}
                message={message}
                setMessage={(m: any) => setMessage(m)}
            />
            {
                props.users ? null :
                    <View style={{ display: 'flex', flexDirection: 'row' }}>
                        {
                            !cueId && !parentId ?
                                <View style={{ width: '33.33%', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 10, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 14, color: '#101010' }}>
                                            Category
                                </Text>
                                    </View>
                                    <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                        <View style={{ width: '85%', backgroundColor: 'white' }}>
                                            {
                                                addCustomCategory ?
                                                    <View style={styles.colorBar}>
                                                        <TextInput
                                                            value={customCategory}
                                                            style={styles.allOutline}
                                                            placeholder={'New Category'}
                                                            onChangeText={val => {
                                                                setCustomCategory(val)
                                                            }}
                                                            placeholderTextColor={'#a6a2a2'}
                                                        />
                                                    </View> :
                                                    <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                        <TouchableOpacity
                                                            style={customCategory === '' ? styles.allOutline : styles.all}
                                                            onPress={() => {
                                                                setCustomCategory('')
                                                            }}>
                                                            <Text style={{ color: '#a6a2a2', lineHeight: 20 }}>
                                                                None
                                                    </Text>
                                                        </TouchableOpacity>
                                                        {
                                                            categories.map((category) => {
                                                                return <TouchableOpacity
                                                                    key={Math.random()}
                                                                    style={category === customCategory ? styles.allOutline : styles.all}
                                                                    onPress={() => {
                                                                        setCustomCategory(category)
                                                                    }}>
                                                                    <Text style={{ color: '#a6a2a2', lineHeight: 20 }}>
                                                                        {category}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            })
                                                        }
                                                    </ScrollView>}
                                        </View>
                                        <View style={{ width: '15%', backgroundColor: 'white' }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (addCustomCategory) {
                                                        setCustomCategory('')
                                                        setAddCustomCategory(false)
                                                    } else {
                                                        setCustomCategory('')
                                                        setAddCustomCategory(true)
                                                    }
                                                }}
                                                style={{ backgroundColor: 'white' }}>
                                                <Text style={{ textAlign: 'right', lineHeight: 20, width: '100%' }}>
                                                    <Ionicons name={addCustomCategory ? 'close' : 'add'} size={20} color={'#a6a2a2'} />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                : null
                        }
                        {
                            parentId ? null :
                                (
                                    parentId ? null :
                                        <View style={{ width: '33.33%', backgroundColor: 'white' }}>
                                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 10, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 14, color: '#101010' }}>
                                                    Private
                                        </Text>
                                            </View>
                                            <Switch
                                                value={isPrivate}
                                                onValueChange={() => setIsPrivate(!isPrivate)}
                                                trackColor={{
                                                    false: '#f4f4f4',
                                                    true: '#a6a2a2'
                                                }}
                                                activeThumbColor='white'
                                                style={{ height: 20 }}
                                            />
                                        </View>
                                )
                        }
                        <View style={{ width: '33.33%', backgroundColor: 'white' }}>
                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 10, backgroundColor: 'white' }}>
                                <Text style={{ fontSize: 14, color: '#101010' }}>
                                    Anonymous
                    </Text>
                            </View>
                            <Switch
                                value={anonymous}
                                onValueChange={() => setAnonymous(!anonymous)}
                                trackColor={{
                                    false: '#f4f4f4',
                                    true: '#a6a2a2'
                                }}
                                activeThumbColor='white'
                                style={{ height: 20 }}
                            />
                        </View>
                    </View>
            }
            <View style={styles.footer}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        height: 50,
                        paddingTop: 10,
                    }}>
                    <TouchableOpacity
                        onPress={() => {
                            if (props.users) {
                                createDirectMessage()
                            } else {
                                createThreadMessage()
                            }
                        }}
                        style={{
                            borderRadius: 15,
                            backgroundColor: 'white'
                        }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: 'white',
                            fontSize: 14,
                            backgroundColor: '#0079FE',
                            borderRadius: 15,
                            paddingHorizontal: 25,
                            overflow: 'hidden',
                            fontFamily: 'inter',
                            height: 35
                        }}>
                            {props.users ? 'SEND' : (parentId ? 'REPLY' : 'POST')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View >
    );
}

export default NewMessage

const styles: any = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'white'
    },
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        marginTop: 80,
        lineHeight: 18
    },
    date: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 4,
        backgroundColor: 'white'
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20
    },
    col1: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingRight: 7.5
    },
    col2: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingLeft: 7.5
    },
    text: {
        fontSize: 12,
        color: '#a6a2a2',
        textAlign: 'left'
    },
    all: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 20,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a6a2a2'
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a6a2a2'
    }
})
