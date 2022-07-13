import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import { UserResponse } from 'stream-chat';
import { Avatar, useChannelStateContext, useChatContext } from 'stream-chat-react';
import AvatarGroup from '../AvatarGroup/AvatarGroup';
import type { StreamChatGenerics } from '../types';

import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

import './ViewChannel.css';
import { Ionicons } from '@expo/vector-icons';

import { deleteChannelPermanently, toggleAdminRole } from '../../../graphql/QueriesAndMutations';
import Alert from '../../Alert';
import { View } from '../../Themed';
import FileUpload from '../../UploadFiles';
import { useApolloClient } from '@apollo/client';
import { disableEmailId } from '../../../constants/zoomCredentials';
import { useAppContext } from '../../../contexts/AppContext';

type Props = {
    theme: string;
    toggleMobile: () => void;
    setIsAddingUsersGroup: (value: boolean) => void;
};

type ListProps = {
    channelRole: string;
};

type ItemProps = {
    index: number;
    user: UserResponse<StreamChatGenerics>;
    channelRole: string;
    handleToggleAdmin: (userId: string, alreadyAdmin: boolean) => void;
    handleRemoveUser: (userId: string) => void;
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
    const { index, user, channelRole, handleToggleAdmin, handleRemoveUser } = props;

    const moderatorActions = [
        {
            label: 'Make Group Admin',
            value: 'make-admin',
        },
        {
            label: 'Remove User',
            value: 'remove-user',
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
                            handleRemoveUser(user.id);
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

type InputProps = {
    groupName: string;
    setGroupName: (value: React.SetStateAction<string>) => void;
};

const GroupNameInput: React.FC<InputProps> = (props) => {
    const { groupName = '', setGroupName } = props;
    const handleChange = (event: { preventDefault: () => void; target: { value: string } }) => {
        event.preventDefault();
        setGroupName(event.target.value);
    };

    return (
        <div className="channel-name-input__wrapper">
            <p
                style={{
                    marginBottom: 10,
                }}
            >
                Group Name
            </p>
            <input onChange={handleChange} placeholder="" type="text" value={groupName} />
        </div>
    );
};

const ViewChannel = (props: Props) => {
    const { user } = useAppContext();

    const { theme, toggleMobile } = props;
    const { client } = useChatContext<StreamChatGenerics>();
    const { channel } = useChannelStateContext<StreamChatGenerics>();

    const [channelRole, setChannelRole] = useState('member');
    const [channelMembers, setChannelMembers] = useState<any[]>([]);

    const [groupName, setGroupName] = useState('');
    const [groupImage, setGroupImage] = useState('');

    const [isEditingGroupProfile, setIsEditingGroupProfile] = useState(false);

    const server = useApolloClient();

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
                        (user.cues_role === 'student' ? ' (' + user.cues_grade + '-' + user.cues_section + ') ' : ''),
                    ...user.user,
                });
            });

            setChannelMembers(members);
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

        setGroupName(channel.data?.name);
        setGroupImage(channel.data.image ? channel.data.image : undefined);

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

    const handleRemoveUser = useCallback(
        async (userId: string) => {
            if (!channel) return;

            await channel.removeMembers([userId]);
        },
        [channel]
    );

    const handleToggleAdmin = useCallback(
        (userId: string, alreadyAdmin: boolean) => {
            if (!channel) return;

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

    const updateChannel = useCallback(async () => {
        if (!groupName || groupName === '') {
            Alert('Name is required for group.');
            return;
        }

        await channel.updatePartial({
            set: {
                name: groupName,
                image: groupImage,
            },
        });

        setIsEditingGroupProfile(false);
    }, [channel, groupName, groupImage]);

    const handleDelete = useCallback(() => {
        if (!channel) return;

        server
            .mutate({
                mutation: deleteChannelPermanently,
                variables: {
                    groupId: channel.id,
                },
            })
            .then((res) => {
                if (res.data && res.data.streamChat.deleteChannelPermanently) {
                }
            })
            .catch((e) => {
                Alert('Failed to delete channel.');
            });
    }, [channel]);

    const renderEditGroupInfo = () => {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div className="channel-name-input__wrapper">
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: 10,
                        }}
                    >
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
                                uri: groupImage ? groupImage : 'https://cues-files.s3.amazonaws.com/images/default.png',
                            }}
                        />
                        {groupImage ? (
                            <TouchableOpacity
                                onPress={() => setGroupImage(undefined)}
                                style={{
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    marginLeft: 10,
                                }}
                            >
                                <Text>
                                    <Ionicons name={'close-circle-outline'} size={18} color={'#1F1F1F'} />
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <FileUpload
                                profile={true}
                                onUpload={(u: any, t: any) => {
                                    setGroupImage(u);
                                }}
                            />
                        )}
                    </View>
                </div>
                <GroupNameInput groupName={groupName} setGroupName={setGroupName} />

                <div
                    style={{
                        marginBottom: 20,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => updateChannel()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                        }}
                        disabled={user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 120,
                            }}
                        >
                            SAVE
                        </Text>
                    </TouchableOpacity>
                </div>

                <div
                    style={{
                        marginBottom: 20,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setIsEditingGroupProfile(false)}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                        }}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#000',
                                backgroundColor: '#fff',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 120,
                            }}
                        >
                            CANCEL
                        </Text>
                    </TouchableOpacity>
                </div>
            </div>
        );
    };

    const renderViewGroupInfo = () => {
        return (
            <>
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
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 20,
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 18,
                        }}
                    >
                        {channel.data.name}
                    </div>

                    {channelRole === 'owner' || channelRole === 'moderator' ? (
                        <div
                            onClick={() => setIsEditingGroupProfile(true)}
                            style={{
                                marginLeft: 10,
                                cursor: 'pointer',
                            }}
                        >
                            <Ionicons name="pencil-outline" size={18} />
                        </div>
                    ) : null}
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
                        <MemberItem
                            index={i}
                            user={user}
                            channelRole={channelRole}
                            handleToggleAdmin={handleToggleAdmin}
                            handleRemoveUser={handleRemoveUser}
                        />
                    ))}
                </MembersListContainer>

                {channelRole === 'moderator' || channelRole === 'owner' ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 40,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                props.setIsAddingUsersGroup(true);
                            }}
                            style={{
                                width: 125,
                                paddingHorizontal: 24,
                                paddingVertical: 14,
                                backgroundColor: '#000',
                                borderWidth: 1,
                                borderColor: '#000',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons
                                name="person-add-outline"
                                size={18}
                                color="#fff"
                                style={{
                                    marginRight: 8,
                                }}
                            />
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    color: '#fff',
                                    fontSize: 11,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Users
                            </Text>
                        </TouchableOpacity>

                        {channelRole === 'owner' ? (
                            <TouchableOpacity
                                onPress={() => {
                                    Alert('Delete group permanently?', 'Messages cannot be retrieved upon deletion.', [
                                        {
                                            text: 'Cancel',
                                            style: 'cancel',
                                            onPress: () => {
                                                return;
                                            },
                                        },
                                        {
                                            text: 'Yes',
                                            onPress: () => {
                                                handleDelete();
                                            },
                                        },
                                    ]);
                                }}
                                style={{
                                    width: 125,
                                    paddingHorizontal: 24,
                                    paddingVertical: 14,
                                    backgroundColor: '#fff',
                                    borderWidth: 1,
                                    borderColor: '#000',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 20,
                                }}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color="#000"
                                    style={{
                                        marginRight: 8,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        color: '#000',
                                        fontSize: 11,
                                        fontFamily: 'inter',
                                        overflow: 'hidden',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Delete
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </div>
                ) : null}
            </>
        );
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 50,
                marginBottom: 50,
                alignItems: 'center',
            }}
        >
            {isEditingGroupProfile ? renderEditGroupInfo() : renderViewGroupInfo()}
        </div>
    );
};

export default React.memo(ViewChannel);
