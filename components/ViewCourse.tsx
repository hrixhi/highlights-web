// REACT
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useAppContext } from '../contexts/AppContext';
import { useNavigationContext } from '../contexts/NavigationContext';
import { useCourseContext } from '../contexts/CourseContext';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import { AppNavigation } from '../constants/Navigation';
import CourseOverview from './CourseOverview';
import Coursework from './Coursework';
import { AdjustmentsHorizontalIcon, PlusIcon, Squares2X2Icon } from '@heroicons/react/20/solid';
import { Datepicker, Popup, Select } from '@mobiscroll/react5';
import Discuss from './Discuss';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

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
    const { viewCourse, exitCourse, switchCourseActiveTab, theme } = useNavigationContext();

    const { subscriptions, allCues } = useAppContext();
    const { courseData, setCourseData, setCourseCues, coursework, setSortBy, setDateFilters } = useCourseContext();

    const courseTabs = Object.keys(AppNavigation['viewCourse']);
    const [showFilterPopup, setShowFilterPopup] = useState(false);

    useEffect(() => {
        if (!viewCourse || !subscriptions) return;

        const findCourse = subscriptions.find((course: any) => course._id === viewCourse.courseId);

        if (findCourse) {
            setCourseData(findCourse);
            setCourseCues(findCourse.channelId, allCues);
        }
    }, [subscriptions, viewCourse, allCues]);

    const renderTabButtons = () => {
        console.log('Active Tab', viewCourse.activeCourseTab);

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
                    {/* <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" /> */}
                    Save
                </button>
            </div>
        );
    };

    const renderCourseWorkButtons = () => {
        return (
            <div className="flex items-center">
                <button
                    type="button"
                    className="ml-1 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                    onClick={() => {
                        setShowFilterPopup(true);
                    }}
                >
                    <span className="sr-only">View Filter</span>
                    <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>
        );
    };

    const renderDiscussionButtons = () => {
        return (
            <div className="flex items-center">
                <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                    // onClick={() => showAddEvent()}
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

    const renderMainCourseContent = () => {
        console.log('Active Tab', viewCourse.activeCourseTab);

        switch (viewCourse.activeCourseTab) {
            case 'overview':
                return <CourseOverview />;
            case 'coursework':
                return <Coursework />;
            case 'discussion':
                return <Discuss />;
            default:
                return null;
        }
    };

    console.log('Course Data', courseData);

    return (
        <div className="flex flex-col flex-1 w-full">
            <div className="sticky top-0 z-10 flex h-14 border-b border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-2 flex-shrink-0">
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
                <div className="flex justify-between px-4">
                    <div className="flex items-center flex-1">
                        <h1 className="text-2xl font-bold text-black dark:text-white">{courseData.channelName}</h1>
                    </div>
                </div>
                {/* Tabs */}

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
                        <button
                            type="button"
                            className="ml-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-cues-dark-1 dark:hover:text-white focus:outline-none rounded-lg text-sm p-2.5"
                            onClick={() => {
                                // setShowFilterPopup(true);
                            }}
                        >
                            <span className="sr-only">View Apps</span>
                            <Squares2X2Icon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </li>
                </ul>

                {/* Render Buttons specific to tabs */}
                <div className="mx-4 flex items-center md:ml-6">{renderTabButtons()}</div>
            </div>
            {/* MAIN AREA FOR INDIVIDUAL CONTENT */}
            <div className="flex flex-1">{renderMainCourseContent()}</div>
            {renderCourseworkFilter()}
        </div>
    );
};

export default ViewCourse;
