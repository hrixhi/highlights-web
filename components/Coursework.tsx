// REACT
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCourseContext } from '../contexts/CourseContext';
import { useAppContext } from '../contexts/AppContext';
import { htmlStringParser } from '../helpers/HTMLParser';

import { PlusIcon, ClockIcon, CheckIcon } from '@heroicons/react/20/solid';

const Coursework: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { courseData, coursework } = useCourseContext();
    const { user } = useAppContext();

    const isOwner = useState(user._id === courseData.channelCreatedBy);

    const { allCues, filteredAndSortedCues, categories } = coursework;

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

    const renderCompletionTag = () => {
        return (
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800 mr-4">
                <CheckIcon className="w-3 h-3 mr-1" />
                Done
            </span>
        );
    };

    const renderPendingTag = () => {
        return (
            <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-800 mr-4">
                <ClockIcon className="w-3 h-3 mr-1" />2 days left
            </span>
        );
    };

    if (allCues.length === 0) {
        return (
            <div className="flex flex-1 flex-col w-full items-center py-12">
                <div className="text-center">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No content shared</h3>
                    {isOwner && (
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
                            Get started by creating a new content.
                        </p>
                    )}
                    {isOwner && (
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
                    )}
                </div>
            </div>
        );
    }

    if (allCues.length !== 0 && filteredAndSortedCues.length === 0) {
        return (
            <div className="flex flex-1 flex-col w-full items-center py-12">
                <div className="text-center">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No results found</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col pt-2 overflow-x-auto">
            <div className="overflow-x-auto ">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden shadow px-4 sm:px-6 lg:mx-auto lg:px-8">
                        <div className="flex items-start justify-start mb-6 space-x-4">
                            {categories.map((category: any) => {
                                const categoryCues = filteredAndSortedCues.filter((cue: any) => {
                                    return cue.customCategory === category;
                                });

                                return (
                                    <div className="min-w-cues-carousel">
                                        <div className="py-4 text-base font-semibold text-gray-900 dark:text-gray-300">
                                            {category}
                                        </div>
                                        <div className="mb-4 space-y-4 min-w-cues-carousel">
                                            {categoryCues.map((cue: any, ind: number) => {
                                                const { title } = htmlStringParser(
                                                    cue.channelId && cue.channelId !== '' ? cue.original : cue.cue
                                                );
                                                return (
                                                    <div className="flex flex-col max-w-md p-5 transform rounded-lg shadow border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 hover:bg-gray-100 dark:hover:bg-cues-dark-1">
                                                        <div className="flex items-center justify-between pb-4">
                                                            <div className="text-base font-semibold text-gray-900 dark:text-white">
                                                                {title}
                                                            </div>
                                                        </div>
                                                        <hr className="mt-2 h-px bg-gray-200 border-0 dark:bg-gray-700 w-full" />
                                                        <div className="mt-4 flex items-center">
                                                            {renderPriorityTag(cue.color)}
                                                            {cue.submission
                                                                ? ind % 2 === 0
                                                                    ? renderCompletionTag()
                                                                    : renderPendingTag()
                                                                : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Coursework;
