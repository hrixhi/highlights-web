// REACT
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useAppContext } from '../contexts/AppContext';

import { VideoCameraIcon, PencilSquareIcon } from '@heroicons/react/20/solid';
import { useNavigationContext } from '../contexts/NavigationContext';

// Demo

const Courses: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, org, user, subscriptions } = useAppContext();

    const { openCourse } = useNavigationContext();

    const [quickAccessSelected, setQuickAccessSelected] = useState('All');

    const quickAccessTabs = ['All', 'Recently Shared', 'Recently Viewed', 'Due Soon'];

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const dummyFiles = [
        {
            title: 'Types of Pain',
            channelName: 'Art',
            courseColor: '#D94A8C',
            color: 0,
            recentlyViewed: true,
        },
        {
            title: '7 Essay Writing Tips',
            channelName: 'Literature',
            courseColor: '#6FB1A0',
            color: 0,
            recentlyViewed: true,
        },
        {
            title: 'Art Lesson',
            channelName: 'Art',
            courseColor: '#D94A8C',
            color: 2,
            recentlyShared: true,
        },
        {
            title: 'Quiz #1',
            channelName: 'Math',
            courseColor: '#11A487',
            color: 4,
            dueSoon: true,
        },
        {
            title: 'Quiz #1',
            channelName: 'History',
            courseColor: '#EA515F',
            color: 4,
            dueSoon: true,
        },
        {
            title: 'World History',
            channelName: 'History',
            courseColor: '#EA515F',
            color: 3,
            recentlyShared: true,
        },
    ];

    const dummyCourses = [
        {
            _id: '626b38af0c62a70cee6f4f75',
            channelName: 'Art',
            channelId: '626b38af0c62a70cee6f4f74',
            channelColor: '#d94a8c',
            createdByName: 'Tom Cook',
            createdByImg:
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            term: 'Year 2022-23',
            enrolledOn: 'Aug 12, 2022',
        },
        {
            _id: '626b38510c62a70cee6f4ef1',
            channelName: 'History',
            channelId: '626b38510c62a70cee6f4ef0',
            channelColor: '#ea515f',
            createdByName: 'Mellisa Andres',
            createdByImg:
                'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1361&q=80',
            term: 'Year 2022-23',
            enrolledOn: 'Aug 18, 2022',
        },
        {
            _id: '626b389b0c62a70cee6f4f6d',
            channelName: 'Literature',
            channelId: '626b389b0c62a70cee6f4f6c',
            channelColor: '#6fb1a0',
            createdByName: 'Phil Foden',
            createdByImg:
                'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80',
            term: 'Year 2022-23',
            enrolledOn: 'Sep 2, 2022',
        },
        {
            _id: '626b383c0c62a70cee6f4ed4',
            channelName: 'Math',
            channelId: '626b383c0c62a70cee6f4ed3',
            channelColor: '#1184a7',
            createdByName: 'Rachel Cook',
            createdByImg:
                'https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            term: 'Year 2022-23',
            enrolledOn: 'Sep 2, 2022',
        },
    ];

    const [filesToDisplay, setFilesToDisplay] = useState(dummyFiles);

    useEffect(() => {
        let files = dummyFiles;

        if (quickAccessSelected === 'Recently Shared') {
            files = files.filter((file: any) => file.recentlyShared);
        } else if (quickAccessSelected === 'Recently Viewed') {
            files = files.filter((file: any) => file.recentlyViewed);
        } else if (quickAccessSelected === 'Due Soon') {
            files = files.filter((file: any) => file.dueSoon);
        }

        setFilesToDisplay(files);
    }, [quickAccessSelected]);

    const renderPriorityTag = (priority: number) => {
        const priorityLabelMap = {
            '0': 'Very Low',
            '1': 'Low',
            '2': 'Mid',
            '3': 'High',
            '4': 'Very High',
        };

        const priorityColorMap = {
            '0': 'gray',
            '1': 'green',
            '2': 'yellow',
            '3': 'red',
            '4': 'pink',
        };

        const color = priorityColorMap[priority.toString()];

        return (
            <span
                className={`inline-flex items-center rounded-full bg-${color}-100 dark:bg-${color}-200 px-2.5 py-0.5 text-xs font-medium text-${color}-800 mr-4`}
            >
                {priorityLabelMap[priority.toString()]}
            </span>
        );
    };

    const renderStatusTag = (file: any) => {
        let label = '';

        if (file.recentlyShared) {
            label = 'Recently Shared';
        } else if (file.recentlyViewed) {
            label = 'Recently Viewed';
        } else {
            label = 'Due Soon';
        }

        let color;

        return (
            <span
                className={`inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-800 mr-4`}
            >
                {label}
            </span>
        );
    };

    return (
        <div className="w-full bg-white dark:bg-cues-dark-3">
            <div className="px-4 sm:px-6 lg:mx-auto lg:px-8 py-8">
                <h1 className="ml-3 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    Your Courses
                </h1>
                {/*  */}
                <div className="mt-4 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
                    {dummyCourses.map((course: any, ind: number) => (
                        <button
                            key={course._id}
                            className="flex flex-col border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 hover:bg-gray-100 dark:hover:bg-cues-dark-1 px-6 py-5 shadow-sm rounded-md"
                            onClick={() => {
                                openCourse(course._id);
                            }}
                        >
                            <div className="flex w-full">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {course.channelName}
                                </h3>
                            </div>
                            <div className="w-full mt-6 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                <div
                                    className="h-1.5 rounded-full dark:bg-blue-500"
                                    style={{
                                        background: course.channelColor,
                                        width: (ind + 1) * 0.25 * 100,
                                    }}
                                />
                            </div>
                            <div className="w-full mt-6 flex items-center justify-between">
                                <div className="flex items-center">
                                    <img
                                        className="inline-block h-6 w-6 rounded-full"
                                        src={course.createdByImg}
                                        alt=""
                                    />
                                    <p className="text-xs ml-3 text-gray-900 dark:text-white">{course.createdByName}</p>
                                </div>
                                {ind === 1 && (
                                    <span className="inline-flex items-center rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-800">
                                        <VideoCameraIcon className="w-3 h-3 mx-1" />
                                        In Progress
                                    </span>
                                )}
                                {ind === 3 && (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                        1 <PencilSquareIcon className="w-3 h-3 mx-1" />
                                        Due Today
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
                {/* Section 2 */}
                <h1 className="ml-3 mt-16 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    Quick Access
                </h1>
                <div className="hidden sm:block mt-4">
                    <div className="w-full flex items-center justify-between border-b border-gray-200 dark:border-cues-border-dark px-4 sm:px-6 lg:mx-auto lg:px-8">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {quickAccessTabs.map((option) => (
                                <button
                                    key={option}
                                    className={classNames(
                                        quickAccessSelected === option
                                            ? 'border-black text-black dark:border-white dark:text-white'
                                            : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-100',
                                        'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-md'
                                    )}
                                    aria-current={quickAccessSelected === option ? 'page' : undefined}
                                    onClick={() => setQuickAccessSelected(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 mt-4 shadow rounded">
                            <thead className="text-xs border-b border-cues-border dark:border-cues-border-dark text-gray-700 uppercase bg-gray-50 dark:bg-cues-dark-3 dark:text-white">
                                <tr>
                                    <th scope="col" className="py-3 px-6">
                                        Name
                                    </th>
                                    <th scope="col" className="py-3 px-6">
                                        Course
                                    </th>
                                    <th scope="col" className="py-3 px-6">
                                        Priority
                                    </th>
                                    <th scope="col" className="py-3 px-6">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filesToDisplay.map((file: any) => (
                                    <tr className="bg-white  dark:bg-cues-dark-3  hover:bg-gray-50 dark:hover:bg-cues-dark-1">
                                        <td>
                                            <th
                                                scope="row"
                                                className="flex items-center py-3 px-6 text-gray-900 whitespace-nowrap dark:text-white"
                                            >
                                                <div className="text-base font-semibold">{file.title}</div>
                                            </th>
                                        </td>
                                        <td className="py-3 px-6">{file.channelName}</td>
                                        <td className="py-3 px-6">{renderPriorityTag(file.color)}</td>
                                        <td className="py-3 px-6">{renderStatusTag(file)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Courses;
