import React, { useEffect, useRef, useState } from 'react';
import { Avatar, useChannelStateContext, useChatContext } from 'stream-chat-react';
import './MessagingChannelHeader.css';

import { TypingIndicator } from '../TypingIndicator/TypingIndicator';
import { ChannelInfoIcon, ChannelSaveIcon, HamburgerIcon, XButtonBackground } from '../assets';
import { AvatarGroup } from '../';

import type { StreamChatGenerics } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../../contexts/AppContext';

type Props = {
    theme: string;
    toggleMobile: () => void;
    isViewing: boolean;
    setIsViewing: (value: React.SetStateAction<boolean>) => void;
    showInstantMeeting: boolean;
    setShowInstantMeeting: (value: React.SetStateAction<boolean>) => void;
};

const MessagingChannelHeader = (props: Props) => {
    const { user, org } = useAppContext();

    const { theme, toggleMobile, isViewing, setIsViewing, showInstantMeeting, setShowInstantMeeting } = props;
    const { client } = useChatContext<StreamChatGenerics>();
    const { channel, watcher_count } = useChannelStateContext<StreamChatGenerics>();
    const [groupImage, setGroupImage] = useState('');
    const [title, setTitle] = useState('');

    const members = Object.values(channel.state.members || {}).filter((member) => member.user?.id !== client?.user?.id);

    useEffect(() => {
        const setGroupInfo = () => {
            if (channel.data?.name) {
                setTitle(channel.data?.name);
            } else {
                setTitle(members.map((member) => member.user?.name || member.user?.id || 'Unnamed User').join(', '));
            }

            if (channel.data?.image) {
                setGroupImage(channel.data?.image);
            } else {
                setGroupImage('');
            }
        };

        client.on('channel.updated', setGroupInfo);

        setGroupInfo();

        return () => {
            client.off('channel.updated', setGroupInfo);
        };
    }, [members, client]);

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
            {groupImage ? (
                <div className="avatar-group__avatars">
                    {' '}
                    <Avatar image={groupImage} size={40} />{' '}
                </div>
            ) : (
                <AvatarGroup members={members} />
            )}

            <div className="channel-header__container">
                <div className="channel-header__name">{title}</div>
                {renderOnlinePresence()}
            </div>

            <div className="messaging__channel-header__right">
                <TypingIndicator />

                {!org.meetingProvider && user.zoomInfo && !showInstantMeeting ? (
                    <div
                        style={{
                            // marginRight: 12,
                            cursor: 'pointer',
                        }}
                        onClick={() => setShowInstantMeeting(true)}
                    >
                        <Ionicons name={'videocam'} color={'#858688'} size={22} />
                    </div>
                ) : null}
                {!isViewing && members.length > 1 ? <ChannelInfoIcon {...{ isViewing, setIsViewing }} /> : null}
                {isViewing ? (
                    <div
                        style={{
                            height: 24,
                            cursor: 'pointer',
                            marginLeft: 16,
                        }}
                        onClick={() => setIsViewing(false)}
                    >
                        <XButtonBackground />
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default React.memo(MessagingChannelHeader);
