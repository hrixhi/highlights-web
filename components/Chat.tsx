import React, { useEffect, useState } from 'react';
import { Chat, ChannelList } from 'stream-chat-react';

// CUSTOM COMPONENTS
import { MessagingChannelList, MessagingChannelListHeader, MessagingChannelPreview } from './ChatComponents';

import { ActivityIndicator, Dimensions } from 'react-native';

import { View } from './Themed';

import 'stream-chat-react/dist/css/index.css';
import '../web/streamInbox.css';

import { ChannelContainer } from './ChatComponents/ChannelContainer/ChannelContainer';
import { useMobileView } from '../hooks/useMobileView';
import { useAppContext } from '../contexts/AppContext';

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
    const { userId, openChannelId, setOpenChannelId } = useAppContext();

    const [chatClient, setChatClient] = useState<any>(undefined);
    const [chatError, setChatError] = useState('');

    const toggleMobile = useMobileView();

    // CREATING NEW CHANNEL OPTIONS
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingUsersGroup, setIsAddingUsersGroup] = useState(false);

    // FILTERS
    const [channelSearch, setChannelSearch] = useState('');
    const [filters, setFilters] = useState<any>(undefined);
    const [options, setOptions] = useState<any>(undefined);
    const [sort, setSort] = useState<any>(undefined);

    // INIT SEARCH
    const [channelIdFromSearch, setChannelIdFromSearch] = useState('');

    useEffect(() => {
        if (openChannelId) {
            setChannelIdFromSearch(openChannelId);
        }

        return () => {
            setOpenChannelId('');
        };
    }, [openChannelId]);

    console.log('ChannelIdFromSearch', channelIdFromSearch);

    // INIT CLIENT
    useEffect(() => {
        if (!props.chatClient) {
            setChatError('Failed to load chat.');
        } else {
            setFilters({ type: 'messaging', members: { $in: [userId] } });
            setOptions({ state: true, presence: true, limit: 10 });
            setSort({ last_message_at: -1, updated_at: -1 });
            setChatClient(props.chatClient);
        }
    }, [props.chatClient]);

    useEffect(() => {
        if (!chatClient) {
            return;
        }

        if (channelSearch === '') {
            setFilters({ type: 'messaging', members: { $in: [userId] } });
        } else {
            setFilters({
                type: 'messaging',
                members: { $in: [userId] },
                $or: [
                    {
                        'member.user.name': { $autocomplete: channelSearch },
                    },
                    {
                        name: { $autocomplete: channelSearch },
                    },
                ],
            });
        }
    }, [chatClient, channelSearch, userId]);

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

    console.log('Is Creating', isCreating);

    return (
        <div
            style={{
                width: '100%',
                alignSelf: 'center',
                minHeight: '100%',
                // maxHeight: Dimensions.get('window').height - 64,
                overflow: 'hidden',
                display: 'flex',
                flex: 1,
            }}
        >
            <Chat client={chatClient}>
                <div className="messaging__sidebar" id="mobile-channel-list" onClick={toggleMobile}>
                    <MessagingChannelListHeader
                        onCreateChannel={() => setIsCreating(!isCreating)}
                        theme={'messaging light'}
                        channelSearch={channelSearch}
                        setChannelSearch={setChannelSearch}
                    />
                    <ChannelList
                        customActiveChannel={channelIdFromSearch}
                        filters={filters}
                        sort={sort}
                        options={options}
                        List={MessagingChannelList}
                        Preview={(props) => (
                            <MessagingChannelPreview
                                {...props}
                                setIsCreating={setIsCreating}
                                setIsAddingUsersGroup={setIsAddingUsersGroup}
                            />
                        )}
                    />
                </div>

                <ChannelContainer
                    toggleMobile={toggleMobile}
                    theme={'light'}
                    onClose={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                    }}
                    isCreating={isCreating}
                    isEditing={isEditing}
                    isAddingUsersGroup={isAddingUsersGroup}
                    setIsAddingUsersGroup={setIsAddingUsersGroup}
                />
            </Chat>
        </div>
    );
};

export default Inbox;
