import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
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
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [passwordRequired, setPasswordRequired] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const [fullName, setFullName] = useState('')
    const [temporary, setTemporary] = useState(false)
    const [userFound, setUserFound] = useState(false)
    const [school, setSchool] = useState<any>(null)
    const [role, setRole] = useState('')
    const [colorCode, setColorCode] = useState("")

    const [channels, setChannels] = useState<any[]>([])

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

    // Alert messages
    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');
    const invalidChannelNameAlert = PreferredLanguageText('invalidChannelName');
    const nameAlreadyInUseAlert = PreferredLanguageText('nameAlreadyInUse');
    const changesNotSavedAlert = PreferredLanguageText('changesNotSaved')

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
                    switch (channelCreateStatus) {
                        case "created":
                            props.closeModal()
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
                    res.data.channel.findBySchoolId.sort((a, b) => {
                        if (a.name < b.name) { return -1; }
                        if (a.name > b.name) { return 1; }
                        return 0;
                    })
                    const c = res.data.channel.findBySchoolId.map((item: any, index: any) => {
                        const x = { ...item, selected: false, index }
                        delete x.__typename
                        return x
                    })
                    setChannels(c)
                }
            })
        }
    }, [role, school])

    if (!userFound) {
        return <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                <View style={styles.colorBar}>
                    <Text style={{
                        fontSize: 20, color: '#818385'
                    }}>
                        {PreferredLanguageText('internetRequired')}
                    </Text>
                </View>
            </View>
        </View>
    }

    const width = Dimensions.get('window').width

    return (
        <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                {/* <Text
                    style={{
                        fontSize: 20,
                        paddingBottom: 20,
                        fontFamily: 'inter',
                        // textTransform: "uppercase",
                        // paddingLeft: 10,
                        flex: 1,
                        lineHeight: 50
                    }}>
                    {PreferredLanguageText('channels')}
                </Text> */}
                {/* <Text style={{ paddingVertical: 15, fontSize: 14, color: '#a2a2a2' }}>
                    Users can store personal content in the 'My Cues' channel.{'\n\n'}
                </Text> */}
                <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row' }}>
                    <View style={{ backgroundColor: 'white', width: width < 768 ? '100%' : '32%' }}>
                        <Text style={{
                            fontSize: 23,
                            paddingBottom: 40,
                            paddingTop: 10,
                            fontFamily: 'inter',
                            // flex: 1,
                            lineHeight: 23,
                            color: '#43434f'
                        }}>
                            Create
                        </Text>
                        {/* 
                            <View style={styles.colorBar}>
                            <TouchableOpacity
                                style={option === 'Subscribe' ? styles.allOutline : styles.all}
                                onPress={() => {
                                    setOption('Subscribe')
                                }}>
                                <Text style={{ color: option === 'Subscribe' ? '#fff' : '#818385', lineHeight: 20, fontSize: 12 }}>
                                    {PreferredLanguageText('subscribe')}
                                </Text>
                            </TouchableOpacity>
                            {
                                role === 'student' && (school && school.allowStudentChannelCreation === false) ?
                                    null :
                                    <TouchableOpacity
                                        style={option === 'Create' ? styles.allOutline : styles.all}
                                        onPress={() => {
                                            setOption('Create')
                                        }}>
                                        <Text style={{ color: option === 'Create' ? '#fff' : '#818385', lineHeight: 20, fontSize: 12 }}>
                                            {PreferredLanguageText('create')}
                                        </Text>
                                    </TouchableOpacity>
                            } */}
                        {/* {
                        role === 'instructor' ?
                            <TouchableOpacity
                                style={option === 'All' ? styles.allOutline : styles.all}
                                onPress={() => {
                                    setOption('All')
                                }}>
                                <Text style={{ color: option === 'All' ? '#fff' : '#818385', lineHeight: 20, fontSize: 12 }}>
                                    All Channels
                                </Text>
                            </TouchableOpacity> : null
                    } 
                        </View>*/}
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#43434f'
                            }}>
                                {PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                value={name}
                                placeholder={''}
                                autoCompleteType={'off'}
                                onChangeText={val => {
                                    setName(val)
                                    setPasswordRequired(false)
                                }}
                                placeholderTextColor={'#818385'}
                                required={true}
                                footerMessage={'case sensitive'}
                            />
                        </View>
                        {
                            (option === 'Subscribe' && passwordRequired) || option === 'Create' ?
                                <View style={{ backgroundColor: 'white' }}>
                                    <Text style={{
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                        color: '#43434f'
                                    }}>
                                        {PreferredLanguageText('enrolmentPassword')}
                                    </Text>
                                    <TextInput
                                        value={password}
                                        autoCompleteType={'off'}
                                        placeholder={option === 'Subscribe' ? '' : `(${PreferredLanguageText('optional')})`}
                                        onChangeText={val => setPassword(val)}
                                        placeholderTextColor={'#818385'}
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
                                            fontSize: 15,
                                            fontFamily: 'inter',
                                            color: '#43434f'
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
                                                false: "#FBFBFC",
                                                true: "#560bad"
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                    <Text style={{ color: '#818385', fontSize: 12 }}>
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
                                            fontSize: 15,
                                            fontFamily: 'inter',
                                            color: '#43434f'
                                        }}>Color</Text>
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
                                            marginTop: 15
                                        }}
                                        disabled={isSubmitDisabled}
                                    >
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#560bad',
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            height: 35,
                                            textTransform: 'uppercase'
                                        }}>
                                            {PreferredLanguageText('create')} <Ionicons name='add-outline' size={12} />
                                        </Text>
                                    </TouchableOpacity>
                            }
                        </View>
                    </View>
                    <View style={{
                        backgroundColor: '#fff',
                        width: width < 768 ? '100%' : '68%',
                        paddingLeft: width < 768 ? 0 : 20,
                        paddingTop: width < 768 ? 40 : 0,
                        marginLeft: width < 768 ? 0 : 20,
                        borderLeftWidth: width < 768 ? 0 : 1, borderLeftColor: '#e1e9f0'
                    }}>
                        <Text style={{
                            fontSize: 23,
                            paddingBottom: 40,
                            paddingTop: 10,
                            fontFamily: 'inter',
                            // flex: 1,
                            lineHeight: 23,
                            color: '#43434f'
                        }}>
                            Subscribe
                        </Text>
                        <View
                            style={{
                                borderWidth: channels.length === 0 ? 0 : 1,
                                borderColor: '#e1e9f0',
                                overflow: 'hidden',
                                borderRadius: 12
                            }}
                        >
                            {/* <View style={{ backgroundColor: '#fff', flexDirection: 'row' }}>
                                <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#FBFBFC', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 20, lineHeight: 50, fontFamily: 'inter', paddingHorizontal: 20, paddingVertical: 5 }} ellipsizeMode='tail'>
                                        Name
                                    </Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#FBFBFC', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 20, lineHeight: 50, fontFamily: 'inter', paddingHorizontal: 20, paddingVertical: 5 }} ellipsizeMode='tail'>
                                        Instructor
                                    </Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#FBFBFC', paddingLeft: 10 }}>

                                </View>
                            </View> */}
                            <ScrollView contentContainerStyle={{
                                maxHeight: 550
                            }}>
                                {
                                    channels.map((channel: any, ind: any) => {
                                        return <View style={{
                                            backgroundColor: '#fff', flexDirection: 'row', borderColor: '#e1e9f0',
                                            borderBottomWidth: ind === channels.length - 1 ? 0 : 1
                                        }}>
                                            <View style={{ flex: 1, backgroundColor: '#FBFBFC', paddingLeft: 10 }}>
                                                <Text style={{ fontSize: 12, padding: 20, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                    {channel.name}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                <Text style={{ fontSize: 12, lineHeight: 50, paddingHorizontal: 20 }} ellipsizeMode='tail'>
                                                    {channel.createdByUsername}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                <TouchableOpacity
                                                    onPress={() => handleSub(channel.name)}
                                                >
                                                    <Text style={{ textAlign: 'center', fontSize: 12, padding: 20, color: '#560bad' }} ellipsizeMode='tail'>
                                                        Join
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    })
                                }
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default ChannelControls;

const styles = StyleSheet.create({
    screen: {
        padding: 15,
        paddingHorizontal: Dimensions.get('window').width < 768 ? 0 : 20,
        width: '100%',
        height: Dimensions.get('window').height - 230,
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#818385'
    },
    all: {
        fontSize: 15,
        color: '#818385',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 15,
        color: '#fff',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: '#43434f',
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
        borderBottomColor: '#FBFBFC',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    }
});
