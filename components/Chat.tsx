import React, { useCallback, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, ChannelList } from 'stream-chat-react';

// CUSTOM COMPONENTS
import {
    CreateChannel,
    ChannelInner,
    CustomMessage,
    MessagingChannelList,
    MessagingChannelListHeader,
    MessagingChannelPreview,
    MessagingInput,
    MessagingThreadHeader,
} from './ChatComponents';

import { ActivityIndicator, Dimensions } from 'react-native';

import { View } from './Themed';

import 'stream-chat-react/dist/css/index.css';
import '../web/streamInbox.css';

import { fetchAPI } from '../graphql/FetchAPI';
import { getStreamChatUserToken, regenStreamChatUserToken } from '../graphql/QueriesAndMutations';
import { GiphyContextProvider } from './ChatComponents/Giphy';

const API_KEY = 'fa2jhu3kqpah';

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

type StreamChatGenerics = {
    attachmentType: LocalAttachmentType;
    channelType: LocalChannelType;
    commandType: LocalCommandType;
    eventType: LocalEventType;
    messageType: LocalMessageType;
    reactionType: LocalReactionType;
    userType: LocalUserType;
};

const Inbox: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [userToken, setUserToken] = useState(undefined);
    const [chatClient, setChatClient] = useState<any>(undefined);
    const [chatError, setChatError] = useState(undefined);

    // CREATING NEW CHANNEL OPTIONS
    const [isCreating, setIsCreating] = useState(false);

    // FILTERS
    const [filters, setFilters] = useState<any>(undefined);
    const [options, setOptions] = useState<any>(undefined);
    const [sort, setSort] = useState<any>(undefined);

    //
    useEffect(() => {
        if (!userToken) {
            fetchStreamUserToken();
        }
    }, []);

    // INITIALIZE CHAT
    useEffect(() => {
        if (!userToken && chatClient) {
            setChatClient(undefined);
            // Refetch user token
            return;
        }

        if (!userToken) {
            return;
        }

        const initChat = async (user: any, userToken: string) => {
            try {
                const client = StreamChat.getInstance<StreamChatGenerics>(API_KEY);
                // open the WebSocket connection to start receiving events
                // Updates the user in the application (will add/modify existing fields but will not overwrite/delete previously set fields unless the key is used)
                const res = await client.connectUser(
                    {
                        id: user._id,
                        name: user.fullName,
                        avatar: user.avatar,
                    },
                    userToken
                );

                console.log('Res', res);
                setFilters({ type: 'messaging', members: { $in: [user._id] } });
                setOptions({ state: true, presence: true, limit: 10 });
                setSort({ last_message_at: -1, updated_at: -1 });
                setChatClient(client);
            } catch (error: any) {
                console.log('Status code', JSON.parse(error.message).StatusCode);
                if (JSON.parse(error.message).StatusCode === 401) {
                    console.log('RESET USER TOKEN');
                    regenStreamUserToken();
                    return;
                }
            }
        };

        if (userToken && !chatClient) {
            initChat(props.user, userToken);
        }

        return () => {
            if (chatClient) {
                chatClient.disconnectUser();
            }
        };
    }, [userToken, props.user]);

    const fetchStreamUserToken = useCallback(async () => {
        const server = fetchAPI('');
        server
            .mutate({
                mutation: getStreamChatUserToken,
                variables: {
                    userId: props.user._id,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.streamChat.getUserToken !== '') {
                    setUserToken(res.data.streamChat.getUserToken);
                }
            })
            .catch((e) => {
                console.log('Error', e);
            });
    }, [props.user]);

    const regenStreamUserToken = useCallback(async () => {
        const server = fetchAPI('');
        server
            .mutate({
                mutation: regenStreamChatUserToken,
                variables: {
                    userId: props.user._id,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.streamChat.regenUserToken !== '') {
                    setUserToken(res.data.streamChat.regenUserToken);
                }
            })
            .catch((e) => {
                console.log('Error', e);
            });
    }, [props.user]);

    if (!chatClient && !chatError)
        return (
            <View
                style={{
                    width: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    marginVertical: 50,
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );

    if (chatError) {
        //
        return null;
    }

    return (
        <div
            style={{
                width: '100%',
                // maxWidth: 1024,
                alignSelf: 'center',
                minHeight: '100%',
                maxHeight: Dimensions.get('window').height - 64,
                overflow: 'hidden',
            }}
        >
            <Chat client={chatClient}>
                <div
                    className="messaging__sidebar"
                    id="mobile-channel-list"
                    // onClick={toggleMobile}
                >
                    <MessagingChannelListHeader
                        onCreateChannel={() => setIsCreating(!isCreating)}
                        theme={'messaging light'}
                    />
                    <ChannelList
                        filters={filters}
                        sort={sort}
                        options={options}
                        List={MessagingChannelList}
                        Preview={(props) => <MessagingChannelPreview {...props} setIsCreating={setIsCreating} />}
                    />
                </div>
                {/* <div
                    style={{
                        minHeight: '100%',
                        maxHeight: Dimensions.get('window').height - 64,
                    }}
                > */}
                <Channel
                    Input={MessagingInput}
                    maxNumberOfFiles={10}
                    Message={CustomMessage}
                    multipleUploads={true}
                    ThreadHeader={MessagingThreadHeader}
                    TypingIndicator={() => null}
                >
                    {isCreating && (
                        <CreateChannel
                            toggleMobile={() => {}}
                            onClose={() => setIsCreating(false)}
                            subscriptions={props.subscriptions}
                        />
                    )}
                    <GiphyContextProvider>
                        <ChannelInner
                            theme={'light'}
                            toggleMobile={() => {}}
                            //  toggleMobile={toggleMobile}
                        />
                    </GiphyContextProvider>
                </Channel>
                {/* </div> */}
            </Chat>
        </div>
    );
};

export default Inbox;
