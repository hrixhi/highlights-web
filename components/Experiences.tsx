// REACT
import { ClockIcon, MapPinIcon, PaintBrushIcon, VideoCameraIcon } from '@heroicons/react/20/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback, useRef } from 'react';

const Experiences: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const futureExperiences = [
        {
            img: 'https://images.unsplash.com/photo-1618604440689-d5465097c6a0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            title: 'Field Trip',
            description:
                'Visit to Smithsonian musuem to dive deep into the history of our planet. Let us imagine a world where dinosaurs still rule the planet.',
            badge: '2 days',
            date: '18 Sep',
            type: 'in-person',
            locationIcon: MapPinIcon,
            location: 'Smithsonian Museum',
            topics: ['Natural History'],
        },
        {
            img: 'https://archive.caller.com/Services/image.ashx?domain=www.caller.com&file=C0012867943--399212.JPG&resize=660*440',
            title: 'History Halloween',
            description:
                'For celebration of Halloween everyone dresses up as a famous American historical figure from your home.',
            badge: '10 days',
            date: '26 Sep',
            type: 'online',
            locationIcon: VideoCameraIcon,
            location: 'Zoom Meeting',
            topics: ['American History'],
        },
    ];

    const ongoingExperiences = [
        {
            img: 'https://images.unsplash.com/photo-1530303263041-b5ca33678f04?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            title: 'Groupwork',
            description: 'Let us take notes for our upcoming exam on a collective whiteboard.',
            badge: 'Ends 11:59pm',
            date: 'Today',
            type: 'online',
            locationIcon: PaintBrushIcon,
            location: 'Cues Whiteboard',
            topics: ['Revision'],
        },
    ];

    const pastExperiences = [
        {
            img: 'https://images.unsplash.com/photo-1600520611035-84157ad4084d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3262&q=80',
            title: 'Documentary Session',
            description: 'Let us watch a documentary on Ancient Egypt one of the first civilizations on the planet.',
            badge: 'Submit Reflection',
            date: '1 Sep',
            type: 'in-person',
            locationIcon: MapPinIcon,
            location: 'Class',
            topics: ['Civilization', 'Ancient Egypt'],
        },
        {
            img: 'https://images.unsplash.com/photo-1618604440689-d5465097c6a0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            title: 'Group Activity',
            description: 'In teams we will be creating Slideshows on different themes and events of the Civil War.',
            badge: '',
            date: '24 Aug',
            status: 'past',
            locationIcon: VideoCameraIcon,
            type: 'physical',
            location: 'Zoom Meeting',
            topics: ['Civil War'],
        },
    ];

    return (
        <div className="w-full flex flex-col">
            <div className="px-4 sm:px-6 lg:mx-auto lg:px-8 py-8">
                <h1 className="ml-3 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    Ongoing
                </h1>
                {/* Section 1 Upcoming Experiences */}
                <div className="mt-4 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
                    {ongoingExperiences.map((experience: any) => {
                        return (
                            <div className=" overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 shadow flex flex-col">
                                <div className="max-h-32 relative">
                                    <img className="object-cover w-full h-full" src={experience.img} alt="" />
                                    {experience.badge && (
                                        <span className="absolute shadow top-3 right-3 inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-800">
                                            {experience.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="h-40 p-5 bg-white dark:bg-gray-800">
                                    <div className="flex flex-col">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h5 className="text-md font-bold tracking-tight text-gray-900 dark:text-white">
                                                {experience.title}
                                            </h5>
                                            <p className=" font-normal text-sm text-gray-700 dark:text-gray-400">
                                                {experience.date}
                                            </p>
                                        </div>
                                        <p className="mb-4 font-normal text-sm text-gray-700 dark:text-gray-400 line-clamp-2">
                                            {experience.description}
                                        </p>
                                        <div className="flex flex-wrap mt-6 mb-2">
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 mr-2 mb-2">
                                                {experience.type === 'in-person' ? 'In Person' : 'Online'}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 mr-2 mb-2">
                                                <experience.locationIcon className="w-3 h-3 mx-1" />
                                                {experience.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Section 2 Ongoing Experiences */}
                <h1 className="mt-12 ml-3 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    Upcoming
                </h1>

                <div className="mt-4 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
                    {futureExperiences.map((experience: any) => {
                        return (
                            <div className=" overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 shadow flex flex-col">
                                <div className="max-h-32 relative">
                                    <img className="object-cover w-full h-full" src={experience.img} alt="" />
                                    {experience.badge && (
                                        <span className="absolute shadow top-3 right-3 inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-800">
                                            {experience.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="h-40 p-5 bg-white dark:bg-gray-800">
                                    <div className="flex flex-col">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h5 className="text-md font-bold tracking-tight text-gray-900 dark:text-white">
                                                {experience.title}
                                            </h5>
                                            <p className=" font-normal text-sm text-gray-700 dark:text-gray-400">
                                                {experience.date}
                                            </p>
                                        </div>
                                        <p className="mb-4 font-normal text-sm text-gray-700 dark:text-gray-400 line-clamp-2">
                                            {experience.description}
                                        </p>
                                        <div className="flex flex-wrap mt-6 mb-2">
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 mr-2 mb-2">
                                                {experience.type === 'in-person' ? 'In Person' : 'Online'}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 mr-2 mb-2">
                                                <experience.locationIcon className="w-3 h-3 mx-1" />
                                                {experience.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Section 3 Past Experiences */}

                <h1 className="mt-12 ml-3 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    Past
                </h1>

                <div className="mt-4 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
                    {pastExperiences.map((experience: any) => {
                        return (
                            <div className=" overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 shadow flex flex-col">
                                <div className="max-h-32 relative">
                                    <img className="object-cover w-full h-full" src={experience.img} alt="" />
                                    {experience.badge && (
                                        <span className="absolute shadow top-3 right-3 inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-800">
                                            {experience.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="h-40 p-5 bg-white dark:bg-gray-800">
                                    <div className="flex flex-col">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h5 className="text-md font-bold tracking-tight text-gray-900 dark:text-white">
                                                {experience.title}
                                            </h5>
                                            <p className=" font-normal text-sm text-gray-700 dark:text-gray-400">
                                                {experience.date}
                                            </p>
                                        </div>
                                        <p className="mb-4 font-normal text-sm text-gray-700 dark:text-gray-400 line-clamp-2">
                                            {experience.description}
                                        </p>
                                        <div className="flex flex-wrap mt-6 mb-2">
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 mr-2 mb-2">
                                                {experience.type === 'in-person' ? 'In Person' : 'Online'}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 mr-2 mb-2">
                                                <experience.locationIcon className="w-3 h-3 mx-1" />
                                                {experience.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Experiences;
