import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, useChannelStateContext, useChatContext } from 'stream-chat-react';
import type { Channel, UserResponse } from 'stream-chat';
import _debounce from 'lodash.debounce';

import { InviteIcon, XButton, XButtonBackground } from '../assets';

import { Select } from '@mobiscroll/react';

import './CreateChannel.css';
import './UserList.css';

import type { StreamChatGenerics } from '../types';
import { fetchAPI } from '../../../graphql/FetchAPI';
import { addModerators, getInboxDirectory } from '../../../graphql/QueriesAndMutations';
import { ActivityIndicator, Image } from 'react-native';

// GROUP IMAGE
import { Text, View, TouchableOpacity } from '../../Themed';
import { Ionicons } from '@expo/vector-icons';
import FileUpload from '../../UploadFiles';
import Alert from '../../Alert';

const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sections = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
];
const filterRoleOptionsInstructor = [
    {
        value: 'All',
        text: 'All Roles',
    },
    {
        value: 'student',
        text: 'Student',
    },
    {
        value: 'instructor',
        text: 'Instructor',
    },
    {
        value: 'admin',
        text: 'Admin',
    },
    {
        value: 'parent',
        text: 'Parents',
    },
];

const filterRoleOptionsStudent = [
    {
        value: 'All',
        text: 'All Roles',
    },
    {
        value: 'student',
        text: 'Student',
    },
    {
        value: 'instructor',
        text: 'Instructor',
    },
    {
        value: 'admin',
        text: 'Admin',
    },
];

const gradeOptions = grades.map((g: any) => {
    return {
        value: g,
        text: g,
    };
});
const filterGradeOptions = [
    {
        value: 'All',
        text: 'All Grades',
    },
    ...gradeOptions,
];
const sectionOptions = sections.map((s: any) => {
    return {
        value: s,
        text: s,
    };
});
const filterSectionOptions = [
    {
        value: 'All',
        text: 'All Sections',
    },
    ...sectionOptions,
];

const ListContainer = React.forwardRef((props, ref) => {
    const { children, toggleAll, checked } = props;

    return (
        <div className="user-list__container">
            <div className="user-list__header">
                <p>User</p>
                <p>Role</p>
                <p>Status</p>
                <div>
                    <input
                        id="selectAll"
                        type="checkbox"
                        ref={ref}
                        style={{
                            display: 'none',
                        }}
                        onChange={toggleAll}
                        checked={checked}
                    />
                    <label for="selectAll">
                        {checked ? <InviteIcon /> : <div className="user-item__invite-empty" />}
                    </label>
                </div>
            </div>
            {children}
        </div>
    );
});

const UserResult = ({ user }: { user: UserResponse<StreamChatGenerics> }) => (
    <li className="messaging-create-channel__user-result">
        <Avatar image={user.image} name={user.name || user.id} size={34} />
        {user.online && <div className="messaging-create-channel__user-result-online" />}
        <div className="messaging-create-channel__user-result__details">
            <span>{user.name}</span>
        </div>
    </li>
);

type InputProps = {
    groupName: string;
    setGroupName: (value: React.SetStateAction<string>) => void;
};

type ItemProps = {
    index: number;
    selected: boolean;
    toggleUser: (value: UserResponse<StreamChatGenerics>) => void;
    user: UserResponse<StreamChatGenerics>;
};

