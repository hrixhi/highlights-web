import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useAppContext } from '../contexts/AppContext';
import { Text, TouchableOpacity, View } from './Themed';
import zoomLogo from '../assets/images/zoomLogo.png';
import googleDriveLogo from '../assets/images/googleDriveLogo.png';
import { origin, disableEmailId } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';
import { removeGoogleOauth, removeZoom } from '../graphql/QueriesAndMutations';
import Alert from './Alert';
import { Ionicons } from '@expo/vector-icons';
import googleSignInButton from '../assets/images/googleSignInButton.png';

const integrationsInfo = {
    zoom: {
        title: 'Zoom Meetings',
        description:
            'Connect with Zoom to schedule or begin Course meetings directly from Cues. You can even create 1:1 or group meetings inside Inbox.',
        roles: ['instructor', 'moderator'],
        learnMore: '',
        logo: zoomLogo,
    },
    googleDrive: {
        title: 'Google Drive',
        description: 'Connect with Google Drive to import your files while creating content or taking notes.',
        roles: ['student', 'instructor', 'moderator'],
        learnMore: '',
        logo: googleDriveLogo,
    },
};

const CuesIntegrations: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user, userId, handleSetUser } = useAppContext();

    const [loadingAllowedIntegrations, setLoadingAllowedIntegrations] = useState(true);
    const [allowedIntegrations, setAllowedIntegrations] = useState([]);
    const [zoomInfo, setZoomInfo] = useState<any>(undefined);
    const [googleIntegrated, setGoogleIntegrated] = useState(false);

    const server = useApolloClient();

    useEffect(() => {
        setZoomInfo(user.zoomInfo);
        setGoogleIntegrated(user.googleIntegrated);
    }, [user]);

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
            window.location.href = url;
        }
    }, [zoomInfo, userId]);

    const handleZoomRemove = useCallback(async () => {
        if (zoomInfo) {
            // reset password
            server
                .mutate({
                    mutation: removeZoom,
                    variables: {
                        userId,
                    },
                })
                .then(async (res) => {
                    if (res.data && res.data.user.removeZoom) {
                        handleSetUser({
                            ...user,
                            zoomInfo: undefined,
                        });
                        Alert('Zoom account disconnected!');
                        setZoomInfo(null);
                    } else {
                        Alert('Failed to disconnect Zoom. Try again.');
                    }
                })
                .catch((err) => {
                    Alert('Something went wrong. Try again.');
                });
            return;
        }
    }, [zoomInfo, userId]);

    /**
     * @description Handles Zoom Auth => Connect user's zoom profile to Cues
     */
    const handleGoogleDriveAuth = useCallback(async () => {
        let url = '';

        if (zoomInfo) {
            // de-auth
            // TBD
            url = '';
        } else {
            // auth
            url = `${origin}/google_auth`;
        }

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            Linking.openURL(url);
        } else {
            window.location.href = url;
        }
    }, [zoomInfo, userId]);

    const handleGoogleDriveRemove = useCallback(async () => {
        if (googleIntegrated) {
            // reset password
            server
                .mutate({
                    mutation: removeGoogleOauth,
                    variables: {
                        userId,
                    },
                })
                .then(async (res) => {
                    if (res.data && res.data.user.removeGoogleOauth) {
                        handleSetUser({
                            ...user,
                            googleIntegrated: false,
                        });
                        Alert('Google account disconnected!');
                        setGoogleIntegrated(false);
                    } else {
                        Alert('Failed to disconnect Google. Try again.');
                    }
                })
                .catch((err) => {
                    Alert('Something went wrong. Try again.');
                });
            return;
        }
    }, [googleIntegrated, userId]);

    const renderZoomConnectButton = () => {
        return (
            <TouchableOpacity
                onPress={() => {
                    if (!zoomInfo) {
                        handleZoomAuth();
                    } else {
                        handleZoomRemove();
                    }
                }}
                style={{
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    flexDirection: 'row',
                }}
                disabled={user.email === disableEmailId}
            >
                <Text
                    style={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                        borderColor: '#ccc',
                        borderWidth: 1,
                        color: '#000',
                        backgroundColor: '#fff',
                        fontSize: 11,
                        paddingHorizontal: 24,
                        fontFamily: 'inter',
                        overflow: 'hidden',
                        paddingVertical: 12,
                        textTransform: 'uppercase',
                        width: 190,
                        borderRadius: 2,
                    }}
                >
                    {!zoomInfo ? 'Connect' : 'Disconnect'}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderGoogleConnectButton = () => {
        return (
            <TouchableOpacity
                onPress={() => {
                    if (!googleIntegrated) {
                        handleGoogleDriveAuth();
                    } else {
                        handleGoogleDriveRemove();
                    }
                }}
                style={{
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    flexDirection: 'row',
                }}
                disabled={user.email === disableEmailId}
            >
                {!googleIntegrated ? (
                    <Image
                        source={googleSignInButton}
                        style={{
                            width: 190,
                            height: 54,
                        }}
                        resizeMode={'contain'}
                    />
                ) : (
                    <Text
                        style={{
                            fontWeight: 'bold',
                            textAlign: 'center',
                            borderColor: '#ccc',
                            borderWidth: 1,
                            color: '#000',
                            backgroundColor: '#fff',
                            fontSize: 11,
                            paddingHorizontal: 24,
                            fontFamily: 'inter',
                            overflow: 'hidden',
                            paddingVertical: 12,
                            textTransform: 'uppercase',
                            width: 190,
                            borderRadius: 2,
                        }}
                    >
                        Disconnect
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        const userRole = user.role === 'instructor' ? 'instructor' : user.allowQuizCreation ? 'moderator' : 'student';

        const allowedIntegrations: string[] = [];

        Object.keys(integrationsInfo).map((integration: string) => {
            //
            const info = integrationsInfo[integration];

            if (info.roles.includes(userRole)) {
                allowedIntegrations.push(integration);
            }
        });

        setAllowedIntegrations(allowedIntegrations);
        setLoadingAllowedIntegrations(false);
    }, [user]);

    const renderIntegrationButton = (integration: string) => {
        switch (integration) {
            case 'zoom':
                return renderZoomConnectButton();
            case 'googleDrive':
                return renderGoogleConnectButton();
            default:
                return null;
        }
    };

    if (loadingAllowedIntegrations) {
        return (
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    alignSelf: 'center',
                    marginTop: 100,
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                maxHeight:
                    Dimensions.get('window').width < 768
                        ? Dimensions.get('window').height - (54 + 60)
                        : Dimensions.get('window').height - (64 + 54),
                backgroundColor: '#fff',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                overflow: 'hidden',
            }}
        >
            <ScrollView
                contentContainerStyle={{
                    width: '100%',
                    maxWidth: 1024,
                    alignSelf: 'center',
                }}
            >
                {allowedIntegrations.map((integration: string) => {
                    const info = integrationsInfo[integration];

                    return (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 20,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2',
                            }}
                        >
                            <Image
                                source={info.logo}
                                style={{
                                    height: 55,
                                    width: 55,
                                    // marginTop: 20,
                                    position: 'relative',
                                    alignSelf: 'center',
                                }}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flex: 1,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        marginLeft: 15,
                                        maxWidth: '100%',
                                    }}
                                >
                                    <View>
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            {info.title}
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            marginTop: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontFamily: 'overpass',
                                                lineHeight: 22,
                                            }}
                                        >
                                            {info.description}

                                            <Text
                                                onPress={() => {
                                                    if (Platform.OS === 'ios' || Platform.OS === 'android') {
                                                        Linking.openURL(info.learnMore);
                                                    } else {
                                                        window.open(info.learnMore, '_blank');
                                                    }
                                                }}
                                                style={{
                                                    fontSize: 14,
                                                    marginLeft: 8,
                                                    textDecorationLine: 'underline',
                                                    textDecorationStyle: 'solid',
                                                    textDecorationColor: '#000',
                                                }}
                                            >
                                                Learn more
                                            </Text>
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View
                                style={{
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    marginLeft: 50,
                                }}
                            >
                                {renderIntegrationButton(integration)}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default CuesIntegrations;
