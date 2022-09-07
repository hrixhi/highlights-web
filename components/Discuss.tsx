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
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions } from 'react-native';

import { useAppContext } from '../contexts/AppContext';
import { useCourseContext } from '../contexts/CourseContext';
import { useNavigationContext } from '../contexts/NavigationContext';

import InfiniteScroll from 'react-infinite-scroll-component';

const Discuss: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { discussion, loadChannelDiscussion, loadingDiscussionThreads } = useCourseContext();

    const { courseData } = useCourseContext();

    const { theme } = useNavigationContext();
    const {
        allThreads,
        filteredAndSortedThreads,
        error,
        selectedThreadId,
        searchTerm,
        categories,
        selectedCategories,
    } = discussion;

    const { userId, user } = useAppContext();

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

    const renderThreadsLarge = () => {
        return (
            <div className="flex flex-1 xl:overflow-hidden min-h-coursework">
                {/* Left Pane */}
                <div
                    aria-label="Threads Section"
                    className="hidden w-96 flex-shrink-0 border-r border-cues-border dark:border-cues-border-dark border-blue-gray-200 bg-white dark:bg-cues-dark-3 xl:flex xl:flex-col px-6"
                >
                    {/* Search Bar */}
                    {/* <div className="flex h-16 flex-shrink-0 items-center border-b border-cues-border dark:border-cues-border-dark border-blue-gray-200 px-6">
                        <label htmlFor="search" className="sr-only">
                            Search
                        </label>
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon
                                    className="h-5 w-5 text-gray-400 dark:text-white"
                                    aria-hidden="true"
                                />
                            </div>
                            <input
                                id="search"
                                name="search"
                                className="block w-full rounded-md border border-gray-200 dark:border-cues-border-dark dark:hover:border-white bg-white dark:bg-cues-dark-1 py-2 pl-10 pr-3 leading-5 placeholder-gray-500 dark:placeholder-gray-300 shadow-sm focus:border-cues-blue focus:placeholder-gray-400 focus:outline-none sm:text-sm dark:text-white"
                                placeholder="Search"
                                type="search"
                            />
                        </div>
                    </div> */}

                    {/* Threads */}
                    {/* <div className="min-h-0 flex-1 overflow-y-auto">
                        {filteredAndSortedThreads.map((thread: any) => {
                            return (
                                <button
                                    className={classNames(
                                        selectedThreadId === thread._id
                                            ? 'bg-cues-gray-2 dark:bg-cues-dark-active text-black'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-black',
                                        'w-full group flex items-center px-6 py-3 text-sm font-medium dark:text-white dark:hover:bg-cues-dark-1'
                                    )}
                                    onClick={() => {}}
                                >
                                    <img
                                        className="inline-block h-12 w-12 rounded-full"
                                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                        alt=""
                                    />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {thread.title}
                                        </h3>
                                    </div>
                                </button>
                            );
                        })}
                    </div> */}
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
                                    'bg-gray-100 text-gray-900 hidden ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block'
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
                                placeholder="Search"
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
                                    onClick={() => {}}
                                    className="text-left w-full flex flex-col flex-1 p-4 border border-cues-border dark:border-cues-border-dark rounded-lg mb-4"
                                >
                                    {/* Primary row */}
                                    <div className="w-full flex items-center flex-1">
                                        <img
                                            className="inline-block h-10 w-10 rounded-full"
                                            src={thread.avatar}
                                            alt=""
                                        />
                                        <div className="ml-6 flex flex-col flex-1">
                                            <h1 className=" text-xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                                {thread.title}
                                            </h1>
                                            <div className="flex flex-row items-center">
                                                <div className="text-cues-blue text-sm">
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
                                                className="ml-2 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                            >
                                                <span className="sr-only">Save Thread</span>
                                                <BookmarkSolidIcon className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Secondary Row */}
                                    <div className="w-full flex items-center flex-1 mt-4">
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
            <div className="flex flex-1 flex-col overflow-y-auto xl:overflow-hidden">{renderThreadsLarge()}</div>
            {/* {showThreadCues && Dimensions.get('window').width < 768
                    ? renderSelectedThread()
                    : Dimensions.get('window').width < 768
                    ? renderAllThreadsMobile()
                    : renderThreadsLarge()} */}
        </div>
    );
};

export default Discuss;
