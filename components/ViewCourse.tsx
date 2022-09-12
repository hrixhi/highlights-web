// REACT
import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { useNavigationContext } from '../contexts/NavigationContext';
import { useCourseContext } from '../contexts/CourseContext';

import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { AppNavigation } from '../constants/Navigation';
import CourseOverview from './CourseOverview';
import {
    AdjustmentsHorizontalIcon,
    ChartBarSquareIcon,
    PaintBrushIcon,
    PlusIcon,
    PresentationChartBarIcon,
    RectangleGroupIcon,
    Squares2X2Icon,
} from '@heroicons/react/20/solid';
import { Datepicker, Popup, Select } from '@mobiscroll/react5';
import Discuss from './Discuss';
import Classroom from './Classroom';
import Meeting from './Meeting';
import Grades from './Grades';
import Settings from './Settings';
import { Popover, Transition } from '@headlessui/react';
import Organizer from './Organizer';
import Whiteboard from './Whiteboard';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

const appNavigationTabs = [
    {
        id: 'organizer',
        label: 'Organizer',
        tabIcon: RectangleGroupIcon,
    },
    {
        id: 'whiteboard',
        label: 'Whiteboard',
        tabIcon: PaintBrushIcon,
    },
    {
        id: 'polls',
        label: 'Polls',
        tabIcon: ChartBarSquareIcon,
    },
    {
        id: 'presentations',
        label: 'Presentations',
        tabIcon: PresentationChartBarIcon,
    },
];

const sortbyOptions = [
    {
        value: 'Date ↑',
        text: 'Date ↑',
    },
    {
        value: 'Date ↓',
        text: 'Date ↓',
    },
    {
        value: 'Priority',
        text: 'Priority',
    },
];

