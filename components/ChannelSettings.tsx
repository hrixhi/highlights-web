import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, Keyboard } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { TextInput } from './CustomTextInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAPI } from '../graphql/FetchAPI';
import Multiselect from 'multiselect-react-dropdown';
import {
    doesChannelNameExist, findChannelById, getOrganisation, getSubscribers,
    getUserCount, subscribe, unsubscribe, updateChannel, getChannelColorCode
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

    const [name, setName] = useState('')
    const [originalName, setOriginalName] = useState('')
    const [password, setPassword] = useState('')
    const [temporary, setTemporary] = useState(false)

    const [originalSubs, setOriginalSubs] = useState<any[]>([])
    const [options, setOptions] = useState<any[]>([])
    const [selected, setSelected] = useState<any[]>([])
    const [owner, setOwner] = useState<any>({})
    const [owners, setOwners] = useState<any[]>([])
    const [colorCode, setColorCode] = useState("")
    const colorChoices = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#0d5d35", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607db8"]
    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",]
    const roles = ['student', 'instructor']
    const [activeRole, setActiveRole] = useState('All');
    const [activeGrade, setActiveGrade] = useState('All');
    const [activeSection, setActiveSection] = useState('All');
    const [allUsers, setAllUsers] = useState([]);

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

        let filteredOptions = filteredUsers.map((user: any) => {
            return {
                name: (user.fullName + ', ' + user.displayName),
                id: user._id
            }
        })

        setOptions(filteredOptions)


    }, [activeRole, activeGrade, activeSection])

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
                                borderColor: '#f4f4f6',
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
                                borderColor: '#f4f4f6',
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
                                borderColor: '#f4f4f6',
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

    const handleSubmit = useCallback(() => {
        if (name.toString().trim() === '') {
            alert('Enter channel name.')
            return
        }

        if (selected.length === 0) {
            alert('Select subscribers.')
            return
        }
        const server = fetchAPI('')
        server.query({
            query: doesChannelNameExist,
            variables: {
                name: name.trim()
            }
        }).then(res => {
            if (res.data && (res.data.channel.doesChannelNameExist !== true || name.trim() === originalName.trim())) {

                let unsub = false
                if (confirm('Unsubscribe removed moderators?')) {
                    unsub = true
                }

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
                        unsubscribe: unsub,
                        colorCode
                    }
                }).then(res2 => {
                    console.log(res2)
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
                                            name: (item.fullName + ', ' + item.displayName),
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
                                                setOwners(ownerOptions)
                                            }
                                        }
                                    })
                                    setOptions(tempUsers)
                                })
                            }
                        }
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
                                console.log(user._id)
                                console.log(item._id)
                                if (item._id.toString().trim() === user._id.toString().trim()) {
                                    setOwner({
                                        name: (item.fullName + ', ' + item.displayName),
                                        id: item._id
                                    })
                                } else {
                                    delete x.__typename
                                    tempUsers.push({
                                        name: (item.fullName + ', ' + item.displayName),
                                        id: item._id
                                    })
                                }
                                // add the user always 
                            })
                            setOriginalSubs(tempUsers)
                            setSelected(tempUsers)
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
                        }
                    })
                }
            }
        )()

    }, [props.channelId, props.user])

    return (
        <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 10 }}>
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
                    Settings
                </Text>
                <ScrollView
                    onScroll={() => {
                        Keyboard.dismiss()
                    }}
                    contentContainerStyle={{
                        maxHeight: Dimensions.get('window').height - 95,
                        // height: 'auto',
                        minHeight: 100
                    }}
                >
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                            {PreferredLanguageText('channel') + ' ' + PreferredLanguageText('name')}
                        </Text>
                        <TextInput
                            value={name}
                            placeholder={''}
                            onChangeText={val => {
                                setName(val)
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
                            value={password}
                            placeholder={`(${PreferredLanguageText('optional')})`}
                            onChangeText={val => setPassword(val)}
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
                                options={options} // Options to display in the dropdown
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
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'white',
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'row',
                            // height: 50,
                            paddingTop: 25,
                            marginBottom: 50
                        }}>
                        <TouchableOpacity
                            onPress={() => handleSubmit()}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 15,
                                marginBottom: 100,
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
                                textTransform: 'uppercase'
                            }}>
                                UPDATE
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {
                        temporary ?
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    // height: 50,
                                    paddingTop: 15
                                }}>
                                <TouchableOpacity
                                    onPress={() => handleDelete()}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: 15,
                                        overflow: 'hidden',
                                        height: 35,
                                        // marginTop: 15
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
                                        textTransform: 'uppercase'
                                    }}>
                                        DELETE
                                    </Text>
                                </TouchableOpacity>
                            </View> : null
                    }
                    <View style={{ height: 50, backgroundColor: '#fff' }} />
                </ScrollView>
            </View>
        </View>
    );
}

export default ChannelSettings

const styles = StyleSheet.create({
    screen: {
        padding: 15,
        paddingHorizontal: 20,
        width: '100%',
        maxWidth: 500,
        height: Dimensions.get('window').height - 50,
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
    },
    all: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 15,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
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
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
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
        borderColor: '#a2a2ac'
    },
});