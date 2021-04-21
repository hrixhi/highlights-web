import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, StyleSheet, TextInput } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';
import { fetchAPI } from '../graphql/FetchAPI';
import { signup, updatePassword, updateUser } from '../graphql/QueriesAndMutations';
import { validateEmail } from '../helpers/emailCheck';
import Alert from '../components/Alert'

const ProfileControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [fullName, setFullName] = useState('')
    const [userFound, setUserFound] = useState(false)
    const [loggedIn, setLoggedIn] = useState(false)
    const [showSavePassword, setShowSavePassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')

    const handleSubmit = useCallback(async () => {

        const u = await AsyncStorage.getItem('user')
        if (!u) {
            return
        }
        const user = JSON.parse(u)
        const server = fetchAPI('')

        if (showSavePassword) {
            // reset password
            if (newPassword.toString().trim() === '' || currentPassword.toString().trim() === '') {
                return
            }
            server.mutate({
                mutation: updatePassword,
                variables: {
                    userId: user._id,
                    currentPassword,
                    newPassword
                }
            }).then(res => {
                if (res.data && res.data.user.updatePassword) {
                    Alert("Password updated!")
                    props.reOpenProfile()
                } else {
                    Alert("Incorrect value for current password.")
                }
            }).catch(err => {
                Alert("Something went wrong.")
            })
            return
        }

        // All data should be complete
        if (email.toString().trim() === ''
            || displayName.toString().trim() === ''
            || fullName.toString().trim() === ''
        ) {
            return
        }

        if (!loggedIn) {

            if (password.toString() === '' || confirmPassword.toString() === '') {
                return
            }

            // Passwords should match
            if (password.toString() !== confirmPassword.toString()) {
                return
            }

            // Emails should be validated
            if (!validateEmail(email.toString().toLowerCase())) {
                return
            }

            server.mutate({
                mutation: signup,
                variables: {
                    email: email.toString().trim().toLowerCase(),
                    password: password.toString(),
                    fullName: fullName.toString().trim(),
                    displayName: displayName.toString().trim(),
                    userId: user._id
                }
            }).then(async (res) => {
                if (res.data.user.signup) {
                    const user = JSON.parse(u)
                    user.email = email;
                    user.fullName = fullName;
                    user.displayName = displayName;
                    const updatedUser = JSON.stringify(user)
                    await AsyncStorage.setItem('user', updatedUser)
                    props.saveDataInCloud()
                    props.reOpenProfile()
                }
            })
        } else {
            // save data
            server.mutate({
                mutation: updateUser,
                variables: {
                    displayName,
                    fullName,
                    userId: user._id
                }
            }).then(async (res) => {
                if (res.data && res.data.user.update) {
                    user.fullName = fullName;
                    user.displayName = displayName;
                    const updatedUser = JSON.stringify(user)
                    await AsyncStorage.setItem('user', updatedUser)
                    Alert("Profile updated!.")
                    props.reOpenProfile()
                } else {
                    Alert("Something went wrong.")
                }
            }).catch(e => Alert("Something went wrong."))
        }
    }, [loggedIn, email, password, displayName, fullName, confirmPassword, showSavePassword, newPassword, currentPassword])

    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (parsedUser.email) {
                setLoggedIn(true)
                setEmail(parsedUser.email)
                setDisplayName(parsedUser.displayName)
                setFullName(parsedUser.fullName)
            }
            setUserFound(true)
        }
    }, [])

    const logout = useCallback(async () => {
        await AsyncStorage.clear()
        window.location.reload()
    }, [])

    useEffect(() => {
        getUser()
    }, [])

    if (!userFound) {
        return <View style={styles.screen} key={1}>
            <View style={{ width: '100%', backgroundColor: 'white' }}>
                <View style={styles.colorBar}>
                    <Text style={{ fontSize: 25, color: '#a2a2aa', }}>
                        Internet connection required to initialise.
                    </Text>
                </View>
            </View>
        </View>
    }

    return (
        <View style={styles.screen} key={1}>
            <ScrollView style={{ width: '100%', backgroundColor: 'white' }} showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 30, color: '#202025', fontFamily: 'inter', paddingBottom: 15, textAlign: 'center', paddingTop: 30 }}>
                    {
                        !loggedIn ? 'Back Up' : 'Profile'
                    }
                </Text>
                <Text style={{ fontSize: 20, color: '#a2a2aa', fontFamily: 'overpass', paddingBottom: 25, textAlign: 'center' }}>
                    {
                        !loggedIn ? 'Create an account to save your work to the cloud.' : ''
                    }
                </Text>
                {
                    showSavePassword ?
                        <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 20, paddingBottom: 20 }}>
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                Current Password
                            </Text>
                            <TextInput
                                secureTextEntry={true}
                                value={currentPassword}
                                style={styles.input}
                                placeholder={''}
                                onChangeText={val => setCurrentPassword(val)}
                                placeholderTextColor={'#a2a2aa'}
                            />
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                New Password
                            </Text>
                            <TextInput
                                secureTextEntry={true}
                                value={newPassword}
                                style={styles.input}
                                placeholder={''}
                                onChangeText={val => setNewPassword(val)}
                                placeholderTextColor={'#a2a2aa'}
                            />
                        </View> :
                        <View style={{ width: '100%', backgroundColor: 'white', paddingTop: 20, paddingBottom: 20 }}>
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                Email
                            </Text>
                            <TextInput
                                editable={!loggedIn}
                                value={email}
                                style={styles.input}
                                placeholder={''}
                                onChangeText={val => setEmail(val)}
                                placeholderTextColor={'#a2a2aa'}
                            />
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                Full Name
                            </Text>
                            <TextInput
                                value={fullName}
                                style={styles.input}
                                placeholder={''}
                                onChangeText={val => setFullName(val)}
                                placeholderTextColor={'#a2a2aa'}
                            />
                            <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                Display Name
                            </Text>
                            <TextInput
                                value={displayName}
                                style={styles.input}
                                placeholder={''}
                                onChangeText={val => setDisplayName(val)}
                                placeholderTextColor={'#a2a2aa'}
                            />
                            {
                                loggedIn ? null :
                                    <View>
                                        <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                            Password
                            </Text>
                                        <TextInput
                                            value={password}
                                            style={styles.input}
                                            placeholder={''}
                                            onChangeText={val => setPassword(val)}
                                            placeholderTextColor={'#a2a2aa'}
                                            secureTextEntry={true}
                                        />
                                        <Text style={{ color: '#202025', fontSize: 14, paddingBottom: 10 }}>
                                            Re-enter Password
                            </Text>
                                        <TextInput
                                            value={confirmPassword}
                                            style={styles.input}
                                            placeholder={''}
                                            onChangeText={val => setConfirmPassword(val)}
                                            placeholderTextColor={'#a2a2aa'}
                                            secureTextEntry={true}
                                        />
                                    </View>
                            }
                        </View>
                }
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        display: 'flex',
                        height: 50,
                        paddingTop: 30
                    }}>
                    {
                        loggedIn ? <TouchableOpacity
                            onPress={() => setShowSavePassword(!showSavePassword)}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 15,
                                width: '100%', justifyContent: 'center', flexDirection: 'row',
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#202025',
                                fontSize: 12,
                                backgroundColor: '#f4f4f6',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                            }}>
                                {
                                    showSavePassword ? 'BACK' : 'PASSWORD'
                                }
                            </Text>
                        </TouchableOpacity> : <View style={{ height: 50 }} />
                    }
                    <TouchableOpacity
                        onPress={() => handleSubmit()}
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 15,
                            width: '100%', justifyContent: 'center', flexDirection: 'row',
                        }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: 'white',
                            fontSize: 12,
                            backgroundColor: '#3B64F8',
                            paddingHorizontal: 25,
                            fontFamily: 'inter',
                            height: 35,
                            borderRadius: 15,
                            width: 150,
                        }}>
                            {loggedIn ? (showSavePassword ? 'UPDATE' : 'SAVE') : 'SIGN UP'}
                        </Text>
                    </TouchableOpacity>
                    {
                        loggedIn ? <TouchableOpacity
                            onPress={() => logout()}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 15,
                                width: '100%', justifyContent: 'center', flexDirection: 'row',
                                marginBottom: 50
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#202025',
                                fontSize: 12,
                                backgroundColor: '#f4f4f6',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                            }}>
                                LOGOUT
                  </Text>
                        </TouchableOpacity> : <View style={{ height: 50 }} />
                    }
                </View>
            </ScrollView>
        </View>
    );
}

export default ProfileControls;

const styles = StyleSheet.create({
    screen: {
        paddingHorizontal: 30,
        width: '100%',
        height: Dimensions.get('window').height - 50,
        backgroundColor: 'white',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2aa'
    },
    all: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 15,
        color: '#a2a2aa',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2aa'
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
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20
    }
});
