import React, { useState } from 'react';
import { Image } from 'react-native';
import { Attachment, Channel } from 'stream-chat-react';
import { ChannelInner } from '../ChannelInner/ChannelInner';
import CreateChannel from '../CreateChannel/CreateChannel';
import CustomMessage from '../CustomMessage/CustomMessage';
import { GiphyContextProvider } from '../Giphy';
import MessagingInput from '../MessagingInput/MessagingInput';
import MessagingThreadHeader from '../MessagingThread/MessagingThread';
import zoomLogo from '../../../assets/images/zoomLogo.png';
import moment from 'moment';

export type ChannelContainerProps = {
    toggleMobile: () => void;
    theme: string;
    onClose: () => void;
    isCreating: boolean;
    isEditing: boolean;
    subscriptions: any[];
    setIsAddingUsersGroup: (value: boolean) => void;
};

const CustomAttachment = (props: { attachments: any[] }) => {
    const { attachments } = props;
    const [attachment] = attachments || [];

    if (attachment?.type === 'meeting') {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 15,
                    backgroundColor: '#eaeaea',
                    marginBottom: 10,
                    borderRadius: 10,
                }}
            >
                <Image
                    source={zoomLogo}
                    style={{
                        height: 37,
                        width: 37,
                        borderRadius: 75,
                        alignSelf: 'center',
                    }}
                />

                <div
                    style={{
                        marginLeft: 20,
                        flexDirection: 'column',
                        maxWidth: 200,
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'Inter',
                            fontSize: 15,
                            marginBottom: 10,
                        }}
                    >
                        {attachment.title ? attachment.title : 'Untitled'}
                    </div>
                    <div
                        style={{
                            fontFamily: 'Overpass',
                            fontSize: 12,
                        }}
                    >
                        {moment(new Date(attachment.start)).format('MMM Do, h:mm a')} -{' '}
                        {moment(new Date(attachment.end)).format('MMM Do, h:mm a')}
                    </div>
                </div>

                <div
                    style={{
                        marginLeft: 20,
                        background: '#000',
                        color: '#fff',
                        borderRadius: 15,
                        fontSize: 10,
                        height: 32,
                        padding: 10,
                    }}
                >
                    JOIN MEETING
                </div>
            </div>
        );
    }

    return <Attachment {...props} />;
};

export const ChannelContainer = (props: ChannelContainerProps) => {
    const { toggleMobile, theme, onClose, isCreating, subscriptions } = props;

    const [isAddingUsersGroup, setIsAddingUsersGroup] = useState(false);

    // ADD EDIT HERE

    // if (isCreating || isAddingUsersGroup) {
    //     return (
    //         <CreateChannel
    //             toggleMobile={toggleMobile}
    //             onClose={onClose}
    //             subscriptions={subscriptions}
    //             isAddingUsersGroup={isAddingUsersGroup}
    //         />
    //     );
    // }

    return (
        <Channel
            Attachment={CustomAttachment}
            Input={MessagingInput}
            maxNumberOfFiles={10}
            Message={CustomMessage}
            multipleUploads={true}
            ThreadHeader={MessagingThreadHeader}
            TypingIndicator={() => null}
        >
            {isCreating || isAddingUsersGroup ? (
                <CreateChannel
                    toggleMobile={toggleMobile}
                    onClose={onClose}
                    subscriptions={subscriptions}
                    isAddingUsersGroup={isAddingUsersGroup}
                    setIsAddingUsersGroup={setIsAddingUsersGroup}
                />
            ) : (
                <GiphyContextProvider>
                    <ChannelInner
                        theme={theme}
                        toggleMobile={toggleMobile}
                        setIsAddingUsersGroup={setIsAddingUsersGroup}
                    />
                </GiphyContextProvider>
            )}
        </Channel>
    );
};
