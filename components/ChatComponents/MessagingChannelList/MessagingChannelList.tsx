import React, { PropsWithChildren, useEffect } from 'react';
import { ChannelListMessengerProps, useChatContext, ChatDown } from 'stream-chat-react';

import './MessagingChannelList.css';
import { SkeletonLoader } from './SkeletonLoader';

import type { StreamChat } from 'stream-chat';
import type { StreamChatGenerics } from '../types';
import { Ionicons } from '@expo/vector-icons';

const MessagingChannelList = (props: PropsWithChildren<ChannelListMessengerProps>) => {
    const { children, error = false, loading, LoadingErrorIndicator = ChatDown } = props;
    const { client, setActiveChannel } = useChatContext<StreamChatGenerics>();

    if (!loading && !children?.props?.children?.length) {
        return <div className="messaging__channel-list__message">No active chats.</div>;
    }

    if (error) {
        return (
            <div className="messaging__channel-list__message">
                Error loading conversations, please try again momentarily.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="messaging__channel-list__message">
                <SkeletonLoader />
            </div>
        );
    }

    return <>{children}</>;
};

export default React.memo(MessagingChannelList);