type SelectedItemProps = {
    index: number;
    user: UserResponse<StreamChatGenerics>;
    selected: boolean;
    toggleAdmin: (value: string) => void;
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

const UserItem: React.FC<ItemProps> = (props) => {
    const { index, selected, toggleUser, user } = props;

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

    const handleClick = () => {
        toggleUser(user);
    };

    return (
        <div className="user-item__wrapper" onClick={handleClick}>
            <div className="user-item__name-wrapper">
                <Avatar image={user.image} name={user.name || user.id} size={32} />
                <p className="user-item__name">{user.name || user.id}</p>
            </div>
            <div className="user-item__role-wrapper">{user.roleDescription}</div>
            <p className="user-item__last-active">{getPresence()}</p>
            {selected ? <InviteIcon /> : <div className="user-item__invite-empty" />}
        </div>
    );
};

const SelectedUserItem: React.FC<SelectedItemProps> = (props) => {
    const { index, user, selected, toggleAdmin } = props;

    function capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    return (
        <div className="selected-user-item__wrapper">
            <div className="selected-user-item__name-wrapper">
                <Avatar image={user.image} name={user.name || user.id} size={32} />
                <p className="user-item__name">{user.name || user.id}</p>
            </div>
            <p className="selected-user-item__role">{capitalizeFirstLetter(user.cues_role)}</p>
            <div className="selected-user-item__admin" onClick={() => toggleAdmin(user.id)}>
                {selected ? <InviteIcon /> : <div className="user-item__invite-empty" />}
            </div>
        </div>
    );
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

type Props = {
    onClose: () => void;
    toggleMobile: () => void;
    subscriptions: any[];
    isAddingUsersGroup: boolean;
    setIsAddingUsersGroup: (value: boolean) => void;
};

const filterByOptions = [
    {
        value: 'courses',
        text: 'Course',
    },
    {
        value: 'role',
        text: 'Role',
    },
];

const CreateChannel = (props: Props) => {
    const { onClose, toggleMobile, isAddingUsersGroup, setIsAddingUsersGroup } = props;

    const { client, setActiveChannel } = useChatContext<StreamChatGenerics>();

    const { channel } = useChannelStateContext<StreamChatGenerics>();

    console.log('Client', client);

    // STATE
    const [focusedUser, setFocusedUser] = useState<number>();
    const [inputText, setInputText] = useState('');
    const [resultsOpen, setResultsOpen] = useState(false);
    const [searchEmpty, setSearchEmpty] = useState(false);
    const [searching, setSearching] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<UserResponse<StreamChatGenerics>[]>([]);
    const [users, setUsers] = useState<UserResponse<StreamChatGenerics>[]>([]);
    const [groupAdmins, setGroupAdmins] = useState<string[]>([]);

    // DIRECTORY
    const [isFetchingDirectory, setIsFetchingDirectory] = useState(true);
    const [roleDropdownsOptions, setRoleDropdownOptions] = useState<any[]>([]);
    const [courseDropdownOptions, setCourseDropdownOptions] = useState<any[]>([]);
    const [filterBySelected, setFilterBySelected] = useState('courses');
    const [directory, setDirectory] = useState<any>(undefined);

    const [selectedCourse, setSelectedCourse] = useState('All');
    const [selectedRole, setSelectedRole] = useState('All');
    const [selectedGrade, setSelectedGrade] = useState('All');
    const [selectedSection, setSelectedSection] = useState('All');

    // DIRECTORY LIST
    const [isFetchingDisplayUsers, setIsFetchingDisplayUsers] = useState(false);
    const [displayUsersError, setDisplayUsersError] = useState(false);
    const [displayUsers, setDisplayUsers] = useState<any[]>([]);
    const [indeterminate, setIndeterminate] = useState(false);
    const checkboxRef: any = useRef();
    const [checked, setChecked] = useState(false);

    // ADD USERS GROUP
    const [editChannelName, setEditChannelName] = useState('');
    const [channelMembers, setChannelMembers] = useState<string[]>([]);

    // GROUP
    const [newGroup, setNewGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupImage, setGroupImage] = useState<any>(undefined);

    const inputRef = useRef<HTMLInputElement>(null);

    const clearState = () => {
        setInputText('');
        setResultsOpen(false);
        setSearchEmpty(false);
    };

    useEffect(() => {
        if (isAddingUsersGroup && channel && channel.state.members) {
            setEditChannelName(channel.data?.name);
            setChannelMembers(Object.keys(channel.state.members));
        }
    }, [isAddingUsersGroup, channel]);

    useEffect(() => {
        if (!newGroup) {
            setGroupAdmins([]);
        }
    }, [newGroup]);

    const toggleAll = useCallback(() => {
        if (checked) {
            // Remove display users from selected
            let updateSelections: any[] = [...selectedUsers];
            displayUsers.map((user: any) => {
                updateSelections = updateSelections.filter((selected: any) => selected.id !== user.id);
            });

            setSelectedUsers(updateSelections);
            setChecked(false);
        } else {
            // Add All
            let updateSelections: any[] = [...selectedUsers];
            displayUsers.map((user: any) => {
                const isAlreadyAdded = selectedUsers.find((selected: any) => selected.id === user.id);
                if (isAlreadyAdded) return;
                updateSelections.push(user);
            });
            setSelectedUsers(updateSelections);
            setChecked(true);
        }
        setIndeterminate(false);
    }, [checked, selectedUsers, displayUsers]);

    useEffect(() => {
        const clickListener = () => {
            if (resultsOpen) clearState();
        };

        document.addEventListener('click', clickListener);

        return () => document.removeEventListener('click', clickListener);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (client && client.userID) {
            console.log('CLient', client);
            fetchInboxDirectory();
        }
    }, [client]);

    useEffect(() => {
        if (props.subscriptions) {
            let subOptions = [
                {
                    value: 'All',
                    text: 'All Courses',
                },
            ];

            props.subscriptions.map((sub: any) => {
                subOptions.push({
                    text: sub.channelName,
                    value: sub.channelId,
                });
            });
            setCourseDropdownOptions(subOptions);
        }
    }, [props.subscriptions]);

    // Handle Select All Checkbox
    useEffect(() => {
        let isIndeterminate = false;
        let checked = true;

        if (displayUsers.length === 0) {
            if (checkboxRef && checkboxRef.current) {
                setChecked(false);
                setIndeterminate(true);
                checkboxRef.current.indeterminate = true;
                return;
            }
        }

        displayUsers.map((user: any) => {
            const isSelected = selectedUsers.find((selected: any) => selected.id === user.id);

            if (!isSelected) {
                isIndeterminate = true;
                checked = false;
            }
        });

        setIndeterminate(indeterminate);
        setChecked(checked);

        if (checkboxRef && checkboxRef.current) {
            checkboxRef.current.indeterminate = true;
            return;
        }
    }, [selectedUsers, displayUsers, checkboxRef]);

    const fetchInboxDirectory = useCallback(() => {
        if (client && client.userID) {
            console.log('Client ID', client.userID);
            const server = fetchAPI('');
            server
                .query({
                    query: getInboxDirectory,
                    variables: {
                        userId: client.userID,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.streamChat.getInboxDirectory) {
                        setDirectory(res.data.streamChat.getInboxDirectory);
                    } else {
                        setDirectory(undefined);
                    }
                    setIsFetchingDirectory(false);
                })
                .catch((e) => {
                    setDirectory(undefined);
                    console.log('Error', e);
                    setIsFetchingDirectory(false);
                    return;
                });
        }
    }, [client]);

    console.log('Channel Members', channelMembers);

    const findUsers = async () => {
        if (searching) return;
        setSearching(true);

        try {
            let response;

            if (isAddingUsersGroup) {
                response = await client.queryUsers(
                    {
                        id: { $nin: channelMembers },
                        $and: [{ name: { $autocomplete: inputText } }],
                    },
                    { id: 1 },
                    { limit: 6 }
                );
            } else {
                response = await client.queryUsers(
                    {
                        id: { $ne: client.userID as string },
                        $and: [{ name: { $autocomplete: inputText } }],
                    },
                    { id: 1 },
                    { limit: 6 }
                );
            }

            if (!response.users.length) {
                setSearchEmpty(true);
            } else {
                setSearchEmpty(false);
                setUsers(response.users);
            }

            setResultsOpen(true);
        } catch (error) {
            console.log({ error });
        }

        setSearching(false);
    };

    const findUsersDebounce = _debounce(findUsers, 100, {
        trailing: true,
    });

    useEffect(() => {
        if (inputText) {
            findUsersDebounce();
        }
    }, [inputText]); // eslint-disable-line react-hooks/exhaustive-deps

    const addUsersToGroup = useCallback(async () => {
        if (!channel) return;

        const selectedUsersIds = selectedUsers.map((u) => u.id);

        try {
            await channel.addMembers(selectedUsersIds);

            Alert('Added members successfully.');

            setIsAddingUsersGroup(false);
        } catch (e) {
            Alert('Failed to add members. Try again.');
        }
    }, [selectedUsers, channel]);

    const createChannel = useCallback(async () => {
        const selectedUsersIds = selectedUsers.map((u) => u.id);

        if (!selectedUsersIds.length || !client.userID) return;

        let conversation: Channel<StreamChatGenerics>;

        // GROUP
        if (selectedUsersIds.length > 1) {
            conversation = await client.channel('messaging', {
                members: [...selectedUsersIds, client.userID],
                name: groupName,
                image: groupImage ? groupImage : undefined,
                team: client.user.schoolId,
            });
        } else {
            conversation = await client.channel('messaging', {
                members: [...selectedUsersIds, client.userID],
                team: client.user.schoolId,
            });
        }

        await conversation.watch();

        // if (groupAdmins.length > 0) {
        //     // Make backend call to assign moderators;

        // }

        const server = fetchAPI('');
        server.mutate({
            mutation: addModerators,
            variables: {
                groupId: conversation.id,
                moderators: [client.userID, ...groupAdmins],
            },
        });

        setActiveChannel?.(conversation);
        setSelectedUsers([]);
        setUsers([]);
        onClose();
    }, [selectedUsers, groupName, groupImage, client, groupAdmins]);

    const addUser = (addedUser: UserResponse<StreamChatGenerics>) => {
        const isAlreadyAdded = selectedUsers.find((user) => user.id === addedUser.id);
        if (isAlreadyAdded) return;

        setSelectedUsers([...selectedUsers, addedUser]);
        setResultsOpen(false);
        setInputText('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    console.log('Active Channel', channel);

    const toggleUser = (value: UserResponse<StreamChatGenerics>) => {
        const isAlreadyAdded = selectedUsers.find((user) => user.id === value.id);
        if (isAlreadyAdded) {
            const filterUsers = selectedUsers.filter((user) => user.id !== value.id);
            setSelectedUsers(filterUsers);
        } else {
            setSelectedUsers([...selectedUsers, value]);
        }
    };

    const removeUser = (user: UserResponse<StreamChatGenerics>) => {
        const newUsers = selectedUsers.filter((item) => item.id !== user.id);
        setSelectedUsers(newUsers);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // check for up(ArrowUp) or down(ArrowDown) key
            if (event.key === 'ArrowUp') {
                setFocusedUser((prevFocused) => {
                    if (prevFocused === undefined) return 0;
                    return prevFocused === 0 ? users.length - 1 : prevFocused - 1;
                });
            }
            if (event.key === 'ArrowDown') {
                setFocusedUser((prevFocused) => {
                    if (prevFocused === undefined) return 0;
                    return prevFocused === users.length - 1 ? 0 : prevFocused + 1;
                });
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                if (focusedUser !== undefined) {
                    addUser(users[focusedUser]);
                    return setFocusedUser(undefined);
                }
            }
        },
        [users, focusedUser] // eslint-disable-line
    );

    console.log('Selected users', selectedUsers);

    console.log('Display Users', displayUsers);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown, false);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    console.log('Selected role', selectedRole);

    function capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    // Update display Users
    useEffect(() => {
        setIsFetchingDisplayUsers(true);

        if (!directory) {
            setDisplayUsers([]);
            setIsFetchingDisplayUsers(false);
            return;
        }

        const queryUsers = async (users: any[]) => {
            const userIds: string[] = [];

            users.map((user: any) => {
                if (isAddingUsersGroup && channelMembers.includes(user._id)) return;

                userIds.push(user._id);
            });

            if (userIds.length === 0) {
                setDisplayUsers([]);
                setIsFetchingDisplayUsers(false);
                return;
            }

            const res = await client.queryUsers({ id: { $in: userIds } }, { last_active: -1 }, { presence: true });

            if (res && res.users) {
                let updateUsersWithRoles: any[] = [];

                // ALL OTHER ROLES
                res.users.map((user: any) => {
                    if (user.cues_role !== 'parent') {
                        updateUsersWithRoles.push({
                            ...user,
                            roleDescription:
                                capitalizeFirstLetter(user.cues_role) +
                                (user.cues_role === 'student'
                                    ? ' (' + user.cues_grade + '-' + user.cues_section + ') '
                                    : ''),
                        });
                    }
                });

                // PARENTS
                users.map((user: any) => {
                    if (user.role === 'parent') {
                        const findQueriedUser = res.users.find((x: any) => x.id === user._id);

                        if (findQueriedUser) {
                            updateUsersWithRoles.push({
                                ...findQueriedUser,
                                roleDescription: user.roleDescription,
                            });
                        }
                    }
                });

                setDisplayUsers(updateUsersWithRoles);
            } else {
                setDisplayUsersError(true);
            }
            setIsFetchingDisplayUsers(false);
        };

        if (directory.length === 0) {
            setDisplayUsers([]);
            setIsFetchingDisplayUsers(false);
        } else {
            let users: any[] = [];

            if (filterBySelected === 'courses') {
                if (selectedCourse === 'All') {
                    directory.map((user: any) => {
                        if (user.courses.length > 0) {
                            users.push(user);
                        }
                    });
                } else {
                    directory.map((user: any) => {
                        if (user.courses.includes(selectedCourse)) {
                            users.push(user);
                        }
                    });
                }
            } else {
                if (selectedRole === 'All') {
                    users = directory;
                } else {
                    directory.map((user: any) => {
                        if (user.role === selectedRole) {
                            users.push(user);
                        }
                    });

                    console.log('Users after Filter role', users);

                    if ((selectedRole === 'student' || selectedRole === 'parent') && selectedGrade !== 'All') {
                        users = users.filter((user: any) => {
                            return user.grade === selectedGrade;
                        });
                    }
                    console.log('Users after Filter grade', users);

                    if ((selectedRole === 'student' || selectedRole === 'parent') && selectedSection !== 'All') {
                        users = users.filter((user: any) => {
                            return user.section === selectedSection;
                        });
                    }
                    console.log('Users after Filter section', users);
                }
            }

            if (users.length === 0) {
                setDisplayUsers([]);
                setIsFetchingDisplayUsers(false);
            } else {
                queryUsers(users);
            }
        }
    }, [
        directory,
        filterBySelected,
        selectedCourse,
        selectedRole,
        selectedGrade,
        selectedSection,
        props.subscriptions,
        client,
    ]);

    const renderChannelInputButtons = () => {
        if (isAddingUsersGroup) {
            return (
                <>
                    {selectedUsers.length > 0 ? (
                        <button className="create-channel-button" onClick={addUsersToGroup}>
                            Add Users
                        </button>
                    ) : null}
                </>
            );
        }

        return (
            <>
                {selectedUsers.length === 1 ? (
                    <button className="create-channel-button" onClick={createChannel}>
                        Start chat
                    </button>
                ) : selectedUsers.length > 1 ? (
                    <button
                        className="create-channel-button"
                        onClick={() => {
                            setNewGroup(true);
                        }}
                    >
                        Create group
                    </button>
                ) : null}
            </>
        );
    };

    const renderCreateChannelInput = () => {
        return (
            <div>
                <header>
                    <div className="messaging-create-channel__left">
                        <div className="messaging-create-channel__left-text">To: </div>
                        <div className="users-input-container">
                            {!!selectedUsers?.length && (
                                <div className="messaging-create-channel__users">
                                    {selectedUsers.map((user) => (
                                        <div
                                            className="messaging-create-channel__user"
                                            onClick={() => removeUser(user)}
                                            key={user.id}
                                        >
                                            <div className="messaging-create-channel__user-text">{user.name}</div>
                                            <XButton />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <form>
                                <input
                                    autoFocus
                                    ref={inputRef}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={'Start typing for suggestions'}
                                    type="text"
                                    className="messaging-create-channel__input"
                                />
                            </form>
                        </div>
                        <div className="close-mobile-create" onClick={() => toggleMobile()}>
                            <XButtonBackground />
                        </div>
                    </div>
                    {renderChannelInputButtons()}
                </header>
                {inputText && (
                    <main>
                        <ul className="messaging-create-channel__user-results">
                            {!!users?.length && !searchEmpty && (
                                <div>
                                    {users.map((user, i) => (
                                        <div
                                            className={`messaging-create-channel__user-result ${
                                                focusedUser === i && 'focused'
                                            }`}
                                            onClick={() => addUser(user)}
                                            key={user.id}
                                        >
                                            <UserResult user={user} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchEmpty && (
                                <div
                                    onClick={() => {
                                        inputRef.current?.focus();
                                        clearState();
                                    }}
                                    className="messaging-create-channel__user-result empty"
                                >
                                    No people found...
                                </div>
                            )}
                        </ul>
                    </main>
                )}
            </div>
        );
    };

    const renderFilterBySwitch = () => {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 20,
                    backgroundColor: '#f8f8f8',
                }}
            >
                {filterByOptions.map((tab: any, ind: number) => {
                    return (
                        <div
                            style={{
                                backgroundColor:
                                    (tab.value === 'courses' && filterBySelected === 'courses') ||
                                    (tab.value !== 'courses' && filterBySelected !== 'courses')
                                        ? '#000'
                                        : '#f8f8f8',
                                borderRadius: 20,
                                paddingLeft: 14,
                                paddingRight: 14,
                                paddingTop: 7,
                                paddingBottom: 7,
                                minWidth: 60,
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                setFilterBySelected(tab.value);
                            }}
                            key={ind.toString()}
                        >
                            <div
                                style={{
                                    color:
                                        (tab.value === 'courses' && filterBySelected === 'courses') ||
                                        (tab.value !== 'courses' && filterBySelected !== 'courses')
                                            ? '#fff'
                                            : '#000',
                                    fontSize: 12,
                                    textAlign: 'center',
                                }}
                            >
                                {(tab.value === 'courses' && filterBySelected === 'courses') ||
                                (tab.value !== 'courses' && filterBySelected !== 'courses')
                                    ? 'Filter by ' + tab.text
                                    : tab.text}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderUserList = () => {
        if (displayUsersError) {
            return (
                <ListContainer>
                    <div className="user-list__message">Error loading, please refresh and try again.</div>
                </ListContainer>
            );
        }

        return (
            <ListContainer checked={checked} ref={checkboxRef} toggleAll={toggleAll}>
                {isFetchingDisplayUsers ? (
                    <div className="user-list__message">Loading users...</div>
                ) : displayUsers.length === 0 ? (
                    <div className="user-list__message">No users found.</div>
                ) : (
                    displayUsers.map((user, i) => {
                        const findUser = selectedUsers.find((selected) => {
                            return selected.id === user.id;
                        });

                        return (
                            <UserItem
                                index={i}
                                key={user.id}
                                selected={findUser ? true : false}
                                toggleUser={toggleUser}
                                user={user}
                            />
                        );
                    })
                )}
            </ListContainer>
        );
    };

    // const renderDirectory
    const renderDirectory = () => {
        return (
            <div
                style={{
                    marginTop: 25,
                    paddingLeft: 20,
                    paddingRight: 20,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}
                >
                    <p
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 18,
                        }}
                    >
                        {isAddingUsersGroup ? 'Add users to ' + editChannelName : 'Browse Directory'}
                    </p>
                    {renderFilterBySwitch()}
                </div>
                {isFetchingDirectory ? (
                    <div
                        style={{
                            marginTop: 50,
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <ActivityIndicator />
                    </div>
                ) : !directory ? (
                    <div
                        style={{
                            marginTop: 50,
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        Failed to fetch directory.
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: 25,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: 11,
                                    }}
                                >
                                    {filterBySelected === 'courses' ? 'Course' : 'Role'}
                                </p>
                                <label style={{ width: 150, marginTop: 8 }}>
                                    <Select
                                        touchUi={true}
                                        value={filterBySelected === 'courses' ? selectedCourse : selectedRole}
                                        themeVariant="light"
                                        onChange={(val: any) => {
                                            if (filterBySelected === 'courses') {
                                                setSelectedCourse(val.value);
                                            } else {
                                                setSelectedRole(val.value);
                                            }
                                        }}
                                        responsive={{
                                            small: {
                                                display: 'bubble',
                                            },
                                            medium: {
                                                touchUi: false,
                                            },
                                        }}
                                        data={
                                            filterBySelected === 'courses'
                                                ? courseDropdownOptions
                                                : client?.user?.cues_role === 'instructor'
                                                ? filterRoleOptionsInstructor
                                                : filterRoleOptionsStudent
                                        }
                                    />
                                </label>
                            </div>

                            {filterBySelected !== 'courses' &&
                            (selectedRole === 'student' || selectedRole === 'parent') ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            paddingLeft: 30,
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: 11,
                                            }}
                                        >
                                            Grade
                                        </p>
                                        <label style={{ width: 150, marginTop: 8 }}>
                                            <Select
                                                touchUi={true}
                                                value={selectedGrade}
                                                themeVariant="light"
                                                onChange={(val: any) => {
                                                    setSelectedGrade(val.value);
                                                }}
                                                responsive={{
                                                    small: {
                                                        display: 'bubble',
                                                    },
                                                    medium: {
                                                        touchUi: false,
                                                    },
                                                }}
                                                data={filterGradeOptions}
                                            />
                                        </label>
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            paddingLeft: 30,
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: 11,
                                            }}
                                        >
                                            Section
                                        </p>
                                        <label style={{ width: 150, marginTop: 8 }}>
                                            <Select
                                                touchUi={true}
                                                value={selectedSection}
                                                themeVariant="light"
                                                onChange={(val: any) => {
                                                    setSelectedSection(val.value);
                                                }}
                                                responsive={{
                                                    small: {
                                                        display: 'bubble',
                                                    },
                                                    medium: {
                                                        touchUi: false,
                                                    },
                                                }}
                                                data={filterSectionOptions}
                                            />
                                        </label>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        {/* USER LIST */}
                        {renderUserList()}
                    </div>
                )}
            </div>
        );
    };

    const renderGroupInfo = () => {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: 50,
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
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <p
                        style={{
                            marginBottom: 10,
                            fontFamily: 'Inter',
                            fontSize: 14,
                        }}
                    >
                        Members
                    </p>
                    <div className="selected-user-list__container">
                        <div className="selected-user-list__header">
                            <p>User</p>
                            <p>Role</p>
                            <p>Group Admin</p>
                        </div>
                        {selectedUsers.map((user, i) => {
                            return (
                                <SelectedUserItem
                                    index={i}
                                    key={user.id}
                                    user={user}
                                    selected={groupAdmins.includes(user.id)}
                                    toggleAdmin={(userId: string) => {
                                        if (groupAdmins.includes(userId)) {
                                            let updateAdmins = [...groupAdmins];
                                            updateAdmins = updateAdmins.filter((x: string) => x !== userId);
                                            setGroupAdmins(updateAdmins);
                                        } else {
                                            setGroupAdmins([...groupAdmins, userId]);
                                        }
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Button */}

                <div
                    style={{
                        marginTop: 40,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => createChannel()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 15,
                        }}
                        // disabled={props.user.email === disableEmailId}
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
                                width: 150,
                            }}
                        >
                            CREATE
                        </Text>
                    </TouchableOpacity>
                </div>
            </div>
        );
    };

    return newGroup ? (
        <div className="messaging-create-channel">
            <header>
                <div
                    style={{
                        paddingTop: 15,
                        paddingBottom: 15,
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        width: '100%',
                    }}
                >
                    <div
                        style={{ position: 'absolute', left: 0, cursor: 'pointer' }}
                        onClick={() => {
                            setNewGroup(false);
                        }}
                    >
                        <Ionicons name="arrow-back-outline" size={28} />
                    </div>
                    <div style={{ fontFamily: 'Inter', fontSize: 18 }}>New Group</div>
                </div>
            </header>
            {renderGroupInfo()}
        </div>
    ) : (
        <div className="messaging-create-channel">
            {/* TOP COMPONENT WILL BE FOR BROWSING USERS AND STARTING CHAT DIRECTLY */}
            {renderCreateChannelInput()}
            {renderDirectory()}
        </div>
    );
};

export default React.memo(CreateChannel);
