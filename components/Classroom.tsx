// REACT
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon, MapIcon, PlayIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigationContext } from '../contexts/NavigationContext';
import Coursework from './Coursework';
import Experiences from './Experiences';

const Classroom: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { viewCourse, switchClassroomActiveTab } = useNavigationContext();

    // Navigation

    const menu = [
        {
            icon: PlayIcon,
            id: 'playlists',
            iconColor: 'text-green-500',
            iconBackground: 'bg-green-200',
            title: 'Playlists',
            description: '',
        },
        {
            icon: BookOpenIcon,
            id: 'coursework',
            iconColor: 'text-pink-500',
            iconBackground: 'bg-pink-200',
            title: 'Coursework',
            description: '',
        },
        {
            icon: UserGroupIcon,
            id: 'experiences',
            iconColor: 'text-indigo-500',
            iconBackground: 'bg-indigo-200',
            title: 'Activities',
            description: '',
        },
        {
            icon: MapIcon,
            id: 'explore',
            iconColor: 'text-yellow-500',
            iconBackground: 'bg-yellow-200',
            title: 'Explore',
            description: '',
        },
    ];

    if (viewCourse.activeClassroomTab) {
        switch (viewCourse.activeClassroomTab) {
            case 'playlist':
                return null;
            case 'coursework':
                return <Coursework />;
            case 'experiences':
                return <Experiences />;
            case 'explore':
                return null;
            default:
                return null;
        }
    }

    return (
        <div className="w-full bg-white dark:bg-cues-dark-3">
            <div className="px-4 sm:px-6 lg:mx-auto lg:px-8 py-8">
                <div className="mt-4 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 ">
                    {menu.map((tab: any, tabIndx: number) => {
                        return (
                            <button
                                key={tabIndx}
                                className="group flex flex-col border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 hover:bg-gray-100 dark:hover:bg-cues-dark-1 px-6 py-5 shadow-sm rounded-md"
                                onClick={() => {
                                    // openCourse(course._id);
                                    switchClassroomActiveTab(tab.id);
                                }}
                            >
                                <div className="flex flex-1 w-full items-center">
                                    <div className={`${tab.iconBackground} ${tab.iconColor} rounded-md p-4`}>
                                        <tab.icon className="w-10 h-10" />
                                    </div>
                                    <h1 className="ml-4 text-2xl font-medium text-gray-900 dark:text-white">
                                        {tab.title}
                                    </h1>
                                    <ArrowRightIcon className="hidden group-hover:block text-gray-900 dark:text-white w-6 h-6 ml-auto" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Classroom;
