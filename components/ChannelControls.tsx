// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import { checkChannelStatus, checkChannelStatusForCode, createChannel, findBySchoolId, getOrganisation, getRole, subscribe, getChannelsOutside, getUserCount,  } from '../graphql/QueriesAndMutations';

// COMPONENTS
import { TextInput } from "./CustomTextInput";
import { Text, View, TouchableOpacity } from './Themed';
import Alert from '../components/Alert'
import { ScrollView, Switch } from 'react-native-gesture-handler';
import { CirclePicker } from "react-color";
import alert from '../components/Alert';
import TextareaAutosize from 'react-textarea-autosize';
import ReactTagInput from "@pathofdev/react-tag-input";
import "@pathofdev/react-tag-input/build/index.css";
import { Select } from '@mobiscroll/react'
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';

const ChannelControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [passwordRequired, setPasswordRequired] = useState(false)
    const [displayName, setDisplayName] = useState('')
    const [fullName, setFullName] = useState('')
    const [temporary, setTemporary] = useState(false)
    const [description, setDescription] = useState('')
    const [isPublic, setIsPublic] = useState(true);
    const [tags, setTags] = useState<string[]>([])
    const [school, setSchool] = useState<any>(null)
    const [role, setRole] = useState('')
    const [colorCode, setColorCode] = useState("")
    const [channels, setChannels] = useState<any[]>([])
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joinWithCode, setJoinWithCode] = useState('');
    const [joinWithCodeDisabled, setJoinWithCodeDisabled] = useState(true);
    const [userId, setUserId] = useState('');
    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",]
     const filterRoleOptions = [
         {
             value: 'All',
             text: 'All Users'
         },
         {
             value: 'student',
             text: 'Student'
         },
         {
             value: 'instructor',
             text: 'Instructor'
         }
     ]
     const gradeOptions = grades.map((g: any) => {
         return {
             value: g,
             text: g
         }
     })
     const filterGradeOptions = [
         {
             value: 'All',
             text: 'All Grades'
         },
         ...gradeOptions
     ]
     const sectionOptions = sections.map((s: any) => {
         return {
             value: s,
             text: s
         }
     })
     const filterSectionOptions = [
         {
             value: 'All',
             text: 'All Sections'
         },
         ...sectionOptions
     ]
     const [activeRole, setActiveRole] = useState('All');
     const [activeGrade, setActiveGrade] = useState('All');
     const [activeSection, setActiveSection] = useState('All');
    const [selectedValues, setSelectedValues] = useState<any[]>([]);
    const [selectedModerators, setSelectedModerators] = useState<any[]>([]);
    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');
    const invalidChannelNameAlert = PreferredLanguageText('invalidChannelName');
    const nameAlreadyInUseAlert = PreferredLanguageText('nameAlreadyInUse');
    const moderatorOptions = selectedValues.map((value: any) => {
        const match = options.find((o: any) => {
            return o.value === value;
        })

        return match
	})
	const sortChannels = channels.sort((a: any, b: any) => {

        const aSubscribed = props.subscriptions.find((sub: any) => sub.channelId === a._id)

        const bSubscribed = props.subscriptions.find((sub: any) => sub.channelId === b._id)

        if (aSubscribed && !bSubscribed) return -1;

        return 1;

    })

    // HOOKS 

     /**
     * @description Loads user on Init
     */
    useEffect(() => {
        loadUser()
    }, [])

    /**
     * @description Filter dropdown users based on Roles, Grades and Section
     */
    useEffect(() => {

        let filteredUsers = [...allUsers];

        // First filter by role

        if (activeRole !== "All") {
            const filterRoles = filteredUsers.filter((user: any) => {
                return user.role === activeRole || selectedValues.includes(user._id)
            })

            filteredUsers = filterRoles;
        }

        if (activeGrade !== "All") {
            const filterGrades = filteredUsers.filter((user: any) => {
                return user.grade === activeGrade || selectedValues.includes(user._id)
            })

            filteredUsers = filterGrades
        }

        if (userId !== "") {
            const filterOutMainOwner = filteredUsers.filter((user: any) => {
                return user._id !== userId
            })

            filteredUsers = filterOutMainOwner
        }


        if (activeSection !== "All") {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection || selectedValues.includes(user._id)
            })

            filteredUsers = filterSections
        }


        let filteredOptions = filteredUsers.map((user: any) => {
            return {
                group: user.fullName[0].toUpperCase(),
                text: user.fullName + ", " + user.email,
                value: user._id
            }
        })

        const sort = filteredOptions.sort((a, b) => {
            if (a.group < b.group) { return -1; }
            if (a.group > b.group) { return 1; }
            return 0;
        })

        setOptions(sort)

    }, [activeRole, activeGrade, activeSection, userId])

    /**
     * @description Validate submit for new channel
     */
    useEffect(() => {
        
        if (name !== "") {
            setIsSubmitDisabled(false)
            return;            
        }

        setIsSubmitDisabled(true);

    }, [name, password, passwordRequired, props.showCreate, colorCode, school])

    /**
     * @description Validate submit for join channel with code
     */
    useEffect(() => {

        if (joinWithCode !== "" && joinWithCode.length === 9) {
            setJoinWithCodeDisabled(false)
        } else {
            setJoinWithCodeDisabled(true)
        }

    }, [joinWithCode])

    /**
    * @description Fetches channels for users
    */
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
        } else {
            // Fetch all public channels here
            loadOutsideChannels()
        }
    }, [role, school])

    /**
     * @description Fetch all users to allow selection for Users to create channel
     */
    const fetchSchoolUsers = useCallback((schoolId) => {
       
            const server = fetchAPI('');
            server.query({
                query: getUserCount,
                variables: {
                    schoolId
                }
            }).then((res) => {
                res.data.user.getSchoolUsers.sort((a: any, b: any) => {
                    if (a.fullName < b.fullName) { return -1; }
                    if (a.fullName > b.fullName) { return 1; }
                    return 0;
                })

                setAllUsers(res.data.user.getSchoolUsers);

                const tempUsers: any[] = []
                            res.data.user.getSchoolUsers.map((item: any, index: any) => {
                                const x = { ...item, selected: false, index }
                                delete x.__typename
                                tempUsers.push({
                                    group: item.fullName[0].toUpperCase(),
                                    text: item.fullName + ", " + item.email,
                                    value: item._id 
                                })
                                return x
                            })

                            const sort = tempUsers.sort((a, b) => {
                                if (a.text < b.text) { return -1; }
                                if (a.text > b.text) { return 1; }
                                return 0;
                            })

                            setOptions(sort)
            })
    }, [])

	/**
	 * @description Subscribes user to a channel
	 */
	const handleSubscribe = useCallback(async (channelId, pass) => {

        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)

        const server = fetchAPI('')
        server.mutate({
            mutation: subscribe,
            variables: {
                userId: user._id,
                channelId,
                password: pass
            }
        })
            .then(res => {
                if (res.data.subscription && res.data.subscription.subscribe) {
                    const subscriptionStatus = res.data.subscription.subscribe
                    switch (subscriptionStatus) {
                        case "subscribed":
                            alert('Subscribed successfully!')
                            // Refresh subscriptions
                            props.refreshSubscriptions()
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

	/**
	 * @description Fetches status of channel and depending on that handles subscription to channel
	 */
    const handleSub = useCallback(async (channelId) => {

        const server = fetchAPI('')
        server.query({
            query: checkChannelStatus,
            variables: {
                channelId
            }
        }).then(res => {
            if (res.data.channel && res.data.channel.getChannelStatus) {
                const channelStatus = res.data.channel.getChannelStatus
                switch (channelStatus) {
                    case "password-not-required":
                        handleSubscribe(channelId, '')
                        break;
                    case "password-required":
                        let pass: any = prompt('Enter Password')
                        if (!pass) {
                            pass = ''
                        }
                        handleSubscribe(channelId, pass)
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

    }, [props.closeModal, passwordRequired, displayName, fullName, temporary])

	/**
	 * @description Fetches status of channel using code and then handles subscription
	 */
    const handleSubmitCode = useCallback(async () => {
        const server = fetchAPI('')
        server.query({
            query: checkChannelStatusForCode,
            variables: {
                accessCode: joinWithCode
            }
        }).then(res => {
            if (res.data.channel && res.data.channel.getChannelStatusForCode) {

                const channelStatus = res.data.channel.getChannelStatusForCode.split(":")

                switch (channelStatus[0]) {
                    case "password-not-required":
                        handleSubscribe(channelStatus[1], '')
                        break;
                    case "password-required":
                        let pass: any = prompt('Enter Password')
                        if (!pass) {
                            pass = ''
                        }
                        handleSubscribe(channelStatus[1], pass)
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
    }, [joinWithCode])

	/**
	 * @description Handle create new channel
	 */
    const handleSubmit = useCallback(async () => {

        if (colorCode === '') {
            Alert('Select color theme for channel.')
            return;
        }

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
                colorCode,
                description,
                tags,
                isPublic,
                moderators: selectedModerators,
                subscribers: selectedValues
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
    }, [name, password, props.closeModal, passwordRequired, displayName, fullName, temporary, colorCode, description, isPublic, tags, selectedModerators, selectedValues])

	/**
	 * @description Loads user 
	 */
    const loadUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setUserId(parsedUser._id)
            setDisplayName(parsedUser.displayName)
            setFullName(parsedUser.fullName)
            const server = fetchAPI('')
            server.query({
                query: getOrganisation,
                variables: {
                    userId: parsedUser._id
                }
            }).then(res => {
                if (res.data && res.data.school.findByUserId) {
                    setSchool(res.data.school.findByUserId)

                    fetchSchoolUsers(res.data.school.findByUserId._id)
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
        } 
    }, [])

	/**
	 * @description Load outside channels for user without school id 
	 */
    const loadOutsideChannels = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
            
        if (u) {
        
            const server = fetchAPI('')

            const parsedUser = JSON.parse(u)

            server.query({
                query: getChannelsOutside,
                variables: {
                    userId: parsedUser._id,
                }
            }).then((res: any) => {
                if (res.data && res.data.channel.getChannelsOutside) {

                    res.data.channel.getChannelsOutside.sort((a: any, b: any) => {
                        if (a.name < b.name) { return -1; }
                        if (a.name > b.name) { return 1; }
                        return 0;
                    })
                    const c = res.data.channel.getChannelsOutside.map((item: any, index: any) => {
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
    }, [])

	// FUNCTIONS

   	/**
	* @description Renders filters for Subscribers dropdown 
	*/
    const renderSubscriberFilters = () => {
        return (<View style={{ width: '100%', flexDirection: 'column', backgroundColor: 'white', marginTop: 20 }}>
            <View style={{ backgroundColor: 'white', }}>
                <View style={{ backgroundColor: 'white', }}>
                    <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                        <Select
                            touchUi={true}
                            value={activeRole}
                            rows={3}
                            themeVariant="light"
                            onChange={(val: any) => {
                                setActiveRole(val.value)
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble'
                                },
                                medium: {
                                    touchUi: false
                                }
                            }}
                            data={filterRoleOptions}
                        />
                    </label>
                </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <View style={{ backgroundColor: 'white', paddingRight: 20 }}>
                    <View style={{ backgroundColor: 'white', }}>
                        <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                            <Select
                                touchUi={true}
                                value={activeGrade}
                                themeVariant="light"
                                onChange={(val: any) => {
                                    setActiveGrade(val.value)
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false
                                    }
                                }}
                                data={filterGradeOptions}
                            />
                        </label>
                    </View>
                </View>
                <View style={{ backgroundColor: 'white', }}>
                    <View style={{ backgroundColor: 'white', }}>
                        <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                            <Select
                                touchUi={true}
                                value={activeSection}
                                themeVariant="light"
                                onChange={(val: any) => {
                                    setActiveSection(val.value)
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false
                                    }
                                }}
                                data={filterSectionOptions}
                            />
                        </label>
                    </View>
                </View>
            </View>

        </View>)
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
            <ActivityIndicator color={'#1F1F1F'} />
        </View>
    }

    return (
        <View style={{
            width: '100%',
            maxHeight: Dimensions.get("window").width < 768 ? Dimensions.get("window").height - 115 : Dimensions.get("window").height - 52,
            backgroundColor: props.showCreate ? "#fff" : '#efefef',
            justifyContent: 'center',
            flexDirection: 'row'
        }} key={1}>
            <View style={{ width: '100%', maxWidth: 900, paddingBottom: 25, backgroundColor: props.showCreate ? '#fff' : '#efefef' }}>
                {/* Back Button */}
                {
                    props.showCreate ?
                        <View style={{ flexDirection: 'row', width: '100%', height: 50, marginBottom: 10, paddingLeft: 10 }}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        props.setShowCreate(false)
                                    }}
                                    style={{
                                        paddingRight: 20,
                                        paddingTop: 10,
                                        alignSelf: 'flex-start',
                                        paddingBottom: 10
                                    }}
                                >
                                    <Text style={{ lineHeight: 34, width: '100%', textAlign: 'center' }}>
                                        <Ionicons name='chevron-back-outline' size={30} color={'#1F1F1F'} />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View> : null
                }
                {/* Main Content */}
                {!props.showCreate ?
                    <View style={{
                        backgroundColor: '#efefef',
                        width: '100%',
                        minHeight: Dimensions.get("window").height - 52
                    }}>

                        {/* */}
                        {sortChannels.length === 0 ? <View
                            style={{
                                width: "100%",
                                flex: 1,
                                justifyContent: "center",
                                display: "flex",
                                flexDirection: "column",
                                backgroundColor: "#efefef",
                                paddingVertical: 100
                            }}>
                            <ActivityIndicator color={"#1F1F1F"} />
                        </View> : <View
                            style={{
                                borderColor: '#efefef',
                                backgroundColor: '#efefef',
                                overflow: 'hidden',
                                borderRadius: 1,
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 4,
                                    height: 4,
                                },
                                shadowOpacity: 0.12,
                                shadowRadius: 10, 
                            }}
                        >
                            <ScrollView contentContainerStyle={{
                                maxHeight: Dimensions.get("window").width < 1024 ? Dimensions.get("window").height - 115 : Dimensions.get("window").height - 52,
                                width: '100%',
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 4,
                                    height: 4,
                                },
                                shadowOpacity: 0.12,
                                shadowRadius: 10, 
                            }}
                            showsVerticalScrollIndicator={true}  
                            >
                                {
                                    sortChannels.map((channel: any, ind: any) => {

                                        const subscribed = props.subscriptions.find((sub: any) => {
                                            return sub.channelId === channel._id
                                        })

                                        let role = 'Viewer';

                                        // Check if user is a moderator or the owner
                                        if (subscribed && userId !== "") {

                                            const isModerator = channel.owners.includes(userId);

                                            if (channel.channelCreator === userId) {
                                                role = "Owner";
                                            } else if (isModerator) {
                                                role = "Editor"
                                            }

                                        }

                                        return <View
                                            style={{
                                                backgroundColor: '#fff',
                                                flexDirection: 'row',
                                                borderColor: '#efefef',
                                                borderBottomWidth: ind === channels.length - 1 ? 0 : 1,
                                                width: '100%',
                                                paddingVertical: 5
                                            }}>
                                            <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                                <Image
                                                    style={{
                                                        height: 35,
                                                        width: 35,
                                                        marginTop: 5,
                                                        marginLeft: 5,
                                                        marginBottom: 5,
                                                        borderRadius: 75,
                                                        alignSelf: 'center'
                                                    }}
                                                    source={{ uri: channel.createdByAvatar ? channel.createdByAvatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                />
                                            </View>
                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                <Text style={{ fontSize: 15, padding: 5, fontFamily: 'inter', marginTop: 5 }} ellipsizeMode='tail'>
                                                    {channel.name}
                                                </Text>
                                                <Text style={{ fontSize: 11, padding: 5, fontWeight: 'bold' }} ellipsizeMode='tail'>
                                                    {channel.createdByUsername}
                                                </Text>
                                            </View>
                                            <View style={{ padding: 20 }}>
                                                {
                                                    !subscribed ? <View style={{ flex: 1, paddingLeft: 10, flexDirection: 'column', justifyContent: 'center' }}>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                Alert("Subscribe to " + channel.name + "?", "", [
                                                                    {
                                                                        text: "Cancel",
                                                                        style: "cancel",
                                                                        onPress: () => {
                                                                            return;
                                                                        }
                                                                    },
                                                                    {
                                                                        text: "Yes",
                                                                        onPress: () => handleSub(channel._id)
                                                                    }
                                                                ])
                                                            }}
                                                        >
                                                            <Text style={{ textAlign: 'center', fontSize: 13, color: '#006AFF', marginRight: 10 }} ellipsizeMode='tail'>
                                                                <Ionicons name='enter-outline' size={18} />
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View> : <View style={{ flex: 1, paddingLeft: 10, flexDirection: 'column', justifyContent: 'center' }}>
                                                        <Text style={{
                                                            textAlign: 'center', fontSize: 13,
                                                            fontFamily: 'inter',
                                                            color: (channel.channelCreator === userId || channel.owners.includes(userId)) ? '#006AFF' : '#1F1F1F'
                                                        }}>
                                                            {role}
                                                        </Text>
                                                    </View>}
                                            </View>
                                        </View>
                                    })
                                }
                            </ScrollView>
                        </View>}
                    </View>
                    :
                    <View style={{
                        backgroundColor: 'white',
                        width: '100%',
                        maxWidth: 500,
                        alignSelf: 'center',
                        paddingTop: Dimensions.get('window').width < 768 ? 20 : 0,
                        paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 0
                    }}>

                        {/* Join channel with code */}
                        <View style={{ padding: 15, 
                            width: '100%', 
                            marginBottom: Dimensions.get("window").width < 768 ? 40 : 60,
                            }}>
                            <Text style={{
                                fontSize: 16,
                                fontFamily: 'Inter',
                                color: '#000000',
                                textAlign: 'center',
                                marginBottom: 10
                            }}>
                                Join a course with a code
                            </Text>
                            <TextInput
                                value={joinWithCode}
                                placeholder={'9 characters'}
                                textContentType={"none"}
                                autoCompleteType={'off'}
                                onChangeText={val => {
                                    setJoinWithCode(val)
                                }}
                                placeholderTextColor={'#7d7f7c'}
                            />
                            <TouchableOpacity
                                onPress={() => handleSubmitCode()}
                                disabled={joinWithCodeDisabled}
                                style={{
                                    marginTop: 10,
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    width: '100%', justifyContent: 'center', flexDirection: 'row'
                                }}>
                                <Text style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    color: 'white',
                                    fontSize: 12,
                                    backgroundColor: '#006aff',
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    // width: 180,
                                    width: 130,
                                    borderRadius: 15,
                                    textTransform: 'uppercase'
                                }}>
                                    Join
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 15, width: '100%', alignSelf: 'center' }}>
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                    textAlign: 'center'
                                }}>
                                Create a course
                            </Text>
                        </View>
                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#000000'
                            }}>
                                {PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                value={name}
                                placeholder={''}
                                textContentType={"none"}
                                autoCompleteType={'xyz'}
                                onChangeText={val => {
                                    setName(val)
                                    setPasswordRequired(false)
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                                // footerMessage={'case sensitive'}
                            />
                        </View>

                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#000000'
                            }}>
                                Description
                            </Text>
                            <TextareaAutosize
                            value={description}
                            style={{
                                width: "100%",
                                maxWidth: 500,
                                borderBottom: '1px solid #efefef',
                                fontSize: 14,
                                paddingTop: 13,
                                paddingBottom: 13,
                                marginTop: 12,
                                marginBottom: 20,
                                borderRadius: 1,
                                // height: 80
                            }}
                            minRows={2}
                            placeholder={""}
                            onChange={(e: any) => setDescription(e.target.value)}
                            />
                        </View>


                        <View style={{ backgroundColor: 'white' }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#000000'
                            }}>
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={password}
                                textContentType={"none"}
                                autoCompleteType={'xyz'}
                                placeholder={PreferredLanguageText('optional')}
                                onChangeText={val => setPassword(val)}
                                placeholderTextColor={'#1F1F1F'}
                                secureTextEntry={true}
                                required={false}
                            />
                        </View>

                        {
                            school ?
                                <View
                                    style={{
                                        width: "100%",
                                    }}>
                                    <View
                                        style={{
                                            width: "100%",
                                            paddingBottom: 15,
                                            backgroundColor: "white"
                                        }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: '#000000'
                                        }}>Temporary</Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: "white",
                                            width: "100%",
                                            height: 30,
                                        }}>
                                        <Switch
                                            value={temporary}
                                            onValueChange={() => setTemporary(!temporary)}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: "#efefef",
                                                true: "#006AFF"
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                    <Text style={{ color: '#1F1F1F', fontSize: 12 }}>
                                        Courses that are not temporary can only be deleted by the school administrator.
                                    </Text>
                                </View>
                                : null
                        }
                        {
                            !school ? 
                                <View
                                    style={{
                                        width: "100%",
                                    }}>
                                    <View
                                        style={{
                                            width: "100%",
                                            paddingBottom: 15,
                                            backgroundColor: "white"
                                        }}>
                                        <Text style={{
                                            fontSize: 14,
                                            color: '#000000'
                                        }}>Public</Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: "white",
                                            width: "100%",
                                            height: 30,
                                        }}>
                                        <Switch
                                            value={isPublic}
                                            onValueChange={() => setIsPublic(!isPublic)}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: "#efefef",
                                                true: "#006AFF"
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                    <Text style={{ color: '#1F1F1F', fontSize: 12 }}>
                                        Makes your channel visible to all users
                                    </Text>
                                </View>
                                : null
                        }
                        {
                            !school ? 
                                <View
                                style={{
                                    width: "100%",
                                    marginTop: 25
                                }}>
                                <View
                                    style={{
                                        width: "100%",
                                        paddingBottom: 15,
                                        backgroundColor: "white"
                                    }}>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#000000'
                                    }}>Tags</Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: "white",
                                        width: "100%",
                                    }}>
                                    <ReactTagInput 
                                        tags={tags} 
                                        placeholder=" "
                                        removeOnBackspace={true}
                                        maxTags={5}
                                        onChange={(newTags) => setTags(newTags)}
                                        />
                                </View>
                                <Text style={{ color: '#1F1F1F', fontSize: 12, marginTop: 10 }}>
                                    Add up to 5
                                </Text>
                            </View>
                            : null
                        }

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
                                    color: '#000000'
                                }}>Theme</Text>
                            </View>
                            <View style={{ width: '100%', backgroundColor: 'white' }}>
                                <CirclePicker
                                    color={colorCode}
                                    onChangeComplete={(color: any) => setColorCode(color.hex)}
                                />
                            </View>
                        </View>

                        {school ? <Text style={{
                            fontSize: 14,
                            paddingTop: 20,
                            color: '#000000'
                        }}>
                            Viewers
                        </Text> : null}

                        {school ? renderSubscriberFilters() : null}
                        {school ? <View style={{
                            flexDirection: 'column', marginTop: 25,
                        }}>
                            <View style={{ height: 'auto', maxWidth: 400, width: '100%' }}>

                                <div style={{ width: '100%', }} >
                                    <label style={{ width: '100%', }}>
                                        <Select
                                            themeVariant="light"
                                            selectMultiple={true}
                                            group={true}
                                            groupLabel="&nbsp;"
                                            inputClass="mobiscrollCustomMultiInput"
                                            placeholder="Select..."
                                            touchUi={true}
                                            value={selectedValues}
                                            data={options}
                                            onChange={(val: any) => {
                                                setSelectedValues(val.value)
                                                // Filter out any moderator if not part of the selected values

                                                let filterRemovedModerators = selectedModerators.filter((mod: any) => val.value.includes(mod))

                                                setSelectedModerators(filterRemovedModerators)
                                            }}
                                            responsive={{
                                                small: {
                                                    display: 'bubble'
                                                },
                                                medium: {
                                                    touchUi: false,
                                                }
                                            }}
                                            minWidth={[60, 320]}
                                        />
                                    </label>
                                </div>
                            </View>
                        </View> : null}
                        {school ? <Text style={{
                            fontSize: 14,
                            color: '#000000', marginTop: 25, marginBottom: 20
                        }}>
                            Editors
                        </Text> : null}
                        {school ? <label style={{ width: '100%', maxWidth: 400 }}>
                            <Select
                                themeVariant="light"
                                select="multiple"
                                selectMultiple={true}
                                placeholder="Select..."
                                inputClass="mobiscrollCustomMultiInput"
                                value={selectedModerators}
                                data={moderatorOptions}
                                onChange={(val: any) => {
                                    setSelectedModerators(val.value)
                                }}
                                touchUi={true}
                                responsive={{
                                    small: {
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false,
                                    }
                                }}
                            />
                        </label> : null}

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
                                        lineHeight: 34,
                                        color: 'white',
                                        fontSize: 12,
                                        backgroundColor: '#006AFF',
                                        paddingHorizontal: 20,
                                        fontFamily: 'inter',
                                        height: 35,
                                        borderRadius: 15,
                                        width: 120,
                                        textTransform: 'uppercase'
                                    }}>
                                        {isSubmitting ? "Creating" : PreferredLanguageText('create')}
                                    </Text>
                                </TouchableOpacity>
                        </View>
                    </View>
                }
            </View>
        </View>
    );
}

export default ChannelControls;

const styles = StyleSheet.create({
    outline: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1F1F1F'
    },
    all: {
        fontSize: 14,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 14,
        color: '#fff',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: '#000000',
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
        borderBottomColor: '#efefef',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    }
});
