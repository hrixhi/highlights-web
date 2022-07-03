import React, { useState } from 'react';
import { Channel } from 'stream-chat-react';
import { ChannelInner } from '../ChannelInner/ChannelInner';
import CreateChannel from '../CreateChannel/CreateChannel';
import CustomMessage from '../CustomMessage/CustomMessage';
import { GiphyContextProvider } from '../Giphy';
import MessagingInput from '../MessagingInput/MessagingInput';
import MessagingThreadHeader from '../MessagingThread/MessagingThread';

export type ChannelContainerProps = {
    toggleMobile: () => void;
    theme: string;
    onClose: () => void;
    isCreating: boolean;
    isEditing: boolean;
    subscriptions: any[];
};

export const ChannelContainer = (props: ChannelContainerProps) => {
    const { toggleMobile, theme, onClose, isCreating, isEditing, subscriptions } = props;

    // ADD EDIT HERE

    if (isCreating) {
        return <CreateChannel toggleMobile={toggleMobile} onClose={onClose} subscriptions={subscriptions} />;
    }

    return (
        <Channel
            Input={MessagingInput}
            maxNumberOfFiles={10}
            Message={CustomMessage}
            multipleUploads={true}
            ThreadHeader={MessagingThreadHeader}
            TypingIndicator={() => null}
        >
            <GiphyContextProvider>
                <ChannelInner theme={theme} toggleMobile={toggleMobile} />
            </GiphyContextProvider>
        </Channel>
    );
};
