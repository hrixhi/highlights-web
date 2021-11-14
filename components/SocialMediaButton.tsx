import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from '../components/Themed';
import SocialLogin from 'react-social-login';
import { Ionicons } from '@expo/vector-icons';

const ButtonFC: React.FunctionComponent<{ [label: string]: any }> = (props: any)=>{
    
    const { triggerLogin, children } = props;

    console.log("Props", props)

    let icon;

    if (children.toLowerCase().includes('facebook')) {
        icon = <Ionicons name="ios-logo-facebook" size={20} color="fff" style={{ marginRight: 8 }} />
    } else if (children.toLowerCase().includes('google')) {
        icon = <Ionicons name="ios-logo-google" size={20} color="fff" style={{ marginRight: 8 }} />
    }

    return (
        <TouchableOpacity
            onPress={triggerLogin}
            style={{
                backgroundColor: 'white',
                overflow: 'hidden',
                height: 35,
                marginTop: 15,
                width: '100%', justifyContent: 'center', flexDirection: 'row'
            }} {...props}>
            <Text style={{
                    textAlign: 'center',
                    lineHeight: 34,
                    color: 'white',
                    fontSize: 12,
                    backgroundColor: children.toLowerCase().includes('facebook') ? "#3b5998" : "#db3236",
                    paddingHorizontal: 20,
                    fontFamily: 'inter',
                    height: 35,
                    // width: 180,
                    width: 230,
                    borderRadius: 15,
                    textTransform: 'uppercase',
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'row'
                  }}>
                {icon ? icon : null} { children }
            </Text>
      </TouchableOpacity>
      
    )
  
}

export default SocialLogin(ButtonFC)