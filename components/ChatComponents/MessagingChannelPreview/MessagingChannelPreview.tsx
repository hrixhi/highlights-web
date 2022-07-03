import React from 'react';
import './MessagingChannelPreview.css';
import { Avatar, ChannelPreviewUIComponentProps, ChatContextValue, useChatContext } from 'stream-chat-react';
import { AvatarGroup } from '../';

import type { Dispatch, SetStateAction } from 'react';
import type { Channel, ChannelMemberResponse } from 'stream-chat';
import type { StreamChatGenerics } from '../types';

const getTimeStamp = (channel: Channel) => {
    let lastHours = channel.state.last_message_at?.getHours();
    let lastMinutes: string | number | undefined = channel.state.last_message_at?.getMinutes();
    let half = 'AM';

    if (lastHours === undefined || lastMinutes === undefined) {
        return '';
    }

    if (lastHours > 12) {
        lastHours = lastHours - 12;
        half = 'PM';
    }

    if (lastHours === 0) lastHours = 12;
    if (lastHours === 12) half = 'PM';

    if (lastMinutes.toString().length === 1) {
        lastMinutes = `0${lastMinutes}`;
    }

    return `${lastHours}:${lastMinutes} ${half}`;
};

const getChannelName = (members: ChannelMemberResponse[]) => {
    const defaultName = 'Johnny Blaze';

    if (!members.length || members.length === 1) {
        return members[0]?.user?.name || defaultName;
    }

    return `${members[0]?.user?.name || defaultName}, ${members[1]?.user?.name || defaultName}`;
};

type Props = ChannelPreviewUIComponentProps & {
    channel: Channel;
    setIsCreating: Dispatch<SetStateAction<boolean>>;
    setActiveChannel?: ChatContextValue['setActiveChannel'];
};

const MessagingChannelPreview = (props: Props) => {
    const { channel, lastMessage, setActiveChannel, setIsCreating } = props;
    const { channel: activeChannel, client } = useChatContext<StreamChatGenerics>();

    const members = Object.values(channel.state.members).filter(({ user }) => user?.id !== client.userID);

    console.log('Channel', channel);

    return (
        <div
            className={
                channel?.id === activeChannel?.id ? 'channel-preview__container selected' : 'channel-preview__container'
            }
            onClick={() => {
                setIsCreating(false);
                setActiveChannel?.(channel);
            }}
        >
            {channel.data.image ? (
                <div className="avatar-group__avatars">
                    <Avatar image={channel.data?.image} size={40} />
                </div>
            ) : (
                <AvatarGroup members={members} />
            )}
            <div className="channel-preview__content-wrapper">
                <div className="channel-preview__content-top">
                    <p className="channel-preview__content-name">{channel.data?.name || getChannelName(members)}</p>
                    <p className="channel-preview__content-time">{getTimeStamp(channel)}</p>
                </div>
                <div className="channel-preview__content-bottom">
                    <p className="channel-preview__content-message">{lastMessage?.text ?? 'Send a message'}</p>
                    {channel.state.unreadCount > 0 ? (
                        <p className="channel-preview__content-unread">{channel.state.unreadCount}</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default MessagingChannelPreview;
