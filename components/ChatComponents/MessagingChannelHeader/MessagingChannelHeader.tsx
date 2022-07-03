import React, { useEffect, useRef, useState } from 'react';
import { Avatar, useChannelStateContext, useChatContext } from 'stream-chat-react';
import './MessagingChannelHeader.css';

import { TypingIndicator } from '../TypingIndicator/TypingIndicator';
import { ChannelInfoIcon, ChannelSaveIcon, HamburgerIcon } from '../assets';
import { AvatarGroup } from '../';

import type { StreamChatGenerics } from '../types';

type Props = {
    theme: string;
    toggleMobile: () => void;
    isViewing: boolean;
    setIsViewing: (value: React.SetStateAction<boolean>) => void;
};

const MessagingChannelHeader = (props: Props) => {
    const { theme, toggleMobile, isViewing, setIsViewing } = props;
    const { client } = useChatContext<StreamChatGenerics>();
    const { channel, watcher_count } = useChannelStateContext<StreamChatGenerics>();
    const [channelName, setChannelName] = useState(channel.data?.name || '');
    const [title, setTitle] = useState('');

    const members = Object.values(channel.state.members || {}).filter((member) => member.user?.id !== client?.user?.id);

    useEffect(() => {
        if (!channelName) {
            setTitle(members.map((member) => member.user?.name || member.user?.id || 'Unnamed User').join(', '));
        }
    }, [channelName, members]);

    const renderOnlinePresence = () => {
        // Not a group
        if (members.length === 1) {
            return (
                <div className="channel-header__presence_container">
                    <div
                        className={
                            watcher_count && watcher_count > 1
                                ? 'channel-header__presence_online'
                                : 'channel-header__presence_offline'
                        }
                    />
                    <div className="channel-header__presence">
                        {watcher_count && watcher_count > 1 ? 'online' : 'offline'}
                    </div>
                </div>
            );
        } else {
            return (
                <div className="channel-header__presence_container">
                    <div
                        className={
                            watcher_count && watcher_count > 1
                                ? 'channel-header__presence_online'
                                : 'channel-header__presence_offline'
                        }
                    />
                    <div className="channel-header__presence">
                        {watcher_count && watcher_count > 1
                            ? watcher_count - 1 + (watcher_count - 1 === 1 ? ' user online' : 'users online')
                            : 'No users online'}{' '}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="messaging__channel-header">
            <div id="mobile-nav-icon" className={`${theme}`} onClick={() => toggleMobile()}>
                <HamburgerIcon />
            </div>
            {channel.data?.image ? (
                <div className="avatar-group__avatars">
                    {' '}
                    <Avatar image={channel.data?.image} size={40} />{' '}
                </div>
            ) : (
                <AvatarGroup members={members} />
            )}

            <div className="channel-header__container">
                <div className="channel-header__name">{channelName || title}</div>
                {renderOnlinePresence()}
            </div>

            <div className="messaging__channel-header__right">
                <TypingIndicator />

                {!isViewing && members.length > 1 ? <ChannelInfoIcon {...{ isViewing, setIsViewing }} /> : null}
            </div>
        </div>
    );
};

export default React.memo(MessagingChannelHeader);
