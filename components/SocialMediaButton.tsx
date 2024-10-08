// REACT
import React, { Component } from 'react';
import { Image, Dimensions } from 'react-native';

// COMPONENTS
import { Text, TouchableOpacity, View } from '../components/Themed';
import SocialLogin from 'react-social-login';
import facebookLogo from '../assets/images/facebookIcon.svg';
import googleLogo from '../assets/images/googleIcon.svg';

const ButtonFC: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { triggerLogin, children } = props;
    let icon;

    if (children.toLowerCase().includes('facebook')) {
        icon = (
            <Image
                source={facebookLogo}
                style={{
                    width: 20,
                    height: 20,
                    marginRight: 8,
                }}
                resizeMode={'contain'}
            />
        );
    } else if (children.toLowerCase().includes('google')) {
        icon = (
            <Image
                source={googleLogo}
                style={{
                    width: 20,
                    height: 20,
                    marginRight: 8,
                }}
                resizeMode={'contain'}
            />
        );
    }

    return (
        <TouchableOpacity
            onPress={triggerLogin}
            style={{
                backgroundColor: 'white',
                overflow: 'hidden',
                height: 35,
                marginTop: 15,
                justifyContent: 'center',
                flexDirection: 'row',
            }}
            {...props}
        >
            <Text
                style={{
                    textAlign: 'center',
                    lineHeight: 34,
                    color: '#007AFF',
                    fontSize: 13,
                    borderColor: '#007AFF',
                    borderWidth: 1,
                    paddingHorizontal: 20,
                    fontFamily: 'inter',
                    height: 35,
                    width: Dimensions.get('window').width < 768 ? 130 : 150,
                    borderRadius: 15,
                    textTransform: 'uppercase',
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                {icon ? icon : null} Sign in
            </Text>
        </TouchableOpacity>
    );
};

export default SocialLogin(ButtonFC);
