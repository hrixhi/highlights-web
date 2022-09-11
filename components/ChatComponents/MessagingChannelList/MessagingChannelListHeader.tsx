import React from 'react';
import { Avatar, useChatContext } from 'stream-chat-react';

// import { CreateChannelIcon } from '../../assets';
import { Ionicons } from '@expo/vector-icons';

import type { StreamChatGenerics } from '../types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
                {/* <input
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    placeholder={'Search'}
                    type="text"
                    className="messaging__channel-list-search__input"
                /> */}
                <form className="flex flex-1 items-center w-full max-w-lg lg:max-w-sm md:ml-0" action="#" method="GET">
                    <label htmlFor="search" className="sr-only">
                        Search
                    </label>
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-white" aria-hidden="true" />
                        </div>
                        <input
                            id="search"
                            name="search"
                            className="block w-full rounded-md border border-gray-200 dark:border-cues-border-dark dark:hover:border-white bg-white dark:bg-cues-dark-1 py-2 pl-10 pr-3 leading-5 placeholder-gray-500 dark:placeholder-gray-300 shadow-sm focus:border-cues-blue focus:placeholder-gray-400 focus:outline-none sm:text-sm dark:text-white"
                            placeholder="Search"
                            type="search"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
});

export default React.memo(MessagingChannelListHeader);
