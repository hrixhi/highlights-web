import React, { useCallback, useState } from 'react';
import { logChatPromiseExecution } from 'stream-chat';
import {
    MessageList,
    MessageInput,
    Window,
    useChannelActionContext,
    Thread,
    useChannelStateContext,
    useChatContext,
    MessageToSend,
} from 'stream-chat-react';

import { MessagingChannelHeader, MessagingInput, ViewChannel } from '../';
import { useGiphyContext } from '../Giphy';

import type { StreamChatGenerics } from '../types';

import { Popup, Datepicker } from '@mobiscroll/react5';
import { TextInput } from '../../CustomTextInput';
import { Text, View } from '../../Themed';
import { Dimensions, ScrollView } from 'react-native';
import { fetchAPI } from '../../../graphql/FetchAPI';
import { startChatMeeting } from '../../../graphql/QueriesAndMutations';
import Alert from '../../Alert';
import { fileUpload } from '../../../helpers/FileUpload';
import mime from 'mime-types';

export type ChannelInnerProps = {
    toggleMobile: () => void;
    theme: string;
    setIsAddingUsersGroup: (value: boolean) => void;
};

export const ChannelInner = (props: ChannelInnerProps) => {
    const { theme, toggleMobile } = props;
    const { giphyState, setGiphyState } = useGiphyContext();

    const { channel } = useChannelStateContext();

    const { client } = useChatContext();

    const { sendMessage } = useChannelActionContext<StreamChatGenerics>();

    const [isViewing, setIsViewing] = useState(false);
    const [showInstantMeeting, setShowInstantMeeting] = useState(false);
    const [instantMeetingTitle, setInstantMeetingTitle] = useState('');
    const [instantMeetingDescription, setInstantMeetingDescription] = useState('');
    const [instantMeetingStart, setInstantMeetingStart] = useState<any>(new Date());
    const [instantMeetingEnd, setInstantMeetingEnd] = useState<any>(
        new Date(instantMeetingStart.getTime() + 1000 * 60 * 60)
    );

    const members = Object.values(channel.state.members).filter(({ user }) => user?.id !== client.userID);

    const overrideSubmitHandler = (message: MessageToSend<StreamChatGenerics>) => {
        let updatedMessage;

        if (message.attachments?.length && message.text?.startsWith('/giphy')) {
            const updatedText = message.text.replace('/giphy', '');
            updatedMessage = { ...message, text: updatedText };
        }

        if (giphyState) {
            const updatedText = `/giphy ${message.text}`;
            updatedMessage = { ...message, text: updatedText };
        }

        if (sendMessage) {
            const newMessage = updatedMessage || message;
            const parentMessage = newMessage.parent;

            const messageToSend = {
                ...newMessage,
                parent: parentMessage
                    ? {
                          ...parentMessage,
                          created_at: parentMessage.created_at?.toString(),
                          pinned_at: parentMessage.pinned_at?.toString(),
                          updated_at: parentMessage.updated_at?.toString(),
                      }
                    : undefined,
            };

            const sendMessagePromise = sendMessage(messageToSend);
            logChatPromiseExecution(sendMessagePromise, 'send message');
        }

        setGiphyState(false);
    };

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const handleFileUploadChat = async (file: any, channel: any) => {
        let type = mime.extension(file.type);

        if (!client || !client.userID) return;

        const res = await fileUpload(file, type, client.userID);

        console.log('Image upload', res);

        const { data } = res;
        if (data.status === 'success') {
            return {
                file: data.url,
            };
            // Fallback to STREAM CDN
        }
        return undefined;
    };

    const createInstantMeeting = useCallback(() => {
        if (instantMeetingTitle === '') {
            Alert('A topic must be set for the meeting. ');
            return;
        } else if (instantMeetingEnd < new Date()) {
            Alert('Meeting end time must be set in the future.');
            return;
        } else if (instantMeetingStart > instantMeetingEnd) {
            Alert('Meeting end time must be set after the start time.');
            return;
        }

        const server = fetchAPI('');
        server
            .mutate({
                mutation: startChatMeeting,
                variables: {
                    userId: client.userID,
                    topic: instantMeetingTitle,
                    start: instantMeetingStart.toUTCString(),
                    end: instantMeetingEnd.toUTCString(),
                    groupId: channel.id,
                },
            })
            .then(async (res) => {
                console.log('Res', res);
                if (res.data && res.data.streamChat.startChatMeeting) {
                    const { title, meetingId, meetingProvider, meetingJoinLink, meetingStartLink, start, end } =
                        res.data.streamChat.startChatMeeting;

                    // Create new Message with custom attachment
                    const message = await channel.sendMessage({
                        text: 'New meeting',
                        attachments: [
                            {
                                type: 'meeting',
                                title,
                                meetingId,
                                meetingProvider,
                                meetingJoinLink,
                                meetingStartLink,
                                start,
                                end,
                                createdBy: client.userID,
                            },
                        ],
                    });

                    console.log('New Message', message);

                    setShowInstantMeeting(false);
                    setInstantMeetingTitle('');
                    let newStart = new Date();
                    setInstantMeetingStart(newStart);
                    setInstantMeetingEnd(new Date(newStart.getTime() + 1000 * 60 * 60));
                } else {
                    Alert('Failed to create meeting. Try again.');
                }
            })
            .catch((err) => {
                console.log('Error', err);
                Alert('Failed to create meeting.');
            });
    }, [client, channel, instantMeetingTitle, instantMeetingEnd]);

    const renderInstantMeetingPopup = () => {
        return (
            <Popup
                isOpen={showInstantMeeting}
                buttons={[
                    {
                        text: 'Start',
                        color: 'dark',
                        handler: function (event) {
                            createInstantMeeting();
                        },
                        // disabled: props.user.email === disableEmailId,
                    },
                    {
                        text: 'Cancel',
                        color: 'dark',
                        handler: function (event) {
                            setShowInstantMeeting(false);
                            setInstantMeetingTitle('');
                            let newStart = new Date();
                            setInstantMeetingStart(newStart);
                            setInstantMeetingEnd(new Date(newStart.getTime() + 1000 * 60 * 60));
                        },
                    },
                ]}
                theme="ios"
                themeVariant="light"
                onClose={() => {
                    setShowInstantMeeting(false);
                }}
                responsive={{
                    small: {
                        display: 'bottom',
                    },
                    medium: {
                        // Custom breakpoint
                        display: 'center',
                    },
                }}
            >
                <View
                    style={{
                        flexDirection: 'column',
                        paddingHorizontal: Dimensions.get('window').width >= 768 ? 25 : 0,
                        backgroundColor: '#f8f8f8',
                    }}
                    className="mbsc-align-center mbsc-padding"
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        indicatorStyle="black"
                        horizontal={false}
                        contentContainerStyle={{
                            width: '100%',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                paddingHorizontal: 20,
                                marginVertical: 20,
                                minWidth: Dimensions.get('window').width >= 768 ? 400 : 200,
                                maxWidth: Dimensions.get('window').width >= 768 ? 400 : 300,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'inter',
                                    marginBottom: 20,
                                }}
                            >
                                New meeting with{' '}
                                {channel.data && channel.data.name ? channel.data.name : members[0].user?.name}
                            </Text>

                            <View style={{ width: '100%', maxWidth: 400, marginTop: 20, backgroundColor: '#f8f8f8' }}>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    Topic
                                </Text>
                                <View
                                    style={{
                                        marginTop: 10,
                                        marginBottom: 10,
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <TextInput
                                        style={{
                                            padding: 10,
                                            fontSize: 15,
                                            backgroundColor: '#ffffff',
                                            borderColor: '#cccccc',
                                            borderWidth: 1,
                                            borderRadius: 2,
                                        }}
                                        value={instantMeetingTitle}
                                        placeholder={''}
                                        onChangeText={(val) => setInstantMeetingTitle(val)}
                                        placeholderTextColor={'#1F1F1F'}
                                        // required={true}
                                    />
                                </View>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    maxWidth: 400,
                                    // paddingVertical: 15,
                                    backgroundColor: '#f8f8f8',
                                    marginBottom: 20,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    Start
                                </Text>
                                <View style={{ marginTop: 10, marginBottom: 10 }}>
                                    <Datepicker
                                        controls={['date', 'time']}
                                        touchUi={true}
                                        theme="ios"
                                        value={instantMeetingStart}
                                        themeVariant="light"
                                        // inputComponent="input"
                                        inputProps={{
                                            placeholder: 'Select end...',
                                            backgroundColor: 'white',
                                        }}
                                        onChange={(event: any) => {
                                            const date = new Date(event.value);
                                            const roundOffDate = roundSeconds(date);
                                            setInstantMeetingStart(roundOffDate);
                                        }}
                                        responsive={{
                                            xsmall: {
                                                controls: ['date', 'time'],
                                                display: 'bottom',
                                                touchUi: true,
                                            },
                                            medium: {
                                                controls: ['date', 'time'],
                                                display: 'anchored',
                                                touchUi: false,
                                            },
                                        }}
                                    />
                                </View>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    maxWidth: 400,
                                    // paddingVertical: 15,
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    End
                                </Text>
                                <View style={{ marginTop: 10, marginBottom: 10 }}>
                                    <Datepicker
                                        controls={['date', 'time']}
                                        touchUi={true}
                                        theme="ios"
                                        value={instantMeetingEnd}
                                        themeVariant="light"
                                        // inputComponent="input"
                                        inputProps={{
                                            placeholder: 'Select end...',
                                            backgroundColor: 'white',
                                        }}
                                        onChange={(event: any) => {
                                            const date = new Date(event.value);
                                            const roundOffDate = roundSeconds(date);
                                            setInstantMeetingEnd(roundOffDate);
                                        }}
                                        responsive={{
                                            xsmall: {
                                                controls: ['date', 'time'],
                                                display: 'bottom',
                                                touchUi: true,
                                            },
                                            medium: {
                                                controls: ['date', 'time'],
                                                display: 'anchored',
                                                touchUi: false,
                                            },
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Popup>
        );
    };

    // const actions = ['delete', 'edit', 'flag', 'mute', 'react', 'reply'];
    const actions = ['delete', 'edit', 'react', 'reply'];

    return (
        <>
            <Window>
                <MessagingChannelHeader
                    isViewing={isViewing}
                    setIsViewing={setIsViewing}
                    theme={theme}
                    toggleMobile={toggleMobile}
                    showInstantMeeting={showInstantMeeting}
                    setShowInstantMeeting={setShowInstantMeeting}
                />
                {isViewing ? (
                    <ViewChannel setIsAddingUsersGroup={props.setIsAddingUsersGroup} />
                ) : (
                    <>
                        <MessageList messageActions={actions} />
                        <MessageInput
                            doFileUploadRequest={handleFileUploadChat}
                            doImageUploadRequest={handleFileUploadChat}
                            focus
                            overrideSubmitHandler={overrideSubmitHandler}
                        />
                    </>
                )}
            </Window>
            <Thread Input={MessagingInput} />
            {showInstantMeeting ? renderInstantMeetingPopup() : null}
        </>
    );
};
