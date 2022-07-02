import type { ChannelMemberResponse } from 'stream-chat';
import { Avatar } from 'stream-chat-react';
import './AvatarGroup.css';
import React from 'react';

const defaultImage = 'https://cues-files.s3.amazonaws.com/images/default.png';

export const AvatarGroup = ({ members }: { members: ChannelMemberResponse[] }) => {
    if (members.length === 1) {
        return (
            <div className="avatar-group__avatars">
                <Avatar image={defaultImage} size={40} />
            </div>
        );
    }

    if (members.length === 2) {
        return (
            <div className="avatar-group__avatars two">
                <span>
                    <Avatar image={defaultImage} shape="square" size={40} />
                </span>
                <span>
                    <Avatar image={defaultImage} shape="square" size={40} />
                </span>
            </div>
        );
    }

    if (members.length === 3) {
        return (
            <div className="avatar-group__avatars three">
                <span>
                    <Avatar image={defaultImage} shape="square" size={40} />
                </span>
                <span>
                    <Avatar image={defaultImage} shape="square" size={20} />
                    <Avatar image={defaultImage} shape="square" size={20} />
                </span>
            </div>
        );
    }

    if (members.length >= 4) {
        return (
            <div className="avatar-group__avatars four">
                <span>
                    <Avatar image={defaultImage} shape="square" size={20} />
                    <Avatar image={defaultImage} shape="square" size={20} />
                </span>
                <span>
                    <Avatar image={defaultImage} shape="square" size={20} />
                    <Avatar image={defaultImage} shape="square" size={20} />
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
