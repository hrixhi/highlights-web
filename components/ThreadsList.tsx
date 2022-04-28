import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    Image,
    Platform,
    Linking,
    TextInput as DefaultTextInput,
    Switch,
} from 'react-native';
import Alert from '../components/Alert';
import { View, Text, TouchableOpacity } from './Themed';
import _, { uniq } from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import {
    createMessage,
    deleteThread,
    getThreadWithReplies,
    markThreadsAsRead,
    getThreadCategories,
    searchThreads,
    updateThread,
} from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Collapse } from 'react-collapse';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import moment from 'moment';
// import {
//     Menu,
//     MenuOptions,
//     MenuOption,
//     MenuTrigger,
// } from 'react-native-popup-menu';
import { htmlStringParser } from '../helpers/HTMLParser';
import { GiftedChat, Bubble, MessageText } from 'react-native-gifted-chat';
import FileUpload from './UploadFiles';
import { Select } from '@mobiscroll/react';
import ReactPlayer from 'react-player';
import NewPostModal from './NewPostModal';
import parser from 'html-react-parser';

import FroalaEditor from 'react-froala-wysiwyg';
import Froalaeditor from 'froala-editor';

import { renderMathjax } from '../helpers/FormulaHelpers';

import { DISCUSS_REPLY_TOOLBAR_BUTTONS } from '../constants/Froala';
import { handleFileUploadEditor, handleFile } from '../helpers/FileUpload';
import FormulaGuide from './FormulaGuide';
import { TextInput } from './CustomTextInput';
import { disableEmailId } from '../constants/zoomCredentials';

const ThreadsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    // State
    const [loading, setLoading] = useState(false);
    const unparsedThreads: any[] = JSON.parse(JSON.stringify(props.threads));
    const [threads] = useState<any[]>(unparsedThreads.reverse());
    const [threadWithReplies, setThreadWithReplies] = useState<any[]>([]);
    const [showThreadCues, setShowThreadCues] = useState(false);
    const [filterChoice, setFilterChoice] = useState('All');
    const [threadId, setThreadId] = useState('');
    const [selectedThread, setSelectedThread] = useState<any>({});
    const [avatar, setAvatar] = useState('');
    const [threadCategories, setThreadCategories] = useState<any[]>([]);
    const [customCategory, setCustomCategory] = useState('None');
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [userId, setUserId] = useState('');
    const [threadChat, setThreadChat] = useState<any[]>([]);
    const styles = styleObject();
    const categories: any[] = [];
    const categoryObject: any = {};
    let filteredThreads: any[] = [];
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isReplyEditorFocused, setIsReplyEditorFocused] = useState(false);
    const [html, setHtml] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    let RichText: any = useRef();
    const [anonymous, setAnonymous] = useState(false);
    const [equation, setEquation] = useState('');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);

    const [editDiscussionThreadId, setEditDiscussionThreadId] = useState('');
    const [editDiscussionThreadHtml, setEditDiscussionThreadHtml] = useState<any>({});
    const [editDiscussionThreadAttachments, setEditDiscussionThreadAttachments] = useState<any[]>([]);
    const [editDiscussionThreadAnonymous, setEditDiscussionThreadAnonymous] = useState(false);

    console.log('Search results', searchResults);

    // ALERTS
    const unableToLoadThreadAlert = PreferredLanguageText('unableToLoadThread');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    threads.map((item) => {
        if (item.category !== '' && !categoryObject[item.category]) {
            categoryObject[item.category] = 'category';
        }
    });
    Object.keys(categoryObject).map((key) => {
        categories.push(key);
    });
    if (filterChoice === 'All') {
        filteredThreads = threads;
    } else {
        filteredThreads = threads.filter((item) => {
            return item.category === filterChoice;
        });
    }
    let categoriesOptions = [
        {
            value: 'None',
            text: 'None',
        },
    ];
    categories.map((category: any) => {
        categoriesOptions.push({
            value: category,
            text: category,
        });
    });
    let categoryChoices = [
        {
            value: 'All',
            text: 'All',
        },
    ];
    categories.map((cat: any) => {
        categoryChoices.push({
            value: cat,
            text: cat,
        });
    });

    Froalaeditor.DefineIcon('insertFormula', {
        NAME: 'formula',
        PATH: 'M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z',
    });
    Froalaeditor.RegisterCommand('insertFormula', {
        title: 'Insert Formula',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function () {
            RichText.current.editor.selection.save();
            setShowEquationEditor(true);
        },
    });

    // HOOKS

    useEffect(() => {
        if (searchTerm === '') {
            setSearchResults([]);
            return;
        }
        (async () => {
            setIsSearching(true);
            const server = fetchAPI('');
            server
                .query({
                    query: searchThreads,
                    variables: {
                        term: searchTerm,
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.thread.searchThreads) {
                        // Map unique search results
                        const threadIdSet = new Set();
                        const uniqueResults: any[] = [];

                        res.data.thread.searchThreads.map((thread: any) => {
                            if (thread.parentId) {
                                if (threadIdSet.has(thread.parentId)) {
                                    // Skip
                                } else {
                                    uniqueResults.push(thread);
                                    threadIdSet.add(thread.parentId);
                                }
                            } else {
                                if (threadIdSet.has(thread._id)) {
                                    // Skip
                                } else {
                                    uniqueResults.push(thread);
                                    threadIdSet.add(thread._id);
                                }
                            }
                        });

                        setSearchResults(uniqueResults);
                        setIsSearching(false);
                    }
                })
                .catch((err) => {
                    console.log('Error', err);
                    setSearchResults([]);
                    setIsSearching(false);
                });
        })();
    }, [searchTerm, props.channelId]);

    /**
     * @description Load categories on init
     */
    useEffect(() => {
        loadCategories();
    }, [props.channelId]);

    /**
     * Set is Owner on init
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                setUserId(user._id);
                if (user.avatar) {
                    setAvatar(user.avatar);
                } else {
                    setAvatar('https://cues-files.s3.amazonaws.com/images/default.png');
                }
                if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                    setIsOwner(true);
                }
            }
        })();
    }, [props.channelCreatedBy]);

    /**
     * Load discussion from Search or Activity
     */
    useEffect(() => {
        (async () => {
            const tId = await AsyncStorage.getItem('openThread');
            if (tId && tId !== '' && threads.length !== 0) {
                // Clear the openChat

                await AsyncStorage.removeItem('openThread');

                loadCueDiscussions(tId);
            }
        })();
    }, [threads]);

    useEffect(() => {
        setHtml('');
        setAttachments([]);
        setIsReplyEditorFocused(false);
    }, [threadId]);

    /**
     * @description Fetches all the categories for that Channel
     */
    const loadCategories = useCallback(async () => {
        if (props.channelId === undefined || props.channelId === null || props.channelId === '') {
            return;
        }
        const server = fetchAPI('');
        server
            .query({
                query: getThreadCategories,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res) => {
                if (res.data.thread && res.data.thread.getChannelThreadCategories) {
                    setThreadCategories(res.data.thread.getChannelThreadCategories);
                }
            })
            .catch((err) => {});
    }, [props.channelId]);

    /**
     * @description Called from Modal for creating a new thread
     */
    const createNewThread = useCallback(
        async (title: string, message: any, category: any, isPrivate: boolean, anonymous: boolean) => {
            const server = fetchAPI('');
            server
                .mutate({
                    mutation: createMessage,
                    variables: {
                        message,
                        userId,
                        channelId: props.channelId,
                        isPrivate,
                        anonymous,
                        cueId: 'NULL',
                        parentId: 'INIT',
                        category: category === 'None' ? '' : category,
                        title,
                    },
                })
                .then((res) => {
                    if (res.data.thread.writeMessage) {
                        props.setShowNewDiscussionPost(false);
                        props.reload();
                    } else {
                        Alert(checkConnectionAlert);
                    }
                })
                .catch((err) => {
                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                });
        },
        [props.cueId, props.channelId, userId, isOwner]
    );

    const handleDeleteThread = useCallback(async (threadId: string, reply: boolean) => {
        Alert('Delete post?', '', [
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
                    const server = fetchAPI('');
                    server
                        .mutate({
                            mutation: deleteThread,
                            variables: {
                                threadId,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.thread.delete) {
                                if (reply) {
                                    loadCueDiscussions(threadId);
                                } else {
                                    //
                                    setSelectedThread('');
                                    props.reload();
                                }
                            } else {
                                Alert('Could not delete thread. Try again.');
                                return;
                            }
                        })
                        .catch((e) => {
                            Alert('Could not delete thread. Try again.');
                            return;
                        });
                },
            },
        ]);
    }, []);

    const handleUpdateThread = useCallback(async () => {
        if (!editDiscussionThreadId || isSendingReply) return;

        if (editDiscussionThreadHtml === '') {
            Alert('Thread content cannot be empty.');
            return;
        }

        const server = fetchAPI('');
        server
            .mutate({
                mutation: updateThread,
                variables: {
                    threadId: editDiscussionThreadId,
                    message: JSON.stringify({
                        html: editDiscussionThreadHtml,
                        attachments: editDiscussionThreadAttachments,
                    }),
                    anonymous: editDiscussionThreadAnonymous,
                },
            })
            .then((res) => {
                if (res.data && res.data.thread.updateThread) {
                    setEditDiscussionThreadId('');
                    setEditDiscussionThreadHtml('');
                    setEditDiscussionThreadAttachments([]);
                    setEditDiscussionThreadAnonymous(false);
                    loadCueDiscussions(threadId);
                } else {
                    Alert('Could not update thread. Try again.');
                    return;
                }
            })
            .catch((e) => {
                Alert('Could not update thread. Try again.');
                return;
            });
    }, [
        editDiscussionThreadId,
        editDiscussionThreadHtml,
        editDiscussionThreadAttachments,
        editDiscussionThreadAnonymous,
        isSendingReply,
    ]);

    const handleReply = useCallback(async () => {
        if (html === '') {
            Alert('Reply cannot be empty');
            return;
        }

        setIsSendingReply(true);

        const server = fetchAPI('');
        server
            .mutate({
                mutation: createMessage,
                variables: {
                    message: JSON.stringify({
                        html,
                        attachments,
                    }),
                    userId,
                    channelId: props.channelId,
                    isPrivate: false,
                    anonymous,
                    cueId: 'NULL',
                    parentId: threadId,
                    category: '',
                },
            })
            .then((res) => {
                if (res.data.thread.writeMessage) {
                    setIsSendingReply(false);
                    setIsReplyEditorFocused(false);
                    setHtml('');
                    setAttachments([]);

                    // Refresh chat replies
                    loadCueDiscussions(threadId);
                } else {
                    setIsSendingReply(false);
                    Alert(checkConnectionAlert);
                }
            })
            .catch((err) => {
                setIsSendingReply(false);
                Alert(somethingWentWrongAlert, checkConnectionAlert);
            });
    }, [props.channelId, props.cueId, threadId, html, attachments, userId, anonymous]);

    /**
     * @description Load the entire the Thread using the thread ID
     */
    const loadCueDiscussions = useCallback(async (threadId: string) => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            props.setShowNewDiscussionPost(false);
            const user = JSON.parse(u);
            setThreadId(threadId);
            setLoading(true);
            setShowThreadCues(true);
            const server = fetchAPI('');
            server
                .query({
                    query: getThreadWithReplies,
                    variables: {
                        threadId: threadId,
                    },
                })
                .then((res) => {
                    setThreadWithReplies(res.data.thread.getThreadWithReplies);
                    const tempChat: any[] = [];
                    res.data.thread.getThreadWithReplies.map((msg: any) => {
                        if (msg._id !== threadId) {
                            tempChat.push(msg);
                        } else {
                            setSelectedThread(msg);
                        }
                    });
                    tempChat.reverse();
                    setThreadChat(tempChat);
                    setLoading(false);
                })
                .catch((err) => {
                    Alert(unableToLoadThreadAlert, checkConnectionAlert);
                    setLoading(false);
                });
            server
                .mutate({
                    mutation: markThreadsAsRead,
                    variables: {
                        userId: user._id,
                        threadId: threadId,
                    },
                })
                .then((res) => {
                    if (props.refreshUnreadDiscussionCount) {
                        props.refreshUnreadDiscussionCount();
                    }
                })
                .catch((e) => console.log(e));
        }
    }, []);

    // const deletePost = useCallback((threadId: string) => {
    //     if (!isOwner) {
    //         return;
    //     }
    //     const server = fetchAPI('')
    //     server.mutate({
    //         mutation: deleteThread,
    //         variables: {
    //             threadId
    //         }
    //     }).then((res) => {
    //         if (res.data && res.data.thread.delete) {
    //             props.reload()
    //         } else {
    //             Alert(somethingWentWrongAlert)
    //         }
    //     }).catch(e => Alert(somethingWentWrongAlert))
    // }, [isOwner])

    /**
     * @description Renders Custom bubble for Gifted Chat
     */
    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#007AFF',
                    },
                }}
            />
        );
    };

    /**
     * @description render custom font size
     */
    const renderMessageText = (props: any) => {
        return <MessageText {...props} customTextStyle={{ fontSize: 14, lineHeight: 14 }} />;
    };

    /**
     * @description Customize how Audio message appears
     */
    const renderMessageAudio = (props: any) => {
        if (props.currentMessage.audio && props.currentMessage.audio !== '') {
            return (
                <View>
                    <ReactPlayer
                        url={props.currentMessage.audio}
                        controls={true}
                        onContextMenu={(e: any) => e.preventDefault()}
                        config={{
                            file: { attributes: { controlsList: 'nodownload' } },
                        }}
                        width={250}
                        height={60}
                    />
                </View>
            );
        }

        return null;
    };

    /**
     * @description Customize how Video Message appears
     */
    const renderMessageVideo = (props: any) => {
        if (props.currentMessage.video && props.currentMessage.video !== '') {
            return (
                <View>
                    <ReactPlayer
                        url={props.currentMessage.video}
                        controls={true}
                        onContextMenu={(e: any) => e.preventDefault()}
                        config={{
                            file: { attributes: { controlsList: 'nodownload' } },
                        }}
                        width={250}
                        height={200}
                    />
                </View>
            );
        }

        return null;
    };

    // FUNCTIONS

    /**
     * @description Used to insert equation into Editor HTML
     */
    const insertEquation = useCallback(() => {
        if (equation === '') {
            Alert('Equation cannot be empty.');
            return;
        }

        renderMathjax(equation).then((res: any) => {
            const random = Math.random();

            RichText.current.editor.selection.restore();

            RichText.current.editor.html.insert(
                '<img class="rendered-math-jax" id="' +
                    random +
                    '" data-eq="' +
                    encodeURIComponent(equation) +
                    '" src="' +
                    res.imgSrc +
                    '"></img>'
            );
            RichText.current.editor.events.trigger('contentChanged');

            setShowEquationEditor(false);
            setEquation('');
        });
    }, [equation, RichText, RichText.current]);

    /**
     * Human readable elapsed or remaining time (example: 3 minutes ago)
     * @param  {Date|Number|String} date A Date object, timestamp or string parsable with Date.parse()
     * @param  {Date|Number|String} [nowDate] A Date object, timestamp or string parsable with Date.parse()
     * @param  {Intl.RelativeTimeFormat} [trf] A Intl formater
     * @return {string} Human readable elapsed or remaining time
     * @author github.com/victornpb
     * @see https://stackoverflow.com/a/67338038/938822
     */
    function fromNow(
        date: Date,
        replace: boolean,
        nowDate = Date.now(),
        rft = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    ) {
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
                if (replace) {
                    return outputTime
                        .replace(' ago', '')
                        .replace(' minutes', 'min')
                        .replace(' months', 'mth')
                        .replace(' days', 'd')
                        .replace(' weeks', 'wks')
                        .replace(' hours', 'h')
                        .replace(' seconds', 's');
                } else {
                    return outputTime;
                }
            }
        }
    }

    /**
     * @description Helper to display Time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

    const renderDiscussionEditor = () => {
        console.log('Edit discussion thread html', editDiscussionThreadHtml);

        return (
            <View
                style={{
                    flex: 1,
                    zIndex: 5000000,
                    borderWidth: 1,
                    borderColor: '#cccccc',
                    borderRadius: 2,
                }}
            >
                <FroalaEditor
                    ref={RichText}
                    model={editDiscussionThreadId !== '' ? editDiscussionThreadHtml : html}
                    onModelChange={(model: any) => {
                        if (editDiscussionThreadId !== '') {
                            setEditDiscussionThreadHtml(model);
                        } else {
                            setHtml(model);
                        }
                    }}
                    config={{
                        autofocus: true,
                        key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                        attribution: false,
                        placeholderText: 'Enter Content',
                        charCounterCount: false,
                        zIndex: 2003,
                        // immediateReactModelUpdate: true,
                        heightMin: 100,
                        // FILE UPLOAD
                        // fileUploadURL: 'https://api.learnwithcues.com/upload',
                        fileMaxSize: 25 * 1024 * 1024,
                        fileAllowedTypes: ['*'],
                        fileUploadParams: { userId },
                        // IMAGE UPLOAD
                        imageUploadURL: 'https://api.learnwithcues.com/api/imageUploadEditor',
                        imageUploadParam: 'file',
                        imageUploadParams: { userId },
                        imageUploadMethod: 'POST',
                        imageMaxSize: 5 * 1024 * 1024,
                        imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                        // VIDEO UPLOAD
                        videoMaxSize: 50 * 1024 * 1024,
                        videoAllowedTypes: ['webm', 'ogg', 'mp3', 'mp4', 'mov'],
                        paragraphFormatSelection: true,
                        // Default Font Size
                        spellcheck: true,
                        tabSpaces: 4,

                        // TOOLBAR
                        toolbarButtons: DISCUSS_REPLY_TOOLBAR_BUTTONS,
                        toolbarSticky: true,
                        htmlAllowedEmptyTags: [
                            'textarea',
                            'a',
                            'iframe',
                            'object',
                            'video',
                            'style',
                            'script',
                            '.fa',
                            'span',
                            'p',
                            'path',
                            'line',
                        ],
                        htmlAllowedTags: ['.*'],
                        htmlAllowedAttrs: ['.*'],
                        htmlRemoveTags: ['script'],

                        events: {
                            'file.beforeUpload': function (files: any) {
                                // Return false if you want to stop the file upload.
                                fileUploadEditor(files);

                                return false;
                            },
                            'video.beforeUpload': function (videos: any) {
                                videoUploadEditor(videos);

                                return false;
                            },
                            'image.beforeUpload': function (images: any) {
                                if (images[0].size > 5 * 1024 * 1024) {
                                    alert('Image size must be less than 5mb.');
                                    return false;
                                }

                                return true;
                            },
                        },
                    }}
                />
                {/* Render attachments */}
                {(editDiscussionThreadId !== '' && editDiscussionThreadAttachments.length > 0) ||
                (!editDiscussionThreadId && attachments.length > 0) ? (
                    <View
                        style={{
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: 500,
                            marginVertical: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'Overpass',
                                marginBottom: 20,
                            }}
                        >
                            Attachments
                        </Text>
                        {(editDiscussionThreadId !== '' ? editDiscussionThreadAttachments : attachments).map(
                            (file: any, ind: number) => {
                                return (
                                    <View
                                        key={ind.toString()}
                                        style={{
                                            width: '100%',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: '#cccccc',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderRadius: 1,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Ionicons name="attach-outline" size={22} color="#000" />
                                        <Text
                                            style={{
                                                paddingLeft: 10,
                                                fontSize: 14,
                                                fontFamily: 'Overpass',
                                            }}
                                        >
                                            {file.name}
                                        </Text>
                                        <TouchableOpacity
                                            style={{
                                                marginLeft: 'auto',
                                            }}
                                            onPress={() => {
                                                const updatedAttachments: any[] = [...attachments];
                                                updatedAttachments.splice(ind, 1);
                                                setAttachments(updatedAttachments);
                                            }}
                                        >
                                            <Text>
                                                <Ionicons
                                                    name="close-outline"
                                                    style={{
                                                        marginLeft: 'auto',
                                                    }}
                                                    size={19}
                                                />
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            }
                        )}
                    </View>
                ) : null}
            </View>
        );
    };

    /**
     * @description Renders the Filter Dropdown and the New Post button
     */
    const renderThreadHeader = () => {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    paddingBottom: 30,
                    width: '100%',
                }}
            >
                {props.cueId === null && categoryChoices.length > 1 ? (
                    <View
                        style={{
                            backgroundColor: '#fff',
                        }}
                    >
                        <label style={{ width: 150, backgroundColor: '#fff' }}>
                            <Select
                                touchUi={true}
                                themeVariant="light"
                                value={filterChoice}
                                onChange={(val: any) => {
                                    setFilterChoice(val.value);
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble',
                                    },
                                    medium: {
                                        touchUi: false,
                                    },
                                }}
                                data={categoryChoices}
                            />
                        </label>
                    </View>
                ) : null}
            </View>
        );
    };

    const fileUploadEditor = useCallback(
        async (files: any) => {
            console.log('File', files.item(0));
            const res = await handleFileUploadEditor(false, files.item(0), userId);

            if (!res || res.url === '' || res.type === '') {
                return false;
            }
            setUploadResult(res.url, res.type, res.name);
        },
        [userId]
    );

    const videoUploadEditor = useCallback(
        async (files: any) => {
            const res = await handleFileUploadEditor(true, files.item(0), userId);

            if (!res || res.url === '' || res.type === '') {
                return false;
            }
            setUploadResult(res.url, res.type, res.name);
        },
        [userId]
    );

    const setUploadResult = useCallback(
        (uploadURL: string, uploadType: string, updloadName: string) => {
            if (editDiscussionThreadId !== '') {
                const updatedAttachments: any[] = [...editDiscussionThreadAttachments];

                console.log('initial attachments', updatedAttachments);

                updatedAttachments.push({
                    url: uploadURL,
                    type: uploadType,
                    name: updloadName,
                });

                setEditDiscussionThreadAttachments(updatedAttachments);
            } else {
                const updatedAttachments: any[] = [...attachments];

                console.log('initial attachments', updatedAttachments);

                updatedAttachments.push({
                    url: uploadURL,
                    type: uploadType,
                    name: updloadName,
                });

                setAttachments(updatedAttachments);
            }
        },
        [attachments, editDiscussionThreadId, editDiscussionThreadAttachments]
    );

    /**
     * @description Renders selected thread with GiftedChat component
     */
    const renderSelectedThread = () => {
        let selectedThreadTitle = '';
        let selectedThreadContent = '';
        let selectedThreadAttachments = [];

        console.log('Selected thread', selectedThread);

        if (
            selectedThread.message &&
            selectedThread.message[0] === '{' &&
            selectedThread.message[selectedThread.message.length - 1] === '}' &&
            selectedThread.title
        ) {
            // New version
            const obj = JSON.parse(selectedThread.message);
            selectedThreadContent = obj.html;
            selectedThreadAttachments = obj.attachments;
            selectedThreadTitle = selectedThread.title;
        } else if (
            selectedThread.message &&
            selectedThread.message[0] === '{' &&
            selectedThread.message[selectedThread.message.length - 1] === '}' &&
            !selectedThread.title
        ) {
            // New version
            const obj = JSON.parse(selectedThread.message);
            selectedThreadTitle = obj.title;
        } else {
            const { title: t, subtitle: s } = htmlStringParser(selectedThread.message);

            selectedThreadTitle = t;
            selectedThreadContent = s;
        }

        return (
            <ScrollView
                contentContainerStyle={{
                    width: '100%',
                    // maxWidth: '80%',
                    borderRadius: 1,
                    // paddingVertical: 10,
                    paddingHorizontal: 15,
                    // minHeight: 400
                }}
            >
                {/* Render the selected thread main */}
                <View
                    style={{
                        paddingTop: 10,
                        paddingBottom: 20,
                        marginBottom: 20,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f2f2f2',
                    }}
                >
                    <View
                        style={{
                            width: '100%',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                paddingTop: 10,
                                paddingBottom: 20,
                            }}
                        >
                            {selectedThreadTitle}
                        </Text>
                    </View>
                    {/*  */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 5,
                            marginLeft: 5,
                            marginBottom: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Image
                                style={{
                                    height: 50,
                                    width: 50,
                                    marginBottom: 5,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri:
                                        selectedThread.avatar &&
                                        (!selectedThread.anonymous || selectedThread.userId === userId || isOwner)
                                            ? selectedThread.avatar
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
                            />
                            <View
                                style={{
                                    marginLeft: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontFamily: 'Inter',
                                            color: selectedThread.userId === userId ? '#007AFF' : '#000',
                                        }}
                                    >
                                        {!selectedThread.anonymous || selectedThread.userId === userId || isOwner
                                            ? selectedThread.fullName
                                            : 'Anonymous'}
                                    </Text>
                                    {/*  */}
                                    {selectedThread.edited ? (
                                        <View
                                            style={{
                                                backgroundColor: '#e6f0ff',
                                                padding: 4,
                                                marginLeft: 15,
                                                borderRadius: 3,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#007AFF',
                                                    fontSize: 11,
                                                }}
                                            >
                                                Edited
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        marginTop: 7,
                                        color: '#1f1f1f',
                                    }}
                                >
                                    {fromNow(new Date(selectedThread.time), false)}{' '}
                                    {selectedThread.category ? ' in ' + selectedThread.category : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Render Views and edit button */}
                        <View
                            style={{
                                marginLeft: 'auto',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                }}
                            >
                                {selectedThread.views} {selectedThread.views === 1 ? 'view' : 'views'}
                            </Text>
                            {userId === selectedThread.userId && !editDiscussionThreadId && !isReplyEditorFocused ? (
                                <TouchableOpacity
                                    style={{
                                        marginLeft: 20,
                                    }}
                                    onPress={() => {
                                        setEditDiscussionThreadId(selectedThread._id);
                                        const parse = JSON.parse(selectedThread.message);
                                        setEditDiscussionThreadHtml(parse.html ? parse.html : '');
                                        setEditDiscussionThreadAttachments(parse.attachments ? parse.attachments : []);
                                        setEditDiscussionThreadAnonymous(selectedThread.anonymous);
                                    }}
                                    disabled={props.user.email === disableEmailId}
                                >
                                    <Text>
                                        <Ionicons name={'pencil-outline'} size={16} color="#000" />
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            {isOwner ? (
                                <TouchableOpacity
                                    style={{
                                        marginLeft: 20,
                                    }}
                                    onPress={() => {
                                        handleDeleteThread(selectedThread._id, false);
                                    }}
                                    disabled={props.user.email === disableEmailId}
                                >
                                    <Text>
                                        <Ionicons name={'trash-outline'} size={18} color="#000" />
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                    {/* Content */}

                    {editDiscussionThreadId !== '' && editDiscussionThreadId === selectedThread._id ? (
                        <View
                            style={{
                                flexDirection: 'column',
                            }}
                        >
                            {renderDiscussionEditor()}

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 20,
                                }}
                            >
                                {isOwner ? null : (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                marginRight: 7,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={anonymous}
                                                onChange={(e: any) => {
                                                    setAnonymous(!anonymous);
                                                }}
                                            />
                                        </View>
                                        <Text style={{ fontSize: 14, fontFamily: 'Inter' }}>Anonymous</Text>
                                    </View>
                                )}

                                {/* Buttons */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: 'white',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            marginRight: 20,
                                        }}
                                        onPress={() => {
                                            Alert('Discard reply?', '', [
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
                                                        setEditDiscussionThreadAnonymous(false);
                                                        setEditDiscussionThreadId('');
                                                        setEditDiscussionThreadHtml('');
                                                        setEditDiscussionThreadAttachments([]);
                                                    },
                                                },
                                            ]);
                                        }}
                                        disabled={isSendingReply}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                color: '#000',
                                                fontSize: 14,
                                                backgroundColor: 'white',
                                                fontFamily: 'inter',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            // marginTop: 15,
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                        }}
                                        onPress={() => {
                                            handleUpdateThread();
                                        }}
                                        disabled={isSendingReply}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                color: '#000',
                                                fontSize: 14,
                                                fontFamily: 'inter',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {isSendingReply ? 'Updating...' : 'Update'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <div
                            className="mce-content-body htmlParser"
                            style={{
                                width: '100%',
                                color: 'black',
                                marginTop: Dimensions.get('window').width < 768 ? 0 : 25,
                            }}
                        >
                            {parser(selectedThreadContent)}
                        </div>
                    )}
                    {/* Attachments */}
                    {/* Render attachments */}
                    {editDiscussionThreadId !== '' ? null : selectedThreadAttachments.length > 0 ? (
                        <View
                            style={{
                                flexDirection: 'column',
                                width: '100%',
                                maxWidth: 500,
                                marginVertical: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'Overpass',
                                    marginBottom: 20,
                                }}
                            >
                                Attachments
                            </Text>
                            {selectedThreadAttachments.map((file: any, ind: number) => {
                                return (
                                    <View
                                        key={ind.toString()}
                                        style={{
                                            width: '100%',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderWidth: 1,
                                            borderColor: '#cccccc',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderRadius: 2,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <Ionicons name="attach-outline" size={22} color="#000" />
                                        <Text
                                            style={{
                                                paddingLeft: 10,
                                                fontSize: 14,
                                                fontFamily: 'Overpass',
                                            }}
                                        >
                                            {file.name}
                                        </Text>
                                        <TouchableOpacity
                                            style={{
                                                marginLeft: 'auto',
                                            }}
                                            onPress={() => {
                                                if (
                                                    Platform.OS === 'web' ||
                                                    Platform.OS === 'macos' ||
                                                    Platform.OS === 'windows'
                                                ) {
                                                    window.open(file.url, '_blank');
                                                } else {
                                                    Linking.openURL(file.url);
                                                }
                                            }}
                                        >
                                            <Text>
                                                <Ionicons
                                                    name="download-outline"
                                                    style={{
                                                        marginLeft: 'auto',
                                                    }}
                                                    size={19}
                                                />
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}
                </View>

                {editDiscussionThreadId !== '' ? null : isReplyEditorFocused ? (
                    <View
                        style={{
                            flexDirection: 'row',
                        }}
                    >
                        <View>
                            <Image
                                style={{
                                    height: 35,
                                    width: 35,
                                    marginTop: 5,
                                    marginLeft: 5,
                                    marginBottom: 5,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                    marginRight: 10,
                                }}
                                source={{
                                    uri: avatar ? avatar : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
                            />
                        </View>
                        {renderDiscussionEditor()}
                    </View>
                ) : (
                    <DefaultTextInput
                        placeholder="Leave a reply"
                        onFocus={() => setIsReplyEditorFocused(true)}
                        value=""
                        style={{
                            padding: 8,
                            borderRadius: 2,
                            borderWidth: 1,
                            borderColor: '#cccccc',
                        }}
                    />
                )}
                {/* Comments */}
                {isReplyEditorFocused ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 20,
                        }}
                    >
                        {isOwner ? null : (
                            <View
                                style={{
                                    marginLeft: 50,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: '#fff',
                                        marginRight: 7,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={anonymous}
                                        onChange={(e: any) => {
                                            setAnonymous(!anonymous);
                                        }}
                                    />
                                </View>
                                <Text style={{ fontSize: 14, fontFamily: 'Inter' }}>Anonymous</Text>
                            </View>
                        )}
                        {/* Buttons */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginLeft: 'auto',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    marginRight: 20,
                                }}
                                onPress={() => {
                                    Alert('Discard reply?', '', [
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
                                                setIsReplyEditorFocused(false);
                                                setHtml('');
                                                setAttachments([]);
                                            },
                                        },
                                    ]);
                                }}
                                disabled={isSendingReply}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#000',
                                        fontSize: 14,
                                        backgroundColor: 'white',
                                        fontFamily: 'inter',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    // marginTop: 15,
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                }}
                                onPress={() => {
                                    handleReply();
                                }}
                                disabled={isSendingReply || props.user.email === disableEmailId}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#000',
                                        fontSize: 14,
                                        fontFamily: 'inter',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {isSendingReply ? 'Sending...' : 'Send'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                {/* Render all replies here */}

                <View
                    style={{
                        flex: 1,
                    }}
                >
                    {threadChat.map((thread: any, ind: number) => {
                        console.log('Thread chat', thread);

                        let replyThreadContent = '';
                        let replyThreadAttachments = [];

                        if (
                            thread.message &&
                            thread.message[0] === '{' &&
                            thread.message[thread.message.length - 1] === '}'
                        ) {
                            // New version
                            const obj = JSON.parse(thread.message);
                            replyThreadContent = obj.html || '';
                            replyThreadAttachments = obj.attachments;
                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(thread.message);
                            replyThreadContent = s;
                        }

                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'column',
                                    width: '100%',
                                    paddingVertical: 20,
                                    borderBottomColor: '#f2f2f2',
                                    borderBottomWidth: 1,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginBottom: 20,
                                    }}
                                >
                                    <Image
                                        style={{
                                            height: 35,
                                            width: 35,
                                            marginTop: 5,
                                            marginLeft: 5,
                                            marginBottom: 5,
                                            borderRadius: 75,
                                            alignSelf: 'center',
                                        }}
                                        source={{
                                            uri:
                                                thread.avatar &&
                                                (!thread.anonymous || thread.userId === userId || isOwner)
                                                    ? thread.avatar
                                                    : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                        }}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontFamily: 'Inter',
                                            paddingLeft: 15,
                                            color: thread.userId === userId ? '#007AFF' : '#000',
                                        }}
                                    >
                                        {!thread.anonymous || thread.userId === userId || isOwner
                                            ? thread.fullName
                                            : 'Anonymous'}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            paddingLeft: 10,
                                            color: '#1f1f1f',
                                        }}
                                    >
                                        {fromNow(thread.time, true)}
                                    </Text>
                                    {thread.edited ? (
                                        <View
                                            style={{
                                                backgroundColor: '#e6f0ff',
                                                padding: 4,
                                                marginLeft: 15,
                                                borderRadius: 3,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#007AFF',
                                                    fontSize: 11,
                                                }}
                                            >
                                                Edited
                                            </Text>
                                        </View>
                                    ) : null}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginLeft: 'auto',
                                        }}
                                    >
                                        {userId === thread.userId &&
                                        !editDiscussionThreadId &&
                                        !isReplyEditorFocused ? (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditDiscussionThreadId(thread._id);
                                                    const parse = JSON.parse(thread.message);
                                                    setEditDiscussionThreadHtml(parse.html ? parse.html : '');
                                                    setEditDiscussionThreadAttachments(
                                                        parse.attachments ? parse.attachments : []
                                                    );
                                                    setEditDiscussionThreadAnonymous(thread.anonymous);
                                                }}
                                                disabled={props.user.email === disableEmailId}
                                            >
                                                <Text>
                                                    <Ionicons name={'pencil-outline'} size={14} color="#000" />
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                        {isOwner ? (
                                            <TouchableOpacity
                                                style={{
                                                    marginLeft: 20,
                                                }}
                                                onPress={() => {
                                                    handleDeleteThread(thread._id, true);
                                                }}
                                                disabled={props.user.email === disableEmailId}
                                            >
                                                <Text>
                                                    <Ionicons name={'trash-outline'} size={16} color="#000" />
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </View>
                                {editDiscussionThreadId !== '' && editDiscussionThreadId === thread._id ? (
                                    <View
                                        style={{
                                            flexDirection: 'column',
                                        }}
                                    >
                                        {renderDiscussionEditor()}

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginTop: 20,
                                            }}
                                        >
                                            {isOwner ? null : (
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            marginRight: 7,
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={anonymous}
                                                            onChange={(e: any) => {
                                                                setAnonymous(!anonymous);
                                                            }}
                                                        />
                                                    </View>
                                                    <Text style={{ fontSize: 14, fontFamily: 'Inter' }}>Anonymous</Text>
                                                </View>
                                            )}

                                            {/* Buttons */}
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: 'white',
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                        marginRight: 20,
                                                    }}
                                                    onPress={() => {
                                                        Alert('Discard reply?', '', [
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
                                                                    setEditDiscussionThreadAnonymous(false);
                                                                    setEditDiscussionThreadId('');
                                                                    setEditDiscussionThreadHtml('');
                                                                    setEditDiscussionThreadAttachments([]);
                                                                },
                                                            },
                                                        ]);
                                                    }}
                                                    disabled={isSendingReply}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            color: '#000',
                                                            borderRadius: 15,
                                                            fontSize: 14,
                                                            backgroundColor: 'white',
                                                            fontFamily: 'inter',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        Cancel
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: 'white',
                                                        overflow: 'hidden',
                                                        // marginTop: 15,
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                    }}
                                                    onPress={() => {
                                                        handleUpdateThread();
                                                    }}
                                                    disabled={isSendingReply || props.user.email === disableEmailId}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            color: '#000',
                                                            fontSize: 14,
                                                            fontFamily: 'inter',
                                                            borderRadius: 15,
                                                            textTransform: 'capitalize',
                                                        }}
                                                    >
                                                        {isSendingReply ? 'Updating...' : 'Update'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <div
                                        className="mce-content-body htmlParser"
                                        style={{ width: '100%', color: 'black', marginTop: 0, paddingLeft: 55 }}
                                    >
                                        {parser(replyThreadContent)}
                                    </div>
                                )}
                                {/* Render attachments */}
                                {editDiscussionThreadId !== '' ? null : replyThreadAttachments.length > 0 ? (
                                    <View
                                        style={{
                                            flexDirection: 'column',
                                            width: '100%',
                                            maxWidth: 500,
                                            marginVertical: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontFamily: 'Overpass',
                                                marginBottom: 20,
                                            }}
                                        >
                                            Attachments
                                        </Text>
                                        {replyThreadAttachments.map((file: any, ind: number) => {
                                            return (
                                                <View
                                                    key={ind.toString()}
                                                    style={{
                                                        width: '100%',
                                                        paddingVertical: 12,
                                                        paddingHorizontal: 16,
                                                        borderWidth: 1,
                                                        borderColor: '#cccccc',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        borderRadius: 2,
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    <Ionicons name="attach-outline" size={22} color="#000" />
                                                    <Text
                                                        style={{
                                                            paddingLeft: 10,
                                                            fontSize: 14,
                                                            fontFamily: 'Overpass',
                                                        }}
                                                    >
                                                        {file.name}
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={{
                                                            marginLeft: 'auto',
                                                        }}
                                                        onPress={() => {
                                                            if (
                                                                Platform.OS === 'web' ||
                                                                Platform.OS === 'macos' ||
                                                                Platform.OS === 'windows'
                                                            ) {
                                                                window.open(file.url, '_blank');
                                                            } else {
                                                                Linking.openURL(file.url);
                                                            }
                                                        }}
                                                    >
                                                        <Text>
                                                            <Ionicons
                                                                name="download-outline"
                                                                style={{
                                                                    marginLeft: 'auto',
                                                                }}
                                                                size={19}
                                                            />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    /**
     * @description Renders List of threads
     */
    const renderAllThreadsMobile = () => {
        return (
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    // maxWidth: '80%',
                    borderRadius: 1,
                }}
            >
                {threads.length === 0 ? (
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 16,
                                paddingVertical: 50,
                                fontFamily: 'inter',
                                flex: 1,
                                backgroundColor: '#fff',
                            }}
                        >
                            {!props.cueId ? PreferredLanguageText('noPosts') : PreferredLanguageText('noComments')}
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        // style={{ height: '100%' }}
                        contentContainerStyle={{
                            // borderWidth: 1,
                            // borderRightWidth: 0,
                            // borderLeftWidth: 0,
                            // borderRightWidth: 1,
                            paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 10,
                            borderColor: '#f2f2f2',
                            borderRadius: 1,
                            width: '100%',
                            // maxHeight: Dimensions.get('window').width < 1024 ? 400 : 500,
                        }}
                    >
                        {filteredThreads.map((thread: any, ind: number) => {
                            let title = '';

                            if (thread.title) {
                                title = thread.title;
                            } else if (
                                thread.message[0] === '{' &&
                                thread.message[thread.message.length - 1] === '}' &&
                                !thread.title
                            ) {
                                const obj = JSON.parse(thread.message);
                                title = obj.title;
                            } else {
                                const { title: t, subtitle: s } = htmlStringParser(thread.message);
                                title = t;
                            }

                            return (
                                <TouchableOpacity
                                    onPress={() => loadCueDiscussions(thread._id)}
                                    style={{
                                        // backgroundColor: '#fff',
                                        flexDirection: 'row',
                                        borderColor: '#f2f2f2',
                                        paddingVertical: 5,
                                        // borderRightWidth: 1,
                                        borderBottomWidth: ind === filteredThreads.length - 1 ? 0 : 1,
                                        // minWidth: 600, // flex: 1,
                                        width: '100%',
                                    }}
                                    key={ind.toString()}
                                >
                                    <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                        <Image
                                            style={{
                                                height: 35,
                                                width: 35,
                                                marginTop: 5,
                                                marginLeft: 5,
                                                marginBottom: 5,
                                                borderRadius: 75,
                                                // marginTop: 20,
                                                alignSelf: 'center',
                                            }}
                                            source={{
                                                uri:
                                                    thread.avatar && (!thread.anonymous || thread.userId === userId)
                                                        ? thread.avatar
                                                        : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                            }}
                                        />
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10, marginTop: 5 }}>
                                        <Text
                                            style={{ fontSize: 15, padding: 5, fontFamily: 'inter' }}
                                            ellipsizeMode="tail"
                                            numberOfLines={2}
                                        >
                                            {title}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                margin: 5,
                                                lineHeight: 18,
                                                color: thread.userId === userId ? '#007AFF' : '#000',
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {thread.anonymous && thread.userId !== userId && !isOwner
                                                ? 'Anonymous'
                                                : thread.fullName}
                                        </Text>
                                    </View>
                                    <View style={{ justifyContent: 'center', flexDirection: 'column' }}>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                backgroundColor: '#fff',
                                                paddingLeft: 10,
                                                alignItems: 'center',
                                            }}
                                        >
                                            {thread.isPrivate ? (
                                                <Text
                                                    style={{
                                                        fontSize: 13,
                                                        padding: 5,
                                                        color: '#000',
                                                        textAlign: 'center',
                                                    }}
                                                    ellipsizeMode="tail"
                                                >
                                                    <Ionicons name="eye-off-outline" size={15} />
                                                </Text>
                                            ) : null}
                                            {thread.unreadThreads > 0 ? (
                                                <View
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 8,
                                                        marginHorizontal: 5,
                                                        backgroundColor: '#007AFF',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginBottom: 3,
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontSize: 10 }}>
                                                        {thread.unreadThreads}
                                                    </Text>
                                                </View>
                                            ) : null}
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    padding: 5,
                                                    lineHeight: 13,
                                                    color: '#000000',
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {emailTimeDisplay(thread.time)}
                                            </Text>
                                            <Text
                                                style={{ fontSize: 13, padding: 5, lineHeight: 13 }}
                                                ellipsizeMode="tail"
                                            >
                                                <Ionicons name="chevron-forward-outline" size={18} color="#000" />
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        );
    };

    const renderEmptyThreads = () => {
        return (
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        width: '100%',
                        color: '#1F1F1F',
                        fontSize: 16,
                        paddingVertical: 100,
                        fontFamily: 'inter',
                        flex: 1,
                        backgroundColor: '#fff',
                    }}
                >
                    {!props.cueId ? PreferredLanguageText('noPosts') : PreferredLanguageText('noComments')}
                </Text>
            </View>
        );
    };

    console.log('Thread Id', threadId);

    /**
     * @description Renders List of threads
     */
    const renderThreadsLarge = () => {
        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    // height: Dimensions.get('window').width < 1024 ? 400 : 500,
                    height: '100%',
                }}
            >
                {/* Left pane will be for rendering active chats */}
                <View
                    style={{
                        width: '30%',
                        borderRightWidth: 1,
                        borderRightColor: '#f2f2f2',
                        height: '100%',
                    }}
                >
                    {/* Search bar */}
                    <View
                        style={{
                            paddingHorizontal: 20,
                            paddingVertical: 13,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderBottomColor: '#f2f2f2',
                            borderBottomWidth: 1,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <DefaultTextInput
                                value={searchTerm}
                                style={{
                                    color: '#000',
                                    backgroundColor: '#efefef',
                                    borderRadius: 15,
                                    fontSize: 12,
                                    paddingVertical: 8,
                                    paddingHorizontal: 16,
                                    marginRight: 2,
                                    width: '100%',
                                }}
                                autoCompleteType={'xyz'}
                                placeholder={'Search'}
                                onChangeText={(val) => setSearchTerm(val)}
                                placeholderTextColor={'#000'}
                            />
                        </View>
                        {searchTerm !== '' ? (
                            <View
                                style={{
                                    marginLeft: 20,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        if (searchTerm !== '') {
                                            setSearchTerm('');
                                        } else {
                                            props.setShowDirectory(true);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    <Ionicons name={'close-outline'} size={20} color={'#1f1f1f'} />
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                    {/*  */}
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        contentContainerStyle={{
                            borderColor: '#f2f2f2',
                            borderRadius: 1,
                            width: '100%',
                            height: '100%',
                            paddingVertical: 10,
                            paddingRight: 10,
                        }}
                    >
                        {isSearching ? (
                            <View
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'white',
                                    marginVertical: 25,
                                }}
                            >
                                <ActivityIndicator color={'#1F1F1F'} />
                            </View>
                        ) : null}

                        {searchTerm !== '' && searchResults.length === 0 && !isSearching ? (
                            <View
                                style={{
                                    padding: 20,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontFamily: 'Inter',
                                        textAlign: 'center',
                                    }}
                                >
                                    No Results
                                </Text>
                            </View>
                        ) : null}

                        {isSearching
                            ? null
                            : (searchTerm !== '' ? searchResults : filteredThreads).map((thread: any, ind: number) => {
                                  let title = '';

                                  if (!searchTerm && thread.title) {
                                      title = thread.title;
                                  } else if (
                                      !searchTerm &&
                                      thread.message[0] === '{' &&
                                      thread.message[thread.message.length - 1] === '}' &&
                                      !thread.title
                                  ) {
                                      const obj = JSON.parse(thread.message);
                                      title = obj.title;
                                  } else if (!searchTerm) {
                                      const { title: t, subtitle: s } = htmlStringParser(thread.message);
                                      title = t;
                                  }

                                  if (searchTerm && thread.searchTitle) {
                                      title = thread.searchTitle;
                                  }

                                  return (
                                      <TouchableOpacity
                                          onPress={() => loadCueDiscussions(thread._id)}
                                          style={{
                                              backgroundColor: threadId === thread._id ? '#f8f8f8' : '#fff',
                                              flexDirection: 'row',
                                              borderColor: '#f8f8f8',
                                              width: '100%',
                                              borderRadius: 5,
                                          }}
                                          key={ind.toString()}
                                      >
                                          <View style={{ flex: 1, backgroundColor: 'none', paddingLeft: 10 }}>
                                              <View
                                                  style={{
                                                      flexDirection: 'row',
                                                      marginTop: 5,
                                                      alignItems: 'center',
                                                      width: '100%',
                                                      backgroundColor: 'none',
                                                  }}
                                              >
                                                  <Text
                                                      style={{
                                                          fontSize: 14,
                                                          padding: 5,
                                                          fontFamily: 'inter',
                                                          flex: 1,
                                                      }}
                                                      ellipsizeMode="tail"
                                                      numberOfLines={1}
                                                  >
                                                      {title}
                                                  </Text>
                                                  <View
                                                      style={{
                                                          marginLeft: 'auto',
                                                          flexDirection: 'row',
                                                          backgroundColor: 'none',
                                                          paddingHorizontal: 10,
                                                          alignItems: 'center',
                                                      }}
                                                  >
                                                      {thread.isPrivate ? (
                                                          <Text
                                                              style={{
                                                                  fontSize: 13,
                                                                  padding: 5,
                                                                  color: '#000',
                                                                  textAlign: 'center',
                                                              }}
                                                              ellipsizeMode="tail"
                                                          >
                                                              <Ionicons name="eye-off-outline" size={15} />
                                                          </Text>
                                                      ) : null}
                                                      {thread.unreadThreads > 0 ? (
                                                          <View
                                                              style={{
                                                                  width: 15,
                                                                  height: 15,
                                                                  borderRadius: 8,
                                                                  marginLeft: 5,
                                                                  backgroundColor: '#007AFF',
                                                                  alignItems: 'center',
                                                                  justifyContent: 'center',
                                                              }}
                                                          >
                                                              <Text style={{ color: 'white', fontSize: 10 }}>
                                                                  {thread.unreadThreads}
                                                              </Text>
                                                          </View>
                                                      ) : null}
                                                  </View>
                                              </View>

                                              {/* Bottom bar must have Category -> Author -> Date -> Private/Anonymous tags */}
                                              <View
                                                  style={{
                                                      flexDirection: 'row',
                                                      alignItems: 'center',
                                                      backgroundColor: 'none',
                                                  }}
                                              >
                                                  {/* Category */}
                                                  <Text
                                                      style={{
                                                          fontSize: 11,
                                                          margin: 5,
                                                          lineHeight: 18,
                                                          marginRight: 10,
                                                      }}
                                                      ellipsizeMode="tail"
                                                  >
                                                      {thread.category ? thread.category : 'None'}
                                                  </Text>

                                                  {/* Author  */}
                                                  <Text
                                                      style={{
                                                          fontSize: 11,
                                                          margin: 5,
                                                          lineHeight: 18,
                                                          marginRight: 10,
                                                          color: '#000',
                                                      }}
                                                      ellipsizeMode="tail"
                                                  >
                                                      {thread.anonymous && thread.userId !== userId && !isOwner
                                                          ? 'Anonymous'
                                                          : thread.fullName}
                                                  </Text>

                                                  {/* Date & Time */}
                                                  <Text
                                                      style={{
                                                          fontSize: 10,
                                                          margin: 5,
                                                          lineHeight: 18,
                                                          marginLeft: 'auto',
                                                      }}
                                                      ellipsizeMode="tail"
                                                  >
                                                      {fromNow(thread.time, true)}
                                                  </Text>
                                              </View>
                                          </View>
                                          {/* <View
                                        style={{
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            backgroundColor: 'none',
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                backgroundColor: 'none',
                                                paddingHorizontal: 10,
                                                alignItems: 'center',
                                            }}
                                        >
                                            {thread.isPrivate ? (
                                                <Text
                                                    style={{
                                                        fontSize: 13,
                                                        padding: 5,
                                                        color: '#007AFF',
                                                        textAlign: 'center',
                                                    }}
                                                    ellipsizeMode="tail"
                                                >
                                                    <Ionicons name="eye-off-outline" size={18} />
                                                </Text>
                                            ) : null}
                                            {thread.unreadThreads > 0 ? (
                                                <View
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 8,
                                                        marginHorizontal: 5,
                                                        backgroundColor: '#007AFF',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginBottom: 3,
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontSize: 10 }}>
                                                        {thread.unreadThreads}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View> */}
                                      </TouchableOpacity>
                                  );
                              })}
                    </ScrollView>
                </View>

                {/* Right pane */}
                <View
                    style={{
                        width: '70%',
                        height: '100%',
                    }}
                >
                    {threadId === '' && !props.showNewDiscussionPost ? (
                        <View
                            style={{
                                width: '100%',
                                height: '100%',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'column',
                                }}
                            >
                                <Text
                                    style={{
                                        marginBottom: 10,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Ionicons name="chatbubbles-outline" size={28} color="#1f1f1f" />
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        textAlign: 'center',
                                    }}
                                >
                                    Select Thread to view
                                </Text>
                            </View>
                        </View>
                    ) : null}
                    {props.showNewDiscussionPost ? (
                        <NewPostModal
                            categories={categories}
                            categoriesOptions={categoriesOptions}
                            onClose={() => props.setShowNewDiscussionPost(false)}
                            onSend={createNewThread}
                            isOwner={isOwner}
                            userId={userId}
                            user={props.user}
                        />
                    ) : showThreadCues ? (
                        renderSelectedThread()
                    ) : null}
                    <FormulaGuide
                        value={equation}
                        onChange={setEquation}
                        show={showEquationEditor}
                        onClose={() => setShowEquationEditor(false)}
                        onInsertEquation={insertEquation}
                    />
                </View>
            </View>
        );
    };

    // MAIN RETURN

    return (
        <View
            style={{
                backgroundColor: '#fff',
                width: '100%',
                height: '100%',
                paddingTop: 0,
                justifyContent: 'center',
                flexDirection: 'row',
            }}
        >
            {props.showNewDiscussionPost && threads.length === 0 ? (
                <NewPostModal
                    categories={categories}
                    categoriesOptions={categoriesOptions}
                    onClose={() => props.setShowNewDiscussionPost(false)}
                    onSend={createNewThread}
                    isOwner={isOwner}
                    userId={userId}
                    user={props.user}
                />
            ) : null}
            {props.showNewDiscussionPost && threads.length === 0 ? null : (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        // maxWidth: '80%',
                        backgroundColor: '#fff',
                        borderRadius: 1,
                    }}
                >
                    {/* {!showThreadCues || Dimensions.get('window').width >= 768 || showPost ? renderThreadHeader() : null} */}
                    {loading && Dimensions.get('window').width < 768 ? (
                        <View
                            style={{
                                width: '100%',
                                paddingVertical: 100,
                                justifyContent: 'center',
                                flex: 1,
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : (
                        <View
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'white',
                                flex: 1,
                                flexDirection: 'column',
                                borderRadius: 1,
                            }}
                            key={JSON.stringify(filteredThreads) + JSON.stringify(props.showNewDiscussionPost)}
                        >
                            {showThreadCues && Dimensions.get('window').width < 768 ? (
                                <View
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            props.setShowNewDiscussionPost(false);
                                            setShowThreadCues(false);
                                            props.reload();
                                        }}
                                        style={{
                                            paddingRight: 20,
                                            paddingLeft: 10,
                                            alignSelf: 'flex-start',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                width: '100%',
                                                textAlign: 'center',
                                                paddingTop: 10,
                                            }}
                                        >
                                            <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                            {showThreadCues && Dimensions.get('window').width < 768
                                ? renderSelectedThread()
                                : threads.length === 0
                                ? renderEmptyThreads()
                                : Dimensions.get('window').width < 768
                                ? renderAllThreadsMobile()
                                : renderThreadsLarge()}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

export default ThreadsList;

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1,
        },
        marginSmall: {
            height: 10,
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white',
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            backgroundColor: 'white',
        },
        colorBar: {
            width: '100%',
            height: '10%',
            flexDirection: 'row',
        },
        channelOption: {
            width: '33.333%',
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden',
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white',
        },
        allOutline: {
            fontSize: 12,
            color: '#1F1F1F',
            height: 22,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#1F1F1F',
        },
    });
};
