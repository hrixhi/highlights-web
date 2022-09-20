import React, { useState, useEffect, useCallback } from 'react';

import { CalendarIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid';
import { useNavigationContext } from '../contexts/NavigationContext';
import { Switch } from '@headlessui/react';

const AccountSettings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const tabs = ['Account', 'Courses', 'Integrations', 'Preferences'];

    const { settings, switchSettingsActiveTab, switchRoute } = useNavigationContext();

    const { activeSettingsTab } = settings;

    // const [tab, setTab] = useState('Profile');
    const [name, setName] = useState('Emilia Birch');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [remindersEnabled, setRemindersEnabled] = useState(true);
    const [smartReportsEnabled, setSmartReportsEnabled] = useState(true);

    const yourCourses = [
        {
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

    const showNewCourse = () => {
        switchRoute('newCourse');
    };

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const renderAccountTab = () => {
        return (
            <div className="lg:max-w-3xl">
                {/* Description list with inline editing */}
                <div className="divide-y divide-cues-divide dark:divide-cues-divide-dark">
                    <div className="space-y-1">
                        <h2 className="text-xl font-medium leading-6 text-gray-900 dark:text-white mb-2">Profile</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                            This information will be displayed publicly.
                        </p>
                    </div>
                    <div className="mt-6">
                        <dl className="divide-y divide-cues-divide dark:divide-cues-divide-dark">
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Name</dt>
                                <dd className="mt-1 flex text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                                    <span className="flex-grow">Emilia Birche</span>
                                    <span className="ml-4 flex-shrink-0">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white dark:bg-cues-dark-3 font-medium text-cues-blue hover:text-blue-500"
                                        >
                                            Update
                                        </button>
                                    </span>
                                </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:pt-5">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Photo</dt>
                                <dd className="mt-1 flex text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                                    <span className="flex-grow">
                                        <img
                                            className="h-12 w-12 rounded-full"
                                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.6&w=256&h=256&q=80"
                                            alt=""
                                        />
                                    </span>
                                    <span className="ml-4 flex flex-shrink-0 items-start space-x-4">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white dark:bg-cues-dark-3 font-medium text-cues-blue hover:text-blue-500"
                                        >
                                            Update
                                        </button>
                                        <span className="text-gray-300" aria-hidden="true">
                                            |
                                        </span>
                                        <button
                                            type="button"
                                            className="rounded-md bg-white dark:bg-cues-dark-3 font-medium text-cues-blue hover:text-blue-500"
                                        >
                                            Remove
                                        </button>
                                    </span>
                                </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:pt-5">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Email</dt>
                                <dd className="mt-1 flex text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                                    <span className="flex-grow">emilia.birch@example.com</span>
                                    <span className="ml-4 flex-shrink-0">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white dark:bg-cues-dark-3 font-medium text-cues-blue hover:text-blue-500"
                                        >
                                            Update
                                        </button>
                                    </span>
                                </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-b sm:border-gray-200 sm:py-5">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Status</dt>
                                <dd className="mt-1 flex text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                                    <span className="flex-grow flex items-center">
                                        <span className="text-lg">🗓️</span>
                                        <span className="text-sm ml-2">In a Meeting</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-300 ml-2">- 1 hour</span>
                                    </span>
                                    <span className="ml-4 flex-shrink-0">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white dark:bg-cues-dark-3 font-medium text-cues-blue hover:text-blue-500"
                                        >
                                            Update
                                        </button>
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/*  */}
                <div className="mt-10 divide-y divide-cues-divide dark:divide-cues-divide-dark">
                    <div className="space-y-1">
                        <h3 className="text-xl font-medium leading-6 text-gray-900 dark:text-white mb-2">
                            Notification Preferences
                        </h3>
                        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-300">
                            Help Cues fine tune your alerts, reminders & reports to keep you in sync with your courses.
                        </p>
                    </div>
                    <div className="mt-6">
                        <dl className="divide-y divide-cues-divide dark:divide-cues-divide-dark">
                            <div className="flex flex-col w-full">
                                <Switch.Group as="div" class="pt-4 pb-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:pt-5">
                                    <Switch.Label
                                        as="dt"
                                        class="text-md font-medium text-gray-500 dark:text-gray-300"
                                        passive
                                    >
                                        Alerts
                                    </Switch.Label>
                                    <dd className="mt-1 flex text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                                        <span className="flex-grow"></span>
                                        <span className="ml-4 flex flex-shrink-0 items-start space-x-4">
                                            <Switch
                                                checked={notificationsEnabled}
                                                onChange={setNotificationsEnabled}
                                                class={classNames(
                                                    notificationsEnabled ? 'bg-cues-blue' : 'bg-gray-200',
                                                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:ml-auto'
                                                )}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={classNames(
                                                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0',
                                                        'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                                    )}
                                                />
                                            </Switch>
                                        </span>
                                    </dd>
                                </Switch.Group>
                                <div className="pb-5 text-xs text-gray-900 dark:text-gray-400">
                                    You have turned on alerts for new coursework, messages, discussions, &
                                    announcements.
                                </div>
                            </div>
                            <div className="flex flex-col w-full">
                                <Switch.Group as="div" class="pt-4 pb-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:pt-5">
                                    <Switch.Label
                                        as="dt"
                                        class="text-md font-medium text-gray-500 dark:text-gray-300"
                                        passive
                                    >
                                        Reminders
                                    </Switch.Label>
                                    <dd className="mt-1 flex text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                                        <span className="flex-grow"></span>
                                        <span className="ml-4 flex flex-shrink-0 items-start space-x-4">
                                            <Switch
                                                checked={remindersEnabled}
                                                onChange={setRemindersEnabled}
                                                class={classNames(
                                                    remindersEnabled ? 'bg-cues-blue' : 'bg-gray-200',
                                                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:ml-auto'
                                                )}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={classNames(
                                                        remindersEnabled ? 'translate-x-5' : 'translate-x-0',
                                                        'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                                    )}
                                                />
                                            </Switch>
                                        </span>
                                    </dd>
                                </Switch.Group>
                                <div className="pb-5 text-xs text-gray-900 dark:text-gray-400">
                                    You have turned on reminders for events, submissions & tasks.
                                </div>
                            </div>
                            <div className="flex flex-col w-full">
                                <Switch.Group as="div" class="pt-4 pb-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:pt-5">
                                    <Switch.Label
                                        as="dt"
                                        class="text-md font-medium text-gray-500 dark:text-gray-300"
                                        passive
                                    >
                                        Smart Reports
                                    </Switch.Label>
                                    <dd className="mt-1 flex text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                        <span className="flex-grow"></span>
                                        <span className="ml-4 flex flex-shrink-0 items-start space-x-4">
                                            <Switch
                                                checked={notificationsEnabled}
                                                onChange={setNotificationsEnabled}
                                                class={classNames(
                                                    notificationsEnabled ? 'bg-cues-blue' : 'bg-gray-200',
                                                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:ml-auto'
                                                )}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={classNames(
                                                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0',
                                                        'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                                    )}
                                                />
                                            </Switch>
                                        </span>
                                    </dd>
                                </Switch.Group>
                                <div className="pb-5 text-xs text-gray-900 dark:text-gray-400">
                                    Cues will send you a summary of course activity, progress and performance review
                                    every week.
                                </div>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        );
    };

    const renderCoursesTab = () => {
        return (
            <div className="lg:max-w-3xl">
                {/* Description list with inline editing */}
                <div className="divide-y divide-cues-divide dark:divide-cues-divide-dark">
                    <div className="space-y-1">
                        <h2 className="text-xl font-medium leading-6 text-gray-900 dark:text-white mb-2">
                            Active Courses
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400">
                            Courses you are currently enrolled in.
                        </p>
                    </div>
                    <div className="mt-6">
                        <ul className="list-none divide-y divide-cues-divide dark:divide-cues-divide-dark dark:divide-gray-700">
                            {yourCourses.map((course: any, courseIndx: number) => (
                                <li key={course.channelId}>
                                    <button className="w-full block hover:bg-gray-50">
                                        <div className="px-4 py-4 sm:px-6">
                                            {/* Top */}
                                            <div className="flex items-center justify-between">
                                                <p className="truncate text-lg font-medium text-black dark:text-white">
                                                    {course.channelName}
                                                </p>
                                                <div className="ml-2 flex flex-shrink-0">
                                                    <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                        {course.term}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Bottom */}
                                            <div className="mt-2 sm:flex sm:justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-xs text-gray-500 dark:text-gray-300">
                                                        {/*  */}
                                                        <img
                                                            className="w-6 h-6 rounded-full mr-2"
                                                            src={course.createdByImg}
                                                            alt="Course owner"
                                                        />

                                                        {course.createdByName}
                                                    </p>
                                                    <p className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-300 sm:mt-0 sm:ml-6">
                                                        <CalendarIcon
                                                            className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                                                            aria-hidden="true"
                                                        />
                                                        Enrolled {course.enrolledOn}
                                                    </p>
                                                </div>
                                                {/* <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300 sm:mt-0">
                                                    <CalendarIcon
                                                        className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                    <p>
                                                        Closing on{' '}
                                                        <time dateTime={position.closeDate}>
                                                            {position.closeDateFull}
                                                        </time>
                                                    </p>
                                                </div> */}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    const renderMainTabContent = () => {
        switch (activeSettingsTab) {
            case 'Account':
                return renderAccountTab();
            case 'Courses':
                return renderCoursesTab();
            default:
                return null;
        }
    };

    return (
        <div className="w-full">
            <div className="px-4 sm:px-6 lg:mx-auto lg:px-8 py-8">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    Settings
                </h1>
                <div className="hidden sm:block mb-4 py-6">
                    <div className="w-full flex items-center justify-between border-b border-gray-200 dark:border-cues-border-dark lg:mx-auto">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {tabs.map((option) => (
                                <button
                                    key={option}
                                    className={classNames(
                                        activeSettingsTab === option
                                            ? 'border-black text-black dark:border-white dark:text-white'
                                            : 'border-transparent text-gray-500 dark:text-gray-300 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-100',
                                        'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-md'
                                    )}
                                    aria-current={activeSettingsTab === option ? 'page' : undefined}
                                    onClick={() => switchSettingsActiveTab(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </nav>
                        {activeSettingsTab === 'Courses' ? (
                            <div className="flex items-center mb-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                                    onClick={() => showNewCourse()}
                                >
                                    <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
                                    New
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="w-full">{renderMainTabContent()}</div>
            </div>
        </div>
    );
};

export default AccountSettings;
