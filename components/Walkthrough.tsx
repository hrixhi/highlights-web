import React, { useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Text, TouchableOpacity, View } from './Themed';

import { Ionicons } from '@expo/vector-icons';
import Profile from './Profile';

const Walkthrough: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [showSavePassword, setShowSavePassword] = useState(false);

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
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'white',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                }}
            >
                {showSavePassword ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            width: '100%',
                            alignSelf: 'center',
                            maxWidth: 400,
                            height: 50,
                            marginBottom: 25,
                            marginTop: 20,
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                backgroundColor: 'white',
                            }}
                            onPress={() => {
                                props.setShowHelp(false);
                                setShowSavePassword(false);
                            }}
                        >
                            <Text
                                style={{
                                    borderRadius: 15,
                                    marginTop: 5,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="chevron-back-outline" color="#000" size={23} />
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#000',
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Back
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                    }}
                >
                    <View
                        style={{
                            width: '100%',
                            borderColor: '#f2f2f2',
                        }}
                    >
                        <Profile
                            closeModal={() => props.closeModal()}
                            setShowSavePassword={(val: any) => setShowSavePassword(val)}
                            showSavePassword={showSavePassword}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Walkthrough;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: 'white',
        height: '100%',
        width: '100%',
        maxWidth: 1024,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 0 : 50,
        // alignSelf: 'center',
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        zIndex: -1,
    },
});
