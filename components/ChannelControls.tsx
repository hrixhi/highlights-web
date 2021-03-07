import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, StyleSheet, TextInput } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import { fetchAPI } from '../graphql/FetchAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkChannelStatus, createChannel, createUser, subscribe, updateUser } from '../graphql/QueriesAndMutations';
import Alert from '../components/Alert'
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'

const ChannelControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [option, setOption] = useState('Subscribe')
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [passwordRequired, setPasswordRequired] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const [fullName, setFullName] = useState('')
    const [userFound, setUserFound] = useState(false)

    const handleSubscribe = useCallback(async () => {

        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)

        const server = fetchAPI('')
        server.mutate({
            mutation: subscribe,
            variables: {
                userId: user._id,
                name,
                password
            }
        })
            .then(res => {
                if (res.data.subscription && res.data.subscription.subscribe) {
                    const subscriptionStatus = res.data.subscription.subscribe
                    switch (subscriptionStatus) {
                        case "subscribed":
                            props.closeModal()
                            break;
                        case "incorrect-password":
                            Alert("Incorrect password.")
                            break;
                        case "already-subbed":
                            Alert("Already subscribed.")
                            break;
                        case "error":
                            Alert("Something went wrong.", "Check connection.")
                            break;
                        default:
                            Alert("Something went wrong.", "Check connection.")
                            break;
                    }
                }
            })
            .catch(err => {
                Alert("Something went wrong.", "Check connection.")
            })

    }, [name, password, props.closeModal])

    const handleSubmit = useCallback(async () => {

        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)

        if (option === 'Subscribe') {

            if (name.toString().trim() === '') {
                return
            }

            if (passwordRequired === true) {
                handleSubscribe()
            } else {
                const server = fetchAPI('')
                server.query({
                    query: checkChannelStatus,
                    variables: {
                        name
                    }
                }).then(res => {
                    if (res.data.channel && res.data.channel.getChannelStatus) {
                        const channelStatus = res.data.channel.getChannelStatus
                        switch (channelStatus) {
                            case "public":
                                handleSubscribe()
                                break;
                            case "private":
                                setPasswordRequired(true)
                                break;
                            case "non-existant":
                                Alert("Does not exist.")
                                break;
                            default:
                                Alert("Something went wrong.", "Check connection.")
                                break
                        }
                    }
                }).catch(err => {
                    Alert("Something went wrong.", "Check connection.")
                })
            }
        } else if (option === 'Create') {

            if (name.toString().trim() === '') {
                return
            }

            const server = fetchAPI('')
            server.mutate({
                mutation: createChannel,
                variables: {
                    name,
                    password,
                    createdBy: user._id
                }
            })
                .then(res => {
                    if (res.data.channel.create) {
                        const channelCreateStatus = res.data.channel.create
                        switch (channelCreateStatus) {
                            case "created":
                                props.closeModal()
                                break;
                            case "invalid-name":
                                Alert("Invalid channel name.")
                                break;
                            case "exists":
                                Alert("Name already in use.")
                                break;
                            case "error":
                                Alert("Something went wrong.", "Check connection.")
                                break;
                            default:
                                Alert("Something went wrong.", "Check connection.")
                                break;
                        }
                    }
                })
                .catch(err => {
                    Alert("Something went wrong.", "Check connection.")
                })
        } else if (option === 'Profile') {
            if (displayName.toString().trim() === '' || fullName.toString().trim() === '') {
                return;
            }
            const u = await AsyncStorage.getItem('user')
            if (u) {
                const parsedUser = JSON.parse(u)
                parsedUser["displayName"] = displayName.toString().trim()
                parsedUser["fullName"] = fullName.toString().trim()
                const server = fetchAPI('')
                server.mutate({
                    mutation: updateUser,
                    variables: {
                        userId: parsedUser._id,
                        displayName,
                        fullName
                    }
                }).then(async (res) => {
                    if (res.data.user && res.data.user.update) {
                        const updatedValue = JSON.stringify(parsedUser)
                        await AsyncStorage.setItem('user', updatedValue)
                        props.closeModal()
                    }
                }).catch(err => {
                    Alert("Changes not saved.", "Check connection.")
                })
            }
        }

    }, [option, name, password, props.closeModal, passwordRequired, displayName, fullName])

    const loadUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        const server = fetchAPI('')
        if (u) {
            const parsedUser = JSON.parse(u)
            setDisplayName(parsedUser.displayName)
            setFullName(parsedUser.fullName)
            setUserFound(true)
        } else {
            const fullName = uniqueNamesGenerator({
                dictionaries: [adjectives, colors, animals]
            });
            const displayName = uniqueNamesGenerator({
                dictionaries: [adjectives, colors, animals]
            });
            const notificationId = 'NOT_SET';
            server.mutate({
                mutation: createUser,
                variables: {
                    fullName,
                    displayName,
                    notificationId
                }
            })
                .then(async res => {
                    const u = res.data.user.create
                    if (u.__typename) {
                        delete u.__typename
                    }
                    const sU = JSON.stringify(u)
                    await AsyncStorage.setItem('user', sU)
                    setDisplayName(u.displayName)
                    setFullName(u.fullName)
                    setUserFound(true)
                })
                .catch(err => {
                    Alert("Unable to register user.", "Check connection.")
                })
        }
    }, [])

    useEffect(() => {
        loadUser()
    }, [])

    if (!userFound) {
        return <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                <View style={styles.colorBar}>
                    <Text style={{ fontSize: 25, color: '#a6a2a2', fontWeight: 'bold' }}>
                        Internet connection required to initialise.
                    </Text>
                </View>
            </View>
        </View>
    }

    return (
        <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                <View style={styles.colorBar}>
                    <TouchableOpacity
                        style={option === 'Subscribe' ? styles.allOutline : styles.all}
                        onPress={() => {
                            setOption('Subscribe')
                        }}>
                        <Text style={{ color: '#a6a2a2', lineHeight: 20 }}>
                            Subscribe
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={option === 'Create' ? styles.allOutline : styles.all}
                        onPress={() => {
                            setOption('Create')
                        }}>
                        <Text style={{ color: '#a6a2a2', lineHeight: 20 }}>
                            Create
                        </Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                        style={option === 'Profile' ? styles.allOutline : styles.all}
                        onPress={() => {
                            setOption('Profile')
                        }}>
                        <Text style={{ color: '#a6a2a2', lineHeight: 20 }}>
                            Profile
                        </Text>
                    </TouchableOpacity> */}
                </View>
                {
                    option === 'Profile' ?
                        <View style={{ width: '100%', backgroundColor: 'white' }}>
                            <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 10 }}>
                                Display Name
                            </Text>
                            <TextInput
                                value={displayName}
                                style={styles.input}
                                placeholder={''}
                                onChangeText={val => setDisplayName(val)}
                                placeholderTextColor={'#a6a2a2'}
                            />
                            <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 10 }}>
                                Full Name
                            </Text>
                            <TextInput
                                value={fullName}
                                style={styles.input}
                                placeholder={''}
                                onChangeText={val => setFullName(val)}
                                placeholderTextColor={'#a6a2a2'}
                            />
                        </View>
                        :
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 10 }}>
                                Course
                            </Text>
                            <TextInput
                                value={name}
                                style={styles.input}
                                placeholder={''}
                                onChangeText={val => {
                                    setName(val)
                                    setPasswordRequired(false)
                                }}
                                placeholderTextColor={'#a6a2a2'}
                            />
                        </View>
                }
                {
                    (option === 'Subscribe' && passwordRequired) || option === 'Create' ?
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 10 }}>
                                Enrolment Password
                            </Text>
                            <TextInput
                                value={password}
                                style={styles.input}
                                placeholder={option === 'Subscribe' ? '' : '(optional)'}
                                onChangeText={val => setPassword(val)}
                                placeholderTextColor={'#a6a2a2'}
                                secureTextEntry={true}
                            />
                        </View>
                        : (
                            option === 'Subscribe' && !passwordRequired ?
                                <View
                                    style={{ height: 115, width: '100%', backgroundColor: 'white' }}
                                /> : null
                        )
                }
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        height: 50,
                        paddingTop: 75
                    }}>
                    {
                        option === 'About' ? null :
                            <TouchableOpacity
                                onPress={() => handleSubmit()}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    overflow: 'hidden',
                                    height: 35,
                                    marginTop: 15
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
                                    {option === 'Profile' ? 'SAVE' : option.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                    }
                </View>
            </View>
        </View>
    );
}

export default ChannelControls;

const styles = StyleSheet.create({
    screen: {
        padding: 15,
        paddingHorizontal: 30,
        width: '100%',
        height: Dimensions.get('window').height - 50,
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a6a2a2'
    },
    all: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 22,
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
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 15
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
    }
});
