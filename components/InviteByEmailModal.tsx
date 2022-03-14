// REACT
import React, { useState } from 'react';
import { StyleSheet, Switch, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { Popup } from '@mobiscroll/react';
import TextareaAutosize from 'react-textarea-autosize';
import { Select } from '@mobiscroll/react';
import { validateEmail } from '../helpers/emailCheck';

const InviteByEmailModal: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [emails, setEmails] = useState('');
    const styles = styleObject();

    // MAIN RETURN

    return (
        <Popup
            isOpen={props.show}
            buttons={[
                {
                    text: 'ADD',
                    handler: function(event) {

                        const splitEmails = emails.split(',')

                        let error = false;
                        let invalidEmail = ""

                        const santizedEmails = splitEmails.map((e: string) => {

                            if (error) return;

                            const santize = e.toLowerCase().trim()
                            
                            if (validateEmail(santize)) {
                                return santize
                            } else {
                                error = true;
                                invalidEmail = santize
                                return '';
                            }

                        })

                        if (error) {
                            alert("Invalid email " + invalidEmail)
                            return;
                        }

                        props.onAddUsersWithEmails(santizedEmails);
                    }
                },
                {
                    text: 'CANCEL',
                    handler: function(event) {
                        props.onClose();
                    }
                }
            ]}
            theme="ios"
            themeVariant="light"
            onClose={() => props.onClose()}
            responsive={{
                small: {
                    display: 'bottom'
                },
                medium: {
                    // Custom breakpoint
                    display: 'center'
                }
            }}>
            <View
                style={{
                    flexDirection: 'column',
                    paddingHorizontal: 20,
                    marginVertical: 20,
                    minWidth: Dimensions.get('window').width > 768 ? 400 : 200,
                    maxWidth: Dimensions.get('window').width > 768 ? 400 : 300,
                    backgroundColor: '#f2f2f7'
                }}>
                <Text
                    style={{
                        fontSize: 13,
                        textTransform: 'uppercase',
                        fontFamily: 'inter'
                    }}>
                    ADD VIEWERS WITH EMAILS 
                </Text>
                <TextareaAutosize
                    value={emails}
                    placeholder="E.g. student1@gmail.com, student2@gmail.com, ..."
                    minRows={3}
                    style={{
                        fontFamily: 'overpass',
                        marginTop: 20,
                        fontSize: 14,
                        borderRadius: 1,
                        padding: 12,
                        width: '100%',
                        maxWidth: '100%',
                        borderBottom: '1px solid #f2f2f7'
                    }}
                    onChange={(e: any) => {
                        setEmails(e.target.value);
                    }}
                />
                <Text
                    style={{
                        fontSize: 10,
                        color: '#000000',
                        textTransform: 'uppercase',
                        lineHeight: 20,
                        fontFamily: 'Inter',
                        paddingTop: 20
                    }}
                >
                    NOTE: EMAIL IDS ALREADY IN USE WITH ANOTHER CUES ORGANIZATION/INSTRUCTOR MAY NOT BE ADDED. REACH OUT TO SUPPORT FOR ANY QUERIES.
                </Text>
            </View>
        </Popup>
    );
};

export default InviteByEmailModal;

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        marginSmall: {
            height: 10
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            backgroundColor: 'white'
        },
        colorBar: {
            width: '100%',
            height: '10%',
            flexDirection: 'row'
        },
        channelOption: {
            width: '33.333%'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white'
        },
        allOutline: {
            fontSize: 12,
            color: '#1F1F1F',
            height: 22,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#1F1F1F'
        }
    });
};
