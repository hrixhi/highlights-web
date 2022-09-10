// REACT
import {
    AdjustmentsHorizontalIcon,
    ChatBubbleBottomCenterTextIcon,
    HandThumbUpIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    BookmarkIcon as BookmarkSolidIcon,
} from '@heroicons/react/20/solid';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import {
    ArrowTrendingUpIcon,
    BookmarkIcon,
    ChatBubbleLeftEllipsisIcon,
    ChatBubbleLeftRightIcon,
    SignalSlashIcon,
    ChatBubbleBottomCenterIcon,
    StarIcon,
    ChartBarIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import React, { useState, useRef, useCallback } from 'react';
import { ActivityIndicator, Dimensions } from 'react-native';
import Froalaeditor from 'froala-editor';

import { useAppContext } from '../contexts/AppContext';
import { useCourseContext } from '../contexts/CourseContext';
import { useNavigationContext } from '../contexts/NavigationContext';

import InfiniteScroll from 'react-infinite-scroll-component';
import { Popup } from '@mobiscroll/react5';

import { DISCUSS_POST_TOOLBAR_BUTTONS } from '../constants/Froala';
import FroalaEditor from 'react-froala-wysiwyg';
import { handleFileUploadEditor } from '../helpers/FileUpload';
import Alert from './Alert';
import { htmlStringParser } from '../helpers/HTMLParser';
import parser from 'html-react-parser';

const Discuss: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const {
        discussion,
        loadChannelDiscussion,
        loadingDiscussionThreads,
        loadingThreadWithReplies,
        setSelectedThread,
        loadSelectedThreadReplies,
    } = useCourseContext();

    const { courseData } = useCourseContext();

    const { theme, viewCourse, setShowNewPostModal, setSelectedThreadId } = useNavigationContext();
    const {
        allThreads,
        filteredAndSortedThreads,
        error,
        selectedThread,
        selectedThreadReplies,
        selectedThreadRepliesError,
    } = discussion;

    const { showNewPostModal } = viewCourse;

    const { userId, user } = useAppContext();
    const RichText = useRef();

    const [title, setTitle] = useState('');
    const [html, setHtml] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    const [equation, setEquation] = useState('');
    const [showEquationEditor, setShowEquationEditor] = useState(false);

    const isOwner = useState(user._id === courseData.channelCreatedBy);

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const dummyCategories = ['WW2', 'Art History', 'The Holocaust', 'The 20th Century', 'The Great Depression'];

    const dummySelectedCategories = ['Treaty of Versailles', 'Industrial Revolution'];

    const dummyPinned = [
        {
            title: 'What is the Versailles Treaty?',
            img: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            author: 'Joe Frank',
            likeCount: 24,
            replyCount: 3,
            date: 'Jan 24',
        },
        {
            title: 'What happended on D-Day?',
            img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            author: 'Melissa Ocean',
            likeCount: 10,
            replyCount: 7,
            date: 'June 25',
        },
    ];

    const dummyActivity = [
        {
            activityType: 'reply',
            img: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            author: 'Joe Frank',
            title: 'What is the Versailles Treaty?',
            time: '12h',
            background: 'bg-gray-400',
            icon: ChatBubbleBottomCenterIcon,
        },
        {
            activityType: 'endorsed',
            img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            author: 'Tom Cook',
            title: 'What happended on D-Day?',
            time: '16h',
            background: 'bg-yellow-500',
            icon: StarIcon,
        },
        {
            activityType: 'newTopic',
            img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            author: 'Melissa Ocean',
            topic: 'WW2',
            time: '2d',
            background: 'bg-indigo-500',
            icon: ChatBubbleLeftEllipsisIcon,
        },
        {
            activityType: 'like',
            img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            author: 'Tom Cook',
            topic: 'WW2',
            time: '2d',
            background: 'bg-blue-500',
            icon: HandThumbUpIcon,
        },
    ];

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

    const fileUploadEditor = useCallback(
        async (files: any) => {
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
            const updatedAttachments: any[] = [...attachments];

            updatedAttachments.push({
                url: uploadURL,
                type: uploadType,
                name: updloadName,
            });

            setAttachments(updatedAttachments);
        },
        [attachments]
    );

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
                '<img class="rendered-math-jax" style="width:' +
                    res.intrinsicWidth +
                    'px; id="' +
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

    if (loadingDiscussionThreads) {
        return (
            <div
                style={{
                    width: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: 50,
                    marginBottom: 50,
                }}
            >
                <ActivityIndicator color={theme === 'light' ? '#1F1F1F' : '#fff'} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-1 flex-col w-full items-center py-12">
                <div className="text-center">
                    <SignalSlashIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                        Failed to fetch threads. Try again.
                    </h3>
                </div>
                <div className="mt-6">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                        onClick={() => loadChannelDiscussion()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (allThreads.length === 0) {
        return (
            <div className="flex flex-1 flex-col w-full items-center py-12">
                <div className="text-center">
                    <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No threads found.</h3>
                </div>
                <div className="mt-6">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                        // onClick={() => showAddEvent()}
                    >
                        <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
                        New
                    </button>
                </div>
            </div>
        );
    }

    if (allThreads.length !== 0 && filteredAndSortedThreads.length === 0) {
        return (
            <div className="flex flex-1 flex-col w-full items-center py-12">
                <div className="text-center">
                    <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No threads found.</h3>
                </div>
            </div>
        );
    }

    const renderNewPostModal = () => {
        return (
            <Popup
                isOpen={showNewPostModal}
                buttons={[
                    {
                        text: 'Send',
                        color: 'dark',
                        handler: function (event) {
                            // Send new post
                        },
                    },
                    {
                        text: 'Cancel',
                        color: 'dark',
                        handler: function (event) {
                            setShowNewPostModal(false);
                        },
                    },
                ]}
                themeVariant={theme}
                theme="ios"
                onClose={() => {}}
                responsive={{
                    small: {
                        display: 'center',
                    },
                    medium: {
                        display: 'center',
                    },
                }}
            >
                <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
                    <h3 className="text-2xl font-medium text-gray-900 dark:text-white">New Post</h3>
                    <div className="mb-6">
                        <label
                            htmlFor="event-title"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Title/Question
                        </label>
                        <input
                            type="event-title"
                            id="event-title"
                            className="bg-white border border-cues-border dark:border-cues-border-dark text-gray-900 text-sm rounded-lg focus:ring-cues-blue focus:border-cues-blue block w-full p-2.5 dark:bg-cues-dark-3 dark:placeholder-gray-300 dark:text-white dark:focus:ring-cues-blue dark:focus:border-cues-blue"
                            placeholder="ex. Group Activity"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="event-title"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Description
                        </label>
                        <FroalaEditor
                            ref={RichText}
                            model={html}
                            onModelChange={(model: any) => {
                                setHtml(model);
                            }}
                            config={{
                                key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                attribution: false,
                                placeholderText: 'Enter Title',
                                charCounterCount: false,
                                zIndex: 2003,
                                // immediateReactModelUpdate: true,
                                heightMin: 150,
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
                                toolbarButtons: DISCUSS_POST_TOOLBAR_BUTTONS,
                                toolbarSticky: false,
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
                                            Alert('Image size must be less than 5mb.');
                                            return false;
                                        }

                                        return true;
                                    },
                                },
                                theme: theme === 'dark' ? 'dark' : 'royal',
                            }}
                        />
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="event-title"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            Topics
                        </label>
                        <button
                            id="dropdownSearchButton"
                            data-dropdown-toggle="dropdownSearch"
                            data-dropdown-placement="bottom"
                            class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            type="button"
                        >
                            Add Topic{' '}
                            <svg
                                class="ml-2 w-4 h-4"
                                aria-hidden="true"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </Popup>
        );
    };

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

    const topContributorsDummy = [
        {
            name: 'Liam Richardson',
            img: 'https://cues-files.s3.amazonaws.com/media/all/png/1651291498185_Screen%20Shot%202022-04-29%20at%209.04.38%20PM.png',
            replies: 5,
        },
        {
            name: 'Emma Avery',
            img: 'https://cues-files.s3.amazonaws.com/media/all/png/1651290612098_Screen%20Shot%202022-04-29%20at%208.48.43%20PM.png',
            replies: 3,
        },
        {
            name: 'Sophia Perez',
            img: 'https://cues-files.s3.amazonaws.com/media/all/png/1651291267203_Screen%20Shot%202022-04-29%20at%209.00.56%20PM.png',
            replies: 2,
        },
        {
            name: 'Joe Frank',
            img: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            replies: 2,
        },
    ];

    const unansweredQuestionsDummy = [
        {
            question: '',
            author: '',
            date: '2 days ago',
        },
        {
            question: '',
            author: '',
            date: '2 days ago',
        },
    ];

    const renderSelectedThread = () => {
        let selectedThreadTitle = '';
        let selectedThreadContent = '';
        let selectedThreadAttachments = [];

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

        const dummyTopics = ['WW2', 'Pearl Harbor'];

        return (
            <div className="flex flex-1 xl:overflow-hidden min-h-coursework">
                {/* Main Section for Thread Data */}
                <div className="w-full px-4 sm:px-6 lg:mx-auto lg:px-8 py-6">
                    {/* Header &  */}
                    <div className="flex flex-col border-b border-cues-border dark:border-cues-border-dark pb-6">
                        <div className="flex items-center">
                            <h1 className="flex-1 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                {selectedThread.title}
                            </h1>
                            <div className="flex items-center">
                                {true && <CheckBadgeIcon className="w-6 h-6 text-blue-500" />}
                                <button
                                    type="button"
                                    className="ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                >
                                    <span className="sr-only">Save Thread</span>
                                    <BookmarkSolidIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <div className="flex items-center">
                                <img
                                    className="inline-block h-10 w-10 rounded-full"
                                    src={selectedThread.avatar}
                                    alt={'Thread Author'}
                                />
                                <p className="text-sm ml-3 text-gray-900 dark:text-white">
                                    {!selectedThread.anonymous || selectedThread.userId === userId || isOwner
                                        ? selectedThread.fullName
                                        : 'Anonymous'}
                                </p>
                            </div>
                            <div className="ml-4 text-sm text-gray-500 dark:text-gray-300">
                                {fromNow(new Date(selectedThread.time), false)}{' '}
                                {selectedThread.category ? ' in ' + selectedThread.category : ''}
                            </div>
                            <div className="ml-4 text-sm text-gray-500 dark:text-gray-300">
                                {selectedThread.views ? selectedThread.views : 10}{' '}
                                {selectedThread.views === 1 ? 'view' : 'views'}
                            </div>
                            <div className="ml-4 text-sm text-gray-500 dark:text-gray-300">
                                {selectedThread.edited && (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                        Edited
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Content */}
                        <div className="mt-4 flex items-center">
                            <div className="htmlParser fr-view dark:fr-view">{parser(selectedThreadContent)}</div>
                        </div>
                        {/* Buttons & Topics */}
                        <div className="mt-6 flex items-center w-full justify-between">
                            <div
                                className={`flex text-md items-center mr-5 ${
                                    true ? 'text-cues-blue' : 'text-gray-500'
                                }`}
                            >
                                <HandThumbUpIcon className="h-5 w-5 mr-2" />
                                <div className="">{4}</div>
                            </div>

                            <div className="flex flex-row">
                                {dummyTopics.map((topic) => {
                                    return (
                                        <div className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-200 py-1 px-2.5 text-xs font-medium text-cues-blue mr-2 mb-2">
                                            {topic}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-cover py-4">
                        <img
                            className="inline-block h-10 w-10 rounded-full"
                            src={
                                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                            }
                            alt=""
                        />
                        <div className="w-full ml-4">
                            <label htmlFor="reply" className="sr-only">
                                Leave a Reply
                            </label>
                            <input
                                type="reply"
                                name="reply"
                                id="reply"
                                className="p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Leave a reply"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-center">
                            <h1 className=" text-xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                Answers
                            </h1>
                            <span
                                className={
                                    'bg-gray-100 text-gray-900 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium'
                                }
                            >
                                {1}
                            </span>
                        </div>

                        {loadingThreadWithReplies ? (
                            <div
                                className="py-4"
                                style={{
                                    width: '100%',
                                    flex: 1,
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <ActivityIndicator color={theme === 'light' ? '#1F1F1F' : '#fff'} />
                            </div>
                        ) : selectedThreadRepliesError || !selectedThreadReplies ? (
                            <div className="flex flex-1 flex-col w-full items-center py-12">
                                <div className="text-center">
                                    <SignalSlashIcon className="mx-auto h-16 w-16 text-gray-400" />
                                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                                        Failed to fetch replies. Try again.
                                    </h3>
                                </div>
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                                        onClick={() => loadSelectedThreadReplies()}
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col mt-4">
                                {selectedThreadReplies.map((reply: any, replyIndx: number) => {
                                    let replyThreadContent = '';
                                    let replyThreadAttachments = [];

                                    if (
                                        reply.message &&
                                        reply.message[0] === '{' &&
                                        reply.message[reply.message.length - 1] === '}'
                                    ) {
                                        // New version
                                        const obj = JSON.parse(reply.message);
                                        replyThreadContent = obj.html || '';
                                        replyThreadAttachments = obj.attachments;
                                    } else {
                                        const { title: t, subtitle: s } = htmlStringParser(reply.message);
                                        replyThreadContent = s;
                                    }

                                    return (
                                        <div className="flex flex-col w-full py-4 border-b border-cues-border dark:border-cues-border-dark">
                                            <div className="flex items-center w-full">
                                                <img
                                                    className="inline-block h-10 w-10 rounded-full"
                                                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                                    alt=""
                                                />
                                                <div className="ml-4 text-black dark:text-white text-sm">
                                                    {!reply.anonymous || reply.userId === userId || isOwner
                                                        ? reply.fullName
                                                        : 'Anonymous'}
                                                </div>
                                                <div className="ml-4 text-sm text-gray-500 dark:text-gray-300 ">
                                                    {fromNow(new Date(reply.time), false)}
                                                </div>
                                                <div className="ml-4 text-sm text-gray-500 dark:text-gray-300">
                                                    {selectedThread.edited && (
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                            Edited
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Label Right */}
                                                <div className="ml-auto">
                                                    {replyIndx === 0 && (
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-200 py-1 px-2.5 text-xs font-medium text-cues-yellow mr-2 mb-2"
                                                        >
                                                            Top Answer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className="fr-view htmlParser mt-4"
                                                style={{ color: 'black', marginTop: 0, paddingLeft: 55 }}
                                            >
                                                {parser(replyThreadContent)}
                                            </div>
                                            <div className="mt-4 flex items-center ml-14">
                                                <div className="flex text-sm items-center text-gray-500 mr-3">
                                                    <HandThumbUpIcon className="h-4 w-4 mr-1" />
                                                    <div className="">{2}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section */}
                <div
                    aria-label="Threads Section"
                    className="hidden w-96 flex-shrink-0 border-l border-cues-border dark:border-cues-border-dar bg-white dark:bg-cues-dark-3 xl:flex xl:flex-col px-6"
                >
                    <div className="flex h-16 flex-shrink-0 items-center border-b border-cues-border dark:border-cues-border-dark px-4">
                        <div className="flex items-center">
                            <ChartBarIcon className="w-6 h-6 text-gray-900 dark:text-white mr-2" />
                            <div className="text-md font-medium text-gray-900 dark:text-white">Top Contributors</div>
                        </div>
                    </div>
                    <ul className="list-none mt-4 flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-cues-border dark:border-cues-border-dark dark:text-gray-400">
                        <li className="mr-2">
                            <a
                                href="#"
                                aria-current="page"
                                className="inline-block p-3 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500"
                            >
                                All time
                            </a>
                        </li>
                        <li className="mr-2">
                            <a
                                href="#"
                                className="inline-block p-3 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            >
                                This Month
                            </a>
                        </li>
                    </ul>
                    {/*  */}
                    <ul className="max-w-md ">
                        {topContributorsDummy.map((contributor: any) => {
                            return (
                                <li className="list-none py-3">
                                    <div className="flex items-center w-full">
                                        <img
                                            className="w-8 h-8 rounded-full"
                                            src={contributor.img}
                                            alt={contributor.name}
                                        />

                                        <p className="ml-3 text-sm font-medium text-gray-900 truncate dark:text-white">
                                            {contributor.name}
                                        </p>

                                        <div className="flex ml-auto items-center text-base font-semibold text-gray-900 dark:text-white">
                                            <ChatBubbleBottomCenterIcon className="w-5 h-5 mr-2" />
                                            <p className="text-gray-900 dark:text-white">{contributor.replies}</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Unanswered Questions */}
                    <div className="mt-12 flex h-16 flex-shrink-0 items-center border-b border-cues-border dark:border-cues-border-dark px-4">
                        <div className="flex items-center">
                            <QuestionMarkCircleIcon className="w-6 h-6 text-gray-900 dark:text-white mr-2" />
                            <div className="text-md font-medium text-gray-900 dark:text-white">Similar Questions</div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex flex-col">
                            {dummyPinned.map((thread: any) => {
                                return (
                                    <div className="w-full flex flex-col hover:bg-gray-100 dark:hover:bg-cues-dark-1 p-2 rounded-md">
                                        <h3 className="text-black dark:text-white text-sm">{thread.title}</h3>
                                        <div className="mt-2 flex flex-row justify-between items-center">
                                            <div className="flex items-center">
                                                <img
                                                    className="inline-block h-6 w-6 rounded-full"
                                                    src={thread.img}
                                                    alt=""
                                                />
                                                <p className="text-xs ml-2 text-gray-900 dark:text-white">
                                                    {thread.author}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="flex text-xs items-center text-gray-500 mr-3">
                                                    <HandThumbUpIcon className="h-4 w-4 mr-1" />
                                                    <div className="">{thread.likeCount}</div>
                                                </div>
                                                <div className="flex text-xs items-center text-gray-500">
                                                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1" />
                                                    <div className="">{thread.replyCount}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderThreadsLarge = () => {
        return (
            <div className="flex flex-1 xl:overflow-hidden min-h-coursework">
                {/* Left Pane */}
                <div
                    aria-label="Threads Section"
                    className="hidden w-96 flex-shrink-0 border-r border-cues-border dark:border-cues-border-dark border-blue-gray-200 bg-white dark:bg-cues-dark-3 xl:flex xl:flex-col px-6"
                >
                    <div className="flex h-16 flex-shrink-0 items-center border-b border-cues-border dark:border-cues-border-dark border-blue-gray-200 px-4">
                        <div className="flex items-center">
                            <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-gray-900 dark:text-white mr-2" />
                            <div className="text-md font-medium text-gray-900 dark:text-white">Topics</div>
                        </div>
                    </div>
                    {/* List of topics rendered as badges over here */}
                    <div className="flex flex-wrap mt-4">
                        {dummySelectedCategories.map((category: string) => {
                            return (
                                <span className="inline-flex items-center rounded-full bg-cues-blue dark:bg-cues-blue py-1 pl-2.5 pr-1 text-xs font-medium text-blue-100 mr-2 mb-2">
                                    {category}
                                    <button
                                        type="button"
                                        className="ml-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-blue-100 hover:bg-blue-200 hover:text-blue-500 focus:bg-blue-500 focus:text-white focus:outline-none"
                                    >
                                        <span className="sr-only">Remove large option</span>
                                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                        </svg>
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap">
                        {dummyCategories.map((category: string) => {
                            return (
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-200 py-1 px-2.5 text-xs font-medium text-cues-blue mr-2 mb-2"
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-12 flex h-16 flex-shrink-0 items-center border-b border-cues-border dark:border-cues-border-dark border-blue-gray-200 px-4">
                        <div className="flex items-center">
                            <BookmarkIcon className="w-6 h-6 text-gray-900 dark:text-white mr-2" />
                            <div className="text-md font-medium text-gray-900 dark:text-white">Saved</div>
                            <span
                                className={
                                    'bg-gray-100 text-gray-900 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium '
                                }
                            >
                                {2}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex flex-col">
                            {dummyPinned.map((thread: any) => {
                                return (
                                    <div className="w-full flex flex-col hover:bg-gray-100 dark:hover:bg-cues-dark-1 p-2 rounded-md">
                                        <h3 className="text-black dark:text-white text-sm">{thread.title}</h3>
                                        <div className="mt-2 flex flex-row justify-between items-center">
                                            <div className="flex items-center">
                                                <img
                                                    className="inline-block h-6 w-6 rounded-full"
                                                    src={thread.img}
                                                    alt=""
                                                />
                                                <p className="text-xs ml-2 text-gray-900 dark:text-white">
                                                    {thread.author}
                                                </p>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="flex text-xs items-center text-gray-500 mr-3">
                                                    <HandThumbUpIcon className="h-4 w-4 mr-1" />
                                                    <div className="">{thread.likeCount}</div>
                                                </div>
                                                <div className="flex text-xs items-center text-gray-500">
                                                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1" />
                                                    <div className="">{thread.replyCount}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-12 flex h-16 flex-shrink-0 items-center border-b border-cues-border dark:border-cues-border-dark border-blue-gray-200 px-4">
                        <div className="flex items-center">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-gray-900 dark:text-white mr-2" />
                            <div className="text-md font-medium text-gray-900 dark:text-white">Activity</div>
                        </div>
                    </div>

                    {/*  */}
                    <div className="mt-4">
                        <div className="flow-root">
                            <ul role="list" className="-mb-8">
                                {dummyActivity.map((activity: any, activityIndx: number) => {
                                    let message = '';

                                    if (activity.activityType === 'endorsed') {
                                        message = 'endorsed a post';
                                    } else if (activity.activityType === 'reply') {
                                        message = 'replied to your post';
                                    } else if (activity.activityType === 'newTopic') {
                                        message = ' added a new topic ';
                                    } else {
                                        message = ' liked your post';
                                    }

                                    return (
                                        <li key={activityIndx.toString()} className="list-none">
                                            <div className="relative pb-8">
                                                {activityIndx !== dummyActivity.length - 1 ? (
                                                    <span
                                                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                        aria-hidden="true"
                                                    />
                                                ) : null}
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span
                                                            className={classNames(
                                                                activity.background,
                                                                'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-cues-dark-3'
                                                            )}
                                                        >
                                                            <activity.icon
                                                                className="h-5 w-5 text-white"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                        <div>
                                                            <p className="text-sm text-black dark:text-white">
                                                                {activity.author}{' '}
                                                                <a
                                                                    // href={event.href}
                                                                    className="font-medium text-gray-500 dark:text-gray-400"
                                                                >
                                                                    {message}
                                                                </a>
                                                            </p>
                                                        </div>
                                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                            <time>{activity.time}</time>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Main Section */}
                <div className="w-full px-6 ">
                    {/* Search Bar */}

                    <div className="flex h-16 flex-shrink-0 items-center border-b border-cues-border dark:border-cues-border-dark border-blue-gray-200 px-6">
                        <label htmlFor="search-field" className="sr-only">
                            Search
                        </label>
                        <div className="relative w-full text-black dark:text-white focus-within:text-gray-600">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <input
                                id="search-field"
                                className="block h-full w-full dark:bg-cues-dark-3 border-transparent py-2 pl-8 pr-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                                placeholder="Search by keyword, author, or topic"
                                type="search"
                                name="search"
                            />
                        </div>
                        <button
                            type="button"
                            className="ml-1 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                            onClick={() => {
                                // setShowFilterPopup(true);
                            }}
                        >
                            <span className="sr-only">View Filter</span>
                            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Filter & Result message */}

                    <div className="py-4 text-gray-500">{filteredAndSortedThreads.length} results for 2 topics</div>

                    {/* Main Threads */}

                    <div className="flex flex-col mb-8">
                        {filteredAndSortedThreads.map((thread: any, threadIdx: number) => {
                            console.log('Logo');

                            console.log('Thread', thread);

                            return (
                                <button
                                    onClick={() => {
                                        setSelectedThreadId(thread._id);
                                        setSelectedThread(thread);
                                    }}
                                    className="text-left w-full flex flex-col flex-1 px-6 py-4 border border-cues-border dark:border-cues-border-dark rounded-lg mb-4"
                                >
                                    {/* Primary row */}
                                    <div className="w-full flex items-center flex-1">
                                        <img
                                            className="inline-block h-10 w-10 rounded-full"
                                            src={thread.avatar}
                                            alt=""
                                        />
                                        <div className="ml-4 flex flex-col flex-1">
                                            <h1 className=" text-xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                                {thread.title}
                                            </h1>
                                            <div className="flex flex-row items-center">
                                                <div className="text-black dark:text-white text-xs">
                                                    {!thread.anonymous || thread.userId === userId || isOwner
                                                        ? thread.fullName
                                                        : 'Anonymous'}
                                                </div>
                                                <div className="ml-4 text-xs text-gray-500 dark:text-gray-300 ">
                                                    {fromNow(new Date(thread.time), false)}{' '}
                                                    {thread.category ? ' in ' + thread.category : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-3 flex items-center">
                                            {threadIdx % 2 === 1 && (
                                                <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                                            )}
                                            <button
                                                type="button"
                                                className="ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                            >
                                                <span className="sr-only">Save Thread</span>
                                                <BookmarkSolidIcon className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Secondary Row */}
                                    <div className="w-full flex items-center flex-1 mt-6">
                                        <div className="flex flex-row items-center">
                                            <div className="inline-block h-10 w-10 rounded-full" />
                                            <div
                                                className={`ml-6 flex text-md items-center mr-5 ${
                                                    threadIdx % 2 === 1 ? 'text-cues-blue' : 'text-gray-500'
                                                }`}
                                            >
                                                <HandThumbUpIcon className="h-5 w-5 mr-2" />
                                                <div className="">{4}</div>
                                            </div>
                                            <div className="flex text-md items-center text-gray-500 mr-5">
                                                <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-2" />
                                                <div className="">{9}</div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="flex flex-1 flex-col overflow-y-auto xl:overflow-hidden">
                {selectedThread ? renderSelectedThread() : renderThreadsLarge()}
            </div>

            {showNewPostModal && renderNewPostModal()}
        </div>
    );
};

export default Discuss;
