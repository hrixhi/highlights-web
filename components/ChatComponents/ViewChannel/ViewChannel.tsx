import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import { UserResponse } from 'stream-chat';
import { Avatar, useChannelStateContext, useChatContext } from 'stream-chat-react';
import { InviteIcon } from '../assets';
import AvatarGroup from '../AvatarGroup/AvatarGroup';
import type { StreamChatGenerics } from '../types';

import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

import './ViewChannel.css';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../../../graphql/FetchAPI';
import { toggleAdminRole } from '../../../graphql/QueriesAndMutations';
import Alert from '../../Alert';

type Props = {
    theme: string;
    toggleMobile: () => void;
};

type ListProps = {
    channelRole: string;
};

type ItemProps = {
    index: number;
    user: UserResponse<StreamChatGenerics>;
    channelRole: string;
    handleToggleAdmin: (userId: string, alreadyAdmin: boolean) => void;
};

const MembersListContainer: React.FC<ListProps> = (props) => {
    const { children, channelRole } = props;

    return (
        <div className="member-list__container">
            <div
                className={
                    channelRole === 'owner' || channelRole === 'moderator'
                        ? 'member-list__header_moderator'
                        : 'member-list__header_member'
                }
            >
                <p>User</p>
                <p>Status</p>
                <p>Role</p>
                {channelRole === 'owner' || channelRole === 'moderator' ? <div /> : null}
            </div>
            {children}
        </div>
    );
};

/**
 * Human readable elapsed or remaining time (example: 3 minutes ago)
 * @param  {Date|Number|String} date A Date object, timestamp or string parsable with Date.parse()
 * @param  {Date|Number|String} [nowDate] A Date object, timestamp or string parsable with Date.parse()
 * @param  {Intl.RelativeTimeFormat} [trf] A Intl formater
 * @return {string} Human readable elapsed or remaining time
 */
function fromNow(date: Date, nowDate = Date.now(), rft = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })) {
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 30 * DAY;
    const YEAR = 365 * DAY;
    const intervals = [
        { ge: YEAR, divisor: YEAR, unit: 'year' },
        { ge: MONTH, divisor: MONTH, unit: 'month' },
        { ge: WEEK, divisor: WEEK, unit: 'week' },
        { ge: DAY, divisor: DAY, unit: 'day' },
        { ge: HOUR, divisor: HOUR, unit: 'hour' },
        { ge: MINUTE, divisor: MINUTE, unit: 'minute' },
        { ge: 30 * SECOND, divisor: SECOND, unit: 'seconds' },
        { ge: 0, divisor: 1, text: 'just now' },
    ];
    const now = typeof nowDate === 'object' ? nowDate.getTime() : new Date(nowDate).getTime();
    const diff = now - (typeof date === 'object' ? date : new Date(date)).getTime();
    const diffAbs = Math.abs(diff);
    for (const interval of intervals) {
        if (diffAbs >= interval.ge) {
            const x = Math.round(Math.abs(diff) / interval.divisor);
            const isFuture = diff < 0;
            const outputTime = interval.unit ? rft.format(isFuture ? x : -x, interval.unit) : interval.text;
            return outputTime
                .replace(' minutes', 'min')
                .replace(' months', 'mth')
                .replace(' days', 'd')
                .replace(' weeks', 'wks')
                .replace(' hours', 'h')
                .replace(' seconds', 's');
        }
    }
}

const MemberItem: React.FC<ItemProps> = (props) => {
    const { index, user, channelRole, handleToggleAdmin } = props;

    const moderatorActions = [
        {
            label: 'Remove User',
            value: 'remove-user',
        },
        {
            label: 'Make Group Admin',
            value: 'make-admin',
        },
    ];

    const ownerActionsModerator = [
        {
            label: 'Remove Admin Rights',
            value: 'remove-admin',
        },
        {
            label: 'Remove User',
            value: 'remove-user',
        },
    ];

    const getPresence = () => {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        borderRadius: 50,
                        height: 8,
                        width: 8,
                        backgroundColor: user.online ? '#4ADE80' : '#F87170',
                    }}
                />

                <div style={{ marginLeft: 8, fontSize: 14, fontFamily: 'Overpass' }}>
                    {user.online ? 'online' : user.last_active ? fromNow(new Date(user.last_active)) : 'offline'}
                </div>
            </div>
        );
    };

    const getDropdownOptions = () => {
        if (channelRole === 'owner') {
            if (user.isModerator) {
                return ownerActionsModerator;
            } else {
                return moderatorActions;
            }
        } else {
            return moderatorActions;
        }
    };

    console.log('User', user);

    return (
        <div className="member-item__wrapper">
            <div className="member-item__name-wrapper">
                <Avatar image={user.image} name={user.name || user.id} size={32} />
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <p className="member-item__name">{user.name || user.id}</p>
                    <div className="member-item__role">{user.roleDescription}</div>
                </div>
            </div>

            <p
                className={
                    channelRole === 'owner' || channelRole === 'moderator'
                        ? 'member-item__last-active_moderator'
                        : 'member-item__last-active_member'
                }
            >
                {getPresence()}
            </p>
            <div
                className={
                    channelRole === 'owner' || channelRole === 'moderator'
                        ? 'member-item__last-active_moderator'
                        : 'member-item__last-active_member'
                }
            >
                <div
                    className={
                        user.isOwner
                            ? 'member-item__owner'
                            : user.isModerator
                            ? 'member-item__moderator'
                            : 'member-item__member'
                    }
                >
                    {user.isOwner ? 'owner' : user.isModerator ? 'Group admin' : 'Viewer'}
                </div>
            </div>
            {(channelRole === 'owner' || channelRole === 'moderator') &&
            user.role !== 'owner' &&
            !(channelRole === 'moderator' && user.isModerator) ? (
                <Menu
                    onSelect={(action: any) => {
                        console.log('Action', action);
                        if (action === 'remove-user') {
                        } else if (action === 'make-admin') {
                            handleToggleAdmin(user.id, false);
                        } else if (action === 'remove-admin') {
                            handleToggleAdmin(user.id, true);
                        }
                    }}
                    style={{ paddingRight: 20, paddingLeft: 20 }}
                >
                    <MenuTrigger>
                        <div>
                            <Ionicons name="ellipsis-vertical-outline" size={16} color={'#858688'} />
                        </div>
                    </MenuTrigger>
                    <MenuOptions
                        optionsContainerStyle={{
                            shadowOffset: {
                                width: 2,
                                height: 2,
                            },
                            shadowColor: '#000',
                            // overflow: 'hidden',
                            shadowOpacity: 0.07,
                            shadowRadius: 7,
                            padding: 10,
                            // borderWidth: 1,
                            // borderColor: '#CCC'
                        }}
                    >
                        {getDropdownOptions().map((item: any) => {
                            return (
                                <MenuOption value={item.value}>
                                    <div className="dropdown_label">{item.label}</div>
                                </MenuOption>
                            );
                        })}
                    </MenuOptions>
                </Menu>
            ) : (
                <div />
            )}
        </div>
    );
};

