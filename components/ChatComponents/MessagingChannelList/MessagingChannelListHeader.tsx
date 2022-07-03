import React from 'react';
import { Avatar, useChatContext } from 'stream-chat-react';

// import { CreateChannelIcon } from '../../assets';
import { Ionicons } from '@expo/vector-icons';

import type { StreamChatGenerics } from '../types';

type Props = {
    onCreateChannel?: () => void;
    theme: string;
    channelSearch: string;
    setChannelSearch: (value: React.SetStateAction<string>) => void;
};

const MessagingChannelListHeader = React.memo((props: Props) => {
    const { onCreateChannel, theme, channelSearch, setChannelSearch } = props;

    const { client } = useChatContext<StreamChatGenerics>();

    const { id, image, name } = client.user || {};

    return (
        <div className={`${theme} messaging__channel-list`}>
            <div className="messaging__channel-list__header">
                <Avatar image={image} name={name} size={40} />
                <div className={`${theme} messaging__channel-list__header__name`}>{name}</div>
                <button className={`${theme} messaging__channel-list__header__button`} onClick={onCreateChannel}>
                    <Ionicons name="create-outline" size={24} />
                </button>
            </div>
            <div className="messaging__channel-list-search">
                <input
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    placeholder={'Search'}
                    type="text"
                    className="messaging__channel-list-search__input"
                />
            </div>
        </div>
    );
});

export default React.memo(MessagingChannelListHeader);
