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

import { Select } from '@mobiscroll/react'
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import Alert from './Alert';


const ChannelSettings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loadingOrg, setLoadingOrg] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingChannelColor, setLoadingChannelColor] = useState(true);

    const [name, setName] = useState('')
    const [originalName, setOriginalName] = useState('')
    const [password, setPassword] = useState('')
    const [temporary, setTemporary] = useState(false)
    const [isUpdatingChannel, setIsUpdatingChannel] = useState(false)


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

    // Store all selected values for new mobiscroll multiselect
    const [selectedValues, setSelectedValues] = useState<any[]>([]);

    // Used to find out if any moderators are removed
    const [originalOwners, setOriginalOwners] = useState<any[]>([]);

    const [selectedModerators, setSelectedModerators] = useState<any[]>([]);

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

        if (activeSection !== "All") {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection || selectedValues.includes(user._id)
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
                group: user.fullName[0].toUpperCase(),
                text: user.fullName,
                value: user._id
            }
        })

        const sort = filteredOptions.sort((a, b) => {
            if (a.group < b.group) { return -1; }
            if (a.group > b.group) { return 1; }
            return 0;
        })

        console.log("Sort", sort)

        setOptions(sort)

    }, [activeRole, activeGrade, activeSection, channelCreator])

    // Main owner is filtered out with this useEffect
    // useEffect(() => {
    //     if (channelCreator !== "") {
    //         const subscribers = [...selected]

    //         const filterOutMainOwner = subscribers.filter((sub: any) => {
    //             return sub.id !== channelCreator
    //         })


    //         setSelectedValues(filterOutOwner);

    //         setSelected(filterOutMainOwner)
    //     }
    // }, [channelCreator])

    useEffect(() => {
        if (channelCreator !== "") {
            const subscribers = [...selectedValues]

            const filterOutOwner = subscribers.filter((sub: any) => {
                return sub !== channelCreator
            })



            // // Sort the values
            // const sort = filterOutOwner.sort((a, b) => {
            //     const one = options.find((o: any) => o.value === a);
            //     const two = options.find((o: any) => o.value === b);

            //     return one.text > two.text ? 1 : -1
            // })

            setSelectedValues(filterOutOwner);

        }
    }, [channelCreator])

    // Selected needs to hold all the values in an array 

    const renderSubscriberFilters = () => {
        return (<View style={{ width: '100%', flexDirection: 'row', backgroundColor: 'white', marginTop: 25 }}>
            <View style={{ backgroundColor: 'white', }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: 'white', paddingLeft: 10 }}>
                    <Menu
                        onSelect={(role: any) => {
                            setActiveRole(role)
                        }}>
                        <MenuTrigger>
                            <Text style={{ fontSize: 14, color: '#1D1D20' }}>
                                {activeRole}<Ionicons name='caret-down' size={15} />
                            </Text>
                        </MenuTrigger>
                        <MenuOptions customStyles={{
                            optionsContainer: {
                                padding: 10,
                                borderRadius: 15,
                                shadowOpacity: 0,
                                borderWidth: 1,
                                borderColor: '#e8e8ea',
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
                                        borderRadius: 0,
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
                <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 7, textAlign: 'center', backgroundColor: 'white' }}>
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
                            <Text style={{ fontSize: 14, color: '#1D1D20' }}>
                                {activeGrade}<Ionicons name='caret-down' size={15} />
                            </Text>
                        </MenuTrigger>
                        <MenuOptions customStyles={{
                            optionsContainer: {
                                padding: 10,
                                borderRadius: 15,
                                shadowOpacity: 0,
                                borderWidth: 1,
                                borderColor: '#e8e8ea',
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
                                        borderRadius: 0,
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
                <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 7, textAlign: 'center', backgroundColor: 'white', paddingLeft: 20 }}>
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
                            <Text style={{ fontSize: 14, color: '#1D1D20' }}>
                                {activeSection}<Ionicons name='caret-down' size={15} />
                            </Text>
                        </MenuTrigger>
                        <MenuOptions customStyles={{
                            optionsContainer: {
                                padding: 10,
                                borderRadius: 15,
                                shadowOpacity: 0,
                                borderWidth: 1,
                                borderColor: '#e8e8ea',
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
                                        borderRadius: 0,
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
                <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 7, textAlign: 'center', paddingLeft: 20 }}>
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

        selectedModerators.map((owner: any) => {
            const presentInSubscriber = selectedValues.find((sub: any) => {
                return owner === sub;
            })

            if (!presentInSubscriber) {
                moderatorsPresentAsSubscribers = false
            }
        })

        if (!moderatorsPresentAsSubscribers) {
            alert("A moderator must be a subscriber");
            return;
        }

        setIsUpdatingChannel(true);

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
                        owners: selectedModerators,
                        colorCode
                    }
                }).then(res2 => {
                    if (res2.data && res2.data.channel.update) {
                        // added subs
                        selectedValues.map((sub: any) => {
                            const og = originalSubs.find((o: any) => {
                                return o.id === sub
                            })
                            if (!og) {

                                console.log("To Add User", sub)
                                server.mutate({
                                    mutation: subscribe,
                                    variables: {
                                        name: name.trim(),
                                        password: password,
                                        userId: sub
                                    }
                                })
                            }
                        })
                        // removed subs
                        originalSubs.map((o: any) => {

                            if (o.id === channelCreator) return;

                            const og = selectedValues.find((sub: any) => {
                                return o.id === sub
                            })

                            if (!og) {
                                console.log("To Remove User", o.id)
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
                        setIsUpdatingChannel(false);

                        alert("Channel updated successfully.")
                        setOriginalSubs([])

                        // need to refresh channel subscriptions since name will be updated

                        props.closeModal()
                    } else {
                        setIsUpdatingChannel(false);
                        alert("Something went wrong. Try again.")
                    }
                }).catch(err => {
                    newFunction()(err)
                    setIsUpdatingChannel(false);
                    alert("Something went wrong. Try again.")
                })
            } else {
                alert("Channel name in use.")
                setIsUpdatingChannel(false);
            }
        }).catch(err => {
            alert("Something went wrong. Try again.")
            setIsUpdatingChannel(false);
        })
    }, [name, password, props.channelId, options, originalSubs, owners,
        temporary, selected, originalName, colorCode, selectedValues, selectedModerators])

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
        Alert("Deleted Channel successfully.")
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
                                            group: item.fullName[0].toUpperCase(),
                                            text: item.fullName,
                                            value: item._id
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
                                                        return i === item.value
                                                    })
                                                    if (u) {
                                                        ownerOptions.push(item)
                                                    }
                                                })

                                                // Filter out the main channel creator from the moderators list

                                                const filterOutMainOwner = ownerOptions.filter((user: any) => {
                                                    return user.value !== res.data.channel.findById.channelCreator
                                                })


                                                const mod = filterOutMainOwner.map((user: any) => user.value)

                                                setOriginalOwners(filterOutMainOwner)

                                                setOwners(filterOutMainOwner)

                                                console.log("Selected owners", filterOutMainOwner)

                                                setSelectedModerators(mod)

                                                setLoadingOrg(false)
                                            }
                                        }
                                    })

                                    const sort = tempUsers.sort((a, b) => {
                                        if (a.text < b.text) { return -1; }
                                        if (a.text > b.text) { return 1; }
                                        return 0;
                                    })

                                    console.log("Sort", sort)


                                    setOptions(sort)


                                    // setOptions(tempUsers)
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

                            const tempSelectedValues: any[] = []

                            res.data.user.findByChannelId.map((item: any, index: any) => {
                                tempSelectedValues.push(item._id)
                            })

                            setSelectedValues(tempSelectedValues)
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
                            fontSize: 14,
                            color: '#a2a2ac'
                        }}>
                            <Ionicons name='chevron-back-outline' size={17} color={'#1D1D20'} style={{ marginRight: 10 }} />
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
                    Duplicate
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
                        <Text style={{
                            fontSize: 14,
                            // fontFamily: 'inter',
                            color: '#1D1D20'
                        }}>
                            {PreferredLanguageText('name')}
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
                        <Text style={{
                            fontSize: 14,
                            // fontFamily: 'inter',
                            color: '#1D1D20'
                        }}>
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
                        <Text style={{
                            fontSize: 14,
                            // fontFamily: 'inter',
                            color: '#1D1D20'
                        }}>
                            Theme
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
                    {/* 
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
                            <Text style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#1D1D20'
                            }}>Temporary</Text>
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
                                    false: "#f7f7f7",
                                    true: "#007AFF"
                                }}
                                activeThumbColor="white"
                            />
                        </View>
                        <Text style={{ color: '#a2a2ac', fontSize: 12 }}>
                            Channels that are not temporary can only be deleted by the school administrator.
                        </Text>
                    </View> */}
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
                                            fontSize: 14,
                                            // fontFamily: 'inter',
                                            color: '#1D1D20'
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
                                                false: "#f7f7f7",
                                                true: "#007AFF"
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
                                            fontSize: 14,
                                            // fontFamily: 'inter',
                                            color: '#1D1D20'
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
                                                false: "#f7f7f7",
                                                true: "#007AFF"
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
                                backgroundColor: '#007AFF',
                                paddingHorizontal: 20,
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

    console.log("Options", selectedModerators);

    const moderatorOptions = selectedValues.map((value: any) => {
        const match = options.find((o: any) => {
            return o.value === value;
        })

        return match
    })




    return (
        <View style={styles.screen} >
            <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 30 }}>
                <View
                    style={{
                        maxWidth: 500,
                        alignSelf: 'center',
                        minHeight: 100,
                    }}
                >
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{
                            fontSize: 14,
                            // fontFamily: 'inter',
                            color: '#1D1D20'
                        }}>
                            {PreferredLanguageText('name')}
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
                        <Text style={{
                            fontSize: 14,
                            // fontFamily: 'inter',
                            color: '#1D1D20'
                        }}>
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
                        <Text style={{
                            fontSize: 14,
                            // fontFamily: 'inter',
                            color: '#1D1D20'
                        }}>
                            Theme
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

                    <Text style={{
                        fontSize: 14,
                        paddingTop: 20,
                        // fontFamily: 'inter',
                        color: '#1D1D20'
                    }}>
                        Subscribers
                    </Text>

                    {renderSubscriberFilters()}
                    <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll' }}>
                        <View style={{ height: 'auto', maxWidth: 350, width: 350 }}>
                            {/* <Multiselect
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
                            /> */}

                            <div style={{ maxWidth: 350, width: 350 }} >
                                <label style={{ maxWidth: 350, width: 350 }}>
                                    <Select
                                        themeVariant="light"
                                        selectMultiple={true}
                                        group={true}
                                        groupLabel="&nbsp;"
                                        inputClass="mobiscrollCustomMultiInput"
                                        placeholder="Select..."
                                        touchUi={true}
                                        // minWidth={[60, 320]}
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
                                    // minWidth={[60, 320]}
                                    />
                                </label>
                            </div>
                        </View>
                    </View>
                    <Text style={{
                        fontSize: 14,
                        //  fontFamily: 'inter',
                        color: '#1D1D20', marginTop: 25, marginBottom: 20
                    }}>
                        Moderators
                    </Text>
                    {/* <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll' }}>
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
                    </View> */}

                    <label style={{ width: 350 }}>
                        <Select
                            themeVariant="light"
                            select="multiple"
                            selectMultiple={true}
                            // group={true}
                            // groupLabel="&nbsp;"
                            // minWidth={[60, 320]}
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
                        // minWidth={[60, 320]}
                        />
                    </label>

                    <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 50, paddingBottom: 50 }}>
                        <TouchableOpacity
                            onPress={() => {
                                Alert("Update channel?", "", [
                                    {
                                        text: "Cancel",
                                        style: "cancel",
                                        onPress: () => {
                                            return;
                                        }
                                    },
                                    {
                                        text: "Yes",
                                        onPress: () => {
                                            handleSubmit()
                                        }
                                    }
                                ])
                            }}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                overflow: 'hidden',
                                height: 35,
                            }}
                            disabled={isUpdatingChannel}
                        >
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: 'white',
                                fontSize: 12,
                                backgroundColor: '#007AFF',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                textTransform: 'uppercase',
                                width: 150
                            }}>
                                {isUpdatingChannel ? "UPDATING" : "UPDATE"}
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
                                color: '#007aff',
                                borderWidth: 1,
                                borderRadius: 15,
                                borderColor: '#007aff',
                                backgroundColor: '#fff',
                                fontSize: 12,
                                paddingHorizontal: 20,
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
                                    onPress={() => {
                                        Alert("Delete channel?", "", [
                                            {
                                                text: "Cancel",
                                                style: "cancel",
                                                onPress: () => {
                                                    return;
                                                }
                                            },
                                            {
                                                text: "Yes",
                                                onPress: () => {
                                                    handleDelete()
                                                }
                                            }
                                        ])
                                    }}
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
                                        color: '#1D1D20',
                                        fontSize: 12,
                                        backgroundColor: '#f7f7f7',
                                        paddingHorizontal: 20,
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
                    <View style={{ height: 75 }} />
                    {/* <View style={{ height: 50, backgroundColor: '#fff' }} /> */}
                </View>
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
        height: Dimensions.get('window').height - 50,
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#818385'
    },
    all: {
        fontSize: 14,
        color: '#818385',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 14,
        color: '#818385',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 0,
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
        borderBottomColor: '#f7f7f7',
        borderBottomWidth: 1,
        fontSize: 14,
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
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#818385'
    },
});

function newFunction() {
    return console.log;
}