const ViewChannel = (props: Props) => {
    const { theme, toggleMobile } = props;
    const { client } = useChatContext<StreamChatGenerics>();
    const { channel } = useChannelStateContext<StreamChatGenerics>();

    const [channelRole, setChannelRole] = useState('member');
    const [channelMembers, setChannelMembers] = useState<any[]>([]);

    const getGroupCreationText = useCallback(() => {
        const { created_by, created_at } = channel.data;

        return (
            'Group created by ' + created_by.name + ' on ' + moment(new Date(created_at)).format('MMMM Do YYYY, h:mm a')
        );
    }, [channel]);

    useEffect(() => {
        function capitalizeFirstLetter(word: string) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }

        const updateChannelMembers = (event?: Event) => {
            // test if the updated user is a member of this channel
            if (!event || channel.state.members[event.user!.id] !== undefined) {
                let members: any[] = [];

                Object.values(channel.state.members).map((user) => {
                    if (user.user_id === client.userID) {
                        return;
                    }

                    members.push({
                        channel_role: user.channel_role,
                        isOwner: user.role === 'owner',
                        isModerator: user.is_moderator,
                        roleDescription:
                            capitalizeFirstLetter(user.user.cues_role) +
                            (user.cues_role === 'student'
                                ? ' (' + user.cues_grade + '-' + user.cues_section + ') '
                                : ''),
                        ...user.user,
                    });
                });

                setChannelMembers(members);
            } else {
                setChannelMembers([]);
            }
        };

        updateChannelMembers();

        //
        client.on('user.presence.changed', updateChannelMembers);
        client.on('member.added', updateChannelMembers);
        client.on('member.removed', updateChannelMembers);
        client.on('member.updated', updateChannelMembers);

        return () => {
            client.off('user.presence.changed', updateChannelMembers);
            client.off('member.added', updateChannelMembers);
            client.off('member.removed', updateChannelMembers);
            client.off('member.updated', updateChannelMembers);
        };
    }, [client, channel]);

    useEffect(() => {
        if (!channel || !client) return;

        const channelUser = channel.state.members[client.userID];

        if (channelUser.role === 'owner') {
            setChannelRole('owner');
        } else if (channelUser.channel_role === 'moderator') {
            setChannelRole('moderator');
        } else {
            setChannelRole('member');
        }
    }, [channel, client]);

    if (!channel || !channel.data) return null;

    const members = Object.values(channel.state.members).filter(({ user }) => user?.id !== client.userID);

    const handleToggleAdmin = useCallback(
        (userId: string, alreadyAdmin: boolean) => {
            if (!channel) return;

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: toggleAdminRole,
                    variables: {
                        groupId: channel.id,
                        userId,
                        alreadyAdmin,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.streamChat.toggleAdminRole) {
                        Alert('Updated user successfully.');
                    }
                })
                .catch((e) => {
                    console.log('Error', e);
                    return;
                });
        },
        [channel]
    );

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 50,
                alignItems: 'center',
            }}
        >
            {channel.data?.image ? (
                <Image
                    style={{
                        height: 100,
                        width: 100,
                        borderRadius: 75,
                        // marginTop: 20,
                        position: 'relative',
                        alignSelf: 'center',
                    }}
                    source={{
                        uri: channel.data?.image,
                    }}
                />
            ) : (
                <AvatarGroup members={members} />
            )}

            <div
                style={{
                    fontFamily: 'Inter',
                    fontSize: 18,
                    marginTop: 20,
                }}
            >
                {channel.data.name}
            </div>
            <div
                style={{
                    fontFamily: 'Inter',
                    fontSize: 14,
                    marginTop: 10,
                    color: '#858688',
                }}
            >
                {channel.data.member_count} members
            </div>
            <div
                style={{
                    fontFamily: 'Overpass',
                    fontSize: 14,
                    marginTop: 20,
                    color: '#858688',
                }}
            >
                {getGroupCreationText()}
            </div>

            {/* USERS */}
            <MembersListContainer channelRole={channelRole}>
                {channelMembers.map((user, i) => (
                    <MemberItem index={i} user={user} channelRole={channelRole} handleToggleAdmin={handleToggleAdmin} />
                ))}
            </MembersListContainer>
        </div>
    );
};

export default React.memo(ViewChannel);
