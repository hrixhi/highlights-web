// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { Image, Linking, Platform, StyleSheet, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import { updatePassword, updateUser, removeZoom } from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, View, TouchableOpacity } from './Themed';
// import { ScrollView } from "react-native-gesture-handler";
import Alert from '../components/Alert';
import { TextInput } from './CustomTextInput';
import OneSignal from 'react-onesignal';
import FileUpload from './UploadFiles';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
// import { LanguageSelect } from '../helpers/LanguageContext';
import { disableEmailId, zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';

const ProfileControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [avatar, setAvatar] = useState<any>(undefined);
    const [zoomInfo, setZoomInfo] = useState<any>(undefined);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [fullName, setFullName] = useState('');
    const [userFound, setUserFound] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [passwordValidError, setPasswordValidError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [newPasswordValidError, setNewPasswordValidError] = useState('');
    const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');
    const [currentFullName, setCurrentFullName] = useState('');
    const [currentDisplayName, setCurrentDisplayName] = useState('');
    const [currentAvatar, setCurrentAvatar] = useState<any>(undefined);
    const [meetingProvider, setMeetingProvider] = useState('');
    // Alerts
    const passwordUpdatedAlert = PreferredLanguageText('passwordUpdated');
    const incorrectCurrentPasswordAlert = PreferredLanguageText('incorrectCurrentPassword');
    const passwordDoesNotMatchAlert = PreferredLanguageText('passwordDoesNotMatch');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const profileUpdatedAlert = PreferredLanguageText('profileUpdated');
    const passwordInvalidError = PreferredLanguageText('atleast8char');

    // HOOKS

    /**
     * @description Fetch meeting provider for org
     */
    useEffect(() => {
        (async () => {
            const org = await AsyncStorage.getItem('school');

            if (org) {
                const school = JSON.parse(org);

                setMeetingProvider(school.meetingProvider ? school.meetingProvider : '');
            }
        })();
    }, []);

    /**
     * @description Fetch user on Init
     */
    useEffect(() => {
        getUser();
    }, []);

    /**
     * @description Validate if submit is enabled after every state change
     */
    useEffect(() => {
        // Reset Password state
        if (
            props.showSavePassword &&
            currentPassword &&
            newPassword &&
            confirmNewPassword &&
            !newPasswordValidError &&
            !confirmNewPasswordError
        ) {
            setIsSubmitDisabled(false);
            return;
        }

        // Logged in
        if (!props.showSavePassword && (avatar !== currentAvatar || fullName !== currentFullName)) {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);
    }, [
        email,
        fullName,
        displayName,
        avatar,
        currentAvatar,
        confirmPassword,
        passwordValidError,
        confirmPasswordError,
        props.showSavePassword,
        currentPassword,
        newPassword,
        confirmNewPassword,
        newPasswordValidError,
        confirmNewPasswordError,
        currentDisplayName,
        currentFullName,
    ]);

    /**
     * @description Validates new password
     */
    useEffect(() => {
        const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

        if (newPassword && !validPasswrdRegex.test(newPassword)) {
            setNewPasswordValidError(passwordInvalidError);
            return;
        }

        setNewPasswordValidError('');
    }, [newPassword]);

    /**
     * @description Verifies if confirm new password matches new password
     */
    useEffect(() => {
        if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
            setConfirmNewPasswordError(passwordDoesNotMatchAlert);
            return;
        }

        setConfirmNewPasswordError('');
    }, [newPassword, confirmNewPassword]);

    /**
     * @description Handles submit new password or Update user profile
     */
    const handleSubmit = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (!u) {
            return;
        }
        const user = JSON.parse(u);
        const server = fetchAPI('');

        if (props.showSavePassword) {
            // reset password
            server
                .mutate({
                    mutation: updatePassword,
                    variables: {
                        userId: user._id,
                        currentPassword,
                        newPassword,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.user.updatePassword) {
                        Alert(passwordUpdatedAlert);
                        props.reOpenProfile();
                    } else {
                        Alert(incorrectCurrentPasswordAlert);
                    }
                })
                .catch((err) => {
                    Alert(somethingWentWrongAlert);
                });
            return;
        }

        server
            .mutate({
                mutation: updateUser,
                variables: {
                    displayName,
                    fullName,
                    userId: user._id,
                    avatar,
                },
            })
            .then(async (res) => {
                if (res.data && res.data.user.update) {
                    user.fullName = fullName;
                    user.displayName = displayName;
                    user.avatar = avatar;
                    const updatedUser = JSON.stringify(user);
                    await AsyncStorage.setItem('user', updatedUser);
                    Alert('Profile updated!');
                    props.reOpenProfile();
                } else {
                    Alert(somethingWentWrongAlert);
                }
            })
            .catch((e) => Alert(somethingWentWrongAlert));
        //}
    }, [email, avatar, displayName, fullName, confirmPassword, props.showSavePassword, newPassword, currentPassword]);

    /**
     * @description Loads User profile
     */
    const getUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const parsedUser = JSON.parse(u);
            if (parsedUser.email) {
                setEmail(parsedUser.email);
                setDisplayName(parsedUser.displayName);
                setFullName(parsedUser.fullName);
                setAvatar(parsedUser.avatar ? parsedUser.avatar : undefined);
                setCurrentAvatar(parsedUser.avatar ? parsedUser.avatar : undefined);
                setUserId(parsedUser._id);
                setZoomInfo(parsedUser.zoomInfo ? parsedUser.zoomInfo : undefined);
                setCurrentDisplayName(parsedUser.displayName);
                setCurrentFullName(parsedUser.fullName);
            }
            setUserFound(true);
        }
    }, []);

    /**
     * @description Log out
     */
    const logout = useCallback(async () => {
        OneSignal.removeExternalUserId();
        await AsyncStorage.clear();
        window.location.reload();
    }, []);

    /**
     * @description Handles Zoom Auth => Connect user's zoom profile to Cues
     */
    const handleZoomAuth = useCallback(async () => {
        let url = '';

        if (zoomInfo) {
            // de-auth
            // TBD
            url = '';
        } else {
            // auth
            url = `https://app.learnwithcues.com/zoom_auth`;
        }

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Linking.openURL(url);
        } else {
            window.open(url, '_blank');
        }
    }, [zoomInfo, userId]);

    const handleZoomRemove = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (!u) {
            return;
        }
        const user = JSON.parse(u);
        const server = fetchAPI('');

        if (zoomInfo) {
            // reset password
            server
                .mutate({
                    mutation: removeZoom,
                    variables: {
                        userId: user._id,
                    },
                })
                .then(async (res) => {
                    if (res.data && res.data.user.removeZoom) {
                        const user = JSON.parse(u);
                        user.zoomInfo = undefined;
                        const updatedUser = JSON.stringify(user);
                        await AsyncStorage.setItem('user', updatedUser);
                        Alert('Zoom account disconnected!');
                        setZoomInfo(null);
                    } else {
                        Alert('Failed to disconnect Zoom. Try again.');
                    }
                })
                .catch((err) => {
                    Alert(somethingWentWrongAlert);
                });
            return;
        }
    }, [zoomInfo, userId]);

    // MAIN RETURN

    return (
        <View style={styles.screen} key={1}>
            <ScrollView
                style={{
                    backgroundColor: 'white',
                    width: '100%',
                    alignSelf: 'center',
                    flexDirection: 'row',
                    // paddingHorizontal: 20
                }}
                contentContainerStyle={{
                    // height: '100%',
                    paddingHorizontal: 20,
                    flex: 1,
                    flexDirection: 'column',
                    maxHeight:
                        Dimensions.get('window').width < 1024
                            ? Dimensions.get('window').height - 104
                            : Dimensions.get('window').height - 52,
                }}
                showsVerticalScrollIndicator={true}
            >
                {/* <View style={{ overflow: 'scroll', width: '100%', flexDirection: 'row', flex: 1, justifyContent: 'center' }}> */}
                {/* <View style={{ overflow: 'scroll', maxWidth: 400, width: '100%' }}> */}
                {props.showSavePassword ? (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            paddingTop: 0,
                            paddingBottom: 20,
                            flex: 1,
                            maxWidth: 400,
                            alignSelf: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            {PreferredLanguageText('currentPassword')}
                        </Text>
                        <TextInput
                            secureTextEntry={true}
                            autoCompleteType="password"
                            textContentType="password"
                            value={currentPassword}
                            placeholder={''}
                            onChangeText={(val) => setCurrentPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                        />
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            {PreferredLanguageText('newPassword')}
                        </Text>
                        <TextInput
                            secureTextEntry={true}
                            autoCompleteType="off"
                            textContentType="newPassword"
                            value={newPassword}
                            placeholder={''}
                            onChangeText={(val) => setNewPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                            errorText={newPasswordValidError}
                            footerMessage={PreferredLanguageText('atleast8char')}
                        />
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            {PreferredLanguageText('confirmNewPassword')}
                        </Text>
                        <TextInput
                            secureTextEntry={true}
                            value={confirmNewPassword}
                            placeholder={''}
                            onChangeText={(val) => setConfirmNewPassword(val)}
                            placeholderTextColor={'#1F1F1F'}
                            errorText={confirmNewPasswordError}
                        />
                    </View>
                ) : (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            paddingTop: 0,
                            paddingBottom: 20,
                            maxWidth: 400,
                            alignSelf: 'center',
                            // flex: 1
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingTop: 30,
                            }}
                        >
                            <Image
                                style={{
                                    height: 100,
                                    width: 100,
                                    borderRadius: 75,
                                    // marginTop: 20,
                                    position: 'relative',
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri: avatar ? avatar : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
                            />
                            {avatar ? (
                                <TouchableOpacity
                                    onPress={() => setAvatar(undefined)}
                                    style={{
                                        backgroundColor: 'white',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        marginLeft: 10,
                                    }}
                                >
                                    <Text>
                                        <Ionicons name={'close-circle-outline'} size={18} color={'#1F1F1F'} />
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <FileUpload
                                    profile={true}
                                    onUpload={(u: any, t: any) => {
                                        setAvatar(u);
                                    }}
                                />
                            )}
                        </View>
                        {/* {
                            !props.showSavePassword ? 
                                <TouchableOpacity
                                    onPress={() => handleSubmit()}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        marginTop: 15,
                                        justifyContent: 'center',
                                        flexDirection: 'row'
                                    }}
                                    disabled={isSubmitDisabled}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: '#007AFF',
                                            fontSize: 13,
                                            // backgroundColor: '#007AFF',
                                            // paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            // height: 35,
                                            // borderRadius: 15,
                                            // width: 175,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        Save 
                                    </Text>
                                </TouchableOpacity> : null
                        } */}
                        <Text
                            style={{
                                marginTop: 50,
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            {PreferredLanguageText('email')}
                        </Text>
                        <TextInput
                            editable={false}
                            value={email}
                            placeholder={''}
                            onChangeText={(val) => setEmail(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                            style={{
                                borderBottomWidth: 0,
                                paddingTop: 5,
                                paddingLeft: 5,
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                                paddingTop: 10,
                            }}
                        >
                            {PreferredLanguageText('fullName')}
                        </Text>
                        <TextInput
                            // editable={false}
                            value={fullName}
                            placeholder={''}
                            onChangeText={(val) => setFullName(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                            style={{
                                padding: 10,
                                borderWidth: 1,
                                borderColor: '#cccccc',
                                borderRadius: 2,
                            }}
                        />
                        {/* <Text style={{
                  fontSize: 15,
                  fontFamily: 'inter',
                  color: '#000000'
                }}>
                  {PreferredLanguageText('displayName')}
                </Text>
                <TextInput
                  value={displayName}
                  placeholder={""}
                  onChangeText={val => setDisplayName(val)}
                  placeholderTextColor={"#1F1F1F"}
                  required={true}
                /> */}

                        {/* {!props.showSavePassword && zoomInfo ? (
                            // <TouchableOpacity
                            //     // onPress={() => handleZoomAuth()}
                            //     disabled={true}
                            //     style={{
                            //         backgroundColor: 'white',
                            //         overflow: 'hidden',
                            //         height: 35,
                            //         marginTop: 20,
                            //         width: '100%',
                            //         justifyContent: 'center',
                            //         flexDirection: 'row',
                            //         alignItems: 'center'
                            //     }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    marginBottom: 10
                                    // color: '#007AFF'
                                }}>
                                Zoom account linked
                            </Text>
                        ) : // </TouchableOpacity>
                        null} */}
                    </View>
                )}
                <View
                    style={{
                        // flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        maxWidth: 400,
                        alignSelf: 'center',
                    }}
                >
                    <TouchableOpacity
                        onPress={() => handleSubmit()}
                        style={{
                            backgroundColor: 'white',
                            // overflow: 'hidden',
                            // height: 35,
                            marginTop: 15,
                            justifyContent: 'center',
                            flexDirection: 'row',
                        }}
                        disabled={isSubmitDisabled || props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 175,
                            }}
                        >
                            {props.showSavePassword ? PreferredLanguageText('update') : PreferredLanguageText('save')}
                        </Text>
                    </TouchableOpacity>
                    {!props.showSavePassword ? (
                        <TouchableOpacity
                            onPress={() => props.setShowSavePassword(!props.showSavePassword)}
                            style={{
                                backgroundColor: 'white',
                                // overflow: 'hidden',
                                // height: 35,
                                marginTop: 20,
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            disabled={props.user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    borderColor: '#000',
                                    borderWidth: 1,
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    fontSize: 11,
                                    paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 24,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'uppercase',
                                    width: 175,
                                }}
                            >
                                Reset password
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    {props.showSavePassword || meetingProvider !== '' ? null : !zoomInfo ? (
                        <TouchableOpacity
                            onPress={() => handleZoomAuth()}
                            style={{
                                backgroundColor: 'white',
                                // overflow: 'hidden',
                                // height: 35,
                                marginTop: 20,
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            disabled={props.user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    // borderColor: '#000',
                                    // borderWidth: 1,
                                    color: '#000',
                                    // backgroundColor: '#fff',
                                    fontSize: 15,
                                    paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 24,
                                    fontFamily: 'inter',
                                    // overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'capitalize',
                                    width: 175,
                                }}
                            >
                                Connect Zoom
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                Alert('Disconnect your Zoom account from Cues?', '', [
                                    {
                                        text: 'Cancel',
                                        style: 'cancel',
                                        onPress: () => {
                                            return;
                                        },
                                    },
                                    {
                                        text: 'Yes',
                                        onPress: () => handleZoomRemove(),
                                    },
                                ]);
                            }}
                            style={{
                                backgroundColor: 'white',
                                // overflow: 'hidden',
                                // height: 35,
                                marginTop: 20,
                                // width: "100%",
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                            disabled={props.user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    // borderColor: '#000',
                                    // borderWidth: 1,
                                    color: '#000',
                                    // backgroundColor: '#fff',
                                    fontSize: 15,
                                    paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 24,
                                    fontFamily: 'inter',
                                    // overflow: 'hidden',
                                    paddingVertical: 14,
                                    textTransform: 'capitalize',
                                    width: 175,
                                }}
                            >
                                Disconnect Zoom
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* {
                        !props.showSavePassword ? <TouchableOpacity
                            onPress={() => logout()}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 20,
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    color: '#007AFF',
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    borderColor: '#007AFF',
                                    backgroundColor: '#fff',
                                    fontSize: 13,
                                    width: 175,
                                    textTransform: 'uppercase'
                                }}
                            >
                                Sign out
                            </Text> 
                        </TouchableOpacity> : null
                    } */}

                    {props.showSavePassword ? null : (
                        <TouchableOpacity
                            onPress={() => logout()}
                            style={{
                                backgroundColor: 'white',
                                // overflow: 'hidden',
                                // height: 35,
                                marginTop: 20,
                                marginBottom: 50,
                                width: '100%',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            {/* <Ionicons name="log-out-outline" color="#007AFF" style={{ marginRight: 10 }} size={18} /> */}
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Sign Out
                            </Text>
                        </TouchableOpacity>
                    )}
                    {/* {props.showHelp || props.showSaveCue ? null : (
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                paddingBottom: 20,
                                width: '100%',
                                marginTop: 30,
                                marginBottom: 100
                            }}>
                            <LanguageSelect />
                        </View>
                    )} */}
                </View>
                {/* </View> */}
                {/* </View> */}
                {/* {!props.showSavePassword ? <Text style={{ marginTop: 20, fontSize: 13, textAlign: 'center'}}>
                    version 1.8.6
                </Text> : null} */}
            </ScrollView>
        </View>
    );
};

export default ProfileControls;

const styles = StyleSheet.create({
    screen: {
        width: '100%',
        backgroundColor: 'white',
        justifyContent: 'center',
        flexDirection: 'row',
        flex: 1,
    },
    outline: {
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    all: {
        fontSize: 15,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    allOutline: {
        fontSize: 15,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 15,
    },
});
