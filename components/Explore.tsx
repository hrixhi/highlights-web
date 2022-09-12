import { ArrowLongRightIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

const Explore: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const instructorTopics = [
        {
            title: 'Principles of Design',
            img: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
        },
        {
            title: 'Color Theory',
            img: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1335&q=80',
        },
        {
            title: 'Water Colors',
            img: 'https://images.unsplash.com/photo-1618275340450-a684fa3d7743?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80',
        },
        {
            title: 'Elements of Art',
            img: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2144&q=80',
        },
    ];

    return (
        <div className="w-full px-4 sm:px-6 lg:mx-auto lg:px-8 py-6">
            <div className="hidden sm:block mb-4">
                <div className="w-full flex items-center justify-between border-b border-gray-200 dark:border-cues-border-dark py-3">
                    <h3 className="ml-3 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                        Curated by your Instructor
                    </h3>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <a
                                href="#"
                                className="inline-flex items-center p-2 text-xs font-medium uppercase rounded-lg text-gray-700 sm:text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                            >
                                View All
                                <svg
                                    className="ml-1 w-4 h-4 sm:w-5 sm:h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 5l7 7-7 7"
                                    ></path>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-4">
                {instructorTopics.map((topic: any) => {
                    return (
                        <div className="max-w-sm bg-white overflow-hidden rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                            <div className="p-8 h-48">
                                <a href="#">
                                    <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        {topic.title}
                                    </h5>
                                </a>

                                <div className="flex-shrink-0">
                                    <a
                                        href="#"
                                        className="inline-flex items-center p-2 text-xs font-medium uppercase rounded-lg text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                    >
                                        Read More
                                        <ArrowLongRightIcon className="ml-1 w-4 h-4 sm:w-5 sm:h-5" />
                                    </a>
                                </div>
                            </div>
                            <div className="max-h-48">
                                <img className="rounded-b-lg" src={topic.img} alt="" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Explore;