const ViewCourse: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const {
        viewCourse,
        exitCourse,
        switchCourseActiveTab,
        theme,
        setShowNewPostModal,
        setSelectedThreadId,
        switchClassroomActiveTab,
        setSelectedPlaylist,
    } = useNavigationContext();

    const { userId, subscriptions, allCues } = useAppContext();
    const { courseData, setCourseData, setCourseCues, coursework, setSortBy, setDateFilters, setSelectedThread } =
        useCourseContext();

    const courseTabs = Object.keys(AppNavigation['viewCourse']);
    const [showFilterPopup, setShowFilterPopup] = useState(false);

    const buttonRef = useRef();

    useEffect(() => {
        if (!viewCourse || !subscriptions) return;

        const findCourse = subscriptions.find((course: any) => course._id === viewCourse.courseId);

        if (findCourse) {
            const isOwner = findCourse.channelCreatedBy === userId;

            console.log('Find Course', findCourse);

            setCourseData({ ...findCourse, isOwner });
            setCourseCues(findCourse.channelId, allCues);
        }
    }, [userId, subscriptions, viewCourse, allCues]);

    const renderTabButtons = () => {
        switch (viewCourse.activeCourseTab) {
            case 'overview':
                return renderOverviewButtons();
            case 'coursework':
                return renderCourseWorkButtons();
            case 'discussion':
                return renderDiscussionButtons();
            default:
                return null;
        }
    };

    const renderOverviewButtons = () => {
        return (
            <div className="flex items-center">
                <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                    // onClick={() => showAddEvent()}
                >
                    Save
                </button>
            </div>
        );
    };

    const renderCourseWorkButtons = () => {
        switch (viewCourse.activeClassroomTab) {
            // Files
            case 'coursework':
                return (
                    <div className="flex items-center">
                        <button
                            type="button"
                            className="mr-3 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                            onClick={() => {
                                setShowFilterPopup(true);
                            }}
                        >
                            <span className="sr-only">View Filter</span>
                            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <div
                            className="flex flex-1 items-center w-full min-w-lg max-w-lg md:ml-0"
                            style={{
                                width: 300,
                            }}
                        >
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
                                    placeholder="Search title, topics, or keyword"
                                    type="search"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            className="ml-3 inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                            onClick={() => setShowNewPostModal(true)}
                        >
                            <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
                            New
                        </button>
                    </div>
                );
            case 'experiences':
                return (
                    <div className="flex items-center">
                        <button
                            type="button"
                            className="mr-3 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                            onClick={() => {
                                setShowFilterPopup(true);
                            }}
                        >
                            <span className="sr-only">View Filter</span>
                            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <div
                            className="flex flex-1 items-center w-full min-w-lg max-w-lg md:ml-0"
                            style={{
                                width: 300,
                            }}
                        >
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
                                    placeholder="Search title, topics, or keyword"
                                    type="search"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            className="ml-3 inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                            onClick={() => setShowNewPostModal(true)}
                        >
                            <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
                            New
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderDiscussionButtons = () => {
        if (viewCourse.selectedThreadId) return null;

        return (
            <div className="flex items-center">
                <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                    onClick={() => setShowNewPostModal(true)}
                >
                    <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
                    New
                </button>
            </div>
        );
    };

    const renderCourseworkFilter = () => {
        return (
            <Popup
                isOpen={showFilterPopup}
                buttons={[
                    {
                        text: 'Ok',
                        color: 'dark',
                        handler: function (event) {
                            setShowFilterPopup(false);
                        },
                    },
                    {
                        text: 'Reset',
                        color: 'dark',
                        handler: function (event) {
                            setDateFilters(undefined, undefined);
                            setShowFilterPopup(false);
                        },
                    },
                ]}
                themeVariant={theme}
                theme="ios"
                onClose={() => setShowFilterPopup(false)}
                responsive={{
                    small: {
                        display: 'center',
                    },
                    medium: {
                        display: 'center',
                    },
                }}
            >
                {/* Show all the settings here */}
                <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
                    <h3 className="text-2xl font-medium text-gray-900 dark:text-white">Content Settings</h3>

                    <div>
                        <div className="mb-2 block">
                            <label
                                htmlFor="range"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Sort By
                            </label>
                        </div>

                        <Select
                            touchUi={true}
                            theme="ios"
                            themeVariant={theme}
                            value={coursework.sortBy}
                            onChange={(val: any) => {
                                setSortBy(val.value);
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                },
                            }}
                            dropdown={false}
                            data={sortbyOptions}
                        />
                    </div>

                    <div>
                        <div className="mb-2 block">
                            <label
                                htmlFor="filterChannel"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Date Range
                            </label>
                        </div>

                        <Datepicker
                            theme="ios"
                            themeVariant={theme}
                            controls={['calendar']}
                            select="range"
                            touchUi={true}
                            inputProps={{
                                placeholder: 'Select',
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                },
                            }}
                            value={[coursework.filterStart, coursework.filterEnd]}
                            onChange={(val: any) => {
                                setDateFilters(val.value[0], val.value[1]);
                            }}
                        />
                    </div>
                </div>
            </Popup>
        );
    };

    if (!courseData) {
        return (
            <div className="flex flex-col flex-1 w-full">
                <div className="sticky top-0 z-10 flex h-14 border-b border-cues-border dark:border-cues-border-dark dark:bg-cues-dark-2 flex-shrink-0">
                    {/* Back Arrow */}
                    <button
                        type="button"
                        className="px-8 text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cues-blue"
                        onClick={() => exitCourse()}
                    >
                        <span className="sr-only">Back to Home</span>
                        <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {/* Main */}
                </div>
            </div>
        );
    }

    const renderMainCourseTabs = () => {
        if (
            viewCourse.selectedThreadId ||
            viewCourse.activeClassroomTab ||
            viewCourse.activeCourseTab === 'organizer' ||
            viewCourse.activeCourseTab === 'whiteboard'
        ) {
            return null;
        }

        return (
            <ul className="list-none ml-12 flex flex-1 items-center flex-wrap text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                {courseTabs.map((tab: string) => {
                    return (
                        <li className="mr-2" key={tab}>
                            <button
                                className={classNames(
                                    tab === viewCourse.activeCourseTab
                                        ? 'text-black dark:text-white bg-cues-gray-2 dark:bg-cues-dark-active rounded-lg active'
                                        : 'rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white',
                                    'inline-block py-2.5 px-4 capitalize'
                                )}
                                onClick={() => {
                                    switchCourseActiveTab(tab);
                                }}
                            >
                                {tab === 'overview' ? 'Home' : tab === 'discussion' ? 'Q&A' : tab}
                            </button>
                        </li>
                    );
                })}
                <li className="flex items-center">
                    <Popover class="relative">
                        {({ open }) => (
                            <>
                                <Popover.Button
                                    ref={buttonRef}
                                    class={classNames(
                                        'rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white',
                                        'inline-block py-2.5 px-4 capitalize'
                                    )}
                                >
                                    <span className="sr-only">View Apps</span>
                                    <Squares2X2Icon className="h-5 w-5" aria-hidden="true" />
                                </Popover.Button>

                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-200"
                                    enterFrom="opacity-0 translate-y-1"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in duration-150"
                                    leaveFrom="opacity-100 translate-y-0"
                                    leaveTo="opacity-0 translate-y-1"
                                >
                                    <Popover.Panel class="border border-cues-border dark:border-cues-border-dark absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 transform px-2 sm:px-0 bg-cues-gray-1 dark:bg-cues-dark-2 shadow-lg">
                                        <div className="block py-2 px-4 text-base font-medium text-center text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400 border-b border-cues-border dark:border-cues-border-dark">
                                            Apps
                                        </div>
                                        <div className="bg-white dark:bg-cues-dark-3 grid grid-cols-2 gap-4 p-4">
                                            {appNavigationTabs.map((navigation: any) => {
                                                return (
                                                    <button
                                                        onClick={() => {
                                                            buttonRef.current?.click();
                                                            switchCourseActiveTab(navigation.id);
                                                        }}
                                                        className="block p-4 text-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                                                    >
                                                        <navigation.tabIcon className="mx-auto mb-1 w-7 h-7 text-gray-500 dark:text-gray-400" />
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {navigation.label}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </Popover.Panel>
                                </Transition>
                            </>
                        )}
                    </Popover>
                </li>
            </ul>
        );
    };

    const renderMainCourseContent = () => {
        console.log('Active Tab', viewCourse.activeCourseTab);

        switch (viewCourse.activeCourseTab) {
            case 'overview':
                return <CourseOverview />;
            case 'coursework':
                return <Classroom />;
            // return <Coursework />;
            case 'discussion':
                return <Discuss />;
            case 'meetings':
                return <Meeting />;
            case 'grades':
                return <Grades />;
            case 'settings':
                return <Settings />;
            case 'organizer':
                return <Organizer />;
            case 'whiteboard':
                return <Whiteboard />;
            default:
                return null;
        }
    };

    const renderHeaderAndBreadcrumbs = () => {
        let submenu = undefined;
        let subsubmenu = undefined;

        if (viewCourse.activeClassroomTab) {
            submenu =
                viewCourse.activeClassroomTab === 'experiences'
                    ? 'activities'
                    : viewCourse.activeClassroomTab === 'coursework'
                    ? 'Files'
                    : viewCourse.activeClassroomTab;
        } else if (viewCourse.selectedThreadId) {
            submenu = 'Q&A';
        } else if (viewCourse.activeCourseTab === 'organizer' || viewCourse.activeCourseTab === 'whiteboard') {
            submenu = viewCourse.activeCourseTab;
        }

        if (viewCourse.activeClassroomTab) {
            if (viewCourse.activeClassroomTab === 'playlists' && viewCourse.selectedPlaylist) {
                subsubmenu = viewCourse.selectedPlaylist.title;
            }
        }

        return (
            <div className="flex flex-row items-center px-4">
                <div className="flex items-center flex-1">
                    <h1 className="text-2xl font-bold text-black dark:text-white">{courseData.channelName}</h1>
                </div>
                {submenu && (
                    <div className="flex items-center">
                        <svg
                            className="h-8 w-8 flex-shrink-0 text-gray-300 dark:text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                        </svg>
                        <h1 className="text-sm text-2xl font-bold text-black dark:text-white capitalize">{submenu}</h1>
                    </div>
                )}
                {subsubmenu && (
                    <div className="flex items-center">
                        <svg
                            className="h-8 w-8 flex-shrink-0 text-gray-300 dark:text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                        </svg>
                        <h1 className="text-sm text-2xl font-bold text-black dark:text-white capitalize">
                            {subsubmenu}
                        </h1>
                    </div>
                )}
            </div>
        );
    };

    const onClickBack = () => {
        if (viewCourse.selectedThreadId) {
            setSelectedThreadId(undefined);
            setSelectedThread(undefined);
        } else if (viewCourse.selectedPlaylist) {
            setSelectedPlaylist(undefined);
        } else if (viewCourse.activeClassroomTab) {
            switchClassroomActiveTab(undefined);
        } else if (viewCourse.activeClassroomTab === 'whiteboard' || viewCourse.activeClassroomTab === 'organizer') {
            switchClassroomActiveTab('home');
        } else {
            exitCourse();
        }
    };

    console.log('Course Data', courseData);

    return (
        <div className="flex flex-col flex-1 w-full">
            <div className="sticky w-full top-0 z-10 flex h-14 border-b border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-2 flex-shrink-0">
                {/* Back Arrow */}
                <button
                    type="button"
                    className="px-8 text-gray-500 dark:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cues-blue"
                    onClick={() => onClickBack()}
                >
                    <span className="sr-only">Back to Home</span>
                    <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Header + Breadcrumbs */}
                {renderHeaderAndBreadcrumbs()}

                {/* Tabs */}

                {renderMainCourseTabs()}

                {/* Render Buttons specific to tabs */}
                <div className="mx-4 flex items-center md:ml-auto">{renderTabButtons()}</div>
            </div>
            {/* MAIN AREA FOR INDIVIDUAL CONTENT */}
            <div className="flex flex-1">{renderMainCourseContent()}</div>
            {renderCourseworkFilter()}
        </div>
    );
};

export default ViewCourse;
