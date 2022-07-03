import type { ChannelMemberResponse } from 'stream-chat';
import { Avatar } from 'stream-chat-react';
import './AvatarGroup.css';
import React from 'react';

const defaultImage = 'https://cues-files.s3.amazonaws.com/images/default.png';

export const AvatarGroup = ({ members }: { members: ChannelMemberResponse[] }) => {
    console.log('Members', members);

    if (members.length === 1) {
        return (
            <div className="avatar-group__avatars">
                <Avatar
                    image={members[0]?.user?.image || ''}
                    name={members[0]?.user?.name || members[0]?.user?.id}
                    size={40}
                />
            </div>
        );
    }

    if (members.length === 2) {
        return (
            <div className="avatar-group__avatars two">
                <span>
                    <Avatar
                        image={members[0]?.user?.image || ''}
                        name={members[0]?.user?.name || members[0]?.user?.id}
                        shape="square"
                        size={40}
                    />
                </span>
                <span>
                    <Avatar
                        image={members[1]?.user?.image || ''}
                        name={members[1]?.user?.name || members[1]?.user?.id}
                        shape="square"
                        size={40}
                    />
                </span>
            </div>
        );
    }

    if (members.length === 3) {
        return (
            <div className="avatar-group__avatars three">
                <span>
                    <Avatar
                        image={members[0]?.user?.image || ''}
                        name={members[0]?.user?.name || members[0]?.user?.id}
                        shape="square"
                        size={40}
                    />
                </span>
                <span>
                    <Avatar
                        image={members[1]?.user?.image || ''}
                        name={members[1]?.user?.name || members[1]?.user?.id}
                        shape="square"
                        size={20}
                    />
                    <Avatar
                        image={members[2]?.user?.image || ''}
                        name={members[2]?.user?.name || members[2]?.user?.id}
                        shape="square"
                        size={20}
                    />
                </span>
            </div>
        );
    }

    if (members.length >= 4) {
        return (
            <div className="avatar-group__avatars four">
                <span>
                    <Avatar
                        image={members[0]?.user?.image || ''}
                        name={members[0]?.user?.name || members[0]?.user?.id}
                        shape="square"
                        size={20}
                    />
                    <Avatar
                        image={members[1]?.user?.image || ''}
                        name={members[1]?.user?.name || members[1]?.user?.id}
                        shape="square"
                        size={20}
                    />
                </span>
                <span>
                    <Avatar
                        image={members[2]?.user?.image || ''}
                        name={members[2]?.user?.name || members[2]?.user?.id}
                        shape="square"
                        size={20}
                    />
                    <Avatar
                        image={members[4]?.user?.image || ''}
                        name={members[4]?.user?.name || members[4]?.user?.id}
                        shape="square"
                        size={20}
                    />
                </span>
            </div>
        );
    }

    // fallback for channels with no avatars (single-user channels)
    return (
        <div className="avatar-group__avatars">
            <Avatar image={defaultImage} shape="square" size={40} />
        </div>
    );
};

export default AvatarGroup;
