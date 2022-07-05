import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Platform, Dimensions, Image, ScrollView } from 'react-native';
import Alert from '../components/Alert';
import { fetchAPI } from '../graphql/FetchAPI';
import { origin } from '../constants/zoomCredentials';
import { View, Text, TouchableOpacity } from '../components/Themed';
import { TextInput } from '../components/CustomTextInput';
import { Ionicons } from '@expo/vector-icons';
import { login, resetPassword, getSsoLink, loginFromSso } from '../graphql/QueriesAndMutations';

import logo from '../components/default-images/cues-logo-black-exclamation-hidden.jpg';

import { validateEmail } from '../helpers/emailCheck';
import { PreferredLanguageText } from '../helpers/LanguageContext';

import axios from 'axios';

export default function Auth({ navigation, route }: StackScreenProps<any, 'login'>) {
    const [redirectToZoom, setRedirectToZoom] = useState(false);
    const [showSignupWindow, setShowSignupWindow] = useState(false);
    const [email, setEmail] = useState('');
    // const [fullName, setFullname] = useState('');
    const [password, setPassword] = useState('');
    // const [confirmPassword, setConfirmPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [emailValidError, setEmailValidError] = useState('');
    const [isSsoEnabled, setIsSsoEnabled] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    let cancelTokenRef: any = useRef({});

    const win = Dimensions.get('window');
    const screen = Dimensions.get('screen');

    const [dimensions, setDimensions] = useState({ window: win, screen });

    const enterValidEmailError = PreferredLanguageText('enterValidEmail');
    const weHaveEmailedPasswordAlert = PreferredLanguageText('weHaveEmailedPassword');
    const invalidCredentialsAlert = PreferredLanguageText('invalidCredentials');

    useEffect(() => {
        (async () => {
            const code = route?.params?.code;

            if (code && code !== '') {
                setIsLoggingIn(true);

                const server = fetchAPI('');
                server
                    .query({
                        query: loginFromSso,
                        variables: {
                            code,
                        },
                    })
                    .then(async (r: any) => {
                        if (
                            r.data &&
                            r.data.user.loginFromSso &&
                            r.data.user.loginFromSso.user &&
                            r.data.user.loginFromSso.token &&
                            !r.data.user.loginFromSso.error
                        ) {
                            const u = r.data.user.loginFromSso.user;
                            const token = r.data.user.loginFromSso.token;
                            if (u.__typename) {
                                delete u.__typename;
                            }

                            const userId = u._id;

                            // OneSignal.setExternalUserId(userId);

                            const sU = JSON.stringify(u);
                            await AsyncStorage.setItem('jwt_token', token);
                            await AsyncStorage.setItem('user', sU);
                            if (redirectToZoom) {
                                window.location.href = `${origin}/zoom_auth`;
                            } else {
                                window.location.href = origin;
                            }
                        } else {
                            const { error } = r.data.user.loginFromSso;
                            Alert(error);
                            setIsLoggingIn(false);
                        }
                    })
                    .catch((e) => {
                        console.log(e);
                        setIsLoggingIn(false);
                        Alert('Something went wrong. Try again.');
                    });
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const emailParam = route?.params?.email;
            const passwordParam = route?.params?.password;

            if (emailParam && emailParam !== '' && passwordParam && passwordParam !== '') {
                setIsLoggingIn(true);

                const server = fetchAPI('');
                server
                    .query({
                        query: login,
                        variables: {
                            email: emailParam.toLowerCase(),
                            password: decodeURIComponent(passwordParam),
                        },
                    })
                    .then(async (r: any) => {
                        if (r.data.user.login.user && r.data.user.login.token && !r.data.user.login.error) {
                            const u = r.data.user.login.user;
                            const token = r.data.user.login.token;
                            if (u.__typename) {
                                delete u.__typename;
                            }

                            const userId = u._id;

                            // OneSignal.setExternalUserId(userId);

                            const sU = JSON.stringify(u);
                            await AsyncStorage.setItem('jwt_token', token);
                            await AsyncStorage.setItem('user', sU);
                            await AsyncStorage.setItem('show_onboard_modal', 'true');

                            if (redirectToZoom) {
                                window.location.href = `${origin}/zoom_auth`;
                            } else {
                                window.location.href = origin;
                            }
                        } else {
                            const { error } = r.data.user.login;
                            setIsLoggingIn(false);
                            Alert(error);
                        }
                    })
                    .catch((e) => {
                        console.log(e);
                        setIsLoggingIn(false);
                        Alert('Something went wrong. Try again.');
                    });
            }
        })();
    }, []);

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        // window.location.reload()
        setDimensions({ window, screen });
    }, []);

    useEffect(() => {
        Dimensions.addEventListener('change', onDimensionsChange);
        return () => {
            Dimensions.removeEventListener('change', onDimensionsChange);
        };
    }, []);

    useEffect(() => {
        (async () => {
            if (email === '' || !email.includes('@')) {
                setIsSsoEnabled(false);
            } else {
                try {
                    const split = email.split('@');

                    if (split[1] !== '') {
                        if (typeof cancelTokenRef.current != typeof undefined) {
                            cancelTokenRef.current &&
                                cancelTokenRef.current.cancel &&
                                cancelTokenRef.current.cancel('Operation canceled due to new request.');
                        }

                        //Save the cancel token for the current request
                        cancelTokenRef.current = axios.CancelToken.source();

                        axios
                            .post(
                                `https://api.learnwithcues.com/checkSSO`,
                                {
                                    ssoDomain: split[1],
                                },
                                { cancelToken: cancelTokenRef.current.token }
                            )
                            .then((res: any) => {
                                if (res.data && res.data.ssoFound) {
                                    setIsSsoEnabled(true);
                                } else {
                                    setIsSsoEnabled(false);
                                }
                            });
                    }
                } catch (e) {
                    console.log(e);
                    setIsSsoEnabled(false);
                }
            }
        })();
    }, [email]);

    const handleSsoRedirect = useCallback(() => {
        const server = fetchAPI('');

        if (!isSsoEnabled) {
            return;
        }

        const split = email.toLowerCase().split('@');

        server
            .query({
                query: getSsoLink,
                variables: {
                    ssoDomain: split[1].trim(),
                },
            })
            .then(async (r: any) => {
                if (r.data && r.data.user.getSsoLink) {
                    if (r.data.user.getSsoLink !== '') {
                        window.location.href = r.data.user.getSsoLink;
                    }
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }, [email, isSsoEnabled]);

    const handleLogin = useCallback(() => {
        setIsLoggingIn(true);
        const server = fetchAPI('');
        server
            .query({
                query: login,
                variables: {
                    email: email.toLowerCase(),
                    password,
                },
            })
            .then(async (r: any) => {
                if (r.data.user.login.user && r.data.user.login.token && !r.data.user.login.error) {
                    const u = r.data.user.login.user;
                    const token = r.data.user.login.token;
                    if (u.__typename) {
                        delete u.__typename;
                    }

                    const userId = u._id;

                    // OneSignal.setExternalUserId(userId);

                    const sU = JSON.stringify(u);
                    await AsyncStorage.setItem('jwt_token', token);
                    await AsyncStorage.setItem('user', sU);
                    if (redirectToZoom) {
                        window.location.href = `${origin}/zoom_auth`;
                    } else {
                        window.location.href = origin;
                    }
                } else {
                    const { error } = r.data.user.login;
                    setIsLoggingIn(false);
                    Alert(error);
                }
            })
            .catch((e) => {
                console.log(e);
                setIsLoggingIn(false);
                Alert('Something went wrong. Try again.');
            });
    }, [email, password, redirectToZoom]);

    const forgotPassword = useCallback(() => {
        const server = fetchAPI('');
        server
            .mutate({
                mutation: resetPassword,
                variables: {
                    email,
                },
            })
            .then((res) => {
                if (res.data && res.data.user.resetPassword) {
                    Alert(weHaveEmailedPasswordAlert);
                    setShowForgotPassword(false);
                } else {
                    Alert(invalidCredentialsAlert);
                }
            })
            .catch((e) => {
                Alert(invalidCredentialsAlert);
            });
    }, [email]);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const redirect = route?.params?.redirect;

            if (redirect === 'zoom') {
                setRedirectToZoom(true);
            }
        }
    }, []);

    useEffect(() => {
        if (email && !validateEmail(email.toString().toLowerCase())) {
            setEmailValidError(enterValidEmailError);
            return;
        }

        setEmailValidError('');
    }, [email]);

    //   Validate Submit on Login state change
    useEffect(() => {
        // Login
        if (!showForgotPassword && email && password && !emailValidError && !isSsoEnabled) {
            setIsSubmitDisabled(false);
            return;
        }

        //
        if (showForgotPassword && email && !emailValidError && !isSsoEnabled) {
            setIsSubmitDisabled(false);
            return;
        }

        if (isSsoEnabled && !emailValidError) {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);
    }, [showForgotPassword, email, password, emailValidError, isSsoEnabled]);

    return (
        <View
            style={{
                flex: 1,
                flexDirection: 'row',
                height: '100%',
            }}
        >
            {!showSignupWindow ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        flex: 1,
                        position: 'absolute',
                        zIndex: 50,
                        backgroundColor: 'rgba(16,16,16, 0.7)',
                        overflow: 'hidden',
                    }}
                >
                    <View
                        style={{
                            position: 'absolute',
                            zIndex: 525,
                            display: 'flex',
                            alignSelf: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            width: dimensions.window.width < 768 ? '100%' : '100%',
                            height: dimensions.window.width < 768 ? '100%' : '100%',
                            borderRadius: dimensions.window.width < 768 ? 0 : 0,
                            marginTop: dimensions.window.width < 768 ? 0 : 0,
                            paddingHorizontal: 40,
                        }}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            horizontal={false}
                            contentContainerStyle={{
                                height: '100%',
                                paddingVertical: 40,
                                justifyContent: 'center',
                            }}
                            nestedScrollEnabled={true}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    paddingBottom: 30,
                                }}
                            >
                                <Image
                                    source={logo}
                                    style={{
                                        width: dimensions.window.height * 0.2 * 0.53456,
                                        height: dimensions.window.height * 0.2 * 0.2,
                                    }}
                                    resizeMode={'contain'}
                                />
                            </View>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#1F1F1F',
                                    fontFamily: 'overpass',
                                    paddingBottom: showForgotPassword ? 20 : 0,
                                    textAlign: 'center',
                                }}
                            >
                                {showForgotPassword ? PreferredLanguageText('temporaryPassword') : ''}
                                {/* PreferredLanguageText('continueLeftOff')} */}
                            </Text>

                            <View
                                style={{
                                    maxWidth: 400,
                                    width: '100%',
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignSelf: 'center',
                                }}
                            >
                                <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}>
                                    {PreferredLanguageText('email')}
                                </Text>
                                <TextInput
                                    autoCompleteType="email"
                                    textContentType="emailAddress"
                                    value={email}
                                    placeholder={''}
                                    onChangeText={(val: any) => setEmail(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                    errorText={emailValidError}
                                />
                                {isSsoEnabled ? (
                                    <View style={{ paddingBottom: 20, marginTop: 10 }}>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="lock-closed" size={18} color="#000" />
                                            <Text
                                                style={{
                                                    paddingLeft: 7,
                                                    color: '#000',
                                                    paddingTop: 3,
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                Single sign-on enabled
                                            </Text>
                                        </View>
                                    </View>
                                ) : null}
                                {showForgotPassword || isSsoEnabled ? null : (
                                    <View>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>
                                                {PreferredLanguageText('password')}
                                            </Text>
                                            {showForgotPassword ? null : (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setShowForgotPassword(true);
                                                    }}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        flexDirection: 'row',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#000',
                                                            fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        Forgot Password?
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <TextInput
                                            autoCompleteType="password"
                                            textContentType="password"
                                            secureTextEntry={true}
                                            value={password}
                                            placeholder={''}
                                            onChangeText={(val: any) => setPassword(val)}
                                            placeholderTextColor={'#1F1F1F'}
                                        />
                                    </View>
                                )}
                                <View
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        paddingBottom: 10,
                                    }}
                                >
                                    <TouchableOpacity
                                        disabled={isSubmitDisabled}
                                        onPress={() => {
                                            if (showForgotPassword) {
                                                forgotPassword();
                                            } else if (isSsoEnabled) {
                                                handleSsoRedirect();
                                            } else {
                                                handleLogin();
                                            }
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            marginTop: 15,
                                            width: '100%',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                        }}
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
                                                width: 150,
                                            }}
                                        >
                                            {isLoggingIn
                                                ? 'Signing In...'
                                                : showForgotPassword
                                                ? PreferredLanguageText('reset')
                                                : isSsoEnabled
                                                ? 'Continue'
                                                : PreferredLanguageText('login')}
                                        </Text>
                                    </TouchableOpacity>
                                    {/* Sign up button */}
                                    {/* {showForgotPassword ? null : (
                                        <View
                                            style={{
                                                backgroundColor: 'white',
                                                width: '100%',
                                                marginTop: 20,
                                                flexDirection: 'row',
                                                justifyContent: 'center'
                                            }}>
                                            <Text>Not a member?</Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setShowSignupWindow(true);
                                                }}
                                                style={{ marginLeft: 5 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#007AFF'
                                                    }}>
                                                    Sign up now
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )} */}

                                    {/* {showForgotPassword ? null : (
                                        <View
                                            style={{
                                                maxWidth: 400,
                                                width: '100%',
                                                backgroundColor: 'white',
                                                justifyContent: 'space-between',
                                                alignSelf: 'center',
                                                flexDirection: 'row',
                                                marginTop: 20
                                            }}>
                                            <SocialMediaButton
                                                provider="facebook"
                                                appId={env === 'DEV' ? '922882341942535' : '746023139417168'}
                                                onLoginSuccess={handleSocialAuth}
                                                onLoginFailure={handleSocialAuthFailure}
                                                scope="public_profile,email">
                                                Sign in with Facebook
                                            </SocialMediaButton>

                                            <SocialMediaButton
                                                provider="google"
                                                appId="39948716442-erculsknud84na14b7mbd94f1is97477.apps.googleusercontent.com"
                                                onLoginSuccess={handleSocialAuth}
                                                onLoginFailure={handleSocialAuthFailure}
                                                key={'google'}
                                                scope={
                                                    'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
                                                }>
                                                Sign in with Google
                                            </SocialMediaButton>
                                        </View>
                                    )} */}

                                    {showForgotPassword ? (
                                        <TouchableOpacity
                                            onPress={() => setShowForgotPassword(false)}
                                            style={{
                                                backgroundColor: 'white',
                                                overflow: 'hidden',
                                                height: 35,
                                                marginTop: 15,
                                                marginBottom: 30,
                                                width: '100%',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                Back to Sign In
                                            </Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                            <View
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    paddingLeft: 5,
                                    paddingBottom: 5,
                                    marginTop: 20,
                                }}
                            >
                                {/* <LanguageSelect /> */}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            ) : null}
        </View>
    );
}
