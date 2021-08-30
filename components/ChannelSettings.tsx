import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, Keyboard, ActivityIndicator, Switch } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { TextInput } from './CustomTextInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import Multiselect from 'multiselect-react-dropdown';
import {
    doesChannelNameExist, findChannelById, getOrganisation, getSubscribers,
    getUserCount, subscribe, unsubscribe, updateChannel, getChannelColorCode, duplicateChannel
} from '../graphql/QueriesAndMutations';
import { ScrollView } from 'react-native-gesture-handler';
import { CirclePicker } from "react-color";
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { Ionicons } from '@expo/vector-icons';

const ChannelSettings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loadingOrg, setLoadingOrg] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingChannelColor, setLoadingChannelColor] = useState(true);

    const [name, setName] = useState('')
    const [originalName, setOriginalName] = useState('')
    const [password, setPassword] = useState('')
    const [temporary, setTemporary] = useState(false)


    // Use to subscribe and unsubscribe users
    const [originalSubs, setOriginalSubs] = useState<any[]>([])

    // Dropdown options for subscribers
    const [options, setOptions] = useState<any[]>([])

    // Selected Subscribers
    const [selected, setSelected] = useState<any[]>([])

    const [owner, setOwner] = useState<any>({})

    // Selected Moderators
    const [owners, setOwners] = useState<any[]>([])

    // The Main channel owner (Hide from all lists)
    const [channelCreator, setChannelCreator] = useState('')

    // Channel color
    const [colorCode, setColorCode] = useState("")
    const colorChoices = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#0d5d35", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607db8"]

    // Filters
    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",]
    const roles = ['student', 'instructor']
    const [activeRole, setActiveRole] = useState('All');
    const [activeGrade, setActiveGrade] = useState('All');
    const [activeSection, setActiveSection] = useState('All');

    // Used to find out if any moderators are removed
    const [originalOwners, setOriginalOwners] = useState<any[]>([]);

    // Used to keep all users to filter
    const [allUsers, setAllUsers] = useState([]);

    const [showDuplicateChannel, setShowDuplicateChannel] = useState(false);
    const [duplicateChannelName, setDuplicateChannelName] = useState("");
    const [duplicateChannelPassword, setDuplicateChannelPassword] = useState("");
    const [duplicateChannelColor, setDuplicateChannelColor] = useState("");
    const [duplicateChannelTemporary, setDuplicateChannelTemporary] = useState(false);
    const [duplicateChannelSubscribers, setDuplicateChannelSubscribers] = useState(true);
    const [duplicateChannelModerators, setDuplicateChannelModerators] = useState(true);

    useEffect(() => {

        let filteredUsers = [...allUsers];

        // First filter by role

        if (activeRole !== "All") {
            const filterRoles = filteredUsers.filter((user: any) => {
                return user.role === activeRole
            })

            filteredUsers = filterRoles;
        }

        if (activeGrade !== "All") {
            const filterGrades = filteredUsers.filter((user: any) => {
                return user.grade === activeGrade
            })

            filteredUsers = filterGrades
        }

        if (activeSection !== "All") {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection
            })

            filteredUsers = filterSections
        }

        if (channelCreator !== "") {
            const filterOutMainOwner = filteredUsers.filter((user: any) => {
                return user._id !== channelCreator
            })

            filteredUsers = filterOutMainOwner
        }

        let filteredOptions = filteredUsers.map((user: any) => {
            return {
                name: user.fullName,
                id: user._id
            }
        })

        setOptions(filteredOptions)

    }, [activeRole, activeGrade, activeSection, channelCreator])

    useEffect(() => {
        if (channelCreator !== "") {
            const subscribers = [...selected]

            const filterOutMainOwner = subscribers.filter((sub: any) => {
                return sub.id !== channelCreator
            })

            setSelected(filterOutMainOwner)
        }
    }, [channelCreator])


    const renderSubscriberFilters = () => {
        return (<View style={{ width: '100%', flexDirection: 'row', backgroundColor: 'white', marginTop: 25 }}>
            <View style={{ backgroundColor: 'white', }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: 'white', paddingLeft: 10 }}>
                    <Menu
                        onSelect={(role: any) => {
                            setActiveRole(role)
                        }}>
                        <MenuTrigger>
                            <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                {activeRole}<Ionicons name='caret-down' size={15} />
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
                                value={'All'}>
                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 10,
                                        marginTop: 1,
                                        backgroundColor: "#fff"
                                    }} />
                                    <Text style={{ marginLeft: 5 }}>
                                        All
                                    </Text>
                                </View>
                            </MenuOption>
                            {
                                roles.map((role: any) => {
                                    return <MenuOption
                                        value={role}>
                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                            <Text style={{ marginLeft: 5 }}>
                                                {role}
                                            </Text>
                                        </View>
                                    </MenuOption>
                                })
                            }
                        </MenuOptions>
                    </Menu>
                </View>
                <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, textAlign: 'center', backgroundColor: 'white' }}>
                    Roles
                </Text>
            </View>

            <View style={{ backgroundColor: 'white', }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: 'white', paddingLeft: 30 }}>
                    <Menu
                        onSelect={(grade: any) => {
                            setActiveGrade(grade)
                        }}>
                        <MenuTrigger>
                            <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                {activeGrade}<Ionicons name='caret-down' size={15} />
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
                                value={'All'}>
                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 10,
                                        marginTop: 1,
                                        backgroundColor: "#fff"
                                    }} />
                                    <Text style={{ marginLeft: 5 }}>
                                        All
                                    </Text>
                                </View>
                            </MenuOption>
                            {
                                grades.map((role: any) => {
                                    return <MenuOption
                                        value={role}>
                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                            <Text style={{ marginLeft: 5 }}>
                                                {role}
                                            </Text>
                                        </View>
                                    </MenuOption>
                                })
                            }
                        </MenuOptions>
                    </Menu>
                </View>
                <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, textAlign: 'center', backgroundColor: 'white', paddingLeft: 20 }}>
                    Grades
                </Text>
            </View>

            <View style={{ backgroundColor: 'white', }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: 'white', paddingLeft: 30 }}>
                    <Menu
                        onSelect={(grade: any) => {
                            setActiveSection(grade)
                        }}>
                        <MenuTrigger>
                            <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                {activeSection}<Ionicons name='caret-down' size={15} />
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
                                value={'All'}>
                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 10,
                                        marginTop: 1,
                                        backgroundColor: "#fff"
                                    }} />
                                    <Text style={{ marginLeft: 5 }}>
                                        All
                                    </Text>
                                </View>
                            </MenuOption>
                            {
                                sections.map((section: any) => {
                                    return <MenuOption
                                        value={section}>
                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                            <Text style={{ marginLeft: 5 }}>
                                                {section}
                                            </Text>
                                        </View>
                                    </MenuOption>
                                })
                            }
                        </MenuOptions>
                    </Menu>
                </View>
                <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, textAlign: 'center', paddingLeft: 20 }}>
                    Sections
                </Text>
            </View>
        </View>)
    }

    const handleDuplicate = useCallback(() => {

        if (duplicateChannelName.toString().trim() === '') {
            alert('Enter duplicate channel name.')
            return
        }

        if (duplicateChannelColor === "") {
            alert('Pick duplicate channel color.')
            return
        }

        const server = fetchAPI('')
        server.query({
            query: doesChannelNameExist,
            variables: {
                name: duplicateChannelName.trim()
            }
        }).then(async res => {
            if (res.data && (res.data.channel.doesChannelNameExist !== true)) {
                server.mutate({
                    mutation: duplicateChannel,
                    variables: {
                        channelId: props.channelId,
                        name: duplicateChannelName.trim(),
                        password: duplicateChannelPassword,
                        colorCode: duplicateChannelColor,
                        temporary: duplicateChannelTemporary,
                        duplicateSubscribers: duplicateChannelSubscribers,
                        duplicateOwners: duplicateChannelModerators
                    }
                }).then((res2) => {
                    if (res2.data && res2.data.channel.duplicate === "created") {
                        alert("Channel duplicated successfully.")
                        // Refresh Subscriptions for user
                        props.refreshSubscriptions()
                        props.closeModal()
                    }
                })
            }
        })
        .catch((e) => {
            alert("Something went wrong. Try again.")
        })





    }, [duplicateChannel, duplicateChannelName, duplicateChannelPassword, props.channelId, 
        duplicateChannelColor, duplicateChannelTemporary, duplicateChannelSubscribers,
        duplicateChannelModerators])

    const handleSubmit = useCallback(() => {
        if (name.toString().trim() === '') {
            alert('Enter channel name.')
            return
        }

        let moderatorsPresentAsSubscribers = true;

        owners.map((owner: any) => {
            const presentInSubscriber = selected.find((sub: any) => {
                return owner.id === sub.id;
            })

            if (!presentInSubscriber) {
                moderatorsPresentAsSubscribers = false
            }
        })

        if (!moderatorsPresentAsSubscribers) {
            alert("A moderator must be a subscriber");
            return;
        }

        const server = fetchAPI('')
        server.query({
            query: doesChannelNameExist,
            variables: {
                name: name.trim()
            }
        }).then(async res => {
            if (res.data && (res.data.channel.doesChannelNameExist !== true || name.trim() === originalName.trim())) {

                server.mutate({
                    mutation: updateChannel,
                    variables: {
                        name: name.trim(),
                        password,
                        channelId: props.channelId,
                        temporary,
                        owners: owners.map((item) => {
                            return item.id
                        }),
                        colorCode
                    }
                }).then(res2 => {
                    if (res2.data && res2.data.channel.update) {
                        // added subs
                        selected.map((sub: any) => {
                            const og = originalSubs.find((o: any) => {
                                return o.id === sub.id
                            })
                            if (!og) {
                                server.mutate({
                                    mutation: subscribe,
                                    variables: {
                                        name: name.trim(),
                                        password: password,
                                        userId: sub.id
                                    }
                                })
                            }
                        })
                        // removed subs
                        originalSubs.map((o: any) => {

                            if (o.id === channelCreator) return;

                            const og = selected.find((sub: any) => {
                                return o.id === sub.id
                            })

                            if (!og) {
                                server.mutate({
                                    mutation: unsubscribe,
                                    variables: {
                                        channelId: props.channelId,
                                        keepContent: true,
                                        userId: o.id
                                    }
                                })
                            }
                        })
                        alert("Channel updated!")
                        setOriginalSubs([])

                        // need to refresh channel subscriptions since name will be updated

                        props.closeModal()
                    } else {
                        alert("Something went wrong.")
                    }
                }).catch(err => {
                    console.log(err)
                    alert("Something went wrong.")
                })
            } else {
                alert("Channel name in use.")
            }
        }).catch(err => {
            alert("Something went wrong.")
        })
    }, [name, password, props.channelId, options, originalSubs, owners,
        temporary, selected, originalName, colorCode])

    const handleDelete = useCallback(() => {
        const server = fetchAPI('')
        const subs = JSON.parse(JSON.stringify(originalSubs))
        subs.push(owner)
        subs.map((o: any) => {
            server.mutate({
                mutation: unsubscribe,
                variables: {
                    channelId: props.channelId,
                    keepContent: false,
                    userId: o.id
                }
            })
        })
        props.closeModal()
    }, [props.channelId, originalSubs, owner])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    const server = fetchAPI('')
                    // get all users
                    server.query({
                        query: getOrganisation,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.school.findByUserId) {
                            const schoolId = res.data.school.findByUserId._id
                            if (schoolId && schoolId !== '') {
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
                                            name: item.fullName,
                                            id: item._id
                                        })
                                        return x
                                    })

                                    // get channel details
                                    server.query({
                                        query: findChannelById,
                                        variables: {
                                            channelId: props.channelId
                                        }
                                    }).then(res => {
                                        if (res.data && res.data.channel.findById) {

                                            setName(res.data.channel.findById.name)
                                            setOriginalName(res.data.channel.findById.name)
                                            setPassword(res.data.channel.findById.password ? res.data.channel.findById.password : '')
                                            setTemporary(res.data.channel.findById.temporary ? true : false)
                                            setChannelCreator(res.data.channel.findById.channelCreator)
                                            if (res.data.channel.findById.owners) {
                                                const ownerOptions: any[] = []
                                                tempUsers.map((item: any) => {
                                                    const u = res.data.channel.findById.owners.find((i: any) => {
                                                        return i === item.id
                                                    })
                                                    if (u) {
                                                        ownerOptions.push(item)
                                                    }
                                                })

                                                // Filter out the main channel creator from the moderators list

                                                const filterOutMainOwner = ownerOptions.filter((user: any) => {
                                                    return user.id !== res.data.channel.findById.channelCreator
                                                })

                                                setOriginalOwners(filterOutMainOwner)

                                                setOwners(filterOutMainOwner)

                                                setLoadingOrg(false)
                                            }
                                        }
                                    })

                                    setOptions(tempUsers)
                                })
                            }
                        }
                    })
                        .catch(e => {
                            alert("Could not Channel data. Check connection.")
                        })

                    // get subs
                    server.query({
                        query: getSubscribers,
                        variables: {
                            channelId: props.channelId
                        }
                    }).then(res => {
                        if (res.data && res.data.user.findByChannelId) {
                            const tempUsers: any[] = []
                            res.data.user.findByChannelId.map((item: any, index: any) => {
                                const x = { ...item, selected: false, index }

                                delete x.__typename
                                tempUsers.push({
                                    name: item.fullName,
                                    id: item._id
                                })

                                // add the user always 
                            })
                            setOriginalSubs(tempUsers)
                            setSelected(tempUsers)
                            setLoadingUsers(false)
                        }
                    })

                    server.query({
                        query: getChannelColorCode,
                        variables: {
                            channelId: props.channelId
                        }
                    }).then(res => {
                        if (res.data && res.data.channel.getChannelColorCode) {
                            setColorCode(res.data.channel.getChannelColorCode)
                            setLoadingChannelColor(false)
                        }
                    })
                }
            }
        )()

    }, [props.channelId, props.user])

    if (loadingOrg || loadingUsers || loadingChannelColor) {
        return <View
            style={{
                width: "100%",
                flex: 1,
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "white"
            }}>
            <ActivityIndicator color={"#a2a2ac"} />
        </View>
    }
    

    if (showDuplicateChannel) {
        return (<View style={styles.screen} >
            <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 10 }}>
                <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                    <TouchableOpacity
                        key={Math.random()}
                        style={{
                            flex: 1,
                            backgroundColor: 'white'
                        }}
                        onPress={() => {
                            setShowDuplicateChannel(false)
                        }}>
                        <Text style={{
                            width: '100%',
                            fontSize: 15,
                            color: '#a2a2ac'
                        }}>
                            <Ionicons name='chevron-back-outline' size={17} color={'#2F2F3C'} style={{ marginRight: 10 }} /> 
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text
                    style={{
                        fontSize: 20,
                        paddingBottom: 20,
                        fontFamily: 'inter',
                        // textTransform: "uppercase",
                        // paddingLeft: 10,
                        flex: 1,
                        lineHeight: 25
                    }}>
                    Duplicate Channel
                </Text>
                <ScrollView
                    onScroll={() => {
                        Keyboard.dismiss()
                    }}
                    contentContainerStyle={{
                        maxHeight: Dimensions.get('window').height - 95,
                        // height: 'auto',
                        minHeight: 100,
                        paddingRight: 50
                    }}
                >
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                            {PreferredLanguageText('channel') + ' ' + PreferredLanguageText('name')}
                        </Text>
                        <TextInput
                            value={duplicateChannelName}
                            placeholder={''}
                            onChangeText={val => {
                                setDuplicateChannelName(val)
                            }}
                            placeholderTextColor={'#a2a2ac'}
                            required={true}
                            footerMessage={'case sensitive'}
                        />
                    </View>
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                            {PreferredLanguageText('enrolmentPassword')}
                        </Text>
                        <TextInput
                            value={duplicateChannelPassword}
                            placeholder={`(${PreferredLanguageText('optional')})`}
                            onChangeText={val => setDuplicateChannelPassword(val)}
                            placeholderTextColor={'#a2a2ac'}
                            secureTextEntry={true}
                            required={false}
                        />
                    </View>
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                            color
                        </Text>
                        <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white', marginTop: 20 }}>
                            <View style={{ width: '100%', backgroundColor: 'white' }}>
                                <CirclePicker
                                    colors={colorChoices}
                                    color={duplicateChannelColor}
                                    onChangeComplete={(color: any) => setDuplicateChannelColor(color.hex)}
                                />
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: "100%",
                            paddingTop: 15,
                        }}>
                        <View
                            style={{
                                width: "100%",
                                paddingTop: 15,
                                paddingBottom: 15,
                                backgroundColor: "white"
                            }}>
                            <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>Temporary</Text>
                        </View>
                        <View
                            style={{
                                backgroundColor: "white",
                                width: "100%",
                                height: 40,
                            }}>
                            <Switch
                                value={duplicateChannelTemporary}
                                onValueChange={() => setDuplicateChannelTemporary(!duplicateChannelTemporary)}
                                style={{ height: 20 }}
                                trackColor={{
                                    false: "#f4f4f6",
                                    true: "#3B64F8"
                                }}
                                activeThumbColor="white"
                            />
                        </View>
                        <Text style={{ color: '#a2a2ac', fontSize: 12 }}>
                            Channels that are not temporary can only be deleted by the school administrator.
                        </Text>
                    </View>
                    {/* Switch to copy Subscribers */}
                    {
                        selected.length > 0 ? 
                            <View>
                                <View
                                    style={{
                                        width: "100%",
                                        paddingTop: 30,
                                        paddingBottom: 15,
                                        backgroundColor: "white",
                                    }}
                                >
                                    <Text
                                        style={{
                                        fontSize: 11,
                                        color: "#2f2f3c",
                                        textTransform: "uppercase",
                                        }}
                                    >
                                        Duplicate Subscribers
                                    </Text>
                                </View>
                                <View style={{ flexDirection: "row" }}>
                                    <View
                                        style={{
                                        backgroundColor: "white",
                                        height: 40,
                                        marginRight: 10,
                                        }}
                                    >
                                        <Switch
                                            value={duplicateChannelSubscribers}
                                            onValueChange={() => {
                                                setDuplicateChannelSubscribers(!duplicateChannelSubscribers);
                                            }}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: "#f4f4f6",
                                                true: "#3B64F8"
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                </View>
                            </View>
                            : null
                    }

                    {/* Switch to copy Moderators */}
                    {
                        owners.length > 0 ? 
                            <View>
                                <View
                                    style={{
                                        width: "100%",
                                        paddingTop: 15,
                                        paddingBottom: 15,
                                        backgroundColor: "white",
                                    }}
                                >
                                    <Text
                                        style={{
                                        fontSize: 11,
                                        color: "#2f2f3c",
                                        textTransform: "uppercase",
                                        }}
                                    >
                                        Duplicate Moderators
                                    </Text>
                                </View>
                                <View style={{ flexDirection: "row" }}>
                                    <View
                                        style={{
                                        backgroundColor: "white",
                                        height: 40,
                                        marginRight: 10,
                                        }}
                                    >
                                        <Switch
                                            value={duplicateChannelModerators}
                                            onValueChange={() => {
                                                setDuplicateChannelModerators(!duplicateChannelModerators);
                                            }}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: "#f4f4f6",
                                                true: "#3B64F8"
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                </View>
                            </View>
                            : null
                    }


                    <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 50, paddingBottom: 50 }}>
                        <TouchableOpacity
                            onPress={() => handleDuplicate()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                overflow: 'hidden',
                                height: 35,
                            }}
                        >
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: 'white',
                                fontSize: 12,
                                backgroundColor: '#3B64F8',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                textTransform: 'uppercase',
                                width: 150
                            }}>
                                SAVE
                            </Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>
        </View>)

    }

    return (
        <View style={styles.screen} >
            <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 10 }}>
                <Text
                    style={{
                        fontSize: 25,
                        paddingBottom: 40,
                        fontFamily: 'inter',
                        // textTransform: "uppercase",
                        // paddingLeft: 10,
                        flex: 1,
                        lineHeight: 25
                    }}>
                    Settings
                </Text>
                <ScrollView
                    onScroll={() => {
                        Keyboard.dismiss()
                    }}
                    contentContainerStyle={{
                        maxHeight: Dimensions.get('window').height - 95,
                        // height: 'auto',
                        minHeight: 100,
                        paddingRight: 50
                    }}
                >
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                            {PreferredLanguageText('channel') + ' ' + PreferredLanguageText('name')}
                        </Text>
                        <TextInput
                            value={name}
                            autoCompleteType='off'
                            placeholder={''}
                            onChangeText={val => {
                                setName(val)
                            }}
                            placeholderTextColor={'#818385'}
                            required={true}
                            footerMessage={'case sensitive'}
                        />
                    </View>
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                            {PreferredLanguageText('enrolmentPassword')}
                        </Text>
                        <TextInput
                            value={password}
                            autoCompleteType='off'
                            placeholder={`(${PreferredLanguageText('optional')})`}
                            onChangeText={val => setPassword(val)}
                            placeholderTextColor={'#818385'}
                            secureTextEntry={true}
                            required={false}
                        />
                    </View>

                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                            color
                        </Text>
                        <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white', marginTop: 20 }}>
                            <View style={{ width: '100%', backgroundColor: 'white' }}>
                                <CirclePicker
                                    colors={colorChoices}
                                    color={colorCode}
                                    onChangeComplete={(color: any) => setColorCode(color.hex)}
                                />
                            </View>
                        </View>
                    </View>

                    <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase', marginTop: 25, }}>
                        Subscribers
                    </Text>

                    {renderSubscriberFilters()}
                    <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll' }}>
                        <View style={{ width: '90%', height: 'auto' }}>
                            <Multiselect
                                placeholder='Select...'
                                displayValue='name'
                                // key={userDropdownOptions.toString()}
                                style={{
                                    multiselectContainer: { // To change css for option container 
                                        minHeight: 200
                                    }
                                }}
                                options={options} // Options to display in the dropdown
                                selectedValues={selected} // Preselected value to persist in dropdown
                                onSelect={(e, f) => {
                                    setSelected(e);
                                    return true
                                }} // Function will trigger on select event
                                onRemove={(e, f) => {
                                    // If remove as subscriber and user is part of moderators, then remove from moderators

                                    const currModerators = [...owners];

                                    const filterOutRemovedSubscriber = currModerators.filter((user: any) => {
                                        return user.id !== f.id
                                    })

                                    setOwners(filterOutRemovedSubscriber)

                                    setSelected(e);
                                    return true
                                }}
                            />
                        </View>
                    </View>
                    <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase', marginTop: 25, }}>
                        Moderators
                    </Text>
                    <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll' }}>
                        <View style={{ width: '90%', height: 'auto' }}>
                            <Multiselect
                                placeholder='Select...'
                                displayValue='name'
                                // key={userDropdownOptions.toString()}
                                // style={{ width: '100%', color: '#202025', 
                                //     optionContainer: { // To change css for option container 
                                //         zIndex: 9999
                                //     }
                                // }}
                                style={{
                                    multiselectContainer: { // To change css for option container 
                                        minHeight: 100
                                    }
                                }}
                                options={selected} // Options to display in the dropdown
                                selectedValues={owners} // Preselected value to persist in dropdown
                                onSelect={(e, f) => {
                                    setOwners(e);
                                    return true
                                }} // Function will trigger on select event
                                onRemove={(e, f) => {
                                    setOwners(e);
                                    return true
                                }}
                            />
                        </View>
                    </View>

                    <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 50, paddingBottom: 50 }}>
                        <TouchableOpacity
                            onPress={() => handleSubmit()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                overflow: 'hidden',
                                height: 35,
                            }}
                        >
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: 'white',
                                fontSize: 12,
                                backgroundColor: '#3B64F8',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                textTransform: 'uppercase',
                                width: 150
                            }}>
                                UPDATE
                            </Text>
                        </TouchableOpacity>

                    
                        <TouchableOpacity
                            onPress={() => setShowDuplicateChannel(true)}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 15
                            }}
                        >
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#2F2F3C',
                                fontSize: 12,
                                backgroundColor: '#f4f4f6',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                textTransform: 'uppercase',
                                width: 150
                            }}>
                                DUPLICATE
                            </Text>
                        </TouchableOpacity>
                    {
                        temporary ?
                                <TouchableOpacity
                                    onPress={() => handleDelete()}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 15,
                                        overflow: 'hidden',
                                        height: 35,
                                        marginTop: 15,
                                    }}
                                >
                                    <Text style={{
                                        textAlign: 'center',
                                        lineHeight: 35,
                                        color: '#2f2f3c',
                                        fontSize: 12,
                                        backgroundColor: '#F8F9FA',
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 35,
                                        textTransform: 'uppercase',
                                        width: 150
                                    }}>
                                        DELETE
                                    </Text>
                                </TouchableOpacity>
                            : null
                    }
                    </View>
                    
                    {/* <View style={{ height: 50, backgroundColor: '#fff' }} /> */}
                </ScrollView>
            </View>
        </View>
    );
}

export default ChannelSettings

const styles = StyleSheet.create({
    screen: {
        paddingTop: 10,
        paddingBottom: 20,
        paddingRight: 20,
        paddingLeft: Dimensions.get('window').width < 1024 ? 20 : 0,
        width: '100%',
        maxWidth: 500,
        height: Dimensions.get('window').height - 50,
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 10,
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
        color: '#818385',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#818385'
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
        borderBottomColor: '#F8F9FA',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white'
    },
    colorContainerOutline: {
        lineHeight: 22,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#818385'
    },
});