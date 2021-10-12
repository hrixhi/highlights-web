import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet } from 'react-native';
import { TextInput } from "./CustomTextInput";
import { Text, View, TouchableOpacity } from './Themed';
import { fetchAPI } from '../graphql/FetchAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkChannelStatus, createChannel, createUser, findBySchoolId, getOrganisation, getRole, subscribe } from '../graphql/QueriesAndMutations';
import Alert from '../components/Alert'
import { uniqueNamesGenerator, colors } from 'unique-names-generator'
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import { CirclePicker } from "react-color";
import alert from '../components/Alert';
import { Ionicons } from '@expo/vector-icons';

const ChannelControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [option, setOption] = useState('Create')
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [passwordRequired, setPasswordRequired] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const [fullName, setFullName] = useState('')
    const [temporary, setTemporary] = useState(false)
    const [userFound, setUserFound] = useState(false)
    const [showCreate, setShowCreate] = useState(false)

    const [school, setSchool] = useState<any>(null)
    const [role, setRole] = useState('')
    const [colorCode, setColorCode] = useState("")

    const [channels, setChannels] = useState<any[]>([])

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Alert messages
    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');
    const invalidChannelNameAlert = PreferredLanguageText('invalidChannelName');
    const nameAlreadyInUseAlert = PreferredLanguageText('nameAlreadyInUse');
    const changesNotSavedAlert = PreferredLanguageText('changesNotSaved')

    const [userId, setUserId] = useState('');

    useEffect(() => {
        if (option === "Subscribe") {
            if (!passwordRequired && name) {
                setIsSubmitDisabled(false);
                return;
            } else if (passwordRequired && name && password) {
                setIsSubmitDisabled(false);
                return;
            }

        } else {
            if (name && colorCode !== "") {
                setIsSubmitDisabled(false)
                return;
            }

        }

        setIsSubmitDisabled(true);

    }, [name, password, passwordRequired, option, colorCode])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const parsedUser: any = JSON.parse(u)
                    setUserId(parsedUser._id)
                }
            }
        )()
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
                            props.closeModal()
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

    const handleSub = useCallback(async (cName) => {

        setName(cName)

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

    }, [option, props.closeModal, passwordRequired, displayName, fullName, temporary])

    const handleSubmit = useCallback(async () => {

        setIsSubmitting(true);

        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)

        if (name.toString().trim() === '') {
            return
        }

        const server = fetchAPI('')
        server.mutate({
            mutation: createChannel,
            variables: {
                name,
                password,
                createdBy: user._id,
                temporary,
                colorCode
            }
        })
            .then(res => {
                if (res.data.channel.create) {
                    const channelCreateStatus = res.data.channel.create
                    setIsSubmitting(false);
                    switch (channelCreateStatus) {
                        case "created":
                            Alert("Channel created successfully")
                            props.closeModal()
                            // Refresh subs
                            props.refreshSubscriptions()
                            break;
                        case "invalid-name":
                            Alert(invalidChannelNameAlert)
                            break;
                        case "exists":
                            Alert(nameAlreadyInUseAlert)
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
                setIsSubmitting(false);
                Alert(somethingWrongAlert, checkConnectionAlert)
            })

    }, [option, name, password, props.closeModal, passwordRequired, displayName, fullName, temporary])

    const loadUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        const server = fetchAPI('')
        if (u) {
            const parsedUser = JSON.parse(u)
            setDisplayName(parsedUser.displayName)
            setFullName(parsedUser.fullName)
            setUserFound(true)
            const server = fetchAPI('')
            server.query({
                query: getOrganisation,
                variables: {
                    userId: parsedUser._id
                }
            }).then(res => {
                if (res.data && res.data.school.findByUserId) {
                    setSchool(res.data.school.findByUserId)
                }
            })
            server.query({
                query: getRole,
                variables: {
                    userId: parsedUser._id
                }
            }).then(res => {
                if (res.data && res.data.user.getRole) {
                    setRole(res.data.user.getRole)
                }
            })
        } else {
            const fullName = uniqueNamesGenerator({
                dictionaries: [colors]
            }) + Math.floor(Math.random() * (999 - 100 + 1) + 100).toString();
            const displayName = fullName
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

    useEffect(() => {
        if (school) {
            const server = fetchAPI('')
            server.query({
                query: findBySchoolId,
                variables: {
                    schoolId: school._id
                }
            }).then((res: any) => {
                if (res.data && res.data.channel.findBySchoolId) {
                    res.data.channel.findBySchoolId.sort((a: any, b: any) => {
                        if (a.name < b.name) { return -1; }
                        if (a.name > b.name) { return 1; }
                        return 0;
                    })
                    const c = res.data.channel.findBySchoolId.map((item: any, index: any) => {
                        const x = { ...item, selected: false, index }
                        delete x.__typename
                        return x
                    })
                    const sortedChannels = c.sort((a: any, b: any) => {
                        if (a.name < b.name) { return -1; }
                        if (a.name > b.name) { return 1; }
                        return 0;
                    })
                    setChannels(sortedChannels)
                    setLoading(false)
                }
            }).catch(err => {
                setLoading(false)
            })
        }
    }, [role, school])

    if (!userFound) {
        return <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                <View style={styles.colorBar}>
                    <Text style={{
                        fontSize: 20, color: '#50566B'
                    }}>
                        {PreferredLanguageText('internetRequired')}
                    </Text>
                </View>
            </View>
        </View>
    }

    if (loading) {
        return <View style={{
            width: '100%',
            height: '100%',
            flex: 1,
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            alignSelf: 'center',
            marginTop: 100,
        }}>
            <ActivityIndicator color={'#50566B'} />
        </View>
    }

    const width = Dimensions.get('window').width

    const sortChannels = channels.sort((a: any, b: any) => {

        const aSubscribed = props.subscriptions.find((sub: any) => sub.channelId === a._id)

        const bSubscribed = props.subscriptions.find((sub: any) => sub.channelId === b._id)

        if (aSubscribed && !bSubscribed) return -1;

        return 1;

    })

    return (
        <View style={styles.screen} key={1}>
            <View style={{ width: '100%', maxWidth: 1000, paddingBottom: 25 }}>
                <View style={{ flexDirection: 'row', width: '100%', height: 50, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row' }}>
                        {
                            showCreate ? <TouchableOpacity
                                onPress={() => {
                                    setShowCreate(false)
                                }}
                                style={{
                                    paddingRight: 20,
                                    paddingTop: 10,
                                    alignSelf: 'flex-start',
                                    paddingBottom: 10
                                }}
                            >
                                <Text style={{ lineHeight: 35, width: '100%', textAlign: 'center' }}>
                                    <Ionicons name='arrow-back-outline' size={26} color={'#50566B'} />
                                </Text>
                            </TouchableOpacity> : null
                            // <Text style={{
                            //     fontSize: 23,
                            //     // paddingBottom: 40,
                            //     paddingTop: 10,
                            //     fontFamily: 'inter',
                            //     flex: 1,
                            //     lineHeight: 23,
                            //     color: '#1A2036'
                            // }}>
                            //     <Ionicons name='radio-outline' size={26} color={'#5469D4'} />
                            // </Text>
                        }
                    </View>
                    {
                        showCreate ? null :
                            <TouchableOpacity
                                onPress={() => {
                                    setShowCreate(true)
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    marginTop: 5,
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    // alignSelf: 'flex-end'
                                }}>
                                <Text style={{
                                    textAlign: 'center',
                                    lineHeight: 35,
                                    color: '#5469D4',
                                    fontSize: 12,
                                    borderColor: '#5469D4',
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    // width: 100,
                                    borderRadius: 15,
                                    borderWidth: 1,
                                    textTransform: 'uppercase'
                                }}>
                                    Create
                                </Text>
                            </TouchableOpacity>
                    }
                </View>
                {!showCreate ?
                    <View style={{
                        backgroundColor: '#fff',
                        width: '100%',
                        // marginTop: 40
                    }}>
                        <View
                            style={{
                                borderWidth: channels.length === 0 ? 0 : 1,
                                borderColor: '#E3E8EE',
                                overflow: 'hidden',
                                borderRadius: 0
                            }}
                        >
                            <ScrollView contentContainerStyle={{
                                maxHeight: Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 250 : Dimensions.get('window').height - 175,
                                width: '100%',
                            }}>
                                {
                                    sortChannels.map((channel: any, ind: any) => {

                                        const subscribed = props.subscriptions.find((sub: any) => {
                                            return sub.channelId === channel._id
                                        })

                                        let role = 'Subscribed';

                                        // Check if user is a moderator or the owner
                                        if (subscribed && userId !== "") {

                                            const isModerator = channel.owners.includes(userId);

                                            if (channel.channelCreator === userId) {
                                                role = "Owner";
                                            } else if (isModerator) {
                                                role = "Moderator"
                                            }

                                        }

                                        return <View
                                            // onPress={() => handleSub(channel.name)}
                                            style={{
                                                backgroundColor: '#f7fafc',
                                                flexDirection: 'row',
                                                borderColor: '#E3E8EE',
                                                borderBottomWidth: ind === channels.length - 1 ? 0 : 1,
                                                width: '100%'
                                            }}>
                                            <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                                <Image
                                                    style={{
                                                        height: 25,
                                                        width: 25,
                                                        marginTop: 5,
                                                        marginBottom: 5,
                                                        borderRadius: 75,
                                                        // marginTop: 20,
                                                        alignSelf: 'center'
                                                    }}
                                                    source={{ uri: channel.createdByAvatar ? channel.createdByAvatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                />
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                <Text style={{ fontSize: 11, padding: 5 }} ellipsizeMode='tail'>
                                                    {channel.createdByUsername}
                                                </Text>
                                                <Text style={{ fontSize: 13, padding: 5, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                    {channel.name}
                                                </Text>
                                            </View>
                                            <View style={{ padding: 10 }}>
                                                {
                                                    !subscribed ? <View style={{ flex: 1, paddingLeft: 10, flexDirection: 'column', justifyContent: 'center' }}>
                                                        <TouchableOpacity
                                                            onPress={() => handleSub(channel.name)}
                                                        >
                                                            <Text style={{ textAlign: 'center', fontSize: 13, color: '#5469D4' }} ellipsizeMode='tail'>
                                                                Join
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View> : <View style={{ flex: 1, paddingLeft: 10, flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{
                                                            textAlign: 'center', fontSize: 13,
                                                            fontFamily: 'inter',
                                                            color: role === "Owner" || role === "Moderator" ? '#F94144' : '#35Ac78'
                                                        }}>
                                                            {role}
                                                        </Text>
                                                    </View>}
                                            </View>
                                        </View>
                                    })
                                }
                            </ScrollView>
                        </View>
                    </View>
                    :
                    <View style={{
                        backgroundColor: 'white',
                        // paddingTop: width < 1024 ? 40 : 0,
                        width: '100%',
                        maxWidth: 500,
                        // marginTop: 40,
                        alignSelf: 'center'
                    }}>
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14,
                                // fontFamily: 'inter',
                                color: '#1A2036'
                            }}>
                                {PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                textContentType="oneTimeCode"
                                value={name}
                                placeholder={''}
                                autoCompleteType={'off'}
                                onChangeText={val => {
                                    setName(val)
                                    setPasswordRequired(false)
                                }}
                                placeholderTextColor={'#50566B'}
                                required={true}
                                footerMessage={'case sensitive'}
                            />
                        </View>
                        {
                            (option === 'Subscribe' && passwordRequired) || option === 'Create' ?
                                <View style={{ backgroundColor: 'white' }}>
                                    <Text style={{
                                        fontSize: 14,
                                        // fontFamily: 'inter',
                                        color: '#1A2036'
                                    }}>
                                        {PreferredLanguageText('enrolmentPassword')}
                                    </Text>
                                    <TextInput
                                        value={password}
                                        autoCompleteType={'off'}
                                        textContentType="oneTimeCode"
                                        placeholder={option === 'Subscribe' ? '' : `(${PreferredLanguageText('optional')})`}
                                        onChangeText={val => setPassword(val)}
                                        placeholderTextColor={'#50566B'}
                                        secureTextEntry={true}
                                        required={option === "Subscribe" ? true : false}
                                    />
                                </View>
                                : (
                                    option === 'Subscribe' && !passwordRequired ?
                                        <View
                                            style={{ height: 115, width: '100%', backgroundColor: 'white' }}
                                        /> : null
                                )
                        }
                        {
                            option === 'Create' ?
                                <View
                                    style={{
                                        width: "100%",
                                    }}>
                                    <View
                                        style={{
                                            width: "100%",
                                            // paddingTop: 40,
                                            paddingBottom: 15,
                                            backgroundColor: "white"
                                        }}>
                                        <Text style={{
                                            fontSize: 14,
                                            // fontFamily: 'inter',
                                            color: '#1A2036'
                                        }}>Temporary</Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: "white",
                                            width: "100%",
                                            height: 40,
                                            marginHorizontal: 10
                                        }}>
                                        <Switch
                                            value={temporary}
                                            onValueChange={() => setTemporary(!temporary)}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: "#E3E8EE",
                                                true: "#5469D4"
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                    <Text style={{ color: '#50566B', fontSize: 12 }}>
                                        Channels that are not temporary can only be deleted by the school administrator.
                                    </Text>
                                </View>
                                : null
                        }
                        {
                            option === "Create" ?
                                <View
                                    style={{
                                        width: "100%",
                                        paddingVertical: 15,
                                    }}>
                                    <View
                                        style={{
                                            width: "100%",
                                            paddingTop: 20,
                                            paddingBottom: 15,
                                            backgroundColor: "white"
                                        }}>
                                        <Text style={{
                                            fontSize: 14,
                                            // fontFamily: 'inter',
                                            color: '#1A2036'
                                        }}>Theme</Text>
                                    </View>
                                    <View style={{ width: '100%', backgroundColor: 'white' }}>
                                        <CirclePicker
                                            color={colorCode}
                                            onChangeComplete={(color: any) => setColorCode(color.hex)}
                                        />
                                    </View>
                                </View>
                                : null
                        }
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: 'white',
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'row',
                                height: 50,
                                paddingTop: 25
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
                                            marginTop: 15,
                                            marginBottom: 50
                                        }}
                                        disabled={isSubmitDisabled || isSubmitting}
                                    >
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#5469D4',
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 35,
                                            textTransform: 'uppercase'
                                        }}>
                                            {isSubmitting ? "Creating" : PreferredLanguageText('create')}
                                        </Text>
                                    </TouchableOpacity>
                            }
                        </View>
                    </View>
                }
            </View>
        </View>
    );
}

export default ChannelControls;

const styles = StyleSheet.create({
    screen: {
        paddingVertical: 15,
        // paddingHorizontal: Dimensions.get('window').width < 1024 ? 0 : 20,
        width: '100%',
        height: Dimensions.get('window').height - 150,
        backgroundColor: 'white',
        justifyContent: 'center',
        flexDirection: 'row'
    },
    outline: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#50566B'
    },
    all: {
        fontSize: 14,
        color: '#50566B',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 14,
        color: '#fff',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: '#1A2036',
        borderRadius: 12,
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 20
    },
    input: {
        width: '100%',
        borderBottomColor: '#f7fafc',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    }
});
